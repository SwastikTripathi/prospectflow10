
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Building2, Search as SearchIcon, Trash2, XCircle, Loader2, Star } from 'lucide-react';
import type { Company, SubscriptionTier } from '@/lib/types';
import { AddCompanyDialog } from './components/AddCompanyDialog';
import { EditCompanyDialog } from './components/EditCompanyDialog';
import { CompanyList } from './components/CompanyList';
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


export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInNotes, setSearchInNotes] = useState(true);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
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
          setCompanies([]);
          setCompaniesCount(0);
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

  const fetchCompanies = useCallback(async () => {
    if (!currentUser) {
      setCompanies([]);
      setCompaniesCount(0);
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    try {
      const [{ data, error }, { count, error: countError }] = await Promise.all([
        supabase
          .from('companies')
          .select('*, is_favorite')
          .eq('user_id', currentUser.id)
          .order('name', { ascending: true }),
        supabase
          .from('companies')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
      ]);


      if (error) throw error;
      setCompanies(data as Company[] || []);

      if (countError) throw countError;
      setCompaniesCount(count ?? 0);

    } catch (error: any) {
      toast({
        title: 'Error Fetching Companies',
        description: error.message || 'Could not retrieve companies from the database.',
        variant: 'destructive',
      });
      setCompanies([]);
      setCompaniesCount(0);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if(currentUser) {
      fetchCompanies();
    } else {
      setIsLoadingData(false);
    }
  }, [currentUser, fetchCompanies]);


  useEffect(() => {
    if (searchParams?.get('new') === 'true' && currentUser) {
      handleAddCompanyClick();
      if (typeof window !== "undefined") {
        router.replace('/companies', {scroll: false});
      }
    }
  }, [searchParams, currentUser, router]); // handleAddCompanyClick needs to be stable or wrapped in useCallback

  const handleAddCompanyClick = () => {
    if (!currentUser || subscriptionLoading) return;
    const limits = getLimitsForTier(effectiveTierForLimits);
    if (companiesCount >= limits.companies) {
      let message = `You have reached the limit of ${limits.companies} companies for your current plan.`;
      if (isInGracePeriod) {
        message = `Your premium plan has expired, and you've reached the Free Tier limit of ${limits.companies} companies. Please renew or manage your data.`;
      } else if (effectiveTierForLimits !== 'free') {
         message = `You've reached the limit of ${limits.companies} companies for your Premium plan.`;
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


  const handleAddCompany = async (companyData: Omit<Company, 'id' | 'user_id' | 'created_at' | 'is_favorite'>) => {
    if (!currentUser) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to add a company.', variant: 'destructive'});
        return;
    }
    const limits = getLimitsForTier(effectiveTierForLimits);
    if (companiesCount >= limits.companies) {
      toast({
        title: 'Limit Reached',
        description: `Cannot add new company. You've reached the limit of ${limits.companies} for your plan.`,
        variant: 'destructive',
      });
      setIsAddDialogOpen(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ ...companyData, user_id: currentUser.id, is_favorite: false }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        fetchCompanies();
        toast({
          title: "Company Added",
          description: `${data.name} has been added.`,
        });
        setIsAddDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error Adding Company',
        description: error.message || 'Could not save the company.',
        variant: 'destructive',
      });
    }
  };


  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCompany = async (updatedCompanyData: Company) => {
     if (!currentUser || !updatedCompanyData.id) {
        toast({ title: 'Error', description: 'Invalid operation.', variant: 'destructive'});
        return;
    }
    const { id, user_id, created_at, is_favorite, ...updatePayload } = updatedCompanyData;

    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        fetchCompanies();
         toast({
          title: "Company Updated",
          description: `${data.name} has been updated.`,
        });
        setIsEditDialogOpen(false);
        setEditingCompany(null);
      }
    } catch (error: any) {
       toast({
        title: 'Error Updating Company',
        description: error.message || 'Could not update the company.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavoriteCompany = async (companyId: string, currentIsFavorite: boolean) => {
    if (!currentUser) {
      toast({ title: 'Not Authenticated', description: 'Please log in.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_favorite: !currentIsFavorite })
        .eq('id', companyId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      toast({
        title: !currentIsFavorite ? 'Added to Favorites' : 'Removed from Favorites',
      });
      await fetchCompanies();
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Error Toggling Favorite', description: error.message, variant: 'destructive' });
    }
  };

  const handleInitiateDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setIsEditDialogOpen(false);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteCompany = async () => {
    if (!companyToDelete || !currentUser) return;
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyToDelete.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      fetchCompanies();
      toast({
        title: "Company Deleted",
        description: `${companyToDelete.name} has been removed.`,
      });
    } catch (error: any) {
       toast({
        title: 'Error Deleting Company',
        description: error.message || 'Could not delete the company.',
        variant: 'destructive',
      });
    } finally {
        setCompanyToDelete(null);
        setIsDeleteConfirmOpen(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    if (showOnlyFavorites && !company.is_favorite) {
        return false;
    }
    const term = searchTerm.toLowerCase();
    const nameMatch = company.name.toLowerCase().includes(term);
    const websiteMatch = company.website && company.website.toLowerCase().includes(term);
    const notesMatch = searchInNotes && company.notes && company.notes.toLowerCase().includes(term);
    return nameMatch || websiteMatch || notesMatch;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const clearSearch = () => {
    setSearchTerm('');
  };

  const isAddButtonDisabled = !currentUser || isLoadingData || subscriptionLoading ||
    (isInGracePeriod && companiesCount >= getLimitsForTier('free').companies);


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Companies</h2>
            <p className="text-muted-foreground">Manage your company directory.</p>
          </div>
          <Button onClick={handleAddCompanyClick} disabled={isAddButtonDisabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Company
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex items-center w-full sm:max-w-md border border-input rounded-md shadow-sm bg-background">
            <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search companies..."
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
                id="searchCompanyNotes"
                checked={searchInNotes}
                onCheckedChange={(checked) => setSearchInNotes(checked as boolean)}
                className="h-4 w-4"
                disabled={!currentUser || isLoadingData || subscriptionLoading}
              />
              <Label htmlFor="searchCompanyNotes" className="text-xs text-muted-foreground whitespace-nowrap">Include Notes</Label>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            disabled={!currentUser || isLoadingData || subscriptionLoading}
            title={showOnlyFavorites ? "Show All Companies" : "Show Only Favorites"}
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
            <CardHeader>
              <CardTitle className="font-headline flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-primary" />
                Please Sign In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You need to be signed in to view and manage companies.
              </p>
            </CardContent>
          </Card>
        ) : filteredCompanies.length > 0 ? (
          <CompanyList
            companies={filteredCompanies}
            onEditCompany={handleEditCompany}
            onToggleFavoriteCompany={handleToggleFavoriteCompany}
          />
        ) : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-primary" />
                {showOnlyFavorites && searchTerm ? "No Favorite Companies Match Your Search" :
                 showOnlyFavorites ? "No Favorite Companies Yet" :
                 searchTerm ? "No Companies Match Your Search" :
                 "Company Directory is Empty"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {showOnlyFavorites && searchTerm ? "Try adjusting your search or clear the favorites filter." :
                 showOnlyFavorites ? "Mark some companies as favorite to see them here." :
                 searchTerm ? "Try a different search term or add a new company." :
                 "No companies have been added yet. Click \"Add New Company\" to start building your directory."}
              </p>
            </CardContent>
          </Card>
        )}

        <AddCompanyDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddCompanySubmit={handleAddCompany}
        />
        {editingCompany && (
          <EditCompanyDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onUpdateCompany={handleUpdateCompany}
            companyToEdit={editingCompany}
            onInitiateDelete={handleInitiateDeleteCompany}
          />
        )}
         <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the company
                <span className="font-semibold"> {companyToDelete?.name}</span>.
                Associated contacts and job openings will have their company link removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setCompanyToDelete(null); setIsDeleteConfirmOpen(false);}}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteCompany} className="bg-destructive hover:bg-destructive/90">
                Delete Company
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

