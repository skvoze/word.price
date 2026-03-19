import { useState } from "react";
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
  const [amount] = useState("10"); 

  // Разделяем управление транзакциями
  const approve = useWriteContract();
  const deposit = useWriteContract();

  // Ждем подтверждения Approve
  const { isSuccess: approveConfirmed, isLoading: isConfirmingApprove } = useWaitForTransactionReceipt({ 
    hash: approve.data 
  });

  // Ждем подтверждения Deposit
  const { isSuccess: depositConfirmed, isLoading: isConfirmingDeposit, data: depositReceipt } = useWaitForTransactionReceipt({ 
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
        // Важно: передаем число как есть ("10"), бэкенд сам умножит на 100 для базы
        body: JSON.stringify({ amount, txHash })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      setStep('success');
    }
  });

  const handleApprove = () => {
    approve.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "approve",
      args: [VAULT_ADDRESS, parseUnits(amount, 6)],
    });
  };

  const handleDeposit = () => {
    deposit.writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [parseUnits(amount, 6)],
    });
  };

  // Эффект: переход от Approve к Deposit
  if (approveConfirmed && step === 'approve') {
    setStep('deposit');
  }
  
  // Эффект: синхронизация с БД после успешного депозита
  if (depositConfirmed && step === 'deposit' && !syncDeposit.isPending && !syncDeposit.isSuccess) {
    syncDeposit.mutate(deposit.data!);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-primary font-bold uppercase text-xs tracking-widest px-6">
          <PlusCircle className="w-4 h-4 mr-2" />
          Deposit {amount} USDC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase italic tracking-tighter">
            Refill Balance
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="flex justify-between items-center px-2">
            <Step circle="1" label="Approve" active={step === 'approve'} done={step !== 'approve'} />
            <ArrowRight className="text-muted-foreground w-4 h-4" />
            <Step circle="2" label="Deposit" active={step === 'deposit'} done={step === 'success'} />
            <ArrowRight className="text-muted-foreground w-4 h-4" />
            <Step circle="3" label="Finish" active={step === 'success'} done={step === 'success'} />
          </div>

          <div className="bg-black/20 p-6 rounded-2xl border border-border/50 text-center">
             <span className="text-4xl font-black text-white">{amount}</span>
             <span className="ml-2 text-sm font-bold text-[#2775CA]">USDC</span>
          </div>

          {step === 'approve' && (
  <Button 
    onClick={handleApprove} 
    className="w-full h-12 font-bold uppercase tracking-wider" 
    disabled={approve.isPending || isConfirmingApprove}
  >
    {(approve.isPending || isConfirmingApprove) ? (
      <>
        <Loader2 className="animate-spin mr-2 w-5 h-5" />
        {isConfirmingApprove ? "Confirming on Base..." : "Check Wallet..."}
      </>
    ) : (
      "Step 1: Allow 10 USDC"
    )}
  </Button>
)}
{step === 'deposit' && (
  <Button 
    onClick={handleDeposit} 
    className="w-full h-12 font-bold bg-green-600 hover:bg-green-700 uppercase tracking-wider" 
    disabled={deposit.isPending || isConfirmingDeposit || syncDeposit.isPending}
  >
    {(deposit.isPending || isConfirmingDeposit || syncDeposit.isPending) ? (
      <>
        <Loader2 className="animate-spin mr-2 w-5 h-5" />
        {syncDeposit.isPending ? "Updating Balance..." : "Processing Deposit..."}
      </>
    ) : (
      "Step 2: Confirm Deposit"
    )}
  </Button>
)}

          {step === 'success' && (
            <div className="text-center py-2 text-green-500 animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
              <p className="font-bold uppercase italic">Funds added successfully!</p>
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