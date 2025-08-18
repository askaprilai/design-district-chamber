-- MogulMomma Database Schema
-- Complete database structure for member management and AI tools

-- ================================
-- USER MANAGEMENT TABLES
-- ================================

-- Users table for authentication and basic info
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Subscriptions table for membership management
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'monthly', -- monthly, annual
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, canceled, past_due, unpaid
    amount_cents INTEGER NOT NULL DEFAULT 9700, -- $97.00
    currency VARCHAR(3) DEFAULT 'USD',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment results storage
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    archetype VARCHAR(100) NOT NULL, -- Strategic Builder, Transformational Guide, etc.
    identity_scores JSONB NOT NULL, -- [score1, score2, score3, score4]
    direction_scores JSONB NOT NULL,
    craft_scores JSONB NOT NULL,
    ai_interest INTEGER, -- 0-3 scale
    ai_learning_style INTEGER, -- 0-3 scale
    custom_notes JSONB, -- {identity: "...", direction: "...", craft: "..."}
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AI TOOLS & PROJECTS TABLES
-- ================================

-- Projects table for organizing user work
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL, -- roadmap, brand, content, coaching, document
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, completed, archived
    data JSONB NOT NULL DEFAULT '{}', -- Flexible storage for project-specific data
    settings JSONB DEFAULT '{}', -- User preferences and configurations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI generations table for storing all AI-generated content
CREATE TABLE ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tool_type VARCHAR(50) NOT NULL, -- roadmap, brand, content, coach, document
    input_prompt TEXT NOT NULL,
    input_parameters JSONB, -- Additional parameters like timeline, audience, etc.
    output_content JSONB NOT NULL, -- The generated content
    tokens_used INTEGER DEFAULT 0,
    generation_time_ms INTEGER,
    model_version VARCHAR(50) DEFAULT 'gpt-4',
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_notes TEXT,
    is_saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roadmap generations (specific structure for roadmaps)
CREATE TABLE roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES ai_generations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    goal_description TEXT NOT NULL,
    timeline_months INTEGER NOT NULL DEFAULT 12,
    phases JSONB NOT NULL, -- Array of phases with steps, timelines, resources
    milestones JSONB, -- Key milestones and deadlines
    resources JSONB, -- Recommended resources and tools
    next_steps TEXT,
    progress_tracking JSONB DEFAULT '{}', -- User's progress on each step
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand identity generations
CREATE TABLE brand_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES ai_generations(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    business_description TEXT NOT NULL,
    target_audience VARCHAR(255),
    brand_names JSONB, -- Array of suggested names
    color_palette JSONB, -- Colors with hex codes
    typography JSONB, -- Font recommendations
    voice_attributes JSONB, -- Brand voice characteristics
    taglines JSONB, -- Array of tagline options
    positioning_statement TEXT,
    messaging_pillars JSONB, -- Key messaging themes
    visual_style_notes TEXT,
    logo_concepts JSONB, -- Logo design concepts and descriptions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content generations
CREATE TABLE content_pieces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES ai_generations(id) ON DELETE CASCADE,
    content_type VARCHAR(100) NOT NULL, -- linkedin-post, email, blog, etc.
    title VARCHAR(255),
    content_brief TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    hashtags JSONB, -- Array of hashtags
    optimization_tips JSONB, -- SEO and engagement tips
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    engagement_stats JSONB, -- If connected to social platforms
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI coaching conversations
CREATE TABLE coaching_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_title VARCHAR(255),
    conversation_data JSONB NOT NULL, -- Array of message exchanges
    topic_tags JSONB, -- Tags for categorizing conversations
    mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
    mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
    key_insights TEXT,
    action_items JSONB, -- Follow-up actions suggested
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document generations (business plans, contracts, etc.)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES ai_generations(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- business-plan, contract, proposal, etc.
    title VARCHAR(255) NOT NULL,
    document_content JSONB NOT NULL, -- Structured document sections
    template_used VARCHAR(255),
    variables JSONB, -- User-specific variables filled in
    export_format VARCHAR(50) DEFAULT 'pdf', -- pdf, docx, etc.
    is_finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- COMMUNITY & ENGAGEMENT TABLES
-- ================================

-- Community posts and discussions
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    post_type VARCHAR(50) DEFAULT 'discussion', -- discussion, celebration, question, resource
    tags JSONB, -- Array of tags
    is_anonymous BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community post comments
CREATE TABLE community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User coaching sessions (human coaches)
CREATE TABLE coaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id), -- Internal coach user
    session_type VARCHAR(50) NOT NULL, -- group, individual, workshop
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    zoom_link VARCHAR(500),
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, canceled, no-show
    notes TEXT, -- Post-session notes
    recording_url VARCHAR(500),
    homework JSONB, -- Action items assigned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI image generations
CREATE TABLE ai_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES ai_generations(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    style VARCHAR(100) NOT NULL, -- professional, modern, minimalist, etc.
    dimensions VARCHAR(20) NOT NULL, -- 1024x1024, 1792x1024, etc.
    quality VARCHAR(20) DEFAULT 'standard', -- standard, hd
    image_type VARCHAR(50) NOT NULL, -- brand, social, marketing, personal
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size_bytes INTEGER,
    model_version VARCHAR(50) DEFAULT 'dall-e-3',
    is_favorite BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image collections for organizing images
CREATE TABLE image_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    image_ids JSONB DEFAULT '[]', -- Array of image IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- ANALYTICS & TRACKING TABLES
-- ================================

-- User activity tracking
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- login, ai_generation, project_created, etc.
    activity_data JSONB, -- Flexible data storage for activity details
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage metrics for billing and analytics
CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- ai_tokens, generations_count, storage_mb, etc.
    metric_value INTEGER NOT NULL,
    billing_period DATE NOT NULL, -- First day of the month
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, metric_type, billing_period)
);

