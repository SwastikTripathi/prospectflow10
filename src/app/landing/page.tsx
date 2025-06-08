
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, TrendingUp, Users, Target, Briefcase, Zap, ArrowRight, Eye, MailCheck, Building, Workflow, Focus, ShieldCheck, HeartHandshake, Star, HelpCircle, Facebook, Twitter, Youtube, Linkedin, Globe, CreditCard, Search, Lightbulb, Mail, CalendarDays, User as UserIcon, Info } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedSectionImage } from '@/components/utils/AnimatedSectionImage';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter'; // Added import
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const newTestimonialsData = [
  {
    quote: "ProspectFlow revolutionized how I manage my job search. I'm more organized and follow up more effectively!",
    name: 'Alex P.',
    role: 'Software Engineer',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'person portrait'
  },
  {
    quote: "As a sales professional, keeping track of leads and follow-ups is crucial. ProspectFlow makes it effortless.",
    name: 'Sarah K.',
    role: 'Sales Manager',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'professional woman'
  },
  {
    quote: "This app is a game-changer for anyone serious about their career outreach. Highly recommended!",
    name: 'Jordan Lee',
    role: 'Marketing Specialist',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'person professional'
  }
];

const faqData = [
  {
    question: "What is ProspectFlow?",
    answer: "ProspectFlow is an outreach management tool designed to help job seekers, sales professionals, and networkers organize and track their prospecting efforts, manage contacts, and automate follow-ups."
  },
  {
    question: "Who is ProspectFlow for?",
    answer: "It's for anyone actively reaching out to new connections: job seekers managing applications, sales teams tracking leads, or individuals building their professional network."
  },
  {
    question: "What makes ProspectFlow different?",
    answer: "ProspectFlow focuses on simplicity and efficiency for individual outreach. It combines key features like job opening tracking, contact management, and follow-up scheduling in an intuitive interface, without the complexity of larger CRMs."
  },
  {
    question: "Can I use ProspectFlow for free?",
    answer: "Yes! ProspectFlow offers a Free Tier with core features to get you started. We also have premium plans for users who need more capacity and advanced features."
  },
  {
    question: "How does ProspectFlow help with follow-ups?",
    answer: "ProspectFlow allows you to set automated follow-up schedules based on your initial contact date. You can also draft and save email templates to ensure timely and consistent communication."
  },
  {
    question: "Is my data secure with ProspectFlow?",
    answer: "Yes, we take data security seriously. Your information is stored securely, and we use industry-standard practices to protect your privacy."
  },
  {
    question: "How do I get started with ProspectFlow?",
    answer: "Simply sign up for our Free Tier! No credit card is required to start. You can begin adding your job openings, contacts, and companies right away."
  }
];


