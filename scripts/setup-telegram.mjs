import {telegram,appUrl} from '../backend/telegram.mjs';
const required=['BOT_TOKEN','APP_URL','TELEGRAM_WEBHOOK_SECRET'];
try{
  for(const key of required)if(!process.env[key])throw Error(`Заполни ${key} в .env.local`);
  if(!/^[A-Za-z0-9_-]{32,256}$/.test(process.env.TELEGRAM_WEBHOOK_SECRET))throw Error('TELEGRAM_WEBHOOK_SECRET: 32–256 букв, цифр, _ или -');
  const origin=appUrl();
  const probe=await fetch(origin+'/api/state',{signal:AbortSignal.timeout(15000),redirect:'manual'});
  if(probe.status!==401)throw Error('Сначала опубликуй приложение. /api/state без авторизации должен возвращать 401. Проверь Deployment Protection.');
  const error=await probe.json();if(!error.error?.includes('Telegram'))throw Error('По адресу APP_URL не обнаружен API приложения.');
  const hookProbe=await fetch(origin+'/api/telegram',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Bot-Api-Secret-Token':process.env.TELEGRAM_WEBHOOK_SECRET},body:'{}',signal:AbortSignal.timeout(15000),redirect:'manual'});
  if(hookProbe.status!==400)throw Error('Проверь TELEGRAM_WEBHOOK_SECRET в Vercel: он должен совпадать с локальным значением. Затем выполни Redeploy.');
  const me=await telegram('getMe',{});
  const info=await telegram('getWebhookInfo',{});
  if(info.url&&info.url!==origin+'/api/telegram'&&!process.argv.includes('--replace'))throw Error('У бота уже другой webhook. Для осознанной замены добавь --replace.');
  await telegram('setWebhook',{url:origin+'/api/telegram',secret_token:process.env.TELEGRAM_WEBHOOK_SECRET,allowed_updates:['message'],max_connections:1});
  await telegram('setChatMenuButton',{menu_button:{type:'web_app',text:'Тренировки',web_app:{url:origin}}});
  await telegram('setMyCommands',{commands:[{command:'start',description:'Открыть Fortitudo'},{command:'remind',description:'Напоминания: /remind 19:00 +05:00'},{command:'stop',description:'Отключить напоминания'},{command:'delete_me',description:'Удалить профиль и историю'}]});
  const verified=await telegram('getWebhookInfo',{});if(verified.url!==origin+'/api/telegram')throw Error('Не удалось подтвердить webhook.');
  console.log(`Готово: @${me.username}. Открой бота и отправь /start. Напоминания требуют отдельного планировщика.`);
}catch(e){console.error(e.message?.includes('https://')?'Ошибка соединения; проверь настройки.':e.message);process.exitCode=1;}
