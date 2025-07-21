import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { RideService } from './ride.service';
import { ShiftService } from '../shifts/shift.service';
import { modelToResponse, requestToModel } from '../../shared/utils/caseTransformer';
import { ResponseHandler } from '../../shared/utils/responseHandler';
import { RideCoordinates } from './ride.types';
import { RideValidators } from './ride.validators';
import { RIDE_CONSTANTS } from './ride.constants';

export class RideController {
    // @desc    Evaluate ride coordinates and get ML prediction score
    // @route   POST /api/rides/evaluate-ride
    // @access  Protected
    static evaluateRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { startLatitude, startLongitude, destinationLatitude, destinationLongitude } = req.body;
        
        const rating = await RideService.evaluateRide(
            startLatitude, 
            startLongitude, 
            destinationLatitude, 
            destinationLongitude
        );
        
        ResponseHandler.success(res, { rating });
    });

    // @desc    Start a new ride
    // @route   POST /api/rides/start-ride  
    // @access  Protected
    static startRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { startLatitude, startLongitude, destinationLatitude, destinationLongitude, timestamp, address, predictedScore } = req.body;
        const driverId = req.driverId!; 

        const coords: RideCoordinates = {
            startLat: startLatitude,
            startLng: startLongitude,
            destLat: destinationLatitude,
            destLng: destinationLongitude,
            address: address.trim(),
            timestamp: timestamp,
            predictedScore: predictedScore
        };

        // Get the driver's current active shift
        const activeShift = await ShiftService.getActiveShift(driverId);
        if (!activeShift) {
            res.status(400);
            throw new Error('No active shift found');
        }

        const result = await RideService.startRide(driverId, activeShift.id, coords);
        
        ResponseHandler.success(res, result, 'Ride started successfully');
    });

    // @desc    Get current ride status  
    // @route   GET /api/rides/current
    // @access  Protected
    static getRideStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!; 

        try {
            const rideStatus = await RideService.getRideStatus(driverId);
            ResponseHandler.success(res, rideStatus);
        } catch (error: any) {
            ResponseHandler.error(error, res, 'Failed to get ride status');
        }
    });

    // @desc    End current ride
    // @route   POST /api/rides/end-ride
    // @access  Protected
    static endRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { fareCents, actualDistanceKm, timestamp } = req.body;
        const driverId = req.driverId!; 

        try {
            // First get the active ride to get the rideId
            const rideStatus = await RideService.getRideStatus(driverId);
            const result = await RideService.endRide(rideStatus.rideId, fareCents, actualDistanceKm, timestamp);
            
            ResponseHandler.success(res, result, 'Ride ended successfully');
        } catch (error: any) {
            ResponseHandler.error(error, res, 'Failed to end ride');
        }
    });

} 