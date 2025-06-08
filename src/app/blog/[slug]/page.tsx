
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';
import { format, parseISO } from 'date-fns';
import { Loader2, Tag, Facebook, Twitter, Linkedin, Link as LinkIcon, Globe, ArrowRight, Youtube, Instagram, Mail, Edit3 } from 'lucide-react';
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import rehypeHighlight from 'rehype-highlight';

import { Button } from '@/components/ui/button';
import { TableOfContents, type TocItem } from '../components/TableOfContents';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter'; // Added import
import { OWNER_EMAIL } from '@/lib/config';
import { Logo } from '@/components/icons/Logo';

const NAVBAR_HEIGHT_OFFSET = 64; // h-16 for header = 4rem = 64px


export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const { toast } = useToast();
  const router = useRouter();

  const [post, setPost] = useState<Tables<'posts'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);

  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const headingElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const activeEntryMap = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setIsOwner(user?.email === OWNER_EMAIL);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      setIsOwner(user?.email === OWNER_EMAIL);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      setError("No post slug provided.");
      return;
    }

    const fetchPostAndSerialize = async () => {
      setIsLoading(true);
      setError(null);
      setMdxSource(null);
      try {
        const { data, error: dbError } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (dbError) {
          if (dbError.code === 'PGRST116') {
            notFound();
            return;
          }
          throw dbError;
        }
        setPost(data);

        if (data && data.content) {
          try {
            const source = await serialize(data.content, {
              mdxOptions: {
                rehypePlugins: [rehypeHighlight as any],
              },
            });
            setMdxSource(source);
          } catch (serializeError) {
            setError("Failed to render post content.");
          }
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch post.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostAndSerialize();
  }, [slug]);


  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    activeEntryMap.current.clear();
    headingElementsRef.current.clear();

    if (!mdxSource || !mainContentRef.current) {
      setTocItems([]);
      setActiveHeadingId(null);
      return;
    }

    const populateHeadings = () => {
      if (!mainContentRef.current) return;

      const headings = Array.from(
        mainContentRef.current.querySelectorAll('h1[id]') // Only H1 for TOC
      ) as HTMLElement[];

      const newHeadingElementsMap = new Map<string, HTMLElement>();
      const newTocItems: TocItem[] = [];

      headings.forEach((heading) => {
        const text = heading.textContent || '';
        const id = heading.id;
        if (id) {
            newTocItems.push({ id, level: 1, text }); // Level always 1 for H1
            newHeadingElementsMap.set(id, heading);
        }
      });

      setTocItems(newTocItems);
      headingElementsRef.current = newHeadingElementsMap;
    };
    
    populateHeadings();
    
    if (headingElementsRef.current.size === 0) {
        setActiveHeadingId(null);
        return;
    }

    const topMargin = NAVBAR_HEIGHT_OFFSET;
    const activationZoneHeight = 150; 
    const bottomMargin = (typeof window !== 'undefined' ? window.innerHeight : 600) - topMargin - activationZoneHeight;

    const observerOptions = {
      root: null,
      rootMargin: `-${topMargin}px 0px -${bottomMargin}px 0px`,
      threshold: 0, 
    };

    observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                activeEntryMap.current.set(entry.target.id, entry);
            } else {
                activeEntryMap.current.delete(entry.target.id);
            }
        });

        const visibleHeadings = Array.from(activeEntryMap.current.values())
                                .sort((a,b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
      
        if (visibleHeadings.length > 0) {
            setActiveHeadingId(visibleHeadings[0].target.id);
        } else {
            let bestFallbackId: string | null = null;
            const allHeadingsArray = Array.from(headingElementsRef.current.values())
                                      .sort((a,b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

            for (let i = allHeadingsArray.length - 1; i >= 0; i--) {
                const heading = allHeadingsArray[i];
                if (heading.getBoundingClientRect().top < topMargin) {
                    bestFallbackId = heading.id;
                    break;
                }
            }
            if (bestFallbackId) {
                 setActiveHeadingId(bestFallbackId);
            } else if (allHeadingsArray.length > 0) {
                 const firstHeadingRect = allHeadingsArray[0].getBoundingClientRect();
                 if (firstHeadingRect.bottom > 0 && firstHeadingRect.top < window.innerHeight) {
                     setActiveHeadingId(allHeadingsArray[0].id);
                 } else {
                     setActiveHeadingId(null);
                 }
            } else {
              setActiveHeadingId(null);
            }
        }
    }, observerOptions);

    const currentObserver = observerRef.current;
    headingElementsRef.current.forEach(headingEl => {
        currentObserver.observe(headingEl);
    });

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
      activeEntryMap.current.clear();
    };

  }, [mdxSource]); // NAVBAR_HEIGHT_OFFSET removed as it's constant


  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PublicNavbar activeLink="blog" />
        <main className="flex-1 py-12 md:py-16 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <PublicNavbar activeLink="blog" />
        <main className="flex-1 py-12 md:py-16 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen">
        <PublicNavbar activeLink="blog" />
        <main className="flex-1 py-12 md:py-16 text-center">
          <p className="text-muted-foreground">Post not found.</p>
          <Link href="/blog"><Button variant="link">Back to Blog</Button></Link>
        </main>
      </div>
    );
  }

  const displayDate = post.published_at ? format(parseISO(post.published_at), 'MMMM d, yyyy') : format(parseISO(post.created_at), 'MMMM d, yyyy');
  const authorName = post.author_name_cache || 'ProspectFlow Team';
  const creditAuthorName = post.author_name_cache || "Kaleigh Moore";
  const creditAuthorDescription = post.author_name_cache ? "Contributor" : "Freelance writer for eCommerce & SaaS companies. I write blogs and articles for eCommerce platforms & the SaaS tools that integrate with them.";


  const mdxComponents = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
      const { children, ...rest } = props;
      let id = props.id;
      if (!id && typeof children === 'string') {
        id = children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || `heading-h1-${Math.random().toString(36).substring(7)}`;
      } else if (!id) {
        id = `heading-h1-${Math.random().toString(36).substring(7)}`;
      }
      return (
        <h1 id={id} {...rest} className="font-headline text-2xl font-semibold tracking-tight mt-10 mb-4" style={{ scrollMarginTop: `${NAVBAR_HEIGHT_OFFSET + 20}px` }}>{children}</h1>
      );
    },
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
      const { children, ...rest } = props;
      let id = props.id;
      if (!id && typeof children === 'string') {
        id = children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || `heading-h2-${Math.random().toString(36).substring(7)}`;
      } else if (!id) {
        id = `heading-h2-${Math.random().toString(36).substring(7)}`;
      }
      return <h2 id={id} {...rest} className="font-headline text-lg font-semibold tracking-tight mt-8 mb-3" style={{ scrollMarginTop: `${NAVBAR_HEIGHT_OFFSET + 20}px` }}>{children}</h2>;
    },
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
      const { children, ...rest } = props;
      let id = props.id;
      if (!id && typeof children === 'string') {
        id = children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || `heading-h3-${Math.random().toString(36).substring(7)}`;
      } else if (!id) {
        id = `heading-h3-${Math.random().toString(36).substring(7)}`;
      }
      return <h3 id={id} {...rest} className="font-headline text-base font-semibold tracking-tight mt-6 mb-2" style={{ scrollMarginTop: `${NAVBAR_HEIGHT_OFFSET + 20}px` }}>{children}</h3>;
    },
    h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
      const { children, ...rest } = props;
       let id = props.id;
      if (!id && typeof children === 'string') {
        id = children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || `heading-h4-${Math.random().toString(36).substring(7)}`;
      } else if (!id) {
        id = `heading-h4-${Math.random().toString(36).substring(7)}`;
      }
      return <h4 id={id} {...rest} className="font-headline text-sm font-semibold tracking-tight mt-5 mb-2" style={{ scrollMarginTop: `${NAVBAR_HEIGHT_OFFSET + 20}px` }}>{children}</h4>;
    },
     p: (props: React.HTMLAttributes<HTMLParagraphElement>) => {
      const { children, className: propClassName, ...rest } = props;
      return <p {...rest} className={cn("mb-3 leading-relaxed", propClassName)}>{children}</p>;
    },
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => {
      const { children, className: propClassName, ...rest } = props;
      return <ul {...rest} className={cn("list-disc pl-5 mb-3 space-y-1", propClassName)}>{children}</ul>;
    },
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => {
      const { children, className: propClassName, ...rest } = props;
      return <ol {...rest} className={cn("list-decimal pl-5 mb-3 space-y-1", propClassName)}>{children}</ol>;
    },
    li: (props: React.HTMLAttributes<HTMLLIElement>) => {
      const { children, className: propClassName, ...rest } = props;
      return <li {...rest} className={cn("leading-relaxed", propClassName)}>{children}</li>;
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicNavbar activeLink="blog" />

      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-[5vw] md:px-[8vw] lg:px-[10vw] max-w-screen-xl">

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16 mb-8">
            <div className="lg:col-span-8">
                {isOwner && (
                  <div className="mb-4 flex justify-end">
                    <Button variant="outline" onClick={() => router.push(`/blog/edit/${post.slug}`)}>
                      <Edit3 className="mr-2 h-4 w-4" /> Edit Post
                    </Button>
                  </div>
                )}
              {post.cover_image_url && (
                <div className="aspect-[16/10] relative rounded-xl overflow-hidden shadow-lg border border-border/20">
                  <Image
                    src={post.cover_image_url}
                    alt={post.title || 'Blog post cover image'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    className="object-cover"
                    priority
                    data-ai-hint="woman stress laptop"
                  />
                </div>
              )}
              {!post.cover_image_url && (
                 <div className="aspect-[16/10] relative rounded-xl overflow-hidden shadow-lg border border-border/20 bg-muted flex items-center justify-center">
                  <Image
                    src="https://placehold.co/800x500.png"
                    alt="Placeholder image"
                    width={800}
                    height={500}
                    className="object-cover"
                    data-ai-hint="woman stress laptop"
                  />
                </div>
              )}
            </div>
            <div className="lg:col-span-4 hidden lg:block"></div> {/* Empty column to match content layout */}
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 lg:gap-x-12 xl:gap-x-16">
            <div className="lg:col-span-8 order-2 lg:order-1">
              <div className="mb-4 text-sm text-muted-foreground">
                  <span>{authorName}</span>
                  <span className="mx-1.5">&bull;</span>
                  <span>{displayDate}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold tracking-tight mb-3 text-gray-900 dark:text-gray-100 leading-tight font-headline">
                {post.title}
              </h1>

              <div className="mb-8">
                <Link href="#" className="text-sm text-sky-600 dark:text-sky-500 hover:underline flex items-center">
                  <Tag className="h-4 w-4 mr-1.5" />
                  Close Features and News
                </Link>
              </div>

              <div ref={mainContentRef} className="prose prose-sm dark:prose-invert max-w-none">
                {mdxSource ? (
                  <MDXRemote {...mdxSource} components={mdxComponents} />
                ) : (
                  <p>Loading content...</p>
                )}
              </div>

              <div className="mt-4">
                 <div className="text-center mb-10 pt-2">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-3 px-6 rounded-lg shadow-md" asChild>
                        <Link href="/pricing">START YOUR FREE 14-DAY TRIAL <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                 </div>

                 <hr className="border-black/10 dark:border-white/10" />

                 <div className="mt-8 py-4 flex items-start gap-x-4">
                    <div>
                        <Image
                        src="https://placehold.co/80x80.png"
                        alt={creditAuthorName}
                        width={80}
                        height={80}
                        className="rounded-full"
                        data-ai-hint="author portrait"
                        />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-0.5">Article written by</p>
                        <h3 className="text-2xl font-bold text-foreground mb-2 font-headline">{creditAuthorName}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{creditAuthorDescription}</p>
                         {(post.author_twitter_url || post.author_linkedin_url || post.author_website_url || post.author_instagram_url || post.author_email_address) && (
                            <div className="mt-3 flex space-x-3">
                                {post.author_twitter_url && (
                                <a href={post.author_twitter_url} target="_blank" rel="noopener noreferrer" aria-label="Author's Twitter" className="text-muted-foreground hover:text-primary">
                                    <Twitter size={18} />
                                </a>
                                )}
                                {post.author_linkedin_url && (
                                <a href={post.author_linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="Author's LinkedIn" className="text-muted-foreground hover:text-primary">
                                    <Linkedin size={18} />
                                </a>
                                )}
                                 {post.author_instagram_url && (
                                <a href={post.author_instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Author's Instagram" className="text-muted-foreground hover:text-primary">
                                    <Instagram size={18} />
                                </a>
                                )}
                                {post.author_website_url && (
                                <a href={post.author_website_url} target="_blank" rel="noopener noreferrer" aria-label="Author's Website" className="text-muted-foreground hover:text-primary">
                                    <Globe size={18} />
                                </a>
                                )}
                                {post.author_email_address && (
                                <a href={`mailto:${post.author_email_address}`} aria-label="Author's Email" className="text-muted-foreground hover:text-primary">
                                    <Mail size={18} />
                                </a>
                                )}
                            </div>
                        )}
                    </div>
                 </div>
              </div>

            </div>

            <div className="lg:col-span-4 order-1 lg:order-2 mb-10 lg:mb-0">
              <div className="sticky top-28 space-y-6"> {/* Adjusted top from top-24 to top-28 */}
                <TableOfContents
                  tocItems={tocItems}
                  isLoading={isLoading && !mdxSource}
                  activeHeadingId={activeHeadingId}
                  postTitle={post.title}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
