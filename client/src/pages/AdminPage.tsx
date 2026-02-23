import { useQuery, useMutation } from "@tanstack/react-query";
import { transactions, Transaction } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Copy, ExternalLink } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function AdminPage() {
  const { toast } = useToast();
  const { data: user } = useUser();
  const { data: withdrawals, isLoading, error } = useQuery<Transaction[]>({
  queryKey: ["/api/admin/withdrawals"],
  queryFn: async () => {
    const tg = (window as any).Telegram?.WebApp;
    const res = await fetch("/api/admin/withdrawals", {
      headers: {
        "x-telegram-init-data": tg?.initData || "" 
      }
    });
    if (!res.ok) throw new Error("Ошибка доступа");
    return res.json();
  },
  enabled: !!user?.role
});

  const statusMutation = useMutation({
  mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
    const res = await apiRequest("PATCH", `/api/admin/transactions/${id}`, { 
      status, 
      rejectionReason 
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
    toast({ title: "Статус обновлен" });
  },
});

  const copyCard = (num: string) => {
    navigator.clipboard.writeText(num);
    toast({ title: "Скопировано!", description: "Номер карты в буфере обмена" });
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

 const allWithdrawals = withdrawals?.filter(t => t.type === "withdraw") || [];
  const pending = allWithdrawals.filter(t => t.status === "pending");
  const history = allWithdrawals.filter(t => t.status !== "pending");
if (error) {
  return (
    <div className="container mx-auto py-20 text-center">
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl inline-block">
        <h2 className="text-red-500 font-bold mb-2">Доступ ограничен</h2>
        <p className="text-zinc-400 text-sm">{error.message}</p>
      </div>
    </div>
  );
}
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Управление выплатами</h1>
{/* Блок статистики */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl">
    <p className="text-sm text-zinc-500">Ожидает выплат (грязными)</p>
    <p className="text-2xl font-bold text-amber-500">
      {(pending.reduce((acc, curr) => acc + Math.abs(curr.amount), 0) / 100).toLocaleString()} ₽
    </p>
    {/* Добавляем расчет чистыми */}
    <p className="text-[10px] text-amber-500/50 mt-1 uppercase font-bold">
      К отправке (~5%): {(pending.reduce((acc, curr) => acc + Math.abs(curr.amount), 0) * 0.95 / 100).toLocaleString()} ₽
    </p>
  </div>
  
  <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl">
    <p className="text-sm text-zinc-500">Заявок в очереди</p>
    <p className="text-2xl font-bold text-white">{pending.length}</p>
  </div>

  <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl">
    <p className="text-sm text-zinc-500">Всего выплачено (чистыми)</p>
    <p className="text-2xl font-bold text-emerald-500">
      {(history.filter(t => t.status === 'completed').reduce((acc, curr) => acc + (Math.abs(curr.amount) * 0.95), 0) / 100).toLocaleString()} ₽
    </p>
  </div>
</div>
      <Tabs defaultValue="new">
        <TabsList className="mb-4">
          <TabsTrigger value="new">Новые ({pending.length})</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Карта</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((tx: any) => (
  <TableRow key={tx.id}>
    {/* 1. Дата */}
    <TableCell className="text-zinc-400">
      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('ru-RU') : '—'}
    </TableCell>

    {/* 2. Пользователь (теперь берем из JOIN) */}
    <TableCell className="font-medium text-white">
      {tx.telegramId || `ID: ${tx.userId}`}
    </TableCell>

    {/* 3. Сумма */}
    <TableCell className="font-medium">
  <div className="flex flex-col">
    <span className="font-bold text-zinc-300">
      {(tx.amount / 100).toLocaleString()} ₽
    </span>
    <span className="text-[10px] text-emerald-500 font-bold">
      Чистыми: {(Math.abs(tx.amount) * 0.95 / 100).toLocaleString()} ₽
    </span>
  </div>
</TableCell>

    {/* 4. Карта */}
<TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <code className="font-mono bg-zinc-900 border border-amber-500/20 px-2 py-1 rounded text-amber-200 text-sm">
                            {tx.metadata?.cardNumber || "Номер не указан"}
                          </code>
                          <Button 
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => copyCard(tx.metadata?.cardNumber || "")}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {(tx.metadata?.userNote || tx.description) && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-2">
                            <p className="text-[10px] uppercase text-blue-400 font-bold mb-0.5">Комментарий пользователя:</p>
                            <p className="text-xs text-blue-100 italic">
                              {tx.metadata?.userNote}
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => statusMutation.mutate({ id: tx.id, status: "completed" })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Одобрить
                        </Button>
                        <Button 
                          size="sm" variant="destructive"
                          onClick={() => {
                            const reason = window.prompt("Причина отказа:");
                            if (reason) statusMutation.mutate({ id: tx.id, status: "rejected", rejectionReason: reason });
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Отказать
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

<TabsContent value="history">
  <div className="border rounded-lg border-white/5 bg-zinc-900/50 overflow-hidden">
    <Table>
      <TableHeader className="bg-zinc-900/30">
        <TableRow className="border-white/5 hover:bg-transparent">
          <TableHead>Дата</TableHead>
          <TableHead>Пользователь</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Реквизиты</TableHead>
          <TableHead className="text-right">Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((tx: any) => (
          <TableRow key={tx.id} className="border-white/5">
            <TableCell className="text-zinc-500 text-xs">
              {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('ru-RU') : '—'}
            </TableCell>
            <TableCell className="text-zinc-300">
              <span className="text-[10px] text-zinc-600 block">ID: {tx.userId}</span>
              {tx.telegramId || "User"}
            </TableCell>
            <TableCell className="font-bold">
              {Math.abs(tx.amount / 100).toLocaleString()} ₽
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs text-zinc-400">
                  {tx.metadata?.cardNumber || "—"}
                </span>
                {/* Комментарий пользователя в истории */}
                {(tx.metadata?.userNote || tx.description) && (
                  <span className="text-[10px] text-zinc-500 italic truncate max-w-[200px]">
                    Note: {tx.metadata?.userNote || tx.description}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex flex-col items-end gap-1">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] uppercase tracking-wider px-2 py-0",
                    tx.status === 'completed' 
                      ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5" 
                      : "border-red-500/50 text-red-500 bg-red-500/5"
                  )}
                >
                  {tx.status === 'completed' ? 'Выплачено' : 'Отклонено'}
                </Badge>
                {/* Если админ указал причину отказа при отклонении */}
                {tx.rejectionReason && (
                  <p className="text-[10px] text-red-400 italic max-w-[150px]">
                    Причина: {tx.rejectionReason}
                  </p>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
        {history.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
              История выплат пуста
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
</TabsContent>
      </Tabs>
    </div>
  );
}