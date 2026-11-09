import {makePlan} from '../web/plan.mjs';
export function validateState(s){
  if(!s||typeof s.revision!=='string'||!s.history||typeof s.history!=='object'||Array.isArray(s.history)||Object.keys(s.history).length>2000)throw Error('Invalid state');
  let profile=null;
  if(s.profile!==null){const p=s.profile;if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>40||typeof p.limits!=='boolean')throw Error('Invalid profile');makePlan(p);profile={name:p.name.trim(),age:+p.age,goal:p.goal,level:p.level,equipment:p.equipment,duration:+p.duration,days:[...new Set(p.days)],limits:p.limits};}
  const history={};for(const[k,v]of Object.entries(s.history)){if(!/^\d{4}-\d{2}-\d{2}:[0-6]$/.test(k)||!v||typeof v.title!=='string'||v.title.length>100||![20,35,50].includes(v.minutes)||!['Легко','Нормально','Тяжело'].includes(v.feeling)||typeof v.at!=='string'||!Number.isFinite(Date.parse(v.at))||Date.parse(v.at)>Date.now()+60000)throw Error('Invalid history');history[k]={title:v.title,minutes:v.minutes,feeling:v.feeling,at:v.at};}
  return {profile,history,revision:s.revision};
}
