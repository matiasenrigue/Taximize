import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { RideService } from './ride.service';
import { ShiftService } from '../shifts/shift.service';
import { modelToResponse, requestToModel } from '../../shared/utils/caseTransformer';
import { ResponseHandler } from '../../shared/utils/responseHandler';
import { RideCoordinates } from './ride.types';
import { RideValidators } from './ride.validators';
import { RIDE_CONSTANTS } from './ride.constants';


/**
 * Handles ride API endpoints - evaluation, start, end, and status.
 * All routes require authentication.
 */
export class RideController {


    /**
     * Evaluates ride coordinates to get ML prediction score.
     * 
     * @route POST /api/rides/evaluate-ride
     * @access Protected
     * @returns Predicted rating (1-5 scale)
     */
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



    /**
     * Starts a new ride.
     * 
     * @route POST /api/rides/start-ride
     * @access Protected
     * @throws 400 if no active shift or bad coordinates
     */
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



    /**
     * Gets current ride status.
     * 
     * @route GET /api/rides/current
     * @access Protected
     */
    static getRideStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!; 

        try {
            const rideStatus = await RideService.getRideStatus(driverId);
            ResponseHandler.success(res, rideStatus);
        } catch (error: any) {
            ResponseHandler.error(error, res, 'Failed to get ride status');
        }
    });


    
    /**
     * Ends active ride and calculates earnings.
     * 
     * @route POST /api/rides/end-ride
     * @access Protected
     * @param req.body.fareCents
     * @param req.body.actualDistanceKm
     * @returns Ride summary with final metrics (duration, earnings, distance
     * @throws If no active ride or already ended
     */
    static endRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { fareCents, actualDistanceKm, timestamp } = req.body;
        const driverId = req.driverId!; 

        try {
            // Get active ride first, then end it
            const rideStatus = await RideService.getRideStatus(driverId);
            const result = await RideService.endRide(rideStatus.rideId, fareCents, actualDistanceKm, timestamp);
            
            ResponseHandler.success(res, result, 'Ride ended successfully');
        } catch (error: any) {
            ResponseHandler.error(error, res, 'Failed to end ride');
        }
    });

} 