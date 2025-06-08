
import type { AvailablePlan, SubscriptionTier, PlanFeature } from '@/lib/types'; // Updated import for SubscriptionTier

export type PlanLimits = {
  companies: number;
  contacts: number;
  jobOpenings: number;
};

// PLAN_LIMITS now only uses 'free' and 'premium' as keys
export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  'free': {
    companies: 25,
    contacts: 25,
    jobOpenings: 30,
  },
  'premium': { // Unified limits for all paid options
    companies: 100,
    contacts: 100,
    jobOpenings: 100, // Example: adjust as needed for your unified premium tier
  },
};

// getLimitsForTier now expects 'free' or 'premium'
export function getLimitsForTier(tier: SubscriptionTier): PlanLimits {
  return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}

// Define features once for consistency
const freeFeatures: PlanFeature[] = [
  { text: `Track up to ${PLAN_LIMITS.free.jobOpenings} job openings`, included: true },
  { text: `Manage up to ${PLAN_LIMITS.free.contacts} contacts`, included: true },
  { text: `Store up to ${PLAN_LIMITS.free.companies} companies`, included: true },
  { text: 'Basic email templates', included: true },
  { text: 'Community support', included: false },
];

const premiumFeatures: PlanFeature[] = [
  { text: `Track up to ${PLAN_LIMITS.premium.jobOpenings} job openings`, included: true },
  { text: `Manage up to ${PLAN_LIMITS.premium.contacts} contacts`, included: true },
  { text: `Store up to ${PLAN_LIMITS.premium.companies} companies`, included: true },
  { text: 'Advanced contact management & tagging', included: true },
  { text: 'Custom follow-up cadence', included: true },
  { text: 'Unlimited saved email templates', included: true },
  { text: 'AI-powered email suggestions (Coming Soon)', included: true },
  { text: 'Priority support', included: true },
];

// ALL_AVAILABLE_PLANS now represents purchase options.
// Each paid option will map to the 'premium' databaseTier.
export const ALL_AVAILABLE_PLANS: AvailablePlan[] = [
  {
    id: 'free', // Unique ID for this purchase option
    databaseTier: 'free', // Tier stored in DB
    name: 'Free Tier', // UI Display Name
    priceMonthly: 0,
    durationMonths: 12 * 99, 
    description: 'Core features free.',
    features: freeFeatures,
    isPopular: false,
  },
  {
    id: 'premium-1m', // Unique ID for this purchase option
    databaseTier: 'premium', // Tier stored in DB
    name: 'Premium - 1 Month', // UI Display Name
    priceMonthly: 100, 
    durationMonths: 1,
    description: 'Full access, monthly.',
    features: premiumFeatures,
    isPopular: false,
  },
  {
    id: 'premium-6m', // Unique ID for this purchase option
    databaseTier: 'premium', // Tier stored in DB
    name: 'Premium - 6 Months', // UI Display Name
    priceMonthly: 100, 
    durationMonths: 6,
    discountPercentage: 5, 
    description: 'Save 5% biannually.',
    features: premiumFeatures,
    isPopular: true,
  },
  {
    id: 'premium-12m', // Unique ID for this purchase option
    databaseTier: 'premium', // Tier stored in DB
    name: 'Premium - 12 Months', // UI Display Name
    priceMonthly: 100,
    durationMonths: 12,
    discountPercentage: 10,
    description: 'Best value, annually.',
    features: premiumFeatures,
    isPopular: false,
  },
];

export const OWNER_EMAIL = 'swastiktripathi.space@gmail.com';
