import { useState} from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseUnits } from "viem";
import { VAULT_ADDRESS, USDC_ADDRESS, VAULT_ABI, USDC_ABI } from "../../../shared/contracts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, PlusCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function DepositDialog() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'approve' | 'deposit' | 'success'>('approve');
  const [amount, setAmount] = useState("10"); 
  const [isOpen, setIsOpen] = useState(false); 

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      setStep('success');
    }
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setStep('approve');
        approve.reset();
        deposit.reset();
      }, 300);
    }
  };

  const handleApprove = () => {
    approve.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "approve",
      args: [VAULT_ADDRESS, parseUnits(amount, 6)],
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

  if (approveConfirmed && step === 'approve') setStep('deposit');
  if (depositConfirmed && step === 'deposit' && !syncDeposit.isPending && !syncDeposit.isSuccess) {
    syncDeposit.mutate(deposit.data!);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-primary font-bold uppercase text-xs tracking-widest px-6">
          <PlusCircle className="w-4 h-4 mr-2" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase italic tracking-tighter text-white">
            Refill Balance
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Инпут суммы (скрываем, если транзакция уже пошла) */}
          {step === 'approve' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Amount (USDC)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="no-spinner w-full bg-black/40 border border-border/50 rounded-xl h-14 px-4 text-2xl font-black text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#2775CA]">USDC</span>
              </div>
            </div>
          )}

          {/* Индикатор шагов */}
          <div className="flex justify-between items-center px-2">
            <Step circle="1" label="Approve" active={step === 'approve'} done={step !== 'approve'} />
            <ArrowRight className="text-muted-foreground w-4 h-4" />
            <Step circle="2" label="Deposit" active={step === 'deposit'} done={step === 'success'} />
            <ArrowRight className="text-muted-foreground w-4 h-4" />
            <Step circle="3" label="Finish" active={step === 'success'} done={step === 'success'} />
          </div>

          {/* Кнопки управления */}
          {step === 'approve' && (
            <Button onClick={handleApprove} className="w-full h-12 font-bold" disabled={approve.isPending || isConfirmingApprove || !amount || parseFloat(amount) <= 0}>
              {isConfirmingApprove ? <Loader2 className="animate-spin mr-2" /> : null}
              {isConfirmingApprove ? "Confirming..." : "Approve USDC"}
            </Button>
          )}

          {step === 'deposit' && (
            <Button onClick={handleDeposit} className="w-full h-12 font-bold bg-green-600 hover:bg-green-700 text-white" disabled={deposit.isPending || isConfirmingDeposit || syncDeposit.isPending}>
              {(isConfirmingDeposit || syncDeposit.isPending) ? <Loader2 className="animate-spin mr-2" /> : null}
              {syncDeposit.isPending ? "Syncing with DB..." : "Confirm Deposit"}
            </Button>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="text-center py-2 text-green-400 animate-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                <p className="font-bold uppercase italic">{amount} USDC Added!</p>
              </div>
              <Button onClick={() => setIsOpen(false)} className="w-full variant-outline">Close</Button>
            </div>
          )}
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