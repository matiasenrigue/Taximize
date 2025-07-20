import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { ShiftService } from './shift.service';
import { RideService } from '../rides/ride.service';
import { modelToResponse, requestToModel } from '../../shared/utils/caseTransformer';

export class ShiftController {

    /**
     * Helper method to handle errors with appropriate status codes
     */
    private static handleError(error: any, res: Response): void {
        if (error.message.includes('Not authorized')) {
            res.status(403);
        } else if (error.message.includes('not found')) {
            res.status(404);
        } else {
            res.status(400);
        }
        throw new Error(error.message || 'Operation failed');
    }

    // @desc    Get current shift status
    // @route   GET /api/shifts/current
    // @access  Protected
    static getCurrentShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!; 

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
        const driverId = req.driverId!; 

        try {
            // Get all relevant data for debugging
            const hasActiveRide = await RideService.hasActiveRide(driverId);
            const activeShift = await ShiftService.getActiveShift(driverId);
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



    // @desc    Get all shifts for driver
    // @route   GET /api/shifts
    // @access  Protected
    static getShifts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!; 

        try {
            const shifts = await ShiftService.getShiftsByDriver(driverId);
            res.status(200).json(shifts);
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message || 'Failed to get shifts');
        }
    });



    // @desc    Edit shift details
    // @route   PUT /api/shifts/:shiftId
    // @access  Protected
    static editShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { shiftId } = req.params;
        const driverId = req.driverId!; 
        const updateData = req.body;

        try {
            const updatedShift = await ShiftService.editShift(shiftId, driverId, updateData);
            res.status(200).json(updatedShift);
        } catch (error: any) {
            this.handleError(error, res);
        }
    });

    // @desc    Delete shift (soft delete)
    // @route   DELETE /api/shifts/:shiftId
    // @access  Protected
    static deleteShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { shiftId } = req.params;
        const driverId = req.driverId!; 

        try {
            await ShiftService.deleteShift(shiftId, driverId);
            res.status(200).json({ message: 'Shift deleted successfully' });
        } catch (error: any) {
            this.handleError(error, res);
        }
    });

    // @desc    Restore deleted shift
    // @route   POST /api/shifts/:shiftId/restore
    // @access  Protected
    static restoreShift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { shiftId } = req.params;
        const driverId = req.driverId!; 

        try {
            await ShiftService.restoreShift(shiftId, driverId);
            res.status(200).json({ message: 'Shift restored successfully' });
        } catch (error: any) {
            this.handleError(error, res);
        }
    });

} 