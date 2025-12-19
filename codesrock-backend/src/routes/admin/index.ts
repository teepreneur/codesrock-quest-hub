import express from 'express';
import usersRoutes from './usersRoutes';
import contentRoutes from './contentRoutes';
import analyticsRoutes from './analyticsRoutes';
import schoolsRoutes from './schoolsRoutes';

const router = express.Router();

// Mount admin sub-routes
router.use('/users', usersRoutes);
router.use('/content', contentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/schools', schoolsRoutes);

export default router;
