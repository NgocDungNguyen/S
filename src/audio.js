/** Fully original, locally synthesized soundtrack, ambience and interactive SFX. */
const NOTES = [41.2,43.65,38.89,49,36.71];
const TRACKS = ['01_the_maze','02_the_ward','03_the_foundry','04_the_transmission','05_the_heart'];
export class HorrorAudio {
  constructor(){this.ctx=null;this.master=null;this.music=null;this.effects=null;
    this.drones=[];this.lfo=[];this.chapter=-1;this.clock=0;this.stinger=0;this.heartClock=0;this.detailClock=0;this.breathClock=0;
    this.track=null;this.trackGain=null;this.loopBuffers=new Map();
    this.settings={master:.75,music:.55,sfx:.85};this.muted=false;}
  async start(){
    if(!this.ctx){
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio) return;
      this.ctx=new Audio();this.master=this.ctx.createGain();
      const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-22;limiter.ratio.value=7;
      this.master.connect(limiter);limiter.connect(this.ctx.destination);
      this.music=this.ctx.createGain();this.music.connect(this.master);
      this.effects=this.ctx.createGain();this.effects.connect(this.master);
      this.noiseBuffer=this.makeNoise(2.2);
      this.applySettings(this.settings);
    }
    if(this.ctx.state==='suspended') await this.ctx.resume();
  }
  applySettings(settings){
    this.settings={...this.settings,...settings};
    if(!this.ctx) return;
    const now=this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted?0:this.settings.master,now,.05);
    this.music.gain.setTargetAtTime(this.settings.music*.42,now,.07);
    this.effects.gain.setTargetAtTime(this.settings.sfx*.75,now,.07);
  }
  setMuted(value){this.muted=value;this.applySettings(this.settings);}
  makeNoise(seconds){
    const n=Math.round(this.ctx.sampleRate*seconds),buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),data=buf.getChannelData(0);
    for(let i=0;i<n;i++) data[i]=Math.random()*2-1;
    return buf;
  }
  oscillator(hz,type,volume,duration,channel=this.effects,when=0){
    if(!this.ctx)return;
    const now=this.ctx.currentTime+when;
    const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(hz,now);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain);gain.connect(channel);osc.start(now);osc.stop(now+duration+.04);
    return {osc,gain,now};
  }
  noise(volume,duration,frequency=850,filterType='lowpass',when=0){
    if(!this.ctx)return;
    const now=this.ctx.currentTime+when;
    const src=this.ctx.createBufferSource(),gain=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();
    src.buffer=this.noiseBuffer;filter.type=filterType;filter.frequency.value=frequency;
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    src.connect(filter);filter.connect(gain);gain.connect(this.effects);
    src.start(now,0,Math.min(duration+0.05,2.1));src.stop(now+duration+.02);
  }
  setChapter(index){
    if(!this.ctx||this.chapter===index) return;
    const t=this.ctx.currentTime;
    for(const node of this.drones) {node.gain.gain.setTargetAtTime(0,t,.14);node.osc.stop(t+.8);}
    if(this.track) {try{this.track.stop(t+.25);}catch{}this.track=null;}
    if(this.trackGain) this.trackGain.gain.setTargetAtTime(0,t,.07);
    this.drones=[];this.chapter=index;this.clock=0;this.stinger=2.5;this.heartClock=1;this.detailClock=2;this.breathClock=4;
    this.loadRecordedLoop(index).catch(()=>{}); // fallback drones remain active if file loading fails
    const root=NOTES[index]||NOTES[0];
    [1,1.005,1.501,2.014].forEach((ratio,i)=>{
      const osc=this.ctx.createOscillator(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
      osc.type=i===2?'triangle':'sawtooth';osc.frequency.value=root*ratio;
      filter.type='lowpass';filter.frequency.value=i===2?130:65+index*16;
      gain.gain.setValueAtTime(0,t);gain.gain.setTargetAtTime([.17,.11,.08,.055][i],t,.45);
      osc.connect(filter);filter.connect(gain);gain.connect(this.music);
      osc.start();this.drones.push({osc,gain,filter});
    });
  }
  async loadRecordedLoop(index){
    if(!this.ctx||this.chapter!==index) return;
    let buffer=this.loopBuffers.get(index);
    if(!buffer){
      const url=new URL(`../assets/audio/${TRACKS[index]}.wav`,import.meta.url);
      const res=await fetch(url);if(!res.ok)throw Error('Original loop unavailable');
      buffer=await this.ctx.decodeAudioData(await res.arrayBuffer());
      this.loopBuffers.set(index,buffer);
    }
    if(this.chapter!==index)return;
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
    source.buffer=buffer;source.loop=true;gain.gain.value=0;
    source.connect(gain);gain.connect(this.music);source.start();
    gain.gain.setTargetAtTime(.46,this.ctx.currentTime,.3);
    this.track=source;this.trackGain=gain;
    this.drones.forEach(n=>n.gain.gain.setTargetAtTime(.08,this.ctx.currentTime,.4));
  }
  // Synthesized binaural-style mechanical knocks, skin-deep breathing,
  // and low-frequency pulse layers. None rely on third-party sound libraries.
  thud(hz=52, volume=.14, duration=.23, when=0){
    const n=this.oscillator(hz,'sine',volume,duration,this.effects,when);
    if(n)n.osc.frequency.exponentialRampToValueAtTime(Math.max(24,hz*.48),n.now+duration*.85);
    this.noise(volume*.3,duration*.55,170,'lowpass',when);
  }
  whisper(){
    if(!this.ctx)return;
    const now=this.ctx.currentTime;
    const src=this.ctx.createBufferSource(),band=this.ctx.createBiquadFilter(),wah=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
    src.buffer=this.noiseBuffer;src.loop=true;
    band.type='bandpass';band.Q.value=3.2;band.frequency.setValueAtTime(450,now);
    band.frequency.exponentialRampToValueAtTime(1130,now+.6);
    band.frequency.exponentialRampToValueAtTime(280,now+1.6);
    wah.type='lowpass';wah.frequency.value=1800;
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.065,now+.19);
    gain.gain.setValueAtTime(.05,now+1.0);gain.gain.exponentialRampToValueAtTime(.0001,now+2.25);
    src.connect(band);band.connect(wah);wah.connect(gain);gain.connect(this.effects);
    src.start(now);src.stop(now+2.28);
  }
  scare(){
    this.noise(.34,.65,3600,'bandpass');
    const n=this.oscillator(180,'sawtooth',.27,.56);
    if(n)n.osc.frequency.exponentialRampToValueAtTime(43,n.now+.52);
    this.oscillator(54,'square',.16,.41,this.effects,.025);
  }
  update(dt,danger=0){
    if(!this.ctx||this.chapter<0) return;
    this.clock+=dt;this.stinger-=dt;
    this.heartClock-=dt;this.detailClock-=dt;this.breathClock-=dt;
    if(this.heartClock<=0){
      // A double beat accelerates when a creature is close; danger drives tempo.
      const speed=1.65-danger*.9;
      this.thud(45+danger*16,.06+danger*.16,.21);
      this.thud(41+danger*13,.045+danger*.13,.19,.16);
      this.heartClock=Math.max(.47,speed);
    }
    if(this.breathClock<=0){
      if(danger>.32){this.noise(.11+danger*.1,.8,290,'lowpass');}
      else if(Math.random()<.38){this.whisper();}
      this.breathClock=4+Math.random()*6-danger*2;
    }
    if(this.detailClock<=0){
      const which=Math.random();
      if(which<.34){
        // Far-away architectural knocks which do not masquerade as UI events.
        this.thud(35+Math.random()*65,.04,.45);
        this.thud(31+Math.random()*50,.025,.42,.38);
      } else if(which<.72){
        this.noise(.055,.7,1400+Math.random()*1900,'bandpass');
      } else if(danger>.57){this.scare();}
      this.detailClock=3+Math.random()*7-danger*2;
    }
    for(let i=0;i<this.drones.length;i++) {
      const n=this.drones[i];
      n.filter.frequency.setTargetAtTime(62+this.chapter*18+danger*260+Math.sin(this.clock*.23+i)*17,this.ctx.currentTime,.14);
    }
    if(this.stinger<=0){
      const root=NOTES[this.chapter];
      const random=Math.random();
      if(random<.32){
        this.oscillator(root*(random<.12?6:3), 'sine', .13,2.6,this.music);
        this.oscillator(root*2.984,'triangle',.07,2.9,this.music,.15);
      } else if(random<.63) {
        this.noise(.06,1.7,80+Math.random()*230);
      } else {
        this.oscillator(26,'sine',.3,1.6,this.music);
      }
      this.stinger=5+Math.random()*9-danger*3;
    }
    if(danger>.48&&Math.sin(this.clock*(3+danger*8))>.86){
      this.oscillator(44,'sine',danger*.16,.16,this.music);
    }
  }
  play(name){
    if(!this.ctx||this.muted) return;
    switch(name){
      case 'step': this.noise(.08,.095,170);this.oscillator(73,'triangle',.03,.11);break;
      case 'sprint':this.noise(.13,.12,220);this.oscillator(68,'triangle',.06,.14);break;
      case 'pistol': {
        this.noise(.86,.26,1600);const o=this.oscillator(140,'sawtooth',.25,.2);
        o?.osc.frequency.exponentialRampToValueAtTime(48,this.ctx.currentTime+.18);break;
      }
      case 'shotgun':this.noise(1.1,.6,700);this.oscillator(67,'sawtooth',.37,.4);break;
      case 'nailgun':this.noise(.33,.12,2500);this.oscillator(98,'square',.14,.11);break;
      case 'flare':this.noise(.5,.48,410);this.oscillator(520,'sawtooth',.24,.3);break;
      case 'reload':this.noise(.14,.17,1700);this.oscillator(400,'triangle',.08,.1);break;
      case 'pickup':this.oscillator(440,'sine',.1,.19);this.oscillator(660,'sine',.07,.21,this.effects,.11);break;
      case 'objective':this.oscillator(220,'sawtooth',.15,.65);this.oscillator(330,'triangle',.1,.66,this.effects,.17);break;
      case 'door':this.noise(.36,.9,140);this.oscillator(53,'sawtooth',.24,.9);this.thud(36,.2,.7,.12);break;
      case 'hurt':this.noise(.41,.4,280);this.oscillator(53,'triangle',.3,.47);this.scare();break;
      case 'death':this.oscillator(83,'sawtooth',.38,2);this.noise(.2,1.5,110);break;
      case 'enemy':this.oscillator(43,'sawtooth',.15,.56);this.noise(.1,.5,2200,'bandpass');this.thud(38,.15,.4);break;
      case 'note':this.oscillator(349,'sine',.07,.5);this.oscillator(523,'sine',.04,.45,this.effects,.14);break;
      case 'static':this.noise(.18,.38,3600,'highpass');this.whisper();break;
      case 'ui':this.oscillator(380,'triangle',.06,.075);break;
      case 'end':this.oscillator(174.61,'sine',.25,2,this.music);this.oscillator(261.63,'sine',.2,2.5,this.music,.22);break;
    }
  }
  stop(){
    if(!this.ctx)return;
    const now=this.ctx.currentTime;
    for(const n of this.drones){n.gain.gain.setTargetAtTime(0,now,.1);n.osc.stop(now+.5);}
    this.drones=[];this.chapter=-1;
    if(this.track){try{this.track.stop(now+.3);}catch{}this.track=null;}
    if(this.trackGain){this.trackGain.gain.setTargetAtTime(0,now,.08);this.trackGain=null;}
  }
}
