import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Document } from '@/types/database';

export function useDocuments(type?: string) {
  const { user } = useStore();
  const queryClient = useQueryClient();

  const queryKey = ['documents', user?.organization_id, type];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // Depending on the document type, the endpoint might differ based on Phase 1 structure
      // For now, mapping 'inward_dc' to /api/inward-dc etc.
      const endpoint = type === 'inward_dc' ? '/api/inward-dc' : type === 'outward_dc' ? '/api/outward-dc' : '/api/documents';
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json() as Promise<Document[]>;
    },
    enabled: !!user?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const endpoint = data.type === 'inward_dc' ? '/api/inward-dc' : data.type === 'outward_dc' ? '/api/outward-dc' : '/api/documents';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    documents: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    createDocument: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
