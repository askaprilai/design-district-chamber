# NYC Impact Gamification Platform

A Next.js-based gamification platform that transforms positive impact actions into an engaging NYC-themed game experience. Help communities across New York's five boroughs while earning points, leveling up, and competing on leaderboards.

## 🏙️ Features

- **NYC-Themed Interactive Map**: Navigate real NYC neighborhoods and streets
- **Impact Quest System**: Complete meaningful community service activities
- **Persona-Based Routing**: 6-question quiz to determine your impact style
- **Real-Time Leaderboards**: Compete with other impact makers
- **Stripe Integration**: Subscription management with tiered features
- **Clerk Authentication**: Secure user management
- **Supabase Backend**: Real-time database with Row Level Security

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account  
- Stripe account

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY` 
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 3. Set Up Supabase Database

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Enable Row Level Security on all tables

### 4. Configure Stripe

1. Create products and prices in Stripe dashboard
2. Set up webhook endpoint: `your-domain.com/api/webhooks/stripe`
3. Add webhook secret to environment variables

### 5. Configure Clerk

1. Set up authentication in Clerk dashboard
2. Configure social providers (optional)
3. Set up webhook for user events

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🗽 NYC Game Features

### Interactive NYC Map
- Navigate through Manhattan, Brooklyn, Queens, Bronx, and Staten Island
- Real neighborhood detection and notifications
- Authentic NYC street grid layout
- Iconic landmarks like Central Park

### Impact Quest Locations
- **Harlem Community Center** - Community volunteering
- **Brooklyn Food Bank** - Food distribution assistance  
- **Manhattan Tech Hub** - Youth coding education
- **Bronx Health Clinic** - Health screening support
- **Queens Environmental Project** - Urban gardening
- **Financial District Relief** - Disaster recovery efforts

### Persona Types
1. **Eco Warrior** 🌱 - Environmental sustainability focus
2. **Community Builder** 🤝 - Social connection and local impact
3. **Health Advocate** ❤️ - Wellness and mental health promotion
4. **Tech Innovator** 💻 - Technology for social good
5. **Social Impact Leader** ✊ - Social justice and systemic change
6. **Lifestyle Optimizer** ⚡ - Personal productivity and development

## 📁 Project Structure

```
├── app/
│   ├── api/webhooks/stripe/    # Stripe webhook handlers
│   ├── components/             # React components
│   ├── dashboard/             # Dashboard pages
│   ├── globals.css           # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx            # Landing page
├── components/
│   ├── leaderboard.tsx     # Leaderboard component
│   ├── phaser-game.tsx     # NYC-themed Phaser game
│   ├── routing-quiz.tsx    # Persona determination quiz
│   └── stripe-webhook.ts   # Stripe webhook logic
├── supabase-schema.sql     # Database schema
├── next.config.js         # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json         # Dependencies
```

## 🎮 Game Controls

- **WASD** or **Arrow Keys**: Move around NYC
- **Click Quest Zones**: Interact with impact opportunities
- **Click Landmarks**: Learn about NYC locations

## 🏆 Scoring System

- **Community Service**: 200-300 points
- **Health Initiatives**: 150-250 points  
- **Environmental Projects**: 175-200 points
- **Tech Education**: 250-300 points
- **Disaster Relief**: 400+ points
- **Daily Login Bonus**: 50 points
- **Referral Bonus**: 100 points

## 🔧 Development

### Database Migrations

```bash
npm run db:migrate
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 📊 Analytics

The platform integrates with PostHog for user analytics and behavior tracking.

## 🔒 Security

- Row Level Security (RLS) enforced on all database operations
- Secure webhook handling with signature verification
- Environment variable validation
- Input sanitization on all user inputs

## 🌍 Impact Tracking

Users can track their real-world impact through:
- Volunteer hours logged
- Points earned through verified activities  
- Community challenges completed
- Environmental initiatives supported

## 📞 Support

For issues and questions:
- Check the GitHub Issues
- Review the documentation
- Contact the development team

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for NYC communities