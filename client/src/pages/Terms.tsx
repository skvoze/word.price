import { Card } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24">
      <h1 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter">Публичная оферта</h1>
      
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 text-zinc-300 rounded-[2rem]">
        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Общие положения</h2>
          <p>
            Настоящий документ является публичной офертой сервиса Цена Слова. 
            Использование Приложения, регистрация в нем или пополнение баланса является 
            <b> полным и безоговорочным акцептом</b> (принятием) условий данного соглашения.
          </p>
        </section>
        
        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Предмет договора</h2>
          <p>
            Исполнитель предоставляет доступ к интерфейсу для планирования задач и мониторинга 
            продуктивности. Пользователь вносит гарантийный платеж (залог) в качестве 
            подтверждения серьезности намерения выполнить поставленную цель.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Финансовые условия</h2>
          <p>
            3.1. Пополнение осуществляется через агрегатор ЮKassa. 
            <br />
            3.2. При выводе средств удерживается <b>комиссия 5%</b> на покрытие расходов эквайринга.
            <br />
            3.3. В случае невыполнения задачи в срок, сумма залога в полном объеме признается 
            стоимостью услуг Исполнителя по техническому сопровождению и контролю невыполненной цели.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Порядок вывода и ответственность</h2>
          <p>
            4.1. Вывод средств осуществляется в течение 24 часов после верификации задачи модератором.
            <br />
            4.2. <b>Ответственность за корректность реквизитов лежит на Пользователе.</b> Исполнитель 
            не несет ответственности за задержки, возникшие на стороне банков или платежных шлюзов.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">5. Разрешение споров</h2>
          <p>
            Все споры решаются путем переговоров через электронную почту поддержки. 
            При невозможности достижения согласия, спор подлежит рассмотрению в суде по месту нахождения Исполнителя.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 mt-8">
          <h2 className="font-semibold text-base text-white mb-3">6. Реквизиты</h2>
          <div className="bg-black/20 p-4 rounded-xl space-y-1 font-mono text-[11px]">
            <p>Статус: Самозанятый Коновалов Василий Андреевич</p>
            <p>ИНН: 594204795787</p>
            <p>Email: cena.slova.help@gmail.com</p>
            <p className="mt-4 text-zinc-500 italic">
              Платежи обрабатываются ЮKassa (ООО НКО «ЮМани»). Карты РФ, СБП.
            </p>
          </div>
        </section>
      </Card>
    </div>
  );
}