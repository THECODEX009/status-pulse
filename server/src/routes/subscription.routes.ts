import { Router } from 'express';
import { getSubscription, createCheckoutSession } from '../controllers/subscription.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getSubscription);
router.post('/checkout', authorize(['Admin']), createCheckoutSession);

export default router;
