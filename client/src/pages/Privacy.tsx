import { Card } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24">
      <h1 className="text-2xl font-bold mb-6">Политика конфиденциальности</h1>
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 text-zinc-300">
        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Обработка персональных данных</h2>
          <p>
            Использование Сервиса означает ваше согласие на обработку технических данных: 
            публичного идентификатора Telegram ID, имени пользователя (username) и данных, 
            передаваемых через Telegram Web App API. Эти данные необходимы исключительно 
            для функционирования вашего аккаунта.
          </p>
        </section>
        
        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Контент пользователя</h2>
          <p>
            Фотоизображения и текстовые отчеты, загружаемые в качестве доказательств 
            выполнения задач, хранятся в зашифрованном виде. Мы не передаем ваш контент 
            третьим лицам и не используем его в рекламных целях. Доступ к ним имеет 
            только ограниченный круг модераторов для верификации выполнения условий залога.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Безопасность платежей</h2>
          <p>
            Все платежные операции проходят на стороне защищенного платежного шлюза (ЮKassa). 
            Сервис не получает, не обрабатывает и не хранит данные ваших банковских карт 
            (номер, срок действия, CVV). Для вывода средств используются только реквизиты, 
            явно указанные пользователем в защищенной форме.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Хранение и удаление</h2>
          <p>
            Данные хранятся до тех пор, пока ваш аккаунт активен. Вы имеете право на 
            отзыв согласия и полное удаление истории задач и финансовых операций. 
            Для этого направьте запрос на нашу электронную почту.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 mt-6">
          <p className="text-zinc-500 text-xs italic">
            Контакт для связи по вопросам данных: <b>cena.slova.support@gmail.com</b>
            <br />
            Редакция от: {new Date().toLocaleDateString()}
          </p>
        </section>
      </Card>
    </div>
  );
}