
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { Settings, LogOut, LayoutDashboard, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Around } from "@theme-toggles/react";
import "@theme-toggles/react/css/Around.css";
import { cn } from '@/lib/utils';

interface PublicNavbarProps {
  activeLink?: 'landing' | 'pricing' | 'blog' | 'about';
}

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


export function PublicNavbar({ activeLink }: PublicNavbarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    setIsLoadingAuth(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoadingAuth(false);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setIsLoadingAuth(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signOut();
    setIsLoadingAuth(false);
    if (error) {
      toast({ title: 'Sign Out Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Signed Out Successfully' });
      router.push('/landing');
    }
  };

  const toggleThemeHandler = () => {
    setTheme(prevTheme => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        localStorage.setItem('theme', newTheme);
        return newTheme;
    });
  };

  const userInitials = user ? getInitials(user.user_metadata?.full_name, user.email) : 'U';
  const userDisplayName = user?.user_metadata?.full_name || user?.email || 'User';

  const navLinkClass = (linkType?: 'landing' | 'pricing' | 'blog' | 'about') => {
    const isActive = activeLink === linkType && typeof linkType !== 'undefined'; 
    return cn(
      "rounded-full px-3 py-1.5 sm:px-4 h-auto text-sm font-medium",
      "transition-colors duration-150 ease-in-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      isActive
        ? "text-primary font-semibold cursor-default"
        : "text-foreground/70 hover:underline hover:underline-offset-4 active:text-primary/90"
    );
  };

  const menuItemClass = "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between mx-auto px-[5vw] md:px-[10vw]">
        <Link href="/landing" className="mr-6 flex items-center space-x-2">
          <Logo />
        </Link>
        <nav className="flex items-center space-x-0.5 sm:space-x-1">
          <Button variant="nav-text" asChild className={navLinkClass('pricing')}>
            <Link href={user ? "/settings/billing" : "/pricing"}>Pricing</Link>
          </Button>
          <Button variant="nav-text" asChild className={navLinkClass('blog')}>
            <Link href="/blog">Blog</Link>
          </Button>
          <Button variant="nav-text" asChild className={navLinkClass('about')}>
            <Link href="/about">About</Link>
          </Button>

          <div className="mx-1 sm:mx-2 flex items-center h-full">
            <Around
                toggled={theme === 'dark'}
                onClick={toggleThemeHandler}
                title="Toggle theme"
                aria-label="Toggle theme"
                className={cn(
                "theme-toggle text-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background hover:text-foreground/70",
                "block h-6 w-6 p-0"
                )}
                style={{ '--theme-toggle__around--duration': '500ms' } as React.CSSProperties}
            />
          </div>

          {isLoadingAuth ? (
            <div className="flex items-center space-x-2">
                 <div className="h-8 w-20 rounded-full bg-muted animate-pulse"></div>
                 <div className="h-9 px-4 py-2 rounded-full bg-muted animate-pulse w-32"></div>
            </div>
          ) : user ? (
            <HoverCard openDelay={0} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent align="end" className="w-56 p-1">
                 <div className="px-2 py-1.5">
                    <p className="text-sm font-medium leading-none truncate">{userDisplayName}</p>
                    {user.email && <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>}
                 </div>
                 <div className="my-1 h-px bg-muted" />
                <Link href="/landing" passHref legacyBehavior>
                  <a className={cn(menuItemClass)}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Homepage</span>
                  </a>
                </Link>
                <Link href="/" passHref legacyBehavior>
                  <a className={cn(menuItemClass)}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </a>
                </Link>
                <Link href="/settings/account" passHref legacyBehavior>
                   <a className={cn(menuItemClass)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </Link>
                 <div className="my-1 h-px bg-muted" />
                <button
                  onClick={handleSignOut}
                  className={cn(menuItemClass, "w-full text-destructive hover:bg-destructive/20 focus:bg-destructive/20 hover:text-destructive focus:text-destructive")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <>
              <Button variant="nav-text" asChild className={navLinkClass()}>
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button asChild className="shadow-md rounded-full h-9 px-4 text-sm">
                <Link href="/auth?action=signup">Get Started Free.</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
