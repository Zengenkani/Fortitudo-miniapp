import {randomUUID} from 'node:crypto';
import {redis,prefix,updateUser,releaseLock,empty} from '../backend/store.mjs';
import {parseReminder,nextReminder} from '../backend/schedule.mjs';
import {send} from '../backend/telegram.mjs';
import {body,json,secretMatches} from '../backend/http.mjs';
export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  if(!secretMatches(req.headers['x-telegram-bot-api-secret-token'],process.env.TELEGRAM_WEBHOOK_SECRET))return json(res,401,{error:'Unauthorized'});
  let update;try{update=body(req);if(!Number.isSafeInteger(update.update_id))throw Error();}catch{return json(res,400,{error:'Invalid update'});}
  const m=update.message;if(m?.chat?.type!=='private'||!Number.isSafeInteger(m.from?.id)||m.from.id!==m.chat.id)return json(res,200,{ok:true});
  const key=`${prefix()}:update:${update.update_id}`,lock=key+':lock',owner=randomUUID();let locked=false;
  try{
    if(await redis('GET',key))return json(res,200,{ok:true});
    locked=await redis('SET',lock,owner,'NX','EX',65)==='OK';if(!locked)return json(res,503,{error:'Processing'});
    const id=String(m.from.id),text=(m.text||'').replace(/^(\/\w+)@\w+/, '$1');let reply='Fortitudo — тренировки в твоём темпе. Открой приложение и заполни анкету.\n\n/remind 19:00 +05:00 — напоминать в дни тренировок\n/stop — отключить напоминания\n/delete_me — удалить профиль и историю';
    if(text==='/delete_me'){await updateUser(id,()=>({state:{...empty(),revision:randomUUID()},reminder:null}));reply='Профиль, история и напоминания удалены. Закрой приложение, если оно открыто.';}
    else if(text==='/stop'){await updateUser(id,u=>({...u,reminder:null}));reply='Напоминания отключены.';}
    else if(text.startsWith('/remind')){const reminder=parseReminder(text);if(!reminder)reply='Формат: /remind 19:00 +05:00 — время и смещение от UTC.';else {const user=await updateUser(id,u=>{if(!u.state.profile)return null;return {...u,reminder:{...reminder,next:nextReminder(u.state.profile,reminder)}};});reply=user.state.profile?`Напоминания настроены на ${reminder.time} в выбранные дни. /stop — отключить.`:'Сначала заполни анкету в приложении.';}}
    await send(id,reply);await redis('SET',key,'done','EX',604800);return json(res,200,{ok:true});
  }catch{return json(res,503,{error:'Temporary failure'});}finally{if(locked)await releaseLock(lock,owner).catch(()=>{});}
}
