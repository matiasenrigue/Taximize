import { Router } from 'express';
import { UserController } from './user.controller';
import { protect } from '../../shared/middleware/auth.middleware';

const router = Router();

router.get('/me', protect, UserController.getCurrentUser);

export default router;