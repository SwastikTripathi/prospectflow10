
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ChevronsUpDown, PlusCircle, Loader2 } from 'lucide-react';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Company } from '@/lib/types';
import { cn } from '@/lib/utils';

// Schema matches the fields needed to create a contact, company_id is handled by parent
export const addContactFormSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  role: z.string().optional(),
  email: z.string().email("Must be a valid email address").min(1, "Email is required"),
  phone: z.string().optional(),
  company_id: z.string().optional(), // This will store the ID of the selected or new company
  company_name_input: z.string().optional(), // Used for typing/searching/creating new company
  linkedin_url: z.string().url("Must be a valid LinkedIn URL (e.g., https://linkedin.com/in/name)").optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type AddContactFormValues = z.infer<typeof addContactFormSchema>;

interface AddContactDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddContactSubmit: (values: AddContactFormValues) => Promise<void>;
  companies: Company[]; // Fetched from Supabase by parent
  onAttemptCreateCompany: (companyName: string) => Promise<Company | null>; // Parent handles Supabase insert
}

export function AddContactDialog({
  isOpen,
  onOpenChange,
  onAddContactSubmit,
  companies,
  onAttemptCreateCompany
}: AddContactDialogProps) {
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [companySearchInputForPopover, setCompanySearchInputForPopover] = useState('');

  const form = useForm<AddContactFormValues>({
    resolver: zodResolver(addContactFormSchema),
    defaultValues: {
      name: '',
      role: '',
      email: '',
      phone: '',
      company_id: '',
      company_name_input: '',
      linkedin_url: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
      setCompanySearchInputForPopover('');
    }
  }, [isOpen, form]);

  const onSubmit = async (values: AddContactFormValues) => {
    await onAddContactSubmit(values);
    if (isOpen) { 
      form.reset();
      setCompanySearchInputForPopover('');
    }
  };
  
  const handleDialogCancel = () => {
    form.reset();
    setCompanySearchInputForPopover('');
    onOpenChange(false);
  };

  const trimmedCompanySearchInput = companySearchInputForPopover.trim().toLowerCase();
  
  const filteredCompaniesForPopover = companies.filter(company =>
    company.name.toLowerCase().includes(trimmedCompanySearchInput)
  );
  
  const canShowCreateCompanyOption = 
    trimmedCompanySearchInput.length > 0 &&
    !companies.some(c => c.name.toLowerCase() === trimmedCompanySearchInput);

  const handleCompanySelectionLogic = async (companyToSelectOrCreate: string | Company) => {
    if (typeof companyToSelectOrCreate === 'string') { // Create new
      const newCompany = await onAttemptCreateCompany(companyToSelectOrCreate);
      if (newCompany) {
        form.setValue("company_name_input", newCompany.name, { shouldValidate: true });
        form.setValue("company_id", newCompany.id, { shouldValidate: true });
        setCompanySearchInputForPopover(newCompany.name);
      }
    } else { // Select existing
      form.setValue("company_name_input", companyToSelectOrCreate.name, { shouldValidate: true });
      form.setValue("company_id", companyToSelectOrCreate.id, { shouldValidate: true });
      setCompanySearchInputForPopover(companyToSelectOrCreate.name);
    }
    setCompanyPopoverOpen(false);
  };

  let commandEmptyContent: React.ReactNode;
  if (canShowCreateCompanyOption || filteredCompaniesForPopover.length > 0) {
    commandEmptyContent = null; // Don't show empty if create option or other options are available
  } else if (trimmedCompanySearchInput.length > 0) {
    commandEmptyContent = `No companies found matching "${companySearchInputForPopover.trim()}".`;
  } else {
    commandEmptyContent = "Type to search or create a company.";
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) {
            handleDialogCancel(); 
        } else {
            onOpenChange(open);
        }
    }}>
      <DialogContent className="sm:max-w-[480px] shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Contact</DialogTitle>
          <DialogDescription>
            Enter the details of the professional contact.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. jane.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Marketing Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_name_input" 
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Company Name (Optional)</FormLabel>
                  <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={companyPopoverOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Select or type company"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search or create company..."
                          value={companySearchInputForPopover}
                          onValueChange={(currentSearchValue) => {
                             setCompanySearchInputForPopover(currentSearchValue);
                             field.onChange(currentSearchValue); 
                             form.setValue("company_id", '', {shouldValidate: false});
                          }}
                          onKeyDown={async (e) => {
                              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                const currentSearchValTrimmed = companySearchInputForPopover.trim();
                                if (!currentSearchValTrimmed) {
                                  setCompanyPopoverOpen(false);
                                  return;
                                }
                                const exactMatch = companies.find(
                                  (c) => c.name.toLowerCase() === currentSearchValTrimmed.toLowerCase()
                                );
                                if (exactMatch) {
                                  await handleCompanySelectionLogic(exactMatch);
                                } else {
                                  await handleCompanySelectionLogic(currentSearchValTrimmed);
                                }
                              }
                            }}
                        />
                        <CommandList>
                          {canShowCreateCompanyOption && (
                            <CommandGroup>
                              <CommandItem
                                key="__create_company__"
                                value={`__create__${trimmedCompanySearchInput}`}
                                onSelect={async () => handleCompanySelectionLogic(companySearchInputForPopover.trim())}
                                className="text-sm cursor-pointer"
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create new company: "{companySearchInputForPopover.trim()}"
                              </CommandItem>
                            </CommandGroup>
                          )}
                          {filteredCompaniesForPopover.length > 0 && (
                            <CommandGroup heading={canShowCreateCompanyOption ? "Existing Companies" : "Select Company"}>
                              {filteredCompaniesForPopover.map((company) => (
                                <CommandItem
                                  value={company.name}
                                  key={company.id}
                                  onSelect={async () => handleCompanySelectionLogic(company)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.getValues("company_id") === company.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {company.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                           {commandEmptyContent && <CommandEmpty>{commandEmptyContent}</CommandEmpty>}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g. +1 234 567 8900" {...field} />
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
                  <FormLabel>LinkedIn Profile URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/janedoe" {...field} />
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
                    <Textarea placeholder="Any relevant notes about this contact..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleDialogCancel}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Contact
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
