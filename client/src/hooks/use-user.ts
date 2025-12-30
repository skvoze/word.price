import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useUser() {
  const query = useQuery({
    queryKey: [api.users.me.path],
    queryFn: async () => {
      const res = await fetch(api.users.me.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.me.responses[200].parse(await res.json());
    },
  });
  
  return {
    ...query,
    refetch: query.refetch,
  };
}

export function useAddFunds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(api.users.addFunds.path, {
        method: api.users.addFunds.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add funds");
      return api.users.addFunds.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
    },
  });
}
