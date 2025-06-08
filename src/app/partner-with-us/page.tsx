
'use client';

import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handshake, Lightbulb, Users, Target, Megaphone, CheckCircle, Mail } from 'lucide-react';
import Link from 'next/link';

const partnershipTypes = [
  {
    icon: Megaphone,
    title: "Influencers & Content Creators",
    description: "Share ProspectFlow with your audience and earn through affiliate programs or sponsored content.",
    dataAiHint: "social media influencer"
  },
  {
    icon: Lightbulb,
    title: "Marketing Agencies & Consultants",
    description: "Offer ProspectFlow to your clients as a recommended tool to enhance their outreach strategies.",
    dataAiHint: "marketing strategy"
  },
  {
    icon: Target, // Using Target as a stand-in for 'integration' or 'tech'
    title: "Tech Solution Providers",
    description: "Explore integration opportunities to provide more value to our mutual customers.",
    dataAiHint: "software integration"
  },
  {
    icon: Users,
    title: "Communities & Online Groups",
    description: "Provide ProspectFlow as a valuable resource to your community members focused on career or sales growth.",
    dataAiHint: "online community"
  },
];

const collaborationMethods = [
  "Affiliate Programs with competitive commissions.",
  "Co-marketing campaigns and joint webinars.",
  "Product integrations for seamless user experience.",
  "Guest blogging and content collaborations.",
  "Exclusive offers for your community or clients.",
];

const whatWeLookFor = [
  "A genuine interest in helping professionals succeed in their outreach.",
  "An audience or client base that aligns with ProspectFlow users (job seekers, sales, networkers).",
  "Commitment to ethical marketing and value-driven content.",
  "Enthusiasm for innovative solutions and growth.",
];

export default function PartnerWithUsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-[5vw] md:px-[10vw]">
          <header className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <Handshake className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 font-headline text-foreground">
              Partner with ProspectFlow
            </h1>
            <p className="text-lg text-muted-foreground">
              Let's collaborate to empower professionals worldwide with smarter outreach tools.
            </p>
          </header>

          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold font-headline text-center mb-10 text-foreground">
              Who We Partner With
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partnershipTypes.map((type) => (
                <Card key={type.title} className="shadow-lg hover:shadow-xl transition-shadow text-center bg-card">
                  <CardHeader className="items-center pb-3">
                    <type.icon className="h-10 w-10 text-primary mb-3" />
                    <CardTitle className="font-headline text-xl">{type.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-12 md:mb-16">
             <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <h2 className="text-2xl md:text-3xl font-semibold font-headline mb-6 text-foreground">
                        How We Can Collaborate
                    </h2>
                    <ul className="space-y-3">
                        {collaborationMethods.map((method, index) => (
                        <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{method}</span>
                        </li>
                        ))}
                    </ul>
                </div>
                <div className="hidden md:block">
                     <img src="https://placehold.co/600x400.png" alt="Collaboration visual" className="rounded-lg shadow-md" data-ai-hint="team handshake"/>
                </div>
             </div>
          </section>

          <section className="mb-12 md:mb-16 bg-secondary/30 p-8 md:p-12 rounded-lg shadow-inner">
            <h2 className="text-2xl md:text-3xl font-semibold font-headline text-center mb-8 text-foreground">
              What We Look For in a Partner
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {whatWeLookFor.map((item, index) => (
                <div key={index} className="flex items-start p-4 bg-background rounded-md shadow">
                  <Lightbulb className="h-6 w-6 text-accent mr-3 mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="text-center bg-primary/10 p-8 md:p-12 rounded-xl shadow-xl border border-primary/20">
            <Mail className="h-12 w-12 text-primary mx-auto mb-5" />
            <h2 className="text-3xl font-bold font-headline mb-4 text-foreground">
              Ready to Explore a Partnership?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              We're excited to hear your ideas on how we can work together. Whether you're an influencer, marketer, tech provider, or community leader, let's connect.
            </p>
            <Button size="lg" className="text-lg px-8 py-6 shadow-md" asChild>
              <Link href="mailto:partners@prospectflow.com">
                Contact Our Partnerships Team
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Please include a brief introduction and your proposal ideas in your email to <strong className="text-foreground">partners@prospectflow.com</strong>.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
