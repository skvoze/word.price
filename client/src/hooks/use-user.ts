import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Transaction } from "@shared/schema";
import { useAccount } from "wagmi";

const getHeaders = (address?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (address) {
    headers["x-user-address"] = address.toLowerCase();
  }
  return headers;
};

export function useUser() {
  const { address, isConnected } = useAccount();

  return useQuery({
    queryKey: [api.users.me.path, address],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(api.users.me.path, { 
        headers: getHeaders(address), 
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    enabled: isConnected && !!address,
    retry: false,
    staleTime: 30000
  });
}

export function useTransactions() {
  const { address } = useAccount();

  return useQuery<Transaction[]>({
    queryKey: ["/api/transactions", address],
    queryFn: async () => {
      const res = await fetch("/api/transactions", { 
        headers: getHeaders(address),
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return await res.json();
    },
    enabled: !!address, 
    retry: false
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (data: { amount: number; description: string; metadata?: any }) => {
      const res = await fetch("/api/users/withdraw", {
        method: "POST",
        headers: getHeaders(address),
        body: JSON.stringify(data),
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

export function useAddFunds() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({ amount, txHash }: { amount: number; txHash: string }) => {
      const res = await fetch("/api/users/funds", {
        method: "POST",
        headers: getHeaders(address),
        body: JSON.stringify({ amount, txHash }),
      });
      if (!res.ok) throw new Error("Failed to sync deposit");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });
}