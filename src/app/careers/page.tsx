
'use client';

import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Inbox, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-[5vw] md:px-[10vw]">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Briefcase className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 font-headline text-foreground">
              Join Our Team
            </h1>
            <p className="text-lg text-muted-foreground">
              At ProspectFlow, we're passionate about empowering professionals to achieve their outreach goals. 
              We believe in innovation, collaboration, and making a real impact.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Current Openings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-8 md:p-10 bg-secondary/50 rounded-lg text-center">
                <Inbox className="h-16 w-16 md:h-20 md:w-20 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3 font-headline">No Current Openings</h3>
                <p className="text-muted-foreground text-sm md:text-base">
                  We are not actively hiring for specific roles at this moment. 
                  However, we are always interested in connecting with talented individuals.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2 font-headline">Stay Connected</h4>
                <p className="text-muted-foreground mb-3">
                  If you're passionate about what we do and believe you can contribute to our mission, 
                  we'd love to hear from you for future consideration.
                </p>
                <p className="text-muted-foreground">
                  Please feel free to send your resume and a brief introduction to:
                  <br />
                  <Link href="mailto:careers@prospectflow.com" className="text-primary font-semibold hover:underline">
                    careers@prospectflow.com
                  </Link>
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-lg font-semibold text-foreground mb-3 font-headline">Why ProspectFlow?</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Make a tangible impact on how professionals manage their outreach.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Be part of a growing, innovative company in the SaaS space.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Collaborate with a passionate and dedicated team.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
