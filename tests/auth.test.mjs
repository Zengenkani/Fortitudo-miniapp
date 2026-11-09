import test from 'node:test';import assert from 'node:assert/strict';import{createHmac}from'node:crypto';import{authenticate}from'../backend/auth.mjs';
const token='test-token',now=1800000000000;function sign(age=0){const p=new URLSearchParams({auth_date:String(now/1000-age),user:JSON.stringify({id:123})});const data=[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');p.set('hash',createHmac('sha256',createHmac('sha256','WebAppData').update(token).digest()).update(data).digest('hex'));return p.toString();}
test('Valid Telegram signature identifies user',()=>assert.equal(authenticate(sign(),token,now),'123'));
test('Rejects tampering, expired sessions and wrong bot',()=>{assert.throws(()=>authenticate(sign().replace('123','456'),token,now));assert.throws(()=>authenticate(sign(90000),token,now));assert.throws(()=>authenticate(sign(),'other-token',now));assert.throws(()=>authenticate('',token,now));});

