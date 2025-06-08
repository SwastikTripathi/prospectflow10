
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import type { Tables } from '@/lib/database.types';
import { Star } from 'lucide-react';

type PostWithAuthor = Tables<'posts'>;

interface PostCardProps {
  post: PostWithAuthor;
}

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const names = name.split(' ').filter(Boolean);
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  } else if (names.length === 1 && names[0].length > 0) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return 'U';
}

export function PostCard({ post }: PostCardProps) {
  const displayDate = post.published_at ? format(parseISO(post.published_at), 'PPP') : format(parseISO(post.created_at), 'PPP');
  const authorInitials = getInitials(post.author_name_cache);

  return (
    <Link href={`/blog/${post.slug}`} passHref legacyBehavior>
      <a className="block group">
        <Card className="h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
          {post.cover_image_url && (
            <div className="relative w-full aspect-[16/9] overflow-hidden">
              <Image
                src={post.cover_image_url}
                alt={post.title || 'Blog post cover image'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                data-ai-hint="article content" 
              />
               {post.is_featured && (
                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground shadow-md">
                  <Star className="mr-1 h-3 w-3 fill-current" /> Featured
                </Badge>
              )}
            </div>
          )}
          {!post.cover_image_url && post.is_featured && (
             <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground z-10 shadow-md">
               <Star className="mr-1 h-3 w-3 fill-current" /> Featured
             </Badge>
          )}
          <CardHeader className="pb-3">
            <CardTitle className="font-headline text-xl lg:text-2xl group-hover:text-primary transition-colors">
              {post.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow pb-4">
            {post.excerpt && (
              <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                {post.excerpt}
              </CardDescription>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground pt-3 border-t">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {/* Placeholder for actual author avatar if available */}
                <AvatarFallback className="text-xs bg-muted">{authorInitials}</AvatarFallback>
              </Avatar>
              <span>{post.author_name_cache || 'ProspectFlow Team'}</span>
              <span>&bull;</span>
              <span>{displayDate}</span>
            </div>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}

    