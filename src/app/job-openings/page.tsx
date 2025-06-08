
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search as SearchIcon, Briefcase, Trash2, XCircle, Loader2, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JobOpening, Company, Contact, FollowUp, UserSettings, DefaultFollowUpTemplates, JobOpeningAssociatedContact, ContactFormEntry, SubscriptionTier } from '@/lib/types';
import { AddJobOpeningDialog, type AddJobOpeningFormValues, DEFAULT_FOLLOW_UP_CADENCE_DAYS } from './components/AddJobOpeningDialog';
import { EditJobOpeningDialog, type EditJobOpeningFormValues } from './components/EditJobOpeningDialog';
import { JobOpeningList } from './components/JobOpeningList';
import { JobOpeningCard } from './components/JobOpeningCard';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle as RadixDialogTitle, DialogDescription as RadixDialogDescription } from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { TablesInsert, TablesUpdate } from '@/lib/database.types';
import { isToday, isValid, startOfDay, add, isBefore, format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCurrentSubscription } from '@/hooks/use-current-subscription';
import { getLimitsForTier } from '@/lib/config';


type SortOptionValue = 'nextFollowUpDate_asc' | 'initialEmailDate_desc' | 'initialEmailDate_asc';

const SORT_OPTIONS: { value: SortOptionValue; label: string }[] = [
  { value: 'nextFollowUpDate_asc', label: 'Next Follow-up Date (Earliest First)' },
  { value: 'initialEmailDate_desc', label: 'Initial Email Date (Newest First)' },
  { value: 'initialEmailDate_asc', label: 'Initial Email Date (Oldest First)' },
];

const emailingCycleStatuses: JobOpening['status'][] = ['Emailed', '1st Follow Up', '2nd Follow Up', '3rd Follow Up'];

