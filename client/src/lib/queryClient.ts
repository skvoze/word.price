import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
const getTelegramId = () => {
  const tg = (window as any).Telegram?.WebApp;
  console.log("Checking TG ID...");

  if (tg?.initDataUnsafe?.user?.id) {
    const realId = tg.initDataUnsafe.user.id.toString();
    console.log("SUCCESS: Found ID", realId);
    return realId;
  }
  

  const fallbackId = localStorage.getItem("testTelegramId");
  console.log("FALLBACK: Using localStorage ID", fallbackId);
  
  return fallbackId || "";
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
    
  
    const telegramId = getTelegramId(); 
    if (telegramId) {
      headers["x-telegram-id"] = telegramId;
    }
    
   
    const path = queryKey.join("/");
const url = path.startsWith("api") ? `/${path}` : `/api/${path}`;

const res = await fetch(url + "?t=" + Date.now(), {
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
      staleTime: 5000,
      retry: false, 
    },
    mutations: {
      retry: false, 
    },
  },
});
