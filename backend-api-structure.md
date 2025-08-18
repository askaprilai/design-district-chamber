# MogulMomma Backend API Structure

## Tech Stack Recommendations

### Core Framework
- **Node.js + Express.js** or **Python + FastAPI** 
- **PostgreSQL** database (see database-schema.sql)
- **Redis** for caching and session management
- **Stripe** for payment processing
- **OpenAI API** for AI generations
- **AWS S3** for file storage
- **SendGrid** for email services

### Authentication & Security
- **JWT tokens** for authentication
- **bcrypt** for password hashing
- **Rate limiting** for API protection
- **CORS** configuration
- **Input validation** with Joi/Zod

## API Endpoints Structure

### 🔐 Authentication Endpoints

```javascript
// Authentication routes
POST /api/auth/register
POST /api/auth/login  
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/verify-email/:token
```

### 👤 User Management

```javascript
// User profile routes
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/account
GET    /api/users/subscription
PUT    /api/users/subscription
```

### 💳 Subscription & Billing

```javascript
// Stripe integration routes
POST /api/billing/create-subscription
POST /api/billing/update-subscription
POST /api/billing/cancel-subscription
GET  /api/billing/invoices
POST /api/billing/create-portal-session
POST /api/webhook/stripe  // Stripe webhooks
```

### 📝 Assessment System

```javascript
// Assessment routes
POST /api/assessment/submit
GET  /api/assessment/results/:userId
PUT  /api/assessment/results/:id
GET  /api/assessment/analytics
```

### 🤖 AI Tools Endpoints

```javascript
// Roadmap Builder
POST /api/ai/roadmap/generate
GET  /api/ai/roadmap/:id
PUT  /api/ai/roadmap/:id
DELETE /api/ai/roadmap/:id
POST /api/ai/roadmap/:id/export

// Brand Creator
POST /api/ai/brand/generate
GET  /api/ai/brand/:id
PUT  /api/ai/brand/:id
DELETE /api/ai/brand/:id
POST /api/ai/brand/:id/export

// Content Generator
POST /api/ai/content/generate
GET  /api/ai/content/:id
PUT  /api/ai/content/:id
DELETE /api/ai/content/:id
POST /api/ai/content/:id/schedule

// AI Coach
POST /api/ai/coach/ask
GET  /api/ai/coach/conversations
GET  /api/ai/coach/conversation/:id
PUT  /api/ai/coach/conversation/:id
DELETE /api/ai/coach/conversation/:id

// Document Generator
POST /api/ai/document/generate
GET  /api/ai/document/:id
PUT  /api/ai/document/:id
DELETE /api/ai/document/:id
POST /api/ai/document/:id/export
```

### 💼 Project Management

```javascript
// Project routes
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/duplicate
GET    /api/projects/:id/analytics
```

### 👥 Community Features

```javascript
// Community routes
GET    /api/community/posts
POST   /api/community/posts
GET    /api/community/posts/:id
PUT    /api/community/posts/:id
DELETE /api/community/posts/:id
POST   /api/community/posts/:id/like
POST   /api/community/posts/:id/comments
```

### 📊 Analytics & Usage

```javascript
// Analytics routes
GET /api/analytics/dashboard
GET /api/analytics/usage
GET /api/analytics/ai-performance
GET /api/analytics/user-activity
```

## Sample Implementation (Node.js/Express)

### 1. Server Setup

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});

// Redis connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/billing', require('./routes/billing'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MogulMomma API running on port ${PORT}`);
});
```

### 2. Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const userResult = await db.query(
      'SELECT id, email, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireSubscription = async (req, res, next) => {
  try {
    const subscriptionResult = await db.query(
      'SELECT status FROM subscriptions WHERE user_id = $1 AND status = $2',
      [req.user.id, 'active']
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Active subscription required',
        upgrade_url: '/pricing'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Subscription check failed' });
  }
};

module.exports = { authenticateToken, requireSubscription };
```

### 3. AI Service Integration

