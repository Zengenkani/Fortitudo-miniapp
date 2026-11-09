export function parseReminder(text){const m=text.match(/^\/remind ([01]\d|2[0-3]):([0-5]\d) ([+-])(0\d|1[0-4]):([0-5]\d)$/);if(!m||(+m[4]===14&&+m[5]!==0))return null;return {time:m[1]+':'+m[2],offset:(m[3]==='-'?-1:1)*(+m[4]*60 + +m[5])};}
export function nextReminder(profile,reminder,after=Date.now()){
  if(!profile||!reminder)return null;
  const local=new Date(after+reminder.offset*60000),[h,m]=reminder.time.split(':').map(Number);
  for(let i=0;i<8;i++){const d=new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate()+i,h,m));const utc=d.getTime()-reminder.offset*60000;if(utc>after&&profile.days.includes((d.getUTCDay()+6)%7))return utc;}
  return null;
}
