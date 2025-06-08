
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Users, Search as SearchIcon, Trash2, XCircle, Loader2, Star } from 'lucide-react';
import type { Contact, Company, SubscriptionTier } from '@/lib/types';
import { AddContactDialog, type AddContactFormValues } from './components/AddContactDialog';
import { EditContactDialog, type EditContactFormValues } from './components/EditContactDialog';
import { ContactList } from './components/ContactList';
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
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { useCurrentSubscription } from '@/hooks/use-current-subscription';
import { getLimitsForTier } from '@/lib/config';

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInNotes, setSearchInNotes] = useState(true);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
          setContacts([]);
          setContactsCount(0);
          setCompanies([]);
          setIsLoadingData(false);
        }
      }
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user);
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const fetchContactsAndCompanies = useCallback(async () => {
    if (!currentUser) {
      setContacts([]);
      setContactsCount(0);
      setCompanies([]);
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    try {
      const [contactsResponse, companiesResponse, contactsCountResponse] = await Promise.all([
        supabase.from('contacts').select('*, is_favorite').eq('user_id', currentUser.id).order('name', { ascending: true }),
        supabase.from('companies').select('*').eq('user_id', currentUser.id).order('name', { ascending: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
      ]);

      if (contactsResponse.error) throw contactsResponse.error;
      setContacts(contactsResponse.data as Contact[] || []);

      if (companiesResponse.error) throw companiesResponse.error;
      setCompanies(companiesResponse.data || []);
      
      if (contactsCountResponse.error) throw contactsCountResponse.error;
      setContactsCount(contactsCountResponse.count ?? 0);


    } catch (error: any) {
      toast({
        title: 'Error Fetching Data',
        description: error.message || 'Could not retrieve data from the database.',
        variant: 'destructive',
      });
      setContacts([]);
      setContactsCount(0);
      setCompanies([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (currentUser) {
      fetchContactsAndCompanies();
    } else {
      setIsLoadingData(false);
    }
  }, [currentUser, fetchContactsAndCompanies]);

  useEffect(() => {
    if (searchParams?.get('new') === 'true' && currentUser) {
      handleAddContactClick();
      if (typeof window !== "undefined") {
        router.replace('/contacts', {scroll: false});
      }
    }
  }, [searchParams, currentUser, router]); // handleAddContactClick needs to be stable or wrapped if added to dependencies

  const handleAddContactClick = () => {
    if (!currentUser || subscriptionLoading) return;
    const limits = getLimitsForTier(effectiveTierForLimits);
    if (contactsCount >= limits.contacts) {
      let message = `You have reached the limit of ${limits.contacts} contacts for your current plan.`;
       if (isInGracePeriod) {
        message = `Your premium plan has expired, and you've reached the Free Tier limit of ${limits.contacts} contacts. Please renew or manage your data.`;
      } else if (effectiveTierForLimits !== 'free') {
         message = `You've reached the limit of ${limits.contacts} contacts for your Premium plan.`;
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

  const handleAttemptCreateCompany = async (companyName: string): Promise<Company | null> => {
    if (!currentUser) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return null;
    }
    if (!companyName.trim()) {
        toast({ title: 'Validation Error', description: 'Company name cannot be empty.', variant: 'destructive'});
        return null;
    }

    const existingCompany = companies.find(c => c.name.toLowerCase() === companyName.trim().toLowerCase());
    if (existingCompany) {
        toast({ title: 'Company Exists', description: `${companyName} already exists. Selecting it.`, variant: 'default' });
        return existingCompany;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name: companyName, user_id: currentUser.id, is_favorite: false }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        toast({ title: "Company Added", description: `${data.name} has been added.` });
        await fetchContactsAndCompanies();
        return data as Company;
      }
      return null;
    } catch (error: any) {
      toast({ title: 'Error Adding Company', description: error.message || 'Could not save company.', variant: 'destructive' });
      return null;
    }
  };

  const handleAddContactSubmit = async (values: AddContactFormValues) => {
    if (!currentUser) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    const limits = getLimitsForTier(effectiveTierForLimits);
    if (contactsCount >= limits.contacts) {
      toast({
        title: 'Limit Reached',
        description: `Cannot add new contact. You've reached the limit of ${limits.contacts} for your plan.`,
        variant: 'destructive',
      });
      setIsAddDialogOpen(false);
      return;
    }


    let companyIdToLink: string | null = values.company_id || null;
    let companyNameCache: string | null = values.company_name_input || null;

    if (!companyIdToLink && values.company_name_input) {
        const company = await handleAttemptCreateCompany(values.company_name_input);
        if (company) {
            companyIdToLink = company.id;
            companyNameCache = company.name;
        } else {
            return;
        }
    } else if (companyIdToLink && values.company_name_input) {
      const selectedCompany = companies.find(c => c.id === companyIdToLink);
      companyNameCache = selectedCompany ? selectedCompany.name : values.company_name_input;
    }


    const contactDataToInsert = {
      user_id: currentUser.id,
      name: values.name,
      email: values.email,
      role: values.role || null,
      phone: values.phone || null,
      linkedin_url: values.linkedin_url || null,
      notes: values.notes || null,
      company_id: companyIdToLink,
      company_name_cache: companyNameCache,
      tags: [],
      is_favorite: false,
    };

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([contactDataToInsert])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        toast({ title: "Contact Added", description: `${data.name} has been added.` });
        fetchContactsAndCompanies();
        setIsAddDialogOpen(false);
      }
    } catch (error: any) {
      toast({ title: 'Error Adding Contact', description: error.message || 'Could not save contact.', variant: 'destructive' });
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContactSubmit = async (values: EditContactFormValues, contactId: string) => {
    if (!currentUser) {
      toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    let companyIdToLink: string | null = values.company_id || null;
    let companyNameCache: string | null = values.company_name_input || null;

    if (!companyIdToLink && values.company_name_input) {
        const company = await handleAttemptCreateCompany(values.company_name_input);
        if (company) {
            companyIdToLink = company.id;
            companyNameCache = company.name;
        } else {
            return;
        }
    } else if (companyIdToLink && values.company_name_input) {
        const selectedCompany = companies.find(c => c.id === companyIdToLink);
        companyNameCache = selectedCompany ? selectedCompany.name : values.company_name_input;
    } else if (!values.company_name_input) {
        companyIdToLink = null;
        companyNameCache = null;
    }

    const contactDataToUpdate = {
      name: values.name,
      email: values.email,
      role: values.role || null,
      phone: values.phone || null,
      linkedin_url: values.linkedin_url || null,
      notes: values.notes || null,
      company_id: companyIdToLink,
      company_name_cache: companyNameCache,
    };

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(contactDataToUpdate)
        .eq('id', contactId)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        toast({ title: "Contact Updated", description: `${data.name} has been updated.` });
        fetchContactsAndCompanies();
        setIsEditDialogOpen(false);
        setEditingContact(null);
      }
    } catch (error: any) {
      toast({ title: 'Error Updating Contact', description: error.message || 'Could not update contact.', variant: 'destructive' });
    }
  };

  const handleToggleFavoriteContact = async (contactId: string, currentIsFavorite: boolean) => {
    if (!currentUser) {
      toast({ title: 'Not Authenticated', description: 'Please log in.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_favorite: !currentIsFavorite })
        .eq('id', contactId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      toast({
        title: !currentIsFavorite ? 'Added to Favorites' : 'Removed from Favorites',
      });
      await fetchContactsAndCompanies();
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Error Toggling Favorite', description: error.message, variant: 'destructive' });
    }
  };

  const handleInitiateDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setIsEditDialogOpen(false);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete || !currentUser) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactToDelete.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      toast({ title: "Contact Deleted", description: `${contactToDelete.name} has been removed.` });
      fetchContactsAndCompanies();
    } catch (error: any) {
      toast({ title: 'Error Deleting Contact', description: error.message || 'Could not delete contact.', variant: 'destructive' });
    } finally {
      setContactToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (showOnlyFavorites && !contact.is_favorite) {
      return false;
    }
    const term = searchTerm.toLowerCase();
    const nameMatch = contact.name.toLowerCase().includes(term);
    const emailMatch = contact.email.toLowerCase().includes(term);
    const roleMatch = contact.role && contact.role.toLowerCase().includes(term);
    const companyMatch = contact.company_name_cache && contact.company_name_cache.toLowerCase().includes(term);
    const notesMatch = searchInNotes && contact.notes && contact.notes.toLowerCase().includes(term);
    return nameMatch || emailMatch || roleMatch || companyMatch || notesMatch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const clearSearch = () => {
    setSearchTerm('');
  };

  const isAddButtonDisabled = !currentUser || isLoadingData || subscriptionLoading ||
    (isInGracePeriod && contactsCount >= getLimitsForTier('free').contacts);


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Contacts</h2>
            <p className="text-muted-foreground">Manage your professional contacts.</p>
          </div>
          <Button onClick={handleAddContactClick} disabled={isAddButtonDisabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Contact
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
           <div className="relative flex items-center w-full sm:max-w-md border border-input rounded-md shadow-sm bg-background">
            <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search contacts..."
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
                id="searchContactNotes"
                checked={searchInNotes}
                onCheckedChange={(checked) => setSearchInNotes(checked as boolean)}
                className="h-4 w-4"
                disabled={!currentUser || isLoadingData || subscriptionLoading}
              />
              <Label htmlFor="searchContactNotes" className="text-xs text-muted-foreground whitespace-nowrap">Include Notes</Label>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            disabled={!currentUser || isLoadingData || subscriptionLoading}
            title={showOnlyFavorites ? "Show All Contacts" : "Show Only Favorites"}
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
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : !currentUser ? (
           <Card className="shadow-lg">
            <CardHeader><CardTitle className="font-headline flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Please Sign In</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You need to be signed in to view and manage contacts.</p></CardContent>
          </Card>
        ) : filteredContacts.length > 0 ? (
          <ContactList
            contacts={filteredContacts}
            onEditContact={handleEditContact}
            onToggleFavoriteContact={handleToggleFavoriteContact}
          />
        ) : (
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                {showOnlyFavorites && searchTerm ? "No Favorite Contacts Match Your Search" :
                 showOnlyFavorites ? "No Favorite Contacts Yet" :
                 searchTerm ? "No Contacts Match Your Search" :
                 "Contact Directory is Empty"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {showOnlyFavorites && searchTerm ? "Try adjusting your search or clear the favorites filter." :
                 showOnlyFavorites ? "Mark some contacts as favorite to see them here." :
                 searchTerm ? "Try a different search term or add a new contact." :
                 "No contacts have been added yet. Click \"Add New Contact\" to start building your directory."}
              </p>
            </CardContent>
          </Card>
        )}

        <AddContactDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddContactSubmit={handleAddContactSubmit}
          companies={companies}
          onAttemptCreateCompany={handleAttemptCreateCompany}
        />
        {editingContact && (
          <EditContactDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onUpdateContactSubmit={handleUpdateContactSubmit}
            contactToEdit={editingContact}
            companies={companies}
            onAttemptCreateCompany={handleAttemptCreateCompany}
            onInitiateDelete={handleInitiateDeleteContact}
          />
        )}
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the contact
                <span className="font-semibold"> {contactToDelete?.name}</span>.
                Associated job openings will have their contact link removed (contact name/email will be cached).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setContactToDelete(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteContact} className="bg-destructive hover:bg-destructive/90">
                Delete Contact
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

