import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { TaskCard } from "@/components/TaskCard";
import { BottomNav } from "@/components/BottomNav";
import { RoleToggle } from "@/components/RoleToggle";
import { Loader2, Target, History } from "lucide-react";

export default function AdminHistory() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/admin/tasks"],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const res = await fetch("/api/admin/tasks", { headers });
      if (!res.ok) throw new Error("Failed to fetch admin tasks");
      return await res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeTasks = tasks?.filter((t: any) => ((t.status === "pending" || t.status === "failed" || t.status === 'submitted')&& new Date(t.deadline) > new Date)|| (t.status === 'submitted'&& new Date(t.deadline) < new Date)) || [];
  const completedTasks = tasks?.filter((t: any)=> (t.status === "completed")|| (t.status==="failed"&& new Date(t.deadline)<new Date)) || [];
  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="px-6 pt-8 pb-10 bg-gradient-to-br from-card to-background border-b border-border/50 relative overflow-hidden">
        <div className="absolute top-6 right-6 z-20">
          <RoleToggle />
        </div>
        <div className="relative z-10">
          <h1 className="text-sm font-medium text-muted-foreground mb-1 tracking-wider uppercase">Global Overview</h1>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground tracking-tight">System History</span>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Active All Users
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {activeTasks.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeTasks.map((task: any) => (
              <TaskCard key={task.id} task={task} isAdmin={true} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2 text-muted-foreground">
              <History className="w-5 h-5" />
              Completed All Users
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
              {completedTasks.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-80">
            {completedTasks.map((task: any) => (
              <TaskCard key={task.id} task={task} isAdmin={true} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
