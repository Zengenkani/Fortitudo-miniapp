import {randomUUID} from 'node:crypto';
import {redis,prefix,queue,getUser,updateUser,releaseLock} from '../backend/store.mjs';
import {nextReminder} from '../backend/schedule.mjs';
import {send} from '../backend/telegram.mjs';
import {secretMatches,json} from '../backend/http.mjs';
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  if(!process.env.CRON_SECRET||!secretMatches(req.headers.authorization,`Bearer ${process.env.CRON_SECRET}`))return json(res,401,{error:'Unauthorized'});
  const key=prefix()+':cron-lock',owner=randomUUID(),started=Date.now();let locked=false,sent=0;
  try{
    locked=await redis('SET',key,owner,'NX','EX',65)==='OK';if(!locked)return json(res,200,{busy:true});
    const ids=await redis('ZRANGEBYSCORE',queue(),'-inf',Date.now(),'LIMIT',0,25);
    for(const id of ids){if(Date.now()-started>30000)break;const u=await getUser(id),due=u.reminder?.next;if(!due||!u.state.profile)continue;if(due>Date.now())continue;
      // Old reminders are skipped after outages; never send a backlog at night.
      let blocked=false;if(Date.now()-due<=15*60000){try{await send(id,'Время немного подвигаться 🌿 Твоя тренировка ждёт в Fortitudo.');sent++;}catch(e){if(e.code===403)blocked=true;else throw e;}}
      await updateUser(id,current=>{if(current.reminder?.next!==due)return null;if(blocked)current.reminder=null;else current.reminder.next=nextReminder(current.state.profile,current.reminder);return current;});
    }
    return json(res,200,{ok:true,sent});
  }catch{return json(res,503,{error:'Temporary failure',sent});}finally{if(locked)await releaseLock(key,owner).catch(()=>{});}
}
