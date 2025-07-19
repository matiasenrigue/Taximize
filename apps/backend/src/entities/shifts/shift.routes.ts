// Placeholder file for TDD Red phase - routes will be implemented in Green phase
import { Router } from 'express';
import { ShiftController } from './shift.controller';
import { protect } from '../../shared/middleware/auth.middleware';
import { requireDriver } from '../../shared/middleware/driverAuth.middleware';

const router = Router();

// All routes are protected by JWT authentication and require driver role
router.post('/signal', protect, requireDriver, ShiftController.emitSignal);
router.post('/start-shift', protect, requireDriver, ShiftController.startShift);
router.post('/pause-shift', protect, requireDriver, ShiftController.pauseShift);
router.post('/continue-shift', protect, requireDriver, ShiftController.continueShift);
router.post('/end-shift', protect, requireDriver, ShiftController.endShift);
router.post('/skip-pause', protect, requireDriver, ShiftController.skipPause);

router.get('/current', protect, requireDriver, ShiftController.getCurrentShift);
router.get('/debug', protect, requireDriver, ShiftController.debugShiftStatus);

// Edit and Delete routes
router.put('/:shiftId', protect, requireDriver, ShiftController.editShift);
router.delete('/:shiftId', protect, requireDriver, ShiftController.deleteShift);
router.post('/:shiftId/restore', protect, requireDriver, ShiftController.restoreShift);
router.get('/', protect, requireDriver, ShiftController.getShifts);
router.get('/:shiftId', protect, requireDriver, ShiftController.getShift);
router.post('/:shiftId/end', protect, requireDriver, ShiftController.endShiftById);

export default router; 