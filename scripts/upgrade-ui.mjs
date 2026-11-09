import {readFile,writeFile} from 'node:fs/promises';
const path=new URL('../web/app.mjs',import.meta.url);let s=await readFile(path,'utf8');
function replace(a,b){if(!s.includes(a))throw Error('Missing source marker: '+a.slice(0,50));s=s.replace(a,b);}
replace('plan=state.profile?makePlan(state.profile):[]','plan=state.profile?(state.aiPlan?.days||makePlan(state.profile)):[]');
replace("days:[0,2,4],limits:false","days:[0,2,4],limits:false,sex:'unspecified',wishes:''");
replace('<label>Чего хочется достичь?',`<label>Пол<select name="sex">\${options({unspecified:'Не хочу указывать',female:'Женский',male:'Мужской'},p.sex||'unspecified')}</select></label><label>Чего хочется достичь?`);
replace('</div><p style="font-size:12px;font-weight:700;margin-top:25px">Удобные дни',`</div><section class="wishes-box"><span class="eyebrow">ТВОИ ПРЕДПОЧТЕНИЯ</span><h2>Как ты хочешь тренироваться?</h2><label for="wishes">Пожелания для ИИ</label><textarea id="wishes" name="wishes" rows="4" maxlength="1500" placeholder="Например: без прыжков, больше внимания спине, не люблю приседания. Укажи, что нравится и чего хочется избегать.">\${esc(p.wishes||'')}</textarea><p class="note">До 1500 символов. Пол необязателен; нагрузка подбирается прежде всего по опыту, цели и самочувствию.</p></section><p style="font-size:12px;font-weight:700;margin-top:25px">Удобные дни`);
replace('<div id="formError" role="alert"></div><button class="primary" type="submit">',`<label class="check"><input type="checkbox" name="aiConsent"><span>Разрешаю отправить возраст, пол, цель, опыт, оборудование, расписание и пожелания в OpenAI для подбора плана. Имя и Telegram ID не отправляются.</span></label><div id="formError" role="alert"></div><div class="form-actions"><button class="primary ai-button" type="submit" name="mode" value="ai">✦ Составить с ИИ</button><button class="secondary" type="submit" name="mode" value="basic">`);
replace("${state.profile?'Сохранить и обновить план':'Создать мою неделю'} &nbsp; ↗</button>","Сохранить базовый план</button></div>");
const start=s.indexOf("$('#profileForm').onsubmit=");const end=s.indexOf("\n$('#reset')",start);if(start<0||end<0)throw Error('No form handler');
s=s.slice(0,start)+`$('#profileForm').onsubmit=async e=>{
 e.preventDefault();const form=e.target,f=new FormData(form),useAI=e.submitter?.value==='ai';
 const p={name:f.get('name').trim(),age:+f.get('age'),sex:f.get('sex'),wishes:f.get('wishes').trim(),goal:f.get('goal'),level:f.get('level'),equipment:f.get('equipment'),duration:+f.get('duration'),days:f.getAll('day').map(Number),limits:f.has('limits')};
 const buttons=[...form.querySelectorAll('button[type=submit]')],error=$('#formError');error.textContent='';
 try{if(!p.name)throw Error('Укажи имя.');makePlan(p);if(useAI&&!f.has('aiConsent'))throw Error('Подтверди отправку анкеты в OpenAI или выбери базовый план.');if(useAI&&!remote)throw Error('Для подбора с ИИ открой приложение через @FortitudoTraining_bot. Здесь можно проверить базовый план.');
 buttons.forEach(b=>b.disabled=true);error.className='note';error.textContent=useAI?'Сохраняем анкету и подбираем программу… Обычно это занимает до 30 секунд.':'Сохраняем…';
 const before=state;state={...state,profile:p,aiPlan:null,resetPlan:true};try{await save();delete state.resetPlan;}catch(err){state=before;throw err;}
 if(useAI){const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Init-Data':tg.initData},body:JSON.stringify({consent:true,revision:state.revision}),signal:AbortSignal.timeout(55000)});const result=await r.json();if(!r.ok)throw Error(result.error||'Подбор недоступен. Попробуй позже.');state=result;}
 go('plan');
 }catch(err){error.className='error';error.textContent=err.message;}finally{buttons.forEach(b=>b.disabled=false);}
};`+s.slice(end);
replace("if(plan.length)detail();}","if(plan.length)detail();if(state.aiPlan){const info=document.createElement('section');info.className='ai-summary';info.innerHTML='<span class=eyebrow>✦ ПОДОБРАНО С ИИ</span><p>'+esc(state.aiPlan.summary)+'</p>';$('#detail').after(info);}}");
replace('<h2>${d.title}</h2>','<h2>${esc(d.title)}</h2>');replace('<h2>${d.title}</h2>','<h2>${esc(d.title)}</h2>');
replace('${n+1}. ${name}','${n+1}. ${esc(name)}');replace('<small>${dose}</small><p>${hint}</p>','<small>${esc(dose)}</small><p>${esc(hint)}</p>');
replace("${p?'ПЛАН ПОД ТВОЮ ЖИЗНЬ':'БЕЗ ГОНКИ. С ЗАБОТОЙ О СЕБЕ.'}","${state.aiPlan?'✦ ПЕРСОНАЛЬНАЯ ПРОГРАММА С ИИ':p?'ТВОЯ НЕДЕЛЯ · БАЗОВАЯ ПРОГРАММА':'FORTITUDO / PERSONAL TRAINING'}");
replace('Большие перемены.<br>Маленькими шагами.','Сильнее.<br>В своём темпе.');
replace('<div class="orbit" aria-hidden="true">↗</div>', '<div class="hero-art" aria-hidden="true"><div class="orbit">F</div><span class="art-caption">BUILD YOUR<br>OWN STRENGTH</span></div>');
await writeFile(path,s);
const dev=new URL('./dev.mjs',import.meta.url);s=await readFile(dev,'utf8');s=s.replace("import state from '../api/state.js';","import generate from '../api/generate.js';import state from '../api/state.js';").replace("const routes={","const routes={'/api/generate':generate,");await writeFile(dev,s);
console.log('UI upgraded.');
