
'use client';

import type { Contact } from '@/lib/types';
import { ContactCard } from './ContactCard';

interface ContactListProps {
  contacts: Contact[];
  onEditContact: (contact: Contact) => void;
  onToggleFavoriteContact: (contactId: string, currentIsFavorite: boolean) => Promise<void>;
}

export function ContactList({ contacts, onEditContact, onToggleFavoriteContact }: ContactListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {contacts.map((contact) => (
        <ContactCard 
          key={contact.id} 
          contact={contact} 
          onEdit={onEditContact} 
          onToggleFavorite={onToggleFavoriteContact}
        />
      ))}
    </div>
  );
}

    