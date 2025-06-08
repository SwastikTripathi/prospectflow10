
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, ShieldAlert, Twitter, Linkedin, Globe, Instagram, Mail } from 'lucide-react';
import { slugify } from '@/lib/utils';
import type { TablesInsert } from '@/lib/database.types';
import { OWNER_EMAIL } from '@/lib/config';

const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(250, 'Slug too long').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  content: z.string().min(10, 'Content is too short'),
  excerpt: z.string().max(300, 'Excerpt too long').optional(),
  cover_image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  author_twitter_url: z.string().url('Must be a valid Twitter URL').optional().or(z.literal('')),
  author_linkedin_url: z.string().url('Must be a valid LinkedIn URL').optional().or(z.literal('')),
  author_website_url: z.string().url('Must be a valid Website URL').optional().or(z.literal('')),
  author_instagram_url: z.string().url('Must be a valid Instagram URL').optional().or(z.literal('')),
  author_email_address: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  is_featured: z.boolean().optional(),
});

type CreatePostFormValues = z.infer<typeof createPostSchema>;

export default function CreatePostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      cover_image_url: '',
      author_twitter_url: '',
      author_linkedin_url: '',
      author_website_url: '',
      author_instagram_url: '',
      author_email_address: '',
      is_featured: false,
    },
  });

  useEffect(() => {
    const fetchUserAndCheckOwnership = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser && currentUser.email === OWNER_EMAIL) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
        if (currentUser) { // Logged in but not owner
          toast({ title: 'Access Denied', description: 'You are not authorized to create posts.', variant: 'destructive' });
          router.replace('/');
        } else { // Not logged in
          router.replace('/auth');
        }
      }
      setIsLoadingAuth(false);
    };
    fetchUserAndCheckOwnership();
  }, [router, toast]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    form.setValue('title', newTitle);
    if (!form.formState.dirtyFields.slug) {
      form.setValue('slug', slugify(newTitle), { shouldValidate: true });
    }
  };

  const onSubmit = async (values: CreatePostFormValues) => {
    if (!user || !isOwner) {
      toast({ title: 'Authorization Error', description: 'You are not authorized to perform this action.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const postToInsert: TablesInsert<'posts'> = {
        user_id: user.id,
        author_name_cache: user.user_metadata?.full_name || user.email || 'ProspectFlow Team',
        title: values.title,
        slug: values.slug,
        content: values.content,
        excerpt: values.excerpt || null,
        cover_image_url: values.cover_image_url || null,
        author_twitter_url: values.author_twitter_url || null,
        author_linkedin_url: values.author_linkedin_url || null,
        author_website_url: values.author_website_url || null,
        author_instagram_url: values.author_instagram_url || null,
        author_email_address: values.author_email_address || null,
        is_featured: values.is_featured || false,
        status: 'published', 
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(postToInsert)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Post Created!', description: `"${data.title}" has been published.` });
      router.push(`/blog/${data.slug}`);
    } catch (error: any) {
      toast({ title: 'Error Creating Post', description: error.message || 'Could not save the post.', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isOwner) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to create blog posts.</p>
          <Button onClick={() => router.push('/')} className="mt-6">Go to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
            <Edit className="mr-3 h-7 w-7 text-primary" />
            Create New Blog Post
          </h1>
          <p className="text-muted-foreground">Share your insights with the world.</p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline">Post Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} onChange={handleTitleChange} placeholder="Your amazing post title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL Path)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="your-amazing-post-title" />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">E.g., /blog/{form.getValues('slug') || 'your-slug'}</p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cover_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/image.png" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="A short summary of your post..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content (Markdown Supported)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Write your article content here. Use Markdown for formatting." rows={15} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Mark as Featured Post
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Featured posts may be highlighted on the blog page.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Author Social Links (Optional)</CardTitle>
                    <CardDescription>Provide links to the author's social media profiles and email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="author_twitter_url"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><Twitter className="mr-2 h-4 w-4" /> Twitter URL</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://twitter.com/authorhandle" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="author_linkedin_url"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><Linkedin className="mr-2 h-4 w-4" /> LinkedIn URL</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://linkedin.com/in/authorprofile" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="author_instagram_url"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><Instagram className="mr-2 h-4 w-4" /> Instagram URL</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://instagram.com/authorhandle" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="author_website_url"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><Globe className="mr-2 h-4 w-4" /> Personal Website URL</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://authorswebsite.com" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="author_email_address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4" /> Email Address</FormLabel>
                        <FormControl>
                            <Input type="email" {...field} placeholder="author@example.com" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>

            <CardFooter className="pt-8">
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Publish Post
                </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}

    