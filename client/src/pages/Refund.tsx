import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Refund() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24">
      <Link href="/">
        <button className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group text-sm font-bold uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Назад
        </button>
      </Link>

      <h1 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter text-white">Политика возврата</h1>
      
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 text-zinc-300 rounded-[2rem]">
        <section>
          <p className="text-xs text-zinc-500 italic">Дата вступления в силу: 18.02.2026</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Суть и момент оказания услуги</h2>
          <p>
            Предметом услуги является мониторинг выполнения Пользователем поставленной им задачи в установленный срок. 
            <br /><br />
            Услуга считается <b>оказанной в полном объеме</b>, если Пользователь не предоставил отчет в установленный им дедлайн или если отчет признан недостоверным. В этом случае внесенная сумма удерживается Исполнителем в качестве вознаграждения за услуги верификации и технической поддержки.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Условия возврата</h2>
          <p>
            Возврат денежных средств (предоплаты) на банковскую карту Пользователя возможен в следующих случаях:
            <br />
            • Подтвержденный технический сбой Сервиса, сделавший загрузку отчета невозможной.
            <br />
            • Отказ Пользователя от услуги <b>до наступления дедлайна</b> (при условии, что отчет еще не был проверен модератором).
            <br />
            • Ошибочный или дублирующий платеж.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Порядок оформления заявки</h2>
          <p>
            Для оформления возврата Пользователь направляет заявление в свободной форме на email <b>cena.slova.help@gmail.com</b> или в Telegram: <b>@cena_slova_help</b>. 
            В заявлении необходимо указать дату платежа и причину возврата.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Сроки и комиссия</h2>
          <p>
            4.1. Срок рассмотрения заявки — до 3 рабочих дней.
            <br />
            4.2. При возврате по инициативе Пользователя (кроме случаев тех. сбоев), сумма возвращается <b>за вычетом комиссии платежной системы (5%)</b>.
            <br />
            4.3. Срок зачисления средств на карту зависит от банка-эмитента и составляет от 1 до 10 рабочих дней.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 text-[11px] text-zinc-500 italic">
          Исполнитель: Самозанятый Коновалов В. А. ИНН: 594204795787. 
          Платежи обрабатываются через сервис Robokassa.
        </section>
      </Card>
    </div>
  );
}