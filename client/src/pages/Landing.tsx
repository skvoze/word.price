import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-white selection:text-black">
      <main className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center">
        
        {/* 1. ЗАГОЛОВОК: Что это? Понятно даже дебилу за 3 сек */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 leading-none">
            Цена <br /> Слова
          </h1>
          <p className="text-xl md:text-2xl font-bold text-zinc-400 uppercase tracking-tight">
            Сервис контроля твоих целей
          </p>
        </div>

        {/* 2. БОЛИ: Говорим словами пользователя про его проблемы */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-20">
  <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 shadow-xl">
    <h3 className="text-zinc-500 font-black uppercase mb-4 tracking-tighter text-sm">Проблема</h3>
    <ul className="space-y-4 text-zinc-300 font-medium text-lg leading-tight">
      <li>— Постоянно откладываешь важные задачи?</li>
      <li>— Обещания самому себе ничего не стоят?</li>
      <li>— Дисциплина пропадает через два дня?</li>
    </ul>
  </div>
  <div className="bg-white p-8 rounded-3xl flex flex-col justify-center shadow-xl">
    <h3 className="text-black font-black uppercase mb-2 tracking-tighter italic text-2xl">Метод:</h3>
    <p className="text-zinc-900 font-bold text-lg leading-tight">
      Создай цену своего бездействия. <br /> 
      Подкрепи цель предоплатой. <br /> 
      Либо результат, либо расходы.
    </p>
  </div>
</div>

        {/* 3. ПРО ПРОДУКТ: Юзер флоу на пальцах (и для Робокассы ок) */}
        <div className="w-full mb-20 space-y-12">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter">Как это работает</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center font-black text-xl italic border border-zinc-700">1</div>
              <h4 className="font-bold uppercase">Ставишь цель</h4>
              <p className="text-zinc-500 text-sm leading-snug">Пишешь задачу, ставишь дедлайн и вносишь предоплату за услуги мониторинга (любую сумму).</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center font-black text-xl italic border border-zinc-700">2</div>
              <h4 className="font-bold uppercase">Делаешь дело</h4>
              <p className="text-zinc-500 text-sm leading-snug">Выполняешь задачу в срок. Загружаешь фото или видео отчет прямо в Telegram-бот.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center font-black text-xl italic border border-zinc-700">3</div>
              <h4 className="font-bold uppercase">Возвращаешь кэш</h4>
              <p className="text-zinc-500 text-sm leading-snug">Мы проверяем отчет. Если всё честно — возвращаем всю сумму обратно на твой баланс.</p>
            </div>
          </div>
        </div>

        {/* 4. CALL TO ACTION: Никаких "Узнать больше" */}
        <div className="w-full max-w-sm text-center">
          <Button 
            className="w-full bg-white text-black hover:bg-zinc-200 h-16 rounded-2xl font-black text-xl uppercase italic shadow-[0_0_30px_rgba(255,255,255,0.2)] group"
            onClick={() => window.open('https://t.me/cena_slova_task_bot', '_blank')}
          
          >
            Хватит ныть. Начать.
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="mt-4 text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
            Вход через Telegram в один клик
          </p>
        </div>

        {/* ЮРИДИЧЕСКИЙ ПОДВАЛ (Обязательно для модерации) */}
        <div className="mt-32 w-full pt-10 border-t border-zinc-900 text-center">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
            <Link href="/terms" className="hover:text-white transition-colors underline decoration-zinc-800">Условия использования</Link>
            <Link href="/privacy" className="hover:text-white transition-colors underline decoration-zinc-800">Конфиденциальность</Link>
          </div>
          
          <div className="text-[10px] text-zinc-700 uppercase tracking-[0.2em] space-y-3 leading-relaxed">
            <p>© 2026 PRICE OF WORD / ЦЕНА СЛОВА</p>
            <p>ИП/Самозанятый Коновалов В.А. | ИНН 594204795787</p>
            <p className="opacity-50">Сервис не является азартной игрой или пари. <br /> Оплата производится за услуги верификации и мониторинга целей.</p>
            <div className="pt-4 grayscale opacity-30 flex justify-center gap-4">
               {/* Здесь можно просто текстом или мелкими иконками платежек */}
               <span>MIR</span> <span>VISA</span> <span>MASTERCARD</span> <span>ROBOKASSA</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}