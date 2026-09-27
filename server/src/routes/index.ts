import { Router } from 'express';
import authRoutes from './auth.routes.js';
import serviceRoutes from './service.routes.js';
import incidentRoutes from './incident.routes.js';
import metricsRoutes from './metrics.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import statusPageRoutes from './statusPage.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/incidents', incidentRoutes);
router.use('/metrics', metricsRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/status', statusPageRoutes);

export default router;
