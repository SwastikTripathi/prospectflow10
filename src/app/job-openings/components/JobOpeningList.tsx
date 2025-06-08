
'use client';

import type { JobOpening } from '@/lib/types';
import { JobOpeningCard } from './JobOpeningCard';

interface JobOpeningListProps {
  jobOpenings: JobOpening[];
  onEditOpening: (opening: JobOpening) => void;
  onLogFollowUp: (followUpId: string, jobOpeningId: string) => Promise<void>;
  onUnlogFollowUp: (followUpId: string, jobOpeningId: string) => Promise<void>;
  onToggleFavorite: (jobOpeningId: string, currentIsFavorite: boolean) => Promise<void>;
}

export function JobOpeningList({ 
  jobOpenings, 
  onEditOpening, 
  onLogFollowUp, 
  onUnlogFollowUp,
  onToggleFavorite 
}: JobOpeningListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {jobOpenings.map((opening) => (
        <JobOpeningCard
          key={opening.id}
          opening={opening}
          onEdit={onEditOpening}
          onLogFollowUp={onLogFollowUp}
          onUnlogFollowUp={onUnlogFollowUp}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

    