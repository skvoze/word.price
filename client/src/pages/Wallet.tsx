import { useState,useRef,useMemo,useEffect } from "react";
import { useUser, useAddFunds, useTransactions, useWithdraw} from "@/hooks/use-user";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Loader2, CreditCard, History, Wallet as WalletIcon, Clock, Check, ArrowUpRight,X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion,AnimatePresence} from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";



const DEFAULT_BRAND_COLOR = "#94a3b8";
const BrandLogo = ({ info }: { info: any }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    setHasError(false);
  }, [info?.brandAlias, info?.brandLogo]);

  if (!info?.brandLogo) {
    return <CreditCard className="h-5 w-5 text-muted-foreground/20" />;
  }

  if (hasError) {
    return (
      <span className="text-[10px] font-black text-primary/50 uppercase">
        {info.brandAlias}
      </span>
    );
  }

  return (
    <img 
      src={info.brandLogo} 
      alt={info.brandAlias} 
      className={cn(
        "w-8 h-8 object-contain transition-all duration-300",
        info.brandAlias === 'mir' ? "scale-110" : "scale-100"
      )}
      onError={() => setHasError(true)}
    />
  );
};

const PRESET_AMOUNTS = [
  { label: "500 ₽", value: 50000 },
  { label: "1000 ₽", value: 100000 },
  { label: "2000 ₽", value: 200000 },
  { label: "5000 ₽", value: 500000 },
];
export default function Wallet() {
  const { data: user, isLoading } = useUser();
  const { data: transactions, isLoading: isTransLoading } = useTransactions();
  const addFunds = useAddFunds();
  const withdrawMutation = useWithdraw();
  const { toast } = useToast();
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [agreed, setAgreed] = useState(false);
 const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
const [withdrawAmount, setWithdrawAmount] = useState(0);
const [cardNumber, setCardNumber] = useState("");
const [withdrawNote, setWithdrawNote] = useState("");
const [isRedirecting, setIsRedirecting] = useState(false);
const [isTopUpConfirmOpen, setIsTopUpConfirmOpen] = useState(false);
const [expandedTx, setExpandedTx] = useState<number | null>(null);
const activeInputStyles = cn(
  "h-16 transition-all duration-300 rounded-2xl text-center bg-secondary/40",
  "border-2 border-transparent", 
  "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0", // Полная очистка
  "focus:border-primary focus:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
  "placeholder:text-zinc-600 font-bold"
);

const stats = useMemo(() => {
  if (!transactions) return { totalIn: 0, totalOut: 0 };
  return transactions.reduce((acc, tx) => {
    if (tx.type === 'topup' && tx.status === 'completed') {
      acc.totalIn += tx.amount;
    }

    else if (tx.type === 'withdraw' && tx.status === 'completed') {
      acc.totalOut += Math.abs(tx.amount);
    }
    return acc;
  }, { totalIn: 0, totalOut: 0 });
}, [transactions]);
const [filter, setFilter] = useState<'all' | 'topup' | 'withdraw'>('all');
const filteredTransactions = useMemo(() => {
  if (!transactions) return [];
  const now = new Date().getTime();
  const ONE_HOUR = 60 * 60 * 1000;
  const sorted = [...transactions].filter(tx => {
      if (tx.status === 'pending' && tx.createdAt) {
        const txTime = new Date(tx.createdAt).getTime();
        if (now - txTime > ONE_HOUR) return false; 
      }
      return true;
    }).sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
  if (filter === 'all') return sorted;
  return sorted.filter(tx => tx.type === filter);
}, [transactions, filter]);

const cardInfo = useMemo(() => {
  const clean = cardNumber.replace(/\s/g, "");
  if (clean.length === 0) return null;
  const checkLuhn = (num: string) => {
    let sum = 0;
    for (let i = 0; i < num.length; i++) {
      let intVal = parseInt(num.substr(i, 1), 10);
      if (i % 2 === num.length % 2) {
        intVal *= 2;
        if (intVal > 9) intVal -= 9;
      }
      sum += intVal;
    }
    return sum % 10 === 0;
  };

 const getBrand = (num: string) => {
  if (num.startsWith('2')) return { 
    alias: 'mir', 
    logo: 'https://img.icons8.com/color/48/mir.png' 
  };
  if (num.startsWith('4')) return { 
    alias: 'visa', 
    logo: 'https://img.icons8.com/color/48/visa.png' 
  };

  if (num.startsWith('5')) return { 
    alias: 'mastercard', 
    logo: 'https://img.icons8.com/color/48/mastercard.png' 
  };
  return null;
};

  const brand = getBrand(clean);

  return {
    isValid: clean.length === 16 ? checkLuhn(clean) : true,
    brandLogo: brand?.logo || null,
    brandAlias: brand?.alias || null,
    color: DEFAULT_BRAND_COLOR // оставляем нейтральный цвет
  };
}, [cardNumber]);
const formatDate = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };
const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").substring(0, 16);
    if (value.length > 0) {
    const firstDigit = value[0];
    const allowed = ["2", "4", "5"];
    if (!allowed.includes(firstDigit)) {

      toast({ 
        title: "Карта не поддерживается", 
        description: "Поддерживаются только карты МИР, Visa и Mastercard", 
        variant: "destructive" 
      });
      return; 
    }
    }
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };
  const handlePresetClick = (amount: number) => {
    setTopUpAmount(amount);
    setTimeout(() => {
    if (inputRef.current) {
      const input = inputRef.current;
      input.focus();
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }
  }, 0);
  };

  const onTopUpClick = () => {
  if (topUpAmount < 10000) {
    toast({ 
      title: "Минимальная сумма", 
      description: "Минимум для пополнения 100₽", 
      variant: "destructive" 
    });
    return;
  }
  setIsTopUpConfirmOpen(true);
};
const handleFinalTopUp = async () => {
  setIsRedirecting(true); 
  
  try {
    const result = await addFunds.mutateAsync({ 
      amount: topUpAmount, 
      acceptedTerms: agreed 
    });
    
    toast({ 
      title: "Готово", 
      description: "Переходим к оплате..." 
    });
    if (result && result.paymentUrl) {
       window.location.href = result.paymentUrl;
    } else {
       throw new Error("Не удалось получить ссылку на оплату");
    }
    
  } catch (error: any) {
    toast({ 
      title: "Ошибка", 
      description: error.message || "Не удалось создать платеж",
      variant: "destructive" 
    });
    setIsRedirecting(false); // Возвращаем кнопку в рабочее состояние только при ошибке
  }
};
const handleWithdrawSubmit = async () => {
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  if (cleanCardNumber.length !== 16 || (cardInfo && !cardInfo.isValid)) {
    toast({ title: "Ошибка", description: "Неверный номер карты", variant: "destructive" });
    return;
  }
  if (withdrawAmount < 10000) {
    toast({ 
      title: "Минимальная сумма", 
      description: "Вывод возможен от 100 ₽", 
      variant: "destructive" 
    });
    return;
  }
  try {
    await withdrawMutation.mutateAsync({ 
  amount: withdrawAmount, 
  description: `Вывод на карту ****${cleanCardNumber.slice(-4)}`,
  metadata: { 
    cardNumber: cleanCardNumber,
    cardBrand: cardInfo?.brandAlias || 'unknown',
    userNote: withdrawNote
  }
});

    toast({ title: "Успех", description: "Запрос на вывод отправлен" });
    setIsWithdrawOpen(false);
    setWithdrawAmount(0);
    setCardNumber("");
    setWithdrawNote("");
  } catch (error: any) {
    toast({ title: "Ошибка сервера", description: error.message, variant: "destructive" });
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
        <h1 className="text-3xl font-bold mb-2 tracking-tight">КОШЕЛЕК</h1>
        
      </header>

      <main className="px-4 space-y-6 max-w-lg mx-auto">
        {/* Balance Card */}
<motion.div 
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-primary to-indigo-700 p-8 text-white shadow-2xl shadow-primary/30"
>
  <div className="relative z-10 flex flex-col">
    <div className="flex justify-between items-start mb-2">
      <p className="text-blue-100/80 font-medium text-sm uppercase tracking-wider">
        Доступный Баланс
      </p>
      <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
        <WalletIcon className="w-6 h-6 text-white" />
      </div>
    </div>

    {/* Основной контент: Сумма */}
    <h2 className="text-5xl font-bold tracking-tighter mb-6">
  {user ? (user.balance / 100).toLocaleString('ru-RU') : "0"} ₽
    </h2>

  
    <div className="flex items-center gap-4">
      <Button 
        variant="secondary" 
        className="rounded-2xl bg-white text-primary hover:bg-blue-50 border-none h-11 px-8 font-bold transition-transform active:scale-95 shadow-lg shadow-black/10"
        onClick={() => setIsWithdrawOpen(true)} 
      >
        Вывести
      </Button>
    </div>
  </div>
</motion.div>

        {/* Top Up Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Пополнить
            </h3>
          </div>

          <Card className="p-6 bg-card border-border/50 shadow-sm rounded-3xl">
      <div className="space-y-6">
        {/* Preset Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt.value}
              onClick={() => handlePresetClick(amt.value)}
              className={cn(
                "py-3 text-sm font-bold rounded-2xl transition-all border-2",
                topUpAmount === amt.value 
                  ? "bg-primary/10 border-primary text-primary" 
                  : "bg-secondary/50 border-transparent"
              )}
            >
              {amt.label}
            </button>
          ))}
        </div>
              <div className="space-y-2">
  <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-widest">
    Своя Сумма
  </label>
  
  <div className="relative flex items-center justify-center">
    <div className="absolute left-7 pointer-events-none z-10">
      <span className="text-primary text-3xl font-black"></span>
    </div>

    <CurrencyInput
      value={topUpAmount}
      onValueChange={setTopUpAmount}
      ref={inputRef}
      prefix="" 
      className={cn(
        activeInputStyles,
        "w-full px-0" 
      )}
      placeholder="0"
    />
  </div>
</div>
              
             <div className="flex items-start space-x-3 px-1 py-2">
              <Checkbox 
                id="terms-wallet" 
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="mt-1 border-white/20 data-[state=checked]:bg-primary"
              />
              <label 
                htmlFor="terms-wallet" 
                className="text-[11px] leading-tight text-zinc-400 font-medium cursor-pointer select-none"
              >
                Я ознакомлен и согласен с{" "}
               <Dialog>
      <DialogTrigger className="text-primary underline">соглашением</DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-[2rem]">
        <DialogHeader><DialogTitle>Пользовательское соглашение</DialogTitle></DialogHeader>
        <Terms />
      </DialogContent>
    </Dialog>
    {", "}
    <Dialog>
      <DialogTrigger className="text-primary underline">приватностью</DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-[2rem]">
        <DialogHeader><DialogTitle>Политика конфиденциальности</DialogTitle></DialogHeader>
        <Privacy />
      </DialogContent>
    </Dialog>
    {" и "}
    <Dialog>
      <DialogTrigger className="text-primary underline">правилами возврата</DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-[2rem]">
        <DialogHeader><DialogTitle>Политика возврата средств</DialogTitle></DialogHeader>
        <Refund />
      </DialogContent>
    </Dialog>
                . Вносимая сумма является предоплатой за услуги мониторинга.
              </label>
            </div>

            <div className="space-y-4">
              <Button 
                className="w-full h-14 text-lg font-black uppercase bg-gradient-to-r from-blue-600 to-primary hover:opacity-90 text-white rounded-2xl gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95"
                onClick={onTopUpClick}
                disabled={topUpAmount <= 0 || !agreed}
              >
                <CreditCard className="w-6 h-6 mb-1" />
                 <span className="text-sm sm:text-base font-bold text-center">
                  Активировать мониторинг
                </span>         
              </Button>
            </div>
          </div>
        </Card>
      </div>

        {/* History Section */}
        <div className="space-y-4 pt-2">
  <div className="flex items-center justify-between px-2">
    <h3 className="font-bold text-lg flex items-center gap-2">
      <History className="w-5 h-5 text-muted-foreground" />
      История операций
    </h3>
  </div>
<div className="grid grid-cols-2 gap-4 mb-6">
  <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-4 text-center">
    <p className="text-[10px] uppercase font-black text-primary/60 mb-1 tracking-widest">Внесено</p>
    <p className="text-xl font-bold text-primary">
      {(stats.totalIn / 100).toLocaleString('ru-RU')} ₽
    </p>
  </div>
  <div className="bg-zinc-500/5 border border-zinc-500/10 rounded-[2rem] p-4 text-center">
    <p className="text-[10px] uppercase font-black text-zinc-500 mb-1 tracking-widest">Выведено</p>
    <p className="text-xl font-bold text-zinc-600">
      {(stats.totalOut * 0.95 / 100).toLocaleString('ru-RU')} ₽
    </p>
  </div>
</div>
  <div className="flex gap-2 px-2 overflow-x-auto no-scrollbar pb-1">
    {[
      { id: 'all', label: 'Все' },
      { id: 'topup', label: 'Пополнения' },
      { id: 'withdraw', label: 'Выводы' }
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => setFilter(tab.id as any)}
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
          filter === tab.id 
            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" 
            : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>

  <div className="space-y-3">
    {isTransLoading ? (
      <div className="flex justify-center py-8"><Loader2 className="animate-spin opacity-20" /></div>
    ) : filteredTransactions.length === 0 ? (
      <div className="text-center py-12 bg-secondary/20 rounded-[2rem] border border-dashed border-border/50">
         <p className="text-muted-foreground text-sm italic">
           {filter === 'all' ? "Операций пока нет" : "В этой категории пока пусто"}
         </p>
      </div>
    ) : (filteredTransactions.map((tx) => {
  const isAmount = tx.type === "task_amount";
  const isPositive = tx.amount > 0;
  const isPending = tx.status === "pending";
  const isRejected = tx.status === "rejected";
  const isExpanded = expandedTx === tx.id;

  return (
    <motion.div 
      key={tx.id} 
      layout
      onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
      className={cn(
        "group overflow-hidden rounded-[2rem] bg-card border border-border/40 transition-all cursor-pointer",
        isExpanded ? "border-primary/40 ring-1 ring-primary/10 shadow-lg" : "hover:border-primary/20"
      )}
    >
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
            isPending ? "bg-amber-500/10 text-amber-500" :
          isRejected ? "bg-red-500/10 text-red-500" :
          isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
          )}>
{isPending ? (
            <Clock className="w-5 h-5 animate-pulse" /> // Часики мигают, пока в обработке
          ) : isRejected ? (
            <X className="w-5 h-5" />
          ) : isPositive ? (
            <Check className="w-5 h-5" />
          ) : (
            <ArrowUpRight className="w-5 h-5 rotate-45" />
          )}          </div>
          
          <div className="min-w-0 flex-1"> 
            <p className="text-sm font-bold text-foreground leading-tight truncate">
              {tx.type === 'withdraw' ? "Вывод на карту" : (tx.description || "Операция")}
            </p>
            <p className={cn(
              "text-[9px] uppercase font-black tracking-wider mt-0.5",
              isPending ? "text-amber-500" : 
            tx.status === "completed" ? "text-emerald-500" : "text-red-500"
            )}>
              {isPending && "• В обработке"}
            {tx.status === "completed" && "• Выполнено"}
            {isRejected && "• Отклонено"}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className={cn("font-black text-sm", isPositive ? "text-emerald-500" : "text-foreground")}>
            {isPositive ? "+" : "-"}{(Math.abs(tx.amount) / 100).toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-[9px] text-muted-foreground font-bold mt-0.5">
            {tx.createdAt ? formatDate(tx.createdAt) : "Сегодня"}
          </p>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-border/20 bg-secondary/10"
          >
            <div className="pt-3 space-y-2">
              <div className="space-y-2">
  <div>
    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">
      Детали операции
    </span>
    <p className="text-xs font-medium text-foreground leading-relaxed">
      {tx.description || (tx.type === 'topup' ? "Пополнение баланса" : "Операция в сервисе")}
    </p>
  </div>
  {tx.status === "rejected" && (
    <motion.div 
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }}
      className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20"
    >
      <span className="text-[9px] font-black uppercase text-red-500 tracking-widest block mb-1">
        Причина отказа:
      </span>
      <p className="text-xs font-bold text-red-600 leading-tight">

        {tx.rejectionReason || "Неверные реквизиты или ограничения банка"}
      </p>
    </motion.div>
  )}
</div>
              
              <div className="flex justify-between items-end pt-2">
                <div>
                  <span className="font-bold text-foreground/60 uppercase text-[9px] block mb-1 tracking-widest">ID Транзакции:</span>
                  <code className="text-[10px] text-primary/70">#TX-{tx.id.toString().padStart(6, '0')}</code>
                </div>
                {tx.type === "withdraw" && tx.status !== "rejected" && (
                  <div className="text-right bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    <span className="text-[8px] font-black text-emerald-600 uppercase block leading-none mb-1">К зачислению:</span>
                    <span className="text-sm font-black text-emerald-600">
                      {(Math.abs(tx.amount) * 0.95 / 100).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}))}
  </div>
</div>
<div className="pt-12 pb-8 flex flex-col items-center gap-4 border-t border-border/10 mt-10">
  <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
    <Dialog onOpenChange={(open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
}}>
      <DialogTrigger className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-primary transition-colors">Оферта</DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-[2rem]"><Terms /></DialogContent>
    </Dialog>
    <Dialog onOpenChange={(open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
}}>
      <DialogTrigger className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-primary transition-colors">Возврат</DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-[2rem]"><Refund /></DialogContent>
    </Dialog>
    <Dialog onOpenChange={(open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
}}>
      <DialogTrigger className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-primary transition-colors">Конфиденциальность</DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-[2rem]"><Privacy /></DialogContent>
    </Dialog>
  </div>
  <p className="text-[8px] text-zinc-600 font-medium uppercase tracking-widest opacity-50 text-center">
    © 2026 ЦЕНА СЛОВА • ВСЕ ПРАВА ЗАЩИЩЕНЫ
  </p>
</div>
      </main>
      
      <BottomNav />
    <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
  <DialogContent className="rounded-[2.5rem] max-w-[90vw] sm:max-w-md border-none bg-card p-8">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold tracking-tight text-center">Вывод на карту</DialogTitle>
      <DialogDescription className="text-center">
        Деньги поступят на вашу карту в течение 24 часов после проверки.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <div className="relative">
          <Input 
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            value={cardNumber}
            onChange={handleCardChange}
            className={cn(activeInputStyles, "font-mono text-lg w-full pl-6 pr-14 py-6")}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
            <BrandLogo info={cardInfo} />
          </div>
        </div>
      </div>
      <div className="space-y-2">
  <div className="flex justify-between items-center px-2">
    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Сумма вывода</Label>
    <button 
      type="button"
      onClick={() => setWithdrawAmount(user?.balance || 0)}
      className="text-[10px] font-black text-primary hover:opacity-70 uppercase transition-opacity"
    >
     ВАШ БАЛАНС: {((user?.balance ?? 0) / 100).toLocaleString('ru-RU')} ₽
    </button>
  </div>
  
  <div className="relative flex items-center justify-center"> 

  <div className="absolute left-6 pointer-events-none z-10">
    <span className="text-primary text-2xl font-black"></span>
  </div>

  <CurrencyInput
    value={withdrawAmount}
    onValueChange={setWithdrawAmount}
    prefix="" 
    className={cn(
      activeInputStyles, 
      "w-full text-3xl font-black px-0" 
    )} 
    placeholder="0"
  />
  
</div>
{withdrawAmount >= 10000 && (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary/30 rounded-2xl p-4 border border-white/5 space-y-2"
    >
      <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
        <span>Сумма запроса:</span>
        <span>{(withdrawAmount / 100).toLocaleString()} ₽</span>
      </div>
      <div className="flex justify-between text-[10px] uppercase font-bold text-red-400/80 tracking-wider">
        <span>Сервисный сбор (5%):</span>
        <span>-{(withdrawAmount * 0.05 / 100).toLocaleString()} ₽</span>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-white/5">
        <span className="text-xs font-bold">К ПОЛУЧЕНИЮ:</span>
        <span className="text-xl font-black text-emerald-500">
          {(withdrawAmount * 0.95 / 100).toLocaleString()} ₽
        </span>
      </div>
    </motion.div>
  )}
<div className="space-y-2">
  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">
    Получатель / Банк (необязательно)
  </Label>
  <Input 
    placeholder="Напр: Т-Банк, Иван И."
    value={withdrawNote}
    onChange={(e) => setWithdrawNote(e.target.value)}
    className={cn(
      activeInputStyles, 
      "h-12 text-sm text-left px-6 py-2 bg-secondary/20 focus:bg-secondary/40"
    )}
  />
  <p className="text-[9px] text-muted-foreground italic px-2">
    Поможет нам быстрее проверить верность реквизитов
  </p>
</div>
  {user && withdrawAmount > user.balance && (
    <p className="text-[10px] text-destructive font-black uppercase text-center tracking-wider">
      Недостаточно средств
    </p>
  )}
</div>
      <div className="px-2">
    <p className="text-[10px] text-zinc-500 leading-tight">
      <span className="text-amber-500 font-bold uppercase mr-1">Внимание:</span> 
      Тщательно проверьте номер карты. Согласно п. 4. Оферты, перевод на неверно указанные реквизиты 
      не подлежит возврату. Вывод осуществляется до 24 часов.
    </p>
  </div>
      <Button 
        className="w-full h-14 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all active:scale-95"
        onClick={handleWithdrawSubmit}
        disabled={withdrawAmount < 0 || cardNumber.replace(/\s/g, "").length < 16 || withdrawMutation.isPending}
      >
        {withdrawMutation.isPending ? <Loader2 className="animate-spin" /> : "Подтвердить выплату"}
      </Button>
    </div>
  </DialogContent>
</Dialog>
      
     <Dialog open={isTopUpConfirmOpen} onOpenChange={(open) => !isRedirecting && setIsTopUpConfirmOpen(open)}>
  <DialogContent className="rounded-[2.5rem] max-w-[90vw] sm:max-w-md border-none bg-card p-8">
    {isRedirecting ? (
      <div className="py-12 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold italic uppercase tracking-tighter">Связь с банком...</h3>
          <p className="text-sm text-muted-foreground">Создаем защищенную сессию оплаты</p>
        </div>
      </div>
    ) : (
      <>
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-2">
            <CreditCard className="w-8 h-8 text-[#24A1DE]" />
          </div>
          <DialogTitle className="text-2xl font-black text-center uppercase tracking-tight text-white">Подтверждение</DialogTitle>
        </DialogHeader>

        <div className="py-4">
  <div className="bg-secondary/30 rounded-[2rem] p-6 border border-primary/10 flex flex-col items-center shadow-inner">
    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1 opacity-60">
      Сумма активации
    </span>
    <span className="text-4xl font-black text-primary">
      {(topUpAmount / 100).toLocaleString('ru-RU')} ₽
    </span>
    <p className="text-[9px] text-muted-foreground mt-3 font-medium text-center leading-tight px-2">
      Средства зачисляются на ваш баланс для обеспечения выполнения личных задач. 
      Система начнет мониторинг сразу после подтверждения.
    </p>
  </div>
</div>
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
          <div className="mt-1 bg-emerald-500 rounded-full p-1">
            <Check className="w-3 h-3 text-white" />
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-emerald-700/80">
            <strong>Совет:</strong> Выбирайте оплату через <span className="text-emerald-600 font-bold uppercase">СБП</span> на странице банка. Это самый быстрый способ без ввода данных карты.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            className="w-full h-14 rounded-2xl text-lg font-black italic uppercase bg-[#24A1DE] hover:bg-[#208bbf] shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            onClick={handleFinalTopUp}
          >
            Оплатить
          </Button>
          <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest w-full">
      <Dialog>
        <DialogTrigger className="hover:text-primary cursor-pointer hover:underline transition-all">Оферта</DialogTrigger>
        <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-[2rem]"><Terms /></DialogContent>
      </Dialog>
      <span className="opacity-30">•</span>
      <Dialog>
        <DialogTrigger className="hover:text-primary cursor-pointer hover:underline transition-all">Возврат</DialogTrigger>
        <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-[2rem]"><Refund /></DialogContent>
      </Dialog>
      <span className="opacity-30">•</span>
      <Dialog>
        <DialogTrigger className="hover:text-primary cursor-pointer hover:underline transition-all">Приватность</DialogTrigger>
        <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-[2rem]"><Privacy /></DialogContent>
      </Dialog>
    </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 opacity-30 grayscale scale-75">
               <img src="https://img.icons8.com/color/48/visa.png" className="h-6" alt="visa" />
               <img src="https://img.icons8.com/color/48/mastercard.png" className="h-6" alt="mc" />
               <img src="https://img.icons8.com/color/48/mir.png" className="h-6" alt="mir" />
               <img src="https://gist.githubusercontent.com/PonomareVlad/e901e3e50e7b1c1b80c2f05f7b968758/raw/1abed6186b7c7a69ea5f4d284d2e767a9245650b/SBP.svg" className="h-4 brightness-200" alt="sbp" />
            </div>
            <p className="text-[9px] text-center text-muted-foreground leading-tight px-6 uppercase font-bold tracking-widest opacity-40">
              Безопасность • 256-bit SSL
            </p>
          </div>
        </div>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
}