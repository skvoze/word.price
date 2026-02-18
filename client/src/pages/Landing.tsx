import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown, ArrowRight, ShieldCheck, Mail, User } from "lucide-react";

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faq = [
    { q: "Что считается доказательством выполнения?", a: "Фото или видео подтверждение, на котором четко виден результат вашей работы (например, скриншот завершенного проекта, фото из спортзала или выполненный отчет)." },
    { q: "Как происходит возврат средств?", a: "После того как модератор подтвердит ваше доказательство, сумма предоплаты возвращается на ваш внутренний баланс. Вы можете вывести её на карту или использовать для новой цели." },
    { q: "Почему удерживается 5% при выводе?", a: "Эта комиссия покрывает банковские издержки платежных систем и услуги по проведению транзакций." },
    { q: "Что если я не успею загрузить отчет?", a: "Если дедлайн истек, а отчет не предоставлен, услуги мониторинга считаются оказанными в полном объеме, и предоплата удерживается сервисом." }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main className="max-w-4xl mx-auto px-4 py-20">
        
        {/* ——— 1. ЗАГОЛОВОК ——— */}
        <section className="text-center mb-24">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 leading-none">
            Цена <br /> Слова
          </h1>
          <p className="text-xl font-bold text-zinc-500 uppercase tracking-tight">
            Сервис контроля личных целей через финансовую ответственность
          </p>
        </section>

        {/* ——— 2. БОЛИ ——— */}
        <section className="mb-32 space-y-12">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter">Почему это нужно?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
              <p className="text-zinc-400 text-lg leading-tight">
                Обещания самому себе часто ничего не стоят, потому что за их нарушение нет последствий. Мозг всегда выбирает путь наименьшего сопротивления.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl flex flex-col justify-center">
              <p className="text-zinc-900 font-bold text-lg leading-tight">
                Мы создаем цену вашего бездействия. <br />
                Финансовая ответственность — это самый эффективный способ заставить дисциплину работать на вас.
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
              { n: "02", t: "Выполнение", d: "Выполняете задачу в срок и загружаете фото или видео отчет прямо в Telegram-бот." },
              { n: "03", t: "Верификация", d: "Наша команда проверяет достоверность отчета. Если всё честно — задача подтверждается." },
              { n: "04", t: "Результат", d: "Сумма предоплаты возвращается на ваш баланс. Вы дисциплинированы и сохранили деньги." }
            ].map((step, i) => (
              <div key={i} className="flex gap-6 items-start border-l border-zinc-800 pl-8 relative">
                <div className="absolute -left-3 top-0 w-6 h-6 bg-zinc-950 border-2 border-zinc-800 rounded-full flex items-center justify-center text-[10px] font-bold">{step.n}</div>
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
            Начать в Telegram
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="mt-4 text-[10px] text-zinc-600 uppercase font-bold tracking-[0.2em]">
            Без регистрации. Вход через Telegram.
          </p>
        </section>

        {/* ——— 5. FAQ (Аккордеон) ——— */}
        <section className="mb-40">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter mb-12">Вопросы и ответы</h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-zinc-900/50 transition-colors"
                >
                  <span className="font-bold text-sm uppercase tracking-tight">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
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

        {/* ——— ФУТЕР (Контакты и Юр. данные) ——— */}
        <footer className="border-t border-zinc-900 pt-20 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase italic">Контакты и поддержка</h4>
              <div className="space-y-4 text-sm text-zinc-500 font-medium">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" /> cena.slova.help@gmail.com
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" /> Самозанятый Коновалов В.А.
                </div>
                <div className="flex items-center gap-3">
                   <ShieldCheck className="w-4 h-4" /> ИНН 594204795787
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 text-sm uppercase font-bold tracking-widest text-zinc-600">
               <Link href="/terms" className="hover:text-white transition-colors underline">Условия использования</Link>
               <Link href="/privacy" className="hover:text-white transition-colors underline">Конфиденциальность</Link>
            </div>
          </div>
          
          <div className="text-[9px] text-zinc-700 uppercase tracking-[0.3em] text-center border-t border-zinc-900 pt-10">
            <p>© 2026 ЦЕНА СЛОВА. Сервис мониторинга личных обязательств.</p>
            <p className="mt-4 opacity-50 italic">Не является азартной игрой, пари или финансовой пирамидой.</p>
            <p className="mt-4">Прием платежей через Robokassa</p>
          </div>
        </footer>
      </main>
    </div>
  );
}