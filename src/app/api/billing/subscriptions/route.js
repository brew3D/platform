import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, getCurrentTimestamp } from '../../../lib/dynamodb-schema';
import { requireAuth } from '../../../lib/auth';
import Stripe from 'stripe';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// GET /api/billing/subscriptions - Get user's subscriptions
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    // Get user's subscription from database
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USER_SUBSCRIPTIONS,
      Key: { userId: auth.userId }
    }));

    const subscription = result.Item;

    if (!subscription) {
      return NextResponse.json({ 
        success: true, 
        subscription: null,
        message: 'No active subscription found' 
      });
    }

    // Get subscription details from Stripe
    let stripeSubscription = null;
    if (subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      subscription: {
        ...subscription,
        stripeData: stripeSubscription
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch subscription' 
    }, { status: 500 });
  }
}

// POST /api/billing/subscriptions - Create new subscription
export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { planId, paymentMethodId, couponCode } = body;

    if (!planId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plan ID is required' 
      }, { status: 400 });
    }

    // Get plan details
    const plan = await getPlanDetails(planId);
    if (!plan) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid plan ID' 
      }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId = await getStripeCustomerId(auth.userId);
    if (!customerId) {
      customerId = await createStripeCustomer(auth.userId, auth.email);
    }

    // Create Stripe subscription
    const subscriptionData = {
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    };

    if (couponCode) {
      subscriptionData.coupon = couponCode;
    }

    const stripeSubscription = await stripe.subscriptions.create(subscriptionData);

    // Save subscription to database
    const subscription = {
      userId: auth.userId,
      planId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customerId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.USER_SUBSCRIPTIONS,
      Item: subscription
    }));

    return NextResponse.json({ 
      success: true, 
      subscription,
      clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create subscription' 
    }, { status: 500 });
  }
}

// PUT /api/billing/subscriptions - Update subscription
export async function PUT(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

    const body = await request.json();
    const { action, planId, cancelAtPeriodEnd } = body;

    // Get current subscription
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USER_SUBSCRIPTIONS,
      Key: { userId: auth.userId }
    }));

    const subscription = result.Item;
    if (!subscription) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active subscription found' 
      }, { status: 404 });
    }

    let updatedSubscription;

    switch (action) {
      case 'change_plan':
        if (!planId) {
          return NextResponse.json({ 
            success: false, 
            error: 'Plan ID is required for plan change' 
          }, { status: 400 });
        }
        updatedSubscription = await changeSubscriptionPlan(subscription, planId);
        break;

      case 'cancel':
        updatedSubscription = await cancelSubscription(subscription, cancelAtPeriodEnd);
        break;

      case 'reactivate':
        updatedSubscription = await reactivateSubscription(subscription);
        break;

      case 'update_payment_method':
        updatedSubscription = await updatePaymentMethod(subscription);
        break;

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    // Update subscription in database
    await docClient.send(new PutCommand({
      TableName: TABLE_NAMES.USER_SUBSCRIPTIONS,
      Item: {
        ...subscription,
        ...updatedSubscription,
        updatedAt: getCurrentTimestamp()
      }
    }));

    return NextResponse.json({ 
      success: true, 
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update subscription' 
    }, { status: 500 });
  }
}

// Get plan details
async function getPlanDetails(planId) {
  const plans = {
    'free': {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: ['Basic posts', 'Community access', 'Basic support'],
      limits: {
        postsPerMonth: 10,
        storageGB: 1,
        maxTeamMembers: 1
      }
    },
    'pro': {
      id: 'pro',
      name: 'Pro',
      price: 29,
      interval: 'month',
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
      features: ['Unlimited posts', 'Advanced analytics', 'Priority support', 'Custom branding'],
      limits: {
        postsPerMonth: -1,
        storageGB: 10,
        maxTeamMembers: 5
      }
    },
    'enterprise': {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      interval: 'month',
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
      features: ['Everything in Pro', 'White-label solution', 'Dedicated support', 'Custom integrations'],
      limits: {
        postsPerMonth: -1,
        storageGB: 100,
        maxTeamMembers: -1
      }
    }
  };

  return plans[planId] || null;
}

// Get Stripe customer ID
async function getStripeCustomerId(userId) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAMES.USER_SUBSCRIPTIONS,
      Key: { userId }
    }));

    return result.Item?.stripeCustomerId || null;
  } catch (error) {
    console.error('Error getting Stripe customer ID:', error);
    return null;
  }
}

// Create Stripe customer
async function createStripeCustomer(userId, email) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId }
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Change subscription plan
async function changeSubscriptionPlan(subscription, newPlanId) {
  try {
    const newPlan = await getPlanDetails(newPlanId);
    if (!newPlan) {
      throw new Error('Invalid plan ID');
    }

    const stripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{ id: subscription.stripeSubscriptionId, price: newPlan.stripePriceId }],
      proration_behavior: 'create_prorations'
    });

    return {
      planId: newPlanId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    throw error;
  }
}

// Cancel subscription
async function cancelSubscription(subscription, cancelAtPeriodEnd = true) {
  try {
    const stripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd
    });

    return {
      status: stripeSubscription.status,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Reactivate subscription
async function reactivateSubscription(subscription) {
  try {
    const stripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    return {
      status: stripeSubscription.status,
      cancelAtPeriodEnd: false
    };
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

// Update payment method
async function updatePaymentMethod(subscription) {
  try {
    // Create setup intent for payment method update
    const setupIntent = await stripe.setupIntents.create({
      customer: subscription.stripeCustomerId,
      payment_method_types: ['card']
    });

    return {
      clientSecret: setupIntent.client_secret
    };
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
}
