import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTask } from "@shared/schema";

const getHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const tg = (window as any).Telegram?.WebApp;
  const tid = tg?.initDataUnsafe?.user?.id?.toString() || localStorage.getItem("testTelegramId");

  if (tid) {
    headers["x-telegram-id"] = tid;
  }
  return headers;
};

// Вспомогательная переменная для проверок
const getTid = () => {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initDataUnsafe?.user?.id?.toString() || localStorage.getItem("testTelegramId");
};

export function useTasks() {
  const tid = getTid(); // ПРАВКА: получаем ID для проверки

  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.list.path, { 
        headers: getHeaders(), 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
    enabled: !!tid, // ПРАВКА: не запрашивать, пока нет ID
    retry: false    // ПРАВКА: не спамить при ошибке
  });
}

export function useSubmittedTasks() {
  const tid = getTid();

  return useQuery({
    queryKey: [api.tasks.submitted.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.submitted.path, { // ПРАВКА: тут был путь list.path, заменил на submitted.path
        headers: getHeaders(), 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to fetch submitted tasks");
      return api.tasks.submitted.responses[200].parse(await res.json());
    },
    enabled: !!tid,
    retry: false
  });
}

export function useTask(id: number) {
  const tid = getTid();

  return useQuery({
    queryKey: [api.tasks.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.tasks.get.path, { id });
      const res = await fetch(url, { 
        headers: getHeaders(),
        credentials: "include" 
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch task");
      return api.tasks.get.responses[200].parse(await res.json());
    },
    enabled: !!tid && !isNaN(id),
    retry: false
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTask) => {
      // ПРАВКА: удалили ручной блок headers, используем getHeaders()
      const res = await fetch(api.tasks.create.path, {
        method: api.tasks.create.method,
        headers: getHeaders(), 
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
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
    },
  });
}

export function useSubmitEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, evidenceUrl }: { id: number; evidenceUrl: string }) => {
      const url = buildUrl(api.tasks.submitEvidence.path, { id });
      const res = await fetch(url, {
        method: api.tasks.submitEvidence.method,
        headers: getHeaders(), // ПРАВКА: заменили на getHeaders()
        body: JSON.stringify({ evidenceUrl }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit evidence");
      return api.tasks.submitEvidence.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.submitted.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      queryClient.refetchQueries({ queryKey: [api.tasks.get.path, id] });
    },
  });
}

// Admin mock actions for demo
export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.complete.path, { id });
      const res = await fetch(url, { 
        method: api.tasks.complete.method, 
        headers: getHeaders(), // ДОБАВИЛИ ЭТУ СТРОЧКУ
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return api.tasks.complete.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
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
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const url = buildUrl(api.tasks.fail.path, { id });
      const res = await fetch(url, { 
        method: api.tasks.fail.method, 
        credentials: "include",
        headers: getHeaders(), 
        body: JSON.stringify({ rejectionReason: reason }) 
      });
      if (!res.ok) throw new Error("Failed to fail task");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, variables.id] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.submitted.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });
}
