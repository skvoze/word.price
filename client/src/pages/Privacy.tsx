import { Card } from "@/components/ui/card";
import {Link,ArrowLeft} from "lucide-react"

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24 text-zinc-300">
      <Link href="/">
  <button className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group text-sm font-bold uppercase tracking-widest">
    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
    Назад на главную
  </button>
</Link>
      <h1 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter text-white">Политика конфиденциальности</h1>
      
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 rounded-[2rem]">
        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Сбор и обработка данных</h2>
          <p>
            1.1. Обработка осуществляется на основании согласия (ст. 6 ФЗ-152), исполнения договора оферты и требований налогового законодательства РФ (ст. 23 НК РФ).
            <br />
            1.2. Согласие предоставляется путем отметки чекбокса при регистрации/оплате или продолжения использования Приложения.
          </p>
          <ul className="list-disc ml-5 space-y-1 mt-2 text-zinc-400">
            <li><b>Идентификация:</b> Telegram ID, username.</li>
            <li><b>Технические данные:</b> IP-адрес, тип устройства, время активности.</li>
            <li><b>Финансовые данные:</b> история транзакций, сумма, дата, email для чеков.</li>
            <li><b>Контент:</b> фото/видео отчеты, загружаемые для верификации задач.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Хранение и безопасность</h2>
          <p>
            2.1. <b>Сроки:</b> Фото/видео отчеты удаляются через 30 дней после завершения задачи (при отсутствии открытых споров). Финансовые данные хранятся 5 лет в соответствии с законодательством РФ.
            <br />
            2.2. <b>Меры защиты:</b> Использование шифрования данных, протоколов безопасной передачи и ограничение доступа к базе данных.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Третьи лица</h2>
          <p>
            3.1. Для проведения платежей шлюзам передаются только необходимые данные: сумма и email. 
            <b> Полные данные банковских карт (номер, CVV) Исполнителем не запрашиваются и не хранятся.</b>
            <br />
            3.2. Передача данных третьим лицам (кроме платежных систем и случаев, предусмотренных законом РФ) не осуществляется.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Права пользователя и отзыв данных</h2>
          <p>
            4.1. Вы имеете право на получение информации о ваших данных, их исправление или удаление. 
            <br />
            4.2. <b>Порядок:</b> запрос на email <b>cena.slova.help@gmail.com</b>. Срок обработки — до 3 рабочих дней.
            <br />
            4.3. Отзыв согласия или удаление аккаунта влечет прекращение доступа к сервису. При этом Исполнитель сохраняет архивные записи транзакций для отчетности перед государственными органами.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">5. Изменения и инциденты</h2>
          <p>
            5.1. Исполнитель обязуется принимать меры по защите данных и уведомлять пользователей о критических инцидентах безопасности.
            <br />
            5.2. Продолжение использования приложения после изменения текста Политики означает принятие новых условий.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 mt-6 space-y-4">
          <div className="bg-black/20 p-4 rounded-xl space-y-1 font-mono text-[10px] text-zinc-400 uppercase tracking-tight">
            <p>Ответственный: Коновалов Василий Андреевич</p>
            <p>ИНН: 594204795787</p>
            <p>Регион регистрации: Пермский край, г. Пермь</p>
            <p>Email: cena.slova.help@gmail.com</p>
            <p className="mt-2 text-[9px] lowercase italic">Обновлено: 15.02.2026</p>
          </div>
        </section>
      </Card>
    </div>
  );
}