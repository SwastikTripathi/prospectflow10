
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2 } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';

const editCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url("Must be a valid URL (e.g., https://example.com)").optional().or(z.literal('')),
  linkedin_url: z.string().url("Must be a valid LinkedIn URL (e.g., https://linkedin.com/company/name)").optional().or(z.literal('')),
  notes: z.string().optional(),
});

type EditCompanyFormValues = z.infer<typeof editCompanySchema>;

interface EditCompanyDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateCompany: (updatedCompany: Company) => void;
  companyToEdit: Company | null;
  onInitiateDelete: (company: Company) => void;
}

export function EditCompanyDialog({ 
    isOpen, 
    onOpenChange, 
    onUpdateCompany, 
    companyToEdit,
    onInitiateDelete
}: EditCompanyDialogProps) {
  const { toast } = useToast();
  const form = useForm<EditCompanyFormValues>({
    resolver: zodResolver(editCompanySchema),
  });

  useEffect(() => {
    if (companyToEdit && isOpen) {
      form.reset({
        name: companyToEdit.name,
        website: companyToEdit.website || '',
        linkedin_url: companyToEdit.linkedin_url || '',
        notes: companyToEdit.notes || '',
      });
    }
  }, [companyToEdit, isOpen, form]);

  const onSubmit = (values: EditCompanyFormValues) => {
    if (!companyToEdit) return;

    const updatedCompany: Company = {
      ...companyToEdit,
      ...values,
    };

    onUpdateCompany(updatedCompany);
    toast({
      title: "Company Updated",
      description: `${values.name} has been updated.`,
    });
    onOpenChange(false);
  };

  const handleDeleteClick = () => {
    if (companyToEdit) {
      onInitiateDelete(companyToEdit);
      // The onOpenChange(false) for this dialog will be handled by the parent 
      // page component when it opens the delete confirmation dialog.
    }
  };

  if (!companyToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Company Details</DialogTitle>
          <DialogDescription>
            Update the information for {companyToEdit.name}.
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="justify-between pt-4">
              <Button type="button" variant="destructive" onClick={handleDeleteClick} className="mr-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
