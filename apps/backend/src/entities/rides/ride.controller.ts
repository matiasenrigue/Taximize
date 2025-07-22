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
 * Controller for ride-related operations.
 * 
 * Handles HTTP requests for ride management including evaluating rides,
 * starting rides, and ending rides. All endpoints require authentication
 * and validate input data before processing.
 */
export class RideController {


    /**
     * Evaluates ride coordinates to get ML prediction score.
     * 
     * Uses machine learning service to predict ride quality/profitability
     * based on start and destination coordinates.
     * 
     * @route POST /api/rides/evaluate-ride
     * @access Protected (requires authentication)
     * @param req.body.startLatitude - Starting point latitude
     * @param req.body.startLongitude - Starting point longitude
     * @param req.body.destinationLatitude - Destination latitude
     * @param req.body.destinationLongitude - Destination longitude
     * @returns JSON response with predicted rating (1-5 scale)
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
     * Starts a new ride for the authenticated driver.
     * 
     * Creates a new ride record after validating coordinates and ensuring
     * the driver has an active shift and no other rides in progress.
     * 
     * @route POST /api/rides/start-ride
     * @access Protected (requires authentication)
     * @param req.body.startLatitude - Starting point latitude
     * @param req.body.startLongitude - Starting point longitude
     * @param req.body.destinationLatitude - Destination latitude
     * @param req.body.destinationLongitude - Destination longitude
     * @param req.body.address - Human-readable destination address
     * @param req.body.predictedScore - ML predicted score for the ride
     * @param req.body.timestamp - Optional start timestamp (defaults to now)
     * @returns Success response with ride ID, start time, and predicted score
     * @throws 400 error if no active shift or invalid coordinates
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
     * Gets the current ride status for the authenticated driver.
     * 
     * Returns information about any active ride or indicates no ride in progress.
     * 
     * @route GET /api/rides/current
     * @access Protected (requires authentication)
     * @returns Current ride details or status indicating no active ride
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
     * Ends the current active ride for the authenticated driver.
     * 
     * Finalizes the ride with actual fare and distance information,
     * calculates earnings per minute, and updates shift statistics.
     * 
     * @route POST /api/rides/end-ride
     * @access Protected (requires authentication)
     * @param req.body.fareCents - Total fare earned in cents
     * @param req.body.actualDistanceKm - Actual distance traveled in kilometers
     * @param req.body.timestamp - Optional end timestamp (defaults to now)
     * @returns Ride summary with final metrics (duration, earnings, distance)
     * @throws Error if no active ride found or ride already ended
     */
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