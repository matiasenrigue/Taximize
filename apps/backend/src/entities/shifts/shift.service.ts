import { Shift } from './shift.model';
import { ShiftSignal } from './shiftSignal.model';
import { Pause } from '../pauses/pause.model';
import { PauseService } from '../pauses/pause.service';
import { Ride } from '../rides/ride.model';
import { RideService } from '../rides/ride.service';
import { SignalValidation, Signal } from './utils/signalValidation';
import { ShiftCalculator } from './utils/shiftCalculator';
import { Op } from 'sequelize';

interface ShiftStatus {
    isOnShift: boolean;
    shiftStart: number | null;
    isPaused: boolean;
    pauseStart: number | null;
    lastPauseEnd: number | null;
    duration: number | null;
    pauseDuration: number | null;
}

export class ShiftService {

    static async getCurrentShiftStatus(driverId: string): Promise<ShiftStatus | null> {
        const lastSignal = await this.getLastSignalWithDetails(driverId);
        
        if (!lastSignal) {
            return null;
        }

        const isOnShift = ['start', 'continue', 'pause'].includes(lastSignal.signal);
        if (!isOnShift) {
            return null;
        }

        // Find shift start time (most recent 'start' after last 'stop')
        const shiftStartSignal = await this.getShiftStartSignal(driverId);
        
        // Find pause times
        const pauseInfo = await PauseService.getPauseInfo(driverId);
        
        // Get active shift to retrieve planned durations
        const activeShift = await this.getActiveShift(driverId);
        
        // Get planned pause duration from the current pause signal if paused
        let plannedPauseDuration = null;
        if (lastSignal.signal === 'pause') {
            plannedPauseDuration = lastSignal.planned_duration_ms || null;
        }

        return {
            isOnShift: true,
            shiftStart: shiftStartSignal ? shiftStartSignal.timestamp.getTime() : null,
            isPaused: lastSignal.signal === 'pause',
            pauseStart: lastSignal.signal === 'pause' ? lastSignal.timestamp.getTime() : null,
            lastPauseEnd: pauseInfo.lastPauseEnd ? pauseInfo.lastPauseEnd.getTime() : null,
            duration: activeShift ? activeShift.planned_duration_ms : null,
            pauseDuration: plannedPauseDuration
        };
    }


    static async driverIsAvailable(driverId: string): Promise<boolean> {
        // First check if driver has an active shift
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) {
            return false;
        }

        // Then check the last signal - if it's 'pause', driver is not available
        const lastSignal = await this.getLastSignal(driverId);
        
        // If no signal exists (shift created directly), consider driver available
        if (!lastSignal) {
            return true;
        }
        
