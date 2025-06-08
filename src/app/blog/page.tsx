
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Tables } from '@/lib/database.types';
import { PostCard } from './components/PostCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Rss, Search as SearchIcon, XCircle, ArrowRight } from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter'; // Added import
import { cn } from '@/lib/utils';


type PostWithAuthor = Tables<'posts'>;

export default function BlogPage() {
  const [allPosts, setAllPosts] = useState<PostWithAuthor[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostWithAuthor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .order('is_featured', { ascending: false, nullsFirst: false }) 
          .order('published_at', { ascending: false });

        if (dbError) {
          const message = `Database error: ${dbError.message} (Code: ${dbError.code}). Hint: ${dbError.hint || 'No hint'}. Details: ${dbError.details || 'No details'}`;
          throw new Error(message);
        }
        setAllPosts(data || []);
        setFilteredPosts(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch posts.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);
  
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPosts(allPosts);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = allPosts.filter(post =>
        post.title.toLowerCase().includes(lowercasedFilter) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(lowercasedFilter)) ||
        (post.author_name_cache && post.author_name_cache.toLowerCase().includes(lowercasedFilter))
      );
      setFilteredPosts(filtered);
    }
  }, [searchTerm, allPosts]);
  
  const firstPostToDisplay = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const remainingPostsToDisplay = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  // Conditions for rendering different states
  const showInitialLoading = isLoading;
  const showErrorState = !isLoading && error;
  const showNoPostsPublishedEverState = !isLoading && !error && allPosts.length === 0 && searchTerm === '';
  const showContentArea = !isLoading && !error && !showNoPostsPublishedEverState;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar activeLink="blog" />

      <main className="flex-1 py-12 md:py-20">
        <section className="container mx-auto px-[5vw] md:px-[10vw] text-center mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 font-headline text-foreground flex items-center justify-center">
            <Rss className="mr-3 h-10 w-10 text-primary" />
            The ProspectFlow Blog
          </h1>
          <p className="max-w-xl mx-auto text-md sm:text-lg text-muted-foreground">
            Insights, tips, and updates on professional outreach and productivity.
          </p>
        </section>

        <section className="container mx-auto px-[5vw] md:px-[10vw]">
          {showInitialLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : showErrorState ? (
            <div className="text-center text-destructive py-20">
              <p>Error loading posts: {error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
            </div>
          ) : showNoPostsPublishedEverState ? (
            <div className="text-center text-muted-foreground py-20">
              <p className="text-xl mb-4">No blog posts published yet.</p>
              <p>Check back soon for updates!</p>
            </div>
          ) : (
            // showContentArea is true here, meaning allPosts.length > 0 OR searchTerm is active
            <>
              <div className="grid md:grid-cols-3 gap-8 mb-12 items-start">
                <div className="md:col-span-2">
                  {firstPostToDisplay ? (
                    <PostCard post={firstPostToDisplay} />
                  ) : (
                    // This means filteredPosts is empty.
                    // Since showNoPostsPublishedEverState is false, it means allPosts.length > 0.
                    // Therefore, searchTerm must be active and yielded no results.
                    <div className="text-center text-muted-foreground py-10 md:py-20 border border-border/40 border-dashed rounded-lg h-full flex flex-col justify-center items-center bg-card shadow-sm">
                      <p className="text-xl mb-4">No posts match your search criteria.</p>
                      <p>Try a different search term or clear your search.</p>
                    </div>
                  )}
                </div>

                {/* Column for Search, Promotion, CTA - this should always be rendered if showContentArea is true */}
                <div className="md:col-span-1 space-y-6">
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg flex items-center"><SearchIcon className="mr-2 h-5 w-5 text-primary"/>Search Articles</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="relative">
                                <Input
                                type="text"
                                placeholder="Search blog..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-8" 
                                />
                                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                {searchTerm && (
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent focus-visible:bg-transparent hover:text-primary" onClick={() => setSearchTerm('')}>
                                        <XCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg text-primary">Never Miss an Update!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Subscribe to our newsletter for the latest tips and product news.</p>
                            <Input type="email" placeholder="Enter your email" className="mb-2" />
                            <Button className="w-full bg-primary hover:bg-primary/90">Subscribe</Button>
                        </CardContent>
                    </Card>
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">Ready to Boost Your Outreach?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Try ProspectFlow free and streamline your professional connections.</p>
                            <Button className="w-full" asChild>
                                <Link href="/auth?action=signup">Get Started Free <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </CardContent>
                    </Card>
                  </div>
              </div>
              
              {remainingPostsToDisplay.length > 0 && (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {remainingPostsToDisplay.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

