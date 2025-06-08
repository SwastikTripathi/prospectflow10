
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { UserSubscription, AvailablePlan, SubscriptionTier } from '@/lib/types';
import { ALL_AVAILABLE_PLANS } from '@/lib/config';
import { useToast } from './use-toast';
import { addDays, differenceInDays, isFuture, startOfDay } from 'date-fns';

interface UseCurrentSubscriptionReturn {
  currentSubscription: UserSubscription | null;
  subscriptionLoading: boolean;
  availablePlans: AvailablePlan[];
  effectiveTierForLimits: SubscriptionTier;
  isInGracePeriod: boolean;
  daysLeftInGracePeriod: number | null;
}

const GRACE_PERIOD_DAYS = 7;

export function useCurrentSubscription(): UseCurrentSubscriptionReturn {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [effectiveTierForLimits, setEffectiveTierForLimits] = useState<SubscriptionTier>('free');
  const [isInGracePeriod, setIsInGracePeriod] = useState(false);
  const [daysLeftInGracePeriod, setDaysLeftInGracePeriod] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null;
        setCurrentUser(user);
        if (!user) {
          setCurrentSubscription(null);
          setEffectiveTierForLimits('free');
          setIsInGracePeriod(false);
          setDaysLeftInGracePeriod(null);
          setSubscriptionLoading(false);
        }
      }
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
       if(!user) {
        setSubscriptionLoading(false);
        setEffectiveTierForLimits('free');
       }
    });
    return () => authListener.subscription?.unsubscribe();
  }, []);

  const fetchSubscriptionDetails = useCallback(async () => {
    if (!currentUser) {
      setCurrentSubscription(null);
      setEffectiveTierForLimits('free');
      setIsInGracePeriod(false);
      setDaysLeftInGracePeriod(null);
      setSubscriptionLoading(false);
      return;
    }
    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      let resolvedTier: SubscriptionTier = 'free';
      let gracePeriodActive = false;
      let daysLeftGrace: number | null = null;

      if (data) {
        const sub = {
          ...data,
          tier: data.tier as SubscriptionTier,
          status: data.status as UserSubscription['status'],
          plan_start_date: data.plan_start_date ? new Date(data.plan_start_date) : null,
          plan_expiry_date: data.plan_expiry_date ? new Date(data.plan_expiry_date) : null,
        } as UserSubscription;
        setCurrentSubscription(sub);

        if (sub.tier === 'premium' && sub.status === 'active') {
          if (sub.plan_expiry_date && isFuture(startOfDay(sub.plan_expiry_date))) {
            resolvedTier = 'premium';
          } else if (sub.plan_expiry_date) { // Premium plan has expired
            resolvedTier = 'free'; // Limits revert to free tier
            const gracePeriodEndDate = addDays(startOfDay(sub.plan_expiry_date), GRACE_PERIOD_DAYS);
            const today = startOfDay(new Date());
            
            if (isFuture(gracePeriodEndDate) || differenceInDays(gracePeriodEndDate, today) === 0) { // Still within or on the last day of grace
              gracePeriodActive = true;
              daysLeftGrace = differenceInDays(gracePeriodEndDate, today);
              // Ensure daysLeftGrace is never negative if today is exactly gracePeriodEndDate
              daysLeftGrace = Math.max(0, daysLeftGrace);
            } else {
              gracePeriodActive = false; // Grace period over
            }
          }
        } else {
           // Not active premium, so effectively free
           resolvedTier = 'free';
        }
      } else {
        // No subscription record, effectively free
        setCurrentSubscription(null);
        resolvedTier = 'free';
      }
      
      setEffectiveTierForLimits(resolvedTier);
      setIsInGracePeriod(gracePeriodActive);
      setDaysLeftInGracePeriod(daysLeftGrace);

    } catch (error: any) {
      toast({ title: 'Error Fetching Subscription Status', description: error.message, variant: 'destructive' });
      setCurrentSubscription(null);
      setEffectiveTierForLimits('free');
      setIsInGracePeriod(false);
      setDaysLeftInGracePeriod(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (currentUser) {
        fetchSubscriptionDetails();
    } else {
        setSubscriptionLoading(false);
        setCurrentSubscription(null);
        setEffectiveTierForLimits('free');
        setIsInGracePeriod(false);
        setDaysLeftInGracePeriod(null);
    }
  }, [currentUser, fetchSubscriptionDetails]);

  return {
    currentSubscription,
    subscriptionLoading,
    availablePlans: ALL_AVAILABLE_PLANS,
    effectiveTierForLimits,
    isInGracePeriod,
    daysLeftInGracePeriod,
  };
}
