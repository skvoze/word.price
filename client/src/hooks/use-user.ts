import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Transaction } from "@shared/schema";

const getHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const tg = (window as any).Telegram?.WebApp;
  const initData = tg?.initData; 
  if (initData) {
    headers["x-telegram-init-data"] = initData;
  }
  const tid = tg?.initDataUnsafe?.user?.id?.toString();
  if (tid) {
    headers["x-telegram-id"] = tid;
  }
  return headers;
};
const getTid = () => {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initDataUnsafe?.user?.id?.toString();
};

export function useUser() {
  const tid = getTid();

  return useQuery({
    queryKey: [api.users.me.path],
    queryFn: async () => {
      const res = await fetch(api.users.me.path, { 
        headers: getHeaders(), 
        credentials: "include" 
      });

      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.me.responses[200].parse(await res.json());
    },
    enabled: !!tid, // Ждем появления ID
    retry: false,
    staleTime: Infinity
  });
}

export function useTransactions() {
  const tid = getTid();

  return useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions", { 
        headers: getHeaders(),
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return await res.json();
    },
    enabled: !!tid, // ПРАВКА: тоже ждем ID, чтобы не ловить 401
    retry: false
  });
}
export function useAddFunds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ amount, acceptedTerms }: { amount: number; acceptedTerms: boolean }) => {
      const res = await fetch(api.users.addFunds.path, {
        method: api.users.addFunds.method,
        headers: getHeaders(),
        body: JSON.stringify({ amount, acceptedTerms }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add funds");
      return api.users.addFunds.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });
}
export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: number; metadata: any; description: string }) => {
      const res = await fetch("/api/users/withdraw", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to withdraw");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });
}
