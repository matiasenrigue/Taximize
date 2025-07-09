import { Router } from 'express';
import { UserController } from './user.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

// Protected routes
router.get('/me/stats', protect, UserController.getUserStats);

export default router;