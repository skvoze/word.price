import { format } from "date-fns";
import { type Task } from "@shared/schema";
import { Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Coins, User } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { enUS } from "date-fns/locale"; 

type TaskWithUser = Task & { userAddress?: string };

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "In Progress" 
  },
  submitted: {
    icon: AlertCircle,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Reviewing" 
  },
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "Completed" 
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Failed" 
  }
};

export function TaskCard({ task, isAdmin = false }: { task: TaskWithUser, isAdmin?: boolean }) {
  const isExpired = new Date(task.deadline) < new Date();
  const isRejected = task.status === "failed" && !isExpired;
  const configKey = (task.status as keyof typeof statusConfig) || "pending";
  const status = statusConfig[configKey];
  const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  const currentStatusLabel = isRejected ? "Rejected" : status.label;
  const StatusIcon = status.icon;

  return (
    <Link href={`/task/${task.id}`}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-black/20 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${status.bg} ${status.color} border ${status.border}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{String(currentStatusLabel)}</span>
          </div>
          <div className="flex items-center text-primary font-bold">
            <Coins className="w-4 h-4 mr-1.5 opacity-70" />
            {Number(task.amount / 100).toFixed(2)} USDC
          </div>
        </div>

        {isAdmin && task.userAddress && (
  <div className="flex items-center gap-1.5 mb-3 bg-secondary/50 w-fit px-2 py-0.5 rounded-lg border border-border/50">
    <User className="w-3 h-3 text-muted-foreground" />
    <span className="text-[10px] font-bold text-muted-foreground tracking-tighter">
      Wallet: {formatAddress(task.userAddress)}
    </span>
  </div>
)}

        <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">
          {task.title}
        </h3>
        
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground flex items-center">
      
            Until {format(new Date(task.deadline), "d MMM, HH:mm", { locale: enUS })}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </div>
      </motion.div>
    </Link>
  );
}