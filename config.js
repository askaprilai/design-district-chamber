/**
 * AI Mastery Platform Configuration
 * Update these settings with your GoDaddy domain and PayPal credentials
 */

const CONFIG = {
    // Domain Configuration
    domain: {
        // Replace with your GoDaddy domain
        primary: 'https://your-domain.com', // e.g., 'https://aimasterychallenge.com'
        subdomain: 'https://app.your-domain.com', // Optional: separate subdomain for app
        
        // For development/testing
        development: 'http://localhost:3000'
    },

    // PayPal Configuration
    paypal: {
        // Your PayPal Client IDs
        sandbox: {
            clientId: 'YOUR_SANDBOX_CLIENT_ID', // For testing
            environment: 'sandbox'
        },
        
        production: {
            clientId: 'YOUR_LIVE_CLIENT_ID', // For production
            environment: 'production'
        },

        // Subscription Plan IDs (created in PayPal dashboard)
        plans: {
            starter: {
                sandbox: 'P-SANDBOX-STARTER-PLAN-ID',
                production: 'P-LIVE-STARTER-PLAN-ID'
            },
            enterprise: {
                sandbox: 'P-SANDBOX-ENTERPRISE-PLAN-ID', 
                production: 'P-LIVE-ENTERPRISE-PLAN-ID'
            },
            enterprisePlus: {
                sandbox: 'P-SANDBOX-ENTERPRISE-PLUS-PLAN-ID',
                production: 'P-LIVE-ENTERPRISE-PLUS-PLAN-ID'
            }
        },

        // Webhook URLs
        webhooks: {
            sandbox: 'YOUR_DOMAIN/api/paypal/webhook/sandbox',
            production: 'YOUR_DOMAIN/api/paypal/webhook/production'
        }
    },

    // Platform Settings
    platform: {
        name: 'AI Mastery Challenge™',
        supportEmail: 'support@your-domain.com',
        adminEmail: 'admin@your-domain.com',
        
        // Feature flags
        features: {
            paypalIntegration: true,
            analytics: true,
            whiteLabel: false
        }
    },

    // File paths for your platform
    paths: {
        // Core platform files
        hub: '/unified-ai-mastery-hub.html',
        assessment: '/improved-user-friendly-assessment.html',
        orgAssessment: '/ai-readiness-assessment.html',
        missions: '/ai-mastery-challenge.html',
        promptTraining: '/prompt-engineering-masterclass.html',
        roiTracker: '/personal-ai-roi-tracker.html',
        toolsTracker: '/ai-tools-adoption-tracker.html',
        orgDashboard: '/organizational-ai-insights-dashboard.html',
        adminDashboard: '/admin-dashboard.html',
        
        // Marketing
        landing: '/ai-mastery-enterprise-landing.html'
    }
};

// Environment detection
function getEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return 'development';
    } else if (hostname.includes('sandbox') || hostname.includes('staging')) {
        return 'sandbox';
    } else {
        return 'production';
    }
}

// Get PayPal configuration for current environment
function getPayPalConfig() {
    const env = getEnvironment();
    
    if (env === 'production') {
        return {
            clientId: CONFIG.paypal.production.clientId,
            plans: {
                starter: CONFIG.paypal.plans.starter.production,
                enterprise: CONFIG.paypal.plans.enterprise.production,
                enterprisePlus: CONFIG.paypal.plans.enterprisePlus.production
            }
        };
    } else {
        return {
            clientId: CONFIG.paypal.sandbox.clientId,
            plans: {
                starter: CONFIG.paypal.plans.starter.sandbox,
                enterprise: CONFIG.paypal.plans.enterprise.sandbox,
                enterprisePlus: CONFIG.paypal.plans.enterprisePlus.sandbox
            }
        };
    }
}

// Get base URL for current environment
function getBaseURL() {
    const env = getEnvironment();
    
    if (env === 'development') {
        return CONFIG.domain.development;
    } else {
        return CONFIG.domain.primary;
    }
}

// Build absolute URL
function buildURL(path) {
    const baseURL = getBaseURL();
    return baseURL + path;
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, getEnvironment, getPayPalConfig, getBaseURL, buildURL };
}