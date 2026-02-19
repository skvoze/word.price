import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown, ArrowRight, ShieldCheck, Mail, User, Send, Wallet } from "lucide-react";

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faq = [
    { 
      q: "Что считается доказательством выполнения?", 
      a: "Фото или видео подтверждение, на котором четко виден результат вашей работы (например, скриншот завершенного проекта, фото из спортзала или выполненный отчет)." 
    },
    { 
      q: "Как происходит возврат средств?", 
      a: "После подтверждения отчета модератором (до 24 часов), сумма возвращается на ваш баланс. Вы можете вывести её на карту за вычетом комиссии платежной системы (5%) или использовать для новой цели." 
    },
    { 
      q: "Каков порядок оспаривания решения?", 
      a: "Если вы не согласны с решением модератора, вы можете подать апелляцию через службу поддержки @cena_slova_help в течение 24 часов после отклонения отчета." 
    },
    { 
      q: "Безопасны ли платежи?", 
      a: "Все транзакции проходят через сертифицированный шлюз Robokassa. Мы не собираем и не храним данные ваших банковских карт." 
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
        <section className="mb-32 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
              <h3 className="text-zinc-500 uppercase font-black text-xs mb-4 tracking-widest">Проблема</h3>
              <p className="text-zinc-400 text-lg leading-tight">
                Обещания самому себе часто ничего не стоят, потому что за их нарушение нет последствий.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl flex flex-col justify-center">
              <h3 className="text-zinc-400 uppercase font-black text-xs mb-4 tracking-widest text-center md:text-left">Решение</h3>
              <p className="text-zinc-900 font-bold text-lg leading-tight text-center md:text-left">
                Мы создаем цену вашего бездействия. Либо результат, либо оплата услуг мониторинга.
              </p>
            </div>
          </div>
        </section>

        

        {/* ——— 3. ПРО ПРОДУКТ ——— */}
        <section className="mb-32 space-y-16">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter">Механика сервиса</h2>
          <div className="grid grid-cols-1 gap-12">
            {[
              { n: "01", t: "Постановка цели", d: "Создайте задачу в мини-приложении, укажите дедлайн и внесите сумму обязательства." },
              { n: "02", t: "Выполнение", d: "Сделайте то, что обещали, и загрузите доказательства (фото/видео) в интерфейс приложения." },
              { n: "03", t: "Проверка", d: "Модератор проверяет отчет в течение 24 часов. Если отчет не предоставлен — сумма удерживается за услуги мониторинга." },
              { n: "04", t: "Результат", d: "При подтверждении сумма возвращается на баланс. Цель достигнута." }
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

        {/* ——— 4. CTA ——— */}
        <section className="text-center mb-40">
          <Button 
            className="w-full max-w-sm bg-white text-black hover:bg-zinc-200 h-16 rounded-2xl font-black text-xl uppercase italic shadow-[0_0_30px_rgba(255,255,255,0.15)] group"
            onClick={() => window.open('https://t.me/cena_slova_task_bot', '_blank')}
          >
            Попробовать сервис
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </section>
{/* ——— 5. ТАРИФЫ И ЦЕНЫ (Новый блок для Робокассы) ——— */}
        <section className="mb-32">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter mb-12">Стоимость услуг</h2>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4 text-white">
                  <Wallet className="w-6 h-6" />
                  <span className="text-2xl font-black uppercase italic">Свободный выбор</span>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  Вы сами определяете сумму финансового обязательства при создании каждой задачи.
                </p>
                <ul className="space-y-3 text-sm font-bold uppercase tracking-tight">
                  <li className="flex justify-between border-b border-zinc-800 pb-2 text-zinc-300">
                    <span>Минимальная сумма</span>
                    <span>100 ₽</span>
                  </li>
                  <li className="flex justify-between border-b border-zinc-800 pb-2 text-zinc-300">
                    <span>Комиссия на вывод</span>
                    <span>5%</span>
                  </li>
                  <li className="flex justify-between text-white pt-2">
                    <span>Верификация отчета</span>
                    <span>0 ₽*</span>
                  </li>
                </ul>
                <p className="mt-4 text-[10px] text-zinc-600 italic">
                  *Услуги мониторинга оплачиваются только в случае невыполнения обязательств в установленный срок.
                </p>
              </div>
              <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700">
                <h4 className="font-bold text-white mb-2 uppercase text-xs tracking-widest">Как работает возврат:</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  При успешном выполнении цели, внесенная сумма остается на вашем балансе. Вы можете использовать её для новой цели или вывести на карту. Срок возврата на карту зависит от вашего банка (обычно от 1 до 3 рабочих дней).
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* ——— 6. FAQ ——— */}
        <section className="mb-40 max-w-2xl mx-auto">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter mb-12">Вопросы  и  ответы</h2>
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
        <footer id="footer" className="border-t border-zinc-900 pt-20 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-end">
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase italic text-sm tracking-widest">Контакты и поддержка</h4>
              <div className="space-y-4 text-sm text-zinc-400 font-medium">
                <div className="flex items-center gap-3">
                  <Send className="w-4 h-4 text-zinc-600" /> 
                  <a href="https://t.me/cena_slova_help" className="hover:text-white transition-colors">Telegram: @cena_slova_help</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-zinc-600" />
                  <a href="mailto:cena.slova.help@gmail.com" className="hover:text-white transition-colors">cena.slova.help@gmail.com</a>
                </div>
                <div className="pt-4 border-t border-zinc-900/50">
                  <div className="text-xs text-zinc-500 mb-1 tracking-wider uppercase font-bold flex items-center gap-2">
                    <User className="w-3 h-3" /> Самозанятый Коновалов В.А.
                  </div>
                  <div className="text-xs text-zinc-500 tracking-wider font-bold flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> ИНН 594204795787
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:items-end gap-3 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 justify-end">
               <Link href="/terms" className="hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Пользовательское соглашение (Оферта)</Link>
               <Link href="/privacy" className="hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Политика конфиденциальности</Link>
               <Link href="/refund" className="hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Политика возврата средств</Link>
               <p className="mt-4 text-zinc-700 text-right max-w-[220px]">Ответ на обращения в поддержку: до 24 часов.</p>
            </div>
          </div>
          
          <div className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] text-center border-t border-zinc-900 pt-10 space-y-4">
            <p className="text-zinc-400">© 2026 ЦЕНА СЛОВА. Все права защищены.</p>
            <p className="italic text-zinc-600 lowercase">сервис не является азартной игрой, пари или финансовой пирамидой.</p>
            <div className="flex justify-center items-center gap-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 scale-90">
                <img src="https://img.icons8.com/color/48/visa.png" className="h-5" alt="visa" />
                <img src="https://img.icons8.com/color/48/mastercard.png" className="h-5" alt="mc" />
                <img src="https://img.icons8.com/color/48/mir.png" className="h-5" alt="mir" />
                <img src="https://raw.githubusercontent.com/Anatoly-Semenov/legal-icons/main/sbp.png" className="h-4 brightness-200" alt="sbp" />
            </div>
            
            <p className="font-bold text-zinc-400 tracking-[0.5em]">Прием платежей через Robokassa</p>
          </div>
        </footer>
      </main>
    </div>
  );
}