-- AI model performance tracking
CREATE TABLE ai_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    tool_type VARCHAR(50) NOT NULL,
    avg_response_time_ms INTEGER,
    avg_token_usage INTEGER,
    success_rate DECIMAL(5,4), -- 0.0000 to 1.0000
    user_satisfaction_avg DECIMAL(3,2), -- 1.00 to 5.00
    total_generations INTEGER,
    date_tracked DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(model_name, tool_type, date_tracked)
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- User and subscription indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Project and AI generation indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_type_status ON projects(project_type, status);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);
CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_project_id ON ai_generations(project_id);
CREATE INDEX idx_ai_generations_tool_type ON ai_generations(tool_type);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at);

-- Content and coaching indexes
CREATE INDEX idx_content_pieces_user_id ON content_pieces(user_id);
CREATE INDEX idx_content_pieces_type ON content_pieces(content_type);
CREATE INDEX idx_coaching_conversations_user_id ON coaching_conversations(user_id);
CREATE INDEX idx_coaching_sessions_user_id ON coaching_sessions(user_id);
CREATE INDEX idx_coaching_sessions_scheduled_for ON coaching_sessions(scheduled_for);

-- AI images indexes
CREATE INDEX idx_ai_images_user_id ON ai_images(user_id);
CREATE INDEX idx_ai_images_project_id ON ai_images(project_id);
CREATE INDEX idx_ai_images_type ON ai_images(image_type);
CREATE INDEX idx_ai_images_created_at ON ai_images(created_at);
CREATE INDEX idx_image_collections_user_id ON image_collections(user_id);

-- Community indexes
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);

-- Analytics indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type_created ON user_activities(activity_type, created_at);
CREATE INDEX idx_usage_metrics_user_period ON usage_metrics(user_id, billing_period);

-- ================================
-- SAMPLE DATA INSERTS
-- ================================

-- Sample user
INSERT INTO users (email, password_hash, first_name, last_name, email_verified) VALUES
('sarah@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewCnQfzPOUCFGEo6', 'Sarah', 'Johnson', true);

-- Sample subscription
INSERT INTO subscriptions (user_id, stripe_customer_id, status, current_period_start, current_period_end) VALUES
((SELECT id FROM users WHERE email = 'sarah@example.com'), 'cus_test123', 'active', NOW(), NOW() + INTERVAL '1 month');

-- Sample assessment result
INSERT INTO assessment_results (user_id, archetype, identity_scores, direction_scores, craft_scores, ai_interest, ai_learning_style) VALUES
((SELECT id FROM users WHERE email = 'sarah@example.com'), 'The Strategic Builder', '[3,2,1,2]', '[2,3,1,2]', '[3,2,2,1,2,2,3]', 2, 1);

-- ================================
-- FUNCTIONS AND TRIGGERS
-- ================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON roadmaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_identities_updated_at BEFORE UPDATE ON brand_identities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_pieces_updated_at BEFORE UPDATE ON content_pieces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coaching_conversations_updated_at BEFORE UPDATE ON coaching_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coaching_sessions_updated_at BEFORE UPDATE ON coaching_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to track user activities
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(100),
    p_activity_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activities (user_id, activity_type, activity_data)
    VALUES (p_user_id, p_activity_type, p_activity_data)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage metrics
CREATE OR REPLACE FUNCTION increment_usage_metric(
    p_user_id UUID,
    p_metric_type VARCHAR(100),
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    current_period DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
    INSERT INTO usage_metrics (user_id, metric_type, metric_value, billing_period)
    VALUES (p_user_id, p_metric_type, p_increment, current_period)
    ON CONFLICT (user_id, metric_type, billing_period)
    DO UPDATE SET metric_value = usage_metrics.metric_value + p_increment;
END;
$$ LANGUAGE plpgsql;