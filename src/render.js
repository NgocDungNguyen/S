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
  // Sharp cracks, water damage, peeling paint, hazard stripes and mold clusters.
  for(let i=0;i<29;i++){
    let x=rng()*64,y=rng()*64;
    g.beginPath();g.moveTo(x,y);
    for(let seg=0;seg<3;seg++){x+=(rng()-.5)*13;y+=3+rng()*9;g.lineTo(x,y);}
    g.strokeStyle=i%3===0?'rgba(7,7,8,.65)':'rgba(12,17,18,.31)';g.lineWidth=i%5===0?1.7:.65;g.stroke();
  }
  for(let i=0;i<20;i++){
    const x=rng()*64,y=rng()*64,r=1+rng()*5;
    const decay=g.createRadialGradient(x,y,0,x,y,r);
    decay.addColorStop(0,'rgba(10,17,12,.42)');decay.addColorStop(1,'rgba(10,17,12,0)');
    g.fillStyle=decay;g.fillRect(x-r,y-r,r*2,r*2);
  }
  if(tile===2){ // oil-soaked machinery, painted safety stripes
    g.save();g.translate(-12,36);g.rotate(-.38);
    for(let x=0;x<98;x+=11){g.fillStyle=x%2?'rgba(17,12,9,.45)':'rgba(199,119,43,.26)';g.fillRect(x,0,7,13);}g.restore();
  }
  if(tile===1){g.fillStyle='rgba(90,26,33,.48)';for(let i=0;i<7;i++)g.fillRect(19+i*4,12+rng()*6,1.2,4+rng()*15);}
  return c;
}
// Distinct hand-coded silhouettes: anatomy, torn fabric, negative-space ribs,
// wet highlights and asymmetrical profiles. No externally licensed textures.
function drawCreature(g,kind,color){
  const seed=[...kind].reduce((n,c)=>n*31+c.charCodeAt(0),913)|0;
  let state=seed>>>0;
  const rand=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
  g.save();g.lineCap='round';g.lineJoin='round';
  const hot=kind==='watcher'?'#f34b3c':kind==='archivist'?'#f4aea0':kind==='siren'?'#ffbfce':'#e8d1a6';
  const flesh=kind==='husk'?'#654b3c':kind==='crawler'?'#6d4947':kind==='siren'?'#a58a9e':kind==='nurse'?'#9ca69c':kind==='archivist'?'#79616c':'#827d76';
  const glow=g.createRadialGradient(48,54,3,48,54,46);
  glow.addColorStop(0,kind==='archivist'?'rgba(209,45,48,.24)':'rgba(114,29,31,.15)');
  glow.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=glow;g.fillRect(0,0,96,128);
  const stroke=(pts,col,w)=>{g.beginPath();g.moveTo(...pts[0]);for(const pt of pts.slice(1))g.lineTo(...pt);g.strokeStyle=col;g.lineWidth=w;g.stroke();};
  // Long trailing shapes make the monster read even at very low resolutions.
  for(let i=0;i<11;i++){
    const x=31+i*3.4+(rand()-.5)*6,ex=x+(rand()-.5)*31;
    stroke([[x,62],[ex,91+rand()*14],[ex+(rand()-.5)*17,111+rand()*18]],'rgba(17,12,15,.82)',2+rand()*4);
  }
  if(kind==='crawler'){
    for(let side of [-1,1])for(let i=0;i<3;i++){
      stroke([[48+side*9,78+i*5],[48+side*(22+i*5),91+i*3],[48+side*(30+i*3),112+i*3]],'#241b1d',5);
      stroke([[48+side*(22+i*5),91+i*3],[48+side*(30+i*3),112+i*3]],flesh,1.7);
    }
    g.fillStyle='#201619';g.beginPath();g.ellipse(47,82,30,13,-.15,0,7);g.fill();
    g.fillStyle=flesh;g.beginPath();g.ellipse(49,74,22,12,-.12,0,7);g.fill();
    g.fillStyle='#2b2020';g.beginPath();g.ellipse(55,62,15,14,.2,0,7);g.fill();
    for(let i=0;i<6;i++){g.fillStyle=rand()>.5?'#a58e84':'#6f5251';g.fillRect(37+rand()*28,66+rand()*16,1+rand()*3,1+rand()*3);}
    for(let [x,y] of [[50,63],[61,65]]){g.shadowColor='#f44b39';g.shadowBlur=9;g.fillStyle='#f7a28c';g.fillRect(x,y,3,2);}
    g.restore();return;
  }
  const large=kind==='husk'||kind==='archivist';
  const headY=kind==='siren'?31:kind==='nurse'?34:28;
  const width=large?23:16;
  // Extended limbs are angular, bent unnaturally at multiple joints.
  for(const sign of [-1,1]){
    const sx=48+sign*(large?21:13);
    const elbowX=sx+sign*(large?19:12)+(rand()-.5)*6;
    stroke([[sx,53],[elbowX,77],[elbowX+sign*(7+rand()*6),106]],'#171418',large?10:7);
    stroke([[sx,53],[elbowX,77],[elbowX+sign*(7+rand()*6),106]],flesh,large?4:2);
    for(let finger=0;finger<4;finger++)stroke([[elbowX+sign*10,107],[elbowX+sign*(10+finger*3),115+rand()*10]],'#1d1518',1.3);
    stroke([[48+sign*9,87],[48+sign*(8+rand()*5),104],[48+sign*(7+rand()*8),126]],'#1a1518',large?11:8);
    stroke([[48+sign*9,88],[48+sign*11,105]],flesh,2.2);
  }
  const cloak=g.createLinearGradient(25,46,73,116);cloak.addColorStop(0,'#19161a');cloak.addColorStop(.5,flesh);cloak.addColorStop(1,'#171115');
  g.fillStyle=cloak;g.beginPath();g.moveTo(48-width,47);g.lineTo(48+width,47);
  g.bezierCurveTo(70,60,64,89,75,122);g.lineTo(24,122);g.bezierCurveTo(30,94,24,60,48-width,47);g.fill();
  // Split torso, ribs and damaged clothing: very deliberate readable voids.
  g.fillStyle='#1b1416';g.beginPath();g.moveTo(47,57);g.lineTo(59,69);g.lineTo(52,100);g.lineTo(42,112);g.closePath();g.fill();
  for(let i=0;i<7;i++){
    const y=61+i*6.6;
    stroke([[33+(i%2)*2,y],[46,y+3],[56,y-1]],i%3?'rgba(210,188,160,.35)':'rgba(42,20,25,.72)',1.3+rand());
  }
  // Head as an organically irregular mask rather than a block face.
  g.fillStyle='#141114';g.beginPath();g.ellipse(48,headY+5,large?20:15,large?26:20,.07,0,7);g.fill();
  const face=g.createLinearGradient(35,12,63,50);face.addColorStop(0,'#272126');face.addColorStop(.5,flesh);face.addColorStop(1,'#2b1d20');
  g.fillStyle=face;g.beginPath();g.moveTo(36,headY-11);g.quadraticCurveTo(47,headY-23,61,headY-8);
  g.lineTo(63,headY+11);g.lineTo(54,headY+25);g.lineTo(42,headY+19);g.lineTo(32,headY+7);g.closePath();g.fill();
  g.fillStyle='#160f14';g.beginPath();g.ellipse(48,headY+12,10,9,0,0,Math.PI*2);g.fill();
  // Jagged mouth teeth; asymmetry is essential to the horror profile.
  g.fillStyle='#dfc9aa';for(let i=0;i<8;i++){
    const x=39+i*2.6;g.beginPath();g.moveTo(x,headY+9);g.lineTo(x+1,headY+14+rand()*4);g.lineTo(x+2,headY+9);g.fill();
  }
  for(let eye=0;eye<2;eye++){
    const x=eye?54:40,y=headY+1+(eye?2:-1);
    g.shadowColor=hot;g.shadowBlur=12;g.fillStyle=hot;g.beginPath();g.ellipse(x,y,kind==='watcher'?3.7:2.1,2.1,.2,0,7);g.fill();
  }g.shadowBlur=0;
  // Chapter-specific mutations distinguish enemies mechanically.
  if(kind==='nurse'){
    stroke([[29,headY-12],[51,headY-17],[67,headY-8]],'#d9d1bd',6);
    stroke([[48,headY-22],[48,headY-8]],'#9d4848',3);
    stroke([[42,headY-16],[54,headY-16]],'#9d4848',3);
    for(let i=0;i<7;i++)stroke([[30+i*5,58],[28+i*6,95+rand()*15]],'rgba(201,207,188,.28)',1.3);
  } else if(kind==='siren'){
    for(let i=0;i<14;i++){
      const x=48+(rand()-.5)*20,y=15+rand()*18;
      stroke([[x,headY-9],[x+(rand()-.5)*26,y-14]],'#2b202b',1.5+rand()*1.5);
    }
    g.strokeStyle='rgba(255,184,193,.55)';g.lineWidth=1;for(let y=60;y<113;y+=7)stroke([[34,y],[60,y+rand()*4]],'rgba(255,175,201,.28)',1);
  } else if(kind==='husk'){
    for(let i=0;i<17;i++){const x=25+rand()*48,y=30+rand()*80;g.fillStyle=rand()>.5?'#9f5b36':'#43312a';g.fillRect(x,y,2+rand()*6,2+rand()*6);}
    stroke([[28,43],[35,23],[43,31],[50,17],[61,29],[70,44]],'#3c2924',6);
  } else if(kind==='archivist'){
    for(let i=0;i<9;i++){
      const x=22+i*7;stroke([[x,48],[x+(rand()-.5)*8,80],[x+(rand()-.5)*19,125]],'rgba(229,181,161,.4)',1.8);
    }
    g.strokeStyle='#dc8c84';g.lineWidth=2;g.beginPath();g.ellipse(48,14,25,7,0,Math.PI,Math.PI*2);g.stroke();
  } else {
    // The Watcher's open chest is an occluding eye motif.
    g.strokeStyle='rgba(200,67,68,.62)';g.lineWidth=2;
    g.beginPath();g.ellipse(47,71,9,17,.14,0,7);g.stroke();
    g.fillStyle='#e64b43';g.fillRect(45,71,5,4);
  }
  // Flakes and lacerations break up every smooth edge.
  for(let i=0;i<48;i++){
    g.fillStyle=rand()>.6?'rgba(211,178,156,.38)':'rgba(17,8,12,.45)';
    const x=27+rand()*42,y=45+rand()*70;g.fillRect(x,y,.6+rand()*2.1,1+rand()*4);
  }
  g.restore();
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
  drawCreature(g,kind,color);return c;
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
    // Volumetric flashlight approximation: cone bloom and smoke in screen space.
    if(p.flashlight && p.battery>0){
      const spread=Math.min(W*.52,H*1.12), cx=W*.5,cy=horizon+H*.08;
      const cone=g.createRadialGradient(cx,cy,4,cx,cy,spread);
      cone.addColorStop(0,`rgba(212,226,203,${.028*p.battery/100})`);
      cone.addColorStop(.45,'rgba(170,202,180,.012)');cone.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=cone;g.fillRect(0,0,W,H);
    }
    // Suspended particulates float through the player's beam and emphasize scale.
    const t=this.frame*.009;
    for(let i=0;i<53;i++){
      const x=((i*111.13+Math.sin(t*.65+i*3.17)*27)%W+W)%W;
      const y=((i*37.7+t*15*(i%4+1))%H+H)%H;
      const local=Math.max(0,1-Math.abs(x-W/2)/(W*.4));
      g.fillStyle=`rgba(218,221,197,${(.035+local*.10)*(p.flashlight?1:.3)})`;
      g.fillRect(x|0,y|0,i%9===0?2:1,i%13===0?2:1);
    }
    this.weapon(g,p,run);
    if(p.hurt>0){g.fillStyle=`rgba(152,13,15,${p.hurt*.22})`;g.fillRect(0,0,W,H);}
    if(run.chapter.number===4) {
      const noise=g.createLinearGradient(0,0,W,0);noise.addColorStop(0,'rgba(57,26,75,.08)');noise.addColorStop(1,'rgba(77,89,134,.03)');
      g.fillStyle=noise;g.fillRect(0,0,W,H);
    }
    // Unpredictable radio-video tearing at the transmission array and near death.
    const distortion=(chapter.number===4?.23:0)+(1-p.health/100)*.18;
    if(distortion>0 && this.frame%23<2){
      for(let i=0;i<6;i++){
        const y=((this.frame*19+i*47)%H)|0,h=1+(i%3),dx=((i%2)?1:-1)*(2+distortion*14);
        g.drawImage(this.canvas,0,y,W,h,dx,y,W,h);
      }
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