async function determineNewJobOpeningStatus(
  jobOpeningId: string,
  currentJobOpeningStatus: JobOpening['status'],
  userId: string
): Promise<JobOpening['status'] | null> {

  if (!emailingCycleStatuses.includes(currentJobOpeningStatus)) {
    return null;
  }

  const { data: followUps, error: followUpsError } = await supabase
    .from('follow_ups')
    .select('status, created_at')
    .eq('job_opening_id', jobOpeningId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (followUpsError) {
    return null;
  }

  if (!followUps || followUps.length === 0) {
    return 'Emailed';
  }

  const sentFollowUpsCount = followUps.filter(fu => fu.status === 'Sent').length;

  if (sentFollowUpsCount === 0) {
    return 'Emailed';
  } else if (sentFollowUpsCount === 1) {
    return '1st Follow Up';
  } else if (sentFollowUpsCount === 2) {
    return '2nd Follow Up';
  } else if (sentFollowUpsCount >= 3) {
    return '3rd Follow Up';
  }
  return currentJobOpeningStatus;
}


export default function JobOpeningsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [jobOpeningsCount, setJobOpeningsCount] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInNotes, setSearchInNotes] = useState(true);
  const [sortOption, setSortOption] = useState<SortOptionValue>('nextFollowUpDate_asc');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOpening, setEditingOpening] = useState<JobOpening | null>(null);
  const [openingToDelete, setOpeningToDelete] = useState<JobOpening | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { toast } = useToast();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [focusedOpening, setFocusedOpening] = useState<JobOpening | null>(null);
  const focusedOpeningIdFromUrl = searchParams?.get('view');

  const {
    effectiveTierForLimits,
    isInGracePeriod,
    subscriptionLoading,
  } = useCurrentSubscription();


  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user ?? null);
        if (!session?.user) {
            setJobOpenings([]);
            setJobOpeningsCount(0);
            setCompanies([]);
            setContacts([]);
            setCompaniesCount(0);
            setContactsCount(0);
            setUserSettings(null);
            setIsLoadingData(false);
        }
      }
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user);
    });
    return () => {authListener.subscription.unsubscribe()};
  }, []);

  const fetchPageData = useCallback(async () => {
    if (!currentUser) {
      setJobOpenings([]);
      setJobOpeningsCount(0);
      setCompanies([]);
      setContacts([]);
      setCompaniesCount(0);
      setContactsCount(0);
      setUserSettings(null);
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    try {
      const [
        jobOpeningsResponse,
        companiesResponse,
        contactsResponse,
        allFollowUpsResponse,
        userSettingsResponse,
        jobOpeningContactsResponse,
        jobOpeningsCountResponse,
        companiesCountResponse,
        contactsCountResponseData,
      ] = await Promise.all([
        supabase.from('job_openings').select('*, is_favorite, favorited_at').eq('user_id', currentUser.id),
        supabase.from('companies').select('*').eq('user_id', currentUser.id).order('name', { ascending: true }),
        supabase.from('contacts').select('*').eq('user_id', currentUser.id).order('name', { ascending: true }),
        supabase.from('follow_ups').select('id, job_opening_id, follow_up_date, original_due_date, email_subject, email_body, status, created_at').eq('user_id', currentUser.id).order('created_at', { ascending: true }),
        supabase.from('user_settings').select('*').eq('user_id', currentUser.id).single(),
        supabase.from('job_opening_contacts').select('*').eq('user_id', currentUser.id),
        supabase.from('job_openings').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
      ]);

      if (jobOpeningsResponse.error) throw jobOpeningsResponse.error;
      if (companiesResponse.error) throw companiesResponse.error;
      if (contactsResponse.error) throw contactsResponse.error;
      if (allFollowUpsResponse.error) throw allFollowUpsResponse.error;
      if (userSettingsResponse.error && userSettingsResponse.error.code !== 'PGRST116') throw userSettingsResponse.error;
      if (jobOpeningContactsResponse.error) throw jobOpeningContactsResponse.error;
      if (jobOpeningsCountResponse.error) throw jobOpeningsCountResponse.error;
      if (companiesCountResponse.error) throw companiesCountResponse.error;
      if (contactsCountResponseData.error) throw contactsCountResponseData.error;


      const allDbFollowUps = allFollowUpsResponse.data || [];
      const allDbContacts = contactsResponse.data || [];
      const allJobOpeningContactLinks = jobOpeningContactsResponse.data || [];
      setUserSettings(userSettingsResponse.data as UserSettings | null);
      setJobOpeningsCount(jobOpeningsCountResponse.count ?? 0);
      setCompaniesCount(companiesCountResponse.count ?? 0);
      setContactsCount(contactsCountResponseData.count ?? 0);


      const openingsWithDetails = (jobOpeningsResponse.data || []).map(jo => {
        const normalizedInitialEmailDate = startOfDay(new Date(jo.initial_email_date));

        const followUpsForThisOpening = allDbFollowUps
          .filter(fuDb => fuDb.job_opening_id === jo.id)
          .map(fuDb => ({
            ...fuDb,
            id: fuDb.id,
            follow_up_date: startOfDay(new Date(fuDb.follow_up_date)),
            original_due_date: fuDb.original_due_date ? startOfDay(new Date(fuDb.original_due_date)) : null,
            email_subject: fuDb.email_subject,
            email_body: fuDb.email_body,
          } as FollowUp))
          .sort((a,b) => (a.original_due_date || a.created_at!).getTime() - (b.original_due_date || b.created_at!).getTime());


        const associatedContacts: JobOpeningAssociatedContact[] = allJobOpeningContactLinks
          .filter(link => link.job_opening_id === jo.id)
          .map(link => {
            const contactDetail = allDbContacts.find(c => c.id === link.contact_id);
            return {
              contact_id: link.contact_id,
              name: contactDetail?.name || 'Unknown Contact',
              email: contactDetail?.email || 'unknown@example.com',
            };
          });

        return {
          ...jo,
          initial_email_date: normalizedInitialEmailDate,
          followUps: followUpsForThisOpening,
          associated_contacts: associatedContacts,
          is_favorite: jo.is_favorite,
          favorited_at: jo.favorited_at ? new Date(jo.favorited_at) : null,
        };
      });

      setJobOpenings(openingsWithDetails as JobOpening[]);
      setCompanies(companiesResponse.data || []);
      setContacts(allDbContacts);

    } catch (error: any) {
      toast({ title: 'Error Fetching Data', description: error.message, variant: 'destructive' });
      setJobOpenings([]);
      setJobOpeningsCount(0);
      setCompanies([]);
      setContacts([]);
      setCompaniesCount(0);
      setContactsCount(0);
      setUserSettings(null);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (currentUser) {
        fetchPageData();
    } else {
        setIsLoadingData(false);
    }
  }, [currentUser, fetchPageData]);

  useEffect(() => {
    if (searchParams?.get('new') === 'true' && currentUser) {
      handleAddOpeningClick();
      if (typeof window !== "undefined") {
        router.replace('/job-openings', { scroll: false });
      }
    }
  }, [searchParams, currentUser, router]);

  useEffect(() => {
    if (focusedOpeningIdFromUrl && jobOpenings.length > 0) {
      const openingToFocus = jobOpenings.find(op => op.id === focusedOpeningIdFromUrl);
      setFocusedOpening(openingToFocus || null);
    } else if (!focusedOpeningIdFromUrl) {
      setFocusedOpening(null);
    }
  }, [focusedOpeningIdFromUrl, jobOpenings]);

  const handleAddOpeningClick = () => {
    if (!currentUser || subscriptionLoading) return;

    const limits = getLimitsForTier(effectiveTierForLimits);
    if (jobOpeningsCount >= limits.jobOpenings) {
      let message = `You have reached the limit of ${limits.jobOpenings} job openings for your current plan.`;
      if (isInGracePeriod) {
        message = `Your premium plan has expired, and you've reached the Free Tier limit of ${limits.jobOpenings} job openings. Please renew or manage your data.`;
      } else if (effectiveTierForLimits !== 'free') {
         message = `You've reached the limit of ${limits.jobOpenings} job openings for your Premium plan.`;
      }
      toast({
        title: 'Limit Reached',
        description: message,
        variant: 'destructive',
      });
      return;
    }
    setIsAddDialogOpen(true);
  };


  const handleCloseFocusedOpeningDialog = () => {
    setFocusedOpening(null);
    router.replace('/job-openings', { scroll: false });
  };

  const handleAddNewCompanyToListSupabase = async (companyName: string): Promise<Company | null> => {
    if (!currentUser) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return null;
    }
    const trimmedName = companyName.trim();
    if (!trimmedName) {
        toast({ title: 'Validation Error', description: 'Company name cannot be empty.', variant: 'destructive'});
        return null;
    }
    const existingCompany = companies.find(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.user_id === currentUser.id);
    if (existingCompany) {
        toast({ title: 'Company Exists', description: `${existingCompany.name} already exists. Selecting it.`, variant: 'default' });
        return existingCompany;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name: trimmedName, user_id: currentUser.id }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        toast({ title: "Company Added", description: `${data.name} added to directory.` });
        await fetchPageData();
        return data as Company;
      }
      return null;
    } catch (error: any) {
      toast({ title: 'Error Adding Company', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const handleAddNewContactToListSupabase = async (contactName: string, contactEmail?: string, companyId?: string, companyNameCache?: string): Promise<Contact | null> => {
    if (!currentUser) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return null;
    }
    const trimmedName = contactName.trim();
    const trimmedEmail = contactEmail?.trim();

    if (!trimmedName || !trimmedEmail) {
        toast({ title: 'Validation Error', description: 'Contact name and email are required.', variant: 'destructive'});
        return null;
    }

    const existingContact = contacts.find(c => c.email.toLowerCase() === trimmedEmail.toLowerCase() && c.user_id === currentUser.id);
    if(existingContact) {
        toast({ title: 'Contact Exists', description: `${existingContact.name} with this email already exists. Selecting it.`, variant: 'default' });
        return existingContact;
    }

    try {
      const contactToInsert: TablesInsert<'contacts'> = {
        name: trimmedName,
        email: trimmedEmail,
        user_id: currentUser.id,
        company_id: companyId || null,
        company_name_cache: companyNameCache || null,
        tags: [],
      };
      const { data, error } = await supabase
        .from('contacts')
        .insert([contactToInsert])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        toast({ title: "Contact Added", description: `${data.name} added to directory.` });
        await fetchPageData();
        return data as Contact;
      }
      return null;
    } catch (error: any) {
      toast({ title: 'Error Adding Contact', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const handleAddJobOpening = async (values: AddJobOpeningFormValues) => {
    if (!currentUser) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }


    let companyIdToLink: string | null = values.company_id || null;
    let resolvedCompanyNameCache: string = values.companyName;

    // This logic is now largely handled by the pre-submission check in AddJobOpeningDialog
    // Parent function assumes checks have passed or relies on DB constraints for final safety.

    const normalizedInitialEmailDateForDb = startOfDay(values.initialEmailDate).toISOString();

    const jobOpeningToInsert: TablesInsert<'job_openings'> = {
      user_id: currentUser.id,
      company_id: companyIdToLink,
      company_name_cache: resolvedCompanyNameCache,
      role_title: values.roleTitle,
      initial_email_date: normalizedInitialEmailDateForDb,
      status: 'Emailed',
      job_description_url: values.jobDescriptionUrl || null,
      notes: values.notes || null,
      tags: [],
      is_favorite: false,
      favorited_at: null,
    };

    try {
      const { data: newJobOpeningData, error: jobError } = await supabase
        .from('job_openings')
        .insert([jobOpeningToInsert])
        .select()
        .single();

      if (jobError) throw jobError;

      if (newJobOpeningData) {
        for (const formContact of values.contacts) {
          let resolvedContactId: string | null = formContact.contact_id || null;
          if (!resolvedContactId && formContact.contactName && formContact.contactEmail) {
            const newContact = await handleAddNewContactToListSupabase(
              formContact.contactName,
              formContact.contactEmail,
              companyIdToLink || undefined,
              resolvedCompanyNameCache || undefined
            );
            if (newContact?.id) {
              resolvedContactId = newContact.id;
            } else {
              // Contact creation might have been blocked by its own limit check,
              // or failed for other reasons. A toast would have been shown.
              continue;
            }
          }

          if (resolvedContactId) {
            const { error: linkError } = await supabase
              .from('job_opening_contacts')
              .insert({
                job_opening_id: newJobOpeningData.id,
                contact_id: resolvedContactId,
                user_id: currentUser.id,
              });
            if (linkError) {
              toast({ title: 'Contact Link Error', description: `Could not link contact ${formContact.contactName}. Error: ${JSON.stringify(linkError)}`, variant: 'destructive'});
            }
          }
        }

        const followUpDetails = [
          values.followUp1,
          values.followUp2,
          values.followUp3,
        ];

        const initialDateForCadenceCalc = startOfDay(new Date(values.initialEmailDate));
        const currentCadence = (userSettings?.follow_up_cadence_days as [number, number, number]) || DEFAULT_FOLLOW_UP_CADENCE_DAYS;

        const followUpsToInsert: TablesInsert<'follow_ups'>[] = currentCadence
          .map((days, index) => ({
            job_opening_id: newJobOpeningData.id,
            user_id: currentUser.id,
            follow_up_date: startOfDay(add(initialDateForCadenceCalc, {days})).toISOString(),
            original_due_date: startOfDay(add(initialDateForCadenceCalc, {days})).toISOString(),
            email_subject: followUpDetails[index]?.subject || null,
            email_body: followUpDetails[index]?.body || null,
            status: 'Pending' as FollowUp['status'],
          }));


        if (followUpsToInsert.length > 0) {
          const { error: followUpError } = await supabase.from('follow_ups').insert(followUpsToInsert);
          if (followUpError) {
            toast({
              title: 'Follow-up Save Error',
              description: `Job opening saved, but follow-ups had an issue: ${followUpError.message}`,
              variant: 'destructive',
            });
          }
        }
        toast({
          title: "Job Opening Added",
          description: `${newJobOpeningData.role_title} at ${newJobOpeningData.company_name_cache} has been added.`,
        });
        await fetchPageData();
        router.refresh();
        setIsAddDialogOpen(false);
      } else {
         toast({ title: 'Save Error', description: 'Failed to get new job opening data after insert.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({
        title: 'Error Adding Job Opening',
        description: error.message || 'Could not save the job opening. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  const handleEditOpening = (opening: JobOpening) => {
    setEditingOpening(opening);
    setIsEditDialogOpen(true);
  };

  const handleUpdateJobOpening = async (formValues: EditJobOpeningFormValues, openingId: string) => {
     if (!currentUser || !openingId) {
      toast({ title: 'Error', description: 'Invalid operation.', variant: 'destructive'});
      return;
    }

    // Limit checks for potentially new companies/contacts are now done within EditJobOpeningDialog's onSubmit
    // This parent function proceeds assuming those checks passed.

    let companyIdToLink: string | null = formValues.company_id || null;
    let resolvedCompanyNameCache: string = formValues.companyName;

    // This logic is also now largely handled by the pre-submission check in EditJobOpeningDialog
    // Parent assumes checks have passed or relies on DB constraints.

    const normalizedInitialEmailDateForDb = startOfDay(new Date(formValues.initialEmailDate)).toISOString();

    const jobOpeningToUpdate: TablesUpdate<'job_openings'> = {
      company_id: companyIdToLink,
      company_name_cache: resolvedCompanyNameCache,
      role_title: formValues.roleTitle,
      initial_email_date: normalizedInitialEmailDateForDb,
      status: formValues.status,
      job_description_url: formValues.jobDescriptionUrl || null,
      notes: formValues.notes || null,
    };

    try {
      const { data: updatedJobOpening, error: jobError } = await supabase
        .from('job_openings')
        .update(jobOpeningToUpdate)
        .eq('id', openingId)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (jobError) throw jobError;

      if (updatedJobOpening) {
        const { error: deleteLinksError } = await supabase
          .from('job_opening_contacts')
          .delete()
          .eq('job_opening_id', openingId)
          .eq('user_id', currentUser.id);

        if (deleteLinksError) {
          toast({ title: 'Contact Link Error', description: `Could not update contact associations (delete step). Error: ${JSON.stringify(deleteLinksError)}`, variant: 'destructive'});
          return;
        }

        for (const formContact of formValues.contacts) {
          let resolvedContactId: string | null = formContact.contact_id || null;
          if (!resolvedContactId && formContact.contactName && formContact.contactEmail) {
             const newContact = await handleAddNewContactToListSupabase(
              formContact.contactName,
              formContact.contactEmail,
              companyIdToLink || undefined,
              resolvedCompanyNameCache || undefined
            );
            if (newContact?.id) {
              resolvedContactId = newContact.id;
            } else {
              continue;
            }
          }
          if (resolvedContactId) {
            const { error: linkError } = await supabase
              .from('job_opening_contacts')
              .insert({
                job_opening_id: openingId,
                contact_id: resolvedContactId,
                user_id: currentUser.id,
              });
            if (linkError) {
              toast({ title: 'Contact Link Error', description: `Could not link contact ${formContact.contactName} during update. Error: ${JSON.stringify(linkError)}`, variant: 'destructive'});
            }
          }
        }

        const { error: deleteFollowUpsError } = await supabase
          .from('follow_ups')
          .delete()
          .eq('job_opening_id', openingId)
          .eq('user_id', currentUser.id);

        if (deleteFollowUpsError) throw deleteFollowUpsError;

        const followUpDetails = [
          formValues.followUp1,
          formValues.followUp2,
          formValues.followUp3,
        ];
        const initialDateForCadenceCalc = startOfDay(new Date(formValues.initialEmailDate));
        const currentCadence = (userSettings?.follow_up_cadence_days as [number, number, number]) || DEFAULT_FOLLOW_UP_CADENCE_DAYS;

        const followUpsToInsert: TablesInsert<'follow_ups'>[] = currentCadence
          .map((days, index) => ({
              job_opening_id: openingId,
              user_id: currentUser.id,
              follow_up_date: startOfDay(add(initialDateForCadenceCalc, {days})).toISOString(),
              original_due_date: startOfDay(add(initialDateForCadenceCalc, {days})).toISOString(),
              email_subject: followUpDetails[index]?.subject || null,
              email_body: followUpDetails[index]?.body || null,
              status: 'Pending' as FollowUp['status'],
            }));

        if (followUpsToInsert.length > 0) {
          const { error: followUpError } = await supabase.from('follow_ups').insert(followUpsToInsert);
          if (followUpError) {
             toast({ title: 'Follow-up Update Error', description: followUpError.message, variant: 'destructive'});
          }
        }
        toast({ title: "Job Opening Updated", description: `${updatedJobOpening.role_title} has been updated.`});
        await fetchPageData();
        router.refresh();
        setIsEditDialogOpen(false);
        setEditingOpening(null);
        if (focusedOpening && focusedOpening.id === openingId) {
            const newlyFetchedOpening = (await supabase.from('job_openings').select('*, is_favorite, favorited_at').eq('id', openingId).single()).data;
            if (newlyFetchedOpening) {
                 setFocusedOpening({
                    ...newlyFetchedOpening,
                    initial_email_date: new Date(newlyFetchedOpening.initial_email_date),
                    followUps: followUpsToInsert.map(fu => ({...fu, follow_up_date: new Date(fu.follow_up_date!), original_due_date: fu.original_due_date ? new Date(fu.original_due_date) : null } as FollowUp)),
                    associated_contacts: formValues.contacts.map(fc => ({contact_id: fc.contact_id || '', name: fc.contactName, email: fc.contactEmail})),
                 } as JobOpening);
            }
        }
      }
    } catch (error: any) {
      toast({ title: 'Error Updating Job Opening', description: error.message, variant: 'destructive'});
    }
  };

  const handleLogFollowUp = async (followUpId: string, jobOpeningId: string) => {
    if (!currentUser || !followUpId || !jobOpeningId) {
        toast({title: 'Error', description: 'Invalid follow-up log attempt.', variant: 'destructive'});
        return;
    }
    try {
        const { data: loggedFollowUp, error: logError } = await supabase
            .from('follow_ups')
            .update({
                status: 'Sent',
                follow_up_date: startOfDay(new Date()).toISOString()
            })
            .eq('id', followUpId)
            .eq('job_opening_id', jobOpeningId)
            .eq('user_id', currentUser.id)
            .select()
            .single();

        if (logError) throw logError;

        if (loggedFollowUp) {
            toast({title: 'Follow-up Logged!', description: 'Status updated to Sent.'});

            const { data: jobOpeningData, error: fetchOpeningError } = await supabase
              .from('job_openings')
              .select('status')
              .eq('id', jobOpeningId)
              .eq('user_id', currentUser.id)
              .single();

            if (fetchOpeningError || !jobOpeningData) {
            } else {
              const newCalculatedStatus = await determineNewJobOpeningStatus(jobOpeningId, jobOpeningData.status as JobOpening['status'], currentUser.id);
              if (newCalculatedStatus && newCalculatedStatus !== jobOpeningData.status) {
                const { error: updateStatusError } = await supabase
                  .from('job_openings')
                  .update({ status: newCalculatedStatus })
                  .eq('id', jobOpeningId)
                  .eq('user_id', currentUser.id);
                if (updateStatusError) {
                  toast({ title: 'Status Update Error', description: 'Follow-up logged, but status update failed.', variant: 'destructive'});
                }
              }
            }
            await fetchPageData();
            router.refresh();
        }
    } catch (error: any) {
        toast({title: 'Error Logging Follow-up', description: error.message, variant: 'destructive'});
    }
  };

 const handleUnlogFollowUp = useCallback(async (followUpIdToUnlog: string, jobOpeningId: string) => {
    if (!currentUser) {
      toast({ title: 'Authentication Error', description: 'Cannot unlog follow-up.', variant: 'destructive' });
      return;
    }

    try {
      const { data: followUpToUnlog, error: fetchFollowUpError } = await supabase
        .from('follow_ups')
        .select('original_due_date')
        .eq('id', followUpIdToUnlog)
        .eq('user_id', currentUser.id)
        .single();

      if (fetchFollowUpError || !followUpToUnlog) {
        toast({ title: 'Error Unlogging', description: 'Could not fetch follow-up details to unlog.', variant: 'destructive' });
        return;
      }

      if (!followUpToUnlog.original_due_date) {
        toast({ title: 'Error Unlogging', description: 'Original due date not found for this follow-up. Cannot revert.', variant: 'destructive' });
        return;
      }

      const revertedDueDate = startOfDay(new Date(followUpToUnlog.original_due_date));
      if (!isValid(revertedDueDate)) {
          toast({ title: 'Error Unlogging', description: 'Invalid original due date stored. Cannot revert.', variant: 'destructive'});
          return;
      }

      const { error: updateError } = await supabase
        .from('follow_ups')
        .update({
            status: 'Pending',
            follow_up_date: revertedDueDate.toISOString()
        })
        .eq('id', followUpIdToUnlog)
        .eq('user_id', currentUser.id);

      if (updateError) {
        throw updateError;
      }
      toast({ title: 'Follow-up Unlogged', description: 'The follow-up has been reverted to pending.' });

      const { data: jobOpeningData, error: fetchJobOpeningErrorPage } = await supabase
        .from('job_openings')
        .select('status')
        .eq('id', jobOpeningId)
        .eq('user_id', currentUser.id)
        .single();

      if (fetchJobOpeningErrorPage || !jobOpeningData) {
      } else {
        const newCalculatedStatus = await determineNewJobOpeningStatus(jobOpeningId, jobOpeningData.status as JobOpening['status'], currentUser.id);
        if (newCalculatedStatus && newCalculatedStatus !== jobOpeningData.status) {
          const { error: updateStatusError } = await supabase
            .from('job_openings')
            .update({ status: newCalculatedStatus })
            .eq('id', jobOpeningId)
            .eq('user_id', currentUser.id);
          if (updateStatusError) {
            toast({ title: 'Status Update Error', description: 'Follow-up unlogged, but job opening status update failed.', variant: 'destructive'});
          }
        }
      }
      await fetchPageData();
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Error Unlogging Follow-up', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
  }, [currentUser, toast, fetchPageData, router]);


  const handleInitiateDeleteOpening = (opening: JobOpening) => {
    setOpeningToDelete(opening);
    setIsEditDialogOpen(false);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteOpening = async () => {
    if (!openingToDelete || !currentUser) return;
    try {
      const { error: contactsLinkError } = await supabase
        .from('job_opening_contacts')
        .delete()
        .eq('job_opening_id', openingToDelete.id)
        .eq('user_id', currentUser.id);

      if (contactsLinkError) {
        toast({ title: 'Error Deleting Opening', description: `Could not delete contact associations: ${JSON.stringify(contactsLinkError)}`, variant: 'destructive'});
      }

      const { error: followUpsError } = await supabase
        .from('follow_ups')
        .delete()
        .eq('job_opening_id', openingToDelete.id)
        .eq('user_id', currentUser.id);

      if (followUpsError) throw followUpsError;

      const { error: jobOpeningError } = await supabase
        .from('job_openings')
        .delete()
        .eq('id', openingToDelete.id)
        .eq('user_id', currentUser.id);

      if (jobOpeningError) throw jobOpeningError;

      toast({ title: "Job Opening Deleted", description: `${openingToDelete.role_title} has been removed.`});
      await fetchPageData();
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Error Deleting Opening', description: error.message, variant: 'destructive'});
    } finally {
      setOpeningToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleToggleFavorite = async (jobOpeningId: string, currentIsFavorite: boolean) => {
    if (!currentUser) {
      toast({ title: 'Not Authenticated', description: 'Please log in to favorite openings.', variant: 'destructive' });
      return;
    }
    try {
      const newIsFavorite = !currentIsFavorite;
      const { error } = await supabase
        .from('job_openings')
        .update({
          is_favorite: newIsFavorite,
          favorited_at: newIsFavorite ? new Date().toISOString() : null,
        })
        .eq('id', jobOpeningId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      toast({
        title: newIsFavorite ? 'Added to Favorites' : 'Removed from Favorites',
        description: `Job opening has been ${newIsFavorite ? 'favorited' : 'unfavorited'}.`,
      });
      await fetchPageData();
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Error Toggling Favorite', description: error.message, variant: 'destructive' });
    }
  };


  const { actionRequiredOpenings, otherOpenings, allFilteredAndSortedOpenings } = useMemo(() => {
    let openings = [...jobOpenings];

    if (showOnlyFavorites) {
      openings = openings.filter(opening => opening.is_favorite);
    }

    if (searchTerm) {
        openings = openings.filter(opening => {
        const term = searchTerm.toLowerCase();
        const companyMatch = opening.company_name_cache.toLowerCase().includes(term);
        const roleMatch = opening.role_title.toLowerCase().includes(term);
        const contactMatch = opening.associated_contacts?.some(ac =>
          ac.name.toLowerCase().includes(term) || ac.email.toLowerCase().includes(term)
        ) || false;
        const statusMatch = opening.status.toLowerCase().includes(term);
        const tagsMatch = opening.tags && (opening.tags as string[]).some(tag => tag.toLowerCase().includes(term));
        const notesMatch = searchInNotes && opening.notes && opening.notes.toLowerCase().includes(term);
        return companyMatch || roleMatch || contactMatch || statusMatch || tagsMatch || notesMatch;
        });
    }

    const getNextPendingFollowUpDate = (opening: JobOpening): Date | null => {
      if (!opening.followUps || opening.followUps.length === 0) return null;
      const pendingFollowUps = opening.followUps
        .filter(fu => fu.status === 'Pending' && isValid(fu.follow_up_date))
        .sort((fuA, fuB) => fuA.follow_up_date.getTime() - fuB.follow_up_date.getTime());
      return pendingFollowUps.length > 0 ? pendingFollowUps[0].follow_up_date : null;
    };

    switch (sortOption) {
      case 'initialEmailDate_desc':
        openings.sort((a, b) => new Date(b.initial_email_date).getTime() - new Date(a.initial_email_date).getTime());
        break;
      case 'initialEmailDate_asc':
        openings.sort((a, b) => new Date(a.initial_email_date).getTime() - new Date(b.initial_email_date).getTime());
        break;
      case 'nextFollowUpDate_asc':
        openings.sort((a, b) => {
          const nextFollowUpA = getNextPendingFollowUpDate(a);
          const nextFollowUpB = getNextPendingFollowUpDate(b);

          if (nextFollowUpA && !nextFollowUpB) return -1;
          if (!nextFollowUpA && nextFollowUpB) return 1;
          if (!nextFollowUpA && !nextFollowUpB) {
             return new Date(b.initial_email_date).getTime() - new Date(a.initial_email_date).getTime();
          }
          if (nextFollowUpA && nextFollowUpB) {
            return nextFollowUpA.getTime() - nextFollowUpB.getTime();
          }
          return 0;
        });
        break;
      default:
        openings.sort((a, b) => new Date(b.initial_email_date).getTime() - new Date(a.initial_email_date).getTime());
    }

    if (sortOption === 'nextFollowUpDate_asc') {
      const todayStart = startOfDay(new Date());
      const actionRequired: JobOpening[] = [];
      const others: JobOpening[] = [];

      openings.forEach(opening => {
        const nextFollowUpDate = getNextPendingFollowUpDate(opening);

        if (nextFollowUpDate && isValid(nextFollowUpDate)) {
          const followUpDayStart = startOfDay(nextFollowUpDate);
          if (isToday(followUpDayStart) || isBefore(followUpDayStart, todayStart)) {
            actionRequired.push(opening);
          } else {
            others.push(opening);
          }
        } else {
          others.push(opening);
        }
      });
      return { actionRequiredOpenings: actionRequired, otherOpenings: others, allFilteredAndSortedOpenings: [] };
    }

    return { actionRequiredOpenings: [], otherOpenings: [], allFilteredAndSortedOpenings: openings };
  }, [jobOpenings, searchTerm, searchInNotes, sortOption, showOnlyFavorites]);

  const clearSearch = () => setSearchTerm('');

  const noResultsAfterFiltering =
    (sortOption === 'nextFollowUpDate_asc' && actionRequiredOpenings.length === 0 && otherOpenings.length === 0) ||
    (sortOption !== 'nextFollowUpDate_asc' && allFilteredAndSortedOpenings.length === 0);

  const isAddButtonDisabled = !currentUser || isLoadingData || subscriptionLoading ||
    (isInGracePeriod && jobOpeningsCount >= getLimitsForTier('free').jobOpenings);


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Job Openings</h2>
            <p className="text-muted-foreground">Manage your job applications and follow-ups.</p>
          </div>
          <Button onClick={handleAddOpeningClick} disabled={isAddButtonDisabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Opening
          </Button>
        </div>

         <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex items-center w-full sm:max-w-md border border-input rounded-md shadow-sm bg-background">
            <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search openings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 h-10 flex-grow border-none focus:ring-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={!currentUser || isLoadingData || subscriptionLoading}
            />
            {searchTerm && (
              <Button variant="ghost" size="icon" className="absolute right-28 mr-1 h-7 w-7 hover:bg-transparent focus-visible:bg-transparent hover:text-primary" onClick={clearSearch}>
                <XCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </Button>
            )}
            <div className="flex items-center space-x-2 pr-3 border-l border-input h-full pl-3">
              <Checkbox
                id="searchOpeningNotes"
                checked={searchInNotes}
                onCheckedChange={(checked) => setSearchInNotes(checked as boolean)}
                className="h-4 w-4"
                disabled={!currentUser || isLoadingData || subscriptionLoading}
              />
              <Label htmlFor="searchOpeningNotes" className="text-xs text-muted-foreground whitespace-nowrap">Include Notes</Label>
            </div>
          </div>
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOptionValue)} disabled={!currentUser || isLoadingData || subscriptionLoading}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[240px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            disabled={!currentUser || isLoadingData || subscriptionLoading}
            title={showOnlyFavorites ? "Show All Openings" : "Show Only Favorites"}
            className={cn(
              "hover:bg-background",
              showOnlyFavorites ?
              "text-yellow-500 bg-background" :
              "hover:text-muted-foreground"
            )}
          >
            <Star className={cn("h-5 w-5", showOnlyFavorites ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground")} />
            <span className="sr-only">{showOnlyFavorites ? "Show All" : "Show Favorites"}</span>
          </Button>
        </div>

        {(isLoadingData || subscriptionLoading) ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : !currentUser ? (
            <Card className="shadow-lg"><CardHeader><CardTitle className="font-headline flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />Please Sign In</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">You need to be signed in to manage job openings.</p></CardContent></Card>
        ) : noResultsAfterFiltering && !focusedOpening ? (
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="font-headline flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />
            {showOnlyFavorites && searchTerm ? "No Favorite Openings Match Your Search" :
             showOnlyFavorites ? "No Favorite Openings Yet" :
             searchTerm ? "No Openings Match Your Search" :
             "No Job Openings Yet"}
            </CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">
            {showOnlyFavorites && searchTerm ? "Try adjusting your search or clear the favorites filter." :
             showOnlyFavorites ? "Mark some openings as favorite to see them here." :
             searchTerm ? "Try a different search term or add a new opening." :
             "Click \"Add New Opening\" to get started."}
            </p></CardContent>
          </Card>
        ) : focusedOpening ? null : (
          sortOption === 'nextFollowUpDate_asc' ? (
            <>
              {actionRequiredOpenings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground/90 font-headline">Due Today / Overdue</h3>
                  <JobOpeningList
                    jobOpenings={actionRequiredOpenings}
                    onEditOpening={handleEditOpening}
                    onLogFollowUp={handleLogFollowUp}
                    onUnlogFollowUp={handleUnlogFollowUp}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              )}
              {actionRequiredOpenings.length > 0 && otherOpenings.length > 0 && (
                <Separator className="my-6" />
              )}
              {otherOpenings.length > 0 && (
                 <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground/90 font-headline">Upcoming Follow-ups</h3>
                  <JobOpeningList
                    jobOpenings={otherOpenings}
                    onEditOpening={handleEditOpening}
                    onLogFollowUp={handleLogFollowUp}
                    onUnlogFollowUp={handleUnlogFollowUp}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              )}
            </>
          ) : (
            <JobOpeningList
              jobOpenings={allFilteredAndSortedOpenings}
              onEditOpening={handleEditOpening}
              onLogFollowUp={handleLogFollowUp}
              onUnlogFollowUp={handleUnlogFollowUp}
              onToggleFavorite={handleToggleFavorite}
            />
          )
        )}

        {focusedOpening && (
          <Dialog open={!!focusedOpening} onOpenChange={(open) => { if (!open) handleCloseFocusedOpeningDialog(); }}>
            <DialogContent className="sm:max-w-xl p-0 border-0 shadow-2xl bg-transparent data-[state=open]:sm:zoom-in-90 data-[state=closed]:sm:zoom-out-90">
              <DialogHeader className="sr-only">
                 <RadixDialogTitle>{focusedOpening.role_title}</RadixDialogTitle>
                 <RadixDialogDescription>Details for {focusedOpening.role_title} at {focusedOpening.company_name_cache}</RadixDialogDescription>
              </DialogHeader>
              <JobOpeningCard
                opening={focusedOpening}
                onEdit={() => {
                  handleCloseFocusedOpeningDialog();
                  handleEditOpening(focusedOpening);
                }}
                onLogFollowUp={handleLogFollowUp}
                onUnlogFollowUp={handleUnlogFollowUp}
                onToggleFavorite={async (id, isFav) => {
                    await handleToggleFavorite(id, isFav);
                    const updatedFocusedOpening = jobOpenings.find(op => op.id === id);
                    if (updatedFocusedOpening) {
                        setFocusedOpening(updatedFocusedOpening);
                    } else {
                        handleCloseFocusedOpeningDialog();
                    }
                }}
                isFocusedView={true}
              />
            </DialogContent>
          </Dialog>
        )}


        <AddJobOpeningDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddJobOpening={handleAddJobOpening}
          companies={companies}
          contacts={contacts}
          companiesCount={companiesCount}
          contactsCount={contactsCount}
          jobOpeningsCount={jobOpeningsCount}
          onAddNewCompany={handleAddNewCompanyToListSupabase}
          onAddNewContact={handleAddNewContactToListSupabase}
          defaultEmailTemplates={userSettings?.default_email_templates as DefaultFollowUpTemplates | undefined}
        />
        {editingOpening && (
          <EditJobOpeningDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onUpdateJobOpening={handleUpdateJobOpening}
            openingToEdit={editingOpening}
            onInitiateDelete={handleInitiateDeleteOpening}
            companies={companies}
            contacts={contacts}
            companiesCount={companiesCount}
            contactsCount={contactsCount}
            onAddNewCompany={handleAddNewCompanyToListSupabase}
            onAddNewContact={handleAddNewContactToListSupabase}
          />
        )}
         <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the job opening:
                <span className="font-semibold"> {openingToDelete?.role_title} at {openingToDelete?.company_name_cache}</span>.
                 All associated follow-up records will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setOpeningToDelete(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteOpening} className="bg-destructive hover:bg-destructive/90">
                Delete Opening
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

