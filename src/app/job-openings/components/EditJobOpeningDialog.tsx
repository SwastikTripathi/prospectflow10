
'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Trash2, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import type { JobOpening, FollowUp, Company, Contact, ContactFormEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentSubscription } from '@/hooks/use-current-subscription';
import { getLimitsForTier } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';

const contactEntrySchema = z.object({
  contact_id: z.string().optional(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address").min(1, "Email is required"),
});

const followUpContentSchema = z.object({
  subject: z.string().max(255, "Subject cannot exceed 255 characters.").optional(),
  body: z.string().max(5000, "Body cannot exceed 5000 characters.").optional(),
});

const editJobOpeningSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  company_id: z.string().optional(),
  roleTitle: z.string().min(1, "Role title is required"),
  contacts: z.array(contactEntrySchema).min(1, "At least one contact is required."),
  initialEmailDate: z.date({ required_error: "Initial email date is required" }),
  jobDescriptionUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  notes: z.string().optional(),
  followUp1: followUpContentSchema,
  followUp2: followUpContentSchema,
  followUp3: followUpContentSchema,
  status: z.enum(['Watching', 'Applied', 'Emailed', '1st Follow Up', '2nd Follow Up', '3rd Follow Up', 'No Response', 'Replied - Positive', 'Replied - Negative', 'Interviewing', 'Offer', 'Rejected', 'Closed']),
});

export type EditJobOpeningFormValues = z.infer<typeof editJobOpeningSchema>;

interface EditJobOpeningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateJobOpening: (values: EditJobOpeningFormValues, openingId: string) => Promise<void>;
  openingToEdit: JobOpening | null;
  onInitiateDelete: (opening: JobOpening) => void;
  companies: Company[];
  contacts: Contact[];
  companiesCount: number;
  contactsCount: number;
  jobOpeningsCount: number;
  onAddNewCompany: (companyName: string) => Promise<Company | null>;
  onAddNewContact: (contactName: string, contactEmail?: string, companyId?: string, companyName?: string) => Promise<Contact | null>;
}

const JOB_STATUSES: JobOpening['status'][] = [
    'Watching', 'Applied', 'Emailed',
    '1st Follow Up', '2nd Follow Up', '3rd Follow Up',
    'No Response', 'Replied - Positive', 'Replied - Negative',
    'Interviewing', 'Offer', 'Rejected', 'Closed'
];


