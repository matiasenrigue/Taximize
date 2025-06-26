// Placeholder file for TDD Red phase - methods will be implemented in Green phase
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { ShiftService } from './shift.service';

export class ShiftController {
  // @desc    Handle general shift signal
  // @route   POST /api/shifts/signal
  // @access  Protected
  static emitSignal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { signal, timestamp } = req.body;
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    // Validate required fields
    if (!signal) {
      res.status(400);
      throw new Error('Signal is required');
    }

    // Validate signal type
    const validSignals = ['start', 'pause', 'continue', 'stop'];
    if (!validSignals.includes(signal)) {
      res.status(400);
      throw new Error('Invalid signal type');
    }

    // Use provided timestamp or current time
    const signalTimestamp = timestamp || Date.now();

    try {
      await ShiftService.handleSignal(driverId, signalTimestamp, signal);
      
      // Get updated shift status
      const shiftStatus = await ShiftService.getCurrentShiftStatus(driverId);
      
      res.status(200).json({
        success: true,
        message: 'Signal accepted',
        data: shiftStatus
      });
    } catch (error: any) {
      if (error.message.includes('Invalid signal transition')) {
        res.status(400);
        throw new Error('Cannot receive shift signal: driver has an active ride');
      }
      res.status(400);
      throw new Error(error.message || 'Failed to process signal');
    }
  });

  // @desc    Start shift (convenience wrapper)
  // @route   POST /api/shifts/start-shift
  // @access  Protected
  static startShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { timestamp } = req.body || {};
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    // Use provided timestamp or current time
    const signalTimestamp = timestamp || Date.now();

    try {
      await ShiftService.handleSignal(driverId, signalTimestamp, 'start');
      
      res.status(200).json({
        success: true,
        message: 'Shift started successfully, Ready to Go'
      });
    } catch (error: any) {
      if (error.message.includes('Invalid signal transition')) {
        res.status(400);
        throw new Error('There is already an active Shift started');
      }
      res.status(400);
      throw new Error(error.message || 'Failed to start shift');
    }
  });

  // @desc    Pause shift (convenience wrapper)
  // @route   POST /api/shifts/pause-shift
  // @access  Protected
  static pauseShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { timestamp } = req.body || {};
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    // Use provided timestamp or current time
    const signalTimestamp = timestamp || Date.now();

    try {
      await ShiftService.handleSignal(driverId, signalTimestamp, 'pause');
      
      res.status(200).json({
        success: true,
        message: 'Shift paused successfully'
      });
    } catch (error: any) {
      if (error.message.includes('Invalid signal transition')) {
        res.status(400);
        throw new Error('No active shift to pause or shift already paused, or driver has an active ride');
      }
      res.status(400);
      throw new Error(error.message || 'Failed to pause shift');
    }
  });

  // @desc    Continue shift (convenience wrapper)
  // @route   POST /api/shifts/continue-shift
  // @access  Protected
  static continueShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { timestamp } = req.body || {};
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    // Use provided timestamp or current time
    const signalTimestamp = timestamp || Date.now();

    try {
      await ShiftService.handleSignal(driverId, signalTimestamp, 'continue');
      
      res.status(200).json({
        success: true,
        message: 'Shift continued successfully'
      });
    } catch (error: any) {
      if (error.message.includes('Invalid signal transition')) {
        res.status(400);
        throw new Error('No paused shift to continue');
      }
      res.status(400);
      throw new Error(error.message || 'Failed to continue shift');
    }
  });

  // @desc    End shift (convenience wrapper)
  // @route   POST /api/shifts/end-shift
  // @access  Protected
  static endShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { timestamp } = req.body || {};
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    // Use provided timestamp or current time
    const signalTimestamp = timestamp || Date.now();

    try {
      const savedShift = await ShiftService.handleSignal(driverId, signalTimestamp, 'stop');
      
      // Return actual shift summary from saved shift data
      res.status(200).json({
        success: true,
        message: 'Shift ended successfully',
        data: {
          totalDuration: savedShift.total_duration_ms,
          workTime: savedShift.work_time_ms,
          breakTime: savedShift.break_time_ms,
          numBreaks: savedShift.num_breaks,
          averageBreak: savedShift.avg_break_ms,
          totalEarnings: 0 // TODO: Calculate from rides when ride integration is complete
        }
      });
    } catch (error: any) {
      if (error.message.includes('Invalid signal transition')) {
        res.status(400);
        throw new Error('No active shift to end, or driver has an active ride');
      }
      res.status(400);
      throw new Error(error.message || 'Failed to end shift');
    }
  });

  // @desc    Get current shift status
  // @route   GET /api/shifts/current
  // @access  Protected
  static getCurrentShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    try {
      const shiftStatus = await ShiftService.getCurrentShiftStatus(driverId);
      
      if (!shiftStatus) {
        res.status(200).json({
          success: true,
          data: {
            isOnShift: false,
            shiftStart: null,
            isPaused: false,
            pauseStart: null,
            lastPauseEnd: null,
            isOnRide: false,
            rideStartLatitude: null,
            rideStartLongitude: null,
            rideDestinationAddress: null
          }
        });
        return;
      }

      // For now, we'll return basic shift status
      // In a real implementation, this would also include ride information
      res.status(200).json({
        success: true,
        data: {
          isOnShift: shiftStatus.isOnShift,
          shiftStart: shiftStatus.shiftStart,
          isPaused: shiftStatus.isPaused,
          pauseStart: shiftStatus.pauseStart,
          lastPauseEnd: shiftStatus.lastPauseEnd,
          isOnRide: false, // This would be determined by checking for active rides
          rideStartLatitude: null,
          rideStartLongitude: null,
          rideDestinationAddress: null
        }
      });
    } catch (error: any) {
      res.status(400);
      throw new Error(error.message || 'Failed to get shift status');
    }
  });
} 