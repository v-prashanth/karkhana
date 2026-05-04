import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Invoice, Payment, Expense } from '@/types/database';

export function useInvoices() {
  const { user } = useStore();
  const queryClient = useQueryClient();

  const queryKey = ['invoices', user?.organization_id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json() as Promise<Invoice[]>;
    },
    enabled: !!user?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Invoice>) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return {
    invoices: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    createInvoice: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function usePayments() {
  const { user } = useStore();
  const queryClient = useQueryClient();

  const queryKey = ['payments', user?.organization_id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch('/api/payments');
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json() as Promise<Payment[]>;
    },
    enabled: !!user?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return {
    payments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    createPayment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useExpenses() {
  const { user } = useStore();
  const queryClient = useQueryClient();

  const queryKey = ['expenses', user?.organization_id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch('/api/expenses');
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json() as Promise<Expense[]>;
    },
    enabled: !!user?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Expense>) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  return {
    expenses: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    createExpense: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
