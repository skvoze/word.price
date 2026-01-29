import { Card } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Политика конфиденциальности</h1>
      <Card className="p-6 space-y-4 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold text-base">1. Сбор данных</h2>
          <p>Мы собираем только общедоступные данные вашего профиля Telegram (ID, имя пользователя) для идентификации вас в системе и связи с ботом-помощником.</p>
        </section>
        
        <section>
          <h2 className="font-semibold text-base">2. Фото и доказательства</h2>
          <p>Изображения, загружаемые в качестве доказательств выполнения задач, хранятся в защищенном облачном хранилище. Они доступны только вам и модератору для подтверждения факта выполнения задачи.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base">3. Платежные данные</h2>
          <p>Мы не храним полные данные ваших банковских карт. Номера карт для вывода средств используются единоразово для совершения перевода через сторонние платежные шлюзы.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base">4. Удаление данных</h2>
          <p>Пользователь может запросить полное удаление своего аккаунта и всех связанных с ним данных, обратившись в службу поддержки через официального бота.</p>
        </section>
      </Card>
    </div>
  );
}