import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { getContractAddresses, VAULT_ABI, USDC_ABI } from "../../../shared/contracts";

export function WithdrawDialog() {
  const { address } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const addresses = getContractAddresses(chainId);

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
    chainId: chainId,
    query: { enabled: !!addresses.usdc }
  });
  const usdcDecimals = Number(usdcDecimalsRaw ?? 6);

  const { data: vaultBalanceRaw, refetch: refetchVaultBalance } = useReadContract({
    address: addresses.vault,
    abi: VAULT_ABI,
    functionName: 'availableBalance',
    args: address ? [address] : undefined,
  });

  const vaultBalance = vaultBalanceRaw 
    ? parseFloat(formatUnits(vaultBalanceRaw as bigint, usdcDecimals)) 
    : 0;

  const withdraw = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ 
    hash: withdraw.data 
  });

  const syncWithdraw = useMutation({
    mutationFn: async (txHash: string) => {
      const res = await fetch("/api/users/withdraw", { 
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-address": address?.toLowerCase() || "" 
        },
        body: JSON.stringify({ amount, txHash, chainId }) 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refetchVaultBalance();
      setIsSuccess(true);
    }
  });

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    withdraw.writeContract({
      address: addresses.vault,
      abi: VAULT_ABI,
      functionName: "withdraw",
      args: [parseUnits(amount, usdcDecimals)],
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setIsSuccess(false);
        withdraw.reset();
        setAmount("");
      }, 300);
    }
  };

  useEffect(() => {
    if (withdraw.isSuccess && !isConfirming && !syncWithdraw.isPending && !syncWithdraw.isSuccess && !isSuccess) {
      if (withdraw.data) {
        syncWithdraw.mutate(withdraw.data);
      }
    }
  }, [withdraw.isSuccess, isConfirming, syncWithdraw, isSuccess]);

  const isInvalid = !amount || parseFloat(amount) <= 0 || parseFloat(amount) > vaultBalance;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-10 rounded-xl border border-border/80 bg-card hover:bg-accent text-foreground text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
          Withdraw
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase italic tracking-tighter text-white">
            Withdraw USDC
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-6">
          {!isSuccess ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Vault Balance
                  </span>
                  <button 
                    onClick={() => setAmount(vaultBalance.toString())}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-primary/80 transition-colors"
                  >
                    Max: {vaultBalance.toFixed(2)} USDC
                  </button>
                </div>

                <div className="relative">
                  <input 
                    type="number"
                    value={amount}
                    step="any"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
                        setAmount(value.substring(1));
                      } else {
                        setAmount(value);
                      }
                    }}
                    onFocus={() => {
                      if (amount === "0") setAmount("");
                    }}
                    placeholder="0.00"
                    className={`no-spinner w-full bg-black/40 border ${isInvalid && amount !== "" && amount !== "0" ? 'border-red-500/50' : 'border-border/50'} rounded-xl h-14 px-4 text-2xl font-black text-white focus:outline-none focus:border-primary transition-all shadow-inner`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#2775CA] pointer-events-none text-sm">
                    USDC
                  </span>
                </div>

                {parseFloat(amount) > vaultBalance && (
                  <p className="text-[10px] text-red-500 font-bold uppercase italic text-center mt-2 animate-pulse">
                    Exceeds available balance
                  </p>
                )}
              </div>

              <Button 
                onClick={handleWithdraw}
                className="w-full h-14 rounded-xl font-black uppercase italic tracking-widest text-sm"
                disabled={isInvalid || withdraw.isPending || isConfirming || syncWithdraw.isPending}
              >
                {(isConfirming || syncWithdraw.isPending) && (
                  <Loader2 className="animate-spin mr-2 w-5 h-5" />
                )}
                {isConfirming ? "Confirming..." : syncWithdraw.isPending ? "Updating..." : "Confirm Withdrawal"}
              </Button>
            </>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-500">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-green-500" />
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Sent to Wallet!</h3>
                <p className="text-muted-foreground text-xs mt-1">Your funds are back in your pocket.</p>
              </div>
              <Button 
                onClick={() => handleOpenChange(false)} 
                variant="outline" 
                className="w-full h-12 rounded-xl font-bold uppercase tracking-widest border-border hover:bg-white/5 text-xs"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}