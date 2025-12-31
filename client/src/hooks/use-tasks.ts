import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTask } from "@shared/schema";

export function useTasks() {
  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const testTelegramId = localStorage.getItem("testTelegramId");
      if (testTelegramId) {
        headers["x-telegram-id"] = testTelegramId;
      }
      const res = await fetch(api.tasks.list.path, { headers, credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
  });
}

export function useSubmittedTasks() {
  return useQuery({
    queryKey: [api.tasks.submitted.path],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const testTelegramId = localStorage.getItem("testTelegramId");
      if (testTelegramId) {
        headers["x-telegram-id"] = testTelegramId;
      }
      const res = await fetch(api.tasks.submitted.path, { headers, credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch submitted tasks");
      return api.tasks.submitted.responses[200].parse(await res.json());
    },
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: [api.tasks.get.path, id],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const testTelegramId = localStorage.getItem("testTelegramId");
      if (testTelegramId) {
        headers["x-telegram-id"] = testTelegramId;
      }
      const url = buildUrl(api.tasks.get.path, { id });
      const res = await fetch(url, { headers, credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch task");
      return api.tasks.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTask) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const testTelegramId = localStorage.getItem("testTelegramId");
      if (testTelegramId) {
        headers["x-telegram-id"] = testTelegramId;
      }
      const res = await fetch(api.tasks.create.path, {
        method: api.tasks.create.method,
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.tasks.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create task");
      }
      return api.tasks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }); // Balance changes
    },
  });
}

export function useSubmitEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, evidenceUrl }: { id: number; evidenceUrl: string }) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const testTelegramId = localStorage.getItem("testTelegramId");
      if (testTelegramId) {
        headers["x-telegram-id"] = testTelegramId;
      }
      const url = buildUrl(api.tasks.submitEvidence.path, { id });
      const res = await fetch(url, {
        method: api.tasks.submitEvidence.method,
        headers,
        body: JSON.stringify({ evidenceUrl }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit evidence");
      return api.tasks.submitEvidence.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, id] });
    },
  });
}

// Admin mock actions for demo
export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.complete.path, { id });
      const res = await fetch(url, { method: api.tasks.complete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to complete task");
      return api.tasks.complete.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }); // Refund happens
    },
  });
}

export function useFailTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.fail.path, { id });
      const res = await fetch(url, { method: api.tasks.fail.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to fail task");
      return api.tasks.fail.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, id] });
    },
  });
}
