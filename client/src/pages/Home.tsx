import { useEffect } from "react";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTasks } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-user";
import { TaskCard } from "@/components/TaskCard";
import { BottomNav } from "@/components/BottomNav";
import { Loader2, Target, TrendingUp, ArrowUpRight, PlusCircle } from "lucide-react";
import { type Task } from "@shared/schema";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DepositDialog } from "@/components/DepositDialog";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { VAULT_ADDRESS, VAULT_ABI } from "../../../shared/contracts";


export default function Home() {
  const { address, isConnected } = useAccount();
  const [, setLocation] = useLocation();
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/create';
    document.head.appendChild(link);
  }, []);
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useUser();
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const { data: vaultBalanceRaw } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'availableBalance',
    args: address ? [address] : undefined,
    query: {
    refetchInterval: 5000
  }
  });
  useEffect(() => {
  if (isConnected && vaultBalanceRaw !== undefined) {
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    }, 2000);

    return () => clearTimeout(timer);
  }
}, [vaultBalanceRaw, isConnected, queryClient]);
  
  

  const { writeContract, data: hash, isPending: isWaitingSignature } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const syncDeposit = useMutation({
    mutationFn: async (txHash: string) => {
      const res = await fetch("/api/users/deposit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-address": address?.toLowerCase() || "" 
        },
        body: JSON.stringify({ amount: 10, txHash })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    }
  });
const activeTasks = (tasks as Task[])?.filter((t: Task) => 
    ((t.status === "pending" || t.status === "failed" || t.status === 'submitted') && new Date(t.deadline) > new Date()) || 
    (t.status === 'submitted' && new Date(t.deadline) < new Date())
  ) || [];

  const completedTasks = (tasks as Task[])?.filter((t: Task) => 
    (t.status === "completed") || (t.status === "failed" && new Date(t.deadline) < new Date())
  ) || [];
  if (hash && !isConfirming && !syncDeposit.isSuccess && !syncDeposit.isPending) {
    syncDeposit.mutate(hash);
  }
  const lockedAmount = activeTasks.reduce((acc, task) => acc + Number(task.amount), 0);
  const contractBalance = (typeof vaultBalanceRaw === 'bigint')
  ? parseFloat(formatUnits(vaultBalanceRaw, 6)) 
  : (user?.balance ? Number(user.balance) / 100 : 0);

  const displayBalance = contractBalance.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  

  if (isLoadingTasks || isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-[100dvh] bg-background flex flex-col"
      style={{ 
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 140px)' 
      }}
    >
      <header className="px-6 pt-8 pb-10 bg-gradient-to-br from-card to-background border-b border-border/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xs font-medium text-muted-foreground mb-1 tracking-wider uppercase">
                Available Balance
              </h1>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground tracking-tight">
                  {displayBalance}
                </span>
                <span className="text-sm font-bold text-[#2775CA]">USDC</span>
              </div>
              
              {lockedAmount > 0 && (
                <div className="mt-2 flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <p className="text-[10px] text-orange-200 font-bold uppercase tracking-wider">
                    {(lockedAmount/100).toFixed(2)} USDC Locked
                  </p>
                </div>
              )}
            </div>

            <ConnectButton 
              accountStatus="avatar"
              chainStatus="icon"
              showBalance={false}
            />
          </div>

          {isConnected && (
            <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-6"> 
              <DepositDialog />
              <WithdrawDialog />
            </div>
          )}
        </div>
      </header>

      <main className="px-4 py-6 space-y-8 flex-1">
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter italic">
              <Target className="w-5 h-5 text-primary" />
              Active Challenges
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-black uppercase">
              {activeTasks.length} RUNNING
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="bg-card/50 border border-border/50 rounded-2xl p-8 text-center border-dashed">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-foreground font-bold uppercase text-sm">No active tasks</p>
              <p className="text-xs text-muted-foreground mt-1">
                Decentralize your discipline. Start your first challenge.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>

        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 px-1 text-muted-foreground uppercase tracking-tighter italic flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              History
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}