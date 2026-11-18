import { ACHIEVEMENTS, CHALLENGES, CHAPTERS, DEFAULT_SETTINGS, DIFFICULTIES, ENDINGS, STORAGE_KEY, VERSION, WEAPONS } from './content.js';
import { createRun, updateRun, objectiveLabel, interact, reload, selectWeapon, cycleWeapon, distance, finishStats, clamp } from './simulation.js';
import { HorrorRenderer } from './render.js';
import { HorrorAudio } from './audio.js';

const $=id=>document.getElementById(id);
const overlay=$('overlay'),hud=$('hud'),toast=$('toast'),view=$('view');
const renderer=new HorrorRenderer(view,$('minimap'));
const audio=new HorrorAudio();
const DEFAULT_SAVE=()=>({version:1,settings:{...DEFAULT_SETTINGS},unlocked:1,completed:[],
  achievements:[],best:{},last:null,allNotes:[]});
function readSave(){
  try {
    const previous=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(previous?.version===1&&previous.settings) return {...DEFAULT_SAVE(),...previous,
      settings:{...DEFAULT_SETTINGS,...previous.settings}};
  }catch(error){console.warn('Save unavailable',error);}
  return DEFAULT_SAVE();
}
let save=readSave(),settings=save.settings,mode='menu',run=null,pending=null;
let returnScreen='menu',toastEnd=0,msgEnd=0,lastFrame=performance.now(),animationFrame=null;
let keys=new Set(),mouseDown=false,locked=false,clickToFocus=false,lastMenu='menu';
const THEME='// ST. VESPER ARCHIVE  //  INTERNAL CASSETTE 071';
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const timefmt=secs=>`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(Math.floor(secs%60)).padStart(2,'0')}`;
function writeSave(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(save));}catch(error){console.warn('Could not store save',error);}}
function button(action,text,extra=''){
  return `<button class="action ${extra}" data-action="${escapeHTML(action)}">${text}<span class="number">›</span></button>`;
}
function panel(html){return `<div class="panel">${html}</div>`;}
function show(html,nextMode){mode=nextMode;overlay.innerHTML=panel(html);overlay.classList.remove('hidden');
  $('crosshair').classList.add('hidden');overlay.scrollTop=0;audio.setMuted(nextMode==='menu'&&false);
}
function hide(){overlay.classList.add('hidden');$('crosshair').classList.toggle('hidden',!settings.crosshair);}
function notify(message,duration=3){
  toast.textContent=message;toast.classList.remove('hidden');toastEnd=performance.now()+duration*1000;
}
function radio(message,duration=4){
  $('center-message').textContent=message;$('center-message').style.opacity='1';msgEnd=performance.now()+duration*1000;
}
function achievements(id){
  if(save.achievements.includes(id))return;
  save.achievements.push(id);writeSave();
  const a=ACHIEVEMENTS.find(a=>a.id===id);
  if(a)notify(`ACHIEVEMENT UNLOCKED: ${a.name}`,5);
}
function showMenu(){
  audio.stop();document.exitPointerLock?.();keys.clear();run=null;hud.classList.add('hidden');
  $('minimap').hidden=true;$('crosshair').classList.add('hidden');
  const hasSave=!!save.last,completed=save.completed.length;
  const body=`<span class="sigil">${THEME}</span>
    <div class="menu-grid"><div><h1 id="overlay-title">THE MAZE<em>S I G N A L &nbsp; L O S T</em></h1>
    <p class="instruction">FIVE CHAPTERS · SURVIVAL HORROR · FIRST PERSON</p>
    <p>They told you the building was empty. The radio has been waiting for you since 1998.</p>
    <nav class="menu-actions" aria-label="Main menu">
      ${button('new','NEW GAME','primary')}
      ${hasSave?button('continue','CONTINUE // '+CHAPTERS[save.last.chapterIndex].name):''}
      ${button('chapters',`CHAPTER SELECT <small>${completed}/5 COMPLETE</small>`)}
      ${button('challenges','CHALLENGE MODES')}
      ${button('settings','SETTINGS')}
      ${button('achievements','CASE FILES / ACHIEVEMENTS')}
      ${button('credits','CREDITS & MANUAL')}
    </nav><small>PS1 INSPIRED // RECOMMENDED: HEADPHONES + DARK ROOM</small></div>
    <div class="title-art" aria-label="A red door stands in a dark corridor"><span class="art-top">VESPER / 1998</span><span class="door-sign">DO NOT ENTER</span><span class="art-noise">BROADCAST LOST // 00:07:19</span></div></div>`;
  show(body,'menu');
}
function showDifficulty(challenge='campaign'){
  lastMenu='difficulty';const body=`<span class="sigil">SURVIVAL PROTOCOL</span>
    <h2 id="overlay-title">CHOOSE YOUR FEAR</h2><p>Select a difficulty for your five-chapter run. Progress saves at chapter boundaries.</p>
    <div class="difficulty-grid">${Object.entries(DIFFICULTIES).map(([id,d])=>
      `<button class="action" data-action="difficulty" data-value="${id}"><strong>${d.name}</strong><small>${escapeHTML(d.description)}</small></button>`).join('')}</div>
    <div class="rule">${challenge==='campaign'?'CAMPAIGN':CHALLENGES[challenge].name} // ${CHALLENGES[challenge].description}</div>
    <div class="footer-actions">${button('menu','BACK','secondary')}</div>`;
  pending={chapterIndex:0,challenge};show(body,'difficulty');
}
function showChapters(){
  const cards=CHAPTERS.map((ch,i)=>`<button class="chapter-card" data-action="choose-chapter" data-value="${i}" ${i>=save.unlocked?'disabled':''}>
    <small>CHAPTER ${String(i+1).padStart(2,'0')} // ${i>=save.unlocked?'LOCKED':'UNLOCKED'}</small>
    <strong>${ch.name}</strong><small>${ch.location}</small></button>`).join('');
  show(`<span class="sigil">FREQUENCY INDEX</span><h2 id="overlay-title">THE FIVE CHAPTERS</h2>
    <p>Completed chapters stay unlocked. Replaying begins at that chapter's checkpoint, without carried resources.</p>
    <div class="chapter-picker">${cards}</div><div class="footer-actions">${button('menu','BACK','secondary')}</div>`,'chapters');
}
function showChallenges(){
  show(`<span class="sigil">EXPERIMENTAL PROTOCOLS</span><h2 id="overlay-title">CHALLENGE MODES</h2>
    <p>Optional variants with distinct survival constraints. Complete the whole campaign to prove you escaped.</p>
    <div class="chapter-picker">${Object.entries(CHALLENGES).map(([id,c])=>
      `<button class="chapter-card" data-action="challenge" data-value="${id}"><small>CHALLENGE PROTOCOL</small><strong>${c.name}</strong><small>${c.description}</small></button>`).join('')}</div>
    <div class="footer-actions">${button('menu','BACK','secondary')}</div>`,'challenges');
}
function showSettings(from=mode){
  returnScreen=from==='settings'?returnScreen:from;
  const rows=[
    ['master','Master volume',0,1,.05],['music','Music / ambience',0,1,.05],['sfx','Sound effects',0,1,.05],
    ['sensitivity','Mouse sensitivity',.2,1.8,.05],['brightness','Brightness',.6,1.5,.05],
    ['fov','Field of view',55,95,5],['resolution','Render resolution',.5,1.25,.25]
  ];
  const bools=[['shake','Camera shake'],['scanlines','CRT / VHS scanlines'],['subtitles','Radio subtitles'],
    ['minimap','Show automap'],['crosshair','Show crosshair']];
  show(`<span class="sigil">SYSTEM PARAMETERS // ${VERSION}</span><h2 id="overlay-title">SETTINGS</h2>
    <div>${rows.map(([key,label,min,max,step])=>`<label class="setting-row"><span>${label}</span>
      <input type="range" data-setting="${key}" min="${min}" max="${max}" step="${step}" value="${settings[key]}">
      <output id="out-${key}">${Number(settings[key]).toFixed(key==='fov'?0:2)}</output></label>`).join('')}
      ${bools.map(([key,label])=>`<label class="setting-row"><span>${label}</span>
      <input type="checkbox" data-setting="${key}" ${settings[key]?'checked':''}><output>${settings[key]?'ON':'OFF'}</output></label>`).join('')}</div>
    <p class="small">Settings are saved automatically. Sound starts after you enter the game. Resolution adjusts the internal render scale, not the display size.</p>
    <div class="footer-actions">${button('back-settings','BACK','secondary')}${button('reset-settings','RESTORE DEFAULTS')}</div>`,'settings');
}
function showAchievements(){
  show(`<span class="sigil">PERSONNEL RECORDS // ${save.achievements.length}/${ACHIEVEMENTS.length}</span>
    <h2 id="overlay-title">ACHIEVEMENTS</h2><p>Survive the facility. Recover the things it wanted forgotten.</p>
    <div class="chapter-picker">${ACHIEVEMENTS.map(a=>`<div class="note-card"><h3>${save.achievements.includes(a.id)?'◉':'○'} ${a.name}</h3>
    <p>${save.achievements.includes(a.id)?a.description:'LOCKED // ???'}</p></div>`).join('')}</div>
    <div class="footer-actions">${button('menu','BACK','secondary')}</div>`,'achievements');
}
function showCredits(){
  show(`<span class="sigil">SUPPORT DOCUMENTATION</span><h2 id="overlay-title">CREDITS & CONTROLS</h2>
    <div class="layout-two"><div><h3>CONTROLS</h3><p class="instruction">
      WASD — MOVE<br>MOUSE / ARROWS — LOOK<br>SHIFT — SPRINT<br>C / CTRL — CROUCH (QUIETER)<br>LEFT CLICK / SPACE — FIRE<br>
      E — INTERACT / EXIT<br>R — RELOAD<br>F — FLASHLIGHT<br>1 / 2 / 3 / 4 — EQUIP<br>
      WHEEL — NEXT WEAPON<br>J — RECOVERED NOTES<br>M — AUTOMAP<br>ESC — PAUSE</p>
      <p>Enemies use sight and hearing. The Watcher freezes when looked at. Shots attract attention. Scarce resources reward careful exploration.</p></div>
      <div><h3>CREATIVE ORIGIN</h3><p>Developed from the supplied “Chapter 1 — The Maze” browser prototype. This edition expands its core survival loop into five connected chapters with a new modular engine.</p>
      <p>All visual sprites, textures, animation, sound design, and the generative soundtrack are original procedural work included in the repository. No third-party music or stock assets are required.</p>
      <p>Programming and original narrative: <strong>THE MAZE // SIGNAL LOST</strong> project.</p>
      <p><a href="legacy/chapter-1-original.html" target="_blank" rel="noopener noreferrer" style="color:#d7a88c">PLAY THE ORIGINAL CHAPTER 1 PROTOTYPE</a></p></div></div>
    <hr class="divider"><div class="footer-actions">${button('menu','BACK TO MENU','secondary')}</div>`,'credits');
}
function chapterIntro(index,options={}){
  const chapter=CHAPTERS[index];pending={chapterIndex:index,difficulty:options.difficulty||'normal',challenge:options.challenge||'campaign',carry:options.carry||null};
  show(`<span class="sigil">CHAPTER ${String(index+1).padStart(2,'0')} // ${escapeHTML(chapter.location)}</span>
    <h2 id="overlay-title">${chapter.name}</h2><p class="quote">“${escapeHTML(chapter.intro)}”</p>
    <p class="story">${escapeHTML(chapter.briefing)}</p>
    <p class="instruction red">RADIO: ${escapeHTML(chapter.startRadio)}</p>
    <div class="footer-actions">${button('descend','[ ENTER THE DARK ]','primary')}${button('menu','MAIN MENU','secondary')}</div>
    <p class="small muted">Click inside the game for mouse look. Press ESC to release your cursor.</p>`,'intro');
}
function startPlay(){
  if(!pending)return;
  const {chapterIndex,difficulty,challenge,carry}=pending;
  run=createRun(chapterIndex,difficulty,challenge,null,carry);
  save.last={chapterIndex,difficulty,challenge,carry};writeSave();
  mode='play';hide();hud.classList.remove('hidden');keys.clear();
  audio.start().then(()=>audio.setChapter(chapterIndex)).catch(()=>{});
  view.requestPointerLock?.();locked=document.pointerLockElement===view;
  notify('FIND THE WAY OUT. THE RADIO IS LISTENING.',4);
  radio(settings.subtitles?run.chapter.startRadio:'',4);
}
function resume(){
  if(!run)return;mode='play';hide();keys.clear();audio.setMuted(false);
  view.requestPointerLock?.();
}
function pause(){
  if(mode!=='play'||!run)return;
  mode='pause';keys.clear();mouseDown=false;
  document.exitPointerLock?.();
  show(`<span class="sigil">CONNECTION INTERRUPTED</span><h2 id="overlay-title">PAUSED</h2>
    <p>CHAPTER ${run.chapter.number} — ${run.chapter.name} // ${timefmt(run.elapsed)}</p>
    <div class="menu-actions" style="max-width:420px">
      ${button('resume','RESUME','primary')}${button('journal','RECOVERED NOTES')}
      ${button('settings','SETTINGS')}${button('restart','RESTART CHAPTER')}
      ${button('menu','RETURN TO MAIN MENU','secondary')}
    </div>`,'pause');
}
function journal(){
  const notes=run?run.allNotes:save.allNotes;
  const entries=notes.length?notes.map(n=>`<article class="note-card"><h3>${escapeHTML(n.title)}</h3>
    <p>${escapeHTML(n.body)}</p><small>CHAPTER ${n.chapter+1}</small></article>`).join(''):
    '<p>No recordings have been recovered. Search the dark corridors for documents marked with a dim gold glow.</p>';
  const cameFrom=mode==='pause'?'pause':'menu';lastMenu=cameFrom;
  show(`<span class="sigil">ARCHIVE // ${notes.length}/15</span><h2 id="overlay-title">RECOVERED RECORDINGS</h2>
    <div class="codex-list">${entries}</div><div class="footer-actions">${button('back-journal','BACK','secondary')}</div>`,'journal');
}
function showDeath(reason){
  if(!run)return;
  document.exitPointerLock?.();audio.play('death');keys.clear();hud.classList.add('hidden');
  if(run.difficulty==='ironman'){
    const settingsCopy=save.settings;save=DEFAULT_SAVE();save.settings=settingsCopy;writeSave();
  }
  show(`<span class="sigil">SIGNAL TERMINATED</span><h1 id="overlay-title">YOU DIED<em>THE MAZE REMEMBERS</em></h1>
    <p class="quote">${escapeHTML(reason||'The recording ends here.')}</p>
    <p>Time survived: ${timefmt(run.elapsed)} // Kills: ${run.kills} // Memories: ${run.objectiveCount}/${run.chapter.target}</p>
    <div class="footer-actions">${button('retry','RETRY CHAPTER','primary')}${button('menu','MAIN MENU','secondary')}</div>`,'dead');
}
function mergeNotes(){
  const index=new Set(save.allNotes.map(n=>`${n.chapter}-${n.index}`));
  for(const n of run.allNotes)if(!index.has(`${n.chapter}-${n.index}`)){
    save.allNotes.push(n);index.add(`${n.chapter}-${n.index}`);
  }
}
function chapterComplete(){
  if(!run)return;
  document.exitPointerLock?.();audio.play('end');keys.clear();hud.classList.add('hidden');
  const i=run.chapterIndex,stats=finishStats(run);
  save.unlocked=Math.max(save.unlocked,Math.min(5,i+2));
  if(!save.completed.includes(i))save.completed.push(i);
  mergeNotes();
  const best=save.best[run.chapter.id];
  if(!best||stats.time<best.time)save.best[run.chapter.id]=stats;
  if(run.shots===0)achievements('no_shots');
  if(run.kills>0)achievements('first_blood');
  if(save.allNotes.length===15)achievements('collector');
  const carry={hp:run.player.hp,battery:run.player.battery,weapons:run.player.weapons,
    totalElapsed:run.totalElapsed,allNotes:run.allNotes,totalNotes:run.totalNotes};
  if(i===4) {
    save.last=null;achievements('survivor');
    if(run.challenge==='speedrun'&&run.totalElapsed<1800)achievements('speedrun');
    writeSave();showEndingChoice();return;
  }
  save.last={chapterIndex:i+1,difficulty:run.difficulty,challenge:run.challenge,carry};writeSave();
  show(`<span class="sigil">RECORDING ${String(i+1).padStart(2,'0')} RECOVERED</span>
    <h2 id="overlay-title">CHAPTER COMPLETE</h2><p class="quote">${escapeHTML(run.chapter.outro)}</p>
    <div class="stats"><div><strong>${timefmt(stats.time)}</strong>TIME</div><div><strong>${stats.kills}</strong>ENEMIES</div>
    <div><strong>${stats.notes}/3</strong>NOTES</div></div>
    <p>THE NEXT FREQUENCY IS READY: <strong>${CHAPTERS[i+1].name}</strong></p>
    <div class="footer-actions">${button('next','CONTINUE THE STORY','primary')}${button('menu','SAVE & MAIN MENU','secondary')}</div>`,'chapter-complete');
}
function showEndingChoice(){
  const found=save.allNotes.length===15;
  show(`<span class="sigil">CHAPTER 05 // RECORDING COMPLETE</span><h2 id="overlay-title">WHAT WILL YOU REMEMBER?</h2>
    <p class="quote">“${escapeHTML(CHAPTERS[4].outro)}”</p><p>Jonah's voice reaches you one last time. The machine gives you a choice.</p>
    <div class="ending-choice"><button class="action" data-action="ending" data-value="silence">SEVER THE CARRIER</button>
    <button class="action" data-action="ending" data-value="signal">BROADCAST THE SIGNAL</button>
    ${found?'<button class="action primary" data-action="ending" data-value="true">THE BLUE MONITOR // REMEMBER</button>':''}</div>
    ${!found?'<p class="small muted">One way out is hidden in the fifteen lost recordings.</p>':''}`,'ending-choice');
}
function ending(name){
  const chosen=ENDINGS[name];if(!chosen)return;
  if(name==='true') achievements('remember');
  show(`<span class="sigil">TRANSMISSION ENDED // ${name.toUpperCase()}</span>
    <h1 id="overlay-title">${chosen.title}<em>THE END</em></h1>
    <p class="quote">${escapeHTML(chosen.subtitle)}</p><p class="story">${escapeHTML(chosen.body)}</p>
    <p>Thank you for listening.</p><div class="footer-actions">${button('chapters','REPLAY CHAPTERS')}${button('menu','RETURN TO MENU','primary')}</div>`,'ending');
}
function showHelpPrompt(){
  if(!run||mode!=='play')return;
  const p=run.player,level=run.level;
  let text='';
  const o=level.objectives.find(o=>!o.done&&distance(o,p)<1.5);
  if(o)text=`[ E ] ${run.chapter.number===5?'BREAK ANCHOR':'RECOVER '+run.chapter.objective}`;
  else if(level.console&&!level.console.done&&distance(p,level.console)<1.8)
    text=`[ E ] ACTIVATE CONSOLE`;
  else if(distance(p,level.exit)<1.8)text='[ E ] OPEN RED EXIT';
  $('interact-prompt').textContent=text;$('interact-prompt').classList.toggle('hidden',!text);
}
function updateHUD(){
  if(!run)return;
  const p=run.player;
  $('chapter-label').textContent=`CHAPTER ${String(run.chapter.number).padStart(2,'0')} // ${run.chapter.location}`;
  $('objective').textContent=objectiveLabel(run);
  $('timer').textContent=timefmt(run.totalElapsed);
  $('difficulty-label').textContent=DIFFICULTIES[run.difficulty].name;
  $('health-fill').style.width=p.hp+'%';$('health-n').textContent=Math.round(p.hp);
  $('battery-fill').style.width=p.battery+'%';$('battery-n').textContent=Math.round(p.battery);
  $('stamina-fill').style.width=p.stamina+'%';$('stamina-n').textContent=Math.round(p.stamina);
  const def=WEAPONS[p.weapon],w=p.weapons[p.weapon];
  $('weapon-name').textContent=def?def.name:'FLASHLIGHT ONLY';
  $('ammo-count').textContent=w?`${String(w.mag).padStart(2,'0')} / ${String(w.reserve).padStart(2,'0')}${p.reloadTimer>0?' ↻':''}`:'-- / --';
  $('flashlight-indicator').textContent=run.challenge==='blackout'?'BLACKOUT PROTOCOL':`F // LIGHT ${p.flashlight?'ON':'OFF'}`;
  $('stage').style.transform=settings.shake&&p.hurt>0?`translate(${(Math.random()-.5)*p.hurt*3}px,${(Math.random()-.5)*p.hurt*3}px)`:'none';
  $('hurt-vignette').style.boxShadow=`inset 0 0 220px rgba(175,15,22,${p.hurt*.9})`;
  $('film').style.opacity=settings.scanlines?'.45':'0';
  view.style.filter=`contrast(${1.06*settings.brightness}) saturate(.76)`;
  showHelpPrompt();
}
function onEvents(events){
  for(const e of events){
    switch(e.type){
      case 'step':audio.play(e.sprint?'sprint':'step');break;
      case 'shot':audio.play(e.weapon);break;
      case 'reload':audio.play('reload');notify('RELOADING...',1.2);break;
      case 'pickup':audio.play('pickup');notify(e.text);break;
      case 'objective':audio.play('objective');notify(e.text,4);radio(run.objectiveCount===run.chapter.target?'THE LOCK RESPONDS.':'IT HEARD THAT.',3);break;
      case 'note':audio.play('note');notify(`RECORDING: ${e.text}  [ J TO READ ]`,5);break;
      case 'hurt':audio.play('hurt');radio(e.text,2);break;
      case 'console':audio.play('door');notify(e.text,4);break;
      case 'death':showDeath(e.text);break;
      case 'complete':chapterComplete();break;
      case 'teleport':audio.play('static');radio(e.text,1);break;
      case 'kill':audio.play('enemy');achievements('first_blood');notify(e.text,2);break;
      case 'batteryEmpty':audio.play('static');notify(e.text,4);break;
      case 'message':audio.play('static');notify(e.text,3.2);break;
      case 'challengeFail':notify(e.text,6);break;
      case 'empty':audio.play('reload');break;
    }
  }
}
function gameControls(){
  const down=k=>keys.has(k);
  const forward=(down('KeyW')||down('ArrowUp')?1:0)-(down('KeyS')||down('ArrowDown')?1:0);
  const strafe=(down('KeyD')?1:0)-(down('KeyA')?1:0);
  return {forward,strafe,sprint:down('ShiftLeft')||down('ShiftRight'),
    crouch:down('KeyC')||down('ControlLeft')||down('ControlRight'),
    turn:((down('ArrowRight')?1:0)-(down('ArrowLeft')?1:0))*.032*settings.sensitivity,
    fire:mouseDown||down('Space')};
}
function tick(now){
  animationFrame=requestAnimationFrame(tick);
  const dt=clamp((now-lastFrame)/1000,0,.05);lastFrame=now;
  if(mode==='play'&&run){
    const events=updateRun(run,gameControls(),dt);
    onEvents(events);updateHUD();
    if(mode==='play'){
      const nearest=run.level.enemies.filter(e=>!e.dead).reduce((n,e)=>Math.min(n,distance(e,run.player)),99);
      audio.update(dt,clamp((12-nearest)/12,0,1));
    }
  }
  if(run&&['play','pause','journal','settings','dead','chapter-complete'].includes(mode))renderer.render(run,settings);
  if(now>toastEnd)toast.classList.add('hidden');
  if(now>msgEnd)$('center-message').style.opacity='0';
}

