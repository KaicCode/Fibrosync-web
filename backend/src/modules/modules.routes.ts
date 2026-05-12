import { Router } from 'express';
import userRoutes from './user/routes/user.routes';
import authRoutes from './auth/routes/auth.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);

export default router;
