
import type { Json } from './database.types';

export interface Company {
  id: string;
  user_id?: string;
  created_at?: string;
  name: string;
  website?: string | null;
  linkedin_url?: string | null;
  notes?: string | null;
  is_favorite?: boolean | null;
}

export interface Contact {
  id: string;
  user_id?: string;
  created_at?: string;
  name: string;
  role?: string | null;
  email: string;
  linkedin_url?: string | null;
  phone?: string | null;
  company_id?: string | null;
  company_name_cache?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  is_favorite?: boolean | null;
}

export interface FollowUp {
  id: string;
  job_opening_id: string;
  user_id?: string;
  created_at?: string;
  follow_up_date: Date;
  original_due_date?: Date | null;
  email_subject?: string | null;
  email_body?: string | null;
  status: 'Pending' | 'Sent' | 'Skipped';
}

export interface JobOpeningAssociatedContact {
  contact_id: string;
  name: string;
  email: string;
}


export interface JobOpening {
  id: string;
  user_id?: string;
  created_at?: string;
  company_id?: string | null;
  company_name_cache: string;
  associated_contacts?: JobOpeningAssociatedContact[];
  role_title: string;
  initial_email_date: Date;
  followUps?: FollowUp[];
  status:
    | 'Watching'
    | 'Applied'
    | 'Emailed'
    | '1st Follow Up'
    | '2nd Follow Up'
    | '3rd Follow Up'
    | 'No Response'
    | 'Replied - Positive'
    | 'Replied - Negative'
    | 'Interviewing'
    | 'Offer'
    | 'Rejected'
    | 'Closed';
  tags?: string[] | null;
  job_description_url?: string | null;
  notes?: string | null;
  is_favorite?: boolean | null;
  favorited_at?: string | Date | null;
}

export type Tag = {
  id: string;
  name: string;
  color?: string;
};

export type SubscriptionTier = 'free' | 'premium';
export type UsagePreference = 'job_hunt' | 'sales' | 'networking' | 'other';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending_payment' | 'trialing' | 'payment_failed';

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  plan_start_date: Date | null;
  plan_expiry_date: Date | null;
  status: SubscriptionStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_subscription_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface AvailablePlan {
  id: string;
  databaseTier: SubscriptionTier;
  name: string;
  priceMonthly: number;
  durationMonths: number;
  discountPercentage?: number;
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
}

export interface FollowUpTemplateContent {
  subject: string;
  openingLine: string;
}

export interface DefaultFollowUpTemplates {
  followUp1: FollowUpTemplateContent;
  followUp2: FollowUpTemplateContent;
  followUp3: FollowUpTemplateContent;
  sharedSignature: string;
}

export interface UserSettings {
  user_id: string;
  follow_up_cadence_days: [number, number, number] | Json;
  default_email_templates: DefaultFollowUpTemplates | Json;
  usage_preference: UsagePreference | null; // Can be initially null
  created_at?: string;
  updated_at?: string;
  full_name?: string | null;
  user_role?: string | null;
  age_range?: string | null;
  annual_income_amount?: number | null;
  annual_income_currency?: string | null;
  country?: string | null;
  onboarding_completed?: boolean;
}

export interface ContactFormEntry {
  contact_id?: string;
  contactName: string;
  contactEmail: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  userName: string;
  userEmail: string;
  planName: string;
  planPrice: number;
  paymentId: string;
  orderId: string;
  companyName: string;
  companyAddress: string;
  companyContact: string;
  companyLogoUrl?: string; // Optional URL for the company logo
}

export interface InvoiceRecord {
  id?: string; 
  user_id: string;
  invoice_number: string;
  invoice_date?: string; 
  plan_id: string; 
  plan_name: string; 
  amount_paid: number;
  currency?: string; 
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  created_at?: string; 
}
