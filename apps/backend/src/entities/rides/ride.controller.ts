// Placeholder file for TDD Red phase - methods will be implemented in Green phase
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { RideService } from './ride.service';
import { ShiftService } from '../shifts/shift.service';
import { modelToResponse, requestToModel } from '../../shared/utils/caseTransformer';


export class RideController {
  // @desc    Evaluate ride coordinates and get ML prediction score
  // @route   POST /api/rides/evaluate-ride
  // @access  Protected
  static evaluateRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { startLatitude, startLongitude, destinationLatitude, destinationLongitude } = req.body;

    // Validate required fields
    if (!startLatitude || !startLongitude || !destinationLatitude || !destinationLongitude) {
      res.status(400);
      throw new Error('Missing required coordinates');
    }

    // Validate coordinate types
    if (typeof startLatitude !== 'number' || typeof startLongitude !== 'number' || 
        typeof destinationLatitude !== 'number' || typeof destinationLongitude !== 'number') {
      res.status(400);
      throw new Error('Invalid coordinates provided');
    }

    try {
      const rating = await RideService.evaluateRide(startLatitude, startLongitude, destinationLatitude, destinationLongitude);
      
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
    const { startLatitude, startLongitude, destinationLatitude, destinationLongitude } = req.body;
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    // Validate required fields
    if (!startLatitude || !startLongitude || !destinationLatitude || !destinationLongitude) {
      res.status(400);
      throw new Error('Missing required coordinates');
    }

    // Validate coordinate types
    if (typeof startLatitude !== 'number' || typeof startLongitude !== 'number' || 
        typeof destinationLatitude !== 'number' || typeof destinationLongitude !== 'number') {
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
        startLat: startLatitude,
        startLng: startLongitude,
        destLat: destinationLatitude,
        destLng: destinationLongitude
      };

      // Get the driver's current active shift
      const activeShift = await ShiftService.getActiveShiftForDriver(driverId);
      if (!activeShift) {
        res.status(400);
        throw new Error('No active shift found');
      }

      const result = await RideService.startRide(driverId, activeShift.id, coords);
      
      res.status(200).json({
        success: true,
        message: 'Ride started successfully',
        data: modelToResponse(result)
      });
    } catch (error: any) {
      if (error.message.includes('Invalid latitude') || error.message.includes('Invalid longitude')) {
        res.status(400);
        throw new Error('Invalid coordinates provided');
      }
      // Pass through specific error messages from the service
      if (error.message.includes('No active shift found') || 
          error.message.includes('Driver is on pause') || 
          error.message.includes('Another ride is already in progress')) {
        res.status(400);
        throw new Error(error.message);
      }
      res.status(400);
      throw new Error(error.message || 'Failed to start ride');
    }
  });

  // @desc    Get current ride status  
  // @route   GET /api/rides/current
  // @access  Protected
  static getRideStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    try {
      const rideStatus = await RideService.getRideStatus(driverId);
      
      // Transform the entire response to camelCase
      res.status(200).json({
        success: true,
        data: modelToResponse(rideStatus)
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
    const { fareCents, actualDistanceKm } = req.body;
    const driverId = req.user?.id;

    // Validate authentication
    if (!driverId) {
      res.status(401);
      throw new Error('Driver authentication required');
    }

    // Validate required fields
    if (fareCents === undefined || actualDistanceKm === undefined) {
      res.status(400);
      throw new Error('Missing required fields: fareCents and actualDistanceKm');
    }

    // Validate field types
    if (typeof fareCents !== 'number' || typeof actualDistanceKm !== 'number') {
      res.status(400);
      throw new Error('Invalid fare or distance values');
    }

    try {
      // First get the active ride to get the rideId
      const rideStatus = await RideService.getRideStatus(driverId);

      const result = await RideService.endRide(rideStatus.rideId, fareCents, actualDistanceKm);
      
      res.status(200).json({
        success: true,
        message: 'Ride ended successfully',
        data: modelToResponse(result)
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
      // Transform camelCase request to snake_case for service
      const snakeCaseData = requestToModel(updateData);
      const updatedRide = await RideService.editRide(rideId, driverId, snakeCaseData);
      // Transform snake_case response to camelCase
      res.status(200).json(modelToResponse(updatedRide));
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
      // Transform each ride to camelCase
      const transformedRides = rides.map(ride => modelToResponse(ride));
      res.status(200).json(transformedRides);
    } catch (error: any) {
      res.status(400);
      throw new Error(error.message || 'Failed to get rides');
    }
  });
} 