export function EditJobOpeningDialog({
    isOpen,
    onOpenChange,
    onUpdateJobOpening,
    openingToEdit,
    onInitiateDelete,
    companies,
    contacts: allExistingContacts,
    companiesCount,
    contactsCount,
    jobOpeningsCount,
    onAddNewCompany,
    onAddNewContact,
}: EditJobOpeningDialogProps) {
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [companySearchInput, setCompanySearchInput] = useState('');

  const [contactPopoverStates, setContactPopoverStates] = useState<boolean[]>([]);
  const [contactSearchInputs, setContactSearchInputs] = useState<string[]>([]);
  const { toast } = useToast();
  const { effectiveTierForLimits, isInGracePeriod, subscriptionLoading } = useCurrentSubscription();

  const form = useForm<EditJobOpeningFormValues>({
    resolver: zodResolver(editJobOpeningSchema),
  });

  const { fields: contactFields, append: appendContact, remove: removeContactField } = useFieldArray({
    control: form.control,
    name: "contacts"
  });

  const resetFormWithOpeningData = (op: JobOpening | null) => {
    if (op) {
        const formContacts: ContactFormEntry[] = (op.associated_contacts || []).map(assocContact => ({
            contact_id: assocContact.contact_id,
            contactName: assocContact.name,
            contactEmail: assocContact.email,
        }));
        if (formContacts.length === 0) {
            formContacts.push({ contactName: '', contactEmail: '', contact_id: '' });
        }

        form.reset({
            companyName: op.company_name_cache || '',
            company_id: op.company_id || '',
            roleTitle: op.role_title,
            contacts: formContacts,
            initialEmailDate: typeof op.initial_email_date === 'string' ? new Date(op.initial_email_date) : op.initial_email_date || new Date(),
            jobDescriptionUrl: op.job_description_url || '',
            notes: op.notes || '',
            followUp1: {
                subject: op.followUps?.[0]?.email_subject || '',
                body: op.followUps?.[0]?.email_body || '',
            },
            followUp2: {
                subject: op.followUps?.[1]?.email_subject || '',
                body: op.followUps?.[1]?.email_body || '',
            },
            followUp3: {
                subject: op.followUps?.[2]?.email_subject || '',
                body: op.followUps?.[2]?.email_body || '',
            },
            status: op.status || 'Watching',
        });
        setCompanySearchInput(op.company_name_cache || '');
        setContactPopoverStates(formContacts.map(() => false));
        setContactSearchInputs(formContacts.map(fc => fc.contactName || ''));

    } else {
        form.reset({
            companyName: '', company_id: '', roleTitle: '',
            contacts: [{ contactName: '', contactEmail: '', contact_id: '' }],
            initialEmailDate: new Date(), jobDescriptionUrl: '', notes: '',
            followUp1: { subject: '', body: '' },
            followUp2: { subject: '', body: '' },
            followUp3: { subject: '', body: '' },
            status: 'Watching',
        });
        setCompanySearchInput('');
        setContactPopoverStates([false]);
        setContactSearchInputs(['']);
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetFormWithOpeningData(openingToEdit);
    }
  }, [openingToEdit, isOpen, form.reset]);

   useEffect(() => {
    if (isOpen) {
        setContactPopoverStates(prev => {
            const newStates = [...prev];
            while (newStates.length < contactFields.length) newStates.push(false);
            return newStates.slice(0, contactFields.length);
        });
        setContactSearchInputs(prev => {
            const newSearches = [...prev];
            while (newSearches.length < contactFields.length) {
                const fieldNameVal = form.getValues(`contacts.${newSearches.length}.contactName`);
                newSearches.push(fieldNameVal || '');
            }
            return newSearches.slice(0, contactFields.length);
        });
    }
  }, [contactFields.length, isOpen, form]);


  const onSubmit = async (values: EditJobOpeningFormValues) => {
    if (!openingToEdit) return;
    if (subscriptionLoading) {
      toast({ title: "Please wait", description: "Subscription status is loading.", variant: "default" });
      return;
    }

    const limits = getLimitsForTier(effectiveTierForLimits);
    let limitMessage = "";

    const isCreatingNewCompanyForEdit = !values.company_id && values.companyName &&
        (values.company_id !== openingToEdit.company_id || values.companyName !== openingToEdit.company_name_cache);

    if (isCreatingNewCompanyForEdit && companiesCount >= limits.companies) {
      limitMessage = `Cannot assign to new company "${values.companyName}" as you have reached the limit of ${limits.companies} companies.`;
      if (isInGracePeriod) {
        limitMessage = `Your premium plan has expired. Cannot assign to new company "${values.companyName}" as you've reached the Free Tier limit of ${limits.companies} companies.`;
      }
      toast({ title: 'Company Limit Reached', description: limitMessage, variant: 'destructive' });
      return;
    }
    
    const originalNewContactsCount = openingToEdit.associated_contacts?.filter(c => !allExistingContacts.find(ec => ec.id === c.contact_id)).length || 0;
    const currentNewContactsInForm = values.contacts.filter(c => !c.contact_id).length;
    const netNewContactsToAdd = currentNewContactsInForm - originalNewContactsCount;


    if (netNewContactsToAdd > 0 && (contactsCount + netNewContactsToAdd) > limits.contacts) {
       limitMessage = `Adding ${netNewContactsToAdd} new contact(s) would exceed your limit of ${limits.contacts} contacts.`;
       if (isInGracePeriod) {
        limitMessage = `Your premium plan has expired. Adding ${netNewContactsToAdd} new contact(s) would exceed your Free Tier limit of ${limits.contacts} contacts.`;
      }
      toast({ title: 'Contact Limit Reached', description: limitMessage, variant: 'destructive' });
      return;
    }

    await onUpdateJobOpening(values, openingToEdit.id);
  };

  const handleDeleteOpeningClick = () => {
    if (openingToEdit) {
      onInitiateDelete(openingToEdit);
    }
  };

  const handleDialogCancel = () => {
    onOpenChange(false);
  };


  if (!openingToEdit && isOpen) {
      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent><DialogHeader><DialogTitle>Error</DialogTitle></DialogHeader>Opening data not available. Please close and retry.</DialogContent>
        </Dialog>
      )
  }
  if (!openingToEdit) return null;

  const currentCompanyIdForContactFilter = form.watch('company_id');
  const currentCompanyNameForContactFilter = form.watch('companyName');

  const trimmedCompanySearchInput = companySearchInput.trim().toLowerCase();
  const filteredCompaniesForDropdown = companies.filter(company =>
    company.name.toLowerCase().includes(trimmedCompanySearchInput)
  );
  
 const canShowCreateCompanyOption = 
    trimmedCompanySearchInput.length > 0 &&
    !companies.some(c => c.name.toLowerCase() === trimmedCompanySearchInput);

  const stageNewCompanyInFormAfterLimitCheck = (name: string): boolean => {
    const limits = getLimitsForTier(effectiveTierForLimits);
    if (companiesCount >= limits.companies && !subscriptionLoading) {
      let message = `You have reached the limit of ${limits.companies} companies.`;
      if (isInGracePeriod) {
        message = `Your premium plan has expired. You've reached the Free Tier limit of ${limits.companies} companies.`;
      }
      toast({
        title: 'Company Limit Reached',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
    form.setValue("companyName", name.trim(), { shouldValidate: true });
    form.control.getFieldState("companyName").isTouched = true; 
    form.setValue("company_id", "", { shouldValidate: true });
    setCompanySearchInput(name.trim());
    setCompanyPopoverOpen(false);
    return true;
  };
  
  const handlePotentialNewContactSelection = (contactName: string, index: number): boolean => {
    const limits = getLimitsForTier(effectiveTierForLimits);
    const existingNewContactsInForm = form.getValues('contacts').filter(c => !c.contact_id && c !== form.getValues('contacts')[index]).length;
    const totalProspectiveContacts = contactsCount + existingNewContactsInForm + 1;

    if (totalProspectiveContacts > limits.contacts && !subscriptionLoading) {
      let message = `Adding this new contact would exceed your limit of ${limits.contacts} contacts.`;
      if (isInGracePeriod) {
        message = `Your premium plan has expired. Adding this new contact would exceed your Free Tier limit of ${limits.contacts} contacts.`;
      }
      toast({ title: 'Contact Limit Reached', description: message, variant: 'destructive' });
      return false; 
    }

    form.setValue(`contacts.${index}.contactName`, contactName.trim(), { shouldValidate: true });
    form.setValue(`contacts.${index}.contact_id`, undefined, { shouldValidate: true }); 

    setContactSearchInputs(prev => prev.map((s, i) => (i === index ? contactName.trim() : s)));
    setContactPopoverStates(prev => prev.map((s, i) => (i === index ? false : s)));
    return true;
  };


  const getFilteredContactsForPopover = (search: string) => {
    return allExistingContacts.filter(contact => {
      const nameMatch = contact.name.toLowerCase().includes(search.toLowerCase());
      if (currentCompanyIdForContactFilter) {
        return nameMatch && contact.company_id === currentCompanyIdForContactFilter;
      }
      if (currentCompanyNameForContactFilter && !currentCompanyIdForContactFilter) {
        return nameMatch && contact.company_name_cache?.toLowerCase() === currentCompanyNameForContactFilter.toLowerCase();
      }
      return nameMatch;
    });
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleDialogCancel();
      else onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Job Opening</DialogTitle>
          <DialogDescription>
            Update the details for {openingToEdit.role_title} at {openingToEdit.company_name_cache}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="py-2 max-h-[70vh] overflow-y-auto px-2 space-y-4">

            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 items-start">
              <FormField control={form.control} name="companyName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" aria-expanded={companyPopoverOpen} className={cn("w-full justify-between",!field.value && "text-muted-foreground")}>
                            {field.value || "Select or type company"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search or create company..." value={companySearchInput}
                            onValueChange={(currentValue) => {
                               setCompanySearchInput(currentValue);
                               field.onChange(currentValue);
                               form.setValue("company_id", "");
                            }}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                const currentSearchVal = companySearchInput.trim();
                                if (!currentSearchVal) {
                                  setCompanyPopoverOpen(false);
                                  return;
                                }
                                const exactMatch = companies.find(
                                  (c) => c.name.toLowerCase() === currentSearchVal.toLowerCase()
                                );

                                if (exactMatch) {
                                  form.setValue("companyName", exactMatch.name, { shouldValidate: true });
                                  field.onChange(exactMatch.name);
                                  form.setValue("company_id", exactMatch.id, { shouldValidate: true });
                                  setCompanySearchInput(exactMatch.name);
                                  setCompanyPopoverOpen(false);
                                } else {
                                  stageNewCompanyInFormAfterLimitCheck(currentSearchVal);
                                }
                              }
                            }}
                            />
                          <CommandList>
                              {canShowCreateCompanyOption && (
                                <CommandGroup>
                                  <CommandItem
                                    key="__create_company__"
                                    value={`__create__${companySearchInput.trim()}`}
                                    onSelect={() => {
                                      stageNewCompanyInFormAfterLimitCheck(companySearchInput.trim());
                                    }}
                                    className="text-sm cursor-pointer"
                                  >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create new company: "{companySearchInput.trim()}"
                                  </CommandItem>
                                </CommandGroup>
                              )}
                              {filteredCompaniesForDropdown.length > 0 && (
                                <CommandGroup heading={canShowCreateCompanyOption ? "Existing Companies" : "Select Company"}>
                                  {filteredCompaniesForDropdown.map((company) => (
                                    <CommandItem
                                      value={company.name}
                                      key={company.id}
                                      onSelect={() => {
                                        form.setValue("companyName", company.name, { shouldValidate: true });
                                        field.onChange(company.name);
                                        form.setValue("company_id", company.id, { shouldValidate: true });
                                        setCompanyPopoverOpen(false);
                                        setCompanySearchInput(company.name);
                                      }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", form.getValues("company_id") === company.id ? "opacity-100" : "opacity-0")} />
                                      {company.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                              {!canShowCreateCompanyOption && filteredCompaniesForDropdown.length === 0 && (
                                <CommandEmpty>
                                  {trimmedCompanySearchInput.length > 0
                                    ? `No companies found matching "${companySearchInput.trim()}".`
                                    : "Type to search or create a company."}
                                </CommandEmpty>
                              )}
                            </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>)}
              />
              <FormField control={form.control} name="roleTitle" render={({ field }) => (
                  <FormItem><FormLabel>Role Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}
              />

              {contactFields.map((item, index) => (
                <React.Fragment key={item.id}>
                  <FormField control={form.control} name={`contacts.${index}.contactName`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person {index + 1}</FormLabel>
                         <Popover
                            open={contactPopoverStates[index]}
                            onOpenChange={(open) => setContactPopoverStates(prev => prev.map((s, i) => i === index ? open : s))}
                         >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                {field.value || "Select or type contact"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search or create contact..." value={contactSearchInputs[index] || ''}
                                onValueChange={(searchValue) => {
                                  setContactSearchInputs(prev => prev.map((s, i) => i === index ? searchValue : s));
                                  field.onChange(searchValue);
                                  form.setValue(`contacts.${index}.contact_id`, undefined);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                      e.preventDefault();
                                      const currentContactSearch = (contactSearchInputs[index] || '').trim();
                                      if (!currentContactSearch) {
                                          setContactPopoverStates(prev => prev.map((s, i) => i === index ? false : s));
                                          return;
                                      }
                                      const exactContactMatch = getFilteredContactsForPopover(currentContactSearch).find(c => c.name.toLowerCase() === currentContactSearch.toLowerCase());
                                      if (exactContactMatch) {
                                          form.setValue(`contacts.${index}.contactName`, exactContactMatch.name, { shouldValidate: true });
                                          field.onChange(exactContactMatch.name);
                                          form.setValue(`contacts.${index}.contactEmail`, exactContactMatch.email, { shouldValidate: true });
                                          form.setValue(`contacts.${index}.contact_id`, exactContactMatch.id, { shouldValidate: true });
                                          setContactSearchInputs(prev => prev.map((s, i) => i === index ? exactContactMatch.name : s));
                                          setContactPopoverStates(prev => prev.map((s, i) => (i === index ? false : s)));

                                      } else {
                                          handlePotentialNewContactSelection(currentContactSearch, index);
                                      }
                                    }
                                }}
                                />
                               <CommandList>
                                  {(() => {
                                    const trimmedContactSearch = (contactSearchInputs[index] || '').trim().toLowerCase();
                                    const filteredExistingContacts = getFilteredContactsForPopover(contactSearchInputs[index] || '');
                                    const showCreateContactOption = trimmedContactSearch.length > 0 && !filteredExistingContacts.some(c => c.name.toLowerCase() === trimmedContactSearch);

                                    return (
                                      <>
                                        {showCreateContactOption && (
                                          <CommandGroup>
                                            <CommandItem
                                              key={`__create_contact_edit_${index}`}
                                              value={`__create__${(contactSearchInputs[index] || '').trim()}`}
                                              onSelect={() => {
                                                handlePotentialNewContactSelection((contactSearchInputs[index] || '').trim(), index);
                                              }}
                                              className="text-sm cursor-pointer"
                                            >
                                              <PlusCircle className="mr-2 h-4 w-4" />
                                              Use name: "{(contactSearchInputs[index] || '').trim()}"
                                            </CommandItem>
                                          </CommandGroup>
                                        )}
                                        {filteredExistingContacts.length > 0 && (
                                          <CommandGroup heading={showCreateContactOption ? "Existing Contacts" : "Select Contact"}>
                                            {filteredExistingContacts.map((contact) => (
                                              <CommandItem
                                                value={contact.name}
                                                key={contact.id}
                                                onSelect={() => {
                                                  form.setValue(`contacts.${index}.contactName`, contact.name, { shouldValidate: true });
                                                  field.onChange(contact.name);
                                                  form.setValue(`contacts.${index}.contactEmail`, contact.email, { shouldValidate: true });
                                                  form.setValue(`contacts.${index}.contact_id`, contact.id, { shouldValidate: true });
                                                  if(contact.company_id && !form.getValues("company_id")){
                                                       form.setValue("company_id", contact.company_id);
                                                       form.setValue("companyName", contact.company_name_cache || '', {shouldValidate: true});
                                                       setCompanySearchInput(contact.company_name_cache || '');
                                                  }
                                                  setContactPopoverStates(prev => prev.map((s, i) => i === index ? false : s));
                                                  setContactSearchInputs(prev => prev.map((s, i) => i === index ? contact.name : s));
                                                }}
                                              >
                                                <Check className={cn("mr-2 h-4 w-4", form.getValues(`contacts.${index}.contact_id`) === contact.id ? "opacity-100" : "opacity-0")} />
                                                {contact.name} {contact.company_name_cache && `(${contact.company_name_cache})`}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        )}
                                        {!showCreateContactOption && filteredExistingContacts.length === 0 && (
                                          <CommandEmpty>
                                            {trimmedContactSearch.length > 0 ? `No contacts found matching "${trimmedContactSearch}". Type email below.` : "Type to search, or type name and email below."}
                                          </CommandEmpty>
                                        )}
                                      </>
                                    );
                                  })()}
                                </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>)}
                  />
                  <FormField control={form.control} name={`contacts.${index}.contactEmail`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email {index + 1}</FormLabel>
                         <div className="flex items-baseline gap-x-2">
                            <FormControl className="flex-grow">
                                <Input type="email" placeholder="e.g. john.doe@example.com" {...field} />
                            </FormControl>
                            {contactFields.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 p-1 text-destructive hover:text-destructive/80 shrink-0"
                                onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeContactField(index);
                                }}
                                tabIndex={-1}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete contact</span>
                            </Button>
                            )}
                        </div>
                        <FormMessage />
                      </FormItem>)}
                  />
                </React.Fragment>
              ))}
            </div>

            <button
              type="button"
              onClick={() => appendContact({ contactName: '', contactEmail: '', contact_id: '' })}
              className="mt-1 mb-0 text-primary hover:text-primary/90 no-underline hover:underline self-start px-0 text-sm"
            >
              Add more contacts
            </button>

            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 items-start pt-2">
              <FormField control={form.control} name="initialEmailDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Email Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>)}
              />
              <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {JOB_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>)}
              />
               <FormField control={form.control} name="jobDescriptionUrl" render={({ field }) => (
                  <FormItem> <FormLabel>Job Description URL (Optional)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /></FormItem>)}
              />
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem> <FormLabel>Notes (Optional)</FormLabel> <FormControl><Textarea placeholder="Any additional notes..." {...field} rows={3}/></FormControl> <FormMessage /></FormItem>)}
            />

            <div className="space-y-6">
              {[1, 2, 3].map((num) => (
                <div key={`followUp${num}`} className="space-y-2 p-4 border rounded-md shadow-sm">
                   <h4 className="text-md font-semibold text-primary">Follow-Up Email {num}</h4>
                  <FormField
                    control={form.control}
                    name={`followUp${num}.subject` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl><Input placeholder={`Subject for follow-up ${num}`} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`followUp${num}.body` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body</FormLabel>
                        <FormControl><Textarea placeholder={`Body for follow-up ${num}...`} {...field} rows={4} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <DialogFooter className="justify-between pt-6">
              <Button type="button" variant="destructive" onClick={handleDeleteOpeningClick} className="mr-auto" disabled={form.formState.isSubmitting || subscriptionLoading}>
                 <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogCancel} disabled={form.formState.isSubmitting || subscriptionLoading}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting || subscriptionLoading}>
                   {(form.formState.isSubmitting || subscriptionLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
