import test from 'node:test';
import assert from 'node:assert/strict';

/** DOM/Canvas shim for a headless, dependency-free application state smoke test.
 * This does not replace a real-browser E2E pass. */
function setupDOM() {
  const store=new Map();
  const nodes=new Map();
  const fill={addColorStop(){}};
  const canvasContext=new Proxy({}, {
    get(target,key) {
      if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>fill;
      if(typeof key==='string'&&['fillRect','drawImage','stroke','beginPath','moveTo',
      'lineTo','closePath','save','restore','translate','rotate','clearRect',
      'fill','arc','rect','strokeRect'].includes(key)) return ()=>{};
      return target[key];
    },set(target,key,value){target[key]=value;return true;}
  });
  const newElement=id=>({id,hidden:false,style:{},dataset:{},listeners:{},
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    addEventListener(name,handler){this.listeners[name]=handler;},
    getContext(){return canvasContext;},
    requestPointerLock(){document.pointerLockElement=this;},
    closest(){return this;},
    querySelector(){return {textContent:''};},
    setAttribute(){},textContent:'',innerHTML:'',scrollTop:0});
  const getNode=id=>{if(!nodes.has(id))nodes.set(id,newElement(id));return nodes.get(id);};
  globalThis.window={listeners:{},addEventListener(type,listener){this.listeners[type]=listener;}};
  globalThis.document={pointerLockElement:null,listeners:{},getElementById:getNode,
    createElement:()=>newElement('procedural-canvas'),
    addEventListener(type,listener){this.listeners[type]=listener;},
    exitPointerLock(){this.pointerLockElement=null;this.listeners.pointerlockchange?.();}};
  globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
  globalThis.location={search:'?debug=1'};
  let frame;
  globalThis.requestAnimationFrame=cb=>(frame=cb,1);
  globalThis.performance={now:()=>1000};
  return {getNode,step:()=>frame(1016),click:(action,value)=>getNode('overlay').listeners.click({target:{closest:()=>({dataset:{action,value}})}})};
}

test('app initializes, creates menu, opens a playable campaign, renders a frame and pauses', async()=>{
  const dom=setupDOM();
  await import('../src/main.js?test=menu-smoke');
  assert.match(dom.getNode('overlay').innerHTML,/NEW GAME/);
  assert.equal(window.__mazeDebug.getMode(),'menu');
  dom.click('new');
  assert.match(dom.getNode('overlay').innerHTML,/CHOOSE YOUR FEAR/);
  dom.click('difficulty','normal');
  assert.match(dom.getNode('overlay').innerHTML,/THE MAZE/);
  dom.click('descend');
  assert.equal(window.__mazeDebug.getMode(),'play');
  dom.step();
  assert.ok(window.__mazeDebug.getRun());
  assert.equal(window.__mazeDebug.getRun().chapterIndex,0);
  assert.match(dom.getNode('objective').textContent,/MEMORY/);
  document.listeners.keydown({code:'Escape',repeat:false,preventDefault(){}});
  assert.equal(window.__mazeDebug.getMode(),'pause');
  assert.match(dom.getNode('overlay').innerHTML,/PAUSED/);
  dom.click('settings');
  assert.equal(window.__mazeDebug.getMode(),'settings');
  dom.click('back-settings');
  assert.equal(window.__mazeDebug.getMode(),'pause');
  dom.click('menu');
  assert.equal(window.__mazeDebug.getMode(),'menu');
  delete globalThis.window;delete globalThis.document;delete globalThis.localStorage;
});
