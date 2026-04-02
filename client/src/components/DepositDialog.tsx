import { useState,useEffect} from "react";
import { VAULT_ADDRESS, USDC_ADDRESS, VAULT_ABI, USDC_ABI } from "../../../shared/contracts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, PlusCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits } from "viem";

export function DepositDialog() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'approve' | 'deposit' | 'success'>('approve');
  const [amount, setAmount] = useState(""); 
  const [isOpen, setIsOpen] = useState(false); 
const { data: usdcBalanceRaw,refetch: refetchUSDC } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, 
    }
  });
  const { data: currentAllowance } = useReadContract({
  address: USDC_ADDRESS,
  abi: USDC_ABI,
  functionName: 'allowance',
  args: address ? [address, VAULT_ADDRESS] : undefined,
});
  const usdcBalance = usdcBalanceRaw ? parseFloat(formatUnits(usdcBalanceRaw as bigint, 6)) : 0;
  const setMaxAmount = () => {
    setAmount(usdcBalance.toString());
  };
const { refetch: refetchVault } = useReadContract({
  address: VAULT_ADDRESS,
  abi: VAULT_ABI,
  functionName: 'availableBalance',
  args: address ? [address] : undefined,
});
  const isAmountValid = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && parseFloat(amount) <= usdcBalance;
  const approve = useWriteContract();
  const deposit = useWriteContract();

  const { isSuccess: approveConfirmed, isLoading: isConfirmingApprove } = useWaitForTransactionReceipt({ 
    hash: approve.data 
  });

  const { isSuccess: depositConfirmed, isLoading: isConfirmingDeposit } = useWaitForTransactionReceipt({ 
    hash: deposit.data 
  });

  const syncDeposit = useMutation({
  mutationFn: async (txHash: string) => {
    const res = await fetch("/api/users/deposit", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user-address": address?.toLowerCase() || "" 
      },
      body: JSON.stringify({ amount, txHash })
    });
    return res.json();
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    await Promise.all([
      refetchUSDC(),
      queryClient.refetchQueries({ queryKey: ['wagmi', 'readContract', VAULT_ADDRESS] }),
      queryClient.refetchQueries({ queryKey: ['wagmi', 'readContract', USDC_ADDRESS] })
    ]);
    await refetchVault();
    setStep('success');
  }
});

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setStep('approve');
        setAmount("");
        approve.reset();
        deposit.reset();
        syncDeposit.reset();
      }, 300);
    }
  };

  const handleApprove = () => {
  const cleanAmount = amount.replace(',', '.');
  const parsedAmount = parseUnits(cleanAmount, 6);
  if (currentAllowance && (currentAllowance as bigint) >= parsedAmount) {
    setStep('deposit');
    return;
  }

  approve.writeContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "approve",
    args: [VAULT_ADDRESS, parsedAmount],
  });
};

  const handleDeposit = () => {
  if (!amount || isNaN(parseFloat(amount))) {
    console.error("Invalid amount");
    return;
  }
  deposit.writeContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [parseUnits(amount.toString().replace(',', '.'), 6)], 
  });
};
useEffect(() => {
  if (approveConfirmed && step === 'approve') {
    refetchUSDC(); 
    setStep('deposit');
  }
}, [approveConfirmed]);
useEffect(() => {
  if (depositConfirmed && step === 'deposit' && !syncDeposit.isPending && !syncDeposit.isSuccess) {
    syncDeposit.mutate(deposit.data!);
  }
}, [depositConfirmed, step, syncDeposit, deposit.data]);

  

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
    <DialogTrigger asChild>
  <Button className="w-full h-12 rounded-full bg-primary font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
    <PlusCircle className="w-4 h-4" />
    Deposit
  </Button>
</DialogTrigger>
    
    <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold uppercase italic tracking-tighter text-white">
          Refill Balance
        </DialogTitle>
      </DialogHeader>

      <div className="py-6 space-y-6">
        {/* Поле ввода суммы (только на этапе Approve) */}
        {step === 'approve' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Amount (USDC)
              </label>
              <button 
                onClick={setMaxAmount}
                className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
              >
                Max: {usdcBalance.toFixed(2)} USDC
              </button>
            </div>
            
            <div className="relative">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => {
                        const value = e.target.value;
                        if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
                          setAmount(value.substring(1));
                        } else {
                          setAmount(value);
                        }
                      }}
                    onFocus={(e) => {
                        if (amount === "0") setAmount("");
                    }}
                className={`no-spinner w-full bg-black/40 border ${!isAmountValid && amount !== "0" ? 'border-red-500/50' : 'border-border/50'} rounded-xl h-14 px-4 text-2xl font-black text-white focus:outline-none focus:border-primary transition-all shadow-inner`}
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#2775CA] pointer-events-none">
                USDC
              </span>
            </div>

            {parseFloat(amount) > usdcBalance && (
              <p className="text-[10px] text-red-500 font-bold uppercase italic text-center ml-1 animate-pulse">
                Insufficient USDC on wallet
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
          <Step circle="1" label="Approve" active={step === 'approve'} done={step !== 'approve'} />
          <ArrowRight className="text-muted-foreground/30 w-4 h-4" />
          <Step circle="2" label="Deposit" active={step === 'deposit'} done={step === 'success'} />
          <ArrowRight className="text-muted-foreground/30 w-4 h-4" />
          <Step circle="3" label="Finish" active={step === 'success'} done={step === 'success'} />
        </div>

        {/* Кнопки управления */}
        <div className="pt-2">
          {step === 'approve' && (
            <Button 
              onClick={handleApprove} 
              className="w-full h-14 font-black uppercase tracking-widest text-sm italic" 
              disabled={!isAmountValid || approve.isPending || isConfirmingApprove}
            >
              {isConfirmingApprove ? (
                <><Loader2 className="animate-spin mr-2 w-5 h-5" /> Confirming...</>
              ) : (
                parseFloat(amount) > usdcBalance ? "Insufficient Balance" : "Approve USDC"
              )}
            </Button>
          )}

          {step === 'deposit' && (
            <Button 
              onClick={handleDeposit} 
              className="w-full h-14 font-black uppercase tracking-widest text-sm italic" 
              disabled={deposit.isPending || isConfirmingDeposit || syncDeposit.isPending}
            >
              {(isConfirmingDeposit || syncDeposit.isPending) ? (
                <><Loader2 className="animate-spin mr-2 w-5 h-5" /> {syncDeposit.isPending ? "Syncing..." : "Processing..."}</>
              ) : (
                "Confirm Deposit"
              )}
            </Button>
          )}

          {step === 'success' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-500">
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-green-500" />
                <h3 className="text-xl font-black text-white uppercase italic">Success!</h3>
                <p className="font-bold text-green-400 mt-1">+{amount} USDC</p>
              </div>
              <Button 
                onClick={() => handleOpenChange(false)} 
                variant="outline"
                className="w-full h-12 font-bold uppercase tracking-widest border-border hover:bg-white/5"
              >
                Back to App
              </Button>
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>
  );
}

function Step({ circle, label, active, done }: { circle: string, label: string, active: boolean, done: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active || done ? 'opacity-100' : 'opacity-30'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${done ? 'bg-green-500 text-white' : active ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
        {done ? <CheckCircle2 className="w-5 h-5" /> : circle}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </div>
  );
}