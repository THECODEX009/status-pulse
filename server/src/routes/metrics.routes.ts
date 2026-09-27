import { Router } from 'express';
import { getDashboardOverview, getServiceMetrics } from '../controllers/metrics.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/overview', getDashboardOverview);
router.get('/services/:id', getServiceMetrics);

export default router;
