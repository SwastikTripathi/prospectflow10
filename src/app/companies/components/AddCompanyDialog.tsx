
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react'; // Ensure Loader2 is imported

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import type { Company } from '@/lib/types';

const addCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url("Must be a valid URL (e.g., https://example.com)").optional().or(z.literal('')),
  linkedin_url: z.string().url("Must be a valid LinkedIn URL (e.g., https://linkedin.com/company/name)").optional().or(z.literal('')),
  notes: z.string().optional(),
});

// This form will submit values that match Omit<Company, 'id' | 'user_id' | 'created_at'>
type AddCompanyFormValues = z.infer<typeof addCompanySchema>;

interface AddCompanyDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddCompanySubmit: (companyData: AddCompanyFormValues) => Promise<void>;
}

export function AddCompanyDialog({ isOpen, onOpenChange, onAddCompanySubmit }: AddCompanyDialogProps) {
  const form = useForm<AddCompanyFormValues>({
    resolver: zodResolver(addCompanySchema),
    defaultValues: {
      name: '',
      website: '',
      linkedin_url: '',
      notes: '',
    },
  });

  const onSubmit = async (values: AddCompanyFormValues) => {
    await onAddCompanySubmit(values);
    // Dialog closing and toast messages are handled by the parent page
    // If the dialog is still open (e.g., an error occurred), reset the form.
    // If successful, parent usually closes it, and form is reset on next open.
    if (isOpen) {
        form.reset();
    }
  };

  // Handle dialog close: reset form
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Company</DialogTitle>
          <DialogDescription>
            Enter the details of the company you want to track.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Innovatech Ltd." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/company/example" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any relevant notes about the company..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Company
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
