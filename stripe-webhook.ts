import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase environment variables are not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found');
    return NextResponse.json(
      { error: 'No Stripe signature found' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  const userId = session.metadata?.user_id;
  const subscriptionId = session.subscription as string;
  const customerEmail = session.customer_details?.email;
  
  if (!userId) {
    console.error('No user_id found in checkout session metadata');
    return;
  }

  try {
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    
    // Determine subscription tier based on price ID
    let tier = 'basic';
    let features: string[] = [];
    let monthlyCredits = 100;

    switch (priceId) {
      case process.env.STRIPE_BASIC_PRICE_ID:
        tier = 'basic';
        features = ['unlimited_quests', 'basic_analytics', 'community_access'];
        monthlyCredits = 100;
        break;
      case process.env.STRIPE_PRO_PRICE_ID:
        tier = 'pro';
        features = ['unlimited_quests', 'advanced_analytics', 'priority_support', 'custom_challenges'];
        monthlyCredits = 500;
        break;
      case process.env.STRIPE_ENTERPRISE_PRICE_ID:
        tier = 'enterprise';
        features = ['everything', 'white_label', 'api_access', 'dedicated_support'];
        monthlyCredits = 2000;
        break;
      default:
        console.warn(`Unknown price ID: ${priceId}`);
    }

    // Update user profile with subscription details
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        subscription_status: subscription.status,
        subscription_features: features,
        monthly_credits: monthlyCredits,
        credits_remaining: monthlyCredits,
        subscription_started_at: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      throw profileError;
    }

    // Award welcome bonus points for subscribing
    const welcomeBonus = tier === 'basic' ? 500 : tier === 'pro' ? 1000 : 2000;
    
    const { error: pointsError } = await supabase.rpc('award_points', {
      p_user_id: userId,
      p_points: welcomeBonus,
      p_activity_type: 'subscription_bonus',
      p_description: `Welcome bonus for ${tier} subscription`,
      p_metadata: {
        subscription_id: subscriptionId,
        tier: tier,
        checkout_session_id: session.id,
      },
    });

    if (pointsError) {
      console.error('Error awarding welcome bonus points:', pointsError);
      // Don't throw here, as subscription is more critical than bonus points
    }

    // Log the subscription event
    console.log(`Successfully processed subscription for user ${userId}: ${tier} tier`);

    // Optional: Send welcome email or notification
    await sendSubscriptionWelcomeNotification(userId, tier, customerEmail);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription.created:', subscription.id);
  
  // This is typically handled in checkout.session.completed, 
  // but we can use this as a backup or for direct subscription creation
  
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !profile) {
    console.error('Could not find user for subscription:', subscription.id);
    return;
  }

  // Update subscription status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_started_at: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.user_id);

  if (updateError) {
    console.error('Error updating subscription status:', updateError);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription.updated:', subscription.id);

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription.deleted:', subscription.id);

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      subscription_id: null,
      subscription_features: ['basic_quests'],
      monthly_credits: 10,
      credits_remaining: 10,
      subscription_ends_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('subscription_id', subscription.id);

  if (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  if (invoice.billing_reason === 'subscription_cycle') {
    // Renew credits for monthly billing cycle
    const subscriptionId = invoice.subscription as string;
    
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, monthly_credits, subscription_tier')
      .eq('subscription_id', subscriptionId)
      .single();

    if (fetchError || !profile) {
      console.error('Could not find user for invoice:', invoice.id);
      return;
    }

    // Reset monthly credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits_remaining: profile.monthly_credits,
        subscription_ends_at: new Date(invoice.period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.user_id);

    if (updateError) {
      console.error('Error resetting monthly credits:', updateError);
    }

    // Award loyalty bonus points for continued subscription
    const loyaltyBonus = profile.subscription_tier === 'basic' ? 100 : 
                        profile.subscription_tier === 'pro' ? 200 : 300;

    await supabase.rpc('award_points', {
      p_user_id: profile.user_id,
      p_points: loyaltyBonus,
      p_activity_type: 'loyalty_bonus',
      p_description: `Monthly loyalty bonus for ${profile.subscription_tier} subscription`,
      p_metadata: {
        invoice_id: invoice.id,
        billing_period: invoice.period_start,
      },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  const subscriptionId = invoice.subscription as string;
  
  // Mark subscription as past due
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription status for failed payment:', error);
  }

  // Could also implement grace period logic or send notification emails here
}

async function sendSubscriptionWelcomeNotification(
  userId: string, 
  tier: string, 
  email: string | null
) {
  // Implementation depends on your notification system
  // Could use email service, push notifications, or in-app notifications
  
  console.log(`Welcome notification sent to user ${userId} for ${tier} subscription`);
  
  // Example: Create in-app notification
  // await supabase
  //   .from('notifications')
  //   .insert({
  //     user_id: userId,
  //     type: 'subscription_welcome',
  //     title: `Welcome to ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`,
  //     message: `Your ${tier} subscription is now active. Start earning impact points!`,
  //     metadata: { tier },
  //   });
}