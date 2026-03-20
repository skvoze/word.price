import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { VAULT_ADDRESS, VAULT_ABI } from "../../../shared/contracts";

export function WithdrawDialog() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("0");
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Получаем баланс пользователя ВНУТРИ контракта Vault
  const { data: vaultBalanceRaw, refetch: refetchVaultBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'availableBalance',
    args: address ? [address] : undefined,
  });

  const vaultBalance = vaultBalanceRaw ? parseFloat(formatUnits(vaultBalanceRaw as bigint, 6)) : 0;

  const withdraw = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ 
    hash: withdraw.data 
  });

  // 2. Синхронизация с бэкендом (чтобы баланс в БД обновился сразу)
  const syncWithdraw = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/withdraw", { // Убедись, что этот роут есть на бэкенде
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-address": address?.toLowerCase() || "" 
        },
        body: JSON.stringify({ amount })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      setIsSuccess(true);
      refetchVaultBalance();
    }
  });

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    withdraw.writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "withdraw",
      args: [parseUnits(amount, 6)],
    });
  };

  // Следим за завершением транзакции в блокчейне
  if (withdraw.isSuccess && !isConfirming && !syncWithdraw.isPending && !syncWithdraw.isSuccess && !isSuccess) {
    syncWithdraw.mutate();
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setIsSuccess(false);
        withdraw.reset();
        setAmount("0");
      }, 300);
    }
  };

  const isInvalid = !amount || parseFloat(amount) <= 0 || parseFloat(amount) > vaultBalance;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full rounded-full border-border bg-card/50 font-bold uppercase text-[10px] tracking-widest h-10 px-6 hover:bg-secondary transition-all flex items-center justify-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          Withdraw
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase italic text-center text-white">
            Withdraw USDC
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {!isSuccess ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between px-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Vault Balance</span>
                  <button 
                    onClick={() => setAmount(vaultBalance.toString())}
                    className="text-[10px] font-black text-primary uppercase hover:underline"
                  >
                    Max: {vaultBalance.toFixed(2)}
                  </button>
                </div>

                <div className="relative">
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="no-spinner w-full bg-black/40 border border-border/50 rounded-xl h-14 px-4 text-center text-2xl font-black text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {parseFloat(amount) > vaultBalance && (
                  <p className="text-[10px] text-red-500 font-bold uppercase text-center mt-2 animate-pulse">
                    Exceeds available balance
                  </p>
                )}
              </div>

              <Button 
                onClick={handleWithdraw}
                className="w-full h-14 font-black uppercase italic tracking-widest"
                disabled={isInvalid || withdraw.isPending || isConfirming || syncWithdraw.isPending}
              >
                {isConfirming || syncWithdraw.isPending ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : null}
                {isConfirming ? "Confirming..." : syncWithdraw.isPending ? "Updating..." : "Confirm Withdrawal"}
              </Button>
            </>
          ) : (
            <div className="text-center py-6 animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white uppercase italic">Sent to Wallet!</h3>
              <p className="text-muted-foreground text-sm mt-2">Your funds are back in your pocket.</p>
              <Button onClick={() => handleOpenChange(false)} className="mt-6 w-full" variant="outline">Close</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}