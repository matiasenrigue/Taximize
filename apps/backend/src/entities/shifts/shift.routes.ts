import { Router } from 'express';
import { ShiftController } from './shift.controller';
import { ShiftSignalController } from '../shift-signals/shiftSignal.controller';
import { protect } from '../../shared/middleware/auth.middleware';
import { requireDriver } from '../../shared/middleware/driverAuth.middleware';

const router = Router();

// All routes are protected by JWT authentication and require driver role

// Shift Start/Stop
router.post('/start-shift', protect, requireDriver, ShiftSignalController.startShift);
router.post('/end-shift', protect, requireDriver, ShiftSignalController.endShift);

// Pauses
router.post('/pause-shift', protect, requireDriver, ShiftSignalController.pauseShift);
router.post('/continue-shift', protect, requireDriver, ShiftSignalController.continueShift);
router.post('/skip-pause', protect, requireDriver, ShiftSignalController.skipPause);

// Shift Status
router.get('/current', protect, requireDriver, ShiftController.getCurrentShift);
router.get('/debug', protect, requireDriver, ShiftController.debugShiftStatus);

router.get('/', protect, requireDriver, ShiftController.getShifts);

export default router; 