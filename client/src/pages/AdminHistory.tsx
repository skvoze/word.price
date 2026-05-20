import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { api } from "@shared/routes";
import { TaskCard } from "@/components/TaskCard";
import { BottomNav } from "@/components/BottomNav";
import { getContractAddresses, VAULT_ABI } from "../../../shared/contracts"; 
import { Loader2, Target, History, Landmark } from "lucide-react";
import { useAccount, useReadContract, useChainId } from 'wagmi'; 
import { ConnectButton } from '@rainbow-me/rainbowkit'; 

export default function AdminHistory() {
  const { data: user } = useUser();
  const { address } = useAccount();
  const chainId = useChainId(); 
  
  const addresses = getContractAddresses(chainId);

  const { data: reserveRaw } = useReadContract({
    address: addresses.vault, 
    abi: VAULT_ABI,
    functionName: 'reserveBalance',
    query: {
      enabled: !!address,
      refetchInterval: 1000 * 60,
    }
  });
  
  const reserveBalance = reserveRaw ? Number(reserveRaw) / 1_000_000 : 0;
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: [api.tasks.list.path, address], 
    queryFn: async () => {
      const res = await fetch(api.tasks.list.path, { 
        headers: {
          "x-user-address": address || ""
        } 
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch admin tasks");
      }
      return await res.json();
    },
    enabled: !!user && !!address,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeTasks = tasks?.filter((t: any) => 
    ((t.status === "pending" || t.status === "failed" || t.status === 'submitted') && new Date(t.deadline) > new Date()) || 
    (t.status === 'submitted' && new Date(t.deadline) < new Date())
  ) || [];

  const completedTasks = tasks?.filter((t: any) => 
    (t.status === "completed") || 
    (t.status === "failed" && new Date(t.deadline) < new Date())
  ) || [];

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="px-6 pt-8 pb-10 bg-gradient-to-br from-card to-background border-b border-border/50 relative overflow-hidden">
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
          {address && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              <Landmark className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary">
                {reserveBalance.toFixed(2)} USDC
              </span>
            </div>
          )}
          <ConnectButton chainStatus="none" showBalance={false} />
        </div>

        <div className="relative z-10">
          <h1 className="text-sm font-medium text-muted-foreground mb-1 tracking-wider uppercase">
            Global Overview
          </h1>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground tracking-tight">
              System History
            </span>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Active All Users
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {activeTasks.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeTasks.map((task: any) => (
              <TaskCard key={task.id} task={task} isAdmin={true} />
            ))}
          </div>
        </section>
        
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2 text-muted-foreground">
              <History className="w-5 h-5" />
              Completed All Users
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
              {completedTasks.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-80">
            {completedTasks.map((task: any) => (
              <TaskCard key={task.id} task={task} isAdmin={true} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}