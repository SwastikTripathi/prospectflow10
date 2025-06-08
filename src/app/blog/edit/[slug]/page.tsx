
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { useRouter, useParams, notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit3, ShieldAlert, Trash2, Twitter, Linkedin, Globe, Instagram, Mail } from 'lucide-react';
import { slugify } from '@/lib/utils';
import type { Tables, TablesUpdate } from '@/lib/database.types';
import { OWNER_EMAIL } from '@/lib/config';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const editPostSchema = z.object({
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

type EditPostFormValues = z.infer<typeof editPostSchema>;

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postSlug = params?.slug as string | undefined;
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [post, setPost] = useState<Tables<'posts'> | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<EditPostFormValues>({
    resolver: zodResolver(editPostSchema),
  });

  const fetchPost = useCallback(async (slug: string) => {
    setIsLoadingPost(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') notFound();
        throw error;
      }
      setPost(data);
      form.reset({
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || '',
        cover_image_url: data.cover_image_url || '',
        author_twitter_url: data.author_twitter_url || '',
        author_linkedin_url: data.author_linkedin_url || '',
        author_website_url: data.author_website_url || '',
        author_instagram_url: data.author_instagram_url || '',
        author_email_address: data.author_email_address || '',
        is_featured: data.is_featured || false,
      });
    } catch (err: any) {
      toast({ title: 'Error Fetching Post', description: err.message, variant: 'destructive' });
      router.push('/blog');
    } finally {
      setIsLoadingPost(false);
    }
  }, [form, router, toast]);

  useEffect(() => {
    const checkUserAndPermissions = async () => {
      setIsLoadingAuth(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser && currentUser.email === OWNER_EMAIL) {
        setIsOwner(true);
        if (postSlug) {
          fetchPost(postSlug);
        } else {
          notFound(); // No slug provided
        }
      } else {
        setIsOwner(false);
        if (currentUser) {
          toast({ title: 'Access Denied', description: 'You are not authorized to edit posts.', variant: 'destructive' });
          router.replace('/blog');
        } else {
          router.replace('/auth');
        }
      }
      setIsLoadingAuth(false);
    };
    checkUserAndPermissions();
  }, [postSlug, router, toast, fetchPost]);


  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    form.setValue('title', newTitle);
    if (!form.formState.dirtyFields.slug) {
      form.setValue('slug', slugify(newTitle), { shouldValidate: true });
    }
  };

  const onSubmit = async (values: EditPostFormValues) => {
    if (!user || !isOwner || !post) {
      toast({ title: 'Authorization Error', description: 'Cannot update post.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const postToUpdate: TablesUpdate<'posts'> = {
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
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('posts')
        .update(postToUpdate)
        .eq('id', post.id)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Post Updated!', description: `"${data.title}" has been saved.` });
      router.push(`/blog/${data.slug}`); 
    } catch (error: any) {
      toast({ title: 'Error Updating Post', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeletePost = async () => {
    if (!user || !isOwner || !post) {
      toast({ title: 'Authorization Error', description: 'Cannot delete post.', variant: 'destructive' });
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast({ title: 'Post Deleted', description: `"${post.title}" has been deleted.` });
      router.push('/blog');
    } catch (error: any) {
      toast({ title: 'Error Deleting Post', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoadingAuth || (isOwner && isLoadingPost)) {
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
          <p className="text-muted-foreground">You do not have permission to edit this page.</p>
           <Button onClick={() => router.push('/blog')} className="mt-6">Back to Blog</Button>
        </div>
      </AppLayout>
    );
  }
  
  if (!post && !isLoadingPost) { 
    return (
        <AppLayout>
            <div className="text-center py-10">Post not found.</div>
        </AppLayout>
    )
  }


  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
            <Edit3 className="mr-3 h-7 w-7 text-primary" />
            Edit Blog Post
          </h1>
          <p className="text-muted-foreground">Refine your article details and content.</p>
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
                    <CardDescription>Update links to the author's social media profiles and email.</CardDescription>
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
            
            <CardFooter className="flex justify-between pt-8">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button" disabled={isDeleting || isSubmitting}>
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Delete Post
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the post titled "{post?.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeletePost} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button type="submit" disabled={isSubmitting || isDeleting} className="w-full md:w-auto ml-auto">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </CardFooter>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}

    