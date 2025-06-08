
'use client';

import React, { useState, useEffect, type ReactNode, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { SidebarNav } from './SidebarNav';
import { Logo } from '../icons/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { LogOut, Loader2, Settings, CreditCard, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Around } from "@theme-toggles/react"
import "@theme-toggles/react/css/Around.css"
import { cn } from '@/lib/utils';
import { SidebarUsageProgress } from './SidebarUsageProgress';
import type { JobOpening } from '@/lib/types';

const PUBLIC_PATHS = ['/landing', '/auth'];
const HIDE_DASHBOARD_LINK_PATHS = ['/', '/job-openings', '/contacts', '/companies', '/settings/billing', '/settings/account'];


function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const names = name.split(' ').filter(Boolean);
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    } else if (names.length === 1 && names[0].length > 0) {
      return names[0].substring(0, 2).toUpperCase();
    }
  }
  if (email) {
    const emailPrefix = email.split('@')[0];
    if (emailPrefix.length >= 2) {
      return emailPrefix.substring(0, 2).toUpperCase();
    } else if (emailPrefix.length === 1) {
      return emailPrefix.toUpperCase();
    }
  }
  return 'U';
}


export function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [favoriteJobOpenings, setFavoriteJobOpenings] = useState<JobOpening[]>([]);

  const fetchFavoriteJobOpenings = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_openings')
        .select('id, role_title, company_name_cache, favorited_at, is_favorite')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('favorited_at', { ascending: true, nulls: 'last' });

      if (error) throw error;
      setFavoriteJobOpenings(data as JobOpening[] || []);
    } catch (error: any) {
      toast({ title: 'Error Fetching Favorites', description: error.message, variant: 'destructive' });
      setFavoriteJobOpenings([]);
    }
  }, [toast]);

  useEffect(() => {
    setIsLoadingAuth(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        const newCurrentUser = currentSession?.user ?? null;
        setUser(newCurrentUser);

        if (newCurrentUser) {
          fetchFavoriteJobOpenings(newCurrentUser.id);
        } else {
          setFavoriteJobOpenings([]);
        }

        setIsLoadingAuth(false);

        if (event === 'SIGNED_OUT') {
          if (!PUBLIC_PATHS.includes(pathname)) {
            router.push('/landing');
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        const initialUser = initialSession?.user ?? null;
        setUser(initialUser);
        if (initialUser) {
          fetchFavoriteJobOpenings(initialUser.id);
        } else {
          setFavoriteJobOpenings([]);
        }

        if (!initialUser && !isLoadingAuth && !PUBLIC_PATHS.includes(pathname)) {
             router.push('/landing');
        } else if (initialUser && !isLoadingAuth && PUBLIC_PATHS.includes(pathname)) {
            router.push('/');
        }
        if (isLoadingAuth) {
            setIsLoadingAuth(false);
        }
    });


    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');


    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchFavoriteJobOpenings, pathname, router]);

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (user && isPublicPath) {
      router.push('/');
    } else if (!user && !isPublicPath) {
      router.push('/landing');
    }
  }, [user, isLoadingAuth, pathname, router]);


  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: 'Sign Out Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Signed Out Successfully' });
      setFavoriteJobOpenings([]);
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        localStorage.setItem('theme', newTheme);
        return newTheme;
    });
  };

  if (isLoadingAuth && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (PUBLIC_PATHS.includes(pathname)) {
     if (user && isLoadingAuth) {
         return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
     }
     if (user && !isLoadingAuth) {
         return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
     }
     return <>{children}</>;
  }

  if (!user && !isLoadingAuth) {
     return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && isLoadingAuth) {
     return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const userInitials = user ? getInitials(user.user_metadata?.full_name, user.email) : 'U';
  const userDisplayName = user?.user_metadata?.full_name || user?.email || 'User';

  const menuItemClass = "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
  const showDashboardLink = !HIDE_DASHBOARD_LINK_PATHS.includes(pathname);

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 items-center flex justify-between">
          <Link href="/" passHref>
            <Logo className="group-data-[collapsible=icon]:hidden" />
          </Link>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden md:hidden hover:bg-transparent focus-visible:bg-transparent hover:text-primary" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav favoriteJobOpenings={favoriteJobOpenings} />
        </SidebarContent>
        <SidebarFooter
          className={cn(
            "flex flex-col justify-start",
            "p-2 group-data-[collapsible=icon]:pt-1 group-data-[collapsible=icon]:pb-2 group-data-[collapsible=icon]:pl-2 group-data-[collapsible=icon]:pr-2"
        )}>
          <SidebarUsageProgress user={user} />
          <div className={cn("mt-4 flex items-center", "group-data-[collapsible=icon]:justify-center justify-start")}>
            <Around
              toggled={theme === 'dark'}
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
              className={cn(
                  "theme-toggle",
                  "text-xl text-sidebar-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar-background hover:text-sidebar-foreground",
                  "w-auto",
                  "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:p-0"
              )}
              style={{ '--theme-toggle__around--duration': '500ms' } as React.CSSProperties}
            />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 shadow-sm">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden hover:bg-transparent focus-visible:bg-transparent hover:text-primary" />
            </div>
            {user && (
            <HoverCard openDelay={0} closeDelay={200}>
                <HoverCardTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-9 w-9 rounded-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-none hover:bg-transparent focus-visible:bg-transparent"
                    >
                        <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                            {userInitials}
                        </AvatarFallback>
                        </Avatar>
                    </Button>
                </HoverCardTrigger>
                <HoverCardContent align="end" className="w-56 p-1">
                    <div className={cn(menuItemClass, "font-normal px-2 py-1.5")}>
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{userDisplayName}</p>
                        {user.email && <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>}
                        </div>
                    </div>
                    <div className="my-1 h-px bg-muted" />
                    <Link href="/landing" passHref legacyBehavior>
                        <a className={cn(menuItemClass, "cursor-pointer hover:bg-accent hover:text-accent-foreground")}>
                        <Home className="mr-2 h-4 w-4" />
                        <span>Homepage</span>
                        </a>
                    </Link>
                    {showDashboardLink && (
                         <Link href="/" passHref legacyBehavior>
                            <a className={cn(menuItemClass, "cursor-pointer hover:bg-accent hover:text-accent-foreground")}>
                            <Home className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                            </a>
                        </Link>
                    )}
                    <Link href="/settings/account" passHref legacyBehavior>
                        <a className={cn(menuItemClass, "cursor-pointer hover:bg-accent hover:text-accent-foreground")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Account Settings</span>
                        </a>
                    </Link>
                    <Link href="/settings/billing" passHref legacyBehavior>
                        <a className={cn(menuItemClass, "cursor-pointer hover:bg-accent hover:text-accent-foreground")}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Billing &amp; Plan</span>
                        </a>
                    </Link>
                    <div className="my-1 h-px bg-muted" />
                    <button
                        onClick={handleSignOut}
                        className={cn(menuItemClass, "text-destructive hover:bg-destructive/20 hover:text-destructive focus:bg-destructive/20 focus:text-destructive cursor-pointer w-full")}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                    </button>
                </HoverCardContent>
              </HoverCard>
            )}
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
