import { Router } from 'express';
import { UserController } from './user.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

router.get('/me', protect, UserController.getCurrentUser);
router.get('/preferences', protect, UserController.getPreferences);
router.put('/preferences', protect, UserController.updatePreferences);

export default router;