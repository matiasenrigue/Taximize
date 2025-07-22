import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { ShiftService } from './shift.service';
import { RideService } from '../rides/ride.service';
import { modelToResponse, requestToModel } from '../../shared/utils/caseTransformer';
import { ResponseHandler } from '../../shared/utils/responseHandler';

/**
 * Handles HTTP requests for shift management.
 * All endpoints require authentication.
 */
export class ShiftController {

    /**
     * Get current shift status with ride info.
     * @route GET /api/shifts/current
     * @access Protected
     */
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

            // Get ride details if active
            let rideInfo = { 
                startLatitude: null as number | null, 
                startLongitude: null as number | null, 
                destinationAddress: null as string | null
            };
            if (isOnRide) {
                try {
                    const rideStatus = await RideService.getRideStatus(driverId);
                    rideInfo = {
                        startLatitude: rideStatus.startLatitude,
                        startLongitude: rideStatus.startLongitude,
                        destinationAddress: rideStatus.address || null
                    };
                } catch (error) {
                    // Ride status failed - continue with nulls
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


    
    /**
     * Debug endpoint for shift/ride troubleshooting.
     * @route GET /api/shifts/debug
     * @access Protected
     */
    static debugShiftStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!; 

        try {
            // Gather debug data
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
                        startTime: rideStatus.startTime,
                        shiftId: 'N/A' // Not in RideStatus
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



    /**
     * Get all shifts for authenticated driver.
     * @route GET /api/shifts
     * @access Protected
     */
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


} 