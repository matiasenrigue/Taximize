import { Shift } from './shift.model';
import { ShiftSignal } from './shift-signal.model';
import { ShiftPause } from './shift-pause.model';
import { Ride } from '../rides/ride.model';
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

  static async handleSignal(driverId: string, timestamp: number, signal: string): Promise<void> {
    // Validate the signal
    const isValid = await this.isValidSignal(driverId, signal);
    if (!isValid) {
      throw new Error(`Invalid signal transition: ${signal}`);
    }

    // Handle different signal types
    if (signal === 'start') {
      await this.handleStartSignal(driverId, timestamp);
    } else if (signal === 'stop') {
      await this.handleStopSignal(driverId, timestamp);
    } else if (signal === 'continue') {
      await this.handleContinueSignal(driverId, timestamp);
    }

    // Insert signal record (for all signal types)
    const activeShift = await this.getActiveShift(driverId);
    if (activeShift) {
      await ShiftSignal.create({
        timestamp: new Date(timestamp),
        shift_id: activeShift.id,
        signal: signal as Signal
      });
    }
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

    // Find drivers with stale shifts (last signal not 'stop' and older than 2 days)
    const staleSignals = await ShiftSignal.findAll({
      where: {
        timestamp: { [Op.lt]: twoDaysAgo }
      },
      order: [['timestamp', 'DESC']]
    });

    for (const signal of staleSignals) {
      // Get the shift directly using shift_id since associations might not be set up
      const shift = await Shift.findByPk(signal.shift_id);
      if (!shift) continue;

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

          // Save shift
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
    // Get active shift for driver first
    const activeShift = await Shift.findOne({
      where: { 
        driver_id: driverId,
        shift_end: null
      }
    });

    if (!activeShift) return false;

    const activeRide = await Ride.findOne({
      where: { 
        shift_id: activeShift.id,
        end_time: null 
      }
    });
    
    return !!activeRide;
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

  private static async handleStopSignal(driverId: string, timestamp: number): Promise<void> {
    // Save the shift with all computed statistics
    await this.saveShift(driverId);
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
} 