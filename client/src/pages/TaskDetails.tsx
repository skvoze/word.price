import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTask, useSubmitEvidence } from "@/hooks/use-tasks";
import { format } from "date-fns";
import { ArrowLeft, Clock, Calendar, Coins, CheckCircle2, XCircle, AlertTriangle, UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
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

  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

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
        <h2 className="text-2xl font-bold mb-2">Task Not Found</h2>
        <Button variant="link" onClick={() => setLocation("/")}>Go Home</Button>
      </div>
    );
  }

  const handleEvidenceSubmit = async (url: string) => {
    try {
      await submitEvidence.mutateAsync({ id: task.id, evidenceUrl: url });
      setShowSubmitDialog(true);
      setUploadUrl(null);
    } catch (error) {
      console.error("Evidence submission error:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to submit evidence", 
        variant: "destructive" 
      });
    }
  };

  // Status visual helpers
  const isPending = task.status === "pending";
  const isSubmitted = task.status === "submitted";
  const isCompleted = task.status === "completed";
  const isFailed = task.status === "failed";

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 py-6 flex items-center gap-4 border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold truncate pr-4">{task.title}</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-8">
        {/* Status Card */}
        <div className={`
          p-6 rounded-3xl border text-center relative overflow-hidden
          ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : ''}
          ${isFailed ? 'bg-red-500/10 border-red-500/20' : ''}
          ${isPending ? 'bg-amber-500/10 border-amber-500/20' : ''}
          ${isSubmitted ? 'bg-blue-500/10 border-blue-500/20' : ''}
        `}>
          <div className="relative z-10 flex flex-col items-center gap-3">
            {isCompleted && <CheckCircle2 className="w-12 h-12 text-emerald-500" />}
            {isFailed && <XCircle className="w-12 h-12 text-red-500" />}
            {isPending && <Clock className="w-12 h-12 text-amber-500" />}
            {isSubmitted && <AlertTriangle className="w-12 h-12 text-blue-500" />}
            
            <h2 className="text-2xl font-bold">
              ${(task.amount / 100).toFixed(2)}
            </h2>
            <p className="text-sm font-medium uppercase tracking-wide opacity-80">
              {isCompleted ? "Refunded to Wallet" : isFailed ? "Pledge Lost" : isSubmitted ? "Under Review" : "Locked Pledge"}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-2xl border border-border/50">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Deadline
            </div>
            <div className="font-semibold text-sm">
              {format(new Date(task.deadline), "MMM d, h:mm a")}
            </div>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border/50">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <Coins className="w-3 h-3" /> Status
            </div>
            <div className="font-semibold text-sm capitalize">
              {task.status}
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

        {/* Actions Area */}
        <div className="space-y-4 pt-4">
          {isPending && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <h3 className="font-semibold mb-4">Proof of Completion</h3>
              <ObjectUploader
                onGetUploadParameters={async (file) => {
                  const res = await fetch("/api/uploads/request-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: file.name,
                      size: file.size,
                      contentType: file.type,
                    }),
                  });
                  const { uploadURL, objectPath } = await res.json();
                  // Store path for submission later (Uppy handles upload to URL)
                  // But ObjectUploader's onComplete gives us result, we need to extract URL or assume success.
                  // For this demo, we'll assume the presigned flow works and we just need the 'objectPath' or constructed URL.
                  // Since we can't easily pass objectPath out from here to onComplete in this specific component signature without custom wrapper logic,
                  // we will store the last generated objectPath in state.
                  // In a real app, we'd wrap this tighter.
                  setUploadUrl(objectPath);
                  
                  return {
                    method: "PUT",
                    url: uploadURL,
                    headers: { "Content-Type": file.type },
                  };
                }}
                onComplete={() => {
                   if (uploadUrl) handleEvidenceSubmit(uploadUrl);
                }}
                buttonClassName="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl text-lg font-semibold shadow-lg shadow-primary/25"
              >
                <UploadCloud className="w-5 h-5 mr-2 inline" />
                Upload Evidence
              </ObjectUploader>
              <p className="text-xs text-muted-foreground mt-3">
                Photo or video proof required to unlock funds.
              </p>
            </div>
          )}

          {isSubmitted && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-blue-500 mb-2">Verification Pending</h3>
              <p className="text-sm text-muted-foreground">
                Our team is reviewing your submission. You will be notified shortly.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />

      {/* Evidence Submission Success Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Evidence Submitted!</DialogTitle>
            <DialogDescription className="text-center">
              Your proof of completion has been uploaded and is waiting for admin verification.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Check back later for verification results.
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
