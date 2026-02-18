import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown, ArrowRight, ShieldCheck, Mail, User, Send } from "lucide-react";

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faq = [
    { 
      q: "Что считается доказательством выполнения?", 
      a: "Фото или видео подтверждение, на котором четко виден результат вашей работы (например, скриншот завершенного проекта, фото из спортзала или выполненный отчет)." 
    },
    { 
      q: "Как происходит возврат средств?", 
      a: "После того как модератор подтвердит ваше доказательство в течение 24 часов, сумма предоплаты возвращается на ваш внутренний баланс. Вы можете вывести её на карту или использовать для новой цели." 
    },
    { 
      q: "Почему удерживается 5% при выводе?", 
      a: "Эта комиссия покрывает банковские издержки платежных систем на проведение безопасных транзакций." 
    },
    { 
      q: "Что если я не успею загрузить отчет?", 
      a: "Если дедлайн истек, а отчет не предоставлен в мини-приложении, услуги мониторинга считаются оказанными в полном объеме. В этом случае предоплата удерживается сервисом в качестве оплаты услуг верификации." 
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-white selection:text-black">
      <main className="max-w-4xl mx-auto px-4 py-20">
        
        {/* ——— 1. ЗАГОЛОВОК ——— */}
        <section className="text-center mb-24">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 leading-none">
            Цена <br /> Слова
          </h1>
          <p className="text-xl font-bold text-zinc-500 uppercase tracking-tight">
            Инструмент дисциплины через финансовую ответственность
          </p>
        </section>

        {/* ——— 2. БОЛИ ——— */}
        <section className="mb-32 space-y-12 text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
              <h3 className="text-zinc-500 uppercase font-black text-xs mb-4 tracking-widest">Проблема</h3>
              <p className="text-zinc-400 text-lg leading-tight">
                Обещания самому себе часто ничего не стоят, потому что за их нарушение нет последствий. Мозг всегда выбирает путь наименьшего сопротивления.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl flex flex-col justify-center">
              <h3 className="text-zinc-400 uppercase font-black text-xs mb-4 tracking-widest">Решение</h3>
              <p className="text-zinc-900 font-bold text-lg leading-tight">
                Мы создаем цену вашего бездействия. Финансовая ответственность — самый эффективный способ заставить дисциплину работать.
              </p>
            </div>
          </div>
        </section>

        {/* ——— 3. ПРО ПРОДУКТ ——— */}
        <section className="mb-32 space-y-16">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter">Как это работает</h2>
          <div className="grid grid-cols-1 gap-12">
            {[
              { n: "01", t: "Постановка цели", d: "Выбираете задачу, ставите дедлайн и вносите предоплату за услуги мониторинга (от 100 ₽)." },
              { n: "02", t: "Выполнение", d: "Выполняете задачу в срок и загружаете фото или видео отчет прямо в мини-приложении Telegram." },
              { n: "03", t: "Верификация", d: "Модератор проверяет отчет в течение 24 часов. Если всё честно — задача подтверждается." },
              { n: "04", t: "Результат", d: "Сумма предоплаты возвращается на ваш баланс. Вы дисциплинированы и сохранили деньги." }
            ].map((step, i) => (
              <div key={i} className="flex gap-6 items-start border-l border-zinc-800 pl-8 relative group">
                <div className="absolute -left-3 top-0 w-6 h-6 bg-zinc-950 border-2 border-zinc-800 group-hover:border-white transition-colors rounded-full flex items-center justify-center text-[10px] font-bold">{step.n}</div>
                <div>
                  <h4 className="font-bold uppercase text-white mb-2">{step.t}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ——— 4. CALL TO ACTION ——— */}
        <section className="text-center mb-40">
          <Button 
            className="w-full max-w-sm bg-white text-black hover:bg-zinc-200 h-16 rounded-2xl font-black text-xl uppercase italic shadow-[0_0_30px_rgba(255,255,255,0.15)] group"
            onClick={() => window.open('https://t.me/cena_slova_task_bot', '_blank')}
          >
            Запустить сервис
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="mt-4 text-[10px] text-zinc-600 uppercase font-bold tracking-[0.2em]">
            Вход через Telegram Mini App
          </p>
        </section>

        {/* ——— 5. FAQ ——— */}
        <section className="mb-40 max-w-2xl mx-auto">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter mb-12">Вопросы и ответы</h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-zinc-900/50 transition-colors"
                >
                  <span className="font-bold text-sm uppercase tracking-tight pr-4">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-zinc-900 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ——— ФУТЕР ——— */}
        <footer className="border-t border-zinc-900 pt-20 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase italic text-sm tracking-widest">Контакты и поддержка</h4>
              <div className="space-y-4 text-sm text-zinc-500">
                <div className="flex items-center gap-3 hover:text-white transition-colors">
                  <Send className="w-4 h-4 text-zinc-700" /> 
                  <a href="https://t.me/cena_slova_help" target="_blank" rel="noreferrer">Telegram: @cena_slova_help</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-zinc-700" /> cena.slova.help@gmail.com
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-900/50">
                  <User className="w-4 h-4 text-zinc-700" /> Самозанятый Коновалов В.А.
                </div>
                <div className="flex items-center gap-3">
                   <ShieldCheck className="w-4 h-4 text-zinc-700" /> ИНН 594204795787
                </div>
              </div>
            </div>
            <div className="flex flex-col md:items-end gap-4 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-600">
               <Link href="/terms" className="hover:text-white transition-colors underline decoration-zinc-800">Условия использования</Link>
               <Link href="/privacy" className="hover:text-white transition-colors underline decoration-zinc-800">Конфиденциальность</Link>
               <p className="mt-8 text-zinc-800 text-right max-w-[200px]">Остались вопросы? Напишите нам — ответим в течение 24 часов.</p>
            </div>
          </div>
          
          <div className="text-[9px] text-zinc-700 uppercase tracking-[0.3em] text-center border-t border-zinc-900 pt-10">
            <p>© 2026 ЦЕНА СЛОВА. Сервис мониторинга личных обязательств.</p>
            <p className="mt-4 italic opacity-50">Инструмент самодисциплины. Не является азартной игрой или пари.</p>
            <p className="mt-4">Безопасная оплата через Robokassa</p>
          </div>
        </footer>
      </main>
    </div>
  );
}