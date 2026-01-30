import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import Stripe from 'stripe';

// Stub: AWS DynamoDB removed; subscription data could be moved to Supabase
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) : null;

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  return NextResponse.json({ success: true, subscription: null, message: 'No active subscription found' });
}

export async function POST(request) {
  const auth = requireAuth(request);
  if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const body = await request.json().catch(() => ({}));
  if (!body.priceId) {
    return NextResponse.json({ success: false, error: 'Price ID is required' }, { status: 400 });
  }
  if (!stripe) return NextResponse.json({ success: false, error: 'Stripe not configured' }, { status: 503 });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: body.priceId, quantity: 1 }],
      success_url: body.successUrl || `${request.url ? new URL(request.url).origin : ''}/dashboard?subscription=success`,
      cancel_url: body.cancelUrl || `${request.url ? new URL(request.url).origin : ''}/dashboard`,
      client_reference_id: auth.userId,
    });
    return NextResponse.json({ success: true, url: session.url, sessionId: session.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || 'Stripe error' }, { status: 500 });
  }
}
