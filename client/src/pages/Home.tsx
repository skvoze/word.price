import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useConfig, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTasks } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-user";
import { TaskCard } from "@/components/TaskCard";
import { BottomNav } from "@/components/BottomNav";
import { Loader2, Target, TrendingUp, ChevronDown } from "lucide-react"; 
import { type Task } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DepositDialog } from "@/components/DepositDialog";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { getContractAddresses, VAULT_ABI, USDC_ABI } from "../../../shared/contracts";

// --- КОМПОНЕНТЫ ИКОНОК СЕТЕЙ (SVG) ---
export function BaseLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#0052FF"/>
      <path d="M12 6V18M6 12H18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ); 
}

export function ArcLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#A855F7"/>
      <path d="M12 7L7 17H17L12 7Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

export const NETWORK_CONFIGS: Record<number, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
  8453: { 
    name: "Base",
    icon: BaseLogo,
  },
  5042002: { 
    name: "Arc Testnet",
    icon: ArcLogo,
  }
};

export function ChainIcon({ chainId, className = "w-4 h-4" }: { chainId: number; className?: string }) {
  const IconComponent = NETWORK_CONFIGS[chainId]?.icon;
  
  if (!IconComponent) return null;
  
  return <IconComponent className={className} />;
}


export default function Home() {
  const { address, isConnected, chain } = useAccount(); 
  const config = useConfig();
  const { switchChain } = useSwitchChain();
  
  const defaultChainId = config.chains[0]?.id || 8453;
  const currentChainId = chain?.id || defaultChainId; 
  
  const addresses = getContractAddresses(currentChainId);
  const [isMobile, setIsMobile] = useState(false);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);

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

  const { data: usdcDecimalsRaw } = useReadContract({
    address: addresses.usdc,
    abi: [
      ...USDC_ABI,
      {
        inputs: [],
        name: "decimals",
        outputs: [{ type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: 'decimals',
    chainId: currentChainId,
    query: { enabled: !!addresses.usdc }
  });
  const usdcDecimals = Number(usdcDecimalsRaw ?? 6);

  const { data: vaultBalanceRaw } = useReadContract({
    address: addresses.vault,
    abi: VAULT_ABI,
    functionName: 'availableBalance',
    args: address ? [address] : undefined,
    chainId: currentChainId,
    query: {
      enabled: !!addresses.vault && !!address,
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
        body: JSON.stringify({ amount: 10, txHash, chainId: currentChainId })
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
    ? parseFloat(formatUnits(vaultBalanceRaw, usdcDecimals)) 
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
      className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden"
      style={{ paddingBottom: bottomPadding }}
    >

      <header className="px-6 pt-8 pb-8 bg-gradient-to-br from-card to-background border-b border-border/50 relative z-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-start gap-4 mb-5">
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
                chain: currentConnectedChain,
                openConnectModal,
                openAccountModal, 
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  currentConnectedChain &&
                  (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                    })}
                    className="flex items-center gap-2 ml-auto"
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="h-10 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (currentConnectedChain.unsupported) {
                        return (
                          <button
                            onClick={() => switchChain({ chainId: defaultChainId })}
                            type="button"
                            className="h-10 bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-5 rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                          >
                            Wrong Network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          {/* Кастомный выпадающий список выбора сетей */}
                          <div className="relative">
                            <button
                              onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                              type="button"
                              className="h-10 bg-card border border-border/80 hover:border-border text-foreground text-xs font-bold uppercase tracking-wider px-4 rounded-xl flex items-center gap-2 hover:bg-accent transition-all shadow-sm"
                            >
                              {/* Кастомная динамическая иконка на кнопке-триггере */}
                              <ChainIcon chainId={currentChainId} className="w-4 h-4 rounded-full" />
                              <span>{currentConnectedChain.name}</span>
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" style={{ transform: isChainDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                            </button>

                            {isChainDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsChainDropdownOpen(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-40 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2.5 py-1">
                                    Mainnet
                                  </div>
                                  <button
                                    onClick={() => {
                                      switchChain({ chainId: 8453 });
                                      setIsChainDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-2.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors ${
                                      currentChainId === 8453 ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground'
                                    }`}
                                  >
                                    {/* Настоящая иконка Base в выпадающем списке */}
                                    <ChainIcon chainId={8453} className="w-4 h-4 rounded-full" />
                                    Base
                                  </button>

                                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2.5 py-1 pt-2 border-t border-border/50">
                                    Testnet
                                  </div>
                                  <button
                                    onClick={() => {
                                      switchChain({ chainId: 5042002 });
                                      setIsChainDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-2.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors ${
                                      currentChainId === 5042002 ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground'
                                    }`}
                                  >
                                    {/* Настоящая иконка Arc в выпадающем списке */}
                                    <ChainIcon chainId={5042002} className="w-4 h-4 rounded-full" />
                                    Arc Testnet
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Кнопка Аккаунта */}
                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="h-10 bg-card border border-border/80 hover:border-border text-foreground text-xs font-bold uppercase tracking-wider px-4 rounded-xl flex items-center gap-2 hover:bg-accent transition-all shadow-sm font-mono"
                          >
                            {account.ensAvatar ? (
                              <img src={account.ensAvatar} className="w-4 h-4 rounded-full" alt="avatar" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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

          {/* Строка Кнопок Действий (Депозит / Вывод) под Балансом */}
          {isConnected && (
            <div className="flex items-center gap-2 max-w-[260px] w-full"> 
              <DepositDialog />
              <WithdrawDialog />
            </div>
          )}
        </div>
      </header>

      <main className="px-4 py-6 space-y-8 flex-1 max-w-7xl mx-auto w-full relative z-10">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-80 hover:opacity-100 transition-opacity">
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