import { useState } from "react";
import { useUser, useAddFunds } from "@/hooks/use-user";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Loader2, CreditCard, History, Wallet as WalletIcon, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Wallet() {
  const { data: user, isLoading } = useUser();
  const addFunds = useAddFunds();
  const { toast } = useToast();
  const [topUpAmount, setTopUpAmount] = useState<number>(0);

  const handleTopUp = async () => {
    if (topUpAmount <= 0) return;
    try {
      await addFunds.mutateAsync(topUpAmount);
      toast({ title: "Success", description: "Funds added to wallet." });
      setTopUpAmount(0);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add funds", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold mb-2">Wallet</h1>
        <p className="text-muted-foreground">Manage your pledges and balance.</p>
      </header>

      <main className="px-4 space-y-6">
        {/* Balance Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-600 p-8 text-white shadow-xl shadow-primary/20"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <WalletIcon className="w-32 h-32 transform translate-x-8 -translate-y-8" />
          </div>
          
          <div className="relative z-10">
            <p className="text-blue-100 font-medium text-sm mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              ${user ? (user.balance / 100).toFixed(2) : "0.00"}
            </h2>
            
            <div className="flex items-center gap-2 text-xs text-blue-100 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Connected
            </div>
          </div>
        </motion.div>

        {/* Top Up Section */}
        <Card className="p-6 bg-card border-border/50 shadow-none">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Add Funds (Mock)
          </h3>
          <div className="space-y-4">
            <CurrencyInput
              value={topUpAmount}
              onValueChange={setTopUpAmount}
              className="bg-background border-border"
              placeholder="0.00"
            />
            <div className="flex gap-2 mb-2">
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  +${amt/100}
                </button>
              ))}
            </div>
            <Button 
              className="w-full h-12 font-semibold" 
              onClick={handleTopUp}
              disabled={addFunds.isPending || topUpAmount <= 0}
            >
              {addFunds.isPending ? <Loader2 className="animate-spin" /> : "Top Up Wallet"}
            </Button>
          </div>
        </Card>

        {/* Transactions (Mock) */}
        <div className="pt-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
            <History className="w-4 h-4" />
            Recent Activity
          </h3>
          <div className="space-y-3">
             {/* Static mocks for visuals */}
             <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/30">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                   <ArrowUpRight className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-sm font-medium">Refund: Morning Run</p>
                   <p className="text-xs text-muted-foreground">Today, 9:41 AM</p>
                 </div>
               </div>
               <span className="text-emerald-500 font-medium">+$5.00</span>
             </div>
             <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/30">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                   <WalletIcon className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-sm font-medium">Deposit</p>
                   <p className="text-xs text-muted-foreground">Yesterday, 5:20 PM</p>
                 </div>
               </div>
               <span className="text-foreground font-medium">+$20.00</span>
             </div>
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  );
}
