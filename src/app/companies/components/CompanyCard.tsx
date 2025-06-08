
'use client';

import type { Company } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Globe, Linkedin, Info, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';


interface CompanyCardProps {
  company: Company;
  onEdit: (company: Company) => void;
  onToggleFavorite: (companyId: string, currentIsFavorite: boolean) => Promise<void>;
}

export function CompanyCard({ company, onEdit, onToggleFavorite }: CompanyCardProps) {
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { toast } = useToast();

  const handleToggleFavoriteClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsTogglingFavorite(true);
    try {
      await onToggleFavorite(company.id, !!company.is_favorite);
    } catch (error) {
      toast({ title: "Favorite Error", description: "Could not update favorite status.", variant: "destructive" });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <Card 
      className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col cursor-pointer"
      onClick={() => onEdit(company)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl mb-1 flex items-center">
            <Building2 className="mr-2 h-5 w-5 text-primary" />
            {company.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-1 text-muted-foreground hover:text-yellow-500 hover:bg-transparent"
            onClick={handleToggleFavoriteClick}
            disabled={isTogglingFavorite}
            title={company.is_favorite ? "Unfavorite" : "Favorite"}
          >
            {isTogglingFavorite ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className={cn("h-5 w-5", company.is_favorite ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground")} />
            )}
          </Button>
        </div>
        {company.website && (
            <a 
              href={company.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-accent hover:underline flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
                <Globe className="mr-1 h-3 w-3" /> Website
            </a>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm flex-grow">
        {company.linkedin_url && (
          <div className="flex items-center">
            <Linkedin className="mr-2 h-4 w-4 text-muted-foreground" />
            <a 
              href={company.linkedin_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-accent hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              LinkedIn Profile
            </a>
          </div>
        )}
        {company.notes && (
          <div className="flex items-start pt-1">
            <Info className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground italic break-words">{company.notes}</p>
          </div>
        )}
         {!company.linkedin_url && !company.notes && !company.website && ( 
            <p className="text-xs text-muted-foreground">No additional details provided.</p>
        )}
      </CardContent>
    </Card>
  );
}
