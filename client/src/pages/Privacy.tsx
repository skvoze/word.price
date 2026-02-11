import { Card } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24">
      <h1 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter">Политика конфиденциальности</h1>
      
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 text-zinc-300 rounded-[2rem]">
        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Сбор и обработка данных</h2>
          <p>
            Обработка осуществляется на основании согласия пользователя (ФЗ-152) для исполнения договора. Мы собираем:
          </p>
          <ul className="list-disc ml-5 space-y-1 mt-2">
            <li>Идентификационные данные: Telegram ID, username.</li>
            <li>Технические данные: IP-адрес, тип устройства.</li>
            <li>Данные о транзакциях и реквизиты для вывода средств.</li>
            <li>История выполнения задач и предоставленные отчеты.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Хранение и защита</h2>
          <p>
            Отчеты (фото/скриншоты) хранятся в зашифрованном виде (AES-256) и автоматически удаляются из активной базы через <b>30 дней</b> после завершения задачи. 
            Мы применяем протоколы резервного копирования и разграничения доступа для защиты вашей информации.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Третьи лица и платежи</h2>
          <p>
            Сервис взаимодействует с внешними платежными шлюзами. Мы <b>не храним и не обрабатываем</b> полные данные банковских карт (CVV/пароли). Передача данных партнерам осуществляется исключительно для проведения транзакций в рамках договора.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Права пользователя</h2>
          <p>
            Вы имеете право на запрос копии данных, их исправление или полное удаление. 
            Запрос направляется на email и обрабатывается в течение <b>3 рабочих дней</b>. 
            Удаление персональных данных может привести к невозможности использования баланса и функционала Приложения.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 mt-6">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
            Контакт: cena.slova.help@gmail.com
            <br />
            Последнее обновление: 09.02.2026
          </p>
        </section>
      </Card>
    </div>
  );
}