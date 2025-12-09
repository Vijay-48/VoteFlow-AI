/**
 * Developer Configuration
 * =======================
 * Enables unrestricted testing for developer accounts.
 * 
 * IMPORTANT: This should be disabled in production.
 */

// Developer emails that bypass payment restrictions
export const DEV_EMAILS = [
    'nameisvijju001@gmail.com',
    'charansaikondilla@gmail.com'
]

// Check if current user is a developer
export const isDevAccount = (email) => {
    if (!email) return false
    return DEV_EMAILS.includes(email.toLowerCase())
}

// Dev account features
export const DEV_FEATURES = {
    bypassPayment: true,      // Skip payment step
    unlimitedCampaigns: true, // No campaign limits
    unlimitedMessages: true,  // No message limits
    showDebugInfo: true       // Show debug information
}

// Get dev plan (unlimited everything)
export const getDevPlan = () => ({
    id: 'dev',
    name: 'Developer',
    price: '0',
    campaigns: 999,
    maxMessages: 999999,
    description: 'Developer testing account',
    isDev: true,
    features: ['Unlimited campaigns', 'Unlimited messages', 'All features enabled', 'No payment required']
})
