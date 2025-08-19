-- Design District Chamber of Commerce Database Schema
-- Tables: chamber_waitlist, email_templates
-- With auto-responder functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Waitlist table for Design District Chamber
CREATE TABLE public.chamber_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  interest_areas TEXT[], -- array of interests like ['networking', 'events', 'membership']
  membership_tier TEXT CHECK (membership_tier IN ('individual', 'studio', 'corporate')),
  referral_source TEXT, -- how they heard about us
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'converted', 'unsubscribed')),
  notes TEXT,
  subscribed_to_updates BOOLEAN DEFAULT true,
  auto_responder_sent BOOLEAN DEFAULT false,
  auto_responder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates for auto-responders
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('welcome', 'reminder', 'announcement')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email logs to track sent emails
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waitlist_id UUID REFERENCES public.chamber_waitlist(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  provider_message_id TEXT, -- from email service provider
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chamber_waitlist_email ON public.chamber_waitlist(email);
CREATE INDEX idx_chamber_waitlist_status ON public.chamber_waitlist(status);
CREATE INDEX idx_chamber_waitlist_created_at ON public.chamber_waitlist(created_at DESC);
CREATE INDEX idx_chamber_waitlist_auto_responder ON public.chamber_waitlist(auto_responder_sent, created_at);

CREATE INDEX idx_email_logs_waitlist_id ON public.email_logs(waitlist_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);

-- Row Level Security (RLS) - Public can insert waitlist, admin can view
ALTER TABLE public.chamber_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Allow public to insert into waitlist (for website form)
CREATE POLICY "Anyone can join waitlist" ON public.chamber_waitlist
  FOR INSERT TO anon WITH CHECK (true);

-- Admin/authenticated users can view and manage waitlist
CREATE POLICY "Admin can view waitlist" ON public.chamber_waitlist
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin' OR
    current_setting('request.jwt.claims', true)::json->>'email' = 'apriljsabral@gmail.com'
  );

-- Email templates - admin only
CREATE POLICY "Admin can manage email templates" ON public.email_templates
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin' OR
    current_setting('request.jwt.claims', true)::json->>'email' = 'apriljsabral@gmail.com'
  );

-- Email logs - admin only
CREATE POLICY "Admin can view email logs" ON public.email_logs
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin' OR
    current_setting('request.jwt.claims', true)::json->>'email' = 'apriljsabral@gmail.com'
  );

-- Insert default welcome email template with your custom message
INSERT INTO public.email_templates (name, subject, html_content, text_content, template_type) VALUES (
  'chamber_welcome',
  'Welcome to the Design District Chamber of Commerce!',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Design District Chamber</title>
    <style>
        body { font-family: ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #0f0f0f 100%); padding: 40px 20px; text-align: center; }
        .logo { color: #d4af37; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .tagline { color: #ccc; font-size: 14px; }
        .content { padding: 40px 30px; }
        .welcome-title { color: #d4af37; font-size: 28px; font-weight: 300; margin-bottom: 20px; }
        .text { font-size: 16px; line-height: 1.7; margin-bottom: 25px; }
        .highlights { background: #f8f6f0; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #d4af37; }
        .highlight-item { margin-bottom: 12px; font-size: 15px; }
        .highlight-item strong { color: #d4af37; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4f1e8 100%); color: #000; padding: 15px 30px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee; }
        .footer-text { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">DESIGN DISTRICT</div>
            <div class="tagline">Chamber of Commerce</div>
        </div>
        
        <div class="content">
            <h1 class="welcome-title">Welcome to Our Community!</h1>
            
            <p class="text">Dear {{name}},</p>
            
            <p class="text">Thank you for joining our waitlist! We''re thrilled to have you as part of a growing community of business leaders shaping Miami''s Design District.</p>
            
            <div class="highlights">
                <div class="highlight-item"><strong>🤝 Exclusive networking</strong> with fellow business leaders</div>
                <div class="highlight-item"><strong>📈 Business growth opportunities</strong> and mentorship</div>
                <div class="highlight-item"><strong>🎯 Premium events</strong> and insider industry insights</div>
                <div class="highlight-item"><strong>🔑 Early access</strong> to our proprietary Design District Connect platform</div>
            </div>
            
            <p class="text">As a waitlist member, you''ll be the first to know about our official launch, early-bird pricing, and upcoming opportunities.</p>
            
            <p class="text">Stay tuned—exciting updates are coming soon!</p>
            
            <div style="text-align: center;">
                <a href="https://miamidesigndistrictchamberofcommerce.org/about-us.html" class="cta-button">Learn About Our Leadership</a>
            </div>
            
            <p class="text">
                Best regards,<br><br>
                <strong>April Sabral</strong><br>
                Executive Director<br>
                Design District Chamber of Commerce
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                Design District Chamber of Commerce<br>
                Miami Design District | info@designdistrictchamber.org<br>
                <a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>',
  'Dear {{name}},

Thank you for joining our waitlist! We''re thrilled to have you as part of a growing community of business leaders shaping Miami''s Design District.

Here''s what you can look forward to:

• Exclusive networking with fellow business leaders
• Business growth opportunities and mentorship  
• Premium events and insider industry insights
• Early access to our proprietary Design District Connect platform

As a waitlist member, you''ll be the first to know about our official launch, early-bird pricing, and upcoming opportunities.

Stay tuned—exciting updates are coming soon!

Best regards,
April Sabral
Executive Director
Design District Chamber of Commerce

---
Design District Chamber of Commerce
Miami Design District | info@designdistrictchamber.org
Unsubscribe: {{unsubscribe_url}}',
  'welcome'
);

-- View for waitlist analytics
CREATE VIEW public.waitlist_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as daily_signups,
    COUNT(*) FILTER (WHERE auto_responder_sent = true) as emails_sent,
    COUNT(DISTINCT email) as unique_emails
FROM public.chamber_waitlist 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;