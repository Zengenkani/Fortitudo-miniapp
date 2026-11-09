import {randomUUID} from 'node:crypto';
import {authenticate} from '../backend/auth.mjs';
import {getUser,updateUser} from '../backend/store.mjs';
import {validateState} from '../backend/validation.mjs';
import {nextReminder} from '../backend/schedule.mjs';
import {body,json} from '../backend/http.mjs';
export default async function handler(req,res){
  if(!['GET','PUT'].includes(req.method))return json(res,405,{error:'Method not allowed'});
  let id;try{id=authenticate(req.headers['x-telegram-init-data'],process.env.BOT_TOKEN);}catch{return json(res,401,{error:'Открой приложение заново через Telegram.'});}
  let input;if(req.method==='PUT'){try{input=validateState(body(req));}catch{return json(res,400,{error:'Проверь параметры анкеты.'});}}
  try{if(req.method==='GET')return json(res,200,(await getUser(id)).state);
    const user=await updateUser(id,u=>{if(u.state.revision!==input.revision){const e=Error('Conflict');e.conflict=true;throw e;}u.state={...input,revision:randomUUID()};if(!input.profile)u.reminder=null;else if(u.reminder)u.reminder.next=nextReminder(input.profile,u.reminder);return u;});
    return json(res,200,user.state);
  }catch(e){return json(res,e.conflict?409:503,{error:e.conflict?'Профиль изменён в другой сессии. Перезагрузи приложение.':'Хранилище временно недоступно. Повтори попытку.'});}
}
