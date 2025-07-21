import { Router } from 'express';
import { StatsController } from './stats.controller';
import { protect } from '../../shared/middleware/auth.middleware';
import { requireDriver } from '../../shared/middleware/driverAuth.middleware';

const router = Router();

// All routes are protected by JWT authentication and require driver role
router.get('/shifts-by-days', protect, requireDriver, StatsController.getShiftsForLastNDays);
router.get('/rides-by-weekday', protect, requireDriver, StatsController.getRidesByDayOfWeek);
router.get('/earnings', protect, requireDriver, StatsController.getEarningsStatistics);
router.get('/worktime', protect, requireDriver, StatsController.getWorkTimeStatistics);

export default router;