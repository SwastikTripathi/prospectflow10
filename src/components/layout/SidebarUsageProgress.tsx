
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, Users, Briefcase, CreditCard, AlertTriangle } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { getLimitsForTier, ALL_AVAILABLE_PLANS } from '@/lib/config';
import type { UserSubscription, SubscriptionTier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCurrentSubscription } from '@/hooks/use-current-subscription'; // Import the hook
import { differenceInDays } from 'date-fns'; // Added missing import

interface UsageStats {
  companies: { current: number; limit: number };
  contacts: { current: number; limit: number };
  jobOpenings: { current: number; limit: number };
}

interface SidebarUsageProgressProps {
  user: User | null;
}

interface DisplayedSubscriptionInfo {
  planDisplayName: string;
  status: string;
  timeLeftMessage?: string;
  tierForLimits: SubscriptionTier;
  isInGracePeriodHook: boolean;
  daysLeftInGracePeriodHook: number | null;
}

const StatItem: React.FC<{
  icon: React.ElementType;
  label: string;
  current: number;
  limit: number;
}> = ({ icon: Icon, label, current, limit }) => {
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  const percentage = limit > 0 && limit !== Infinity ? Math.min((current / limit) * 100, 100) : 0;
  const displayLimit = limit === Infinity ? '∞' : limit;
  const isOverLimit = current > limit && limit !== Infinity;

  const content = (
    <div className={cn("w-full", isCollapsed ? "py-1 flex flex-col items-center" : "space-y-1")}>
      <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col justify-center w-full" : "justify-between")}>
        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-0.5" : "gap-1.5")}>
          <Icon className={cn("h-4 w-4 text-sidebar-foreground/80", isCollapsed ? "h-5 w-5" : "")} />
          {!isCollapsed && <span className="text-xs font-medium text-sidebar-foreground/90 truncate">{label}</span>}
        </div>
        {!isCollapsed && (
          <span className={cn("text-xs text-sidebar-foreground/70 shrink-0", isOverLimit ? "text-destructive font-semibold" : "")}>
            {current}/{displayLimit}
          </span>
        )}
      </div>
      <Progress
        value={percentage}
        className={cn(
          "h-1.5 w-full",
          isCollapsed ? "h-1 mt-0.5 max-w-[2rem]" : "",
          isOverLimit ? "bg-destructive/20 [&>div]:bg-destructive" : "[&>div]:bg-sidebar-accent"
        )}
        aria-label={`${label} usage ${current} of ${displayLimit}`}
      />
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-center w-full cursor-default">{content}</div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" className="text-xs">
          <p>{label}: {current}/{displayLimit} {isOverLimit && "(Over Limit!)"}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return content;
};


export function SidebarUsageProgress({ user }: SidebarUsageProgressProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  const {
    currentSubscription,
    subscriptionLoading,
    effectiveTierForLimits,
    isInGracePeriod,
    daysLeftInGracePeriod,
  } = useCurrentSubscription();


  useEffect(() => {
    if (!user) {
      setIsLoadingCounts(false);
      setStats(null);
      return;
    }

    let isMounted = true;
    const fetchUsageCounts = async () => {
      if (!isMounted) return;
      setIsLoadingCounts(true);
      try {
        const [
          { count: companiesCount, error: companiesError },
          { count: contactsCount, error: contactsError },
          { count: jobOpeningsCount, error: jobOpeningsError },
        ] = await Promise.all([
          supabase.from('companies').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('job_openings').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);

        if (!isMounted) return;

        if (companiesError) throw companiesError;
        if (contactsError) throw contactsError;
        if (jobOpeningsError) throw jobOpeningsError;
        
        // Limits are now determined by effectiveTierForLimits from the hook
        const limits = getLimitsForTier(effectiveTierForLimits);

        setStats({
          companies: { current: companiesCount ?? 0, limit: limits.companies },
          contacts: { current: contactsCount ?? 0, limit: limits.contacts },
          jobOpenings: { current: jobOpeningsCount ?? 0, limit: limits.jobOpenings },
        });

      } catch (error) {
        if (isMounted) {
          const limits = getLimitsForTier('free'); // Fallback to free on error
          setStats({ 
              companies: { current: 0, limit: limits.companies },
              contacts: { current: 0, limit: limits.contacts },
              jobOpenings: { current: 0, limit: limits.jobOpenings },
          });
        }
      } finally {
        if (isMounted) setIsLoadingCounts(false);
      }
    };

    fetchUsageCounts();
    return () => { isMounted = false; };
  }, [user, effectiveTierForLimits]); // Re-fetch if user or effectiveTier changes


  const renderGracePeriodWarning = () => {
    if (!isInGracePeriod || daysLeftInGracePeriod === null || subscriptionLoading) return null;

    const message = daysLeftInGracePeriod > 0
      ? `${daysLeftInGracePeriod} day${daysLeftInGracePeriod !== 1 ? 's' : ''} left to manage data.`
      : "Data cleanup imminent. Renew or manage data now.";

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center w-full cursor-default px-1 py-1.5 mb-1 bg-destructive/10 rounded-md border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" className="text-xs bg-destructive text-destructive-foreground">
            <p>{message}</p>
            <p>Excess data may be deleted.</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div className="px-2 mb-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
        <p className="mt-0.5">Excess data may be deleted after this period.</p>
      </div>
    );
  };

  const renderSubscriptionStatus = () => {
    if (subscriptionLoading) {
      return (
        <div className={cn("px-2 mb-2", isCollapsed ? "py-2 flex flex-col items-center" : "py-1")}>
          <Skeleton className={cn("h-4", isCollapsed ? "w-8 mb-0.5" : "w-20 mb-0.5")} />
          <Skeleton className={cn("h-3", isCollapsed ? "w-12" : "w-16")} />
        </div>
      );
    }

    const planDisplayName = currentSubscription?.tier === 'premium' && currentSubscription.status === 'active' ? "Premium Plan" : "Free Plan";
    const timeLeftMessage = currentSubscription?.tier === 'premium' && currentSubscription.status === 'active' && currentSubscription.plan_expiry_date
        ? (() => {
            const daysLeft = differenceInDays(currentSubscription.plan_expiry_date!, new Date());
            if (daysLeft < 0) return undefined; // Handled by grace period or becomes free
            if (daysLeft === 0) return "Expires today";
            return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
          })()
        : undefined;


    if (effectiveTierForLimits === 'premium') {
      const premiumContent = (
        <div className={cn("w-full", isCollapsed ? "py-1 text-center" : "py-2")}>
          {isCollapsed ? (
            <>
              <p className="text-xs font-semibold truncate" title={planDisplayName}>{planDisplayName}</p>
              {timeLeftMessage && <p className="text-[0.65rem] leading-tight text-sidebar-foreground/80">{timeLeftMessage}</p>}
            </>
          ) : (
            <div className="flex justify-between items-center w-full">
              <p className="text-sm font-semibold text-sidebar-foreground truncate" title={planDisplayName}>{planDisplayName}</p>
              {timeLeftMessage && <p className="text-xs text-sidebar-foreground/80">{timeLeftMessage}</p>}
            </div>
          )}
        </div>
      );
      if (isCollapsed) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center w-full cursor-default px-1 mb-1">{premiumContent}</div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="text-xs">
              <p>{planDisplayName}</p>
              {timeLeftMessage && <p>{timeLeftMessage}</p>}
            </TooltipContent>
          </Tooltip>
        );
      }
      return <div className="px-2 mb-2 text-sidebar-foreground">{premiumContent}</div>;
    } else { // Free Plan (or expired premium in/after grace)
      const freePlanContent = (
         <div className={cn("w-full", isCollapsed ? "flex flex-col items-center py-1" : "py-2")}>
          {isCollapsed ? (
            <p className="text-xs font-semibold">{"Free Plan"}</p>
          ) : (
            <div className="flex justify-between items-center w-full">
              <p className="text-sm font-semibold text-sidebar-foreground">{"Free Plan"}</p>
              <Button asChild variant="outline" size="sm" className="h-7 text-xs bg-sidebar-accent/10 hover:bg-sidebar-accent/30 border-sidebar-accent/50 text-sidebar-accent hover:text-sidebar-accent focus-visible:ring-sidebar-accent">
                <Link href="/settings/billing">Upgrade</Link>
              </Button>
            </div>
          )}
        </div>
      );

      if (isCollapsed) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="w-full h-auto p-1.5 mb-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Link href="/settings/billing">
                  <CreditCard className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="text-xs">Upgrade to Premium</TooltipContent>
          </Tooltip>
        );
      }
      return <div className="px-2 mb-2 text-sidebar-foreground">{freePlanContent}</div>;
    }
  };

  if (!user) return null;

  const finalIsLoading = isLoadingCounts || subscriptionLoading;

  return (
    <>
      {renderGracePeriodWarning()}
      {renderSubscriptionStatus()}
      {finalIsLoading && !stats && (
         <div className={cn("space-y-2 px-2", isCollapsed ? "py-2" : "py-1")}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn(isCollapsed ? "flex flex-col items-center gap-1 my-1.5" : "space-y-1")}>
                {!isCollapsed && <Skeleton className="h-3 w-20 mb-0.5" />}
                 <div className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "justify-between")}>
                    {isCollapsed && <Skeleton className="h-5 w-5" />}
                     <Skeleton className={cn("h-1.5", isCollapsed ? "h-1 w-8" : "w-full")} />
                    {!isCollapsed && <Skeleton className="h-3 w-8" />}
                </div>
              </div>
            ))}
        </div>
      )}
      {!finalIsLoading && stats && (
        <div className={cn("space-y-2 px-2", isCollapsed ? "py-2" : "pt-1")}>
          <StatItem icon={Briefcase} label="Openings" current={stats.jobOpenings.current} limit={stats.jobOpenings.limit} />
          <StatItem icon={Users} label="Contacts" current={stats.contacts.current} limit={stats.contacts.limit} />
          <StatItem icon={Building2} label="Companies" current={stats.companies.current} limit={stats.companies.limit} />
        </div>
      )}
       {!finalIsLoading && !stats && currentSubscription?.status !== 'error' && ( // Assuming 'error' status if sub fetch fails
        <div className={cn("p-2 text-xs text-sidebar-foreground/60", isCollapsed ? "text-center" : "text-left")}>Usage Stats N/A</div>
      )}
       {currentSubscription?.status === 'error' && !finalIsLoading && ( // Or some other error indicator from the hook
         <div className={cn("p-2 text-xs text-destructive", isCollapsed ? "text-center" : "text-left")}>Error loading stats.</div>
       )}
    </>
  );
}
