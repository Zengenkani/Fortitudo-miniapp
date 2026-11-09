import {randomUUID} from 'node:crypto';
export const empty=()=>({profile:null,history:{},revision:'0'});
export function prefix(){return process.env.REDIS_PREFIX||'fortitudo-prod';}
export const queue=()=>prefix()+':due';
export async function redis(...command){
  const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url?.startsWith('https://')||!token)throw Error('Database not configured');
  const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Error('Database unavailable');const data=await r.json();if(data.error)throw Error('Database command failed');return data.result;
}
export async function getUser(id){const raw=await redis('GET',`${prefix()}:user:${id}`);return raw?JSON.parse(raw):{state:empty(),version:'0',reminder:null};}
// Compare-and-set atomically updates the profile and its scheduled notification.
export const CAS=`local old=redis.call('GET',KEYS[1]); local v='0'; if old then v=cjson.decode(old).version end; if v~=ARGV[1] then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); if ARGV[3]=='' then redis.call('ZREM',KEYS[2],ARGV[4]) else redis.call('ZADD',KEYS[2],ARGV[3],ARGV[4]) end; return 1`;
export async function updateUser(id,change){for(let n=0;n<4;n++){const previous=await getUser(id);const next=await change(structuredClone(previous));if(!next)return previous;next.version=randomUUID();const ok=await redis('EVAL',CAS,2,`${prefix()}:user:${id}`,queue(),previous.version,JSON.stringify(next),next.reminder?.next??'',id);if(ok===1)return next;}throw Error('Concurrent update; retry');}
export async function releaseLock(key,value){return redis('EVAL',"if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0",1,key,value);}
