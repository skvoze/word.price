import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
const getTelegramId = () => {
  const tg = (window as any).Telegram?.WebApp;
  
  // Берем ID напрямую из того объекта, который мы видели в логах
  if (tg?.initDataUnsafe?.user?.id) {
    return tg.initDataUnsafe.user.id.toString();
  }
  
  // Если мы в браузере на ПК, берем тестовый ID
  return localStorage.getItem("testTelegramId") || "";
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
