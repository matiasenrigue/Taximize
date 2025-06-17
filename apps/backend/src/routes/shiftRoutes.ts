// Placeholder file for TDD Red phase - routes will be implemented in Green phase
import { Router } from 'express';
import { ShiftController } from '../controllers/shiftController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All routes are protected by JWT authentication
router.post('/signal', protect, ShiftController.emitSignal);
router.post('/start-shift', protect, ShiftController.startShift);
router.post('/pause-shift', protect, ShiftController.pauseShift);
router.post('/continue-shift', protect, ShiftController.continueShift);
router.post('/end-shift', protect, ShiftController.endShift);
router.get('/current', protect, ShiftController.getCurrentShift);

export default router; 