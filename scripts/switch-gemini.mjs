import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const change=async(file,fn)=>{const path=new URL(file,root);await writeFile(path,fn(await readFile(path,'utf8')));};
await change('backend/ai.mjs',s=>{
 s=s.replace("source:'openai'","source:'gemini'");
 const instructions=s.match(/instructions:('.*?'),input:/s)?.[1];if(!instructions)throw Error('Missing instructions');
 return s.slice(0,s.indexOf('export async function generate(profile)'))+`export function checkWishes(profile){
  if(profile.limits || /(?:диагноз|травм|болит|боль|беремен|операци|грыж|артрит|диабет|инфаркт|инсульт|паспорт|телефон|\\S+@\\S+\\.\\S+)/iu.test(profile.wishes||'')){const e=Error('Не отправляй медицинские сведения, контакты и другие чувствительные данные в бесплатный Gemini. Для ограничений по здоровью нужна программа специалиста.');e.status=422;throw e;}
}
export async function generate(profile){
  checkWishes(profile);
  const {age,sex,goal,level,equipment,duration,days,wishes}=profile;
  const parameters={age,sex,goal,level,equipment,duration,days,wishes};
  const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
  if(!/^[a-zA-Z0-9.-]+$/.test(model))throw Error('Invalid Gemini model');
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{
    method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000),
    body:JSON.stringify({systemInstruction:{parts:[{text:${instructions}}]},contents:[{role:'user',parts:[{text:JSON.stringify({parameters,catalog:catalog(profile),strengthDays:makePlan(profile).map((d,i)=>d.type==='strength'?i:-1).filter(i=>i>=0)})}]}],generationConfig:{maxOutputTokens:4096,responseMimeType:'application/json',responseJsonSchema:schema}})
  });
  if(!response.ok){const e=Error(response.status===429?'Лимит Gemini временно исчерпан. Попробуй позже.':'Gemini недоступен. Администратору нужно проверить ключ, модель и доступность API.');e.status=response.status===429?429:503;throw e;}
  const data=await response.json(),candidate=data.candidates?.[0];
  if(candidate?.finishReason!=='STOP')throw Error('Gemini response incomplete or blocked');
  const text=(candidate.content?.parts||[]).filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('');
  return assemble(JSON.parse(text),profile);
}
`;
});
for(const file of ['api/generate.js','web/app.mjs'])await change(file,s=>s.replaceAll('OPENAI_API_KEY','GEMINI_API_KEY').replaceAll('OpenAI','Google Gemini'));
await change('api/generate.js',s=>s.replace("import {generate}","import {generate,checkWishes}").replace(" const allowed=", " checkWishes(profile);\n const allowed="));
await change('web/app.mjs',s=>s.replace('До 1500 символов. Пол необязателен;', 'Не указывай диагнозы, травмы, контакты и другие чувствительные сведения. Бесплатный Gemini может использовать запросы для улучшения продуктов Google. До 1500 символов. Пол необязателен;'));
await change('.env.example',s=>s.replace('OPENAI_API_KEY=','GEMINI_API_KEY=').replace('OPENAI_MODEL=gpt-4.1-mini','GEMINI_MODEL=gemini-2.5-flash'));
console.log('Gemini migration complete. No secrets printed.');
