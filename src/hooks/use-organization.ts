import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';

export function useOrganization() {
  const { user } = useStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['organization', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) throw new Error("No organization ID");
      const res = await fetch('/api/organizations');
      if (!res.ok) throw new Error("Failed to fetch organization");
      return res.json();
    },
    enabled: !!user?.organization_id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update organization");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });

  return {
    organization: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateOrganization: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
