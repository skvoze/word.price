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

// Твой точный закругленный квадрат Base (оригинальный цвет бренда Base — #0052FF)
const BaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1280 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#0052FF" d="M0,101.12c0-34.64,0-51.95,6.53-65.28,6.25-12.76,16.56-23.07,29.32-29.32C49.17,0,66.48,0,101.12,0h1077.76c34.63,0,51.96,0,65.28,6.53,12.75,6.25,23.06,16.56,29.32,29.32,6.52,13.32,6.52,30.64,6.52,65.28v1077.76c0,34.63,0,51.96-6.52,65.28-6.26,12.75-16.57,23.06-29.32,29.32-13.32,6.52-30.65,6.52-65.28,6.52H101.12c-34.64,0-51.95,0-65.28-6.52-12.76-6.26-23.07-16.57-29.32-29.32-6.53-13.32-6.53-30.65-6.53-65.28V101.12Z"/>
  </svg>
);

// Твой идеальный Arc, вписанный в сетку 1280x1280 Base
const ArcIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1280 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#1B3158" d="M0,101.12c0-34.64,0-51.95,6.53-65.28,6.25-12.76,16.56-23.07,29.32-29.32C49.17,0,66.48,0,101.12,0h1077.76c34.63,0,51.96,0,65.28,6.53,12.75,6.25,23.06,16.56,29.32,29.32,6.52,13.32,6.52,30.64,6.52,65.28v1077.76c0,34.63,0,51.96-6.52,65.28-6.26,12.75-16.57,23.06-29.32,29.32-13.32,6.52-30.65,6.52-65.28,6.52H101.12c-34.64,0-51.95,0-65.28-6.52-12.76-6.26-23.07-16.57-29.32-29.32-6.53-13.32-6.53-30.65-6.53-65.28V101.12Z"/>
    <g transform="scale(2.56)">
      <path fill="white" d="M250.466 85C291.387 85 327.762 120.453 352.899 184.828C365.973 218.31 375.592 258.091 381.291 301.368C381.801 305.233 382.234 309.161 382.679 313.081C382.824 313.323 382.911 313.548 382.881 313.731C382.881 313.731 386.231 334.649 386.942 371.001H386.564C381.597 366.924 323.011 320.889 225.894 334.219C227.359 317.784 229.374 301.793 231.978 286.465C232.111 285.682 232.265 284.925 232.4 284.147C270.491 282.999 303.831 287.422 329.397 293.219C329.302 292.612 329.223 291.988 329.126 291.384C323.871 258.658 316.118 228.697 306.121 203.093C289.776 161.227 268.447 135.216 250.466 135.216C232.486 135.216 211.157 161.228 194.812 203.093C190.856 213.219 187.254 224.019 184.024 235.41C179.483 251.372 175.668 268.484 172.621 286.464C168.112 313.017 165.295 341.496 164.257 371.001H114C116.319 300.984 128.19 235.639 148.033 184.828C173.165 120.453 209.545 85.0002 250.466 85Z" />
    </g>
  </svg>
);

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
                          {/* Селектор сети */}
                          <div className="relative">
                            <button
                              onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                              type="button"
                              className="h-10 bg-card border border-border/80 hover:border-border text-foreground text-xs font-bold uppercase tracking-wider px-4 rounded-xl flex items-center gap-2 hover:bg-accent transition-all shadow-sm"
                            >
                              {/* Отображаем наши кастомные SVG-иконки в кнопке */}
                              {currentChainId === 8453 ? (
                                <BaseIcon className="w-4 h-4 rounded-[4px]" />
                              ) : currentChainId === 5042002 ? (
                                <ArcIcon className="w-4 h-4 rounded-[4px]" />
                              ) : currentConnectedChain.hasIcon && currentConnectedChain.iconUrl ? (
                                <img
                                  alt={currentConnectedChain.name ?? 'Chain icon'}
                                  src={currentConnectedChain.iconUrl}
                                  className="w-4 h-4 rounded-full"
                                />
                              ) : null}
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
                                    {/* Рендерим иконку Base вместо цветного кружка */}
                                    <BaseIcon className="w-4 h-4 rounded-[4px]" />
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
                                    {/* Рендерим иконку Arc вместо цветного кружка */}
                                    <ArcIcon className="w-4 h-4 rounded-[4px]" />
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