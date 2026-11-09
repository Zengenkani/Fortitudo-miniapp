import test from 'node:test';import assert from 'node:assert/strict';import {makePlan,weekStart} from '../web/plan.mjs';
const p={age:25,limits:false,days:[0,2,4],goal:'habit',level:'start',equipment:'home',duration:35};
test('Plan respects days, duration and equipment',()=>{const a=makePlan(p);assert.equal(a.filter(d=>d.type==='strength').length,3);assert.equal(a.reduce((n,d)=>n+d.minutes,0),105);assert.equal(a[1].type,'rest');assert.ok(makePlan({...p,equipment:'gym'})[0].exercises.some(x=>x[0]==='Жим ногами'));});
test('Restrictions and invalid parameters block generation',()=>{for(const patch of [{limits:true},{age:17},{age:65},{days:[]},{days:[8]},{equipment:'bad'}])assert.throws(()=>makePlan({...p,...patch}));});
test('Consecutive days do not produce consecutive strength sessions',()=>{for(let mask=1;mask<128;mask++){const ds=Array.from({length:7},(_,i)=>i).filter(i=>mask&(1<<i));if(ds.length>5)continue;const a=makePlan({...p,days:ds});for(let i=0;i<7;i++)assert.ok(!(a[i].type==='strength'&&a[(i+1)%7].type==='strength'));}});
test('Week keys use Monday across year boundary',()=>{assert.equal(weekStart(new Date(2027,0,3,12)),'2026-12-28');});

