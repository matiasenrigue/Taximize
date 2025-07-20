import { Router } from 'express';
import { RideController } from './ride.controller';
import { protect } from '../../shared/middleware/auth.middleware';
import { requireDriver } from '../../shared/middleware/driverAuth.middleware';
import { validateRideCoordinates, validateStartRideRequest, validateEndRideRequest } from './ride.middleware';

const router = Router();

// All routes are protected by JWT authentication and require driver role
router.post('/evaluate-ride', protect, requireDriver, validateRideCoordinates, RideController.evaluateRide);
router.post('/start-ride', protect, requireDriver, validateRideCoordinates, validateStartRideRequest, RideController.startRide);
router.get('/current', protect, requireDriver, RideController.getRideStatus);
router.post('/end-ride', protect, requireDriver, validateEndRideRequest, RideController.endRide);

// Edit and Delete routes
router.put('/:rideId', protect, requireDriver, RideController.editRide);
router.delete('/:rideId', protect, requireDriver, RideController.deleteRide);
router.post('/:rideId/restore', protect, requireDriver, RideController.restoreRide);
router.get('/', protect, requireDriver, RideController.getRides);

export default router; 