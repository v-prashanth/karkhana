import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useStore } from '@/store/useStore';

export function useAuth() {
  const queryClient = useQueryClient();
  const { logout } = useStore();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authApi.signOut();
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return {
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
