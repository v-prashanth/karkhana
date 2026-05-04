import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Order, InsertOrder } from '@/types/database';

export function useJobs(status?: string) {
  const { user } = useStore();
  const queryClient = useQueryClient();

  const queryKey = ['jobs', user?.organization_id, status];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/jobs', window.location.origin);
      if (status) url.searchParams.set('status', status);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json() as Promise<Order[]>;
    },
    enabled: !!user?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Order> }) => {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return {
    jobs: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    createJob: createMutation.mutateAsync,
    updateJob: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
