import Stripe from 'stripe';
import { config } from './env.js';

export const stripe = new Stripe(config.stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2023-10-16' as any,
});
