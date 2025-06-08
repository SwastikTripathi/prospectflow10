
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ALL_AVAILABLE_PLANS } from '@/lib/config';
import type { AvailablePlan, PlanFeature, SubscriptionTier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter'; // Added import


interface PublicPlanDisplayInfo {
  isFree: boolean;
  isDiscounted: boolean;
  originalTotalPrice?: number;
  discountedPricePerMonth?: number;
  finalTotalPrice: number;
  priceMonthlyDirect?: number;
  durationMonths: number;
  discountPercentage?: number;
}

const calculatePublicPlanDisplayInfo = (plan: AvailablePlan): PublicPlanDisplayInfo => {
  if (plan.databaseTier === 'free') {
    return {
      isFree: true,
      isDiscounted: false,
      finalTotalPrice: 0,
      durationMonths: plan.durationMonths,
    };
  }

  const originalTotal = plan.priceMonthly * plan.durationMonths;
  let finalTotal = originalTotal;
  let discountedPerMonth;

  if (plan.discountPercentage && plan.discountPercentage > 0) {
    const discountAmount = originalTotal * (plan.discountPercentage / 100);
    finalTotal = originalTotal - discountAmount;
    discountedPerMonth = Math.round(finalTotal / plan.durationMonths);
    return {
      isFree: false,
      isDiscounted: true,
      originalTotalPrice: Math.round(originalTotal),
      discountedPricePerMonth: discountedPerMonth,
      finalTotalPrice: Math.round(finalTotal),
      durationMonths: plan.durationMonths,
      discountPercentage: plan.discountPercentage,
    };
  } else {
    return {
      isFree: false,
      isDiscounted: false,
      priceMonthlyDirect: plan.priceMonthly,
      finalTotalPrice: Math.round(originalTotal),
      durationMonths: plan.durationMonths,
    };
  }
};


export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSelectPlanPublic = (planName: string) => {
    toast({
      title: 'Authentication Required',
      description: 'Please sign up or sign in to select a plan.',
      duration: 5000,
    });
    router.push('/auth?source=pricing');
  };

  const displayedPlans = ALL_AVAILABLE_PLANS.map((plan) => {
    const priceInfo = calculatePublicPlanDisplayInfo(plan);
    let ctaText = "Choose Plan";
    let finalButtonVariant: ButtonProps['variant'] = 'secondary';

    if (plan.databaseTier === 'free') {
      ctaText = "Get Started Free";
    } else if (plan.isPopular) {
        finalButtonVariant = 'default';
    }

    return {
      ...plan,
      priceInfo,
      ctaText,
      finalButtonVariant,
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar activeLink="pricing" />

      <main className="flex-1 py-12 md:py-20">
        <section className="container mx-auto px-[5vw] md:px-[10vw] text-center mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 font-headline text-foreground">
            Simple, Transparent Pricing
          </h1>
          <p className="max-w-xl mx-auto text-md sm:text-lg text-muted-foreground">
            Choose the plan that's right for you and supercharge your outreach efforts.
            <br/>
            All paid plans offer the same premium features and limits.
          </p>
        </section>

        <section className="container mx-auto px-[5vw] md:px-[10vw]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
            {displayedPlans.map((plan) => {
              const { priceInfo } = plan;
              return (
                <Card key={plan.id} className={cn(
                    "flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300 relative",
                    plan.isPopular && plan.databaseTier === 'premium' ? 'border-primary border-2' : ''
                )}>
                  {plan.isPopular && plan.databaseTier === 'premium' && (
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="bg-primary text-primary-foreground text-xs font-semibold py-1 px-3 rounded-full shadow-md">
                        Most Popular
                        </div>
                    </div>
                  )}
                  <CardHeader className={cn("pb-4", plan.isPopular && plan.databaseTier === 'premium' && "pt-7")}>
                    <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-1">
                    <div className="text-4xl font-bold mb-1 min-h-[3rem] flex items-baseline">
                      {priceInfo.isFree ? (
                        "Free"
                      ) : priceInfo.isDiscounted && priceInfo.discountedPricePerMonth ? (
                        <div className="flex items-baseline flex-wrap gap-x-1.5">
                          <div className="flex items-baseline">
                             <span className="font-normal" style={{ fontFamily: 'Arial' }}>₹</span>
                             <span className="font-bold">{priceInfo.discountedPricePerMonth}</span>
                             <span className="text-base font-normal text-muted-foreground self-end">/mo</span>
                          </div>
                          {priceInfo.discountPercentage && (
                            <span className="text-sm font-semibold text-green-600">
                              ({priceInfo.discountPercentage}% off)
                            </span>
                          )}
                        </div>
                      ) : (
                        priceInfo.priceMonthlyDirect && (
                            <div className="flex items-baseline">
                            <span className="font-normal" style={{ fontFamily: 'Arial' }}>₹</span>
                            <span className="font-bold">{priceInfo.priceMonthlyDirect}</span>
                            <span className="text-base font-normal text-muted-foreground self-end">/mo</span>
                            </div>
                        )
                      )}
                    </div>
                     <p className="text-xs text-muted-foreground min-h-[1.5em]">
                      {!priceInfo.isFree ?
                       ( <>Total: <span className="font-normal" style={{ fontFamily: 'Arial' }}>₹</span><span className="font-bold">{priceInfo.finalTotalPrice}</span> for {priceInfo.durationMonths} month{priceInfo.durationMonths > 1 ? 's' : ''}</> )
                       : "Forever!"
                      }
                    </p>
                    <ul className="space-y-2 text-sm pt-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className={`flex items-center ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                          {feature.included ? <CheckCircle className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" /> : <Circle className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />}
                          {feature.text}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleSelectPlanPublic(plan.name)}
                      variant={plan.finalButtonVariant}
                    >
                      {plan.ctaText}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
           <div className="text-center mt-12">
             <p className="text-muted-foreground">Have questions? <a href="/contact" className="text-primary hover:underline">Contact Us</a></p>
           </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
