/** Dependency-free PS1-inspired software raycaster and procedural sprite studio. */
import { ENEMIES, WEAPONS } from './content.js';
import { clamp, distance, isWall, objectiveLabel, wrapAngle } from './simulation.js';

let W=480,H=270;
function offscreen(w,h) {const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function makeTexture(base,tile,seed) {
  const c=offscreen(64,64),g=c.getContext('2d');
  const rng=(()=>{let n=seed;return()=>((n=(n*1664525+1013904223)>>>0)/4294967296);})();
  g.fillStyle=base;g.fillRect(0,0,64,64);
  for(let y=0;y<64;y+=8){
    g.fillStyle='rgba(0,0,0,.21)';g.fillRect(0,y,64,1);
    for(let x=0;x<64;x+=16) {
      const start=x+((y/8)%2)*8;
      g.fillRect(start,y,1,8);
    }
  }
  if(tile===1) { // tile / clinical enamel
    g.strokeStyle='rgba(180,212,197,.2)';g.lineWidth=1;
    for(let y=0;y<64;y+=16) {g.beginPath();g.moveTo(0,y);g.lineTo(64,y);g.stroke();}
  }
  if(tile===2) { // corroded steel ribs
    for(let x=0;x<64;x+=12){g.fillStyle='rgba(0,0,0,.34)';g.fillRect(x,0,3,64);g.fillStyle='rgba(255,172,73,.09)';g.fillRect(x+3,0,1,64);}
  }
  if(tile===3) { // transmitter equipment
    for(let y=0;y<64;y+=16){g.fillStyle='rgba(26,10,43,.4)';g.fillRect(0,y,64,5);g.fillStyle='rgba(218,120,253,.2)';g.fillRect(7,y+1,28,1);}
  }
  for(let i=0;i<410;i++){
    const x=rng()*64,y=rng()*64,alpha=rng()*.18;
    g.fillStyle=`rgba(${rng()>.5?'0,0,0':'208,172,146'},${alpha})`;
    g.fillRect(x|0,y|0,(1+rng()*3)|0,(1+rng()*4)|0);
  }
  for(let i=0;i<6;i++){
    g.fillStyle='rgba(69,13,17,.22)';g.fillRect(rng()*64,rng()*64,1+rng()*5,3+rng()*16);
  }
  return c;
}
function makeSprite(kind,color='#c0b8a8') {
  const c=offscreen(96,128),g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const px=(x,y,w,h,clr)=>{g.fillStyle=clr;g.fillRect(x,y,w,h);};
  const glow=(x,y,r,col)=>{const gr=g.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'transparent');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);};
  if(kind==='door') {
    glow(48,67,52,'rgba(240,44,42,.38)');
    px(16,9,64,116,'#150e12');px(19,12,58,110,'#851b20');px(26,18,44,99,'#260c13');
    px(21,14,4,105,'#dc3636');px(72,14,4,105,'#dc3636');px(21,14,55,4,'#f45547');
    px(63,74,4,7,'#d0a77a');px(33,23,30,1,'#b13131');
    return c;
  }
  if(kind==='sigil'||kind==='anchor'){
    glow(48,60,42,kind==='anchor'?'rgba(253,45,100,.55)':'rgba(204,211,157,.4)');
    g.strokeStyle=kind==='anchor'?'#f45a70':'#bce3c2';g.lineWidth=4;
    g.beginPath();g.moveTo(48,28);g.lineTo(69,55);g.lineTo(48,91);g.lineTo(27,55);g.closePath();g.stroke();
    px(44,43,8,29,kind==='anchor'?'#f2a8a3':'#e5e8cd');
    px(26,55,44,4,'rgba(223,227,211,.8)');return c;
  }
  if(kind==='note') {
    glow(48,81,24,'rgba(238,190,95,.3)');px(29,61,39,49,'#8c7962');px(33,65,32,39,'#ded2ac');
    for(let y=72;y<98;y+=7)px(38,y,22,1,'#7a524f');return c;
  }
  if(kind==='console') {
    glow(48,72,48,'rgba(67,153,206,.4)');px(24,28,48,75,'#171a25');px(28,34,40,35,'#356e83');
    for(let y=38;y<65;y+=7)px(34,y,26,2,'#93d4d4');px(40,75,12,8,'#b93534');px(24,100,48,3,'#75827c');return c;
  }
  if(['pistol','shotgun','nailgun','flare','ammo','shells','battery','medkit'].includes(kind)) {
    glow(48,89,29,'rgba(214,182,104,.23)');
    const metal=kind==='medkit'?'#bdbdb6':kind==='battery'?'#7b9669':kind==='flare'?'#d55c49':'#8c9b91';
    px(31,73,34,29,'#292a29');px(35,75,26,24,metal);
    if(kind==='medkit'){px(45,79,8,16,'#9b292e');px(40,84,18,6,'#9b292e');}
    else if(kind==='ammo'||kind==='shells') for(let x=38;x<61;x+=7)px(x,78,4,18,'#dbb875');
    else if(kind==='battery')px(45,78,7,18,'#e5d9a2');
    else {px(21,73,56,9,metal);px(30,83,9,20,'#45332c');}
    return c;
  }
  const shadow='#121018',dark='#383036',light=color,eye=kind==='watcher'?'#ff4b37':'#f7c9b0';
  if(kind==='crawler') {
    glow(47,84,25,'rgba(219,79,61,.18)');
    px(12,95,74,9,shadow);px(23,82,51,23,dark);px(26,77,46,17,light);
    px(39,64,22,25,dark);px(42,65,20,14,light);
    px(46,75,4,3,eye);px(56,75,4,3,eye);
    px(7,101,19,6,light);px(72,101,18,6,light);px(20,104,8,15,dark);px(69,104,7,15,dark);
    return c;
  }
  if(kind==='husk') {
    glow(48,66,50,'rgba(197,71,27,.16)');
    px(18,48,60,45,dark);px(24,46,48,46,light);px(29,16,38,31,light);px(24,22,48,6,shadow);
    px(20,80,19,44,dark);px(57,80,19,44,dark);px(8,52,14,49,light);px(74,52,14,49,light);
    px(33,29,8,5,eye);px(55,29,8,5,eye);px(39,39,18,5,shadow);
    for(let y=55;y<88;y+=9)px(29,y,39,3,'#281a1a');
    return c;
  }
  if(kind==='siren') {
    glow(48,64,44,'rgba(198,121,218,.22)');
    px(35,27,27,27,light);px(31,20,35,17,shadow);px(30,54,36,56,light);
    px(28,103,13,23,dark);px(55,103,13,23,dark);
    px(21,59,9,42,light);px(65,59,9,42,light);
    px(38,39,7,3,eye);px(54,39,7,3,eye);px(38,46,23,3,shadow);
    for(let y=62;y<104;y+=6) px(31,y,33,2,'rgba(255,255,255,.2)');
    return c;
  }
  if(kind==='archivist') {
    glow(48,57,51,'rgba(231,79,75,.3)');px(21,21,54,35,dark);px(27,23,42,31,light);
    for(let x=17;x<86;x+=10) px(x,46,6,70,dark);
    px(18,57,60,49,light);px(36,79,24,26,shadow);px(42,37,12,6,'#f65c55');
    px(36,46,24,6,shadow);px(29,14,38,6,'#e1ad9e');
    return c;
  }
  // Watcher + Matron share humanoid geometry but have different heads.
  glow(48,64,43,kind==='watcher'?'rgba(206,44,42,.18)':'rgba(157,179,169,.2)');
  px(34,18,29,27,light);px(32,46,34,43,light);
  px(26,53,11,54,light);px(63,53,11,54,light);px(35,86,13,39,dark);px(53,86,13,39,dark);
  if(kind==='watcher'){
    px(40,27,6,5,eye);px(52,27,6,5,eye);px(43,38,12,4,shadow);
    px(27,46,43,7,'#321b1e');
  } else {
    px(30,20,39,10,'#eee8d3');px(41,25,15,4,'#973d3f');px(46,20,5,14,'#973d3f');
    px(39,35,8,3,eye);px(53,35,8,3,eye);px(34,70,30,7,'#a8a7a4');
  }
  return c;
}

