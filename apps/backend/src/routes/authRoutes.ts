import { Router } from 'express';
import { signup, signin, refresh } from '../controllers/authController';
import protect from '../middleware/authMiddleware';


const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/refresh', refresh); 

// router.get('/profile', protect, getProfile);
// router.delete('/:id', protect, authorize('admin'), deleteUser);



export default router;
