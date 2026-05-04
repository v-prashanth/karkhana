import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Contact, InsertContact } from '@/types/database';

export function useContacts(type?: 'client' | 'supplier') {
  const { user } = useStore();
  const queryClient = useQueryClient();

  const queryKey = ['contacts', user?.organization_id, type];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/clients', window.location.origin);
      if (type) url.searchParams.set('type', type);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json() as Promise<Contact[]>;
    },
    enabled: !!user?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return {
    contacts: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    createContact: createMutation.mutateAsync,
    updateContact: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