// Menu interactions are routed via a single delegated handler; no stale listeners.
overlay.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]');if(!target)return;
  const action=target.dataset.action,value=target.dataset.value;
  audio.play('ui');
  switch(action){
    case 'menu':showMenu();break;
    case 'new':showDifficulty();break;
    case 'difficulty':chapterIntro(pending?.chapterIndex??0,{difficulty:value,challenge:pending?.challenge||'campaign'});break;
    case 'continue':if(save.last)chapterIntro(save.last.chapterIndex,save.last);break;
    case 'chapters':showChapters();break;
    case 'choose-chapter':chapterIntro(Number(value),{difficulty:'normal'});break;
    case 'challenges':showChallenges();break;
    case 'challenge':showDifficulty(value);break;
    case 'settings':showSettings(mode);break;
    case 'reset-settings':settings={...DEFAULT_SETTINGS};save.settings=settings;audio.applySettings(settings);writeSave();showSettings(returnScreen);break;
    case 'back-settings':returnScreen==='pause'?pause():showMenu();break;
    case 'credits':showCredits();break;
    case 'achievements':showAchievements();break;
    case 'descend':startPlay();break;
    case 'resume':resume();break;
    case 'restart':case 'retry':if(run)chapterIntro(run.chapterIndex,{difficulty:run.difficulty,challenge:run.challenge,
      carry:save.last?.carry||null});break;
    case 'journal':journal();break;
    case 'back-journal':lastMenu==='pause'?pause():showMenu();break;
    case 'next':if(save.last)chapterIntro(save.last.chapterIndex,save.last);break;
    case 'ending':ending(value);break;
  }
});
overlay.addEventListener('input',event=>{
  const control=event.target,key=control.dataset.setting;
  if(!key)return;
  settings[key]=control.type==='checkbox'?control.checked:Number(control.value);
  save.settings=settings;writeSave();audio.applySettings(settings);
  if(control.type==='checkbox')control.parentElement.querySelector('output').textContent=control.checked?'ON':'OFF';
  else $(`out-${key}`).textContent=Number(settings[key]).toFixed(key==='fov'?0:2);
});
document.addEventListener('keydown',event=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
  if(event.repeat&&['KeyE','KeyF','KeyJ','KeyM','KeyR','Escape'].includes(event.code))return;
  keys.add(event.code);
  if(event.code==='Escape'){if(mode==='play')pause();else if(mode==='pause')resume();return;}
  if(mode!=='play'||!run)return;
  if(event.code==='KeyE'){onEvents((run.events=[],interact(run),run.events));}
  if(event.code==='KeyR'){run.events=[];reload(run);onEvents(run.events);}
  if(event.code==='KeyF'){
    if(run.challenge==='blackout'){notify('BLACKOUT: FLASHLIGHT DISABLED.');return;}
    if(run.player.battery>0){run.player.flashlight=!run.player.flashlight;audio.play('ui');}
    else notify('BATTERY DEPLETED.');
  }
  if(event.code==='KeyJ') {document.exitPointerLock?.();pause();journal();}
  if(event.code==='KeyM'){settings.minimap=!settings.minimap;save.settings=settings;writeSave();}
  const weaponKeys={Digit1:'pistol',Digit2:'shotgun',Digit3:'nailgun',Digit4:'flare'};
  if(weaponKeys[event.code])selectWeapon(run,weaponKeys[event.code]);
});
document.addEventListener('keyup',event=>{keys.delete(event.code);});
window.addEventListener('blur',()=>{keys.clear();mouseDown=false;if(mode==='play')pause();});
view.addEventListener('mousedown',e=>{if(e.button===0&&mode==='play'){mouseDown=true;if(!locked)view.requestPointerLock?.();}});
window.addEventListener('mouseup',()=>{mouseDown=false;});
view.addEventListener('wheel',event=>{if(mode==='play'&&run){event.preventDefault();cycleWeapon(run,event.deltaY>0?1:-1);}}, {passive:false});
document.addEventListener('mousemove',event=>{
  if(mode!=='play'||!run||document.pointerLockElement!==view)return;
  run.player.yaw+=event.movementX*.0024*settings.sensitivity;
  run.player.pitch=clamp(run.player.pitch+event.movementY*.0020*settings.sensitivity,-1.1,1.1);
});
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===view;
  if(!locked&&mode==='play')pause();
});
window.addEventListener('contextmenu',event=>{if(event.target===view)event.preventDefault();});
// Non-production test seam: game state inspection without exposing storage credentials.
if(new URLSearchParams(location.search).has('debug'))window.__mazeDebug={
  getRun:()=>run,getSave:()=>save,getMode:()=>mode,chapterIntro,
  fire:()=>{if(!run)return;run.events=[];import('./simulation.js').then(m=>m.fire(run));},
  completeObjectives:()=>{if(!run)return;run.level.objectives.forEach(o=>o.done=true);run.objectiveCount=run.chapter.target;
    if(run.level.console)run.level.console.done=true;run.level.enemies.filter(e=>e.type==='archivist').forEach(e=>e.dead=true);}
};
showMenu();animationFrame=requestAnimationFrame(tick);
