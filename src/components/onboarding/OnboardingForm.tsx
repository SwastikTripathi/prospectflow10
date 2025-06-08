
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { UserSettings } from '@/lib/types';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'job_seeker', label: 'Job Seeker' },
  { value: 'employee', label: 'Employee' },
  { value: 'business_owner', label: 'Business Owner / Entrepreneur' },
  { value: 'freelancer_consultant', label: 'Freelancer / Consultant' },
  { value: 'other', label: 'Other' },
] as const;

const AGE_RANGES = [
  { value: 'below_18', label: 'Below 18' },
  { value: '18_24', label: '18-24' },
  { value: '25_34', label: '25-34' },
  { value: '35_44', label: '35-44' },
  { value: '45_54', label: '45-54' },
  { value: '55_plus', label: '55+' },
] as const;

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'OTHER', label: 'Other' },
] as const;

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'IN', label: 'India' },
  { value: 'AU', label: 'Australia' },
  { value: 'OTHER', label: 'Other (Specify)' },
] as const;

const onboardingSchema = z.object({
  userRole: z.enum(ROLES.map(r => r.value) as [string, ...string[]], {
    required_error: "Please select your current role."
  }),
  ageRange: z.enum(AGE_RANGES.map(ar => ar.value) as [string, ...string[]],{
    required_error: "Please select your age range."
  }),
  annualIncomeAmount: z.coerce.number().int().positive('Income must be a positive number.').optional().or(z.literal('')),
  annualIncomeCurrency: z.string().optional(),
  country: z.enum(COUNTRIES.map(c => c.value) as [string, ...string[]], {
    required_error: "Please select your country."
  }),
}).refine(data => {
    if (data.annualIncomeAmount && !data.annualIncomeCurrency) {
        return false;
    }
    return true;
}, {
    message: "Please select a currency if providing an income amount.",
    path: ["annualIncomeCurrency"],
});

export type OnboardingFormValues = Omit<z.infer<typeof onboardingSchema>, 'annualIncomeAmount'> & {
  annualIncomeAmount?: number | null;
  // fullName is no longer part of OnboardingFormValues passed to onSubmit
};

interface OnboardingFormProps {
  onSubmit: (data: OnboardingFormValues) => Promise<void>;
  // initialFullName prop removed
}

export function OnboardingForm({ onSubmit }: OnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      // fullName: initialFullName || '', // Removed
      userRole: undefined,
      ageRange: undefined,
      annualIncomeAmount: '',
      annualIncomeCurrency: undefined,
      country: undefined,
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof onboardingSchema>) => {
    setIsSubmitting(true);
    console.log("[OnboardingForm] handleFormSubmit started. Values:", values);
    
    const submissionValues: OnboardingFormValues = {
      ...values,
      annualIncomeAmount: values.annualIncomeAmount === '' || values.annualIncomeAmount === undefined
        ? null
        : Number(values.annualIncomeAmount),
    };
    try {
      console.log("[OnboardingForm] Calling onSubmit prop with:", submissionValues);
      await onSubmit(submissionValues);
      console.log("[OnboardingForm] onSubmit prop finished.");
    } catch (error) {
      console.error("[OnboardingForm] Error during onSubmit prop call:", error);
      // Error handling (e.g., toast) is expected to be done in the onSubmit prop itself
    } finally {
      console.log("[OnboardingForm] Setting isSubmitting to false.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-2xl font-headline">Welcome to ProspectFlow!</CardTitle>
          <CardDescription>Help us tailor your experience by answering a few quick questions.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto pr-2 py-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4 pl-2">
              {/* FullName Field Removed */}

              <FormField
                control={form.control}
                name="userRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Which of these best describes your current role?</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {ROLES.map(role => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ageRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is your age range?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select age range" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {AGE_RANGES.map(range => <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <FormField
                  control={form.control}
                  name="annualIncomeAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Income (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 50000" {...field} onChange={event => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="annualIncomeCurrency"
                  render={({ field }) => (
                    <FormItem>
                       <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch('annualIncomeAmount')}>
                          <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map(currency => <SelectItem key={currency.value} value={currency.value}>{currency.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country of Residence</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select your country" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {COUNTRIES.map(country => <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Get Started
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
