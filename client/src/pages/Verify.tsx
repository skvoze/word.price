import { useSubmittedTasks, useCompleteTask, useFailTask } from "@/hooks/use-tasks";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Share2, CheckCircle2, XCircle, FileVideo, FileImage, FileWarning } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function Verify() {
  const { toast } = useToast();
  const { data: allSubmissions, isLoading } = useSubmittedTasks();
  const completeTask = useCompleteTask();
  const failTask = useFailTask();

  // Filter only tasks that are still in "submitted" status
  const pendingSubmissions = allSubmissions?.filter(t => t.status === "submitted") || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleApprove = async (taskId: number) => {
    try {
      await completeTask.mutateAsync(taskId);
      toast({
        title: "Approved!",
        description: "Task marked as completed. Funds returned to user.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (taskId: number) => {
  const reason = window.prompt("Укажите причину отклонения (её увидит пользователь):");
  if (reason === null) return;

  try {

    await failTask.mutateAsync({ id: taskId, reason }); 
    toast({
      title: "Rejected",
      description: "Причина сохранена, задача отклонена.",
    });
  } catch (error) {
    toast({
      title: "Error",
      variant: "destructive",
      description: "Не удалось отклонить задачу",
    });
  }
};

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="px-4 py-6 flex items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-xl font-bold">Verify Evidence</h1>
        {pendingSubmissions.length > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {pendingSubmissions.length} pending
          </span>
        )}
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {pendingSubmissions.length === 0 ? (
          <div className="bg-card/50 border border-border/50 rounded-2xl p-8 text-center border-dashed">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-foreground font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No evidence submissions to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(pendingSubmissions || []).map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 border-border/50">
                  <div className="space-y-4">
                    {/* Task Info */}
<div>
  <div className="flex items-start justify-between mb-2 gap-4">
    <div className="min-w-0 flex-1">
      <h3 className="text-lg font-bold text-foreground break-words leading-tight">
        {task.title}
      </h3>
      
    </div>
    <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-medium dark:text-yellow-400">
      Pending Review
    </span>
  </div>                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="mt-3 flex gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground"> Amount</p>
                          <p className="font-bold text-foreground">{(task.amount / 100).toFixed(2)} ₽</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Submitted</p>
                          <p className="font-bold text-foreground">
                            {task.createdAt ? formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Evidence Section */}
                    {task.evidenceUrl && (
                      <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground mb-3">Evidence Submitted:</p>
                        <div className="bg-background rounded-lg p-3 border border-border/50 overflow-hidden">
                         
                          {task.evidenceUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <div className="space-y-2">
                              
                               <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <FileImage className="w-3 h-3" /> Image Proof
                              </div>
                              <img 
                                src={task.evidenceUrl} 
                                alt="Task evidence" 
                                className="w-full max-h-96 object-contain rounded bg-black/5"
                              />
                              <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-7 text-[10px] uppercase font-bold text-primary"
                                 onClick={() => task.evidenceUrl && window.open(task.evidenceUrl, '_blank')}
                               >
                                 <Share2 className="w-3 h-3 mr-1" /> Оригинал
                               </Button>
                            </div>
                          ) : task.evidenceUrl.match(/\.(mp4|webm|mov|avi)$/i) ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <FileVideo className="w-3 h-3" /> Video Proof
                              </div>
                              <video 
                                src={task.evidenceUrl} 
                                controls 
                                playsInline
                                className="w-full max-h-96 rounded bg-black"
                              />
                              <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-7 text-[10px] uppercase font-bold text-primary"
                                 onClick={() => task.evidenceUrl && window.open(task.evidenceUrl, '_blank')}
                               >
                                 <Share2 className="w-3 h-3 mr-1" /> Оригинал
                               </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-4 text-center">
                              <FileWarning className="w-8 h-8 text-amber-500 mb-2" />
                              <p className="text-sm font-medium mb-3">External Evidence</p>
                              <a 
                                href={task.evidenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all text-xs"
                              >
                                {task.evidenceUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => handleApprove(task.id)}
                        disabled={completeTask.isPending || failTask.isPending}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {completeTask.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleReject(task.id)}
                        disabled={completeTask.isPending || failTask.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        {failTask.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