function HeroVisual() {
  const mockCardsData = [
    {
      title: 'Software Engineer',
      contextLine: 'Innovate Inc.',
      status: 'Emailed',
      statusColor: 'bg-green-500 hover:bg-green-600 text-green-50 border-transparent',
      avatar: 'https://placehold.co/32x32.png',
      dataAiHint: 'office building',
      cardTypeIcon: Briefcase,
      details: [
        { icon: UserIcon, text: 'Contact: Jane Doe' },
        { icon: CalendarDays, text: 'Next Follow-up: Nov 5', highlight: 'red-alert' }
      ],
      tooltipText: "Track job applications. Never miss a follow-up and manage status all in one place."
    },
    {
      title: 'Alex Chen',
      contextLine: 'Hiring Manager @ Innovate Inc.',
      status: 'Connected',
      statusColor: 'bg-sky-500 hover:bg-sky-600 text-sky-50 border-transparent',
      avatar: 'https://placehold.co/32x32.png',
      dataAiHint: 'person professional',
      cardTypeIcon: Users,
      details: [
        { icon: Mail, text: 'alex.c@innovate.com' },
        { icon: Info, text: 'Loves coffee', className: 'italic break-words min-w-0' }
      ],
      tooltipText: "Manage professional contacts. Store details and notes to build stronger connections."
    },
     {
      title: 'Data Analyst',
      contextLine: 'Acme Corp.',
      status: 'Applied',
      statusColor: 'bg-blue-500 hover:bg-blue-600 text-blue-50 border-transparent',
      avatar: 'https://placehold.co/32x32.png',
      dataAiHint: 'corporate office',
      cardTypeIcon: Briefcase,
       details: [
        { icon: UserIcon, text: 'Contact: Sarah Lee' },
        { icon: CalendarDays, text: 'Next Follow-up: Nov 5', highlight: 'red-alert' }
      ],
      tooltipText: "Keep your job search organized. See key contact info and crucial follow-up dates at a glance."
    },
    {
      title: 'Tech Solutions Ltd.',
      contextLine: 'Enterprise Software',
      status: 'Researching',
      statusColor: 'bg-purple-600/30 hover:bg-purple-600/40 text-purple-50 border-transparent', 
      avatar: 'https://placehold.co/32x32.png',
      dataAiHint: 'modern building',
      cardTypeIcon: Building,
      details: [
        { icon: Globe, text: 'techsolutions.com' },
        { icon: Users, text: '3 Contacts Tracked'}
      ],
      tooltipText: "Organize target companies. Track websites, associated contacts, and important notes."
    },
  ];

  return (
    <div className="mt-12 lg:mt-20">
      <div className="relative max-w-5xl mx-auto p-1 bg-card rounded-xl shadow-2xl border border-border/20 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 bg-background rounded-[0.6rem]">
          <TooltipProvider delayDuration={0}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {mockCardsData.map((card, index) => {
                const CardTypeIconComponent = card.cardTypeIcon;
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div
                        className="bg-card p-3 rounded-lg shadow-md border border-border/50 hover:shadow-xl hover:scale-105 transition-all duration-200 flex flex-col cursor-default"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary" className={`text-xs ${card.statusColor}`}>{card.status}</Badge>
                          <CardTypeIconComponent className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="flex flex-col flex-grow space-y-1.5">
                          <div className="flex items-start">
                            <Image
                              src={card.avatar}
                              alt={card.title}
                              width={28}
                              height={28}
                              className="rounded-full mr-2 border border-border/20 flex-shrink-0 mt-0.5"
                              data-ai-hint={card.dataAiHint}
                            />
                            <div className="flex-grow min-w-0 text-left">
                              <h4 className="text-sm font-semibold text-card-foreground truncate leading-tight">{card.title}</h4>
                              {card.contextLine && (
                                <p className="text-xs text-muted-foreground truncate -mt-1">{card.contextLine}</p>
                              )}
                            </div>
                          </div>
                          {card.details && card.details.length > 0 && (
                            <div className="space-y-1 pt-1">
                              {card.details.map((detail, detailIndex) => {
                                const DetailIcon = detail.icon;
                                const isRedAlert = detail.highlight === 'red-alert';
                                return (
                                  <div
                                    key={detailIndex}
                                    className={cn(
                                      "flex text-xs items-center",
                                      isRedAlert
                                        ? "border border-destructive px-2 py-1 rounded-md"
                                        : "",
                                      detail.className
                                    )}
                                  >
                                    <DetailIcon className={cn(
                                      "mr-1.5 h-3.5 w-3.5 flex-shrink-0",
                                      isRedAlert ? "text-destructive" : "text-muted-foreground"
                                      )}
                                    />
                                    <span className={cn(
                                      "min-w-0",
                                      isRedAlert ? "text-muted-foreground" : "text-muted-foreground truncate",
                                      detail.className
                                    )}>
                                      {detail.text}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-center">
                      <p>{card.tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}


const AnimatedWordsSection = () => {
  const topWords = [
    { name: "Security", color: "bg-slate-700/80" },
    { name: "Strategy", color: "bg-slate-700/80" },
    { name: "Product", color: "bg-purple-600/30" },
    { name: "People", color: "bg-sky-600/30" },
    { name: "Design", color: "bg-pink-600/30" },
    { name: "Sales", color: "bg-slate-700/80" },
    { name: "Finance", icon: <CreditCard className="inline-block h-4 w-4 ml-1" />, color: "bg-green-600/30" },
    { name: "Customer Success", color: "bg-slate-700/80" },
  ];

  const bottomWords = [
    { name: "Business Development", color: "bg-purple-600/30" },
    { name: "Analytics", icon: <Search className="inline-block h-4 w-4 ml-1" />, color: "bg-slate-700/80" },
    { name: "Engineering", color: "bg-orange-600/30" },
    { name: "Operations", color: "bg-teal-600/30" },
    { name: "Marketing", color: "bg-indigo-600/30" },
    { name: "Leadership", icon: <Lightbulb className="inline-block h-4 w-4 ml-1" />, color: "bg-yellow-500/30" },
  ];

  const duplicatedTopWords = [...topWords, ...topWords];
  const duplicatedBottomWords = [...bottomWords, ...bottomWords];

  return (
    <section className="py-16 md:py-24 bg-slate-900 text-slate-100 overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      <div className="container mx-auto px-[10vw] text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 font-headline">
          Email is the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">biggest problem</span>
        </h2>
        <h3 className="text-3xl sm:text-4xl font-bold mb-8 font-headline text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          hiding in plain sight
        </h3>
        <div className="max-w-2xl mx-auto space-y-4 text-slate-300 mb-12">
          <p>We all spend hours on email. But we often reply late, and sometimes don't even reply.</p>
          <p>We then end up losing deals, blocking our teams, and missing our goals.</p>
          <p>It's not anybody's fault. Email itself has not changed in decades.</p>
          <p>With ProspectFlow, this all changes.</p>
        </div>

        <div className="relative space-y-3">
          {/* Top Row - Moving Left */}
          <div className="overflow-hidden whitespace-nowrap py-2 mask-gradient-horizontal">
            <div className="inline-block animate-marquee-left">
              {duplicatedTopWords.map((item, index) => (
                <span key={`top-${index}`} className={`inline-flex items-center text-sm sm:text-base mx-2 px-4 py-2 rounded-lg shadow-md ${item.color} text-slate-50`}>
                  {item.name} {item.icon}
                </span>
              ))}
            </div>
          </div>
          {/* Bottom Row - Moving Right */}
          <div className="overflow-hidden whitespace-nowrap py-2 mask-gradient-horizontal">
            <div className="inline-block animate-marquee-right">
              {duplicatedBottomWords.map((item, index) => (
                <span key={`bottom-${index}`} className={`inline-flex items-center text-sm sm:text-base mx-2 px-4 py-2 rounded-lg shadow-md ${item.color} text-slate-50`}>
                  {item.name} {item.icon}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .mask-gradient-horizontal {
          mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
        }
      `}</style>
    </section>
  );
};


export default function LandingPage() {

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar activeLink="landing" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 text-center bg-background">
          <div className="container mx-auto px-[10vw]">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6 font-headline text-foreground">
              Stop losing leads and<br className="hidden sm:inline" /> missing <span className="text-primary">follow-ups</span>.
            </h1>
            <p className="max-w-2xl mx-auto text-md sm:text-lg md:text-xl text-muted-foreground mb-8">
              ProspectFlow is the easy-to-use tool built to streamline your outreach: manage job applications, sales leads, and professional networking like a pro.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
                <Button size="lg" className="text-lg px-8 py-6 shadow-xl w-full sm:w-auto rounded-full" asChild>
                <Link href="/auth?action=signup">Get Started for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button
                  size="lg"
                  variant="link"
                  className="text-lg px-8 py-6 w-full sm:w-auto rounded-full text-muted-foreground hover:underline hover:underline-offset-4 hover:text-primary/90 hover:decoration-primary/90"
                  asChild
                >
                  <Link href="#streamline-section">Explore Features</Link>
                </Button>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1.5 text-green-500"/>Free Forever</span>
                <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1.5 text-green-500"/>Paid plans available</span>
                <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1.5 text-green-500"/>Automated Follow-up Reminders</span>
            </div>
            <HeroVisual />
          </div>
        </section>

        {/* AnimatedWordsSection */}
        <AnimatedWordsSection />

        {/* Section: Why Professionals Streamline with ProspectFlow */}
        <section id="streamline-section" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-[10vw]">
            <div className="text-left max-w-3xl mx-auto md:mx-0 mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-headline text-foreground">
                Why Professionals Streamline with ProspectFlow
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Focus on connections, not on <span className="text-primary font-semibold">clutter</span>.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold font-headline text-foreground">Built for Efficiency and Action</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ProspectFlow cuts through the noise, helping your team manage outreach faster and more effectively. More targeted connections lead to more opportunities. Designed for daily use, ProspectFlow makes tracking simple, so you can focus on building relationships, not fighting your tools. Get started in minutes, not months.
                </p>
                <div className="border-l-4 border-primary pl-6 py-4">
                  <blockquote className="text-muted-foreground italic mb-4">
                    "{newTestimonialsData[0].quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <Image
                      data-ai-hint={newTestimonialsData[0].dataAiHint}
                      src={newTestimonialsData[0].avatar}
                      alt={newTestimonialsData[0].name}
                      width={40}
                      height={40}
                      className="rounded-full mr-3"
                    />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{newTestimonialsData[0].name}</p>
                      <p className="text-xs text-muted-foreground">{newTestimonialsData[0].role}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                 <AnimatedSectionImage
                    src="https://placehold.co/600x450.png"
                    alt="ProspectFlow App Dashboard Mockup"
                    width={600}
                    height={450}
                    className="rounded-xl bg-muted object-cover"
                    data-ai-hint="app dashboard"
                    animationDirection="up"
                    wrapperClassName="relative aspect-[4/3] rounded-xl shadow-2xl overflow-hidden border border-border/20"
                  />
              </div>
            </div>
          </div>
        </section>

        {/* New Section 1: Everything you need */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-[10vw]">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="order-last md:order-first">
                <AnimatedSectionImage
                    src="https://placehold.co/1200x900.png"
                    alt="ProspectFlow unified platform illustration"
                    width={1200}
                    height={900}
                    className="rounded-xl bg-muted object-cover"
                    data-ai-hint="email marketing tool"
                    animationDirection="up"
                    wrapperClassName="relative aspect-[4/3] rounded-xl shadow-2xl overflow-hidden border border-border/20"
                  />
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-semibold font-headline text-foreground">Everything you need to manage outreach, all in one spot.</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stop juggling multiple tools just to keep track of prospects. Customers can get lost in the shuffle! We believe in keeping it simple. Every tool you need for your outreach process either lives within ProspectFlow or integrates with it seamlessly. You'll send emails, manage follow-ups, and track your pipeline, all without ever leaving ProspectFlow.
                </p>
                <div className="border-l-4 border-primary pl-6 py-4">
                  <blockquote className="text-muted-foreground italic mb-4">
                    "{newTestimonialsData[1].quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <Image
                      data-ai-hint={newTestimonialsData[1].dataAiHint}
                      src={newTestimonialsData[1].avatar}
                      alt={newTestimonialsData[1].name}
                      width={40}
                      height={40}
                      className="rounded-full mr-3"
                    />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{newTestimonialsData[1].name}</p>
                      <p className="text-xs text-muted-foreground">{newTestimonialsData[1].role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* New Section 2: Automations */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-[10vw]">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-semibold font-headline text-foreground">Automations that keep you laser-focused on connecting, not admin work.</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Manually tracking emails that were sent, calls that were made, or reminders to follow up are things of the past. We automate much of the admin work so you can focus your efforts on building relationships and closing your next opportunity.
                </p>
                <div className="border-l-4 border-accent pl-6 py-4">
                  <blockquote className="text-foreground italic">
                    "I can automate responses, emails and trigger actions very easily, improving my chances of effectively managing many more prospects."
                  </blockquote>
                </div>
              </div>
              <div>
                <AnimatedSectionImage
                    src="https://placehold.co/1200x900.png"
                    alt="ProspectFlow automations illustration"
                    width={1200}
                    height={900}
                    className="rounded-xl bg-muted object-cover"
                    data-ai-hint="workflow automation app"
                    animationDirection="up"
                    wrapperClassName="relative aspect-[4/3] rounded-xl shadow-2xl overflow-hidden border border-border/20"
                  />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto px-[10vw] mb-12 md:mb-16">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 font-headline text-foreground">
                  Trusted by <span className="text-primary">Proactive Professionals</span> with <span className="text-accent">Ambitious Goals</span>
                </h2>
              </div>
              <div className="flex justify-center md:justify-end items-center">
                <Image
                  src="https://placehold.co/600x150.png"
                  alt="CRM Benefits Graphic"
                  width={600}
                  height={150}
                  className="rounded-lg shadow-md"
                  data-ai-hint="chart graph"
                />
              </div>
            </div>
          </div>

          <div className="container mx-auto px-[10vw]">
             <div className="grid md:grid-cols-3 gap-0 text-left max-w-6xl mx-auto">
              {newTestimonialsData.map((testimonial, index) => (
                <div
                  key={testimonial.name + index}
                  className={`p-6 flex flex-col ${index < newTestimonialsData.length - 1 ? 'border-b md:border-b-0 md:border-r border-border' : ''}`}
                >
                  <p className="text-muted-foreground mb-6 flex-grow text-base leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center mt-auto">
                    <Image data-ai-hint={testimonial.dataAiHint} src={testimonial.avatar} alt={testimonial.name} width={40} height={40} className="rounded-full mr-3 border" />
                    <div>
                      <p className="font-semibold text-sm text-card-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
                <Button size="lg" className="mt-12 text-base px-8 py-6 shadow-md rounded-full" asChild>
                <Link href="/auth?action=signup">Discover How ProspectFlow Can Help You <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
            </div>
          </div>
        </section>

        {/* New Hero-style CTA Section */}
        <section className="py-20 md:py-28 text-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
          <div className="container mx-auto px-[10vw]">
            <div className="flex justify-center mb-8">
              <Logo />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-10 font-headline">
              Join the thousands of <span className="text-primary">professionals</span> that trust ProspectFlow to <span className="text-primary">land opportunities</span>.
            </h2>
            <Button
              size="lg"
              className="text-lg px-10 py-7 shadow-xl rounded-full bg-slate-50 text-slate-900 hover:bg-slate-200 font-semibold"
              asChild
            >
              <Link href="/auth?action=signup">Try ProspectFlow for Free</Link>
            </Button>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mt-10 text-sm text-slate-300">
              <span className="flex items-center">
                <CheckCircle className="inline-block h-4 w-4 mr-1.5 text-green-400"/>Free Forever
              </span>
              <span className="flex items-center">
                <CheckCircle className="inline-block h-4 w-4 mr-1.5 text-green-400"/>Paid plans available
              </span>
              <span className="flex items-center">
                <CheckCircle className="inline-block h-4 w-4 mr-1.5 text-green-400"/>Automated Follow-up Reminders
              </span>
            </div>
            <div className="mt-16 lg:mt-20 max-w-5xl mx-auto">
              <div className="bg-slate-700/60 rounded-t-xl p-2 sm:p-3 shadow-2xl border-x border-t border-slate-600/50">
                <div className="flex space-x-1.5">
                  <span className="block w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="block w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="block w-3 h-3 rounded-full bg-green-500"></span>
                </div>
              </div>
              <Image
                src="https://placehold.co/1200x750.png"
                alt="ProspectFlow Application Screenshot"
                width={1200}
                height={750}
                className="block w-full h-auto border-x border-b border-slate-600/50 rounded-b-xl shadow-2xl"
                data-ai-hint="app interface dashboard"
                priority
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-[10vw]">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-headline text-foreground">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem value={`item-${index + 1}`} key={index} className="border-b bg-transparent shadow-none rounded-none">
                    <AccordionTrigger className="px-0 py-4 text-left font-semibold text-foreground hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-4 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-28 bg-secondary/30 text-center">
          <div className="container mx-auto px-[10vw]">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8 font-headline text-foreground">
              Ready to Transform Your Outreach?
            </h2>
            <p className="max-w-xl mx-auto text-md sm:text-lg text-muted-foreground mb-10">
              Take control of your professional connections and never miss an opportunity. ProspectFlow helps you stay organized and efficient.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-xl rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              asChild
            >
              <Link href="/auth?action=signup">Get Started for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

