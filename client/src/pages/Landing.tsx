import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown, ArrowRight, ShieldCheck, Mail, User, Layout } from "lucide-react";

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faq = [
    { q: "Что считается доказательством выполнения?", a: "Фото или видео подтверждение, на котором четко виден результат вашей работы. Это может быть скриншот завершенного проекта, фото из спортзала или любой другой визуальный отчет." },
    { q: "Как происходит проверка и возврат средств?", a: "После загрузки отчета в мини-приложении, наша команда проверяет его в течение 24 часов. При подтверждении честности выполнения сумма предоплаты мгновенно возвращается на ваш внутренний баланс." },
    { q: "Почему удерживается 5% при выводе?", a: "Эта комиссия покрывает операционные расходы платежных систем на обработку транзакций и перевод средств на вашу карту." },
    { q: "Что если я не успею загрузить отчет в срок?", a: "Если дедлайн истек, а доказательства не были предоставлены в мини-приложении, услуги мониторинга считаются оказанными, и предоплата удерживается сервисом." }
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
            Сервис контроля личных целей через финансовую ответственность
          </p>
        </section>

        {/* ——— 2. БОЛИ ——— */}
        <section className="mb-32 space-y-12">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter">В чем проблема?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
              <p className="text-zinc-400 text-lg leading-tight italic">
                «Обещания самому себе часто ничего не стоят, потому что за их нарушение нет последствий. Мы привыкли договариваться с собой и откладывать жизнь на потом».
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl flex flex-col justify-center shadow-2xl">
              <p className="text-zinc-900 font-bold text-lg leading-tight">
                Мы создаем цену вашего бездействия. <br />
                Используйте финансовый рычаг, чтобы дисциплина работала на вас.
              </p>
            </div>
          </div>
        </section>

        {/* ——— 3. ПРО ПРОДУКТ ——— */}
        <section className="mb-32 space-y-16">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter">Как это работает</h2>
          <div className="grid grid-cols-1 gap-12">
            {[
              { n: "01", t: "Постановка цели", d: "Опишите задачу в мини-приложении, установите дедлайн и внесите предоплату за услуги мониторинга." },
              { n: "02", t: "Выполнение", d: "Работайте над целью. В любой момент до истечения срока загрузите фото или видео отчет прямо в интерфейс приложения." },
              { n: "03", t: "Верификация", d: "Модератор проверяет отчет в течение 24 часов. Если отчет не предоставлен в срок — услуги мониторинга считаются оказанными." },
              { n: "04", t: "Результат", d: "При подтверждении выполнения сумма предоплаты возвращается на ваш баланс. Вы достигли цели и сохранили бюджет." }
            ].map((step, i) => (
              <div key={i} className="flex gap-6 items-start border-l border-zinc-800 pl-8 relative group">
                <div className="absolute -left-3 top-0 w-6 h-6 bg-zinc-950 border-2 border-zinc-800 group-hover:border-white transition-colors rounded-full flex items-center justify-center text-[10px] font-bold">
                  {step.n}
                </div>
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
            className="w-full max-w-sm bg-white text-black hover:bg-zinc-200 h-16 rounded-2xl font-black text-xl uppercase italic shadow-[0_0_30px_rgba(255,255,255,0.1)] group"
            onClick={() => window.open('https://t.me/cena_slova_task_bot', '_blank')}
          >
            Начать в Telegram
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-[0.2em]">
              Работает внутри Telegram Mini Apps
            </p>
            <div className="flex gap-4 opacity-20">
              <ShieldCheck className="w-5 h-5" />
              <Layout className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* ——— 5. FAQ (Аккордеон) ——— */}
        <section className="mb-40">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter mb-12">Вопросы и ответы</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
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
                  <div className="px-6 pb-6 text-zinc-400 text-sm leading-relaxed border-t border-zinc-900 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ——— ФУТЕР (Контакты и Реквизиты) ——— */}
        <footer className="border-t border-zinc-900 pt-20 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-start">
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase italic tracking-widest text-sm">Поддержка</h4>
              <div className="space-y-4 text-xs text-zinc-500 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-zinc-700" /> cena.slova.help@gmail.com
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-zinc-700" /> Самозанятый Коновалов В.А.
                </div>
                <div className="flex items-center gap-3">
                   <ShieldCheck className="w-4 h-4 text-zinc-700" /> ИНН 594204795787
                </div>
              </div>
            </div>
            <div className="flex flex-col md:items-end gap-4 text-[10px] uppercase font-black tracking-[0.2em] text-zinc-600">
               <Link href="/terms" className="hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Условия использования</Link>
               <Link href="/privacy" className="hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Конфиденциальность</Link>
            </div>
          </div>
          
          <div className="text-[9px] text-zinc-800 uppercase tracking-[0.4em] text-center border-t border-zinc-900 pt-10">
            <p>© 2026 ЦЕНА СЛОВА. Все права защищены.</p>
            <p className="mt-4 opacity-50">Платежи защищены Robokassa. Мы не храним данные ваших карт.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}