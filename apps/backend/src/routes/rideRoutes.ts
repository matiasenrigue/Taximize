// Placeholder file for TDD Red phase - routes will be implemented in Green phase
import { Router } from 'express';
import { RideController } from '../controllers/rideController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All routes are protected by JWT authentication
router.post('/evaluate-ride', protect, RideController.evaluateRide);
router.post('/start-ride', protect, RideController.startRide);
router.post('/get-ride-status', protect, RideController.getRideStatus);
router.post('/end-ride', protect, RideController.endRide);

export default router; 