-- Impact Gamification Platform Database Schema
-- Tables: profiles, impact_points, quests, referrals
-- With Row Level Security (RLS) and indexes for performance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table - extends Clerk user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  onboarded_at TIMESTAMP WITH TIME ZONE,
  persona TEXT CHECK (persona IN ('eco_warrior', 'community_builder', 'health_focused', 'tech_innovator', 'social_impact', 'lifestyle_optimizer')),
  total_impact_score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Impact Points table - tracks all point transactions
CREATE TABLE public.impact_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  quest_id UUID,
  points INTEGER NOT NULL,
  activity_type TEXT NOT NULL, -- 'quest_completion', 'referral_bonus', 'daily_login', etc.
  description TEXT,
  metadata JSONB, -- flexible storage for activity-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quests table - available challenges/activities
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'environmental', 'health', 'community', etc.
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points_reward INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requirements JSONB, -- quest completion requirements
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false, -- daily/weekly quests
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly'
  max_completions INTEGER, -- null for unlimited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quest Completions - junction table for user quest completions
CREATE TABLE public.quest_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  evidence_url TEXT, -- optional photo/proof upload
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  points_awarded INTEGER DEFAULT 0,
  UNIQUE(user_id, quest_id, completed_at::date) -- prevent duplicate daily completions
);

-- Referrals table - track referral system
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  referred_user_id TEXT UNIQUE NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  bonus_points INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_total_impact_score ON public.profiles(total_impact_score DESC);
CREATE INDEX idx_profiles_persona ON public.profiles(persona);

CREATE INDEX idx_impact_points_user_id ON public.impact_points(user_id);
CREATE INDEX idx_impact_points_created_at ON public.impact_points(created_at DESC);
CREATE INDEX idx_impact_points_activity_type ON public.impact_points(activity_type);

CREATE INDEX idx_quests_category ON public.quests(category);
CREATE INDEX idx_quests_active ON public.quests(is_active) WHERE is_active = true;
CREATE INDEX idx_quests_recurring ON public.quests(is_recurring) WHERE is_recurring = true;

CREATE INDEX idx_quest_completions_user_id ON public.quest_completions(user_id);
CREATE INDEX idx_quest_completions_quest_id ON public.quest_completions(quest_id);
CREATE INDEX idx_quest_completions_completed_at ON public.quest_completions(completed_at DESC);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_user_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can only read/write their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');

-- Public read access for leaderboards (aggregate data only)
CREATE POLICY "Public leaderboard access" ON public.profiles
  FOR SELECT USING (true);

-- Impact Points policies - users can only see their own points
CREATE POLICY "Users can view own points" ON public.impact_points
  FOR SELECT USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can insert own points" ON public.impact_points
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');

-- Quests policies - public read access, admin write
CREATE POLICY "Anyone can view active quests" ON public.quests
  FOR SELECT USING (is_active = true);

-- Quest Completions policies - users can only manage their own completions
CREATE POLICY "Users can view own completions" ON public.quest_completions
  FOR SELECT USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can insert own completions" ON public.quest_completions
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can update own completions" ON public.quest_completions
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

-- Referrals policies - users can see their referrals
CREATE POLICY "Users can view own referrals as referrer" ON public.referrals
  FOR SELECT USING (referrer_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can view own referrals as referred" ON public.referrals
  FOR SELECT USING (referred_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (
    referrer_user_id = current_setting('request.jwt.claims')::json->>'sub' OR
    referred_user_id = current_setting('request.jwt.claims')::json->>'sub'
  );

-- Leaderboard Views (aggregate-only access)
CREATE VIEW public.leaderboard_global AS
SELECT 
  rank() OVER (ORDER BY total_impact_score DESC) as rank,
  display_name,
  total_impact_score,
  level,
  persona
FROM public.profiles 
WHERE total_impact_score > 0
ORDER BY total_impact_score DESC;

CREATE VIEW public.leaderboard_by_persona AS
SELECT 
  persona,
  rank() OVER (PARTITION BY persona ORDER BY total_impact_score DESC) as rank,
  display_name,
  total_impact_score,
  level
FROM public.profiles 
WHERE total_impact_score > 0 AND persona IS NOT NULL
ORDER BY persona, total_impact_score DESC;

-- Functions for common operations
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id TEXT,
  p_points INTEGER,
  p_activity_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_quest_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_point_id UUID;
BEGIN
  -- Insert impact points record
  INSERT INTO public.impact_points (user_id, quest_id, points, activity_type, description, metadata)
  VALUES (p_user_id, p_quest_id, p_points, p_activity_type, p_description, p_metadata)
  RETURNING id INTO v_point_id;
  
  -- Update user's total score
  UPDATE public.profiles 
  SET 
    total_impact_score = total_impact_score + p_points,
    level = LEAST(100, GREATEST(1, (total_impact_score + p_points) / 1000 + 1)),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN v_point_id;
END;
$$;

-- Trigger to automatically update profile scores
CREATE OR REPLACE FUNCTION public.update_profile_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    total_impact_score = (
      SELECT COALESCE(SUM(points), 0) 
      FROM public.impact_points 
      WHERE user_id = NEW.user_id
    ),
    level = LEAST(100, GREATEST(1, (
      SELECT COALESCE(SUM(points), 0) 
      FROM public.impact_points 
      WHERE user_id = NEW.user_id
    ) / 1000 + 1)),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_profile_score
  AFTER INSERT ON public.impact_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_score();