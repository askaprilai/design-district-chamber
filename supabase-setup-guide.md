# MogulMomma Supabase + Vercel Setup Guide

## Prerequisites
- Supabase account
- Vercel account  
- Node.js installed locally
- Git repository for your project

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Set project name: `mogulmomma-platform`
5. Set database password (save this!)
6. Choose region closest to your users
7. Click "Create new project"

## Step 2: Set Up Database Schema

1. In Supabase dashboard, go to "SQL Editor"
2. Create a new query
3. Copy and paste the entire content from `database-schema.sql`
4. Click "Run" to execute the schema

## Step 3: Get Supabase Credentials

1. Go to Settings → API
2. Copy these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (for server-side operations)

## Step 4: Create Next.js Project Structure

```bash
npx create-next-app@latest mogulmomma-platform
cd mogulmomma-platform
npm install @supabase/supabase-js @stripe/stripe-js stripe
npm install @supabase/auth-helpers-nextjs
```

## Step 5: Environment Variables

Create `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Supabase Client Setup

Create `lib/supabase.js`:

```javascript
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side
export const createClient = () => createClientComponentClient()

// Server-side
export const createServerClient = () => createServerComponentClient({ cookies })

// Admin client (for server-side operations)
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

## Step 7: Authentication Setup

Enable authentication providers in Supabase:

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure Google/Facebook if desired
4. Set Site URL: `http://localhost:3000` (dev) / `https://yourdomain.com` (production)
5. Set Redirect URLs: `http://localhost:3000/auth/callback`

## Step 8: Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy!

## Step 9: Update Production URLs

After Vercel deployment:

1. Update Supabase redirect URLs to include your Vercel domain
2. Update NEXT_PUBLIC_APP_URL in Vercel environment variables
3. Redeploy if needed

## Database Operations Examples

### User Registration
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      first_name: 'Jane',
      last_name: 'Doe'
    }
  }
})
```

### Save Assessment Results
```javascript
const { data, error } = await supabase
  .from('assessment_results')
  .insert({
    user_id: user.id,
    archetype: 'Strategic Builder',
    identity_scores: [3, 2, 1, 2],
    direction_scores: [2, 3, 1, 2],
    craft_scores: [3, 2, 2, 1, 2, 2, 3],
    ai_interest: 2,
    ai_learning_style: 1
  })
```

### Get User's AI Generations
```javascript
const { data, error } = await supabase
  .from('ai_generations')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

## Next Steps

1. Implement authentication pages
2. Connect your HTML files to Next.js pages
3. Add API routes for AI integrations
4. Set up Stripe webhooks
5. Test the complete user flow

## Useful Supabase Features

- **Row Level Security (RLS)**: Automatically enabled for user data protection
- **Real-time subscriptions**: For live community features
- **Storage**: For user-uploaded images
- **Edge Functions**: For serverless API endpoints
- **Database webhooks**: For automated workflows

Your MogulMomma platform is now ready for development! 🚀