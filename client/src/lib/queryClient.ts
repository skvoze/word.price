import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
const getTelegramId = () => {
  const tg = (window as any).Telegram?.WebApp;
  
  // 1. Приоритет №1: Реальный Telegram (наш Vacok с ID 514679635)
  if (tg?.initDataUnsafe?.user?.id) {
    return tg.initDataUnsafe.user.id.toString();
  }
  
  // 2. Приоритет №2: LocalStorage, но ТОЛЬКО если это не демка
  const storedId = localStorage.getItem("testTelegramId");
  if (storedId && storedId !== "demo_user_123") {
    return storedId;
  }
  
  return ""; // Если ничего нет, возвращаем пустоту, чтобы бэкенд создал ошибку или нового юзера
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Важно: создаем объект заголовков правильно
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  const telegramId = getTelegramId();
  if (telegramId) {
    headers["x-telegram-id"] = telegramId;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Используем нашу функцию, которую мы уже отладили
    const telegramId = getTelegramId(); 
    if (telegramId) {
      headers["x-telegram-id"] = telegramId;
    }
    
    const res = await fetch("/" + queryKey.join("/"), { // проверь, чтобы путь был верным
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
