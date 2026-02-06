import { Card } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24">
      <h1 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter">Политика конфиденциальности</h1>
      
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 text-zinc-300 rounded-[2rem]">
        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Обработка персональных данных</h2>
          <p>
            Используя Сервис, вы даете добровольное согласие на обработку следующих данных: 
            публичного идентификатора Telegram ID, имени пользователя (username) и технических 
            параметров, передаваемых через Telegram Web App API. 
          </p>
          <p className="mt-2 text-zinc-400 text-xs">
            Обработка данных осуществляется в соответствии с требованиями Федерального закона 
            №152-ФЗ «О персональных данных». Цель сбора — идентификация пользователя в системе 
            и исполнение договора оферты.
          </p>
        </section>
        
        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Контент и защита данных</h2>
          <p>
            Фотоизображения и отчеты, загружаемые для верификации задач, хранятся в 
            защищенном хранилище с применением стандарта шифрования <b>AES-256</b>. 
            Контент используется исключительно для модерации и автоматически удаляется из 
            активной базы после успешного подтверждения выполнения цели.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Безопасность платежей</h2>
          <p>
            Все платежные операции проводятся на стороне платежного агрегатора ЮKassa. 
            Сервис не получает и не хранит данные ваших карт (номер, CVV). 
            Платежный партнер сертифицирован по международному стандарту <b>PCI DSS</b>, 
            что гарантирует максимальную защиту ваших финансовых данных.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Ваши права и удаление данных</h2>
          <p>
            Вы имеете право запросить копию своих данных или их полное удаление. 
            Для отзыва согласия на обработку данных и деактивации аккаунта направьте 
            запрос на электронную почту. Запросы обрабатываются в течение <b>3 рабочих дней</b>. 
            Удаление аккаунта влечет за собой прекращение доступа к балансу и истории задач.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 mt-6">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
            Контакт для связи: cena.slova.help@gmail.com
            <br />
            Последнее обновление: 06.02.2026
          </p>
        </section>
      </Card>
    </div>
  );
}