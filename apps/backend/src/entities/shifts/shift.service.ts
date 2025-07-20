import { Shift } from './shift.model';
import { ShiftSignal } from './shiftSignal.model';
import { Pause } from './pause.model';
import { PauseService } from './pause.service';
import { Ride } from '../rides/ride.model';
import { RideService } from '../rides/ride.service';
import { SignalValidation, Signal } from './utils/signalValidation';
import { ShiftCalculationUtils } from './utils/ShiftCalculationUtils';
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

    /**
     * Helper method to get and validate shift ownership
     */
    private static async getShiftWithAuth(shiftId: string, driverId: string): Promise<Shift> {
        const shift = await Shift.findByPk(shiftId);
        if (!shift) {
            throw new Error('Shift not found');
        }

        if (shift.driver_id !== driverId) {
            throw new Error('Not authorized to access this shift');
        }

        return shift;
    }

    /**
     * Helper method to check if shift can be modified
     */
    private static validateShiftNotActive(shift: Shift, action: string): void {
        if (!shift.shift_end) {
            throw new Error(`Cannot ${action} active shift`);
        }
    }

    /**
     * Helper method to get pauses and rides for a shift
     */
    private static async getShiftRelatedData(shiftId: string): Promise<{ pauses: Pause[], rides: Ride[] }> {
        const [pauses, rides] = await Promise.all([
            Pause.findAll({ where: { shift_id: shiftId } }),
            Ride.findAll({ where: { shift_id: shiftId } })
        ]);
        return { pauses, rides };
    }


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

        return await this.saveShiftByShiftId(activeShift.id);
    }


    static async deleteShiftSignals(driverId: string, shiftId?: string): Promise<void> {
        // If shiftId is provided, use it directly. Otherwise, try to find active shift
        const targetShiftId = shiftId || (await ShiftService.getActiveShift(driverId))?.id;
        if (targetShiftId) {
            await ShiftSignal.destroy({
                where: { shift_id: targetShiftId }
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

    private static async saveShiftByShiftId(shiftId: string): Promise<Shift> {
        const shift = await Shift.findByPk(shiftId);
        if (!shift) {
            throw new Error('Shift not found');
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

        const shiftEnd = new Date();
        shift.shift_end = shiftEnd;
        
        // Save the shift_end immediately
        await shift.save();

        // Get pauses and rides for calculations
        const { pauses, rides } = await this.getShiftRelatedData(shiftId);

        // Use the new utils to calculate and update shift data
        await ShiftCalculationUtils.updateShiftCalculations(shift, 'full', pauses, rides);

        // Clean up shift signals for this shift
        await ShiftSignal.destroy({
            where: { shift_id: shiftId }
        });

        return shift;
    }

    static async editShift(shiftId: string, driverId: string, updateData: any): Promise<Shift> {
        // Get shift with authorization check
        const shift = await this.getShiftWithAuth(shiftId, driverId);
        
        // Check if shift is active
        this.validateShiftNotActive(shift, 'edit');

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
        // Get shift with authorization check
        const shift = await this.getShiftWithAuth(shiftId, driverId);
        
        // Check if shift is active
        this.validateShiftNotActive(shift, 'delete');

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
        return await this.getShiftWithAuth(shiftId, driverId);
    }

    static async endShiftById(shiftId: string, driverId: string): Promise<any> {
        const shift = await this.getShiftWithAuth(shiftId, driverId);

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
        const totalEarnings = shift.total_earnings_cents ? shift.total_earnings_cents / 100 : 0;
        
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

        // Get pauses and rides for calculations
        const { pauses, rides } = await this.getShiftRelatedData(shiftId);

        await ShiftCalculationUtils.updateShiftCalculations(shift, 'full', pauses, rides);
    }

    static async calculateShiftEarnings(shiftId: string): Promise<number> {
        const shift = await Shift.findByPk(shiftId);
        if (!shift) {
            throw new Error('Shift not found');
        }
        
        // Return the stored value, converting cents to currency units
        return shift.total_earnings_cents ? shift.total_earnings_cents / 100 : 0;
    }
} 