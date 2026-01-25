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

export default function AdminPage() {
  const { toast } = useToast();

  // 1. Загружаем все заявки на вывод
  const { data: withdrawals, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/withdrawals"],
  });

  // 2. Мутация для смены статуса
  const statusMutation = useMutation({
  mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
    const res = await apiRequest("PATCH", `/api/admin/transactions/${id}`, { 
      status, 
      rejectionReason // Отправляем на сервер
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

  const pending = withdrawals?.filter(t => t.status === "pending") || [];
  const history = withdrawals?.filter(t => t.status !== "pending") || [];

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Управление выплатами</h1>
{/* Блок статистики */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl">
    <p className="text-sm text-zinc-500">Ожидает выплат</p>
    <p className="text-2xl font-bold text-amber-500">
      {(pending.reduce((acc, curr) => acc + Math.abs(curr.amount), 0) / 100).toLocaleString()} ₽
    </p>
  </div>
  <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl">
    <p className="text-sm text-zinc-500">Заявок в очереди</p>
    <p className="text-2xl font-bold text-white">{pending.length}</p>
  </div>
  <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl">
    <p className="text-sm text-zinc-500">Всего выплачено</p>
    <p className="text-2xl font-bold text-emerald-500">
      {(history.filter(t => t.status === 'completed').reduce((acc, curr) => acc + Math.abs(curr.amount), 0) / 100).toLocaleString()} ₽
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
    <TableCell className="font-bold text-white">
      {Math.abs(tx.amount / 100).toLocaleString()} ₽
    </TableCell>

    {/* 4. Карта */}
    <TableCell>
      <div className="flex items-center gap-2">
        <code className="font-mono bg-zinc-900 border border-white/5 px-2 py-1 rounded text-amber-200">
          {tx.metadata?.cardNumber || "Нет номера"}
        </code>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-zinc-500 hover:text-white"
          onClick={() => copyCard(tx.metadata?.cardNumber || "")}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>

    {/* 5. Действия */}
    <TableCell className="text-right">
      <div className="flex justify-end gap-2">
        <Button 
          size="sm" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={statusMutation.isPending}
          onClick={() => statusMutation.mutate({ id: tx.id, status: "completed" })}
        >
          <CheckCircle className="h-4 w-4 mr-1" /> Выплатить
        </Button>
       <Button 
  size="sm" 
  variant="outline"
  disabled={statusMutation.isPending}
  onClick={() => {
    const reason = window.prompt("Укажите причину отказа:");
    if (reason !== null) {
      statusMutation.mutate({ id: tx.id, status: "rejected", rejectionReason: reason });
    }
  }}
>
  <XCircle className="h-4 w-4 mr-1" /> Отказать
</Button>
      </div>
    </TableCell>
  </TableRow>
))}
                {pending.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Нет новых заявок</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

       <TabsContent value="history">
  <div className="border rounded-lg border-white/5 bg-zinc-900/50">
    <Table>
      <TableHeader>
        <TableRow className="border-white/5 hover:bg-transparent">
          <TableHead>Дата</TableHead>
          <TableHead>Пользователь</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Карта</TableHead>
          <TableHead className="text-right">Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((tx: any) => (
          <TableRow key={tx.id} className="border-white/5">
            <TableCell className="text-zinc-500">
              {new Date(tx.createdAt).toLocaleDateString('ru-RU')}
            </TableCell>
            <TableCell className="text-zinc-300">
              {/* Если в метаданных нет telegramId, выводим userId */}
              {tx.metadata?.telegramId || `TelegramID: ${tx.telegramId} ID: ${tx.userId}`}
            </TableCell>
            <TableCell className="font-bold">
              {Math.abs(tx.amount / 100).toLocaleString()} ₽
            </TableCell>
            <TableCell className="font-mono text-xs text-zinc-500">
              {tx.metadata?.cardNumber ? `${tx.metadata.cardNumber}` : "—"}
            </TableCell>
            <TableCell className="text-right">
              <Badge 
                variant="outline" 
                className={cn(
                  tx.status === 'completed' 
                    ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5" 
                    : "border-red-500/50 text-red-500 bg-red-500/5"
                )}
              >
                {tx.status === 'completed' ? 'Выплачено' : 'Отклонено'}
              </Badge>
              {/* Если есть причина отказа — выводим её мелким текстом под статусом */}
              {tx.rejectionReason && (
                <p className="text-[10px] text-red-400 mt-1 max-w-[150px] ml-auto">
                  {tx.rejectionReason}
                </p>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</TabsContent>
      </Tabs>
    </div>
  );
}