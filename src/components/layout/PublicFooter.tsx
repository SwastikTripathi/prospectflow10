
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Youtube, Linkedin, Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const footerLinkConfigBase = [
  {
    title: 'Explore',
    links: [
      { name: 'Pricing', href: '/pricing' },
      { name: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Partner with Us', href: '/partner-with-us' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms & Conditions', href: '/terms-and-conditions' },
    ],
  },
  {
    title: 'Get Help',
    links: [
      { name: 'Contact Us', href: '/contact' },
      // Country selector will be manually added here
    ],
  },
];

const sampleCountries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
];

const LOCAL_STORAGE_COUNTRY_KEY = 'prospectflow-selected-country-name';

export function PublicFooter() {
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
  const [countrySearchInput, setCountrySearchInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedCountryName = localStorage.getItem(LOCAL_STORAGE_COUNTRY_KEY);
    if (storedCountryName) {
      setSelectedCountryName(storedCountryName);
    }
  }, []);

  const handleCountrySelect = (name: string) => {
    setSelectedCountryName(name);
    localStorage.setItem(LOCAL_STORAGE_COUNTRY_KEY, name);
    setCountrySearchInput(''); // Clear search input after selection
  };

  if (!isMounted) {
    return (
      <footer className="bg-slate-900 text-slate-300">
        <div className="container mx-auto px-[5vw] md:px-[10vw] py-12 md:py-16">
          {/* Skeleton or simplified footer */}
        </div>
      </footer>
    );
  }

  const filteredSampleCountries = sampleCountries.filter(country =>
    country.name.toLowerCase().includes(countrySearchInput.toLowerCase())
  );

  const showCustomCountryOption = countrySearchInput.trim() !== '' &&
    !sampleCountries.some(c => c.name.toLowerCase() === countrySearchInput.trim().toLowerCase());

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-[5vw] md:px-[10vw] py-12 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {footerLinkConfigBase.map((category) => (
            <div key={category.title}>
              <h5 className="font-bold text-slate-50 mb-4">{category.title}</h5>
              <ul className="space-y-2">
                {category.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
                {category.title === 'Get Help' && (
                  <li className="mt-2">
                    <DropdownMenu onOpenChange={(open) => { if (!open) setCountrySearchInput(''); }}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 hover:text-slate-50 text-left">
                          <span className="truncate">Country: {selectedCountryName || 'Not Set'}</span>
                          <Globe className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 bg-slate-800 border-slate-700 text-slate-200">
                        <div className="p-2">
                          <Input
                            placeholder="Search or type country..."
                            value={countrySearchInput}
                            onChange={(e) => setCountrySearchInput(e.target.value)}
                            className="bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-400 focus:border-primary"
                          />
                        </div>
                        <DropdownMenuSeparator className="bg-slate-700"/>
                        {filteredSampleCountries.map((country) => (
                          <DropdownMenuItem
                            key={country.code}
                            onSelect={() => handleCountrySelect(country.name)}
                            className="hover:!bg-slate-700 hover:!text-slate-50 focus:!bg-slate-700 focus:!text-slate-50"
                          >
                            <span className="flex-1">{country.name}</span>
                            {selectedCountryName === country.name && <Check className="h-4 w-4 text-primary" />}
                          </DropdownMenuItem>
                        ))}
                        {showCustomCountryOption && (
                          <>
                            {filteredSampleCountries.length > 0 && <DropdownMenuSeparator className="bg-slate-700"/>}
                            <DropdownMenuItem
                              onSelect={() => handleCountrySelect(countrySearchInput.trim())}
                              className="hover:!bg-slate-700 hover:!text-slate-50 focus:!bg-slate-700 focus:!text-slate-50"
                            >
                              Set country to: "{countrySearchInput.trim()}"
                            </DropdownMenuItem>
                          </>
                        )}
                         {filteredSampleCountries.length === 0 && !showCustomCountryOption && countrySearchInput.trim() !== '' && (
                            <DropdownMenuItem disabled className="text-slate-400">No matching countries</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Logo />
          </div>
          <div className="text-sm text-slate-400 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} ProspectFlow Inc. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <a href="#" aria-label="Facebook" className="text-slate-400 hover:text-primary transition-colors"><Facebook size={20} /></a>
            <a href="#" aria-label="Twitter" className="text-slate-400 hover:text-primary transition-colors"><Twitter size={20} /></a>
            <a href="#" aria-label="YouTube" className="text-slate-400 hover:text-primary transition-colors"><Youtube size={20} /></a>
            <a href="#" aria-label="LinkedIn" className="text-slate-400 hover:text-primary transition-colors"><Linkedin size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

