// Placeholder file for TDD Red phase - methods will be implemented in Green phase
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { ShiftService } from './shift.service';
import { RideService } from '../rides/ride.service';
import { modelToResponse, requestToModel } from '../../shared/utils/caseTransformer';

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
        const { timestamp, duration } = req.body || {};
        const driverId = req.user?.id;

        // Validate authentication
        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        // Use provided timestamp or current time
        const signalTimestamp = timestamp || Date.now();

        try {
            await ShiftService.handleSignal(driverId, signalTimestamp, 'start', duration);
            
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
        const { timestamp, pauseDuration } = req.body || {};
        const driverId = req.user?.id;

        // Validate authentication
        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        // Use provided timestamp or current time
        const signalTimestamp = timestamp || Date.now();

        try {
            await ShiftService.handleSignal(driverId, signalTimestamp, 'pause', pauseDuration);
            
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
            
            // Calculate total earnings from rides
            const totalEarnings = await ShiftService.calculateShiftEarnings(savedShift.id);
            
            // Convert earnings to cents (assuming totalEarnings is in currency units)
            const totalEarningsCents = Math.round(totalEarnings * 100);
            
            // Calculate idle time (totalDuration - workTime - breakTime)
            const idleTime = savedShift.total_duration_ms - (savedShift.work_time_ms || 0) - (savedShift.break_time_ms || 0);
            
            // Return actual shift summary from saved shift data
            res.status(200).json({
                success: true,
                message: 'Shift ended successfully',
                data: {
                    totalDuration: savedShift.total_duration_ms,
                    passengerTime: savedShift.work_time_ms,
                    pauseTime: savedShift.break_time_ms,
                    idleTime: idleTime,
                    numBreaks: savedShift.num_breaks,
                    averageBreak: savedShift.avg_break_ms,
                    totalEarnings: totalEarningsCents
                }
            });
        } catch (error: any) {
            if (error.message.includes('Invalid signal transition')) {
                // Check what's actually preventing the shift from ending
                const hasActiveRide = await RideService.hasActiveRide(driverId);
                const activeShift = await ShiftService.getActiveShiftForDriver(driverId);
                
                if (!activeShift) {
                    res.status(400);
                    throw new Error('No active shift to end');
                } else if (hasActiveRide) {
                    res.status(400);
                    throw new Error('Cannot end shift while ride is in progress. Please end the current ride first.');
                } else {
                    res.status(400);
                    throw new Error('Invalid shift state transition');
                }
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
            const isOnRide = await RideService.hasActiveRide(driverId);
            
            if (!shiftStatus) {
                res.status(200).json({
                    success: true,
                    data: {
                        isOnShift: false,
                        shiftStart: null,
                        isPaused: false,
                        pauseStart: null,
                        lastPauseEnd: null,
                        duration: null,
                        pauseDuration: null,
                        isOnRide: false,
                        rideStartLatitude: null,
                        rideStartLongitude: null,
                        rideDestinationAddress: null
                    }
                });
                return;
            }

            // Get ride information if driver is on a ride
            let rideInfo = { startLatitude: null, startLongitude: null, destinationAddress: null };
            if (isOnRide) {
                try {
                    const rideStatus = await RideService.getRideStatus(driverId);
                    rideInfo = {
                        startLatitude: rideStatus.start_latitude,
                        startLongitude: rideStatus.start_longitude,
                        destinationAddress: rideStatus.destination_address || null
                    };
                } catch (error) {
                    // If we can't get ride status, just use defaults
                }
            }
            res.status(200).json({
                success: true,
                data: {
                    isOnShift: shiftStatus.isOnShift,
                    shiftStart: shiftStatus.shiftStart,
                    isPaused: shiftStatus.isPaused,
                    pauseStart: shiftStatus.pauseStart,
                    lastPauseEnd: shiftStatus.lastPauseEnd,
                    duration: shiftStatus.duration,
                    pauseDuration: shiftStatus.pauseDuration,
                    isOnRide: isOnRide,
                    rideStartLatitude: rideInfo.startLatitude,
                    rideStartLongitude: rideInfo.startLongitude,
                    rideDestinationAddress: rideInfo.destinationAddress
                }
            });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message || 'Failed to get shift status');
        }
    });

    // @desc    Debug shift and ride status
    // @route   GET /api/shifts/debug
    // @access  Protected
    static debugShiftStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.user?.id;

        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        try {
            // Get all relevant data for debugging
            const hasActiveRide = await RideService.hasActiveRide(driverId);
            const activeShift = await ShiftService.getActiveShiftForDriver(driverId);
            const shiftStatus = await ShiftService.getCurrentShiftStatus(driverId);
            
            let activeRideInfo = null;
            if (hasActiveRide && activeShift) {
                try {
                    const rideStatus = await RideService.getRideStatus(driverId);
                    activeRideInfo = {
                        found: true,
                        rideId: rideStatus.rideId,
                        startTime: rideStatus.start_time,
                        shiftId: rideStatus.shift_id
                    };
                } catch (error: any) {
                    activeRideInfo = {
                        found: false,
                        error: error.message
                    };
                }
            }

            res.status(200).json({
                success: true,
                debug: {
                    hasActiveRide,
                    activeShift: activeShift ? {
                        id: activeShift.id,
                        start: activeShift.shift_start,
                        end: activeShift.shift_end
                    } : null,
                    shiftStatus: shiftStatus ? {
                        isOnShift: shiftStatus.isOnShift,
                        isPaused: shiftStatus.isPaused
                    } : null,
                    activeRideInfo
                }
            });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message || 'Failed to get debug info');
        }
    });

    // @desc    Skip pause (register a 0-minute pause)
    // @route   POST /api/shifts/skip-pause
    // @access  Protected
    static skipPause = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
            // Check if driver has an active shift
            const shiftStatus = await ShiftService.getCurrentShiftStatus(driverId);
            if (!shiftStatus || !shiftStatus.isOnShift) {
                res.status(400);
                throw new Error('No active shift to skip pause');
            }

            // Register a fake pause of 0 minutes by emitting pause and continue signals
            await ShiftService.handleSignal(driverId, signalTimestamp, 'pause');
            await ShiftService.handleSignal(driverId, signalTimestamp, 'continue');
            
            res.status(200).json({
                success: true,
                message: 'Pause skipped successfully'
            });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message || 'Failed to skip pause');
        }
    });

    // @desc    Edit shift details
    // @route   PUT /api/shifts/:shiftId
    // @access  Protected
    static editShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { shiftId } = req.params;
        const driverId = req.user?.id;
        const updateData = req.body;

        // Validate authentication
        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        try {
            const updatedShift = await ShiftService.editShift(shiftId, driverId, updateData);
            res.status(200).json(updatedShift);
        } catch (error: any) {
            if (error.message.includes('Not authorized')) {
                res.status(403);
            } else {
                res.status(400);
            }
            throw new Error(error.message || 'Failed to edit shift');
        }
    });

    // @desc    Delete shift (soft delete)
    // @route   DELETE /api/shifts/:shiftId
    // @access  Protected
    static deleteShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { shiftId } = req.params;
        const driverId = req.user?.id;

        // Validate authentication
        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        try {
            await ShiftService.deleteShift(shiftId, driverId);
            res.status(200).json({ message: 'Shift deleted successfully' });
        } catch (error: any) {
            if (error.message.includes('Not authorized')) {
                res.status(403);
            } else {
                res.status(400);
            }
            throw new Error(error.message || 'Failed to delete shift');
        }
    });

    // @desc    Restore deleted shift
    // @route   POST /api/shifts/:shiftId/restore
    // @access  Protected
    static restoreShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { shiftId } = req.params;
        const driverId = req.user?.id;

        // Validate authentication
        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        try {
            await ShiftService.restoreShift(shiftId, driverId);
            res.status(200).json({ message: 'Shift restored successfully' });
        } catch (error: any) {
            if (error.message.includes('Not authorized')) {
                res.status(403);
            } else {
                res.status(400);
            }
            throw new Error(error.message || 'Failed to restore shift');
        }
    });

    // @desc    Get all shifts for driver
    // @route   GET /api/shifts
    // @access  Protected
    static getShifts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.user?.id;

        // Validate authentication
        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        try {
            const shifts = await ShiftService.getShiftsByDriver(driverId);
            res.status(200).json(shifts);
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message || 'Failed to get shifts');
        }
    });

    // @desc    Get single shift
    // @route   GET /api/shifts/:shiftId
    // @access  Protected
    static getShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { shiftId } = req.params;
        const driverId = req.user?.id;

        // Validate authentication
        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        try {
            const shift = await ShiftService.getShiftById(shiftId, driverId);
            res.status(200).json(shift);
        } catch (error: any) {
            if (error.message.includes('Not authorized')) {
                res.status(403);
            } else {
                res.status(400);
            }
            throw new Error(error.message || 'Failed to get shift');
        }
    });

    // @desc    End shift by ID
    // @route   POST /api/shifts/:shiftId/end
    // @access  Protected
    static endShiftById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { shiftId } = req.params;
        const driverId = req.user?.id;

        // Validate authentication
        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        try {
            const result = await ShiftService.endShiftById(shiftId, driverId);
            res.status(200).json({
                success: true,
                message: 'Shift ended successfully',
                data: modelToResponse(result)
            });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message || 'Failed to end shift');
        }
    });
} 