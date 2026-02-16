import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-5xl font-black italic tracking-tighter mb-4 uppercase">Цена Слова</h1>
      <p className="text-zinc-400 max-w-md mb-8 leading-relaxed">
        Сервис обеспечения личных обязательств. Ставьте цели, подтверждайте результат и держите своё слово.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-16 text-left max-w-4xl">
  <div className="space-y-2">
    <div className="text-white font-bold uppercase tracking-tighter">01. Заказ услуг</div>
    <p className="text-zinc-500 text-sm">Вы выбираете цель и вносите предоплату за услуги мониторинга и верификации.</p>
  </div>
  <div className="space-y-2">
    <div className="text-white font-bold uppercase tracking-tighter">02. Верификация</div>
    <p className="text-zinc-500 text-sm">Вы выполняете задачу и загружаете отчет. Мы проверяем достоверность результата.</p>
  </div>
  <div className="space-y-2">
    <div className="text-white font-bold uppercase tracking-tighter">03. Результат</div>
    <p className="text-zinc-500 text-sm">При успехе сумма возвращается вам как компенсация за достигнутый результат.</p>
  </div>
</div>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button 
          className="bg-white text-black hover:bg-zinc-200 h-14 rounded-2xl font-bold text-lg"
          onClick={() => window.open('https://t.me/@cena_slova_task_bot', '_blank')}
        >
          Запустить в Telegram
        </Button>
        
        <div className="flex justify-center gap-6 mt-10">
          <Link href="/terms" className="text-xs text-zinc-500 hover:text-white transition-colors underline">Условия использования</Link>
          <Link href="/privacy" className="text-xs text-zinc-500 hover:text-white transition-colors underline">Политика конфиденциальности</Link>
        </div>
      </div>

      <footer className="mt-20 text-[10px] text-zinc-600 uppercase tracking-widest space-y-2">
        <p>© 2026 ЦЕНА СЛОВА</p>
        <p>Самозанятый Коновалов В.А. | ИНН 594204795787</p>
        <p className="pt-4">Прием платежей через Robokassa (МИР, VISA, MASTERCARD)</p>
      </footer>
    </div>
  );
}