import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter"; 

export default function SuccessPage() {
  const [seconds, setSeconds] = useState(20);
  const [, setLocation] = useLocation();
  

  useEffect(() => {
    if (seconds <= 0) {
      setLocation("/wallet");
      return;
    }
    const timer = setInterval(() => setSeconds((v) => v - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-8"
      >
        <div className="bg-card rounded-[3.5rem] p-10 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
          {/* Прогресс-бар сверху */}
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 20, ease: "linear" }}
            className="absolute top-0 left-0 h-1 bg-emerald-500"
          />

          <div className="mx-auto w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mb-6">
            <Check className="w-12 h-12 text-emerald-500" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
              Оплачено
            </h1>
            <p className="text-zinc-400 text-sm font-medium">
              Баланс обновится в течение пары минут.
            </p>
          </div>

          <div className="mt-8 p-4 bg-secondary/30 rounded-2xl border border-white/5">
            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500/60 mb-1">
              Авто-возврат через
            </p>
            <span className="text-3xl font-black text-white">{seconds}с</span>
          </div>

          <Button 
            onClick={() => setLocation("/wallet")}
            className="w-full h-16 mt-8 rounded-2xl text-lg font-black italic uppercase bg-primary hover:bg-primary/90 gap-3"
          >
            <WalletIcon className="w-5 h-5" />
            В кошелек
          </Button>
        </div>
      </motion.div>
    </div>
  );
}