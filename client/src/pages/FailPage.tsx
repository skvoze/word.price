import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter"; 

export default function FailPage() {
  const [seconds, setSeconds] = useState(10);
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
        <div className="bg-card rounded-[3.5rem] p-10 border border-red-500/20 shadow-2xl relative overflow-hidden">
          {/* Прогресс-бар сверху (красный) */}
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="absolute top-0 left-0 h-1 bg-red-500"
          />

          <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-6">
            <X className="w-12 h-12 text-red-500" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
              Ошибка
            </h1>
            <p className="text-zinc-400 text-sm font-medium px-4">
              Платеж не прошел. Попробуй еще раз или используй СБП.
            </p>
          </div>

          <div className="mt-8 p-4 bg-secondary/30 rounded-2xl border border-white/5">
            <p className="text-[10px] uppercase font-black tracking-widest text-red-500/60 mb-1">
              Вернемся назад через
            </p>
            <span className="text-3xl font-black text-white">{seconds}с</span>
          </div>

          <Button 
            onClick={() => setLocation("/wallet")}
            className="w-full h-16 mt-8 rounded-2xl text-lg font-black italic uppercase bg-secondary hover:bg-secondary/80 gap-3 border border-white/5"
          >
            <RefreshCcw className="w-5 h-5" />
            Попробовать снова
          </Button>
          <div className="mt-4">
            <a 
              href="https://t.me/cena_slova_help" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 hover:text-white transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span className="w-1 h-1 rounded-full bg-red-500/50" />
              Проблемы с оплатой? Пиши нам
              <span className="w-1 h-1 rounded-full bg-red-500/50" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}