        // Driver is available if last signal is 'start' or 'continue'
        return lastSignal === 'start' || lastSignal === 'continue';
    }


    static async createShift(driverId: string, timestamp: number, duration?: number): Promise<void> {
        
        // To create a new shift, first check if the driver has an active shift
        const activeShift = await this.getActiveShift(driverId);
        if (activeShift) {
            throw new Error('Driver already has an active shift');
        }
        
        // Shift get created with default values
        await Shift.create({
            driver_id: driverId,
            shift_start: new Date(timestamp),
            shift_end: null,
            total_duration_ms: null,
            work_time_ms: null,
            break_time_ms: null,
            num_breaks: null,
            avg_break_ms: null,
            planned_duration_ms: duration || null
        });
    }


    static async saveShift(driverId: string): Promise<any> {
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) {
            throw new Error('No active shift to save');
        }

        // Check if there are any active rides for this shift
        const activeRide = await Ride.findOne({
            where: { 
                shift_id: activeShift.id,
                end_time: null 
            }
        });

        if (activeRide) {
            throw new Error('Cannot end shift while ride is in progress. Please end the active ride first.');
        }

        const shiftEnd = new Date();
        const totalDurationMs = shiftEnd.getTime() - activeShift.shift_start.getTime();

        // Compute break statistics
        const breakStats = await this.computeBreaks(activeShift.shift_start, shiftEnd, driverId);
        const workTimeMs = ShiftCalculator.computeWorkTime(totalDurationMs, breakStats.totalBreakTimeMs);

        // Update shift with computed values
        await activeShift.update({
            shift_end: shiftEnd,
            total_duration_ms: totalDurationMs,
            work_time_ms: workTimeMs,
            break_time_ms: breakStats.totalBreakTimeMs,
            num_breaks: breakStats.numberOfBreaks,
            avg_break_ms: breakStats.averageBreakDurationMs
        });

        // Clean up shift signals for this shift
        await ShiftSignal.destroy({
            where: { shift_id: activeShift.id }
        });

        return activeShift;
    }


    static async deleteShiftSignals(driverId: string): Promise<void> {
        const activeShift = await ShiftService.getActiveShift(driverId);
        if (activeShift) {
            await ShiftSignal.destroy({
                where: { shift_id: activeShift.id }
            });
        }
    }

    static async manageExpiredShifts(): Promise<void> {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

        // Find each driver with no 'stop' signal and last signal > 2 days ago
        // First get all active shifts (shift_end is null)
        const activeShifts = await Shift.findAll({
            where: { shift_end: null }
        });

        for (const shift of activeShifts) {
            // Get the last signal for this shift
            const lastSignal = await ShiftSignal.findOne({
                where: { shift_id: shift.id },
                order: [['timestamp', 'DESC']]
            });

            // Skip if no signals or last signal is 'stop' or within 2 days
            if (!lastSignal || lastSignal.signal === 'stop' || lastSignal.timestamp.getTime() > twoDaysAgo.getTime()) {
                continue;
            }

            // Check if they have rides during this period
            const ridesCount = await Ride.count({
                where: { shift_id: shift.id }
            });

            if (ridesCount > 0) {
                // Generate synthetic stop at end of last ride
                const lastRide = await Ride.findOne({
                    where: { shift_id: shift.id },
                    order: [['start_time', 'DESC']]
                });

                if (lastRide) {
                    const syntheticStopTime = lastRide.end_time || lastRide.start_time;
                    
                    // Create synthetic stop signal
                    await ShiftSignal.create({
                        timestamp: syntheticStopTime,
                        shift_id: shift.id,
                        signal: 'stop'
                    });

                    // Save shift using the existing method
                    await this.saveShiftByShiftId(shift.id);
                }
            } else {
                // Delete stale shift signals (no rides recorded)
                this.deleteShiftSignals(shift.driver_id);
                
                await Shift.destroy({
                    where: { id: shift.id }
                });
            }

            console.log(`Managed expired shift for driver: ${shift.driver_id}`);
        }
    }

    static async computeBreaks(shiftStart: Date, shiftEnd: Date, driverId: string): Promise<any> {
        // Get active shift for driver
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) {
            return {
                totalBreakTimeMs: 0,
                numberOfBreaks: 0,
                averageBreakDurationMs: 0
            };
        }

        // Get all pause periods for this shift
        const pauses = await Pause.findAll({
            where: { 
                shift_id: activeShift.id,
                pause_start: { [Op.gte]: shiftStart },
                pause_end: { [Op.lte]: shiftEnd }
            }
        });

        const pauseData = pauses.map(pause => ({
            start: pause.pause_start,
            end: pause.pause_end
        }));

        // Use the shift calculator utility
        ShiftCalculator.addPauseData(driverId, pauseData);
        return ShiftCalculator.computeBreaks(shiftStart, shiftEnd, driverId);
    }

    static async computeWorkTime(shiftStart: Date, shiftEnd: Date, driverId: string): Promise<number> {
        const totalDurationMs = shiftEnd.getTime() - shiftStart.getTime();
        const breakStats = await this.computeBreaks(shiftStart, shiftEnd, driverId);
        return ShiftCalculator.computeWorkTime(totalDurationMs, breakStats.totalBreakTimeMs);
    }


    static async getLastSignal(driverId: string): Promise<Signal | null> {
        // Get active shift for driver first
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) return null;

        const lastSignal = await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });

        return lastSignal ? lastSignal.signal : null;
    }

    private static async getLastSignalWithDetails(driverId: string): Promise<ShiftSignal | null> {
        // Get active shift for driver first
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) return null;

        return await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });
    }

    static async getActiveShift(driverId: string): Promise<Shift | null> {
        return await Shift.findOne({
            where: { 
                driver_id: driverId,
                shift_end: null
            }
        });
    }

    static async getActiveShiftForDriver(driverId: string): Promise<Shift | null> {
        return await this.getActiveShift(driverId);
    }

    private static async getShiftStartSignal(driverId: string): Promise<ShiftSignal | null> {
        // Get active shift for driver first
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) return null;

        // Find most recent 'start' signal after last 'stop' signal
        const lastStop = await ShiftSignal.findOne({
            where: { 
                shift_id: activeShift.id,
                signal: 'stop' 
            },
            order: [['timestamp', 'DESC']]
        });

        const whereClause: any = {
            shift_id: activeShift.id,
            signal: 'start'
        };

        if (lastStop) {
            whereClause.timestamp = { [Op.gt]: lastStop.timestamp };
        }

        return await ShiftSignal.findOne({
            where: whereClause,
            order: [['timestamp', 'DESC']]
        });
    }

    private static async saveShiftByShiftId(shiftId: string): Promise<void> {
        const shift = await Shift.findByPk(shiftId);
        if (!shift) return;

        const shiftEnd = new Date();
        const totalDurationMs = shiftEnd.getTime() - shift.shift_start.getTime();

        // Get pause data for this shift
        const pauses = await Pause.findAll({
            where: { shift_id: shiftId }
        });

        const totalBreakTimeMs = pauses.reduce((total, pause) => total + pause.duration_ms, 0);
        const workTimeMs = totalDurationMs - totalBreakTimeMs;

        await shift.update({
            shift_end: shiftEnd,
            total_duration_ms: totalDurationMs,
            work_time_ms: workTimeMs,
            break_time_ms: totalBreakTimeMs,
            num_breaks: pauses.length,
            avg_break_ms: pauses.length > 0 ? totalBreakTimeMs / pauses.length : 0
        });
    }

    static async editShift(shiftId: string, driverId: string, updateData: any): Promise<Shift> {
        // Find the shift
        const shift = await Shift.findByPk(shiftId);
        if (!shift) {
            throw new Error('Shift not found');
        }

        // Check authorization
        if (shift.driver_id !== driverId) {
            throw new Error('Not authorized to edit this shift');
        }

        // Check if shift is active
        if (!shift.shift_end) {
            throw new Error('Cannot edit active shift');
        }

        // Validate temporal boundaries
        if ('shift_start' in updateData && 'shift_end' in updateData) {
            const start = new Date(updateData.shift_start);
            const end = new Date(updateData.shift_end);
            
            if (start >= end) {
                throw new Error('Shift start must be before shift end');
            }

            // Check 24 hour limit
            const duration = end.getTime() - start.getTime();
            if (duration > 24 * 60 * 60 * 1000) {
                throw new Error('Shift cannot exceed 24 hours');
            }
        } else if ('shift_start' in updateData) {
            const start = new Date(updateData.shift_start);
            if (shift.shift_end && start >= shift.shift_end) {
                throw new Error('Shift start must be before shift end');
            }
            
            // Check 24 hour limit
            if (shift.shift_end) {
                const duration = shift.shift_end.getTime() - start.getTime();
                if (duration > 24 * 60 * 60 * 1000) {
                    throw new Error('Shift cannot exceed 24 hours');
                }
            }
        } else if ('shift_end' in updateData) {
            const end = new Date(updateData.shift_end);
            if (end <= shift.shift_start) {
                throw new Error('Shift start must be before shift end');
            }
            
            // Check 24 hour limit
            const duration = end.getTime() - shift.shift_start.getTime();
            if (duration > 24 * 60 * 60 * 1000) {
                throw new Error('Shift cannot exceed 24 hours');
            }
        }

        // Check consistency with rides
        const newStart = updateData.shift_start ? new Date(updateData.shift_start) : shift.shift_start;
        const newEnd = updateData.shift_end ? new Date(updateData.shift_end) : shift.shift_end;

        const rides = await Ride.findAll({
            where: { shift_id: shiftId }
        });

        for (const ride of rides) {
            if (ride.start_time < newStart || (ride.end_time && ride.end_time > newEnd!)) {
                throw new Error('Shift must encompass all rides');
            }
        }

        // Check break times are within shift
        const signals = await ShiftSignal.findAll({
            where: { 
                shift_id: shiftId,
                signal: 'pause'
            }
        });

        for (const signal of signals) {
            if (signal.timestamp < newStart || signal.timestamp > newEnd!) {
                throw new Error('Break times must be within shift boundaries');
            }
        }

        // Update the shift
        await shift.update(updateData);

        // Recalculate statistics
        await this.recalculateShiftStatistics(shiftId);

        // Reload the shift to get the updated values
        await shift.reload();

        return shift;
    }

    static async deleteShift(shiftId: string, driverId: string): Promise<void> {
        // Find the shift
        const shift = await Shift.findByPk(shiftId);
        if (!shift) {
            throw new Error('Shift not found');
        }

        // Check authorization
        if (shift.driver_id !== driverId) {
            throw new Error('Not authorized to delete this shift');
        }

        // Check if shift is active
        if (!shift.shift_end) {
            throw new Error('Cannot delete active shift');
        }

        // Check for associated rides
        const rides = await Ride.findAll({
            where: { shift_id: shiftId }
        });

        if (rides.length > 0) {
            throw new Error('Cannot delete shift with associated rides. Please delete rides first.');
        }

        // Soft delete the shift
        await shift.destroy();
    }

    static async restoreShift(shiftId: string, driverId: string): Promise<void> {
        // Find the deleted shift (paranoid: false to include soft-deleted records)
        const shift = await Shift.findByPk(shiftId, { paranoid: false });
        if (!shift) {
            throw new Error('Shift not found');
        }

        // Check authorization
        if (shift.driver_id !== driverId) {
            throw new Error('Not authorized to restore this shift');
        }

        // Check if shift is deleted (handle both snake_case and camelCase)
        const deletedAt = shift.deleted_at || (shift as any).deletedAt;
        if (!deletedAt) {
            throw new Error('Shift is not deleted');
        }

        // Restore the shift using Sequelize's restore method
        await shift.restore();
    }

    static async getShiftsByDriver(driverId: string): Promise<Shift[]> {
        return await Shift.findAll({
            where: { driver_id: driverId },
            order: [['shift_start', 'DESC']]
        });
    }

    static async getShiftById(shiftId: string, driverId: string): Promise<Shift> {
        const shift = await Shift.findByPk(shiftId);
        
        if (!shift) {
            throw new Error('Shift not found');
        }

        if (shift.driver_id !== driverId) {
            throw new Error('Not authorized to view this shift');
        }

        // Add computed fields for shift statistics
        const rides = await Ride.findAll({
            where: { shift_id: shiftId }
        });

        let totalEarnings = 0;
        let totalDistance = 0;

        for (const ride of rides) {
            if (ride.earning_cents) totalEarnings += ride.earning_cents;
            if (ride.distance_km) totalDistance += ride.distance_km;
        }

        // Return shift with computed fields
        return {
            ...shift.toJSON(),
            total_earnings_cents: totalEarnings,
            total_distance_km: totalDistance
        } as any;
    }

    static async endShiftById(shiftId: string, driverId: string): Promise<any> {
        const shift = await Shift.findByPk(shiftId);
        
        if (!shift) {
            throw new Error('Shift not found');
        }

        if (shift.driver_id !== driverId) {
            throw new Error('Not authorized to end this shift');
        }

        if (shift.shift_end) {
            throw new Error('Shift already ended');
        }

        // Check if there are any active rides for this shift
        const activeRide = await Ride.findOne({
            where: { 
                shift_id: shiftId,
                end_time: null 
            }
        });

        if (activeRide) {
            throw new Error('Cannot end shift while ride is in progress. Please end the active ride first.');
        }

        await this.saveShiftByShiftId(shiftId);
        
        // Reload shift to get updated data
        await shift.reload();
        
        // Calculate total earnings
        const totalEarnings = await this.calculateShiftEarnings(shiftId);
        
        return {
            totalDuration: shift.total_duration_ms,
            workTime: shift.work_time_ms,
            breakTime: shift.break_time_ms,
            numBreaks: shift.num_breaks,
            averageBreak: shift.avg_break_ms,
            totalEarnings: totalEarnings
        };
    }

    private static async recalculateShiftStatistics(shiftId: string): Promise<void> {
        const shift = await Shift.findByPk(shiftId);
        if (!shift || !shift.shift_end) return;

        const totalDurationMs = shift.shift_end.getTime() - shift.shift_start.getTime();

        // Get pause data for this shift
        const pauses = await Pause.findAll({
            where: { shift_id: shiftId }
        });

        const totalBreakTimeMs = pauses.reduce((total, pause) => total + pause.duration_ms, 0);
        const workTimeMs = totalDurationMs - totalBreakTimeMs;

        await shift.update({
            total_duration_ms: totalDurationMs,
            work_time_ms: workTimeMs,
            break_time_ms: totalBreakTimeMs,
            num_breaks: pauses.length,
            avg_break_ms: pauses.length > 0 ? totalBreakTimeMs / pauses.length : 0
        });
    }

    static async calculateShiftEarnings(shiftId: string): Promise<number> {
        // Get all rides for this shift that are not deleted
        const rides = await Ride.findAll({
            where: { 
                shift_id: shiftId,
                deleted_at: null
            }
        });

        // Sum up all earnings from rides (earnings are stored in cents)
        const totalEarningsCents = rides.reduce((total, ride) => {
            return total + (ride.earning_cents || 0);
        }, 0);

        // Convert cents to currency units (e.g., dollars)
        return totalEarningsCents / 100;
    }
} 