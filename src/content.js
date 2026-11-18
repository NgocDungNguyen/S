/** THE MAZE: SIGNAL LOST — all narrative and balance data, no DOM dependencies. */
export const VERSION = '0.9.1';
export const STORAGE_KEY = 'signal-lost-save-v1';
export const DEFAULT_SETTINGS = Object.freeze({
  master: 0.75, music: 0.55, sfx: 0.85, sensitivity: 0.75,
  brightness: 1, fov: 70, resolution: 1, shake: true,
  scanlines: true, subtitles: true, minimap: false, crosshair: true
});
export const DIFFICULTIES = Object.freeze({
  story: { name: 'STORY', description: 'Explore the nightmare. Enemies are more forgiving.', enemySpeed: 0.75, enemyDamage: 0.45, ammo: 1.7, medkit: 1.5, playerSpeed: 1.12 },
  normal: { name: 'SURVIVOR', description: 'Intended balance. Scarcity and survival.', enemySpeed: 1, enemyDamage: 1, ammo: 1, medkit: 1, playerSpeed: 1 },
  nightmare: { name: 'NIGHTMARE', description: 'Fast creatures. Scarce resources.', enemySpeed: 1.27, enemyDamage: 1.4, ammo: 0.75, medkit: 0.75, playerSpeed: 1 },
  ironman: { name: 'NO RETURN', description: 'Nightmare rules; death erases campaign progress.', enemySpeed: 1.3, enemyDamage: 1.55, ammo: 0.7, medkit: 0.65, playerSpeed: 1 }
});
export const CHALLENGES = Object.freeze({
  campaign: {name:'CAMPAIGN', description:'The complete story, five chapters.'},
  speedrun: {name:'THE CLOCK', description:'Finish the campaign before the clock strikes 30:00.'},
  blackout: {name:'BLACKOUT', description:'No flashlight. Listen for what is watching.'},
  pacifist: {name:'SILENT HANDS', description:'Finish without firing a weapon.'}
});
export const WEAPONS = Object.freeze({
  pistol: { name:'M1911 PISTOL', size:9, starting:9, reserve:27, rate:0.29, reload:1.1, damage:27, spread:0.025, pellets:1, sound:'pistol', color:'#c6c9bd' },
  shotgun: { name:'12G SHOTGUN', size:2, starting:2, reserve:10, rate:0.84, reload:1.65, damage:17, spread:0.17, pellets:7, sound:'shotgun', color:'#bca889' },
  nailgun: { name:'INDUSTRIAL NAILER', size:24, starting:24, reserve:72, rate:0.12, reload:1.9, damage:10, spread:0.048, pellets:1, sound:'nailgun', color:'#d59c61' },
  flare: { name:'SIGNAL FLARE', size:1, starting:1, reserve:5, rate:1.5, reload:1.75, damage:45, spread:0.025, pellets:1, stun:3.8, sound:'flare', color:'#fa5c3f' }
});
export const ENEMIES = Object.freeze({
  watcher: {name:'THE WATCHER', hp:110, speed:1.48, damage:15, sight:11, hearing:9, color:'#c7c5c1', special:'watch', size:0.9},
  nurse: {name:'THE MATRON', hp:76, speed:1.85, damage:19, sight:8, hearing:14, color:'#b6c0b4', special:'listen', size:0.84},
  crawler: {name:'THE CRAWLER', hp:54, speed:2.55, damage:12, sight:7, hearing:11, color:'#b46e62', special:'rush', size:0.62},
  husk: {name:'THE HUSK', hp:165, speed:1.48, damage:26, sight:10, hearing:12, color:'#a47e66', special:'armor', size:1.1},
  siren: {name:'THE SIREN', hp:90, speed:2.05, damage:21, sight:13, hearing:15, color:'#d3b5ce', special:'blink', size:0.92},
  archivist: {name:'THE ARCHIVIST', hp:310, speed:1.75, damage:29, sight:16, hearing:18, color:'#e7d1b5', special:'boss', size:1.45}
});
export const CHAPTERS = [
  {
    id:'maze', number:1, name:'THE MAZE', location:'LOWER INTAKE / 01', palette:['#5c5a4b','#222b25','#928d75','#9f2b27'], seed:1337,
    intro:'The elevator remembers a floor that does not exist.',
    briefing:'Three memory fragments are buried in the service maze. The red door will not open until the memories are returned.',
    objective:'MEMORY FRAGMENTS', target:3, enemyTypes:['watcher','watcher'], size:21, fog:0.095,
    startRadio:'IRIS, ARE YOU THERE?  //  CHANNEL 07',
    notes:[
      {title:'INTAKE ORDER / 1998', body:'Three patient records were moved below the foundation. The staff were told the lift had no basement.'},
      {title:'THE RULE', body:'Subject 04 loses locomotor function under direct observation. Never turn your back. Never blink together.'},
      {title:'VOICE TRANSCRIPT', body:'JONAH: I heard you knocking from the other side. You were not born yet.'}
    ],
    outro:'The door opens into a hospital corridor. The elevator display reads: YOU WERE HERE BEFORE.'
  },
  {
    id:'ward', number:2, name:'THE WARD', location:'ST. VESPER CLINIC / 02', palette:['#65766f','#192c2a','#b5c2b3','#7a463c'], seed:2207,
    intro:'A hospital with no patients. Only waiting rooms.',
    briefing:'Recover three patient ID bands and wake the emergency generator. The Matron follows footsteps and gunshots.',
    objective:'PATIENT BANDS', target:3, enemyTypes:['nurse','crawler','nurse'], size:23, fog:0.084,
    startRadio:'DR. ELLIS: THE WARD WAS NEVER LICENSED.',
    notes:[
      {title:'ADMISSION / IRIS VALE', body:'Age: eight. Status: Missing. Patient room was occupied between 1998 and 2010 on the same evening.'},
      {title:'NURSE NOTE', body:'The Matron responds to breathing, footsteps, and metal impact. Do not use the intercom.'},
      {title:'JONAH / LETTER', body:'I went looking for our mother. The wards kept showing me your future. I need you to finish what I started.'}
    ],
    outro:'The generator stutters. Every empty bed is suddenly warm. A furnace door unlocks below.'
  },
  {
    id:'foundry', number:3, name:'THE FOUNDRY', location:'INCINERATION ENGINE / 03', palette:['#806450','#2d201a','#b59064','#d35d24'], seed:3008,
    intro:'They built a machine to burn the memories away.',
    briefing:'Shut down three pressure valves to cool the blast gate. An armored Husk patrols the furnace rooms.',
    objective:'PRESSURE VALVES', target:3, enemyTypes:['husk','crawler','husk','crawler'], size:25, fog:0.11,
    startRadio:'WARNING // MEMORY INCINERATION ACTIVE',
    notes:[
      {title:'PROJECT PALINODE', body:'Our machines cannot destroy the voices. We have been feeding them patients to keep the signal contained.'},
      {title:'MECHANICAL LOG', body:'A single continuous recording can be separated into five frequencies. Each frequency requires an anchor.'},
      {title:'JONAH / CASSETTE', body:'I know what Mother did. She recorded herself so you would not have to remember her dying twice.'}
    ],
    outro:'The furnace goes cold. The silence sounds like a thousand people holding their breath.'
  },
  {
    id:'transmission', number:4, name:'THE TRANSMISSION', location:'SIGNAL ARRAY / 04', palette:['#535c77','#151b31','#8298ba','#9f58a5'], seed:4919,
    intro:'The radio has been speaking in your voice.',
    briefing:'Align three relays, then use the control console to decrypt the frequency. A Siren can vanish and reappear behind you.',
    objective:'SIGNAL RELAYS', target:3, enemyTypes:['siren','nurse','siren','crawler'], size:25, fog:0.092,
    startRadio:'CHANNEL 00: DO NOT TRUST YOUR OWN VOICE.',
    notes:[
      {title:'TRANSMISSION 001', body:'This is not a haunting. It is a memory signal looping backward through time. The building is its receiver.'},
      {title:'THE CHOICE', body:'Cut the carrier and the trapped voices fall silent. Transmit the carrier and the world will hear them.'},
      {title:'IRIS / UNKNOWN DATE', body:'When you reach the Heart, look for the blue monitor. I left myself a way out. I hope I use it.'}
    ],
    outro:'The antenna turns toward the ground. The final voice on the radio belongs to you.'
  },
  {
    id:'heart', number:5, name:'THE HEART', location:'ARCHIVE CORE / 05', palette:['#554552','#18121c','#ad809c','#ee5959'], seed:5028,
    intro:'The place you were made to forget.',
    briefing:'Break four memory anchors to expose the Archivist, destroy it, and reach the final transmitter.',
    objective:'MEMORY ANCHORS', target:4, enemyTypes:['archivist','siren','husk','watcher'], size:27, fog:0.075,
    startRadio:'IRIS: THIS IS THE LAST TIME WE MEET.',
    notes:[
      {title:'THE TRUTH', body:'The experiment began when Iris was a child. Jonah volunteered to carry her memories so she could walk free.'},
      {title:'JONAH / LAST MESSAGE', body:'I am not in the building. I AM the recording. Every time you escape, you erase me.'},
      {title:'THE ARCHIVIST', body:'The core archives every decision that ever was. It cannot survive without its four anchors. Once exposed, end the recording.'}
    ],
    outro:'A single red button. Two frequencies. All the voices you have ever loved.'
  }
];
export const ENDINGS = {
  silence:{title:'THE SILENCE',subtitle:'You sever the carrier.',body:'The doors open on a world that has forgotten the dead. Iris walks into the morning. Somewhere, a voice stops calling her name.'},
  signal:{title:'THE SIGNAL',subtitle:'You let the voices out.',body:'The entire city hears the lost. Every radio answers. Jonah has a voice again—along with everything that learned to imitate him.'},
  true:{title:'THE REMEMBERING',subtitle:'You found every missing recording.',body:'Iris finds the blue monitor. Instead of choosing silence or broadcast, she records her own memory. Jonah is finally free. The building goes dark, but the voices are allowed to rest.'}
};
export const ACHIEVEMENTS = [
  {id:'first_blood',name:'FIRST BLOOD',description:'Survive your first encounter.'},
  {id:'collector',name:'THE ARCHIVIST',description:'Recover all fifteen recordings.'},
  {id:'no_shots',name:'SILENT HANDS',description:'Finish a chapter without firing.'},
  {id:'survivor',name:'FIVE BELOW',description:'Escape all five chapters.'},
  {id:'speedrun',name:'TWENTY-NINE FIFTY-NINE',description:'Complete THE CLOCK challenge.'},
  {id:'remember',name:'THE REMEMBERING',description:'Discover the hidden ending.'}
];
