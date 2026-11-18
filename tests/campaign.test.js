import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, DIFFICULTIES, CHALLENGES } from '../src/content.js';
import { createRun, interact, updateRun, distance, objectiveLabel, finishStats } from '../src/simulation.js';

// Contract test: exercise the chapter-completion state machine for every
// difficulty x challenge combination without relying on the renderer.
for (const difficulty of Object.keys(DIFFICULTIES)) {
  for (const challenge of Object.keys(CHALLENGES)) {
    test(`campaign gates complete: ${difficulty}/${challenge}`, () => {
      let carry=null;
      for (let index=0;index<CHAPTERS.length;index++) {
        const run=createRun(index,difficulty,challenge,null,carry);
        for (const note of run.level.notes) {
          run.player.x=note.x;run.player.z=note.z;
          const events=updateRun(run,{},0.04);
          assert.ok(events.some(e=>e.type==='note'),'Collectible note is triggered by proximity');
        }
        for (const objective of run.level.objectives) {
          run.player.x=objective.x;run.player.z=objective.z;
          assert.equal(interact(run),true,`Can interact with objective ${objective.id}`);
        }
        assert.equal(run.objectiveCount,run.chapter.target);
        if(run.level.console) {
          run.player.x=run.level.console.x;run.player.z=run.level.console.z;
          assert.equal(interact(run),true,'Console accepts E interaction');
          assert.equal(run.level.console.done,true);
        }
        if(index===4 && challenge!=='pacifist') {
          // This test focuses the chapter gate; combat/shield tested separately.
          run.level.enemies.find(e=>e.type==='archivist').dead=true;
        }
        assert.match(objectiveLabel(run),/RED EXIT/);
        run.player.x=run.level.exit.x;run.player.z=run.level.exit.z;
        assert.equal(interact(run),true);
        assert.equal(run.phase,'complete',`${run.chapter.name} exit unlocked`);
        assert.equal(run.notesFound,3);
        assert.equal(finishStats(run).chapter,index+1);
        carry={hp:run.player.hp,battery:run.player.battery,weapons:run.player.weapons,
          totalElapsed:run.totalElapsed,totalNotes:run.totalNotes,allNotes:run.allNotes};
      }
      assert.equal(carry.totalNotes,15);
      assert.equal(carry.allNotes.length,15);
      assert.equal(new Set(carry.allNotes.map(n=>n.chapter+'-'+n.index)).size,15);
    });
  }
}

test('The Clock challenge ends run at 30 minutes',()=>{
 const run=createRun(0,'normal','speedrun');run.totalElapsed=1799.99;
 updateRun(run,{},.05);
 assert.equal(run.phase,'dead');
});
test('Silent Hands challenge prevents all gunfire',()=>{
 const run=createRun(1,'normal','pacifist');
 run.player.weapon='pistol';run.player.weapons.pistol.mag=9;
 const before=run.player.weapons.pistol.mag;
 updateRun(run,{fire:true},0.05);
 assert.equal(run.shots,0);assert.equal(run.player.weapons.pistol.mag,before);
});
test('Crouching reduces noise and sprint drains stamina',()=>{
 const run=createRun(0);
 const start=run.player.stamina;
 for(let i=0;i<12;i++)updateRun(run,{forward:1,sprint:true},0.05);
 assert.ok(run.player.stamina<start);
 const crouch=createRun(0);
 updateRun(crouch,{forward:1,crouch:true},0.05);
 assert.ok(crouch.noise<0.1);
});
