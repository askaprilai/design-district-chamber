const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Raw body parser for webhook signature verification
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

// JSON parser for other routes
app.use(express.json());

// In-memory storage for demo (use a real database in production)
const subscribers = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ask Buddha Stripe Backend is running' });
});

// Get Stripe publishable key
app.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// Create subscription checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { customerEmail } = req.body;

    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.SUBSCRIPTION_PRICE_ID, // You'll need to create this in Stripe Dashboard
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
      metadata: {
        service: 'ask-buddha'
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify subscription status
app.post('/verify-subscription', async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Store subscription info (use a real database in production)
      subscribers.set(session.customer_email, {
        customerId: session.customer,
        subscriptionId: subscription.id,
        status: subscription.status,
        createdAt: new Date()
      });

      res.json({
        isValid: true,
        customerEmail: session.customer_email,
        subscriptionStatus: subscription.status
      });
    } else {
      res.json({ isValid: false });
    }
  } catch (error) {
    console.error('Error verifying subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check subscription status by email
app.post('/check-subscription', async (req, res) => {
  try {
    const { email } = req.body;
    
    const subscriberInfo = subscribers.get(email);
    
    if (subscriberInfo) {
      // Verify with Stripe that subscription is still active
      const subscription = await stripe.subscriptions.retrieve(subscriberInfo.subscriptionId);
      
      res.json({
        isSubscribed: subscription.status === 'active',
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
      });
    } else {
      res.json({ isSubscribed: false });
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create customer portal session for subscription management
app.post('/create-portal-session', async (req, res) => {
  try {
    const { customerEmail } = req.body;
    
    const subscriberInfo = subscribers.get(customerEmail);
    
    if (!subscriberInfo) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscriberInfo.customerId,
      return_url: process.env.FRONTEND_URL || 'http://localhost:3000',
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler
app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      console.log('Subscription created:', event.data.object);
      break;
    
    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object);
      // Update subscription status in your database
      break;
    
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', event.data.object);
      // Remove subscription from your database
      const subscription = event.data.object;
      for (const [email, info] of subscribers.entries()) {
        if (info.subscriptionId === subscription.id) {
          subscribers.delete(email);
          console.log(`Removed subscription for ${email}`);
          break;
        }
      }
      break;
    
    case 'invoice.payment_succeeded':
      console.log('Payment succeeded:', event.data.object);
      break;
    
    case 'invoice.payment_failed':
      console.log('Payment failed:', event.data.object);
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get all subscribers (admin endpoint)
app.get('/admin/subscribers', (req, res) => {
  const subscriberList = Array.from(subscribers.entries()).map(([email, info]) => ({
    email,
    ...info
  }));
  
  res.json({
    total: subscriberList.length,
    subscribers: subscriberList
  });
});

// Start server
app.listen(port, () => {
  console.log(`🧘‍♂️ Ask Buddha Stripe Backend running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${port}/health`);
});