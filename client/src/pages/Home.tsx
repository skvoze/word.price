import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useTasks } from "@/hooks/use-tasks";
import { TaskCard } from "@/components/TaskCard";
import { BottomNav } from "@/components/BottomNav";
import { RoleToggle } from "@/components/RoleToggle";
import { Loader2, TrendingUp, ShieldCheck, Target } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingUser } = useUser();
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();

  // Redirect admin to verify page
  if (!isLoadingUser && user?.role === "admin") {
    setLocation("/verify");
    return null;
  }

  if (isLoadingUser || isLoadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeTasks = tasks?.filter(t => t.status === "pending" || t.status === "submitted") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed" || t.status === "failed") || [];

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header / Wallet Summary */}
      <header className="px-6 pt-8 pb-10 bg-gradient-to-br from-card to-background border-b border-border/50 relative overflow-hidden">
        <div className="absolute top-6 right-6 z-20">
          <RoleToggle />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-sm font-medium text-muted-foreground mb-1 tracking-wider uppercase">Current Balance</h1>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground tracking-tight">
              ${user ? (user.balance / 100).toFixed(2) : "0.00"}
            </span>
            <span className="text-sm font-medium text-primary">USD</span>
          </div>
          
          <div className="mt-6 flex gap-4 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 rounded-lg backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Secure Pledge
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              Success Rate: 94%
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-8">
        {/* Active Tasks Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Active Goals
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {activeTasks.length}
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="bg-card/50 border border-border/50 rounded-2xl p-8 text-center border-dashed">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">No active goals</p>
              <p className="text-sm text-muted-foreground mt-1">Start a new pledge to stop procrastinating.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>

        {/* History Section */}
        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 px-1 text-muted-foreground">History</h2>
            <div className="grid gap-4 sm:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
