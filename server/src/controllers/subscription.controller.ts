import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription.js';
import { stripe } from '../config/stripe.js';
import { config } from '../config/env.js';

export const getSubscription = async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.user!.organizationId;

  let subscription = await Subscription.findOne({ organizationId });
  if (!subscription) {
    subscription = await Subscription.create({
      organizationId,
      plan: 'FREE',
      status: 'active',
    });
  }

  res.json({ subscription });
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  const { plan } = req.body; // 'PRO' | 'ENTERPRISE'
  const organizationId = req.user!.organizationId;

  const priceMap: Record<string, string> = {
    PRO: 'price_mock_pro_plan',
    ENTERPRISE: 'price_mock_enterprise_plan',
  };

  if (!priceMap[plan]) {
    res.status(400).json({ message: 'Invalid plan selected' });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `StatusPulse ${plan} Plan`,
              description: `Automated health checks & incident management - ${plan}`,
            },
            unit_amount: plan === 'PRO' ? 2900 : 9900,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        organizationId,
        plan,
      },
      success_url: `${config.clientOrigin}/settings?success=true`,
      cancel_url: `${config.clientOrigin}/settings?canceled=true`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create Stripe checkout session', error: err.message });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  let event: any;

  try {
    if (config.stripeWebhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error('[Stripe Webhook] Verification error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const session = event.data.object;
      const organizationId = session.metadata?.organizationId;
      const plan = session.metadata?.plan || 'PRO';

      if (organizationId) {
        await Subscription.findOneAndUpdate(
          { organizationId },
          {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription || session.id,
            plan,
            status: 'active',
          },
          { upsert: true }
        );
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { status: 'canceled', plan: 'FREE' }
      );
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
};
