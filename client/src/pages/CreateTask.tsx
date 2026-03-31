import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { useCreateTask } from "@/hooks/use-tasks";
import { useUser } from "@/hooks/use-user";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useReadContract, useAccount } from "wagmi";
import { VAULT_ADDRESS, VAULT_ABI } from "../../../shared/contracts";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Calendar as CalendarIcon, Wallet } from "lucide-react";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { enUS } from "date-fns/locale"; 
import { useQueryClient } from "@tanstack/react-query";

const formSchema = insertTaskSchema.extend({
  title: z.string().min(3, "Min 3 characters").max(100, "Max 100 characters"),
  description: z.string().max(500, "Max 500 characters").optional().or(z.literal('')),
amount: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 1; 
  }, "Minimum stake is 1 USDC"),deadline: z.coerce.date({
  required_error: "Deadline is required",
  invalid_type_error: "That's not a valid date",
}).refine((date) => {
  return date > new Date();
}, "Deadline must be in the future")
  ,});

export default function CreateTask() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const createTask = useCreateTask();
  const { data: user } = useUser();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState("23:00");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      userAddress: address || "", 
    },
  });
  const { data: vaultBalanceRaw, isLoading: isBalanceLoading,isError: isBalanceError } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'availableBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 3000
    }
  });
const dbBalance = user?.balance ? Number(user.balance) / 1_000_000 : 0;
const blockchainBalance = (vaultBalanceRaw !== undefined && vaultBalanceRaw !== null)
  ? Number(vaultBalanceRaw) / 1_000_000 
  : dbBalance;
  useEffect(() => {
    if (address) {
      form.setValue("userAddress", address.toLowerCase());
    }
  }, [address, form]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      if (!address) throw new Error("Please connect your wallet first");

      const taskAmountUnits = Number(data.amount);
      
      if (blockchainBalance < taskAmountUnits) {
        throw new Error(`Insufficient balance in Vault. Real balance: ${blockchainBalance} USDC`);
      }

      const taskAmountForDb = Math.round(taskAmountUnits * 100); 

      await createTask.mutateAsync({
        title: data.title.trim(),
        description: data.description?.trim() || "",
        amount: taskAmountForDb, 
        deadline: data.deadline, 
        userAddress: address.toLowerCase(),
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ 
        queryKey: ['wagmi', 'readContract', VAULT_ADDRESS] 
      });
      
      toast({
        title: "Challenge Created!",
        description: "Your USDC stake is safely locked.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    }
  }
  const getValidTimeForDate = (date: Date) => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    const currentHour = now.getHours();
    const [selectedH, selectedM] = selectedTime.split(':').map(Number);
    
    if (selectedH <= currentHour) {
      const nextValidHour = Math.min(currentHour + 1, 23);
      const newTime = `${nextValidHour.toString().padStart(2, '0')}:00`;
      setSelectedTime(newTime);
      return { h: nextValidHour, m: 0, timeStr: newTime };
    }
  }
  
  const [h, m] = selectedTime.split(':').map(Number);
  return { h, m, timeStr: selectedTime };
};

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 py-6 flex items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">New Challenge</h1>
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
                    <FormLabel className="text-base font-semibold">What do you want to achieve?</FormLabel>
                    <span className={cn(
                      "text-[10px] font-medium mb-1",
                      (field.value?.length || 0) >= 90 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {field.value?.length || 0}/100
                    </span>
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Run 5km..." 
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
                  <FormLabel className="text-base font-semibold">Stake Amount (USDC)</FormLabel>
                  <FormDescription className="text-xs mb-2">
                    This money will be deducted from your app balance.
                  </FormDescription>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input 
                          type="number"
                          step="0.01"
                          {...field}
                          className="no-spinner h-12 text-lg bg-card border-border focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 transition-all outline-none"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-3 font-bold text-primary">USDC</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        Available: {isBalanceLoading ? "..." : blockchainBalance.toFixed(2)} USDC
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
                  <FormLabel className="text-base font-semibold">When is the deadline?</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div
                          className={cn(
                            "h-12 w-full flex items-center justify-start bg-card border rounded-lg px-4 text-base cursor-pointer transition-all outline-none",
                            isCalendarOpen ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-border hover:border-primary/50",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-3 h-5 w-5 text-primary/70" />
                          {field.value ? format(field.value, "d MMMM, HH:mm", { locale: enUS }) : "Select date and time"}
                        </div>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-border bg-popover outline-none" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        locale={enUS}
                        onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(date);
                          const { h, m } = getValidTimeForDate(newDate);
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
                      <div className="flex items-center justify-center gap-4 p-4 border-t border-border bg-muted/20">
                        <select 
                          value={selectedTime.split(':')[0]} 
                          onChange={(e) => {
                          const h = e.target.value;
                          const m = selectedTime.split(':')[1];
                          const now = new Date();
                          const isToday = field.value && new Date(field.value).toDateString() === now.toDateString();
                          if (isToday && parseInt(h) < now.getHours()) return; 
                          setSelectedTime(`${h}:${m}`);
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
                            const isToday = field.value && new Date(field.value).toDateString() === new Date().toDateString();
                            const isPastHour = isToday && i < new Date().getHours();                                             
                            return (
                              <option key={val} value={val} disabled={isPastHour}>
                                {val}
                              </option>
                            );
                          })}
                        </select>
                        <span className="text-xl font-bold">:</span>
                        <select 
                          value={selectedTime.split(':')[1]} 
                          onChange={(e) => {
                            const m = e.target.value;
                            const h = selectedTime.split(':')[0];
                            setSelectedTime(`${h}:${m}`);
                            if (field.value) {
                              const d = new Date(field.value);
                              d.setMinutes(parseInt(m));
                              field.onChange(d);
                            }
                          }}
                          className="bg-background border border-border rounded-md p-1 px-2 text-lg font-bold outline-none focus:border-primary transition-all appearance-none"
                        >
                          {["00", "15", "30", "45"].map((m) => (
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
                    <FormLabel className="text-base font-semibold">Description (Optional)</FormLabel>
                    <span className={cn(
                      "text-[10px] font-medium mb-1",
                      (field.value?.length || 0) >= 450 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {field.value?.length || 0}/500
                    </span>
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="How will you prove it?" 
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
               className="w-full h-14 text-lg font-bold" 
               disabled={createTask.isPending || !address || isBalanceLoading}
            >
               {isBalanceLoading ? "Loading Balance..." : createTask.isPending ? "Creating..." : "Create Challenge"}
            </Button>
          </form>
        </Form>
      </main>

    </div>
  );
}