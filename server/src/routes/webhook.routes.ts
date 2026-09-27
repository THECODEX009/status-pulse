import { Router, raw } from 'express';
import { handleStripeWebhook } from '../controllers/subscription.controller.js';

const router = Router();

// Endpoint /api/v1/webhooks/stripe with raw body parsing for Stripe signature verification
router.post('/stripe', raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
