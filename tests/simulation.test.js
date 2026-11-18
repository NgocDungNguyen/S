import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, DIFFICULTIES, WEAPONS } from '../src/content.js';
import { buildLevel, createRun, atCell, isWall, hasLOS, distancesFrom, findPath,
  interact, reload, selectWeapon, fire, updateRun, clamp, objectiveLabel, neighbors } from '../src/simulation.js';

test('all five chapters generate distinct, connected, playable layouts',()=>{
  assert.equal(CHAPTERS.length,5);
  for(const ch of CHAPTERS){
    const level=buildLevel(ch);
    const connected=distancesFrom(level.grid,atCell(level.spawn));
    assert.equal(level.grid.length,ch.size);
    assert.equal(level.objectives.length,ch.target);
    assert.equal(level.notes.length,3);
    assert.equal(level.items.length,10);
    assert.ok(level.enemies.length>=2);
    assert.ok(connected.size>50);
    for(const target of [level.exit,...level.objectives,...level.notes,...level.items,...level.enemies]){
      assert.ok(!isWall(level.grid,target.x,target.z),`${ch.id}: ${JSON.stringify(target)} must be floor`);
      assert.ok(findPath(level.grid,level.spawn,target).length>0,`${ch.id}: reachable location`);
    }
  }
});
test('layout generation is deterministic for fixed seed',()=>{
  const a=buildLevel(CHAPTERS[0]),b=buildLevel(CHAPTERS[0]);
  assert.deepEqual(a.grid,b.grid);assert.deepEqual(a.objectives,b.objectives);
});
test('each difficulty preserves health and valid equipment state',()=>{
  for(const difficulty of Object.keys(DIFFICULTIES)){
    const run=createRun(2,difficulty);
    assert.equal(run.player.hp,100);
    assert.ok(run.player.weapons.pistol.owned);
    assert.ok(run.player.weapons.shotgun.owned);
    assert.ok(run.player.stamina>=100);
    assert.ok(Object.keys(WEAPONS).includes(run.player.weapon));
  }
});
test('movement cannot pass through maze walls',()=>{
  const run=createRun(0);for(let i=0;i<2400;i++)updateRun(run,{forward:1,strafe:0},.016);
  assert.ok(!isWall(run.level.grid,run.player.x,run.player.z));
});
test('objective gates require all memories and open chapter 1 exit',()=>{
  const run=createRun(0);run.player.x=run.level.exit.x;run.player.z=run.level.exit.z;
  assert.equal(interact(run),true);assert.equal(run.phase,'play');
  for(const target of run.level.objectives){run.player.x=target.x;run.player.z=target.z;assert.equal(interact(run),true);}
  assert.equal(run.objectiveCount,run.chapter.target);
  run.player.x=run.level.exit.x;run.player.z=run.level.exit.z;
  assert.equal(interact(run),true);assert.equal(run.phase,'complete');
});
test('chapter 2 requires control console after collecting objectives',()=>{
  const run=createRun(1);run.level.objectives.forEach(o=>o.done=true);run.objectiveCount=3;
  run.player.x=run.level.exit.x;run.player.z=run.level.exit.z;
  interact(run);assert.equal(run.phase,'play');
  run.player.x=run.level.console.x;run.player.z=run.level.console.z;interact(run);
  assert.ok(run.level.console.done);
  run.player.x=run.level.exit.x;run.player.z=run.level.exit.z;interact(run);
  assert.equal(run.phase,'complete');
});
test('chapter 5 shields the boss until four anchors are destroyed',()=>{
  const run=createRun(4);const boss=run.level.enemies.find(e=>e.type==='archivist');
  assert.ok(boss);run.player.weapons.pistol.owned=true;run.player.weapon='pistol';
  const n=neighbors(run.level.grid,atCell(boss))[0];run.player.x=n[0]+.5;run.player.z=n[1]+.5;
  run.player.yaw=Math.atan2(boss.x-run.player.x,-(boss.z-run.player.z));
  const hp=boss.hp;fire(run,()=>0.5);assert.equal(boss.hp,hp);
  run.objectiveCount=run.chapter.target;run.player.fireCooldown=0;
  fire(run,()=>0.5);assert.ok(boss.hp<hp);
});
test('reloading never creates ammunition and does not go negative',()=>{
  const run=createRun(1);run.player.weapon='pistol';
  const w=run.player.weapons.pistol;w.mag=1;w.reserve=4;
  assert.ok(reload(run));for(let i=0;i<30;i++)updateRun(run,{},.05);
  assert.equal(w.mag,5);assert.equal(w.reserve,0);
  assert.equal(reload(run),false);
});
test('weapon switching only permits unlocked weapons',()=>{
  const run=createRun(0);assert.equal(selectWeapon(run,'nailgun'),false);
  run.player.weapons.pistol.owned=true;assert.equal(selectWeapon(run,'pistol'),true);
});
test('challenge blackout disables light and timers run',()=>{
  const run=createRun(0,'normal','blackout');assert.equal(run.player.flashlight,false);
  updateRun(run,{},.05);assert.ok(run.totalElapsed>0);
  assert.equal(objectiveLabel(run).includes('MEMORY'),true);
});
test('LOS is blocked by solid walls and clamp respects bounds',()=>{
  const grid=[[0,1,0],[0,1,0],[0,1,0]];
  assert.equal(hasLOS(grid,{x:.5,z:1.5},{x:2.5,z:1.5}),false);
  assert.equal(clamp(20,0,10),10);
});
