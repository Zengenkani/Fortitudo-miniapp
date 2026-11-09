import {readFile,writeFile} from 'node:fs/promises';
const app=new URL('../web/app.mjs',import.meta.url);let source=await readFile(app,'utf8');source=source.replace('state={profile:null,history:{}}','state={profile:null,history:{},revision:state.revision}');await writeFile(app,source);
const html=new URL('../web/index.html',import.meta.url);source=await readFile(html,'utf8');source=source.replace('Ритм — твой план тренировок','Fortitudo — твой план тренировок').replace('р<span>и</span>тм<span class="mark">↗</span>','Fortitudo<span class="mark">↗</span>').replace('class="avatar">Р','class="avatar">F');await writeFile(html,source);
const css=new URL('../web/style.css',import.meta.url);source=await readFile(css,'utf8');if(!source.includes('/* Fortitudo brand */'))await writeFile(css,source+'\n/* Fortitudo brand */\n.brand{font-size:27px;letter-spacing:-1.2px}.brand .mark{margin-left:8px;font-size:23px}\n');
console.log('Source finalized.');
