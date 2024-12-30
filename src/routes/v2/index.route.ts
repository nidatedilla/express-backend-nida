import express from 'express';
import userRoute from '../v1/user.route';
import authRoute from '../v1/auth.route';
import threadRoute from '../v1/thread.route';
import interactionRoute from '../v1/interaction.route';

const router = express.Router();

router.use('/users', userRoute);
router.use('/auth', authRoute);
router.use('/threads', threadRoute);
router.use('/interactions', interactionRoute);

export default router;
