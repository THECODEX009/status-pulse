import { Router } from 'express';
import { getPublicStatusPage } from '../controllers/statusPage.controller.js';

const router = Router();

// Unauthenticated public route
router.get('/:slug', getPublicStatusPage);

export default router;
