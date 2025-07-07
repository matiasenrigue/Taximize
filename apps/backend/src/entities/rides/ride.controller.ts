// Placeholder file for TDD Red phase - methods will be implemented in Green phase
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { RideService } from './ride.service';
import { Shift } from '../shifts/shift.model';

export class RideController {
  // @desc    Evaluate ride coordinates and get ML prediction score
  // @route   POST /api/rides/evaluate-ride
  // @access  Protected
  static evaluateRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { start_latitude, start_longitude, destination_latitude, destination_longitude } = req.body;

    // Validate required fields
    if (!start_latitude || !start_longitude || !destination_latitude || !destination_longitude) {
      res.status(400);
      throw new Error('Missing required coordinates');
    }

    // Validate coordinate types
    if (typeof start_latitude !== 'number' || typeof start_longitude !== 'number' || 
        typeof destination_latitude !== 'number' || typeof destination_longitude !== 'number') {
      res.status(400);
      throw new Error('Invalid coordinates provided');
    }

    try {
      const rating = await RideService.evaluateRide(start_latitude, start_longitude, destination_latitude, destination_longitude);
      
      res.status(200).json({
        success: true,
        rating
      });
    } catch (error: any) {
      res.status(400);
      throw new Error(error.message || 'Failed to evaluate ride');
    }
  });

  // @desc    Start a new ride
  // @route   POST /api/rides/start-ride  
  // @access  Protected
  static startRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { start_latitude, start_longitude, destination_latitude, destination_longitude } = req.body;
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    // Validate required fields
    if (!start_latitude || !start_longitude || !destination_latitude || !destination_longitude) {
      res.status(400);
      throw new Error('Missing required coordinates');
    }

    // Validate coordinate types
    if (typeof start_latitude !== 'number' || typeof start_longitude !== 'number' || 
        typeof destination_latitude !== 'number' || typeof destination_longitude !== 'number') {
      res.status(400);
      throw new Error('Invalid coordinates provided');
    }

    try {
      // Get active shift for driver
      const activeShift = await Shift.findOne({
        where: { 
          driver_id: driverId,
          shift_end: null
        }
      });

      if (!activeShift) {
        res.status(400);
        throw new Error('No active shift found for driver');
      }

      const coords = {
        startLat: start_latitude,
        startLng: start_longitude,
        destLat: destination_latitude,
        destLng: destination_longitude
      };

      const result = await RideService.startRide(driverId, activeShift.id, coords);
      
      res.status(200).json({
        success: true,
        message: 'Ride started successfully',
        data: {
          rideId: result.rideId,
          startTime: result.startTime,
          predicted_score: result.predicted_score
        }
      });
    } catch (error: any) {
      if (error.message.includes('Invalid latitude') || error.message.includes('Invalid longitude')) {
        res.status(400);
        throw new Error('Invalid coordinates provided');
      }
      if (error.message.includes('Cannot start ride')) {
        res.status(400);
        throw new Error('Cannot start ride—either no active shift or another ride in progress');
      }
      res.status(400);
      throw new Error(error.message || 'Failed to start ride');
    }
  });

  // @desc    Get current ride status  
  // @route   POST /api/rides/get-ride-status
  // @access  Protected
  static getRideStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { destination_latitude, destination_longitude } = req.body;
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    try {
      const overrideDest = (destination_latitude && destination_longitude) ? {
        lat: destination_latitude,
        lng: destination_longitude
      } : undefined;

      // Validate override destination if provided
      if (overrideDest && (typeof overrideDest.lat !== 'number' || typeof overrideDest.lng !== 'number')) {
        res.status(400);
        throw new Error('Invalid coordinates provided');
      }

      const rideStatus = await RideService.getRideStatus(driverId, overrideDest);
      
      if (!rideStatus) {
        res.status(400);
        throw new Error('No active ride or invalid coordinates');
      }

      res.status(200).json({
        success: true,
        data: {
          rideId: rideStatus.rideId,
          start_latitude: rideStatus.start_latitude,
          start_longitude: rideStatus.start_longitude,
          current_destination_latitude: rideStatus.current_destination_latitude,
          current_destination_longitude: rideStatus.current_destination_longitude,
          elapsed_time_ms: rideStatus.elapsed_time_ms,
          distance_km: rideStatus.distance_km,
          estimated_fare_cents: rideStatus.estimated_fare_cents
        }
      });
    } catch (error: any) {
      res.status(400);
      throw new Error(error.message || 'Failed to get ride status');
    }
  });

  // @desc    End current ride
  // @route   POST /api/rides/end-ride
  // @access  Protected
  static endRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { fare_cents, actual_distance_km } = req.body;
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    // Validate required fields
    if (fare_cents === undefined || actual_distance_km === undefined) {
      res.status(400);
      throw new Error('Missing required fields: fare_cents and actual_distance_km');
    }

    // Validate field types
    if (typeof fare_cents !== 'number' || typeof actual_distance_km !== 'number') {
      res.status(400);
      throw new Error('Invalid fare or distance values');
    }

    try {
      // First get the active ride to get the rideId
      const rideStatus = await RideService.getRideStatus(driverId);
      
      if (!rideStatus) {
        res.status(400);
        throw new Error('No active ride to end');
      }

      const result = await RideService.endRide(rideStatus.rideId, fare_cents, actual_distance_km);
      
      res.status(200).json({
        success: true,
        message: 'Ride ended successfully',
        data: {
          rideId: result.rideId,
          total_time_ms: result.total_time_ms,
          distance_km: result.distance_km,
          earning_cents: result.earning_cents,
          earning_per_min: result.earning_per_min
        }
      });
    } catch (error: any) {
      if (error.message.includes('No active ride')) {
        res.status(400);
        throw new Error('No active ride to end');
      }
      res.status(400);
      throw new Error(error.message || 'Failed to end ride');
    }
  });
} 