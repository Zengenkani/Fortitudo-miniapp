import {createHmac,timingSafeEqual} from 'node:crypto';
export function authenticate(raw,token,now=Date.now()){
  if(!token||typeof raw!=='string')throw Error('Unauthorized');
  const params=new URLSearchParams(raw),hash=params.get('hash');
  if(!hash||! /^[a-f0-9]{64}$/i.test(hash))throw Error('Unauthorized');
  params.delete('hash');
  const seen=new Set();for(const [k] of params){if(seen.has(k))throw Error('Unauthorized');seen.add(k);}
  const check=[...params].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
  const secret=createHmac('sha256','WebAppData').update(token).digest();
  const expected=createHmac('sha256',secret).update(check).digest();
  if(!timingSafeEqual(expected,Buffer.from(hash,'hex')))throw Error('Unauthorized');
  const time=Number(params.get('auth_date'));if(!Number.isFinite(time)||now/1000-time>86400||time-now/1000>60)throw Error('Unauthorized');
  const user=JSON.parse(params.get('user')||'null');if(!Number.isSafeInteger(user?.id)||user.id<=0)throw Error('Unauthorized');return String(user.id);
}
