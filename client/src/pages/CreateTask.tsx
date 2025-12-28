import { useState } from "react";
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
import { ArrowLeft, Loader2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

// Extend schema for local form validation if needed, mainly converting amount
const formSchema = insertTaskSchema.extend({
  amount: z.coerce.number().min(100, "Minimum pledge is $1.00"), // Min 100 cents
  deadline: z.coerce.date().min(new Date(), "Deadline must be in the future"),
});

export default function CreateTask() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useUser();
  const createTask = useCreateTask();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 500, // Default $5.00
      userId: user?.id || 0, // Will be overridden by backend or valid context
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    // Check balance
    if (user && user.balance < data.amount) {
      toast({
        title: "Insufficient Funds",
        description: "Please top up your wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Pass correct types
      await createTask.mutateAsync({
        ...data,
        deadline: new Date(data.deadline).toISOString(), // Ensure ISO string
        userId: user!.id,
      } as any); // Cast to any to bypass strict Zod type mismatch with string dates if occurring
      
      toast({
        title: "Pledge Created!",
        description: "Good luck! Money is locked until completion.",
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 py-6 flex items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">New Pledge</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">What do you want to achieve?</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Run 5km, Read a chapter..." className="h-12 text-lg bg-card border-border" {...field} />
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
                  <FormLabel className="text-base font-semibold">Pledge Amount</FormLabel>
                  <FormDescription className="text-xs mb-2">
                    You'll get this back only if you complete the task.
                  </FormDescription>
                  <FormControl>
                    <CurrencyInput 
                      value={field.value} 
                      onValueChange={field.onChange}
                      className="bg-card border-border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Deadline</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="datetime-local" 
                        className="h-12 bg-card border-border pl-10" 
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add details about your evidence..." 
                      className="min-h-[100px] resize-none bg-card border-border"
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
                  Creating Pledge...
                </>
              ) : (
                "Lock Pledge"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNav />
    </div>
  );
}
