import { QueryClient, QueryFunction } from "@tanstack/react-query";

const getTelegramId = () => {
  const tg = (window as any).Telegram?.WebApp;
  
  // Это точно должно появиться в логах
  console.log("=== DEBUG TELEGRAM ===");
  console.log("WebApp Object exists:", !!tg);
  console.log("InitData:", tg?.initData);
  console.log("User Data:", tg?.initDataUnsafe?.user);

  if (tg?.initDataUnsafe?.user?.id) {
    const id = tg.initDataUnsafe.user.id.toString();
    console.log("Found real ID:", id);
    return id;
  }
  
  const testId = localStorage.getItem("testTelegramId");
  console.log("Fallback to localStorage ID:", testId);
  return testId || "";
};
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  const TelegramId = getTelegramId();
  if (TelegramId) {
    headers["x-telegram-id"] = TelegramId;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
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
    
    // Add test Telegram ID if set
  const TelegramId = getTelegramId();
  if (TelegramId) {
    headers["x-telegram-id"] = TelegramId;
  }
  
    
    const res = await fetch(queryKey.join("/") as string, {
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
