import { useState,useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type InsertTask } from "@shared/schema";
import { useCreateTask } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-user";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Calendar as CalendarIcon} from "lucide-react";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ru } from "date-fns/locale";


const formSchema = insertTaskSchema.extend({
  title: z.string().min(3, "Минимум 3 символа").max(100, "Максимум 100 символов"),
  description: z.string().max(500, "Максимум 500 символов").optional().or(z.literal('')),
  amount: z.coerce.number().min(100, "Минимальная сумма 100₽"), 
  deadline: z.coerce.date().min(new Date(), "Дэдлайн должен быть в будущем"),
});

export default function CreateTask() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useUser();
  const createTask = useCreateTask();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState("23:00");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      userId: user?.id || 0, 
    },
    
  });
useEffect(() => {
    if (user?.id) {
      form.setValue("userId", user.id);
    }
  }, [user?.id, form]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const cleanData = {
    ...data,
    title: data.title.trim(),
    description: data.description?.trim() || "",
  };
  if (user && user.balance < cleanData.amount) {
      toast({
        title: "Недостаточно средств",
        description: "Пожалуйста, пополните кошелек.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTask.mutateAsync({
        ...cleanData,
        deadline: new Date(cleanData.deadline).toISOString(),
        userId: user!.id,
      } as any);
      
      toast({
        title: "Задача создана!",
        description: "Удачи! Деньги заморожены до выполнения.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать задачу",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 py-6 flex items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Новая Задача</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <div className="flex justify-between items-end">
        <FormLabel className="text-base font-semibold">Чего вы хотите достичь?</FormLabel>
        <span className={cn(
          "text-[10px] font-medium mb-1",
          (field.value?.length || 0) >= 90 ? "text-destructive" : "text-muted-foreground"
        )}>
          {field.value?.length || 0}/100
        </span>
      </div>
      <FormControl>
        <Input 
          placeholder="Например пробежать 5 км..." 
          className="h-12 text-lg bg-card border-border focus-visible:ring-0 focus:border-primary focus-visible:ring-offset-0 transition-all" 
          maxLength={100}
          {...field} 
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

<FormField
    control={form.control}
    name="amount"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-base font-semibold">Сумма</FormLabel>
        <FormDescription className="text-xs mb-2">
          Вы получите эти деньги назад только при выполнении задачи.
        </FormDescription>
        <FormControl>
          <div className="space-y-2">
<CurrencyInput
  value={field.value}
  onValueChange={(val) => field.onChange(val)}
  className="h-12 text-lg bg-card border-border focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 transition-all outline-none"
  placeholder="0"
/>           
            {/* Маленькая подсказка о доступном балансе вместо оранжевого текста */}
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Доступно: {((user?.balance ?? 0) / 100).toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
<FormField
  control={form.control}
  name="deadline"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel className="text-base font-semibold">Когда дедлайн?</FormLabel>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <div
              className={cn(
                "h-12 w-full flex items-center justify-start bg-card border rounded-lg px-4 text-base cursor-pointer transition-all outline-none",
                // Теперь рамка будет синей, если календарь открыт
                isCalendarOpen ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-border hover:border-primary/50",
                !field.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-3 h-5 w-5 text-primary/70" />
              {field.value ? format(field.value, "d MMMM, HH:mm", { locale: ru }) : "Выбрать дату и время"}
            </div>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-border bg-popover outline-none" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            locale={ru}
            onSelect={(date) => {
              if (date) {
                const newDate = new Date(date);
                // Безопасное получение времени
                const timeParts = selectedTime?.split(':') || ["23", "00"];
                const h = parseInt(timeParts[0]);
                const m = parseInt(timeParts[1]);
                newDate.setHours(h, m, 0, 0);
                field.onChange(newDate);
              }
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            modifiersStyles={{
              selected: { 
                backgroundColor: 'hsl(var(--primary))', 
                color: 'white' 
              },
              today: { 
                border: '1px solid hsl(var(--primary))', 
                backgroundColor: 'transparent', 
                color: 'inherit' 
              }
            }}
          />
          {/* Селекторы времени */}
          <div className="flex items-center justify-center gap-4 p-4 border-t border-border bg-muted/20">
            <select 
              value={selectedTime.split(':')[0]} 
              onChange={(e) => {
                const h = e.target.value;
                const m = selectedTime.split(':')[1];
                const newTime = `${h}:${m}`;
                setSelectedTime(newTime);
                if (field.value) {
                  const d = new Date(field.value);
                  d.setHours(parseInt(h));
                  field.onChange(d);
                }
              }}
              className="bg-background border border-border rounded-md p-1 px-2 text-lg font-bold outline-none focus:border-primary transition-all appearance-none"
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const val = i.toString().padStart(2, '0');
                return <option key={val} value={val}>{val}</option>;
              })}
            </select>
            <span className="text-xl font-bold">:</span>
            <select 
              value={selectedTime.split(':')[1]} 
              onChange={(e) => {
                const m = e.target.value;
                const h = selectedTime.split(':')[0];
                const newTime = `${h}:${m}`;
                setSelectedTime(newTime);
                if (field.value) {
                  const d = new Date(field.value);
                  d.setMinutes(parseInt(m));
                  field.onChange(d);
                }
              }}
              className="bg-background border border-border rounded-md p-1 px-2 text-lg font-bold outline-none focus:border-primary transition-all appearance-none"
            >
              {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
            <FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <div className="flex justify-between items-end">
        <FormLabel className="text-base font-semibold">Описание (Не обязательно)</FormLabel>
        <span className={cn(
          "text-[10px] font-medium mb-1",
          (field.value?.length || 0) >= 450 ? "text-destructive" : "text-muted-foreground"
        )}>
          {field.value?.length || 0}/500
        </span>
      </div>
      <FormControl>
        <Textarea 
  placeholder="Например как будете подтверждать выполнение задачи..." 
  className="min-h-[100px] resize-none bg-card border-border text-base focus-visible:ring-0 focus:border-primary focus-visible:ring-offset-0 transition-all"
  maxLength={500}
  {...field}
  value={field.value || ""}
/>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20" 
              disabled={createTask.isPending}
            >
              {createTask.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Создание Задачи...
                </>
              ) : (
                "Заморозить средства"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNav />
    </div>
  );
}
