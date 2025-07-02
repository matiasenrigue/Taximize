// Placeholder file for TDD Red phase - methods will be implemented in Green phase
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { RideService } from './ride.service';

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
      // Get active shift for driver (simplified approach - in real app would get from request or service)
      const coords = {
        startLat: start_latitude,
        startLng: start_longitude,
        destLat: destination_latitude,
        destLng: destination_longitude
      };

      // For this implementation, we'll use a placeholder shiftId
      // In a real implementation, this would come from the driver's current active shift
      const shiftId = 'current-shift-id'; // This should be retrieved from the driver's active shift

      const result = await RideService.startRide(driverId, shiftId, coords);
      
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

  // @desc    Edit ride details
  // @route   PUT /api/rides/:rideId
  // @access  Protected
  static editRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const driverId = req.user?.id;
    const updateData = req.body;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    try {
      const updatedRide = await RideService.editRide(rideId, driverId, updateData);
      res.status(200).json(updatedRide);
    } catch (error: any) {
      if (error.message.includes('Not authorized')) {
        res.status(403);
      } else {
        res.status(400);
      }
      throw new Error(error.message || 'Failed to edit ride');
    }
  });

  // @desc    Delete ride (soft delete)
  // @route   DELETE /api/rides/:rideId
  // @access  Protected
  static deleteRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    try {
      await RideService.deleteRide(rideId, driverId);
      res.status(200).json({ message: 'Ride deleted successfully' });
    } catch (error: any) {
      if (error.message.includes('Not authorized')) {
        res.status(403);
      } else {
        res.status(400);
      }
      throw new Error(error.message || 'Failed to delete ride');
    }
  });

  // @desc    Restore deleted ride
  // @route   POST /api/rides/:rideId/restore
  // @access  Protected
  static restoreRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    try {
      await RideService.restoreRide(rideId, driverId);
      res.status(200).json({ message: 'Ride restored successfully' });
    } catch (error: any) {
      if (error.message.includes('Not authorized')) {
        res.status(403);
      } else {
        res.status(400);
      }
      throw new Error(error.message || 'Failed to restore ride');
    }
  });

  // @desc    Get all rides for driver
  // @route   GET /api/rides
  // @access  Protected
  static getRides = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    try {
      const rides = await RideService.getRidesByDriver(driverId);
      res.status(200).json(rides);
    } catch (error: any) {
      res.status(400);
      throw new Error(error.message || 'Failed to get rides');
    }
  });
} 