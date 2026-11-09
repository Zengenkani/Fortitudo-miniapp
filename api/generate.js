import {randomUUID} from 'node:crypto';import {authenticate} from '../backend/auth.mjs';import {body,json} from '../backend/http.mjs';import {getUser,updateUser,redis,prefix} from '../backend/store.mjs';import {generate} from '../backend/ai.mjs';import {validateState} from '../backend/validation.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 let id;try{id=authenticate(req.headers['x-telegram-init-data'],process.env.BOT_TOKEN);}catch{return json(res,401,{error:'Открой приложение через Telegram.'});}
 let input;try{input=body(req);if(input.consent!==true||typeof input.revision!=='string')throw Error();}catch{return json(res,400,{error:'Подтверди отправку анкеты и пожеланий в OpenAI.'});}
 if(!process.env.OPENAI_API_KEY)return json(res,503,{error:'ИИ пока не подключён. Администратору нужно добавить OPENAI_API_KEY в Vercel. Базовый план доступен без ИИ.'});
 try{const user=await getUser(id);if(user.state.revision!==input.revision)return json(res,409,{error:'Анкета изменилась. Перезагрузи приложение.'});const profile=validateState(user.state).profile;if(!profile)return json(res,400,{error:'Сначала сохрани анкету.'});
 const allowed=await redis('EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],86400) end return n",1,`${prefix()}:ai-limit:${id}`);if(allowed>5)return json(res,429,{error:'Лимит: 5 запросов в сутки. Попробуй позже.'});
 const aiPlan=await generate(profile);const saved=await updateUser(id,current=>{if(current.state.revision!==input.revision){const e=Error('Анкета изменилась во время подбора. Попробуй снова.');e.status=409;throw e;}current.state={...current.state,aiPlan,revision:randomUUID()};return current;});return json(res,200,saved.state);
 }catch(e){return json(res,e.status||503,{error:e.status?e.message:'Не удалось составить план с ИИ. Текущий план сохранён; попробуй позже.'});}
}
