import { Card } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24">
      <h1 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter">Политика конфиденциальности</h1>
      
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 text-zinc-300 rounded-[2rem]">
        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Сбор и обработка данных</h2>
          <p>
            1.1. Обработка персональных данных осуществляется на основании согласия Пользователя (ст. 6 п. 1 а ФЗ-152) и необходимости исполнения договора оферты (ст. 6 п. 1 б ФЗ-152).
          </p>
          <p className="mt-2 text-zinc-400 font-medium">Категории собираемых данных:</p>
          <ul className="list-disc ml-5 space-y-1 mt-1 text-zinc-300">
            <li><b>Идентификационные:</b> Telegram ID, имя пользователя (username).</li>
            <li><b>Технические:</b> IP-адрес, тип устройства, версия ПО, геолокация (при предоставлении).</li>
            <li><b>Финансовые:</b> реквизиты для вывода средств, история транзакций.</li>
            <li><b>Контентные:</b> фото, видео, скриншоты, загруженные для верификации задач.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Хранение и защита</h2>
          <p>
            2.1. <b>Сроки хранения:</b>
            <ul className="list-disc ml-5 mt-1">
              <li>Контентные отчеты — 30 дней после завершения задачи.</li>
              <li>Финансовые данные и история транзакций — не менее 5 лет согласно налоговому законодательству РФ.</li>
              <li>Идентификационные данные — до момента удаления аккаунта.</li>
            </ul>
          </p>
          <p className="mt-2">
            2.2. Мы используем шифрование AES-256, регулярное резервное копирование и строгий протокол контроля доступа сотрудников к базе данных.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Передача третьим лицам</h2>
          <p>
            3.1. Передача данных партнерам (платежным шлюзам) осуществляется исключительно для проведения транзакций. Используемые шлюзы сертифицированы по стандарту PCI DSS.
            <br />
            3.2. <b>Трансграничная передача:</b> данные могут передаваться партнерам вне РФ только в страны, обеспечивающие адекватную защиту прав субъектов персональных данных (ст. 12 ФЗ-152).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Права пользователя</h2>
          <p>
            4.1. Вы имеете право отозвать согласие, запросить копию своих данных или их удаление. 
            <br />
            4.2. Запросы обрабатываются в течение <b>3 рабочих дней</b> через email. 
            <br />
            4.3. Удаление данных ведет к прекращению доступа к сервису и аннулированию невыведенного остатка на балансе.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 mt-6 space-y-4">
          <div className="bg-black/20 p-4 rounded-xl space-y-1 font-mono text-[10px] text-zinc-400 uppercase tracking-tight">
            <p>Ответственный: Коновалов В. А.</p>
            <p>Email: cena.slova.help@gmail.com</p>
            <p>ИНН: 594204795787</p>
            <p>Версия: 2.0 от 11.02.2026</p>
          </div>
          <p className="text-[10px] text-zinc-500 italic leading-tight">
            Продолжая использовать Приложение, вы подтверждаете ознакомление и полное согласие с настоящей Политикой.
          </p>
        </section>
      </Card>
    </div>
  );
}