import { useEffect,useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTasks } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-user";
import { TaskCard } from "@/components/TaskCard";
import { BottomNav } from "@/components/BottomNav";
import { Loader2, Target, TrendingUp} from "lucide-react";
import { type Task } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DepositDialog } from "@/components/DepositDialog";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { getContractAddresses, VAULT_ABI } from "../../../shared/contracts";

export default function Home() {
  const { address, isConnected, chain } = useAccount(); 
  const currentChainId = chain?.id || 8453; 
  const { vault: activeVaultAddress } = getContractAddresses(currentChainId);
  const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
}, []);
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/create';
    document.head.appendChild(link);
  }, []);
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useUser(currentChainId);
  const { data: tasks, isLoading: isLoadingTasks } = useTasks(currentChainId);
  const { data: vaultBalanceRaw } = useReadContract({
    address: activeVaultAddress as `0x${string}`,
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
        body: JSON.stringify({ amount: 10, txHash, chainId: currentChainId }) // <-- Добавили chainId
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
  const [isBaseApp, setIsBaseApp] = useState(false);
useEffect(() => {
  const ua = navigator.userAgent.toLowerCase();
  setIsMobile(/iphone|ipad|ipod|android/i.test(ua));
  setIsBaseApp(ua.includes('coinbase') || !!(window as any).ethereum?.isCoinbaseWallet);
}, []);
  const bottomPadding = isBaseApp 
  ? '150px' 
  : (isMobile ? 'calc(env(safe-area-inset-bottom) + 90px)' : '90px');
  

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
    style={{ paddingBottom: bottomPadding }}
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

            <ConnectButton.Custom>
  {({
    account,
    chain,
    openChainModal,
    openConnectModal,
    authenticationStatus,
    mounted,
  }) => {
    const ready = mounted && authenticationStatus !== 'loading';
    const connected =
      ready &&
      account &&
      chain &&
      (!authenticationStatus || authenticationStatus === 'authenticated');

    return (
      <div
        {...(!ready && {
          'aria-hidden': true,
          'style': {
            opacity: 0,
            pointerEvents: 'none',
            userSelect: 'none',
          },
        })}
        className="flex items-center gap-2"
      >
        {(() => {
          if (!connected) {
            return (
              <button
                onClick={openConnectModal}
                type="button"
                className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Connect Wallet
              </button>
            );
          }

          if (chain.unsupported) {
            return (
              <button
                onClick={openChainModal}
                type="button"
                className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors"
              >
                Wrong Network
              </button>
            );
          }

          return (
            <div className="flex items-center gap-2">
              {/* Кнопка сети — Слева */}
              <button
                onClick={openChainModal}
                type="button"
                className="bg-card border border-border/80 text-foreground text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-accent transition-colors"
              >
                {chain.hasIcon && chain.iconUrl && (
                  <img
                    alt={chain.name ?? 'Chain icon'}
                    src={chain.iconUrl}
                    className="w-3.5 h-3.5 rounded-full"
                  />
                )}
                <span className="hidden sm:inline">{chain.name}</span>
              </button>

              {/* Кнопка аккаунта (Аватар + Адрес) — Справа */}
              <button
                onClick={openConnectModal} // или openAccountModal, если импортирован
                type="button"
                className="bg-card border border-border/80 text-foreground text-xs font-mono px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-accent transition-colors"
              >
                {account.ensAvatar ? (
                  <img src={account.ensAvatar} className="w-3.5 h-3.5 rounded-full" alt="avatar" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-primary/20 border border-primary/40" />
                )}
                {account.displayName}
              </button>
            </div>
          );
        })()}
      </div>
    );
  }}
</ConnectButton.Custom>
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