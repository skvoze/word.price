import { useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useTask, useSubmitEvidence } from "@/hooks/use-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";
import { FileImage, FileVideo, FileWarning, ArrowLeft, Clock, Calendar, Coins, CheckCircle2, XCircle, AlertTriangle, UploadCloud, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { api } from "@shared/routes";
import { enUS } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TaskDetails() {
  const [, params] = useRoute("/task/:id");
  const [, setLocation] = useLocation();
  const id = params ? parseInt(params.id) : 0;
  
  const { data: task, isLoading } = useTask(id);
  const submitEvidence = useSubmitEvidence();
  const { toast } = useToast();

  const { data: user } = useUser();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handleEvidenceSubmit = useCallback(async (objectPath: string) => {
  if (!task || submitEvidence.isPending) return;
  
  try {
    await submitEvidence.mutateAsync({ id: task.id, evidenceUrl: objectPath });
    setShowSubmitDialog(true);
    queryClient.invalidateQueries({ 
      queryKey: [api.tasks.get.path, task.id] 
    });

  } catch (error) {
    console.error("Evidence submission error:", error);
    toast({ 
      title: "Error", 
      description: "Submission failed, but file is uploaded. Please refresh page.", 
      variant: "destructive" 
    });
  }
}, [task?.id, submitEvidence, queryClient, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Task not found</h2>
        <Button variant="ghost" onClick={() => setLocation("/")}>Return home</Button>
      </div>
    );
  }

  const isExpired = new Date(task.deadline) < new Date();
  const isPending = task.status === "pending";
  const isSubmitted = task.status === "submitted";
  const isCompleted = task.status === "completed";
  const isFailed = task.status === "failed";
  const isRejected = isFailed && !isExpired; 
  const isFinalFailed = isFailed && isExpired; 

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 py-6 flex items-center gap-4 border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => setLocation(isAdmin ? "/admin/history" : "/")} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold truncate pr-4">{task.title}</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-8">
        {/* Status Card */}
        <div className={`
          p-6 rounded-3xl border text-center relative overflow-hidden
          ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''}
          ${isFinalFailed ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}
          ${isRejected ? 'bg-amber-500/10 border-red-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : ''}
          ${isPending ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''}
          ${isSubmitted ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : ''}         
        `}>
          <div className="relative z-10 flex flex-col items-center gap-3">
            {isCompleted && <CheckCircle2 className="w-12 h-12 text-emerald-500" />}
            {isFinalFailed && <XCircle className="w-12 h-12 text-red-500" />}
            {isRejected && <AlertTriangle className="w-12 h-12 text-red-500" />} 
            {isPending && <Clock className="w-12 h-12 text-amber-500" />}
            {isSubmitted && <Clock className="w-12 h-12 text-blue-500" />}
            
            <h2 className="text-3xl font-bold">
              {(task.amount / 100)} USDC
            </h2>
            <p className="text-sm font-medium uppercase tracking-wide opacity-80">
              {isCompleted && "Amount returned"}
              {isFinalFailed && "Amount withheld"}
              {isRejected && "Needs fix"} 
              {isSubmitted && "Under review"}
              {isPending && "Deposit amount"}
            </p>
            {isFailed && task.rejectionReason && (
              <div className="mt-4 p-3 bg-red-500/10 rounded-2xl border border-red-500/20 w-full">
                <p className="text-[10px] text-red-600 font-black uppercase mb-1">Rejection reason:</p>
                <p className="text-sm font-medium">{task.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-2xl border border-border/50">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />Deadline
            </div>
            <div className="font-semibold text-sm">
              {format(new Date(task.deadline), "d MMM, HH:mm", { locale: enUS })}
            </div>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border/50">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <Coins className="w-3 h-3" /> Status
            </div>
            <div className="font-semibold text-sm capitalize">
              {isPending && "In progress"}
              {isSubmitted && "Under review"}
              {isCompleted && "Completed"}
              {isRejected && "Rejected"}
              {isFinalFailed && "Failed"}
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="bg-card p-6 rounded-2xl border border-border/50">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Admin Evidence View */}
        {isAdmin && task.evidenceUrl && (
          <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-muted-foreground">Evidence Submitted:</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] uppercase font-bold text-primary"
                onClick={() => task.evidenceUrl && window.open(task.evidenceUrl, '_blank')}
              >
                <Share2 className="w-3 h-3 mr-1" /> Original
              </Button>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border/50 overflow-hidden">
              {(task.evidenceUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || task.evidenceUrl?.includes("image/upload")) ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <FileImage className="w-3 h-3" /> Image Proof
                  </div>
                  <img src={task.evidenceUrl} alt="Task evidence" className="w-full max-h-96 object-contain rounded bg-black/5" />
                </div>
              ) : (task.evidenceUrl?.match(/\.(mp4|webm|mov|avi|quicktime)$/i) || task.evidenceUrl?.includes("video/upload")) ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <FileVideo className="w-3 h-3" /> Video Proof
                  </div>
                  <video src={task.evidenceUrl} controls playsInline className="w-full max-h-96 rounded bg-black" />
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <FileWarning className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="text-sm font-medium mb-3">External Evidence</p>
                  <a href={task.evidenceUrl} target="_blank" className="text-primary underline text-xs break-all">
                    {task.evidenceUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Status View */}
        {!isAdmin && task.status === "submitted" && (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">File uploaded successfully</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Waiting for moderator verification
              </p>
            </div>
          </div>
        )}

        {/* Upload Actions */}
        <div className="space-y-4 pt-4">
          {((isPending || isFailed) && !isExpired) && !isAdmin && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <h3 className="font-semibold mb-4">
                {isFailed ? "Fix evidence" : "Evidence of completion"}
              </h3>
              <ObjectUploader
                maxFileSize={52428800} 
                onGetUploadParameters={async (file) => {
                  if (!task?.id) throw new Error("Task data is not loaded yet");
                  
                  const res = await fetch("/api/uploads/request-url", {
                    method: "POST",
                    headers: { 
                      "Content-Type": "application/json",
                      "x-user-address": user?.address || "" 
                    },
                    body: JSON.stringify({
                      taskId: task.id, 
                    }),
                  });

                  if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "Failed to get upload URL");
                  }
                  
                  const data = await res.json();
                  file.meta = { ...file.meta, objectPath: data.objectPath, taskId: String(task.id) };
                  
                  return {
    method: "POST",
    url: data.uploadURL,
    headers: {
      "x-user-address": user?.address || "",
    },
    opts: {
      formData: true,
      fieldName: 'file'
    }
  };
                }}
                onComplete={(result) => {
  if (result.successful && result.successful.length > 0) {
    const success = result.successful[0];
    const uploadedUrl = success.response?.body?.url || success.meta?.objectPath;
    if (uploadedUrl && typeof uploadedUrl === "string") {
      handleEvidenceSubmit(uploadedUrl);
    } else {
      toast({ 
        title: "Error", 
        description: "File uploaded but link was not found", 
        variant: "destructive" 
      });
    }
  }
}}
                buttonClassName="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.95]"
              >
                <UploadCloud className="w-5 h-5 mr-2 inline" />
                {isFailed ? "Upload new" : "Upload evidence"}
              </ObjectUploader>
              <p className="text-xs text-muted-foreground mt-3">
                {isFailed ? "The administrator rejected the previous evidence. Please fix the errors and upload the file again." : "Photo or video confirmation is required to return the deposit."}
              </p>
            </div>
          )}

          {isSubmitted && !isExpired && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-blue-500 mb-2">Verification in progress</h3>
              <p className="text-sm text-muted-foreground">
                Our team is reviewing your confirmation.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Success Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Evidence sent!</DialogTitle>
            <DialogDescription className="text-center">
              Your evidence has been uploaded and is waiting for confirmation by our team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Check the verification results later.
            </p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowSubmitDialog(false);
                setLocation("/");
              }}
              className="w-full"
            >
              Back to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}