import { Router } from 'express';
import { signup, signin, refresh } from './auth.controller';
import protect from '../../shared/middleware/auth.middleware';


const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/refresh', refresh);

export default router;
