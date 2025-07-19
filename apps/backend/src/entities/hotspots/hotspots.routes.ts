import { Router } from 'express';
import { protect } from '../../shared/middleware/auth.middleware';
import { HotspotsController } from './hotspots.controller';

const router = Router();

// All routes are protected by JWT authentication
router.get('/', protect, HotspotsController.getHotspots);

export default router;