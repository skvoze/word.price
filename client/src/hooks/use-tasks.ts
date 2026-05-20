import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTask, type Task } from "@shared/schema";
import { useAccount } from "wagmi";

const getHeaders = (address?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (address) {
    headers["x-user-address"] = address.toLowerCase();
  }
  return headers;
};
export function useTasks(chainId: number = 8453) {
  const { address } = useAccount();

  return useQuery<Task[]>({
    queryKey: [api.tasks.list.path, chainId, address],
    queryFn: async () => {
      const res = await fetch(`${api.tasks.list.path}?chainId=${chainId}`, { 
        headers: getHeaders(address), 
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return await res.json();
    },
    enabled: !!address, 
    retry: 2,    
    retryDelay: 1000
  });
}

export function useSubmittedTasks() {
  const { address } = useAccount();

  return useQuery<Task[]>({
    queryKey: ["/api/admin/tasks", address],
    queryFn: async () => {
      const res = await fetch("/api/admin/tasks", { 
        headers: getHeaders(address), 
      });
      if (!res.ok) throw new Error("Failed to fetch submitted tasks");
      return await res.json();
    },
    enabled: !!address,
    retry: false
  });
}

export function useTask(id: number) {
  const { address } = useAccount();

  return useQuery({
    queryKey: [api.tasks.get.path, id, address],
    queryFn: async () => {
      const url = buildUrl(api.tasks.get.path, { id });
      const res = await fetch(url, { 
        headers: getHeaders(address),
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch task");
      return await res.json();
    },
    enabled: !!address && !isNaN(id),
    retry: false
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (data: InsertTask & { chainId?: number }) => {
      const res = await fetch(api.tasks.create.path, {
        method: api.tasks.create.method,
        headers: getHeaders(address), 
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create task");
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      const taskChainId = variables.chainId || 8453;
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, taskChainId] });
      queryClient.invalidateQueries({ queryKey: [api.users.me.path, taskChainId] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", taskChainId] });
    },
  });
}

export function useSubmitEvidence() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async ({ id, evidenceUrl }: { id: number; evidenceUrl: string }) => {
      const url = buildUrl(api.tasks.submitEvidence.path, { id });
      const res = await fetch(url, {
        method: api.tasks.submitEvidence.method,
        headers: getHeaders(address), 
        body: JSON.stringify({ evidenceUrl }),
      });
      if (!res.ok) throw new Error("Failed to submit evidence");
      return await res.json();
    },
    onSuccess: (updatedTask) => {
      const taskChainId = updatedTask.chainId || 8453;
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, taskChainId] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, updatedTask.id] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.submitted.path] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/tasks/${id}/approve`, { 
        method: "POST", 
        headers: getHeaders(address), 
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Database Error" }));
        throw new Error(err.message || "Failed to complete task");
      }
      return await res.json();
    },
    retry: 2,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.submitted.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      queryClient.invalidateQueries({ queryKey: [api.users.me.path] }); 
    },
  });
}

export function useFailTask() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const url = buildUrl(api.tasks.fail.path, { id });
      const res = await fetch(url, { 
        method: api.tasks.fail.method, 
        credentials: "include",
        headers: getHeaders(address), 
        body: JSON.stringify({ rejectionReason: reason }) 
      });
      if (!res.ok) throw new Error("Failed to fail task");
      return res.json();
    },
    onSuccess: (updatedTask) => {
      const taskChainId = updatedTask?.chainId || 8453;
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, taskChainId] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, updatedTask?.id] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.submitted.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", taskChainId] });
    },
  });
}