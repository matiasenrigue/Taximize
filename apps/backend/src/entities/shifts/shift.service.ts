import { Shift } from './shift.model';
import { ShiftSignal } from './shift-signal.model';
import { ShiftPause } from './shift-pause.model';
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
}

export class ShiftService {
  static async isValidSignal(driverId: string, newSignal: string): Promise<boolean> {
    // Check if driver has active ride - if so, no signals can be received
    const hasActiveRide = await this.hasActiveRide(driverId);
    if (hasActiveRide) {
      return false;
    }

    // Get last signal for the driver
    const lastSignal = await this.getLastSignal(driverId);
    
    // Use utility to validate transition
    return SignalValidation.isValidTransition(lastSignal, newSignal as Signal);
  }

  static async handleSignal(driverId: string, timestamp: number, signal: string): Promise<any> {
    // Validate the signal
    const isValid = await this.isValidSignal(driverId, signal);
    if (!isValid) {
      throw new Error(`Invalid signal transition: ${signal}`);
    }

    let result = null;

    // Handle different signal types
    if (signal === 'start') {
      await this.handleStartSignal(driverId, timestamp);
    } else if (signal === 'stop') {
      result = await this.handleStopSignal(driverId, timestamp);
    } else if (signal === 'continue') {
      await this.handleContinueSignal(driverId, timestamp);
    }

    // Insert signal record (for all signal types except stop - stop signals are handled in saveShift)
    if (signal !== 'stop') {
      const activeShift = await this.getActiveShift(driverId);
      if (activeShift) {
        await ShiftSignal.create({
          timestamp: new Date(timestamp),
          shift_id: activeShift.id,
          signal: signal as Signal
        });
      }
    }

    return result;
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
    const pauseInfo = await this.getPauseInfo(driverId);

    return {
      isOnShift: true,
      shiftStart: shiftStartSignal ? shiftStartSignal.timestamp.getTime() : null,
      isPaused: lastSignal.signal === 'pause',
      pauseStart: lastSignal.signal === 'pause' ? lastSignal.timestamp.getTime() : null,
      lastPauseEnd: pauseInfo.lastContinue ? pauseInfo.lastContinue.getTime() : null
    };
  }

  static async driverIsAvailable(driverId: string): Promise<boolean> {
    const lastSignal = await this.getLastSignal(driverId);
    return lastSignal === 'start' || lastSignal === 'continue';
  }

  static async saveShift(driverId: string): Promise<any> {
    const activeShift = await this.getActiveShift(driverId);
    if (!activeShift) {
      throw new Error('No active shift to save');
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

  static async saveShiftPause(driverId: string): Promise<void> {
    const activeShift = await this.getActiveShift(driverId);
    if (!activeShift) {
      throw new Error('No active shift found');
    }

    // Find the last 'pause' signal and current 'continue' signal
    const pauseSignal = await ShiftSignal.findOne({
      where: { 
        shift_id: activeShift.id,
        signal: 'pause'
      },
      order: [['timestamp', 'DESC']]
    });

    if (!pauseSignal) {
      throw new Error('No pause signal found');
    }

    const continueTime = new Date();
    const durationMs = continueTime.getTime() - pauseSignal.timestamp.getTime();

    // Save the pause period
    await ShiftPause.create({
      shift_id: activeShift.id,
      pause_start: pauseSignal.timestamp,
      pause_end: continueTime,
      duration_ms: durationMs
    });
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
        await ShiftSignal.destroy({
          where: { shift_id: shift.id }
        });
        
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
    const pauses = await ShiftPause.findAll({
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

  // Helper methods
  private static async hasActiveRide(driverId: string): Promise<boolean> {
    return await RideService.hasActiveRide(driverId);
  }

  private static async getLastSignal(driverId: string): Promise<Signal | null> {
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

  private static async getActiveShift(driverId: string): Promise<Shift | null> {
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

  private static async getPauseInfo(driverId: string): Promise<{ lastContinue: Date | null }> {
    // Get active shift for driver first
    const activeShift = await this.getActiveShift(driverId);
    if (!activeShift) {
      return { lastContinue: null };
    }

    const lastContinue = await ShiftSignal.findOne({
      where: { 
        shift_id: activeShift.id,
        signal: 'continue' 
      },
      order: [['timestamp', 'DESC']]
    });

    return {
      lastContinue: lastContinue ? lastContinue.timestamp : null
    };
  }

  private static async handleStartSignal(driverId: string, timestamp: number): Promise<void> {
    // Check for existing active shift
    const existingShift = await Shift.findOne({
      where: { 
        driver_id: driverId,
        shift_end: null
      }
    });

    if (existingShift) {
      throw new Error('Driver already has an active shift');
    }

    // Create new shift
    await Shift.create({
      driver_id: driverId,
      shift_start: new Date(timestamp),
      shift_end: null,
      total_duration_ms: null,
      work_time_ms: null,
      break_time_ms: null,
      num_breaks: null,
      avg_break_ms: null
    });
  }

  private static async handleStopSignal(driverId: string, timestamp: number): Promise<any> {
    // Save the shift with all computed statistics
    return await this.saveShift(driverId);
  }

  private static async handleContinueSignal(driverId: string, timestamp: number): Promise<void> {
    // Save the pause period
    await this.saveShiftPause(driverId);
  }

  private static async saveShiftByShiftId(shiftId: string): Promise<void> {
    const shift = await Shift.findByPk(shiftId);
    if (!shift) return;

    const shiftEnd = new Date();
    const totalDurationMs = shiftEnd.getTime() - shift.shift_start.getTime();

    // Get pause data for this shift
    const pauses = await ShiftPause.findAll({
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

    await this.saveShiftByShiftId(shiftId);
    return shift;
  }

  private static async recalculateShiftStatistics(shiftId: string): Promise<void> {
    const shift = await Shift.findByPk(shiftId);
    if (!shift || !shift.shift_end) return;

    const totalDurationMs = shift.shift_end.getTime() - shift.shift_start.getTime();

    // Get pause data for this shift
    const pauses = await ShiftPause.findAll({
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
} 