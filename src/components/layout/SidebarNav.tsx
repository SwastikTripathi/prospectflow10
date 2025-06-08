
'use client';

import React from 'react'; 
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Users, Building2, Star, Edit3, Rss } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { JobOpening } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient'; 
import { useEffect, useState } from 'react'; 
import { OWNER_EMAIL } from '@/lib/config'; 

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  separator?: boolean; 
  ownerOnly?: boolean; 
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/job-openings', label: 'Job Openings', icon: Briefcase },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/companies', label: 'Companies', icon: Building2 },
];

const blogNavItems: NavItem[] = [
  { href: '/blog', label: 'View Blog', icon: Rss, separator: true, ownerOnly: true },
  { href: '/blog/create', label: 'Create New Post', icon: Edit3, ownerOnly: true },
];


interface SidebarNavProps {
  favoriteJobOpenings?: JobOpening[];
}

export function SidebarNav({ favoriteJobOpenings = [] }: SidebarNavProps) {
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      setIsLoadingUser(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === OWNER_EMAIL) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
      setIsLoadingUser(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const currentUser = session?.user;
        if (currentUser && currentUser.email === OWNER_EMAIL) {
            setIsOwner(true);
        } else {
            setIsOwner(false);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const isCollapsedDesktop = sidebarState === 'collapsed' && !isMobile;
  const isExpandedDesktop = sidebarState === 'expanded' && !isMobile;

  const renderNavItems = (items: NavItem[], groupLabel?: string) => {
    const filteredItems = items.filter(item => !item.ownerOnly || (item.ownerOnly && isOwner));
    
    if (filteredItems.length === 0 && groupLabel && items.every(item => item.ownerOnly)) return null; 
    if (filteredItems.length === 0 && !groupLabel) return null;


    return (
        <SidebarGroup>
        {groupLabel && (
            <SidebarGroupLabel className="group-data-[collapsible=icon]:sr-only">
            {groupLabel}
            </SidebarGroupLabel>
        )}
        <SidebarMenu>
            {filteredItems.map((item) => (
            <React.Fragment key={item.label}>
                {item.separator && item.ownerOnly && isOwner && <SidebarSeparator className="my-1" />}
                <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                    className={cn(item.disabled && "cursor-not-allowed opacity-50")}
                    tooltip={isCollapsedDesktop ? { children: item.label, side: "right", align: "center" } : undefined}
                >
                    <Link
                    href={item.href}
                    aria-disabled={item.disabled}
                    tabIndex={item.disabled ? -1 : undefined}
                    onClick={(e) => {
                        if (item.disabled) {
                        e.preventDefault();
                        }
                    }}
                    >
                    <item.icon />
                    <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            </React.Fragment>
            ))}
        </SidebarMenu>
        </SidebarGroup>
    );
  };
  
  if (isLoadingUser && !isCollapsedDesktop) { 
    return (
      <div className="space-y-2 p-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 animate-pulse">
            <div className="h-5 w-5 rounded bg-muted"></div>
            <div className="h-4 w-3/4 rounded bg-muted"></div>
          </div>
        ))}
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full">
      <div> 
        {renderNavItems(mainNavItems)}
        {isOwner && renderNavItems(blogNavItems, "Blog Management")}
      </div>

      {favoriteJobOpenings && favoriteJobOpenings.length > 0 && (
        <>
          <SidebarSeparator />
          <SidebarGroup className="flex flex-col flex-1 min-h-0">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:sr-only shrink-0">
              Favorites
            </SidebarGroupLabel>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <SidebarMenu>
                {favoriteJobOpenings.map((opening) => {
                  const favoriteDisplayName = `${opening.role_title} @ ${opening.company_name_cache}`;
                  return (
                    <SidebarMenuItem key={opening.id} className="group/favorite-item">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              className="w-full"
                              tooltip={isCollapsedDesktop ? { children: favoriteDisplayName, side: "right", align: "center" } : undefined}
                            >
                              <Link href={`/job-openings?view=${opening.id}`}>
                                <Star className="text-yellow-500 flex-shrink-0" />
                                <span className={cn("truncate ml-2", isCollapsedDesktop ? "hidden" : "group-data-[collapsible=icon]:hidden")}>
                                  {favoriteDisplayName}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {isExpandedDesktop && (
                            <TooltipContent
                              side="bottom"
                              align="start"
                              className="whitespace-normal max-w-xs z-50 bg-popover text-popover-foreground"
                              sideOffset={5}
                            >
                              {favoriteDisplayName}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          </SidebarGroup>
        </>
      )}
    </div>
  );
}
