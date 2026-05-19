import { useQuery, useMutation } from "@tanstack/react-query";
import { transactions, Transaction } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Copy, ExternalLink } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function AdminPage() {
  const { toast } = useToast();
  const { data: user } = useUser();
    const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  const { data: withdrawals, isLoading, error } = useQuery<Transaction[]>({
  queryKey: ["/api/admin/withdrawals"],
  queryFn: async () => {
    const userAddress = localStorage.getItem("userAddress");
    const res = await fetch("/api/admin/withdrawals", {
      headers: {
        "x-user-address": userAddress || "" 
      }
    });
    if (!res.ok) throw new Error("Access denied (Admin only)");
    return res.json();
  },
  enabled: !!user?.role
});

  const statusMutation = useMutation({
  mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
    const res = await apiRequest("PATCH", `/api/admin/transactions/${id}`, { 
      status, 
      rejectionReason 
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
    toast({ title: "Status updated" });
  },
});

  const copyCard = (num: string) => {
    navigator.clipboard.writeText(num);
    toast({ title: "Copy!", description: "" });
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

 const allWithdrawals = withdrawals?.filter(t => t.type === "withdraw") || [];
  const pending = allWithdrawals.filter(t => t.status === "pending");
  const history = allWithdrawals.filter(t => t.status !== "pending");
if (error) {
  return (
    <div className="container mx-auto py-20 text-center">
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl inline-block">
        <h2 className="text-red-500 font-bold mb-2">Access denied</h2>
        <p className="text-zinc-400 text-sm">{error.message}</p>
      </div>
    </div>
  );
}
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Manage payment</h1>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl">
    <p className="text-sm text-zinc-500">Payments wait</p>
    <p className="text-2xl font-bold text-amber-500">
      {(pending.reduce((acc, curr) => acc + Math.abs(curr.amount), 0) / 100).toLocaleString()} ₽
    </p>
  </div>
  
 

  <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl">
  </div>
</div>
    </div>
  );
}