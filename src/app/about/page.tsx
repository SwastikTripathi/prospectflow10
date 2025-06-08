
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/Logo';
import { PublicNavbar } from '@/components/layout/PublicNavbar'; 
import { PublicFooter } from '@/components/layout/PublicFooter'; // Added import
import { cn } from '@/lib/utils';
import { ArrowRight, Users, Zap, Focus, ShieldCheck, TrendingUp, HeartHandshake, Facebook, Twitter, Youtube, Linkedin, Globe } from 'lucide-react';

const valuesData = [
  {
    icon: <Focus className="h-10 w-10 text-primary mb-4" />,
    title: 'Simplicity & Focus',
    description: "We build tools that are intuitive, easy to learn, and a joy to use, allowing you to concentrate on what's important: making connections.",
    dataAiHint: "zen minimalist"
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-primary mb-4" />,
    title: 'Empowerment',
    description: 'We equip you with powerful features to take control of your outreach, track your progress, and achieve your goals effectively.',
    dataAiHint: "growth chart"
  },
  {
    icon: <Users className="h-10 w-10 text-primary mb-4" />,
    title: 'Meaningful Connections',
    description: 'We believe in the power of genuine relationships and design ProspectFlow to help you nurture and expand your professional network.',
    dataAiHint: "people networking"
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary mb-4" />,
    title: 'Integrity & Trust',
    description: 'We are committed to transparency, data security, and building a product that you can rely on every step of your journey.',
    dataAiHint: "security shield"
  },
];


export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar activeLink="about" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-background text-center">
          <div className="container mx-auto px-[5vw] md:px-[10vw]">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6 font-headline text-foreground">
              Connecting Ambition with <span className="text-primary">Opportunity</span>.
            </h1>
            <p className="max-w-2xl mx-auto text-md sm:text-lg md:text-xl text-muted-foreground mb-10">
              At ProspectFlow, we believe in the power of meaningful connections. Discover our story, our mission, and the values that drive us to help you succeed in your professional outreach.
            </p>
            <Image
              src="https://placehold.co/1200x500.png"
              alt="Diverse team collaborating"
              width={1200}
              height={500}
              className="rounded-xl shadow-2xl mx-auto object-cover"
              data-ai-hint="team collaboration"
              priority
            />
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-[5vw] md:px-[10vw]">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 font-headline text-foreground">Our Story</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    ProspectFlow was born from a simple observation: the world of professional outreach – whether for job hunting, sales, or networking – was often fragmented, overwhelming, and inefficient. We saw brilliant individuals missing out on opportunities simply because they lacked the right tools to manage their connections and follow-ups effectively.
                  </p>
                  <p>
                    Driven by a passion for technology and a belief in human potential, we set out to create a solution. A platform that wasn't just another CRM, but a dedicated companion for anyone proactively building their future. We envisioned a tool that would be powerful yet intuitive, sophisticated yet simple, helping users cut through the noise and focus on what truly matters: forging genuine connections.
                  </p>
                  <p>
                    After months of research, design, and development, ProspectFlow came to life – a testament to our commitment to empowering individuals to achieve their ambitious goals.
                  </p>
                </div>
              </div>
              <div className="relative aspect-[4/3] rounded-xl shadow-xl overflow-hidden">
                <Image
                  src="https://placehold.co/600x450.png"
                  alt="Founders brainstorming or early product sketch"
                  width={600}
                  height={450}
                  className="object-cover w-full h-full"
                  data-ai-hint="brainstorming session"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-[5vw] md:px-[10vw] text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 font-headline text-foreground">
              Our Mission & Vision
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="text-left p-6 border border-border rounded-lg shadow-lg bg-card">
                <Zap className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-semibold mb-3 font-headline text-foreground">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To provide professionals with the most efficient, intuitive, and empowering tools to manage their outreach, build strong networks, and achieve their career and business goals.
                </p>
              </div>
              <div className="text-left p-6 border border-border rounded-lg shadow-lg bg-card">
                <HeartHandshake className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-semibold mb-3 font-headline text-foreground">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To be the leading platform individuals turn to worldwide for maximizing their professional potential through effective, organized, and genuine outreach.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-[5vw] md:px-[10vw]">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-headline text-foreground">
              The Values That Guide Us
            </h2>
            <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
              These principles are at the heart of everything we do at ProspectFlow, from product development to customer support.
            </p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {valuesData.map((value) => (
                <Card key={value.title} className="text-center shadow-lg hover:shadow-xl transition-shadow bg-card">
                  <CardHeader className="items-center pb-3">
                    {React.cloneElement(value.icon)}
                    <CardTitle className="font-headline text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 text-center bg-primary/90 text-primary-foreground">
          <div className="container mx-auto px-[5vw] md:px-[10vw]">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8 font-headline">
              Ready to Transform Your Outreach?
            </h2>
            <p className="max-w-xl mx-auto text-md sm:text-lg mb-10 opacity-90">
              Join thousands of professionals who are streamlining their connections and achieving their goals with ProspectFlow.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-xl bg-background text-primary hover:bg-background/90 font-semibold rounded-full"
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