```javascript
// services/aiService.js
const OpenAI = require('openai');
const { Pool } = require('pg');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

class AIService {
  async generateRoadmap(userId, prompt, timeline, projectId = null) {
    try {
      const startTime = Date.now();
      
      // Get user's assessment results for personalization
      const assessmentResult = await db.query(
        'SELECT archetype, ai_interest, ai_learning_style FROM assessment_results WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 1',
        [userId]
      );

      const userContext = assessmentResult.rows[0] || {};
      
      // Create personalized system prompt
      const systemPrompt = this.createRoadmapSystemPrompt(userContext);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Create a detailed ${timeline} roadmap for: ${prompt}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const generationTime = Date.now() - startTime;
      const tokensUsed = completion.usage.total_tokens;
      
      // Parse and structure the response
      const roadmapData = this.parseRoadmapResponse(completion.choices[0].message.content);
      
      // Save to database
      const generationResult = await db.query(
        `INSERT INTO ai_generations (user_id, project_id, tool_type, input_prompt, input_parameters, output_content, tokens_used, generation_time_ms, model_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          userId,
          projectId,
          'roadmap',
          prompt,
          JSON.stringify({ timeline }),
          JSON.stringify(roadmapData),
          tokensUsed,
          generationTime,
          'gpt-4'
        ]
      );

      // Track usage metrics
      await this.incrementUsageMetric(userId, 'ai_generations');
      await this.incrementUsageMetric(userId, 'ai_tokens', tokensUsed);

      return {
        id: generationResult.rows[0].id,
        roadmap: roadmapData,
        tokensUsed,
        generationTime
      };

    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new Error('Failed to generate roadmap');
    }
  }

  createRoadmapSystemPrompt(userContext) {
    const archetype = userContext.archetype || 'The Strategic Builder';
    const aiInterest = userContext.ai_interest || 0;
    
    let aiGuidance = '';
    if (aiInterest >= 2) {
      aiGuidance = 'Include specific AI tools and automation recommendations in the roadmap.';
    }

    return `You are an expert business coach specializing in helping accomplished women transition careers. 
    
    The user is "${archetype}" which means they prefer strategic, actionable plans with clear milestones.
    
    Create a detailed roadmap that includes:
    - Specific phases with clear timelines
    - Actionable steps with resource recommendations
    - Risk mitigation strategies
    - Key milestones and success metrics
    - Financial considerations
    - Networking and relationship building opportunities
    ${aiGuidance}
    
    Format the response as structured phases with clear action items. Be specific and practical.`;
  }

  parseRoadmapResponse(content) {
    // Parse the AI response into structured data
    // This would include logic to extract phases, steps, timelines, etc.
    // For now, returning a structured example
    return {
      title: "Your Personalized Roadmap",
      timeline: "12 months",
      phases: [
        {
          name: "Foundation Phase",
          duration: "Months 1-2",
          steps: [
            "Define your niche and target market",
            "Conduct market research and validation",
            "Develop your unique value proposition"
          ]
        }
        // More phases...
      ],
      milestones: [
        "First paying client by month 3",
        "Break-even by month 6"
      ],
      resources: [
        "Recommended books and courses",
        "Networking events and communities"
      ]
    };
  }

  async incrementUsageMetric(userId, metricType, value = 1) {
    await db.query(
      'SELECT increment_usage_metric($1, $2, $3)',
      [userId, metricType, value]
    );
  }
}

module.exports = new AIService();
```

### 4. API Route Example

```javascript
// routes/ai.js
const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');
const { authenticateToken, requireSubscription } = require('../middleware/auth');

// Generate roadmap
router.post('/roadmap/generate', authenticateToken, requireSubscription, async (req, res) => {
  try {
    const { prompt, timeline, projectId } = req.body;
    
    // Validation
    if (!prompt || !timeline) {
      return res.status(400).json({ 
        error: 'Prompt and timeline are required' 
      });
    }

    const roadmap = await AIService.generateRoadmap(
      req.user.id, 
      prompt, 
      timeline, 
      projectId
    );

    res.json({
      success: true,
      data: roadmap
    });

  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({
      error: 'Failed to generate roadmap',
      message: error.message
    });
  }
});

// Get user's roadmaps
router.get('/roadmaps', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, ag.created_at, ag.tokens_used 
       FROM roadmaps r 
       JOIN ai_generations ag ON r.generation_id = ag.id 
       WHERE r.user_id = $1 
       ORDER BY ag.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch roadmaps'
    });
  }
});

module.exports = router;
```

### 5. Stripe Integration

```javascript
// services/stripeService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

class StripeService {
  async createSubscription(userId, priceId) {
    try {
      // Get user details
      const userResult = await db.query(
        'SELECT email, first_name, last_name FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        metadata: {
          userId: userId
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to database
      await db.query(
        `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          subscription.id,
          customer.id,
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000)
        ]
      );

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      };

    } catch (error) {
      console.error('Stripe subscription error:', error);
      throw error;
    }
  }

  async handleWebhook(event) {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
    }
  }

  async handlePaymentSucceeded(invoice) {
    await db.query(
      'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
      ['active', invoice.subscription]
    );
  }

  async handlePaymentFailed(invoice) {
    await db.query(
      'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
      ['past_due', invoice.subscription]
    );
  }
}

module.exports = new StripeService();
```

## Deployment Recommendations

### Infrastructure
- **Hosting**: AWS, DigitalOcean, or Railway
- **Database**: AWS RDS PostgreSQL or Supabase
- **File Storage**: AWS S3 or Cloudflare R2
- **CDN**: CloudFlare
- **Monitoring**: Sentry for error tracking
- **Analytics**: Mixpanel or PostHog

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# External APIs
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Email
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@mogulmomma.com

# Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=mogulmomma-uploads

# App Settings
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

This structure provides a complete foundation for your MogulMomma backend with AI tools, subscription management, and member data storage.