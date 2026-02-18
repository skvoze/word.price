import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, ShieldCheck, Zap, MessageCircle, ArrowRight, HelpCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-white selection:text-black">
      
      {/* 1. HEADER & HERO (Заголовок) */}
      <header className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">
          Productivity Tool 2026
        </div>
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 leading-[0.85]">
          Цена <br /> Слова
        </h1>
        <p className="text-xl md:text-2xl font-bold text-zinc-500 uppercase tracking-tight max-w-xl">
          Сервис мониторинга личных целей через финансовую ответственность
        </p>
        
        <div className="mt-10 w-full max-w-xs">
          <Button 
            className="w-full bg-white text-black hover:bg-zinc-200 h-16 rounded-2xl font-black text-xl uppercase italic shadow-[0_0_30px_rgba(255,255,255,0.15)] group"
            onClick={() => window.open('https://t.me/your_bot_link', '_blank')}
          >
            Начать в Telegram
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </header>

      {/* 2. БОЛИ (Зачем мне это?) */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black uppercase italic leading-none">Почему мы <br /> прокрастинируем?</h2>
            <p className="text-zinc-400 leading-relaxed">
              Мозг всегда выбирает легкий путь. Обещание самому себе «начать с понедельника» не имеет веса, потому что за его нарушение нет последствий.
            </p>
          </div>
          <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-widest">Мы решаем это:</h3>
            <ul className="space-y-3 text-zinc-400 text-sm italic">
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-white shrink-0" /> Цена слова создает реальный риск.</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-white shrink-0" /> Финансовый рычаг запускает дисциплину.</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-white shrink-0" /> Результат становится неизбежным.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. КАК ЭТО РАБОТАЕТ (Про продукт + Юзер Флоу) */}
      <section className="bg-zinc-900/30 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-center text-4xl font-black uppercase italic mb-16 tracking-tighter text-white">4 шага к результату</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { t: "Постановка", d: "Опишите цель в боте, выберите дедлайн и сумму предоплаты." },
              { t: "Аванс", d: "Внесите предоплату за услуги верификации через Robokassa." },
              { t: "Действие", d: "Выполните задачу и загрузите фото/видео отчет до дедлайна." },
              { t: "Возврат", d: "Мы проверяем отчет и возвращаем сумму на ваш баланс." }
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="text-5xl font-black text-zinc-800 mb-4 group-hover:text-zinc-700 transition-colors">0{i+1}</div>
                <h4 className="font-bold uppercase text-white mb-2">{step.t}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. ТАРИФЫ И ВЫВОД (Требование Алисы №3) */}
      <section className="max-w-4xl mx-auto px-6 py-24 border-b border-zinc-900">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-[2rem] overflow-hidden">
          <div className="p-8 border-b border-zinc-800 bg-zinc-900/50">
            <h3 className="text-xl font-bold uppercase italic text-white">Условия и комиссии</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="text-white font-bold">Внесение предоплаты</div>
              <p className="text-zinc-500 text-xs">Вы сами выбираете сумму (от 100 ₽). При выполнении задачи она возвращается в полном объеме.</p>
            </div>
            <div className="space-y-2">
              <div className="text-white font-bold font-mono">Сервисный сбор — 5%</div>
              <p className="text-zinc-500 text-xs">Взимается только при выводе средств с баланса на карту. Покрывает расходы на транзакции.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. БЕЗОПАСНОСТЬ (Требование Алисы №6) */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center gap-12 mb-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
           {/* Сюда можно вставить логотипы платежных систем */}
           <ShieldCheck className="w-12 h-12" />
           <Zap className="w-12 h-12" />
           <ShieldCheck className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-bold uppercase mb-4 text-white">Безопасность платежей</h3>
        <p className="text-zinc-500 text-sm max-w-2xl mx-auto leading-relaxed">
          Все платежи проходят через защищенный шлюз <strong>Robokassa</strong>. Мы не храним и не обрабатываем данные ваших банковских карт. 
          Соединение защищено сертификатом SSL (AES-256).
        </p>
      </section>

      {/* 6. FAQ (Коротко) */}
      <section className="max-w-2xl mx-auto px-6 py-20">
         <h2 className="text-2xl font-black uppercase italic mb-8 text-center">FAQ</h2>
         <div className="space-y-6">
            {[
              { q: "Что считается доказательством?", a: "Фото или видео, на котором зафиксирован результат выполнения вашей задачи." },
              { q: "Как вернуть средства?", a: "После проверки отчета сумма размораживается и доступна для вывода или новой задачи." },
              { q: "А если я не успел?", a: "Предоплата удерживается в качестве оплаты услуг сервиса по мониторингу." }
            ].map((item, i) => (
              <div key={i} className="border-b border-zinc-900 pb-6">
                <div className="font-bold text-white mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-zinc-600" /> {item.q}
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
         </div>
      </section>

      {/* 7. FOOTER (Юридический блок) */}
      <footer className="bg-black py-20 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 text-center md:text-left grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h4 className="text-white font-black italic uppercase">Цена Слова</h4>
            <p className="text-zinc-600 text-[10px] leading-relaxed uppercase tracking-widest">
              Сервис обеспечения личных обязательств. <br /> Не является азартной игрой или пари.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Документы</h4>
            <Link href="/terms" className="text-xs text-zinc-400 hover:text-white underline decoration-zinc-800">Условия использования</Link>
            <Link href="/privacy" className="text-xs text-zinc-400 hover:text-white underline decoration-zinc-800">Политика конфиденциальности</Link>
            <Link href="/contacts" className="text-xs text-zinc-400 hover:text-white underline decoration-zinc-800">Контакты и поддержка</Link>
          </div>
          <div className="space-y-4 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            <p>© 2026 PRICE OF WORD</p>
            <p>Самозанятый Коновалов В.А.</p>
            <p>ИНН 594204795787</p>
            <p>Support: <span className="text-zinc-400 font-mono">cena.slova.help@gmail.com</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}