export class HorrorRenderer {
  constructor(canvas,minimap) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
    this.canvas.width=W;this.canvas.height=H;this.ctx.imageSmoothingEnabled=false;
    this.mapCanvas=minimap;this.mapCtx=minimap.getContext('2d');
    this.depth=new Float32Array(W);this.spriteCache=new Map();this.textureCache=new Map();
    this.frame=0;this.lastChapter=null;this.grain=offscreen(96,54);
  }
  sprite(type,color) {
    const key=`${type}|${color}`;
    if(!this.spriteCache.has(key)) this.spriteCache.set(key,makeSprite(type,color));
    return this.spriteCache.get(key);
  }
  textures(chapter) {
    if(this.lastChapter===chapter.id) return;
    this.lastChapter=chapter.id;
    this.textureCache.set(chapter.id,makeTexture(chapter.palette[0],Math.min(3,chapter.number-1),chapter.seed));
  }
  render(run,settings) {
    if(!run)return;
    const nextW=Math.round(480*(settings.resolution||1)),nextH=Math.round(270*(settings.resolution||1));
    if(W!==nextW||H!==nextH){W=nextW;H=nextH;this.canvas.width=W;this.canvas.height=H;this.depth=new Float32Array(W);this.ctx.imageSmoothingEnabled=false;}
    const g=this.ctx,{level,player:p,chapter}=run;
    this.textures(chapter);this.frame++;
    const fov=settings.fov*Math.PI/180,half=Math.tan(fov/2);
    const horizon=H/2+p.pitch*65;
    const sky=g.createLinearGradient(0,0,0,horizon);
    sky.addColorStop(0,'#030507');sky.addColorStop(1,chapter.palette[1]);
    g.fillStyle=sky;g.fillRect(0,0,W,Math.max(0,horizon));
    const floor=g.createLinearGradient(0,horizon,0,H);
    floor.addColorStop(0,chapter.palette[1]);floor.addColorStop(1,'#050506');
    g.fillStyle=floor;g.fillRect(0,horizon,W,H-horizon);
    // Floor seams and environmental strip lights add visual depth.
    g.strokeStyle='rgba(143,131,116,.075)';g.lineWidth=1;
    for(let line=0;line<10;line++){
      const y=horizon+Math.pow(line/10,1.6)*(H-horizon);
      g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();
    }
    const texture=this.textureCache.get(chapter.id);
    for(let x=0;x<W;x+=2) {
      const cameraX=(2*(x+.5)/W-1)*half;
      const sine=Math.sin(p.yaw),cosine=Math.cos(p.yaw);
      const rayX=sine+cosine*cameraX, rayZ=-cosine+sine*cameraX;
      let mapX=Math.floor(p.x),mapZ=Math.floor(p.z),side=0;
      const deltaX=Math.abs(1/(rayX||1e-10)),deltaZ=Math.abs(1/(rayZ||1e-10));
      const stepX=rayX<0?-1:1,stepZ=rayZ<0?-1:1;
      let sideX=(rayX<0?p.x-mapX:mapX+1-p.x)*deltaX;
      let sideZ=(rayZ<0?p.z-mapZ:mapZ+1-p.z)*deltaZ;
      let steps=0;
      while(steps++<54) {
        if(sideX<sideZ){sideX+=deltaX;mapX+=stepX;side=0;}
        else {sideZ+=deltaZ;mapZ+=stepZ;side=1;}
        if(isWall(level.grid,mapX,mapZ))break;
      }
      const dist=Math.max(.06,side===0?sideX-deltaX:sideZ-deltaZ);
      this.depth[x]=dist;this.depth[x+1]=dist;
      const height=Math.min(H*6,H*.95/dist),top=Math.floor(horizon-height/2);
      const hit=side===0?p.z+dist*rayZ:p.x+dist*rayX;
      let texX=Math.floor((hit-Math.floor(hit))*63);
      if((side===0&&rayX>0)||(side===1&&rayZ<0)) texX=63-texX;
      // Fog + flashlight directional cone, both affected by player settings.
      const cone=Math.max(0,1-Math.abs(cameraX)/(.53));
      const light=p.flashlight?0.33+0.63*Math.pow(cone,1.5)*(p.battery/100):0.16;
      const flicker=1+0.04*Math.sin(this.frame*.047+mapX*.83+mapZ*1.73);
      const fog=Math.exp(-dist*chapter.fog*.72);
      const brightness=clamp((light+0.11)*flicker*fog*settings.brightness,0.05,1.25);
      g.globalAlpha=1;
      g.drawImage(texture,texX,0,1,64,x,top,2,height+1);
      g.fillStyle=`rgba(2,4,5,${clamp(1-brightness,0,.96)})`;
      g.fillRect(x,top,2,height+1);
      if(side===1){g.fillStyle='rgba(0,0,0,.23)';g.fillRect(x,top,2,height+1);}
    }
    // Sort billboard sprites furthest-first and clip each column against walls.
    const sprites=[
      ...level.items.filter(i=>!i.done).map(i=>({...i,kind:i.type,size:0.45,height:.36})),
      ...level.notes.filter(i=>!i.done).map(i=>({...i,kind:'note',size:0.65,height:.58})),
      ...level.objectives.filter(i=>!i.done).map(i=>({...i,kind:chapter.number===5?'anchor':'sigil',size:1.0,height:0.8})),
      ...level.enemies.filter(i=>!i.dead).map(i=>({...i,kind:i.type,size:ENEMIES[i.type].size*2,height:0})),
      ...(level.console&&!level.console.done?[{...level.console,kind:'console',size:1.6,height:0}]:[]),
      {...level.exit,kind:'door',size:2.4,height:0}
    ].sort((a,b)=>distance(p,b)-distance(p,a));
    for(const s of sprites){
      const d=distance(s,p);
      if(d<.12||d>22)continue;
      const bearing=Math.atan2(s.x-p.x,-(s.z-p.z));
      const angle=wrapAngle(bearing-p.yaw);
      if(Math.abs(angle)>fov*.7) continue;
      const forwardDist=Math.max(.01,d*Math.cos(angle));
      const size=H*s.size/(forwardDist*1.25),width=size*(96/128);
      const cx=W/2+Math.tan(angle)/half*W/2;
      const cy=horizon+size*.20-s.height*size*.5;
      if(cx+width/2<0||cx-width/2>W)continue;
      const sprite=this.sprite(s.kind,ENEMIES[s.kind]?.color||'#c9bdb1');
      const alpha=clamp(Math.exp(-d*chapter.fog*.38)*(p.flashlight?.95:.63)*settings.brightness,.12,1);
      g.globalAlpha=alpha;
      for(let col=Math.max(0,Math.floor(cx-width/2));col<Math.min(W,cx+width/2);col+=2) {
        if(forwardDist>=this.depth[col]-.06) continue;
        const tx=clamp(Math.floor((col-(cx-width/2))/width*96),0,95);
        g.drawImage(sprite,tx,0,2,128,col,cy-size/2,2,Math.max(1,size));
      }
      g.globalAlpha=1;
    }
    this.weapon(g,p,run);
    if(p.hurt>0){g.fillStyle=`rgba(152,13,15,${p.hurt*.22})`;g.fillRect(0,0,W,H);}
    if(run.chapter.number===4) {
      const noise=g.createLinearGradient(0,0,W,0);noise.addColorStop(0,'rgba(57,26,75,.08)');noise.addColorStop(1,'rgba(77,89,134,.03)');
      g.fillStyle=noise;g.fillRect(0,0,W,H);
    }
    if(settings.scanlines){g.fillStyle='rgba(0,0,0,.12)';for(let y=1;y<H;y+=3)g.fillRect(0,y,W,1);}
    // Original real-time film grain: deliberately sparse for performance.
    g.fillStyle='rgba(196,211,192,.08)';for(let i=0;i<115;i++)g.fillRect(Math.random()*W|0,Math.random()*H|0,1,1);
    const vig=g.createRadialGradient(W/2,H/2,30,W/2,H/2,W*.61);
    vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.76)');
    g.fillStyle=vig;g.fillRect(0,0,W,H);
    this.renderMap(run,settings.minimap);
  }
  weapon(g,p,run){
    const w=WEAPONS[p.weapon];
    if(!w)return;
    const bob=Math.sin(run.elapsed*11)*.9,offset=p.recoil*29;
    const cx=W*.57,cy=H-2+bob+offset;
    g.save();g.translate(cx,cy);
    const metal=w.color;
    g.fillStyle='#1a1d21';g.fillRect(-21,-48,45,60);g.fillStyle='#40413f';g.fillRect(-18,-56,36,46);
    g.fillStyle=metal;g.fillRect(-14,-74,28,29);g.fillStyle='#1d2525';g.fillRect(-9,-80,18,29);
    g.fillStyle='#bd9d7c';g.fillRect(7,-28,21,38);g.fillStyle='#252525';g.fillRect(14,-47,27,32);
    if(p.weapon==='shotgun'){g.fillStyle='#504136';g.fillRect(-22,-77,44,25);g.fillStyle='#343536';g.fillRect(-13,-106,26,39);}
    if(p.weapon==='nailgun'){g.fillStyle='#c17a39';g.fillRect(-25,-72,50,26);g.fillStyle='#2a2626';g.fillRect(-8,-93,16,33);}
    if(p.weapon==='flare'){g.fillStyle='#b94333';g.fillRect(-18,-71,36,35);}
    if(p.muzzle>0){g.fillStyle=`rgba(255,204,91,${p.muzzle/.14})`;g.beginPath();g.moveTo(0,-86);g.lineTo(-20,-116);g.lineTo(-5,-107);g.lineTo(0,-134);g.lineTo(6,-108);g.lineTo(24,-115);g.closePath();g.fill();}
    g.restore();
  }
  renderMap(run,enabled){
    if(!enabled){this.mapCanvas.hidden=true;return;}
    this.mapCanvas.hidden=false;
    const {grid,size}=run.level,p=run.player;
    const c=this.mapCanvas,g=this.mapCtx;c.width=170;c.height=170;
    const cell=170/size;g.fillStyle='rgba(5,9,11,.89)';g.fillRect(0,0,170,170);
    grid.forEach((row,z)=>row.forEach((wall,x)=>{if(wall){g.fillStyle='#48544d';g.fillRect(x*cell,z*cell,cell-.4,cell-.4);}}));
    g.fillStyle='#eb413c';g.fillRect(run.level.exit.x*cell-2,run.level.exit.z*cell-2,4,4);
    for(const o of run.level.objectives.filter(x=>!x.done)){g.fillStyle='#ebd5aa';g.fillRect(o.x*cell-1.5,o.z*cell-1.5,3,3);}
    g.save();g.translate(p.x*cell,p.z*cell);g.rotate(p.yaw);g.fillStyle='#f4f4e5';
    g.beginPath();g.moveTo(0,-5);g.lineTo(4,4);g.lineTo(-4,4);g.closePath();g.fill();g.restore();
  }
}
