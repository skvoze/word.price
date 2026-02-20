import { motion } from "framer-motion";
import { X, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function FailPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-[3rem] p-10 border border-red-500/20 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center">
          <X className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            Ошибка
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed px-4">
            Платеж не прошел. Попробуй еще раз или выбери другой способ оплаты (СБП обычно работает стабильнее).
          </p>
        </div>

        <Link href="/wallet">
          <Button variant="secondary" className="w-full h-14 rounded-2xl text-lg font-black italic uppercase gap-3">
            <RefreshCcw className="w-5 h-5" />
            Попробовать снова
          </Button>
        </Link>
      </div>
    </div>
  );
}