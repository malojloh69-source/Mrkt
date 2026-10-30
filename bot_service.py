"""Telegram Bot API control panel. Does not accept account login codes/passwords."""
import logging
import threading
import requests

log=logging.getLogger(__name__)

class TelegramBot:
    def __init__(self, settings, store, collector, request=requests.post):
        self.settings=settings;self.store=store;self.collector=collector;self.request=request
        self.stop_event=threading.Event();self.thread=None

    def call(self, method, payload):
        response=self.request(f'https://api.telegram.org/bot{self.settings.bot_token}/{method}',json=payload,timeout=(10,40))
        try:
            response.raise_for_status();data=response.json()
            if not data.get('ok'):
                raise RuntimeError('Telegram rejected '+method)
            return data.get('result')
        finally:
            response.close()

    def send(self, chat, text, buttons=None):
        payload={'chat_id':chat,'text':text}
        if buttons:
            payload['reply_markup']={'inline_keyboard':buttons}
        return self.call('sendMessage',payload)

    def admin(self, user_id):
        return self.settings.admin_id>0 and user_id==self.settings.admin_id

    def menu(self, chat, user):
        buttons=[]
        if self.settings.domain:
            buttons.append([{'text':'Открыть миниапп','web_app':{'url':self.settings.domain}}])
            buttons.append([{'text':'Каталог API','web_app':{'url':self.settings.domain+'/catalog'}}])
        if self.admin(user):
            buttons += [[{'text':'Статус','callback_data':'sync:status'},{'text':'Подключение API','callback_data':'sync:setup'}],
                        [{'text':'Запустить','callback_data':'sync:on'},{'text':'Остановить','callback_data':'sync:off'}],
                        [{'text':'Обновить каталог','callback_data':'sync:refresh'}]]
            if self.settings.domain:
                buttons.append([{'text':'Панель синхронизации','web_app':{'url':self.settings.domain+'/admin'}}])
            copy='Настройки синхронизации публичного каталога. Вход в пользовательский аккаунт Telegram здесь не используется.'
        else:
            copy='Настройки доступны владельцу. Узнайте свой ID командой /id и укажите его в ADMIN_TELEGRAM_ID на Bothost.'
        self.send(chat,copy,buttons)

    def handle(self, update):
        message=update.get('message') or {}
        chat=message.get('chat') or {}
        if message and chat.get('type')=='private':
            command=((message.get('text') or '').split(maxsplit=1) or [''])[0].split('@')[0].lower()
            user=(message.get('from') or {}).get('id')
            if command=='/start':
                buttons=[]
                if self.settings.domain:
                    buttons=[[{'text':'Открыть миниапп','web_app':{'url':self.settings.domain}}],
                             [{'text':'Каталог API','web_app':{'url':self.settings.domain+'/catalog'}}]]
                self.send(chat['id'],'Добро пожаловать! Это независимое приложение для просмотра подарков. '+('Откройте миниапп кнопкой ниже.' if buttons else 'Включите «Использовать домен» в Bothost и перезапустите приложение.'),buttons)
            elif command=='/id':
                self.send(chat['id'],f'Ваш Telegram ID: {user}')
            elif command=='/clezzy1488':
                self.menu(chat['id'],user)
            elif command=='/help':
                self.send(chat['id'],'/start — миниапп\n/id — ваш ID\nПлатежи и вход в аккаунт Telegram не подключены.')
        callback=update.get('callback_query')
        if not callback:
            return
        uid=(callback.get('from') or {}).get('id')
        cbchat=(callback.get('message') or {}).get('chat') or {}
        if not self.admin(uid) or cbchat.get('type')!='private':
            self.call('answerCallbackQuery',{'callback_query_id':callback['id'],'text':'Доступ только владельцу','show_alert':True});return
        action=callback.get('data')
        self.call('answerCallbackQuery',{'callback_query_id':callback['id']})
        if action=='sync:setup':
            self.send(cbchat['id'],'Добавьте SWIFT_API_KEY в переменные окружения Bothost и перезапустите приложение. Ключ выдаёт провайдер API. Номер телефона, код Telegram и пароль 2FA не нужны.')
        elif action=='sync:status':
            s=self.collector.status();catalog=s['catalog']
            self.send(cbchat['id'],f"API: {'настроен' if s['configured'] else 'не подключён'}\nСбор: {'включён' if s['enabled'] else 'остановлен'}\nНаблюдено объявлений: {catalog.get('observed_count',0)}\nПолный обход: {'да' if catalog.get('complete') else 'не подтверждён'}\nСостояние: {s['last_error'] or 'ошибок нет'}\nИгровой сервер MRKT не подключён.")
        elif action in ('sync:on','sync:off','sync:refresh'):
            try:
                self.collector.set_enabled(action!='sync:off')
                self.send(cbchat['id'],'Сбор остановлен.' if action=='sync:off' else 'Сбор запущен. Результат будет доступен в статусе.')
            except ValueError as e:
                self.send(cbchat['id'],str(e))

    def start(self):
        if not self.settings.bot_token or self.thread:
            return
        self.thread=threading.Thread(target=self._poll,daemon=True);self.thread.start()

    def _poll(self):
        delay=2
        while not self.stop_event.is_set():
            try:
                self.call('deleteWebhook',{'drop_pending_updates':False})
                self.call('setMyCommands',{'commands':[{'command':'start','description':'Открыть миниапп'},{'command':'help','description':'Помощь'},{'command':'id','description':'Ваш Telegram ID'}]})
                break
            except (requests.RequestException,RuntimeError,ValueError):
                log.warning('Telegram setup unavailable; retrying without logging credentials')
                if self.stop_event.wait(delay):return
                delay=min(delay*2,60)
        offset=int(self.store.get('telegram_offset',0))
        while not self.stop_event.is_set():
            try:
                updates=self.call('getUpdates',{'offset':offset,'timeout':25,'allowed_updates':['message','callback_query']})
                for update in updates or []:
                    uid=update['update_id']
                    if not self.store.update_done(uid):
                        self.handle(update);self.store.mark_update(uid)
                    offset=max(offset,uid+1);self.store.set('telegram_offset',offset)
                delay=2
            except (requests.RequestException,RuntimeError,ValueError,KeyError,TypeError):
                log.warning('Telegram polling interrupted; retrying')
                self.stop_event.wait(delay);delay=min(delay*2,60)

    def close(self):
        self.stop_event.set()
