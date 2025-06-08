
'use client';

import type { Company } from '@/lib/types';
import { CompanyCard } from './CompanyCard';

interface CompanyListProps {
  companies: Company[];
  onEditCompany: (company: Company) => void;
  onToggleFavoriteCompany: (companyId: string, currentIsFavorite: boolean) => Promise<void>;
}

export function CompanyList({ companies, onEditCompany, onToggleFavoriteCompany }: CompanyListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <CompanyCard 
          key={company.id} 
          company={company} 
          onEdit={onEditCompany} 
          onToggleFavorite={onToggleFavoriteCompany}
        />
      ))}
    </div>
  );
}

    