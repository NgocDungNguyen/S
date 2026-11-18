import { CHAPTERS, DIFFICULTIES, ENEMIES, WEAPONS } from './content.js';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const distance = (a,b) => Math.hypot(a.x - b.x, a.z - b.z);
export const wrapAngle = radians => Math.atan2(Math.sin(radians), Math.cos(radians));
export function rng(seed) {
  let state = seed >>> 0;
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
}
export const atCell = point => [Math.floor(point.x), Math.floor(point.z)];
const directions = [[0,1],[1,0],[0,-1],[-1,0]];
const tileCenter = ([x,z]) => ({ x:x+0.5,z:z+0.5 });
const idFor = (x,z) => `${x},${z}`;
export function isWall(grid,x,z) {
  const tx=Math.floor(x), tz=Math.floor(z);
  return !grid[tz] || grid[tz][tx] !== 0;
}
export function hasLOS(grid,a,b) {
  const length=distance(a,b), steps=Math.ceil(length*10);
  for(let k=1;k<steps;k++) {
    const t=k/steps;
    if(isWall(grid,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)) return false;
  }
  return true;
}
export function neighbors(grid,cell) {
  return directions.map(([dx,dz])=>[cell[0]+dx,cell[1]+dz])
    .filter(([x,z])=>!isWall(grid,x,z));
}
export function distancesFrom(grid,cell) {
  const queue=[cell], found=new Map([[idFor(...cell),0]]);
  for(let i=0;i<queue.length;i++) {
    const cur=queue[i], n=found.get(idFor(...cur));
    for(const next of neighbors(grid,cur)) {
      const key=idFor(...next);
      if(!found.has(key)) {found.set(key,n+1);queue.push(next);}
    }
  }
  return found;
}
export function findPath(grid,start,end) {
  const a=atCell(start), b=atCell(end), endId=idFor(...b);
  if(isWall(grid,...a)||isWall(grid,...b)) return [];
  const queue=[a], came=new Map([[idFor(...a),null]]);
  for(let i=0;i<queue.length;i++) {
    const p=queue[i]; if(idFor(...p)===endId) break;
    for(const next of neighbors(grid,p)) {
      const key=idFor(...next);
      if(!came.has(key)) {came.set(key,p);queue.push(next);}
    }
  }
  if(!came.has(endId)) return [];
  const path=[]; let p=b;
  while(p) {path.push(tileCenter(p));p=came.get(idFor(...p));}
  return path.reverse();
}
function shuffle(array,random) {
  for(let i=array.length-1;i>0;i--) {
    const k=Math.floor(random()*(i+1));[array[i],array[k]]=[array[k],array[i]];
  }
  return array;
}
export function buildLevel(chapter, seed=chapter.seed) {
  // Deterministic, connected maze with loop passages: all objectives remain reachable.
  const size=chapter.size, random=rng(seed), grid=Array.from({length:size},()=>Array(size).fill(1));
  grid[1][1]=0;
  const stack=[[1,1]];
  while(stack.length) {
    const [x,z]=stack[stack.length-1];
    const options=shuffle([[2,0],[-2,0],[0,2],[0,-2]],random)
      .filter(([dx,dz])=>x+dx>0 && z+dz>0 && x+dx<size-1 && z+dz<size-1 && grid[z+dz][x+dx]===1);
    if(!options.length){stack.pop();continue;}
    const [dx,dz]=options[0];
    grid[z+dz/2][x+dx/2]=0;grid[z+dz][x+dx]=0;stack.push([x+dx,z+dz]);
  }
  // Side loops and small chambers keep navigation readable without losing dread.
  for(let i=0;i<Math.floor(size*0.9);i++) {
    const x=1+Math.floor(random()*(size-2)), z=1+Math.floor(random()*(size-2));
    if(grid[z][x]===0) continue;
    const a=(!isWall(grid,x-1,z) ? 1:0)+(!isWall(grid,x+1,z)?1:0);
    const b=(!isWall(grid,x,z-1) ? 1:0)+(!isWall(grid,x,z+1)?1:0);
    if((a===2||b===2)&&random()<0.72) grid[z][x]=0;
  }
  for(let i=0;i<3;i++) {
    const x=3+2*Math.floor(random()*((size-6)/2)), z=3+2*Math.floor(random()*((size-6)/2));
    for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++) grid[z+dz][x+dx]=0;
  }
  const spawn={x:1.5,z:1.5}, reach=distancesFrom(grid,[1,1]);
  const candidates=[...reach.entries()].map(([id,d])=>({cell:id.split(',').map(Number),d}))
    .filter(item=>item.d>4).sort((a,b)=>b.d-a.d);
  const exit=tileCenter(candidates[0].cell), reserved=[spawn,exit];
  function place(count, minDistance, sample=2) {
    const available=shuffle(candidates.filter(item=>item.d>=minDistance).slice(),random);
    const placed=[];
    for(const candidate of available) {
      const p=tileCenter(candidate.cell);
      if([...reserved,...placed].every(other=>distance(other,p)>sample)) placed.push(p);
      if(placed.length>=count) break;
    }
    if(placed.length<count) throw Error(`Not enough spawn slots for ${chapter.id}`);
    reserved.push(...placed);
    return placed;
  }
  const objectives=place(chapter.target, Math.max(7,Math.floor(size/3)),3.2)
    .map((position,index)=>({...position,id:`${chapter.id}-objective-${index}`,done:false,index}));
  const notes=place(3,5,2.6).map((position,index)=>({...position,id:`${chapter.id}-note-${index}`,done:false,index}));
  const pickLocations=place(10,2,1.4);
  const items=pickLocations.map((position,index)=>({
    ...position,id:`${chapter.id}-item-${index}`,done:false,
    type:index===0?'pistol':index===1&&chapter.number>=2?'shotgun':index===2&&chapter.number>=3?'nailgun':index===3&&chapter.number>=4?'flare':
      index%4===0?'medkit':index%3===0?'battery':index%2===0?'ammo':'shells'
  }));
  // Initial supplies are intentionally placed close to the starting room.
  Object.assign(items[0],tileCenter(neighbors(grid,[1,1])[0])); // guaranteed reachable first weapon
  const available=shuffle(candidates.filter(p=>p.d>=Math.max(8,Math.floor(size/3))),random);
  const enemies=[];
  chapter.enemyTypes.forEach((type,index)=>{
    const loc=available.find(p=>distance(tileCenter(p.cell),spawn)>7 &&
      enemies.every(e=>distance(e,tileCenter(p.cell))>3));
    if(!loc) return;
    available.splice(available.indexOf(loc),1);
    const e=ENEMIES[type];
    enemies.push({...tileCenter(loc.cell),id:`${chapter.id}-enemy-${index}`,
      type,hp:e.hp,maxHp:e.hp,dead:false,stun:0,attackCooldown:0,
      path:[],repath:0,mode:type==='archivist'?'sealed':'patrol',alert:0,
      facing:random()*Math.PI*2,phase:random()*Math.PI*2,blink:4+random()*3});
  });
  const consolePosition=chapter.number===2||chapter.number===4 ?
    place(1,Math.max(8,Math.floor(size/3)),3)[0] : null;
  return {grid,size,spawn,exit,objectives,notes,items,enemies,
    console:consolePosition?{...consolePosition,done:false}:null, seed};
}
export function createRun(chapterIndex=0,difficulty='normal',challenge='campaign',seedOverride=null,carry=null) {
  const chapter=CHAPTERS[chapterIndex];
  if(!chapter||!DIFFICULTIES[difficulty]) throw Error('Invalid chapter or difficulty');
  const level=buildLevel(chapter,seedOverride??chapter.seed);
  const weaponState={};
  for(const [id,def] of Object.entries(WEAPONS)) {
    const earned=carry?.weapons?.[id]?.owned||(
      id==='pistol'&&chapterIndex>=1 || id==='shotgun'&&chapterIndex>=2 ||
      id==='nailgun'&&chapterIndex>=3 || id==='flare'&&chapterIndex>=4);
    weaponState[id]={owned:!!earned,mag:earned?def.starting:0,
      reserve:earned?Math.round(def.reserve*DIFFICULTIES[difficulty].ammo):0};
  }
  const firstCorridor=neighbors(level.grid,[1,1])[0];
  const facing=Math.atan2(firstCorridor[0]-1,1-firstCorridor[1]);
  const player={...level.spawn,yaw:facing,pitch:0,hp:carry?.hp?Math.max(65,carry.hp):100,
    battery:carry?.battery?Math.max(50,carry.battery):100,stamina:100,
    flashlight:challenge!=='blackout',weapon:weaponState.pistol.owned?'pistol':'none',
    weapons:weaponState,reloadTimer:0,fireCooldown:0,muzzle:0,recoil:0,
    hurt:0,stepTimer:0,death:false};
  return {chapterIndex,chapter,level,difficulty,challenge,player,
    elapsed:0,shots:0,hits:0,kills:0,damageTaken:0,steps:0,noise:0,
    objectiveCount:0,notesFound:0,phase:'play',finished:false,events:[],
    totalNotes:carry?.totalNotes||0,allNotes:carry?.allNotes||[],
    totalElapsed:carry?.totalElapsed||0};
}
function event(run,type,text,extra={}) {run.events.push({type,text,...extra});}
export function canMove(grid,x,z,radius=0.23) {
  for(const dx of [-radius,radius]) for(const dz of [-radius,radius])
    if(isWall(grid,x+dx,z+dz)) return false;
  return true;
}
function moveEntity(grid,entity,dx,dz,radius=0.23) {
  if(canMove(grid,entity.x+dx,entity.z,radius)) entity.x+=dx;
  if(canMove(grid,entity.x,entity.z+dz,radius)) entity.z+=dz;
}
export function interact(run) {
  if(run.phase!=='play') return false;
  const {level,player,chapter}=run;
  const nearby=level.objectives.find(o=>!o.done&&distance(o,player)<1.3);
  if(nearby) {
    nearby.done=true;run.objectiveCount++;
    event(run,'objective',`${chapter.objective}: ${run.objectiveCount}/${chapter.target}`);
    if(run.objectiveCount===chapter.target) {
      if(level.console) event(run,'message','ALL FOUND. FIND THE MAIN CONSOLE.');
      else if(chapter.number===5) event(run,'message','ANCHORS BROKEN. THE ARCHIVIST IS VULNERABLE.');
      else event(run,'message','THE RED EXIT IS NOW UNLOCKED.');
    }
    return true;
  }
  if(level.console&&!level.console.done&&distance(level.console,player)<1.6) {
    if(run.objectiveCount<chapter.target) event(run,'message','ERROR: RECOVER ALL COMPONENTS FIRST.');
    else {level.console.done=true;event(run,'console','THE SYSTEM RESPONDS. EXIT UNLOCKED.');}
    return true;
  }
  if(distance(level.exit,player)<1.65) {
    if(run.objectiveCount<chapter.target) event(run,'message','RED DOOR LOCKED. COMPLETE THE OBJECTIVE.');
    else if(level.console&&!level.console.done) event(run,'message','THE MAIN CONSOLE STILL HAS NO POWER.');
    else if(chapter.number===5&&run.challenge!=='pacifist'&&level.enemies.some(e=>e.type==='archivist'&&!e.dead))
      event(run,'message','THE ARCHIVIST STILL GUARDS THE CARRIER.');
    else {run.phase='complete';run.finished=true;event(run,'complete',chapter.outro);}
    return true;
  }
  return false;
}
export function reload(run) {
  const p=run.player,w=WEAPONS[p.weapon],state=p.weapons[p.weapon];
  if(!w||!state||p.reloadTimer>0||state.mag>=w.size||state.reserve<=0||run.phase!=='play') return false;
  p.reloadTimer=w.reload;
  event(run,'reload','RELOADING');return true;
}
export function selectWeapon(run,id) {
  if(id==='none'||(!run.player.weapons[id]?.owned)||run.phase!=='play') return false;
  run.player.weapon=id;run.player.reloadTimer=0;
  event(run,'equip',WEAPONS[id].name);return true;
}
export function cycleWeapon(run,direction=1) {
  const keys=Object.keys(WEAPONS).filter(k=>run.player.weapons[k].owned);
  if(!keys.length) return false;
  const current=Math.max(0,keys.indexOf(run.player.weapon));
  return selectWeapon(run,keys[(current+direction+keys.length)%keys.length]);
}
export function fire(run,random=Math.random) {
  const p=run.player,def=WEAPONS[p.weapon],state=p.weapons[p.weapon];
  if(run.phase!=='play'||p.fireCooldown>0||p.reloadTimer>0||!def||!state||!state.owned) return false;
  if(run.challenge==='pacifist') {event(run,'message','SILENT HANDS: NO GUNFIRE.');return false;}
  if(state.mag<=0) {reload(run);event(run,'empty','EMPTY');return false;}
  state.mag--;p.fireCooldown=def.rate;p.muzzle=0.14;p.recoil=0.26;
  run.shots++;run.noise=Math.max(run.noise, 1.8);
  event(run,'shot','', {weapon:p.weapon});
  const enemies=run.level.enemies.filter(e=>!e.dead).sort((a,b)=>distance(a,p)-distance(b,p));
  for(let pellet=0;pellet<def.pellets;pellet++) {
    const offset=(random()*2-1)*def.spread;
    for(const e of enemies) {
      const d=distance(p,e);
      if(d>16||d<0.1) continue;
      const angle=wrapAngle(Math.atan2(e.x-p.x,-(e.z-p.z))-(p.yaw+offset));
      if(Math.abs(angle)>Math.atan2(ENEMIES[e.type].size*.48,d)) continue;
      if(!hasLOS(run.level.grid,p,e)) continue;
      let damage=def.damage*(e.type==='husk'?0.56:1);
      if(e.type==='archivist'&&run.objectiveCount<run.chapter.target) damage=0;
      e.hp-=damage;e.stun=Math.max(e.stun,def.stun||0.18);e.mode='chase';e.alert=5;
      run.hits++;event(run,'hit',damage===0?'SHIELDED':'', {enemy:e.type});
      if(e.hp<=0) {e.dead=true;e.mode='dead';run.kills++;event(run,'kill',`${ENEMIES[e.type].name} FALLS.`);}
      break;
    }
  }
  for(const e of run.level.enemies) if(!e.dead && distance(e,p)<ENEMIES[e.type].hearing+4) e.alert=6;
  return true;
}
function updateEnemies(run,dt) {
  const {level,player:p}=run,scale=DIFFICULTIES[run.difficulty];
  for(const enemy of level.enemies) {
    if(enemy.dead) continue;
    enemy.phase+=dt; enemy.attackCooldown=Math.max(0,enemy.attackCooldown-dt);
    enemy.alert=Math.max(0,enemy.alert-dt);enemy.stun=Math.max(0,enemy.stun-dt);
    const def=ENEMIES[enemy.type],d=distance(enemy,p);
    if(enemy.type==='archivist'&&run.objectiveCount<run.chapter.target) {
      enemy.mode='sealed'; continue;
    }
    const angle=Math.abs(wrapAngle(Math.atan2(enemy.x-p.x,-(enemy.z-p.z))-p.yaw));
    const watched=def.special==='watch'&&angle<0.32&&d<18&&hasLOS(level.grid,p,enemy);
    if(watched) {enemy.mode='frozen'; continue;}
    if(enemy.stun>0) {enemy.mode='stunned';continue;}
    const sees=d<def.sight*(p.crouching?.72:1)&&hasLOS(level.grid,enemy,p);
    const hears=(run.noise>0.2&&d<def.hearing+run.noise*2);
    if(sees||hears||enemy.alert>0) enemy.mode='chase';
    if(enemy.mode==='frozen'||enemy.mode==='stunned') enemy.mode='patrol';
    if(enemy.mode==='chase') {
      enemy.repath-=dt;
      if(enemy.repath<=0){enemy.path=findPath(level.grid,enemy,p);enemy.repath=0.38+Math.random()*0.18;}
      const waypoint=enemy.path.length>1?enemy.path[1]:p;
      const dx=waypoint.x-enemy.x,dz=waypoint.z-enemy.z,len=Math.hypot(dx,dz);
      if(len>0.03) {
        const speed=def.speed*scale.enemySpeed*(run.chapter.number===5?1.06:1);
        moveEntity(level.grid,enemy,dx/len*Math.min(len,speed*dt),dz/len*Math.min(len,speed*dt),0.23);
        enemy.facing=Math.atan2(dx,-dz);
      }
      if(d<0.87+def.size*0.2&&enemy.attackCooldown<=0) {
        const damage=Math.round(def.damage*scale.enemyDamage);
        p.hp=clamp(p.hp-damage,0,100);run.damageTaken+=damage;
        p.hurt=0.85;enemy.attackCooldown=1.25;
        event(run,'hurt',`${def.name} ATTACKS`,{damage});
        if(p.hp<=0){p.death=true;run.phase='dead';event(run,'death','YOU HAVE BEEN TAKEN.');}
      }
    } else if(enemy.mode==='patrol') {
      // Slow idle drift within its own room; alert state still uses pathfinding.
      enemy.facing+=Math.sin(enemy.phase*.35)*dt*.03;
    }
    if(def.special==='blink'&&enemy.mode==='chase') {
      enemy.blink-=dt;
      if(enemy.blink<=0&&d>4&&d<13) {
        const path=findPath(level.grid,enemy,p);
        const jump=path[Math.max(1,path.length-4)];
        if(jump&&distance(jump,p)>2&&canMove(level.grid,jump.x,jump.z)) {
          enemy.x=jump.x;enemy.z=jump.z;event(run,'teleport','RADIO INTERFERENCE');
        }
        enemy.blink=6;
      }
    }
  }
}
export function updateRun(run,controls,dt) {
  run.events=[];
  if(run.phase!=='play') return run.events;
  dt=clamp(dt,0,0.05);run.elapsed+=dt;run.totalElapsed+=dt;
  const p=run.player,scale=DIFFICULTIES[run.difficulty];
  p.yaw=wrapAngle(p.yaw+(controls.turn||0));
  p.pitch=clamp(p.pitch+(controls.pitch||0),-1.1,1.1);
  p.hurt=Math.max(0,p.hurt-dt);p.muzzle=Math.max(0,p.muzzle-dt);
  p.recoil=Math.max(0,p.recoil-dt*1.9);
  p.fireCooldown=Math.max(0,p.fireCooldown-dt);
  if(p.reloadTimer>0) {
    p.reloadTimer-=dt;
    if(p.reloadTimer<=0) {
      const def=WEAPONS[p.weapon],w=p.weapons[p.weapon];
      if(def&&w) {const count=Math.min(def.size-w.mag,w.reserve);w.mag+=count;w.reserve-=count;event(run,'reloadEnd','READY');}
      p.reloadTimer=0;
    }
  }
  run.noise=Math.max(0,run.noise-dt*0.9);
  const forward=clamp(controls.forward||0,-1,1),strafe=clamp(controls.strafe||0,-1,1);
  const moving=Math.hypot(forward,strafe)>0.01;
  const crouching=!!controls.crouch; p.crouching=crouching;
  const sprint=!!controls.sprint&&!crouching&&moving&&p.stamina>5;
  if(sprint) p.stamina=Math.max(0,p.stamina-dt*19);
  else p.stamina=Math.min(100,p.stamina+dt*13);
  const speed=2.75*scale.playerSpeed*(crouching?0.56:sprint?1.58:1)*(p.stamina<=0?0.84:1);
  const mx=(Math.sin(p.yaw)*forward+Math.cos(p.yaw)*strafe)*speed*dt;
  const mz=(-Math.cos(p.yaw)*forward+Math.sin(p.yaw)*strafe)*speed*dt;
  if(moving) {
    const norm=Math.max(1,Math.hypot(forward,strafe));
    moveEntity(run.level.grid,p,mx/norm,mz/norm);
    run.noise=Math.max(run.noise,crouching?0.02:sprint?0.95:0.2);
    p.stepTimer-=dt;
    if(p.stepTimer<=0) {p.stepTimer=crouching?0.82:sprint?0.33:0.52;run.steps++;if(!crouching)event(run,'step','',{sprint});}
  }
  if(p.flashlight&&run.challenge!=='blackout') {
    p.battery=Math.max(0,p.battery-dt*(run.chapter.number===4?1.7:1.1));
    if(p.battery===0){p.flashlight=false;event(run,'batteryEmpty','YOUR LIGHT GOES OUT.');}
  }
  for(const o of run.level.notes) if(!o.done&&distance(p,o)<0.72) {
    o.done=true;run.notesFound++;run.totalNotes++;
    const doc=run.chapter.notes[o.index];
    run.allNotes.push({chapter:run.chapterIndex,index:o.index,...doc});
    event(run,'note',doc.title,{body:doc.body});
  }
  for(const item of run.level.items) {
    if(item.done||distance(item,p)>0.65) continue;
    const w=p.weapons[item.type];
    if(w) {w.owned=true;w.mag=Math.max(w.mag,WEAPONS[item.type].starting);w.reserve+=WEAPONS[item.type].reserve;
      if(p.weapon==='none') p.weapon=item.type;
      event(run,'pickup',`FOUND: ${WEAPONS[item.type].name}`);
    } else if(item.type==='battery') {
      if(p.battery>=97) continue;
      p.battery=clamp(p.battery+42,0,100);event(run,'pickup','+ BATTERY');
    } else if(item.type==='medkit') {
      if(p.hp>=96) continue;
      p.hp=clamp(p.hp+Math.round(42*scale.medkit),0,100);event(run,'pickup','+ FIRST AID');
    } else if(item.type==='ammo') {
      p.weapons.pistol.reserve+=Math.round(11*scale.ammo);event(run,'pickup','+ PISTOL AMMO');
    } else if(item.type==='shells') {
      p.weapons.shotgun.reserve+=Math.max(2,Math.round(4*scale.ammo));event(run,'pickup','+ SHOTGUN SHELLS');
    }
    item.done=true;
  }
  updateEnemies(run,dt);
  if(controls.fire) fire(run);
  if(controls.interact) interact(run);
  if(run.challenge==='speedrun'&&run.totalElapsed>=30*60) {
    run.phase='dead';event(run,'death','THE CLOCK RAN OUT.');
  }
  return run.events;
}
export function objectiveLabel(run) {
  const {chapter,level,objectiveCount}=run;
  if(objectiveCount<chapter.target) return `${chapter.objective}   ${objectiveCount}/${chapter.target}`;
  if(level.console&&!level.console.done) return 'ACTIVATE MAIN CONSOLE  [E]';
  if(chapter.number===5&&run.challenge!=='pacifist'&&level.enemies.some(e=>e.type==='archivist'&&!e.dead))
    return 'DESTROY THE ARCHIVIST';
  return 'REACH THE RED EXIT  [E]';
}
export function finishStats(run) {
  return {chapter:run.chapterIndex+1,time:Math.floor(run.elapsed),shots:run.shots,hits:run.hits,
    kills:run.kills,damageTaken:run.damageTaken,notes:run.notesFound,objectives:run.objectiveCount};
}
