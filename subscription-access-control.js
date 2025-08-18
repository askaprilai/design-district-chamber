/**
 * AI Mastery Platform - Subscription Access Control System
 * Manages user access based on PayPal subscription tiers and status
 */

class SubscriptionManager {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.subscription = this.getSubscriptionStatus();
        this.features = this.initializeFeatures();
    }

    // Get current user from URL parameters or localStorage
    getCurrentUser() {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId') || localStorage.getItem('userId');
        const plan = urlParams.get('plan') || localStorage.getItem('userPlan');
        const subscriptionId = urlParams.get('subscriptionId') || localStorage.getItem('subscriptionId');
        
        return {
            id: userId || 'demo-user',
            email: localStorage.getItem('userEmail') || 'demo@company.com',
            organization: localStorage.getItem('userOrg') || 'Demo Organization',
            plan: plan || 'demo',
            subscriptionId: subscriptionId || null,
            role: localStorage.getItem('userRole') || 'member'
        };
    }

    // Get subscription status (in production, this would call your API)
    getSubscriptionStatus() {
        // Simulate API call to check PayPal subscription status
        const mockSubscriptions = {
            'I-BW452GLLEP1G': { status: 'active', plan: 'enterprise', nextBilling: '2024-02-15' },
            'I-L5JS67GH832K': { status: 'active', plan: 'enterprise-plus', nextBilling: '2024-02-20' },
            'I-M8KS47FH923L': { status: 'active', plan: 'starter', nextBilling: '2024-02-18' },
            'demo': { status: 'trial', plan: 'demo', nextBilling: null }
        };

        const subId = this.currentUser.subscriptionId || 'demo';
        return mockSubscriptions[subId] || { status: 'inactive', plan: 'none', nextBilling: null };
    }

    // Initialize feature access based on subscription plan
    initializeFeatures() {
        const planFeatures = {
            demo: {
                // Demo/Trial Access
                aiReadinessAssessment: { enabled: true, limit: 1 },
                individualAssessment: { enabled: true, limit: 3 },
                basicMissions: { enabled: true, limit: 2 },
                roiTracker: { enabled: true, limit: 50 },
                promptEngineering: { enabled: true, limit: 2 },
                toolsTracker: { enabled: true, limit: 10 },
                organizationalDashboard: { enabled: false },
                advancedMissions: { enabled: false },
                teamCollaboration: { enabled: false },
                apiAccess: { enabled: false },
                customIntegrations: { enabled: false },
                whiteLabel: { enabled: false }
            },
            starter: {
                // Starter Plan ($49/month)
                aiReadinessAssessment: { enabled: true, limit: null },
                individualAssessment: { enabled: true, limit: null },
                basicMissions: { enabled: true, limit: null },
                roiTracker: { enabled: true, limit: null },
                promptEngineering: { enabled: true, limit: null },
                toolsTracker: { enabled: true, limit: null },
                organizationalDashboard: { enabled: true, basic: true },
                progressTracking: { enabled: true },
                leaderboards: { enabled: true, individual: true },
                emailSupport: { enabled: true },
                advancedMissions: { enabled: false },
                teamCollaboration: { enabled: false },
                departmentAnalytics: { enabled: false },
                apiAccess: { enabled: false }
            },
            enterprise: {
                // Enterprise Plan ($99/month)
                aiReadinessAssessment: { enabled: true, limit: null },
                individualAssessment: { enabled: true, limit: null },
                basicMissions: { enabled: true, limit: null },
                advancedMissions: { enabled: true, limit: null },
                roiTracker: { enabled: true, limit: null },
                promptEngineering: { enabled: true, limit: null },
                toolsTracker: { enabled: true, limit: null },
                organizationalDashboard: { enabled: true, advanced: true },
                teamCollaboration: { enabled: true },
                departmentAnalytics: { enabled: true },
                aiChampionsProgram: { enabled: true },
                quarterlyReviews: { enabled: true },
                prioritySupport: { enabled: true },
                customIntegrations: { enabled: true, basic: true },
                leaderboards: { enabled: true, team: true },
                apiAccess: { enabled: false },
                whiteLabel: { enabled: false }
            },
            'enterprise-plus': {
                // Enterprise Plus Plan ($199/month)
                aiReadinessAssessment: { enabled: true, limit: null },
                individualAssessment: { enabled: true, limit: null },
                basicMissions: { enabled: true, limit: null },
                advancedMissions: { enabled: true, limit: null },
                roiTracker: { enabled: true, limit: null },
                promptEngineering: { enabled: true, limit: null },
                toolsTracker: { enabled: true, limit: null },
                organizationalDashboard: { enabled: true, premium: true },
                teamCollaboration: { enabled: true },
                departmentAnalytics: { enabled: true },
                aiChampionsProgram: { enabled: true },
                quarterlyReviews: { enabled: true },
                whiteLabel: { enabled: true },
                customMissionDevelopment: { enabled: true },
                dedicatedSuccessManager: { enabled: true },
                advancedAnalytics: { enabled: true },
                apiAccess: { enabled: true },
                onsiteTraining: { enabled: true },
                premiumSupport: { enabled: true }
            }
        };

        return planFeatures[this.subscription.plan] || planFeatures.demo;
    }

    // Check if user has access to a specific feature
    hasAccess(featureName) {
        const feature = this.features[featureName];
        
        if (!feature) {
            console.warn(`Feature '${featureName}' not found in access control`);
            return false;
        }

        // Check subscription status
        if (this.subscription.status === 'inactive' || this.subscription.status === 'cancelled') {
            return false;
        }

        return feature.enabled || false;
    }

    // Check if user has reached usage limit for a feature
    hasReachedLimit(featureName, currentUsage = 0) {
        const feature = this.features[featureName];
        
        if (!feature || !feature.enabled) {
            return true;
        }

        if (feature.limit === null || feature.limit === undefined) {
            return false; // No limit
        }

        return currentUsage >= feature.limit;
    }

    // Get user's plan information
    getPlanInfo() {
        const planInfo = {
            demo: { name: 'Demo Access', price: '$0', color: '#718096' },
            starter: { name: 'Starter', price: '$49/month', color: '#2b6cb0' },
            enterprise: { name: 'Enterprise', price: '$99/month', color: '#d69e2e' },
            'enterprise-plus': { name: 'Enterprise Plus', price: '$199/month', color: '#2f855a' }
        };

        return planInfo[this.subscription.plan] || planInfo.demo;
    }

    // Generate access control UI elements
    renderAccessControl() {
        const planInfo = this.getPlanInfo();
        
        return `
            <div class="subscription-info" style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${planInfo.color};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 700; color: #2d3748; margin-bottom: 5px;">
                            ${this.currentUser.organization}
                        </div>
                        <div style="color: ${planInfo.color}; font-weight: 600;">
                            ${planInfo.name} Plan ${planInfo.price}
                        </div>
                        <div style="font-size: 0.9rem; color: #4a5568;">
                            Status: ${this.subscription.status.charAt(0).toUpperCase() + this.subscription.status.slice(1)}
                            ${this.subscription.nextBilling ? `• Next billing: ${new Date(this.subscription.nextBilling).toLocaleDateString()}` : ''}
                        </div>
                    </div>
                    <div>
                        ${this.subscription.status === 'trial' ? 
                            '<button class="upgrade-btn" onclick="showUpgradeOptions()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;">Upgrade Plan</button>' : 
                            '<button class="manage-btn" onclick="openBillingManagement()" style="background: #e2e8f0; color: #4a5568; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;">Manage Billing</button>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    // Show feature lock overlay
    showFeatureLock(featureName, upgradeRequired = null) {
        const planInfo = this.getPlanInfo();
        const requiredPlan = upgradeRequired || 'enterprise';
        
        const lockOverlay = `
            <div class="feature-lock-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
                    <h2 style="font-size: 1.8rem; font-weight: 700; color: #2d3748; margin-bottom: 15px;">
                        Feature Locked
                    </h2>
                    <p style="color: #4a5568; margin-bottom: 25px;">
                        This feature requires an <strong>${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}</strong> subscription or higher.
                    </p>
                    <p style="color: #4a5568; margin-bottom: 30px;">
                        Current plan: <strong>${planInfo.name}</strong>
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="closeFeatureLock()" style="background: #e2e8f0; color: #4a5568; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Cancel
                        </button>
                        <button onclick="showUpgradeOptions()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', lockOverlay);
    }

    // Track feature usage
    trackUsage(featureName, amount = 1) {
        const currentUsage = parseInt(localStorage.getItem(`usage_${featureName}`) || '0');
        const newUsage = currentUsage + amount;
        localStorage.setItem(`usage_${featureName}`, newUsage.toString());
        
        // Check if approaching limit
        const feature = this.features[featureName];
        if (feature && feature.limit && newUsage >= feature.limit * 0.8) {
            this.showUsageWarning(featureName, newUsage, feature.limit);
        }
        
        return newUsage;
    }

    // Show usage warning when approaching limits
    showUsageWarning(featureName, currentUsage, limit) {
        if (currentUsage >= limit) {
            alert(`⚠️ Usage Limit Reached\n\nYou've reached your limit for ${featureName} (${limit} uses).\n\nUpgrade your plan to continue using this feature.`);
        } else {
            const remaining = limit - currentUsage;
            console.warn(`Approaching limit for ${featureName}: ${remaining} uses remaining`);
        }
    }

    // Get usage statistics
    getUsageStats() {
        const stats = {};
        Object.keys(this.features).forEach(featureName => {
            const feature = this.features[featureName];
            if (feature.limit !== null && feature.limit !== undefined) {
                stats[featureName] = {
                    used: parseInt(localStorage.getItem(`usage_${featureName}`) || '0'),
                    limit: feature.limit,
                    percentage: Math.round((parseInt(localStorage.getItem(`usage_${featureName}`) || '0') / feature.limit) * 100)
                };
            }
        });
        return stats;
    }
}

// Global functions for UI interaction
function showUpgradeOptions() {
    window.open('ai-mastery-enterprise-landing.html#pricing', '_blank');
}

function openBillingManagement() {
    alert('Billing Management\n\n• View payment history\n• Update payment method\n• Download invoices\n• Manage subscription\n\nRedirecting to PayPal billing dashboard...');
    window.open('https://www.paypal.com/myaccount/autopay/', '_blank');
}

function closeFeatureLock() {
    const overlay = document.querySelector('.feature-lock-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Initialize subscription manager
const subscriptionManager = new SubscriptionManager();

// Helper function to check access before navigating to features
function checkAccessAndNavigate(featureName, url, requiredPlan = 'enterprise') {
    if (subscriptionManager.hasAccess(featureName)) {
        // Track usage for limited features
        if (subscriptionManager.features[featureName].limit) {
            subscriptionManager.trackUsage(featureName);
        }
        window.location.href = url;
    } else {
        subscriptionManager.showFeatureLock(featureName, requiredPlan);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionManager;
}