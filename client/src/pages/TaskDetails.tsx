import { useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useTask, useSubmitEvidence } from "@/hooks/use-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";
import { FileImage, FileVideo, FileWarning,ArrowLeft, Clock, Calendar, Coins, CheckCircle2, XCircle, AlertTriangle, UploadCloud, Loader2, User,Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { api} from "@shared/routes";
import { ru } from "date-fns/locale";
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
    if (!task) return;
    try {
      await submitEvidence.mutateAsync({ id: task.id, evidenceUrl: objectPath });
     await queryClient.invalidateQueries({ 
      queryKey: [api.tasks.get.path, task.id] 

    });
  
    await queryClient.invalidateQueries({ 
      queryKey: [api.tasks.list.path] 
    });
    await queryClient.refetchQueries({ 
      queryKey: [api.tasks.get.path, task.id] 
    });
    queryClient.setQueryData([api.tasks.get.path, task.id], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        status: "submitted",
        evidenceUrl: objectPath
      };
    });
    queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    } catch (error) {
      console.error("Evidence submission error:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to submit evidence", 
        variant: "destructive" 
      });
    }
  }, [task?.id, submitEvidence, toast, queryClient]);

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
        <Button variant="ghost" onClick={() => setLocation("/")}>Go Home</Button>
      </div>
    );
  }

  const isPending = task.status === "pending";
  const isSubmitted = task.status === "submitted";
  const isCompleted = task.status === "completed";
  const isFailed = task.status === "failed";
const isExpired = new Date(task.deadline) < new Date();
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
          ${isFailed ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}
          ${isPending ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : ''}
          ${isSubmitted ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : ''}
        `}>
          <div className="relative z-10 flex flex-col items-center gap-3">
            {isCompleted && <CheckCircle2 className="w-12 h-12 text-emerald-500" />}
            {isFailed && <XCircle className="w-12 h-12 text-red-500" />}
            {isPending && <Clock className="w-12 h-12 text-amber-500" />}
            {isSubmitted && <AlertTriangle className="w-12 h-12 text-blue-500" />}
            
            <h2 className="text-3xl font-bold">
              {(task.amount / 100)} ₽
            </h2>
            <p className="text-sm font-medium uppercase tracking-wide opacity-80">
              {isCompleted ? "Средства возвращены" : isFailed ? "Средтсва потеряны" : isSubmitted ? "На рассмотрении" : "Замороженные средства"}
            </p>
            {isFailed && task.rejectionReason && (
              <div className="mt-4 p-3 bg-red-500/10 rounded-2xl border border-red-500/20 w-full">
                <p className="text-[10px] text-red-600 font-black uppercase mb-1">Причина отказа:</p>
                <p className="text-sm font-medium">{task.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
{isAdmin && (task as any).userTelegramId && (
  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6">
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
      <User className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Исполнитель</p>
      <p className="text-sm font-bold">@{(task as any).userTelegramId}</p>
    </div>
    <Button 
      size="sm" 
      variant="ghost" 
      className="text-primary text-xs font-bold"
      onClick={() => window.open(`https://t.me/${(task as any).userTelegramId}`, '_blank')}
    >
      Написать
    </Button>
  </div>
)}
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-2xl border border-border/50">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />Дэдлайн
            </div>
            <div className="font-semibold text-sm">
              {format(new Date(task.deadline), "d MMM, HH:mm", { locale: ru })}
            </div>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border/50">
            <div className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1">
              <Coins className="w-3 h-3" /> Статус
            </div>
            <div className="font-semibold text-sm capitalize">
              {task.status}
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="bg-card p-6 rounded-2xl border border-border/50">
            <h3 className="font-semibold mb-2">Описание</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{task.description}</p>
          </div>
        )}
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
        <Share2 className="w-3 h-3 mr-1" /> Оригинал
      </Button>
    </div>
    
    <div className="bg-background rounded-lg p-3 border border-border/50 overflow-hidden">
      {(task.evidenceUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || task.evidenceUrl?.includes("image/upload")) ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <FileImage className="w-3 h-3" /> Image Proof
          </div>
          <img 
            src={task.evidenceUrl} 
            alt="Task evidence" 
            className="w-full max-h-96 object-contain rounded bg-black/5"
          />
        </div>
      ) : (task.evidenceUrl?.match(/\.(mp4|webm|mov|avi|quicktime)$/i) || task.evidenceUrl?.includes("video/upload")) ? (
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
{!isAdmin && task.status==="submitted" &&(
      <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Файл успешно загружен</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Ожидайте проверки модератором
          </p>
        </div>
      </div>
    )}
        {/* Actions Area */}
        <div className="space-y-4 pt-4">
 
  {((isPending || isFailed) && !isExpired) && !isAdmin && (
    <div className="bg-card border border-border rounded-2xl p-6 text-center">
      <h3 className="font-semibold mb-4">
        {isFailed ? "Исправить доказательство" : "Доказательство выполнения"}
      </h3>
              <ObjectUploader
  maxFileSize={52428800} 
  onGetUploadParameters={async (file) => {
    if (!task?.id) {
      throw new Error("Task data is not loaded yet");
    }

    
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only images and videos are allowed as evidence.");
    }

    
    const tg = (window as any).Telegram?.WebApp;
  const res = await fetch("/api/uploads/request-url", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-telegram-init-data": tg?.initData || "" 
    },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type,
      taskId: task.id, 
    }),
  });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to get upload URL");
    }
    
    const data = await res.json();
    file.meta = { 
      ...file.meta, 
      objectPath: data.objectPath,
      taskId: String(task.id) 
    };

  
    const uploadUrlWithParams = `${data.uploadURL}${data.uploadURL.includes('?') ? '&' : '?'}taskId=${task.id}`;

    return {
      method: "POST", 
      url: uploadUrlWithParams,
      headers: {
        
      }, 
    };
  }}
  onComplete={(result) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      // Пытаемся достать URL из ответа сервера или из метаданных, которые мы сохранили выше
      const uploadedUrl = file.response?.body?.url || file.meta?.objectPath;
      
      if (uploadedUrl && typeof uploadedUrl === "string") {
        handleEvidenceSubmit(uploadedUrl);
      } else {
        toast({ title: "Ошибка", description: "Не удалось получить ссылку на файл", variant: "destructive" });
      }
    }
  }}
buttonClassName="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.95]">
  <UploadCloud className="w-5 h-5 mr-2 inline" />
  {isFailed ? "Загрузить новое" : "Загрузить доказательство"}
</ObjectUploader>
{isFailed ? (
  <p className="text-xs text-red-500 mt-3 font-medium italic">
    Администратор отклонил предыдущее доказательство. Пожалуйста, исправьте ошибки и загрузите файл снова.
  </p>
) : (
  <p className="text-xs text-muted-foreground mt-3">
    Фото или видео подтверждение необходимо для разморозки средтсв.
  </p>
)}
            </div>
          )}

          {isSubmitted && !isExpired && (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
      <h3 className="font-semibold text-blue-500 mb-2">Выполняется верификация</h3>
      <p className="text-sm text-muted-foreground">
        Наша команда рассматривает ваше подтверждение.
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
            <DialogTitle className="text-center">Доказательство отправлено!</DialogTitle>
            <DialogDescription className="text-center">
              Ваше доказательство загружено и ждет подтверждения нашей командой.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Проверьте результаты верификации позднее.
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
