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

export function useUser(chainId: number = 8453) {
  const { address, isConnected } = useAccount();

  return useQuery({

    queryKey: [api.users.me.path, chainId, address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null;
      
      const res = await fetch(`${api.users.me.path}?chainId=${chainId}`, { 
        headers: getHeaders(address), 
      });

      if (res.status === 401) return null;

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Server Error");
      }
      
      return await res.json();
    },
    enabled: isConnected && !!address,
    retry: false,
    staleTime: 120000, 
    gcTime: 300000, 
    refetchOnWindowFocus: false, 
  });
}

export function useTransactions(chainId: number = 8453) {
  const { address } = useAccount();

  return useQuery<Transaction[]>({
    queryKey: ["/api/transactions", chainId, address],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?chainId=${chainId}`, { 
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
    mutationFn: async (data: { amount: number; description: string; chainId: number; txHash?: string }) => {
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
    onSuccess: (_, variables) => {
      const targetChainId = variables.chainId || 8453;
      queryClient.invalidateQueries({ queryKey: [api.users.me.path, targetChainId] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", targetChainId] });
    },
  });
}


export function useAddFunds() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({ amount, txHash, chainId }: { amount: number; txHash: string; chainId: number }) => {
      const res = await fetch("/api/users/deposit", { 
        method: "POST",
        headers: getHeaders(address),
        body: JSON.stringify({ amount, txHash, chainId }),
      });
      if (!res.ok) throw new Error("Failed to sync deposit");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      const targetChainId = variables.chainId || 8453;
      queryClient.invalidateQueries({ queryKey: [api.users.me.path, targetChainId] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", targetChainId] });
    },
  });
}