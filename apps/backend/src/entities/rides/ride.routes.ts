// Placeholder file for TDD Red phase - routes will be implemented in Green phase
import { Router } from 'express';
import { RideController } from './ride.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes are protected by JWT authentication
router.post('/evaluate-ride', protect, RideController.evaluateRide);
router.post('/start-ride', protect, RideController.startRide);
router.post('/get-ride-status', protect, RideController.getRideStatus);
router.post('/end-ride', protect, RideController.endRide);

// Edit and Delete routes
router.put('/:rideId', protect, RideController.editRide);
router.delete('/:rideId', protect, RideController.deleteRide);
router.post('/:rideId/restore', protect, RideController.restoreRide);
router.get('/', protect, RideController.getRides);

export default router; 