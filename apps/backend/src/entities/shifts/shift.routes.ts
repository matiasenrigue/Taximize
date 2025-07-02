// Placeholder file for TDD Red phase - routes will be implemented in Green phase
import { Router } from 'express';
import { ShiftController } from './shift.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes are protected by JWT authentication
router.post('/signal', protect, ShiftController.emitSignal);
router.post('/start-shift', protect, ShiftController.startShift);
router.post('/pause-shift', protect, ShiftController.pauseShift);
router.post('/continue-shift', protect, ShiftController.continueShift);
router.post('/end-shift', protect, ShiftController.endShift);
router.get('/current', protect, ShiftController.getCurrentShift);

// Edit and Delete routes
router.put('/:shiftId', protect, ShiftController.editShift);
router.delete('/:shiftId', protect, ShiftController.deleteShift);
router.post('/:shiftId/restore', protect, ShiftController.restoreShift);
router.get('/', protect, ShiftController.getShifts);
router.get('/:shiftId', protect, ShiftController.getShift);
router.post('/:shiftId/end', protect, ShiftController.endShiftById);

export default router; 