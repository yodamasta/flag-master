// Assets
var terry_accueil = 'assets/terry_accueil.png';
var terry_triste = 'assets/terry_triste.png';
var terry_panique = 'assets/terry_panique.png';
var terry_stars = 'assets/terry_stars.png';
var terry_victoire = 'assets/terry_victoire.png';
var terry_buste = 'assets/terry_buste.png';
var terry_platine = 'assets/terry_platine.png';
var terry_gameover = 'assets/terry_gameover.png';
var terryFrames = (function() {
  var f = []; for (var i = 0; i < 61; i++) f.push('assets/frames/frame_' + ('000'+i).slice(-3) + '.jpg'); return f;
})();

// ══════════ GÉOLOCALISATION ══════════
function countryCodeToEmoji(code){return code.toUpperCase().split('').map(function(c){return String.fromCodePoint(0x1F1E6+c.charCodeAt(0)-65);}).join('');}

function hapticError(){
  try{
    var H=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Haptics;
    if(H){H.impact({style:'Medium'});}
    else if(navigator.vibrate){navigator.vibrate([80,40,80]);}
  }catch(e){}
}
function hapticSuccess(){
  try{
    var H=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Haptics;
    if(H){H.impact({style:'Light'});}
    else if(navigator.vibrate){navigator.vibrate(40);}
  }catch(e){}
}
function _getHomeCountry(){try{return JSON.parse(localStorage.getItem('flagmaster_homecountry')||'null');}catch(e){return null;}}
function initGeoLocation(){
  if(localStorage.getItem('flagmaster_homecountry'))return;
  function _saveGeo(code){
    var emoji=countryCodeToEmoji(code);
    var match=FLAGS.filter(function(f){return f.flag===emoji;})[0];
    if(match){
      localStorage.setItem('flagmaster_homecountry',JSON.stringify({code:code,name:match.name,emoji:emoji}));
      if(G.screen==='trophies'||G.screen==='setup')render();
    }
  }
  fetch('https://ip-api.com/json?fields=countryCode')
    .then(function(r){return r.json();})
    .then(function(d){if(d.countryCode)_saveGeo(d.countryCode);else throw new Error('no code');})
    .catch(function(){
      // Fallback : ipapi.co
      fetch('https://ipapi.co/json/')
        .then(function(r){return r.json();})
        .then(function(d){if(d.country_code)_saveGeo(d.country_code);})
        .catch(function(){});
    });
}
function resetGeoLocation(){
  localStorage.removeItem('flagmaster_homecountry');
  initGeoLocation();
}

// ══════════ FIREBASE ══════════
var _fbConfig={apiKey:"AIzaSyCR_UMiPC4FHg84hTr9mIPrSDE66qjy1Q0",authDomain:"flagmaster-162b0.firebaseapp.com",projectId:"flagmaster-162b0",storageBucket:"flagmaster-162b0.firebasestorage.app",messagingSenderId:"1088789064062",appId:"1:1088789064062:web:cc3741e2a5786520e46b2f"};
var _auth=null,_db=null,_fbReady=false;
(function(){try{if(typeof firebase!=='undefined'&&_fbConfig.apiKey&&_fbConfig.apiKey!=='FIREBASE_API_KEY'){firebase.initializeApp(_fbConfig);_auth=firebase.auth();_db=firebase.firestore();_fbReady=true;}}catch(e){}})();

function _fbSaveStats(uid,stats){if(!_fbReady||!uid)return;try{_db.collection('users').doc(uid).set({stats:stats,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}).catch(function(){});}catch(e){}}
function _fbLoadStats(uid,cb){if(!_fbReady||!uid){cb(null);return;}try{_db.collection('users').doc(uid).get().then(function(doc){cb(doc.exists?doc.data():null);}).catch(function(){cb(null);});}catch(e){cb(null);}}
function _mergeStats(local,remote){
  if(!remote||!remote.stats)return local;
  var r=remote.stats,merged=Object.assign({},local);
  if(!merged.foundFlagsCount)merged.foundFlagsCount={};
  if(!merged.unlockedTrophies)merged.unlockedTrophies=[];
  if(!merged.modesPlayed)merged.modesPlayed={};
  ['totalGames','xp','streak','maxCombo','maxComboHard','multiWins'].forEach(function(k){if((r[k]||0)>(local[k]||0))merged[k]=r[k];});
  ['finishedWith1Life','perfectEasy','perfectChronoMedium','perfectHard','chronoFacile15','chronoParfaitHard','survieNoBouclier50','survieNoBouclier100','survieBouc3x75','allContinents','fast5','platineUnlocked'].forEach(function(k){if(r[k])merged[k]=true;});
  if(r.foundFlags&&r.foundFlags.length>(local.foundFlags||[]).length)merged.foundFlags=r.foundFlags;
  if(r.unlockedTrophies)r.unlockedTrophies.forEach(function(t){if(merged.unlockedTrophies.indexOf(t)===-1)merged.unlockedTrophies.push(t);});
  var rfc=r.foundFlagsCount||{};Object.keys(rfc).forEach(function(k){merged.foundFlagsCount[k]=Math.max(merged.foundFlagsCount[k]||0,rfc[k]||0);});
  if(r.modesPlayed)Object.assign(merged.modesPlayed,r.modesPlayed);
  return merged;
}

function authSignIn(){if(!_fbReady){_setAuthError('Firebase non configuré.');return;}var e=(document.getElementById('auth-email')||{}).value||'',p=(document.getElementById('auth-password')||{}).value||'';if(!e.trim()||!p){_setAuthError('Remplis tous les champs.');return;}_setAuthError('⏳');_auth.signInWithEmailAndPassword(e.trim(),p).catch(function(err){_setAuthError(_fbErrMsg(err));});}
function authSignUp(){if(!_fbReady){_setAuthError('Firebase non configuré.');return;}var e=(document.getElementById('auth-email')||{}).value||'',p=(document.getElementById('auth-password')||{}).value||'';if(!e.trim()||!p){_setAuthError('Remplis tous les champs.');return;}if(p.length<6){_setAuthError('Mot de passe : 6 caractères min.');return;}_setAuthError('⏳');_auth.createUserWithEmailAndPassword(e.trim(),p).catch(function(err){_setAuthError(_fbErrMsg(err));});}
function authGoogle(){if(!_fbReady)return;_auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(function(e){_setAuthError(_fbErrMsg(e));});}
function authApple(){if(!_fbReady)return;_auth.signInWithPopup(new firebase.auth.OAuthProvider('apple.com')).catch(function(e){_setAuthError(_fbErrMsg(e));});}
function authGuest(){G.guestMode=true;G.screen='setup';render();}
function authSignOut(){if(_fbReady&&_auth)_auth.signOut().catch(function(){});G.loggedUser=null;G.guestMode=false;G.screen='auth';render();}
function _setAuthError(msg){var el=document.getElementById('auth-error');if(el)el.textContent=msg;}
function togglePwdVis(){var i=document.getElementById('auth-password'),b=document.getElementById('pwd-eye');if(!i)return;if(i.type==='password'){i.type='text';if(b)b.textContent='🙈';}else{i.type='password';if(b)b.textContent='👁️';}}
function _fbErrMsg(e){var m={'auth/user-not-found':'Compte introuvable.','auth/wrong-password':'Mot de passe incorrect.','auth/email-already-in-use':'Email déjà utilisé.','auth/invalid-email':'Email invalide.','auth/weak-password':'Mot de passe trop faible.','auth/popup-closed-by-user':'Connexion annulée.','auth/invalid-credential':'Email ou mot de passe incorrect.'};return m[e.code]||'Erreur : '+(e.message||e.code);}

// ══════════ AUDIO ══════════
var AC=null,musicOn=true,_musicEl=null,_musicFadeIv=null;

// Musique de fond : fichiers MP3 dans assets/audio/
var _MUSIC={
  accueil:'assets/audio/menu_theme.mp3',
  classic:'assets/audio/gameplay_main.mp3',
  chrono:'assets/audio/gameplay_chrono.mp3',
  survie:'assets/audio/gameplay_survie.mp3',
  scorewin:'assets/audio/victory.mp3',
  scorelose:'assets/audio/gameover.mp3'
};

function getAC(){if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();return AC;}
function resumeAC(cb){var ac=getAC();if(ac.state==='suspended'){ac.resume().then(function(){if(cb)cb();});}else{if(cb)cb();}}
// n() et dr() restent pour les SFX génératifs
function n(ac,freq,type,dur,vol,when,dest){try{var o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=freq;o.connect(g);g.connect(dest);g.gain.setValueAtTime(vol,when);g.gain.exponentialRampToValueAtTime(0.0001,when+dur);o.start(when);o.stop(when+dur+0.02);}catch(e){}}
function dr(ac,dur,vol,when,dest){try{var buf=ac.createBuffer(1,Math.floor(ac.sampleRate*dur),ac.sampleRate);var d=buf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(d.length*0.25));var s=ac.createBufferSource(),g=ac.createGain();s.buffer=buf;g.gain.value=vol;s.connect(g);g.connect(dest);s.start(when);}catch(e){}}

function stopMusic(){
  if(_musicFadeIv){clearInterval(_musicFadeIv);_musicFadeIv=null;}
  if(_musicEl){
    var el=_musicEl;_musicEl=null;
    try{var v=el.volume;var iv=setInterval(function(){v=Math.max(0,v-0.05);el.volume=v;if(v<=0){el.pause();el.src='';clearInterval(iv);}},30);}catch(e){try{el.pause();}catch(e2){}}
  }
}

// Synthèse Web Audio (fallback quand MP3 absent/invalide)
var _synthTrackId=0,_synthGain=null,_chronoUrgG=null,_chronoBpm={v:140};
var _SYNTH_TRACKS={
  accueil: {mel:[523,659,784,1047,784,659,523,659],bas:[262,330,392,523,392,330,262,330],bpm:75,type:'sine',drum:false,vol:0.12},
  classic: {mel:[659,784,880,1047,880,784,659,784],bas:[330,392,440,523,440,392,330,392],bpm:105,type:'triangle',drum:true,vol:0.14},
  chrono:  {mel:[523,494,440,466,523,554,523,494],bas:[262,247,220,233,262,277,262,247],bpm:135,type:'sawtooth',drum:true,vol:0.13},
  survie:  {mel:[440,415,392,370,392,415,440,466],bas:[220,207,196,185,196,207,220,233],bpm:90,type:'triangle',drum:true,vol:0.13},
  scorewin:{mel:[523,659,784,1047,784,880,1047,1175],bas:[262,330,392,523,392,440,523,659],bpm:100,type:'triangle',drum:true,vol:0.15},
  scorelose:{mel:[523,494,440,392,370,330,294,262],bas:[262,247,220,196,185,165,147,131],bpm:65,type:'sine',drum:false,vol:0.10}
};
function _stopSynth(){_synthTrackId++;if(_synthGain){try{_synthGain.gain.setTargetAtTime(0,getAC().currentTime,0.15);}catch(e){}}_synthGain=null;_chronoUrgG=null;}
function _startSynth(type){
  var id=++_synthTrackId;
  var c=_SYNTH_TRACKS[type]||_SYNTH_TRACKS.classic;
  var bpmO={v:c.bpm};
  if(type==='chrono')_chronoBpm=bpmO;
  resumeAC(function(){
    var ac=getAC(),m=ac.createGain();
    m.gain.value=0;m.connect(ac.destination);
    m.gain.setTargetAtTime(0.18,ac.currentTime,0.5);
    _synthGain=m;if(type==='chrono')_chronoUrgG=m;
    var step=0;
    function tick(){
      if(_synthTrackId!==id)return;
      var spb=60/bpmO.v,now=ac.currentTime;
      n(ac,c.mel[step%c.mel.length],c.type,spb*0.75,c.vol*2.5,now,m);
      if(step%2===0)n(ac,c.bas[step%c.bas.length],'sine',spb*1.5,c.vol*1.8,now,m);
      if(c.drum){dr(ac,0.05,c.vol*3,now,m);if(step%2===1)dr(ac,0.04,c.vol*2,now+spb*0.5,m);}
      step++;setTimeout(function(){tick();},spb*1000);
    }
    tick();
  });
}

function stopMusic(){
  _stopSynth();
  if(_musicFadeIv){clearInterval(_musicFadeIv);_musicFadeIv=null;}
  if(_musicEl){
    var el=_musicEl;_musicEl=null;
    try{var v=el.volume;var iv=setInterval(function(){v=Math.max(0,v-0.05);el.volume=v;if(v<=0){el.pause();el.src='';clearInterval(iv);}},30);}catch(e){try{el.pause();}catch(e2){}}
  }
}

function startMusic(type){
  if(!musicOn)return;
  stopMusic();
  var names={accueil:'🎵 Accueil',classic:'🏆 Classique',chrono:'⏱️ Chrono',survie:'💀 Survie',scorewin:'🎉 Victoire !',scorelose:'😔 Fin de partie'};
  G.nowPlaying=names[type]||'🎵';
  document.querySelectorAll('.now-playing').forEach(function(el){el.textContent=G.nowPlaying;});
  var src=_MUSIC[type];
  if(!src){_startSynth(type);return;}
  var isJingle=(type==='scorewin'||type==='scorelose');
  var el=new Audio();el.loop=!isJingle;el.volume=0;
  if(isJingle)el.onended=function(){if(musicOn)startMusic('accueil');};
  _musicEl=el;
  resumeAC(function(){
    el.src=src;
    var p=el.play();
    if(p&&p.then){
      p.then(function(){
        // MP3 joue — fade in
        var v=0;_musicFadeIv=setInterval(function(){
          if(el!==_musicEl){clearInterval(_musicFadeIv);_musicFadeIv=null;return;}
          v=Math.min(0.55,v+0.025);el.volume=v;
          if(v>=0.55){clearInterval(_musicFadeIv);_musicFadeIv=null;}
        },40);
      }).catch(function(){
        // Échec → synthèse
        if(el===_musicEl){_musicEl=null;_startSynth(type);}
      });
    }
  });
}

function updateChronoTension(tl,tm){
  var r=tl/tm;
  if(_musicEl){
    _musicEl.playbackRate=r<0.2?1.5:r<0.4?1.3:r<0.6?1.1:1.0;
    _musicEl.volume=r<0.2?0.75:r<0.4?0.65:r<0.6?0.55:0.5;
  } else if(_chronoUrgG){
    _chronoBpm.v=Math.round(140+(1-r)*55);
    try{_chronoUrgG.gain.setTargetAtTime(r<0.2?0.8:r<0.4?0.5:r<0.6?0.2:0.03,getAC().currentTime,0.8);}catch(e){}
  }
}
function updateSurvieStreak(s){if(_musicEl)_musicEl.playbackRate=Math.min(1+Math.floor(s/5)*0.04,1.4);}
function sfx(type){
  resumeAC(function(){
    try{var ac=getAC(),g=ac.createGain(),t=ac.currentTime;g.connect(ac.destination);
    if(type==='correct'){[523,659,784].forEach(function(f,i){n(ac,f,'sine',0.25,0.13,t+i*0.1,g);});}
    else if(type==='wrong'){var o=ac.createOscillator(),gw=ac.createGain();o.type='sawtooth';o.frequency.setValueAtTime(280,t);o.frequency.exponentialRampToValueAtTime(110,t+0.35);o.connect(gw);gw.connect(ac.destination);gw.gain.setValueAtTime(0.12,t);gw.gain.exponentialRampToValueAtTime(0.0001,t+0.4);o.start(t);o.stop(t+0.45);}
    else if(type==='combo'){[784,880,1047,1175].forEach(function(f,i){n(ac,f,'triangle',0.2,0.1,t+i*0.08,g);});}
    else if(type==='shield'){[440,523,659].forEach(function(f,i){n(ac,f,'sine',0.3,0.12,t+i*0.12,g);});}
    else if(type==='click'){n(ac,880,'sine',0.08,0.06,t,g);}
    else if(type==='gameover'){[440,370,294,220].forEach(function(f,i){n(ac,f,'sawtooth',0.4,0.18,t+i*0.15,g);});}
    else if(type==='trophy_bronze'){[523,659,784].forEach(function(f,i){n(ac,f,'triangle',0.3,0.15,t+i*0.12,g);});}
    else if(type==='trophy_silver'){[523,659,784,1047].forEach(function(f,i){n(ac,f,'triangle',0.3,0.14,t+i*0.10,g);});}
    else if(type==='trophy_gold'){[523,659,784,1047,1319].forEach(function(f,i){n(ac,f,'sine',0.35,0.16,t+i*0.09,g);n(ac,f*2,'triangle',0.15,0.08,t+i*0.09+0.04,g);});}
    else if(type==='trophy_platinum'){[392,523,659,784,1047,1319,1568].forEach(function(f,i){n(ac,f,'sine',0.3,0.14,t+i*0.07,g);});dr(ac,0.1,0.15,t,g);dr(ac,0.1,0.10,t+0.5,g);}
    }catch(e){}
  });
}
function updateMusicFab(){
  var fab=document.getElementById('music-fab');
  if(fab){fab.textContent=musicOn?'🔊':'🔇';fab.className='music-fab'+(musicOn?' on':'');}
  var fi=document.getElementById('music-fab-inline');
  if(fi){fi.textContent=musicOn?'🔊':'🔇';fi.className='music-fab-inline'+(musicOn?' on':'');}
}
function toggleMusic(){
  musicOn=!musicOn;
  if(!musicOn){stopMusic();}
  else{
    if(G.screen==='setup')startMusic('accueil');
    else if(G.screen==='game'){if(G.gameMode==='classic')startMusic('classic');else if(G.gameMode==='chrono')startMusic('chrono');else startMusic('survie');}
    else{if(G.lastWon)startMusic('scorewin');else startMusic('scorelose');}
  }
  updateMusicFab();
}

// ══════════ TERRY - PLACEMENT CORRECT ══════════
// terry_accueil  = Image 2 du GIF = salue joyeux         → écran accueil
// terry_buste    = Image 7 du GIF = souriant neutre       → avatar barre de jeu
// terry_stars    = Image 5 du GIF = yeux étoiles pouces  → bonne réponse / combo
// terry_triste   = Image 3 du GIF = triste déçu          → mauvaise réponse / défaite
// terry_panique  = Image 4 du GIF = yeux grands stress   → chrono < 10s
// terry_victoire = Image 6 du GIF = couronne or confetti → scores victoire
// terry_platine  = Image 8 du GIF = couronne violette    → platine
// terry_gameover = Image 1 du GIF = tombe en arrière     → game over survie

var terryTimeout=null;
function floatScore(btn,text,color){
  try{
    var el=document.createElement('div');
    el.textContent=text;
    el.className='floating-score';
    el.style.color=color||'#00ff88';
    btn.appendChild(el);
    setTimeout(function(){el.remove();},850);
  }catch(e){}
}
function showTerry(img,anim){
  if(terryTimeout)clearTimeout(terryTimeout);
  var slot=document.getElementById('terry-slot');
  if(slot){
    slot.innerHTML='<img src="'+img+'" width="80" height="80" style="object-fit:contain">';
    terryTimeout=setTimeout(function(){if(slot)slot.innerHTML='';},1000);
  } else {
    var el=document.getElementById('terry-reaction');
    if(!el){el=document.createElement('img');el.id='terry-reaction';el.className='terry-reaction';document.body.appendChild(el);}
    el.src=img;el.style.display='block';
    el.className='terry-reaction'+(anim?' '+anim:'');
    terryTimeout=setTimeout(function(){if(el)el.style.display='none';},1500);
  }
}
function hideTerry(){
  var slot=document.getElementById('terry-slot');
  if(slot)slot.innerHTML='';
  var el=document.getElementById('terry-reaction');
  if(el)el.style.display='none';
}

// ══════════ DATA ══════════
var FLAGS=[
  // ── EUROPE lvl1 ──
  {flag:"🇫🇷",name:"France",lvl:1,continent:"EU"},
  {flag:"🇩🇪",name:"Allemagne",lvl:1,continent:"EU"},
  {flag:"🇮🇹",name:"Italie",lvl:1,continent:"EU"},
  {flag:"🇪🇸",name:"Espagne",lvl:1,continent:"EU"},
  {flag:"🇬🇧",name:"Royaume-Uni",lvl:1,continent:"EU"},
  {flag:"🇵🇹",name:"Portugal",lvl:1,continent:"EU"},
  {flag:"🇧🇪",name:"Belgique",lvl:1,continent:"EU"},
  {flag:"🇳🇱",name:"Pays-Bas",lvl:1,continent:"EU"},
  {flag:"🇨🇭",name:"Suisse",lvl:1,continent:"EU"},
  {flag:"🇸🇪",name:"Suède",lvl:1,continent:"EU"},
  {flag:"🇳🇴",name:"Norvège",lvl:1,continent:"EU"},
  {flag:"🇩🇰",name:"Danemark",lvl:1,continent:"EU"},
  {flag:"🇵🇱",name:"Pologne",lvl:1,continent:"EU"},
  {flag:"🇦🇹",name:"Autriche",lvl:1,continent:"EU"},
  {flag:"🇬🇷",name:"Grèce",lvl:1,continent:"EU"},
  {flag:"🇮🇪",name:"Irlande",lvl:1,continent:"EU"},
  {flag:"🇷🇴",name:"Roumanie",lvl:1,continent:"EU"},
  {flag:"🇭🇺",name:"Hongrie",lvl:1,continent:"EU"},
  {flag:"🇫🇮",name:"Finlande",lvl:1,continent:"EU"},
  {flag:"🇨🇿",name:"Tchéquie",lvl:1,continent:"EU"},
  {flag:"🇷🇺",name:"Russie",lvl:1,continent:"EU"},
  // ── EUROPE lvl2 ──
  {flag:"🇺🇦",name:"Ukraine",lvl:2,continent:"EU"},
  {flag:"🇮🇸",name:"Islande",lvl:2,continent:"EU"},
  {flag:"🇭🇷",name:"Croatie",lvl:2,continent:"EU"},
  {flag:"🇸🇰",name:"Slovaquie",lvl:2,continent:"EU"},
  {flag:"🇧🇬",name:"Bulgarie",lvl:2,continent:"EU"},
  {flag:"🇷🇸",name:"Serbie",lvl:2,continent:"EU"},
  {flag:"🇱🇹",name:"Lituanie",lvl:2,continent:"EU"},
  {flag:"🇱🇻",name:"Lettonie",lvl:2,continent:"EU"},
  {flag:"🇪🇪",name:"Estonie",lvl:2,continent:"EU"},
  {flag:"🇸🇮",name:"Slovénie",lvl:2,continent:"EU"},
  {flag:"🇧🇾",name:"Biélorussie",lvl:2,continent:"EU"},
  {flag:"🇧🇦",name:"Bosnie-Herzégovine",lvl:2,continent:"EU"},
  {flag:"🇦🇱",name:"Albanie",lvl:2,continent:"EU"},
  {flag:"🇲🇰",name:"Macédoine du Nord",lvl:2,continent:"EU"},
  {flag:"🇱🇺",name:"Luxembourg",lvl:2,continent:"EU"},
  {flag:"🇲🇹",name:"Malte",lvl:2,continent:"EU"},
  {flag:"🇨🇾",name:"Chypre",lvl:2,continent:"EU"},
  {flag:"🇲🇩",name:"Moldavie",lvl:2,continent:"EU"},
  // ── EUROPE lvl3 ──
  {flag:"🇲🇪",name:"Monténégro",lvl:3,continent:"EU"},
  {flag:"🇲🇨",name:"Monaco",lvl:3,continent:"EU"},
  {flag:"🇱🇮",name:"Liechtenstein",lvl:3,continent:"EU"},
  {flag:"🇸🇲",name:"Saint-Marin",lvl:3,continent:"EU"},
  {flag:"🇦🇩",name:"Andorre",lvl:3,continent:"EU"},
  // ── ASIE lvl1 ──
  {flag:"🇯🇵",name:"Japon",lvl:1,continent:"AS"},
  {flag:"🇨🇳",name:"Chine",lvl:1,continent:"AS"},
  {flag:"🇮🇳",name:"Inde",lvl:1,continent:"AS"},
  {flag:"🇰🇷",name:"Corée du Sud",lvl:1,continent:"AS"},
  {flag:"🇹🇷",name:"Turquie",lvl:1,continent:"AS"},
  {flag:"🇸🇦",name:"Arabie Saoudite",lvl:1,continent:"AS"},
  {flag:"🇮🇷",name:"Iran",lvl:1,continent:"AS"},
  {flag:"🇮🇶",name:"Irak",lvl:1,continent:"AS"},
  {flag:"🇮🇱",name:"Israël",lvl:1,continent:"AS"},
  // ── ASIE lvl2 ──
  {flag:"🇵🇰",name:"Pakistan",lvl:2,continent:"AS"},
  {flag:"🇧🇩",name:"Bangladesh",lvl:2,continent:"AS"},
  {flag:"🇮🇩",name:"Indonésie",lvl:2,continent:"AS"},
  {flag:"🇻🇳",name:"Viêt Nam",lvl:2,continent:"AS"},
  {flag:"🇹🇭",name:"Thaïlande",lvl:2,continent:"AS"},
  {flag:"🇸🇬",name:"Singapour",lvl:2,continent:"AS"},
  {flag:"🇲🇾",name:"Malaisie",lvl:2,continent:"AS"},
  {flag:"🇵🇭",name:"Philippines",lvl:2,continent:"AS"},
  {flag:"🇵🇸",name:"Palestine",lvl:2,continent:"AS"},
  {flag:"🇦🇫",name:"Afghanistan",lvl:2,continent:"AS"},
  {flag:"🇰🇿",name:"Kazakhstan",lvl:2,continent:"AS"},
  {flag:"🇲🇳",name:"Mongolie",lvl:2,continent:"AS"},
  {flag:"🇳🇵",name:"Népal",lvl:2,continent:"AS"},
  {flag:"🇲🇲",name:"Myanmar",lvl:2,continent:"AS"},
  {flag:"🇾🇪",name:"Yémen",lvl:2,continent:"AS"},
  {flag:"🇦🇿",name:"Azerbaïdjan",lvl:2,continent:"AS"},
  {flag:"🇬🇪",name:"Géorgie",lvl:2,continent:"AS"},
  {flag:"🇦🇪",name:"Émirats arabes unis",lvl:2,continent:"AS"},
  {flag:"🇯🇴",name:"Jordanie",lvl:2,continent:"AS"},
  {flag:"🇶🇦",name:"Qatar",lvl:2,continent:"AS"},
  {flag:"🇰🇼",name:"Koweït",lvl:2,continent:"AS"},
  {flag:"🇸🇾",name:"Syrie",lvl:2,continent:"AS"},
  {flag:"🇱🇧",name:"Liban",lvl:2,continent:"AS"},
  {flag:"🇰🇭",name:"Cambodge",lvl:2,continent:"AS"},
  {flag:"🇱🇦",name:"Laos",lvl:2,continent:"AS"},
  {flag:"🇱🇰",name:"Sri Lanka",lvl:2,continent:"AS"},
  // ── ASIE lvl3 ──
  {flag:"🇺🇿",name:"Ouzbékistan",lvl:3,continent:"AS"},
  {flag:"🇴🇲",name:"Oman",lvl:3,continent:"AS"},
  {flag:"🇧🇭",name:"Bahreïn",lvl:3,continent:"AS"},
  {flag:"🇰🇬",name:"Kirghizistan",lvl:3,continent:"AS"},
  {flag:"🇹🇯",name:"Tadjikistan",lvl:3,continent:"AS"},
  {flag:"🇹🇲",name:"Turkménistan",lvl:3,continent:"AS"},
  {flag:"🇧🇳",name:"Brunei",lvl:3,continent:"AS"},
  {flag:"🇧🇹",name:"Bhoutan",lvl:3,continent:"AS"},
  {flag:"🇲🇻",name:"Maldives",lvl:3,continent:"AS"},
  {flag:"🇹🇱",name:"Timor oriental",lvl:3,continent:"AS"},
  {flag:"🇰🇵",name:"Corée du Nord",lvl:3,continent:"AS"},
  {flag:"🇹🇼",name:"Taïwan",lvl:3,continent:"AS"},
  {flag:"🇦🇲",name:"Arménie",lvl:3,continent:"AS"},
  // ── AFRIQUE lvl1 ──
  {flag:"🇲🇦",name:"Maroc",lvl:1,continent:"AF"},
  {flag:"🇩🇿",name:"Algérie",lvl:1,continent:"AF"},
  {flag:"🇪🇬",name:"Égypte",lvl:1,continent:"AF"},
  {flag:"🇳🇬",name:"Nigéria",lvl:1,continent:"AF"},
  {flag:"🇿🇦",name:"Afrique du Sud",lvl:1,continent:"AF"},
  // ── AFRIQUE lvl2 ──
  {flag:"🇰🇪",name:"Kenya",lvl:2,continent:"AF"},
  {flag:"🇬🇭",name:"Ghana",lvl:2,continent:"AF"},
  {flag:"🇪🇹",name:"Éthiopie",lvl:2,continent:"AF"},
  {flag:"🇹🇿",name:"Tanzanie",lvl:2,continent:"AF"},
  {flag:"🇨🇲",name:"Cameroun",lvl:2,continent:"AF"},
  {flag:"🇨🇮",name:"Côte d'Ivoire",lvl:2,continent:"AF"},
  {flag:"🇸🇳",name:"Sénégal",lvl:2,continent:"AF"},
  {flag:"🇲🇱",name:"Mali",lvl:2,continent:"AF"},
  {flag:"🇸🇩",name:"Soudan",lvl:2,continent:"AF"},
  {flag:"🇱🇾",name:"Libye",lvl:2,continent:"AF"},
  {flag:"🇹🇳",name:"Tunisie",lvl:2,continent:"AF"},
  {flag:"🇲🇿",name:"Mozambique",lvl:2,continent:"AF"},
  {flag:"🇦🇴",name:"Angola",lvl:2,continent:"AF"},
  {flag:"🇿🇲",name:"Zambie",lvl:2,continent:"AF"},
  {flag:"🇿🇼",name:"Zimbabwe",lvl:2,continent:"AF"},
  {flag:"🇺🇬",name:"Ouganda",lvl:2,continent:"AF"},
  {flag:"🇷🇼",name:"Rwanda",lvl:2,continent:"AF"},
  {flag:"🇨🇩",name:"Congo (Rép. dém.)",lvl:2,continent:"AF"},
  {flag:"🇳🇦",name:"Namibie",lvl:2,continent:"AF"},
  // ── AFRIQUE lvl3 ──
  {flag:"🇧🇼",name:"Botswana",lvl:3,continent:"AF"},
  {flag:"🇧🇯",name:"Bénin",lvl:3,continent:"AF"},
  {flag:"🇹🇬",name:"Togo",lvl:3,continent:"AF"},
  {flag:"🇳🇪",name:"Niger",lvl:3,continent:"AF"},
  {flag:"🇧🇫",name:"Burkina Faso",lvl:3,continent:"AF"},
  {flag:"🇬🇳",name:"Guinée",lvl:3,continent:"AF"},
  {flag:"🇹🇩",name:"Tchad",lvl:3,continent:"AF"},
  {flag:"🇲🇬",name:"Madagascar",lvl:3,continent:"AF"},
  {flag:"🇲🇼",name:"Malawi",lvl:3,continent:"AF"},
  {flag:"🇲🇷",name:"Mauritanie",lvl:3,continent:"AF"},
  {flag:"🇪🇷",name:"Érythrée",lvl:3,continent:"AF"},
  {flag:"🇩🇯",name:"Djibouti",lvl:3,continent:"AF"},
  {flag:"🇸🇴",name:"Somalie",lvl:3,continent:"AF"},
  {flag:"🇸🇸",name:"Soudan du Sud",lvl:3,continent:"AF"},
  {flag:"🇱🇷",name:"Liberia",lvl:3,continent:"AF"},
  {flag:"🇸🇱",name:"Sierra Leone",lvl:3,continent:"AF"},
  {flag:"🇬🇦",name:"Gabon",lvl:3,continent:"AF"},
  {flag:"🇨🇬",name:"Congo",lvl:3,continent:"AF"},
  {flag:"🇨🇫",name:"Centrafrique",lvl:3,continent:"AF"},
  {flag:"🇬🇶",name:"Guinée équatoriale",lvl:3,continent:"AF"},
  {flag:"🇬🇼",name:"Guinée-Bissau",lvl:3,continent:"AF"},
  {flag:"🇨🇻",name:"Cap-Vert",lvl:3,continent:"AF"},
  {flag:"🇬🇲",name:"Gambie",lvl:3,continent:"AF"},
  {flag:"🇱🇸",name:"Lesotho",lvl:3,continent:"AF"},
  {flag:"🇸🇿",name:"Eswatini",lvl:3,continent:"AF"},
  {flag:"🇧🇮",name:"Burundi",lvl:3,continent:"AF"},
  {flag:"🇰🇲",name:"Comores",lvl:3,continent:"AF"},
  {flag:"🇲🇺",name:"Maurice",lvl:3,continent:"AF"},
  {flag:"🇸🇨",name:"Seychelles",lvl:3,continent:"AF"},
  {flag:"🇸🇹",name:"São Tomé-et-Príncipe",lvl:3,continent:"AF"},
  // ── AMÉRIQUES lvl1 ──
  {flag:"🇺🇸",name:"États-Unis",lvl:1,continent:"AM"},
  {flag:"🇨🇦",name:"Canada",lvl:1,continent:"AM"},
  {flag:"🇧🇷",name:"Brésil",lvl:1,continent:"AM"},
  {flag:"🇦🇷",name:"Argentine",lvl:1,continent:"AM"},
  {flag:"🇲🇽",name:"Mexique",lvl:1,continent:"AM"},
  {flag:"🇨🇺",name:"Cuba",lvl:1,continent:"AM"},
  // ── AMÉRIQUES lvl2 ──
  {flag:"🇨🇴",name:"Colombie",lvl:2,continent:"AM"},
  {flag:"🇨🇱",name:"Chili",lvl:2,continent:"AM"},
  {flag:"🇵🇪",name:"Pérou",lvl:2,continent:"AM"},
  {flag:"🇻🇪",name:"Venezuela",lvl:2,continent:"AM"},
  {flag:"🇺🇾",name:"Uruguay",lvl:2,continent:"AM"},
  {flag:"🇪🇨",name:"Équateur",lvl:2,continent:"AM"},
  {flag:"🇧🇴",name:"Bolivie",lvl:2,continent:"AM"},
  {flag:"🇵🇾",name:"Paraguay",lvl:2,continent:"AM"},
  {flag:"🇬🇹",name:"Guatemala",lvl:2,continent:"AM"},
  {flag:"🇭🇹",name:"Haïti",lvl:2,continent:"AM"},
  {flag:"🇩🇴",name:"République dominicaine",lvl:2,continent:"AM"},
  {flag:"🇭🇳",name:"Honduras",lvl:2,continent:"AM"},
  // ── AMÉRIQUES lvl3 ──
  {flag:"🇸🇻",name:"El Salvador",lvl:3,continent:"AM"},
  {flag:"🇳🇮",name:"Nicaragua",lvl:3,continent:"AM"},
  {flag:"🇨🇷",name:"Costa Rica",lvl:3,continent:"AM"},
  {flag:"🇵🇦",name:"Panama",lvl:3,continent:"AM"},
  {flag:"🇯🇲",name:"Jamaïque",lvl:3,continent:"AM"},
  {flag:"🇹🇹",name:"Trinité-et-Tobago",lvl:3,continent:"AM"},
  {flag:"🇬🇾",name:"Guyana",lvl:3,continent:"AM"},
  {flag:"🇸🇷",name:"Suriname",lvl:3,continent:"AM"},
  {flag:"🇧🇿",name:"Belize",lvl:3,continent:"AM"},
  {flag:"🇧🇸",name:"Bahamas",lvl:3,continent:"AM"},
  {flag:"🇧🇧",name:"Barbade",lvl:3,continent:"AM"},
  {flag:"🇦🇬",name:"Antigua-et-Barbuda",lvl:3,continent:"AM"},
  {flag:"🇩🇲",name:"Dominique",lvl:3,continent:"AM"},
  {flag:"🇱🇨",name:"Sainte-Lucie",lvl:3,continent:"AM"},
  {flag:"🇻🇨",name:"Saint-Vincent-et-les-Grenadines",lvl:3,continent:"AM"},
  {flag:"🇬🇩",name:"Grenade",lvl:3,continent:"AM"},
  {flag:"🇰🇳",name:"Saint-Christophe-et-Niévès",lvl:3,continent:"AM"},
  // ── OCÉANIE lvl1 ──
  {flag:"🇦🇺",name:"Australie",lvl:1,continent:"OC"},
  // ── OCÉANIE lvl2 ──
  {flag:"🇳🇿",name:"Nouvelle-Zélande",lvl:2,continent:"OC"},
  {flag:"🇫🇯",name:"Fidji",lvl:2,continent:"OC"},
  // ── OCÉANIE lvl3 ──
  {flag:"🇵🇬",name:"Papouasie-Nouvelle-Guinée",lvl:3,continent:"OC"},
  {flag:"🇸🇧",name:"Îles Salomon",lvl:3,continent:"OC"},
  {flag:"🇻🇺",name:"Vanuatu",lvl:3,continent:"OC"},
  {flag:"🇼🇸",name:"Samoa",lvl:3,continent:"OC"},
  {flag:"🇹🇴",name:"Tonga",lvl:3,continent:"OC"},
  {flag:"🇰🇮",name:"Kiribati",lvl:3,continent:"OC"},
  {flag:"🇫🇲",name:"Micronésie",lvl:3,continent:"OC"},
  {flag:"🇳🇷",name:"Nauru",lvl:3,continent:"OC"},
  {flag:"🇹🇻",name:"Tuvalu",lvl:3,continent:"OC"},
  {flag:"🇵🇼",name:"Palaos",lvl:3,continent:"OC"},
  {flag:"🇲🇭",name:"Îles Marshall",lvl:3,continent:"OC"},
];

var AVATARS=["🐯","🦁","🐺","🦊","🐸","🐧","🦄","🐙"];
var COLORS=["#4D96FF","#FF6B6B","#6BCB77","#FFD93D","#C77DFF","#FF9F40","#00C9A7","#FF6B9D"];
var TOTAL=10,MAX_LIVES=3,ERR_PENALTY=5,COMBO_BONUS={2:1,3:2,5:4,10:8};

// ══════════════════════════════════════════════════════
// 🏆 SYSTÈME DE TROPHÉES COMPLET
// ══════════════════════════════════════════════════════

var TROPHIES = {
  // ── BRONZE ──
  b1: { id:'b1', tier:'bronze', name:'Bienvenue !', desc:'Terminer sa 1ère partie', icon:'🗺️', check:function(s){return s.totalGames>=1;}},
  b2: { id:'b2', tier:'bronze', name:'Chez moi 🏠',
    get desc(){var hc=_getHomeCountry();return hc?'Trouver '+hc.name+' 10 fois':'Identifier 10 fois le même pays';},
    get icon(){var hc=_getHomeCountry();return hc?hc.emoji:'🏠';},
    check:function(s){var hc=_getHomeCountry();var counts=s.foundFlagsCount||{};if(hc)return(counts[hc.name]||0)>=10;return Object.keys(counts).some(function(k){return counts[k]>=10;});}
  },
  b3: { id:'b3', tier:'bronze', name:'Survivant', desc:'Finir classique avec 1 vie restante', icon:'❤️', check:function(s){return s.finishedWith1Life;}},
  b4: { id:'b4', tier:'bronze', name:'Curieux', desc:'Jouer les 3 modes', icon:'🌍', check:function(s){return s.modesPlayed&&s.modesPlayed.classic&&s.modesPlayed.chrono&&s.modesPlayed.survie;}},
  b5: { id:'b5', tier:'bronze', name:'Série naissante', desc:'Combo x3 en Chrono', icon:'🔰', check:function(s){return s.maxCombo>=3;}},
  b6: { id:'b6', tier:'bronze', name:'Premier parfait', desc:'10/10 en Facile', icon:'🎯', check:function(s){return s.perfectEasy;}},
  b7: { id:'b7', tier:'bronze', name:'Fidèle', desc:'Jouer 3 jours de suite', icon:'📅', check:function(s){return s.streak>=3;}},
  b8: { id:'b8', tier:'bronze', name:'Débutant', desc:'Atteindre le niveau 2', icon:'🌱', check:function(s){return s.xp>=200;}},

  // ── ARGENT ──
  s1: { id:'s1', tier:'silver', name:'Contre-la-montre', desc:'Chrono Moyen 10/10', icon:'⏱️', check:function(s){return s.perfectChronoMedium;}},
  s2: { id:'s2', tier:'silver', name:'En feu', desc:'Combo x5 en Chrono Difficile', icon:'🔥', check:function(s){return s.maxComboHard>=5;}},
  s3: { id:'s3', tier:'silver', name:'Intouchable', desc:'50 pays en Survie sans bouclier', icon:'🛡️', check:function(s){return s.survieNoBouclier50;}},
  s4: { id:'s4', tier:'silver', name:'Tour du monde', desc:'Trouver 1 pays sur chaque continent', icon:'🌍', check:function(s){return s.allContinents;}},
  s5: { id:'s5', tier:'silver', name:'Régulier', desc:'7 jours de suite', icon:'💫', check:function(s){return s.streak>=7;}},
  s6: { id:'s6', tier:'silver', name:'Explorateur', desc:'50 parties jouées', icon:'🗺️', check:function(s){return s.totalGames>=50;}},
  s7: { id:'s7', tier:'silver', name:'Rapide', desc:'5 bonnes réponses en moins de 2s', icon:'⚡', check:function(s){return s.fast5;}},
  s8: { id:'s8', tier:'silver', name:'Polyglotte', desc:'Trouver 50 pays différents', icon:'🌐', check:function(s){return s.foundFlags&&s.foundFlags.length>=50;}},
  s9: { id:'s9', tier:'silver', name:'Navigateur', desc:'Atteindre le niveau 5', icon:'🧭', check:function(s){return s.xp>=1000;}},
  s10:{ id:'s10',tier:'silver', name:'Étudiant', desc:'5 trophées bronze obtenus', icon:'📚', check:function(s){return countTier(s,'bronze')>=5;}},

  // ── OR ──
  g1: { id:'g1', tier:'gold', name:'Parfait Difficile', desc:'10/10 Classique Difficile, 0 erreur', icon:'👑', check:function(s){return s.perfectHard;}},
  g2: { id:'g2', tier:'gold', name:'Légendaire', desc:'100 pays Survie sans bouclier', icon:'💀', check:function(s){return s.survieNoBouclier100;}},
  g3: { id:'g3', tier:'gold', name:'Flash', desc:'Chrono Facile en moins de 15s, 10/10', icon:'⚡', check:function(s){return s.chronoFacile15;}},
  g4: { id:'g4', tier:'gold', name:'Encyclopédie', desc:'Trouver les 195 pays au moins 1 fois', icon:'🌍', check:function(s){return s.foundFlags&&s.foundFlags.length>=195;}},
  g5: { id:'g5', tier:'gold', name:'Combo Dieu', desc:'Combo x10 en Chrono Difficile', icon:'🔥', check:function(s){return s.maxComboHard>=10;}},
  g6: { id:'g6', tier:'gold', name:'Dévoué', desc:'30 jours de suite', icon:'📅', check:function(s){return s.streak>=30;}},
  g7: { id:'g7', tier:'gold', name:'Épargne', desc:'75 pays Survie, 3 boucliers non utilisés', icon:'🛡️', check:function(s){return s.survieBouc3x75;}},
  g8: { id:'g8', tier:'gold', name:'Élite', desc:'Atteindre le niveau maximum (10)', icon:'🌟', check:function(s){return s.xp>=5000;}},
  g9: { id:'g9', tier:'gold', name:'Champion', desc:'20 parties multijoueur gagnées', icon:'🏆', check:function(s){return s.multiWins>=20;}},
  g10:{ id:'g10',tier:'gold', name:'Chrono Parfait', desc:'Chrono Difficile 10/10 en moins de 60s sans erreur', icon:'⏱️', check:function(s){return s.chronoParfaitHard;}},

  // ── PLATINE ──
  p1: { id:'p1', tier:'platinum', name:'💎 Maître du Monde', desc:'Tous les Or + L\'Épreuve Ultime en 1 session', icon:'💎', check:function(s){return s.platineUnlocked;}}
};

function countTier(stats, tier) {
  var count = 0;
  var unlocked = stats.unlockedTrophies || [];
  Object.keys(TROPHIES).forEach(function(k) {
    if (TROPHIES[k].tier === tier && unlocked.indexOf(k) > -1) count++;
  });
  return count;
}

// XP et niveaux
var XP_LEVELS = [
  {level:1, xp:0,    title:'🌱 Débutant',        color:'#888888'},
  {level:2, xp:200,  title:'🧭 Explorateur',      color:'#00f2ff'},
  {level:3, xp:500,  title:'🗺️ Navigateur',       color:'#00ff88'},
  {level:4, xp:1000, title:'🏆 Géographe',        color:'#4facfe'},
  {level:5, xp:2000, title:'⭐ Expert',            color:'#f093fb'},
  {level:6, xp:3000, title:'🔥 Maître',           color:'#ff6b6b'},
  {level:7, xp:4000, title:'💫 Légende',          color:'#a29bfe'},
  {level:8, xp:5000, title:'👑 Maître du Monde',  color:'#ffcc00'}
];

function getLevel(xp) {
  var level = XP_LEVELS[0];
  for (var i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i].xp) level = XP_LEVELS[i];
  }
  return level;
}

function updateTerryCombo(n){
  var dur=n>=5?'0.42s':n>=3?'0.58s':n>=2?'0.68s':'0.8s';
  document.querySelectorAll('.terry-beat').forEach(function(el){el.style.animationDuration=dur;});
  var badge=document.getElementById('combo-streak');
  if(!badge)return;
  if(n<2){badge.style.display='none';return;}
  badge.style.display='flex';
  badge.textContent='⚡ COMBO x'+n;
  badge.className='combo-streak '+(n>=5?'fire':'neon');
}
function updateTerryHalo(color){
  var c=color||(getLevel(loadStats().xp).color)||'#00f2ff';
  var r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);
  document.querySelectorAll('.terry-beat').forEach(function(el){
    el.style.setProperty('--halo','rgba('+r+','+g+','+b+',1)');
    el.style.setProperty('--halo-mid','rgba('+r+','+g+','+b+',0.7)');
    el.style.setProperty('--halo-dim','rgba('+r+','+g+','+b+',0.45)');
  });
}
function getNextLevel(xp) {
  for (var i = 0; i < XP_LEVELS.length; i++) {
    if (XP_LEVELS[i].xp > xp) return XP_LEVELS[i];
  }
  return null;
}

// ── STATS STORAGE ──
function loadStats() {
  try {
    var s = localStorage.getItem('flagmaster_stats');
    if (s) return JSON.parse(s);
  } catch(e) {}
  return {
    totalGames: 0, xp: 0, streak: 0, lastPlayDate: null,
    foundFlags: [], foundFlagsCount: {}, modesPlayed: {}, unlockedTrophies: [],
    maxCombo: 0, maxComboHard: 0, multiWins: 0,
    finishedWith1Life: false, perfectEasy: false,
    perfectChronoMedium: false, perfectHard: false,
    chronoFacile15: false, chronoParfaitHard: false,
    survieNoBouclier50: false, survieNoBouclier100: false,
    survieBouc3x75: false, allContinents: false,
    fast5: false, platineUnlocked: false,
    platineProgress: { classic: false, chrono: false, survie: false }
  };
}

function saveStats(stats) {
  try { localStorage.setItem('flagmaster_stats', JSON.stringify(stats)); } catch(e) {}
}

// ── UPDATE STATS AFTER GAME ──
function updateStatsAfterGame(result) {
  var stats = loadStats();
  stats.totalGames = (stats.totalGames || 0) + 1;

  // Streak
  var today = new Date().toDateString();
  if (stats.lastPlayDate === today) {
    // Même jour, pas de changement
  } else if (stats.lastPlayDate === new Date(Date.now()-86400000).toDateString()) {
    stats.streak = (stats.streak || 0) + 1;
  } else {
    stats.streak = 1;
  }
  stats.lastPlayDate = today;

  // XP
  var xpGain = 0;
  if (result.mode === 'classic') {
    xpGain = result.score * 10 * (result.diff === 'hard' ? 3 : result.diff === 'medium' ? 2 : 1);
    if (result.score === 10) xpGain += 50;
  } else if (result.mode === 'chrono') {
    xpGain = result.score * 15 * (result.diff === 'hard' ? 3 : result.diff === 'medium' ? 2 : 1);
  } else if (result.mode === 'survie') {
    xpGain = result.streak * 5;
  }
  var oldLevel = getLevel(stats.xp);
  stats.xp = (stats.xp || 0) + xpGain;
  var newLevel = getLevel(stats.xp);
  result.xpGain = xpGain;
  result.levelUp = newLevel.level > oldLevel.level ? newLevel : null;

  // Modes played
  if (!stats.modesPlayed) stats.modesPlayed = {};
  stats.modesPlayed[result.mode] = true;

  // Found flags
  if (!stats.foundFlags) stats.foundFlags = [];
  if (result.foundFlags) {
    result.foundFlags.forEach(function(f) {
      if (stats.foundFlags.indexOf(f) === -1) stats.foundFlags.push(f);
    });
  }

  // Found flags count (for "Chez moi" trophy)
  if (!stats.foundFlagsCount) stats.foundFlagsCount = {};
  if (result.foundFlags) {
    result.foundFlags.forEach(function(f){stats.foundFlagsCount[f]=(stats.foundFlagsCount[f]||0)+1;});
  }

  // Combos
  if (result.maxCombo > (stats.maxCombo || 0)) stats.maxCombo = result.maxCombo;
  if (result.diff === 'hard' && result.maxCombo > (stats.maxComboHard || 0)) stats.maxComboHard = result.maxCombo;

  // Multi wins
  if (result.multiWin) stats.multiWins = (stats.multiWins || 0) + 1;

  // Specific achievements
  if (result.mode === 'classic' && result.lives === 1 && result.score === 10) stats.finishedWith1Life = true;
  if (result.mode === 'classic' && result.diff === 'easy' && result.score === 10) stats.perfectEasy = true;
  if (result.mode === 'classic' && result.diff === 'hard' && result.score === 10 && result.errors === 0) stats.perfectHard = true;
  if (result.mode === 'chrono' && result.diff === 'medium' && result.score === 10) stats.perfectChronoMedium = true;
  if (result.mode === 'chrono' && result.diff === 'easy' && result.score === 10 && result.elapsed < 15) stats.chronoFacile15 = true;
  if (result.mode === 'chrono' && result.diff === 'hard' && result.score === 10 && result.errors === 0 && result.elapsed < 60) stats.chronoParfaitHard = true;
  if (result.mode === 'survie' && result.streak >= 50 && result.shieldsUsed === 0) stats.survieNoBouclier50 = true;
  if (result.mode === 'survie' && result.streak >= 100 && result.shieldsUsed === 0) stats.survieNoBouclier100 = true;
  if (result.mode === 'survie' && result.streak >= 75 && result.shieldsNotUsed >= 3) stats.survieBouc3x75 = true;
  if (result.fast5) stats.fast5 = true;

  // Continents check (auto-generated from FLAGS data)
  var continentSets = {EU:[],AS:[],AF:[],AM:[],OC:[]};
  FLAGS.forEach(function(f){if(continentSets[f.continent])continentSets[f.continent].push(f.name);});
  var hasAll = Object.keys(continentSets).every(function(c){
    return continentSets[c].some(function(country){return stats.foundFlags.indexOf(country)>-1;});
  });
  if (hasAll) stats.allContinents = true;

  // Check platine progress
  if (result.platineSession) {
    if (result.mode === 'survie' && result.streak >= 20 && result.shieldsUsed === 0) stats.platineProgress.survie = true;
    if (result.mode === 'chrono' && result.diff === 'hard' && result.score === 10 && result.elapsed < 80) stats.platineProgress.chrono = true;
    if (result.mode === 'classic' && result.diff === 'hard' && result.score === 10 && result.errors === 0) stats.platineProgress.classic = true;
    if (stats.platineProgress.survie && stats.platineProgress.chrono && stats.platineProgress.classic) {
      stats.platineUnlocked = true;
    }
  }

  // Check new trophies
  var newTrophies = [];
  if (!stats.unlockedTrophies) stats.unlockedTrophies = [];
  Object.keys(TROPHIES).forEach(function(k) {
    if (stats.unlockedTrophies.indexOf(k) === -1 && TROPHIES[k].check(stats)) {
      stats.unlockedTrophies.push(k);
      newTrophies.push(TROPHIES[k]);
    }
  });

  saveStats(stats);
  if(G.loggedUser&&G.loggedUser.uid&&!G.guestMode)_fbSaveStats(G.loggedUser.uid,stats);
  result.newTrophies = newTrophies;
  result.stats = stats;
  return result;
}

// ── NOTIFICATION TROPHÉE ──
var notifQueue = [];
var notifShowing = false;

function showTrophyNotif(trophy) {
  notifQueue.push(trophy);
  if (!notifShowing) processNotifQueue();
}

function spawnTrophyStars(el, color, count) {
  for (var i = 0; i < count; i++) {
    var star = document.createElement('div');
    star.className = 'trophy-notif-star';
    var angle = (i / count) * 360;
    var dist = 60 + Math.random() * 50;
    var dx = Math.round(Math.cos(angle * Math.PI / 180) * dist);
    var dy = Math.round(Math.sin(angle * Math.PI / 180) * dist);
    star.style.cssText = 'position:absolute;width:8px;height:8px;border-radius:50%;left:50%;top:50%;background:'+color+';--dx:'+dx+'px;--dy:'+dy+'px;animation:starBurst 0.8s ease-out '+(i*30)+'ms forwards;pointer-events:none;';
    el.appendChild(star);
    setTimeout(function(s){s.remove();}, 1000 + i * 30, star);
  }
}

function processNotifQueue() {
  if (notifQueue.length === 0) { notifShowing = false; return; }
  notifShowing = true;
  var t = notifQueue.shift();
  var el = document.getElementById('trophy-notif');
  if (!el) {
    el = document.createElement('div');
    el.id = 'trophy-notif';
    document.body.appendChild(el);
  }
  var colors = { bronze:'#cd7f32', silver:'#c0c0c0', gold:'#FFD700', platinum:'#C77DFF' };
  var glows  = { bronze:'rgba(205,127,50,0.5)', silver:'rgba(192,192,192,0.4)', gold:'rgba(255,215,0,0.6)', platinum:'rgba(199,119,255,0.7)' };
  var tierLabels = { bronze:'🥉 Bronze', silver:'🥈 Argent', gold:'🥇 Or', platinum:'💎 Platine' };
  var color = colors[t.tier] || '#FFD700';
  var glow  = glows[t.tier]  || 'rgba(255,215,0,0.6)';
  var pulseAnim = t.tier === 'platinum' ? 'trophyPlatinePulse 1.5s ease infinite' : t.tier === 'gold' ? 'trophyGoldPulse 1.5s ease infinite' : 'none';

  el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;'+
    'background:linear-gradient(135deg,rgba(15,16,22,0.97),rgba(25,26,35,0.97));'+
    'border:2px solid '+color+';border-radius:24px;padding:14px 18px;'+
    'display:flex;align-items:center;gap:14px;'+
    'box-shadow:0 0 30px '+glow+',0 8px 32px rgba(0,0,0,0.6);'+
    'animation:trophySlideIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275),'+pulseAnim+';'+
    'max-width:350px;width:92%;overflow:visible;';

  el.innerHTML =
    '<div style="position:relative;width:56px;height:56px;flex-shrink:0;display:flex;align-items:center;justify-content:center;'+
      'background:radial-gradient(circle,rgba(255,255,255,0.08),transparent);'+
      'border-radius:50%;border:1.5px solid '+color+';box-shadow:0 0 16px '+glow+'">'+
      '<span style="font-size:32px;line-height:1;filter:drop-shadow(0 0 8px '+color+')">' + t.icon + '</span>'+
    '</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div style="font-size:10px;font-weight:900;color:'+color+';text-transform:uppercase;letter-spacing:2px;margin-bottom:2px">'+
        '🏆 '+tierLabels[t.tier]+' débloqué !'+
      '</div>'+
      '<div style="font-size:16px;font-weight:800;color:#fff;line-height:1.2">'+t.name+'</div>'+
      '<div style="font-size:11px;color:#a0aab2;margin-top:3px;line-height:1.4">'+t.desc+'</div>'+
    '</div>';

  sfx('trophy_'+t.tier);

  if (t.tier === 'gold' || t.tier === 'platinum') {
    showTerry(terry_victoire, '');
    spawnTrophyStars(el, color, t.tier === 'platinum' ? 16 : 10);
  }

  var duration = t.tier === 'platinum' ? 4500 : t.tier === 'gold' ? 3500 : 2800;
  setTimeout(function() {
    el.style.animation = 'trophySlideOut 0.35s ease forwards';
    setTimeout(function() {
      el.style.display = 'none';
      setTimeout(processNotifQueue, 200);
    }, 350);
  }, duration);
}

// ── ÉCRAN PASSEPORT ──
function renderPassport(app){
  var stats=loadStats();
  var found=stats.foundFlags||[];
  var total=FLAGS.length;
  var pct=Math.round(found.length/total*100);
  var continents={ALL:'🌐 Tous',EU:'🇪🇺 Europe',AF:'🌍 Afrique',AS:'🌏 Asie',AM:'🌎 Amériques',OC:'🌊 Océanie'};
  var tab=G.passportTab||'ALL';

  var tabsHtml='<div class="trophy-tabs" style="gap:6px;padding:0 0 6px">';
  Object.keys(continents).forEach(function(k){
    var active=k===tab;
    var cnt=k==='ALL'?total:FLAGS.filter(function(f){return f.continent===k;}).length;
    var fcnt=k==='ALL'?found.length:FLAGS.filter(function(f){return f.continent===k&&found.indexOf(f.name)>-1;}).length;
    tabsHtml+='<button '+(active?'id="active-passport-tab" ':'')+' onclick="G.passportTab=\''+k+'\';render()" style="flex-shrink:0;padding:7px 12px;border-radius:20px;font-size:12px;font-weight:800;border:1.5px solid '+(active?'var(--accent-base)':'rgba(255,255,255,0.12)')+';background:'+(active?'rgba(0,242,255,0.12)':'rgba(255,255,255,0.03)')+';color:'+(active?'var(--accent-base)':'var(--text-muted)')+';-webkit-tap-highlight-color:transparent;cursor:pointer">'+continents[k]+' <span style="opacity:0.7">'+fcnt+'/'+cnt+'</span></button>';
  });
  tabsHtml+='</div>';

  var filtered=tab==='ALL'?FLAGS:FLAGS.filter(function(f){return f.continent===tab;});
  var gridHtml='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding-bottom:20px">';
  filtered.forEach(function(f){
    var unlocked=found.indexOf(f.name)>-1;
    gridHtml+='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid '+(unlocked?'rgba(0,242,255,0.2)':'rgba(255,255,255,0.05)')+'">'+
      '<span style="font-size:28px;'+(unlocked?'filter:drop-shadow(0 0 6px rgba(0,242,255,0.5))':'filter:grayscale(1);opacity:0.2')+'">'+(unlocked?f.flag:'🏳️')+'</span>'+
      '<span style="font-size:8px;font-weight:800;text-align:center;line-height:1.2;color:'+(unlocked?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.2)')+';max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(unlocked?f.name:'???')+'</span>'+
    '</div>';
  });
  gridHtml+='</div>';

  app.innerHTML=
    '<div style="position:fixed;inset:0;z-index:50;background:#0b0c10;display:flex;flex-direction:column;padding:env(safe-area-inset-top,0px) 10px env(safe-area-inset-bottom,0px)">'+
      '<div style="flex:0 0 auto;padding:10px 0 8px">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
          '<button onclick="G.screen=\'setup\';render()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:9px 13px;font-size:14px;font-weight:800;color:var(--text-main);cursor:pointer;-webkit-tap-highlight-color:transparent;flex-shrink:0">← Retour</button>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-family:Fredoka One,cursive;font-size:20px;background:linear-gradient(135deg,#00f2ff,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">📖 Passeport</div>'+
            '<div style="font-size:11px;color:var(--text-muted);font-weight:700">'+found.length+' / '+total+' pays explorés</div>'+
          '</div>'+
        '</div>'+
        '<div style="background:rgba(255,255,255,0.05);border-radius:8px;overflow:hidden;height:6px;margin-bottom:8px">'+
          '<div style="height:100%;border-radius:8px;background:linear-gradient(90deg,#00f2ff,#00ff88);width:'+pct+'%;transition:width 0.5s ease"></div>'+
        '</div>'+
        tabsHtml+
      '</div>'+
      '<div style="flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:20px">'+
        gridHtml+
      '</div>'+
    '</div>';
  setTimeout(function(){
    var el=document.getElementById('active-passport-tab');
    if(el)el.scrollIntoView({behavior:'instant',block:'nearest',inline:'center'});
  },0);
}

// ── ÉCRAN TROPHÉES ──
function renderTrophies(app) {
  var stats = loadStats();
  var level = getLevel(stats.xp);
  var nextLevel = getNextLevel(stats.xp);
  var xpPct = nextLevel ? Math.round(((stats.xp - level.xp) / (nextLevel.xp - level.xp)) * 100) : 100;
  var unlocked = stats.unlockedTrophies || [];
  var tab = G.trophyTab || 'bronze';

  var tiers = [
    { key:'bronze',   label:'🥉',  name:'Bronze',  color:'#cd7f32', bg:'rgba(42,26,10,0.9)' },
    { key:'silver',   label:'🥈',  name:'Argent',  color:'#b0b0b0', bg:'rgba(26,26,42,0.9)' },
    { key:'gold',     label:'🥇',  name:'Or',      color:'#FFD700', bg:'rgba(42,32,0,0.9)'  },
    { key:'platinum', label:'💎',  name:'Platine', color:'#C77DFF', bg:'rgba(26,10,42,0.9)' }
  ];

  var tierColors = {bronze:'#cd7f32',silver:'#b0b0b0',gold:'#FFD700',platinum:'#C77DFF'};
  var activeTier = tiers.find(function(t){return t.key===tab;}) || tiers[0];

  // ── Onglets
  var tabsHtml = '<div class="trophy-tabs">' +
    tiers.map(function(t) {
      var tKeys = Object.keys(TROPHIES).filter(function(k){return TROPHIES[k].tier===t.key;});
      var cnt = tKeys.filter(function(k){return unlocked.indexOf(k)>-1;}).length;
      var isActive = tab === t.key;
      return '<button class="trophy-tab"'+(isActive?' id="active-trophy-tab"':'')+' onclick="setTrophyTab(\''+t.key+'\')" style="'+
        (isActive ? 'background:rgba(255,255,255,0.08);border-color:'+t.color+';color:'+t.color+';' : '')+
        '">'+t.label+' '+t.name+' <span style="opacity:0.7;font-size:11px">'+cnt+'/'+tKeys.length+'</span></button>';
    }).join('') +
  '</div>';

  // ── Trophées du tier actif
  var tierKeys = Object.keys(TROPHIES).filter(function(k){return TROPHIES[k].tier===tab;});
  var needsScroll = (tab==='gold'||tab==='silver');
  var trophyGridHtml = (needsScroll?'<div class="trophy-grid-scrollable">':'')+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:10px">' +
    tierKeys.map(function(k) {
      var t = TROPHIES[k];
      var isUnlocked = unlocked.indexOf(k) > -1;
      var infoStyle = (isUnlocked&&needsScroll) ? 'background:rgba(0,0,0,0.25);border-radius:8px;padding:4px;' : '';
      return '<div style="background:'+(isUnlocked ? activeTier.bg : 'rgba(255,255,255,0.03)')+
        ';border:1.5px solid '+(isUnlocked ? activeTier.color : 'rgba(255,255,255,0.07)')+
        ';border-radius:14px;padding:10px 8px;text-align:center;opacity:'+(isUnlocked?'1':'0.38')+
        ';transition:all 0.2s">'+
        '<div style="font-size:26px;margin-bottom:5px">'+t.icon+'</div>'+
        '<div style="'+infoStyle+'">'+
          '<div style="font-size:11px;font-weight:800;color:'+(isUnlocked?'#fff':'var(--text-muted)')+';line-height:1.2;margin-bottom:3px">'+t.name+'</div>'+
          '<div style="font-size:9px;color:'+(isUnlocked?'rgba(210,220,230,0.9)':'var(--text-muted)')+';line-height:1.3">'+t.desc+'</div>'+
        '</div>'+
        (isUnlocked?'<div style="font-size:9px;font-weight:900;color:'+activeTier.color+';margin-top:5px">✓ OK</div>':'')+
      '</div>';
    }).join('') +
  '</div>'+
  (needsScroll?'</div>':'');

  // ── Épreuve Platine (onglet Platine uniquement)
  var platineHtml = '';
  if(tab === 'platinum') {
    var pp = stats.platineProgress || {};
    var allGold = countTier(stats,'gold') >= 10;
    platineHtml = '<div style="background:linear-gradient(135deg,#1a0a2a,#2a1040);border:1.5px solid #C77DFF;border-radius:16px;padding:14px;margin-top:10px">'+
      '<div style="font-family:Fredoka One,cursive;font-size:15px;color:#C77DFF;margin-bottom:4px">💎 Épreuve Ultime</div>'+
      '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Enchaîner les 3 modes en 1 session</div>'+
      (!allGold ?
        '<div style="font-size:11px;color:#C77DFF;font-weight:800">🔒 Débloquer tous les Or d\'abord ('+countTier(stats,'gold')+'/10)</div>' :
        ['survie','chrono','classic'].map(function(m){
          var labels={survie:'💀 Survie: 20 pays sans vie',chrono:'⏱️ Chrono Hard: 10/10 < 80s',classic:'🏆 Classique Hard: 10/10 parfait'};
          var done = pp[m];
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">'+
            '<span style="font-size:15px">'+(done?'✅':'⬜')+'</span>'+
            '<span style="font-size:11px;font-weight:800;color:'+(done?'#4CAF50':'var(--text-muted)')+'">'+labels[m]+'</span>'+
          '</div>';
        }).join('')
      )+
    '</div>';
  }

  var html =
    // Header
    '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px">'+
      '<button onclick="goBack()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-family:Nunito,sans-serif;font-size:14px;font-weight:800;padding:4px 0;-webkit-tap-highlight-color:transparent">← Retour</button>'+
      '<button onclick="resetGame()" style="background:rgba(255,71,87,0.08);border:1px solid rgba(255,71,87,0.3);border-radius:10px;padding:6px 10px;cursor:pointer;color:var(--danger);font-family:Nunito,sans-serif;font-size:11px;font-weight:800;-webkit-tap-highlight-color:transparent">🗑️ Reset</button>'+
    '</div>'+

    // XP compact (1 ligne)
    '<div style="background:rgba(255,255,255,0.04);border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:10px 12px;width:100%;margin-bottom:8px">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+
        '<img src="'+terry_buste+'" width="36" height="36" style="object-fit:contain;flex-shrink:0"/>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-family:Fredoka One,cursive;font-size:15px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+level.title+'</div>'+
          '<div style="font-size:10px;color:var(--text-muted);font-weight:700">'+stats.xp+' XP'+(nextLevel?' / '+nextLevel.xp:'')+'</div>'+
        '</div>'+
        '<div style="font-family:Fredoka One,cursive;font-size:22px;color:var(--accent-base);flex-shrink:0">Niv.'+level.level+'</div>'+
      '</div>'+
      '<div style="background:rgba(0,0,0,0.3);border-radius:10px;height:6px;overflow:hidden">'+
        '<div style="height:100%;border-radius:10px;background:linear-gradient(90deg,var(--accent-base),#9b59b6);width:'+xpPct+'%;transition:width 1s ease"></div>'+
      '</div>'+
    '</div>'+

    // Stats 3 pills
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;width:100%;margin-bottom:10px">'+
      '<div style="background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.07);padding:8px 4px;text-align:center">'+
        '<div style="font-family:Fredoka One,cursive;font-size:19px;color:var(--warning)">'+stats.totalGames+'</div>'+
        '<div style="font-size:9px;font-weight:800;color:var(--text-muted)">PARTIES</div>'+
      '</div>'+
      '<div style="background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.07);padding:8px 4px;text-align:center">'+
        '<div style="font-family:Fredoka One,cursive;font-size:19px;color:var(--warning)">'+(stats.streak||0)+'🔥</div>'+
        '<div style="font-size:9px;font-weight:800;color:var(--text-muted)">STREAK</div>'+
      '</div>'+
      '<div style="background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.07);padding:8px 4px;text-align:center">'+
        '<div style="font-family:Fredoka One,cursive;font-size:19px;color:var(--warning)">'+(stats.foundFlags?stats.foundFlags.length:0)+'</div>'+
        '<div style="font-size:9px;font-weight:800;color:var(--text-muted)">PAYS /195</div>'+
      '</div>'+
    '</div>'+

    // Onglets
    tabsHtml +

    // Grille trophées
    trophyGridHtml +

    // Épreuve Platine (si onglet platine)
    platineHtml;

  app.innerHTML = html;
  setTimeout(function(){
    var el=document.getElementById('active-trophy-tab');
    if(el)el.scrollIntoView({behavior:'instant',block:'nearest',inline:'center'});
  },0);
}

function goBack() {
  G.screen = 'setup';
  render();
}


var G={screen:'setup',mode:'solo',diff:'easy',gameMode:'classic',
  players:[{name:'',score:0,lives:3,avatar:'🐯',color:'#4D96FF'}],
  cp:0,questions:[],surviePool:[],current:0,answered:false,
  timeLeft:0,maxTime:0,timerID:null,combo:0,errors:0,streak:0,
  shields:0,shieldsUsed:0,nowPlaying:'',loggedUser:null,guestMode:false,lastWon:false,
  _prevScreen:null,trophyTab:'bronze',passportTab:'ALL',username:null,duelId:null,duelRole:null,
  fatalFlag:null,newFlagsThisSession:0,speedCombo:0,questionStartTime:0,lastXpGain:0,lastLevelUp:null,lastNewTrophies:[],timedOut:false,
  continent:'ALL',answerCount:4};

function shuffle(a){return a.slice().sort(function(){return Math.random()-.5;});}
function getPool(){
  var base=G.diff==='easy'?FLAGS.filter(function(f){return f.lvl===1;}):G.diff==='medium'?FLAGS.filter(function(f){return f.lvl<=2;}):FLAGS;
  return(G.continent&&G.continent!=='ALL')?base.filter(function(f){return f.continent===G.continent;}):base;
}
function buildQ(q,pool){
  var n=(G.answerCount||4)-1;
  var wrongSrc=shuffle((pool||FLAGS).filter(function(f){return f.name!==q.name;}));
  if(wrongSrc.length<n)wrongSrc=shuffle(FLAGS.filter(function(f){return f.name!==q.name;}));
  var w=wrongSrc.slice(0,n);
  return{flag:q.flag,name:q.name,lvl:q.lvl,continent:q.continent,choices:shuffle([q.name].concat(w.map(function(f){return f.name;})))};
}
function makePlayers(n){return Array.from({length:n},function(_,i){return{name:(G.players[i]?G.players[i].name:''),score:0,lives:MAX_LIVES,avatar:AVATARS[i],color:COLORS[i]};});}

function _execRender(app){
  document.body.classList.remove('setup-active','auth-active');
  if(G.screen==='loading')renderLoading(app);
  else if(G.screen==='auth')renderAuth(app);
  else if(G.screen==='setUsername')renderSetUsername(app);
  else if(G.screen==='setup')renderSetup(app);
  else if(G.screen==='game')renderGame(app);
  else if(G.screen==='trophies')renderTrophies(app);
  else if(G.screen==='passport')renderPassport(app);
  else if(G.screen==='duel')renderDuel(app);
  else { renderEnd(app); setTimeout(function(){ initTerryEndCanvas(G.lastWon); }, 0); }
}

// ══════════ CLAUDE AI — FUN FACTS ══════════
var claudeApiKey = localStorage.getItem('flagmaster_claude_key') || '';

function saveClaudeKey(val) {
  claudeApiKey = (val || '').trim();
  localStorage.setItem('flagmaster_claude_key', claudeApiKey);
}

async function getFunFact(countryName, flag) {
  if (!claudeApiKey || G.gameMode === 'chrono') return;
  try {
    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{
          role: 'user',
          content: 'Donne 1 fait amusant et surprenant sur ' + countryName + ' en 1 phrase (max 18 mots). Réponds directement le fait, sans intro.'
        }]
      })
    });
    var data = await resp.json();
    if (data.content && data.content[0] && data.content[0].text) {
      var fbEl = document.getElementById('fb');
      if (fbEl && G.answered) {
        var box = document.createElement('div');
        box.className = 'fun-fact-box';
        box.innerHTML = '<span class="fun-fact-label">💡 Le saviez-vous ?</span>' + flag + ' ' + data.content[0].text.trim();
        fbEl.appendChild(box);
      }
    }
  } catch(e) {}
}
// ═══════════════════════════════════════════

function render(){
  try{
    var app=document.getElementById('app');if(!app)return;
    var screenChanged=(G._prevScreen!==G.screen);
    G._prevScreen=G.screen;
    if(screenChanged && app.children.length>0){
      // Slide out current screen
      app.style.opacity='0';
      app.style.transform='translateY(-14px)';
      app.style.transition='opacity 0.15s ease,transform 0.15s ease';
      setTimeout(function(){
        try{
          app.style.transition='none';
          app.style.opacity='0';
          app.style.transform='translateY(18px)';
          app.innerHTML='';
          _execRender(app);
          updateTerryHalo();
          // Slide in new screen
          requestAnimationFrame(function(){requestAnimationFrame(function(){
            app.style.transition='opacity 0.32s ease,transform 0.32s cubic-bezier(0.25,0.8,0.25,1)';
            app.style.opacity='1';
            app.style.transform='translateY(0)';
          });});
        }catch(e){app.innerHTML='<div style="color:red;padding:1rem">'+e.message+'</div>';}
      },155);
    } else {
      app.innerHTML='';
      _execRender(app);
      updateTerryHalo();
    }
  }
  catch(e){document.getElementById('app').innerHTML='<div style="color:red;padding:1rem">'+e.message+'</div>';}
}

function T(src,size){
  return '<img src="'+src+'" width="'+size+'" height="'+size+'" style="object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))"/>';
}


function renderLoading(app){
  app.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:16px">'+
    '<img src="'+terry_accueil+'" width="80" height="80" style="object-fit:contain;animation:fabPulse 1.5s ease-in-out infinite"/>'+
    '<div style="font-family:Fredoka One,cursive;font-size:24px;background:linear-gradient(135deg,#ff4757,#e056fd,#00f2fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">FlagMaster</div>'+
    '<div class="loading-dots"><span></span><span></span><span></span></div>'+
  '</div>';
}

function renderSetUsername(app){
  document.body.classList.add('auth-active');
  var u=G.loggedUser;
  var alreadySet=!!G.username;
  app.innerHTML=
    '<div class="auth-card">'+
      '<div style="font-size:40px;margin-bottom:8px">👤</div>'+
      '<div class="auth-title">'+(alreadySet?'Ton pseudo':'Choisis ton pseudo')+'</div>'+
      '<div style="font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:16px">Visible par les autres joueurs<br>Modifiable via la Boutique</div>'+
      '<div id="auth-error" class="auth-error"></div>'+
      (alreadySet
        ? '<div style="background:rgba(79,172,254,0.08);border:1px solid var(--accent);border-radius:14px;padding:14px;text-align:center;margin-bottom:8px">'+
            '<div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:4px">'+G.username+'</div>'+
            '<div style="font-size:11px;color:var(--text-muted);font-weight:700">🔒 Changement disponible via la Boutique</div>'+
          '</div>'+
          '<button class="auth-btn secondary" onclick="G.screen=\'setup\';render()">Continuer</button>'
        : '<input id="username-input" type="text" placeholder="Pseudo (3–20 car.)" class="auth-input" maxlength="20" autocomplete="username"/>'+
          '<button class="auth-btn primary" onclick="saveUsername()">Confirmer</button>'+
          (u?'<button class="auth-guest-link" onclick="G.screen=\'setup\';render()">Passer →</button>':'')
      )+
    '</div>';
}

function saveUsername(){
  var val=(document.getElementById('username-input')||{}).value||'';
  val=val.trim();
  if(val.length<3){_setAuthError('Minimum 3 caractères.');return;}
  if(val.length>20){_setAuthError('Maximum 20 caractères.');return;}
  if(!/^[a-zA-Z0-9_\-]+$/.test(val)){_setAuthError('Lettres, chiffres, _ et - uniquement.');return;}
  var uid=G.loggedUser&&G.loggedUser.uid;
  if(!uid){G.username=val;G.screen='setup';render();return;}
  _setAuthError('⏳ Vérification…');
  _db.collection('users').where('username','==',val).get().then(function(snap){
    var taken=snap.docs.some(function(d){return d.id!==uid;});
    if(taken){_setAuthError('Ce pseudo est déjà utilisé par un autre explorateur.');return;}
    return _db.collection('users').doc(uid).set({
      username:val,
      lastUsernameChange:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true}).then(function(){
      G.username=val;G.screen='setup';render();
    });
  }).catch(function(e){_setAuthError('Erreur : '+(e.message||e.code));});
}

function renderAuth(app){
  document.body.classList.add('auth-active');
  app.innerHTML=
    '<div class="auth-card">'+
      '<div class="auth-logo">'+
        '<img src="'+terry_accueil+'" width="64" height="64" style="object-fit:contain"/>'+
        '<div>'+
          '<div style="font-family:Fredoka One,cursive;font-size:26px;line-height:1;background:linear-gradient(135deg,#ff4757,#e056fd,#00f2fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">FlagMaster</div>'+
          '<div style="font-size:10px;font-weight:900;color:var(--text-muted);letter-spacing:1.5px;text-transform:uppercase;margin-top:2px">Globe Terry • 195 pays</div>'+
        '</div>'+
      '</div>'+
      '<div class="auth-title">Rejoins l\'aventure 🌍</div>'+
      '<div id="auth-error" class="auth-error"></div>'+
      '<input id="auth-email" type="email" placeholder="Email" class="auth-input" autocomplete="email"/>'+
      '<div style="position:relative;width:100%">'+
        '<input id="auth-password" type="password" placeholder="Mot de passe" class="auth-input" autocomplete="current-password" style="padding-right:48px;width:100%"/>'+
        '<button type="button" onclick="togglePwdVis()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;line-height:1;padding:4px;-webkit-tap-highlight-color:transparent" id="pwd-eye">👁️</button>'+
      '</div>'+
      '<button class="auth-btn primary" onclick="authSignIn()">Connexion</button>'+
      '<button class="auth-btn secondary" onclick="authSignUp()">Créer un compte</button>'+
      '<div class="auth-sep"><span>ou</span></div>'+
      '<button class="auth-btn google" onclick="authGoogle()"><span class="auth-provider-icon">G</span>Continuer avec Google</button>'+
      '<button class="auth-btn apple" onclick="authApple()"><span class="auth-provider-icon">🍎</span>Continuer avec Apple</button>'+
      '<button class="auth-guest-link" onclick="authGuest()">Continuer sans compte →</button>'+
    '</div>';
}

function _setupHeader(){
  var u=G.loggedUser;
  var trophyBtn=
    '<button onclick="showTrophyScreen()" style="flex-shrink:0;background:rgba(255,215,0,0.08);border:1.5px solid rgba(255,215,0,0.3);border-radius:14px;padding:8px 11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;-webkit-tap-highlight-color:transparent">'+
      '<span style="font-size:22px;line-height:1">🏆</span>'+
      '<span style="font-size:9px;font-weight:900;color:rgba(255,215,0,0.9);letter-spacing:0.5px">TROPHÉES</span>'+
    '</button>';
  var passportBtn=
    '<button onclick="G.screen=\'passport\';render()" style="flex-shrink:0;background:rgba(0,242,255,0.08);border:1.5px solid rgba(0,242,255,0.3);border-radius:14px;padding:8px 11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;-webkit-tap-highlight-color:transparent">'+
      '<span style="font-size:22px;line-height:1">📖</span>'+
      '<span style="font-size:9px;font-weight:900;color:rgba(0,242,255,0.9);letter-spacing:0.5px">PASSEPORT</span>'+
    '</button>';
  if(u&&!G.guestMode){
    var st=loadStats(),lvl=getLevel(st.xp),hc=_getHomeCountry();
    var nm=G.username||u.displayName||(u.email?u.email.split('@')[0]:'Joueur');
    var av=u.photoURL?
      '<img src="'+u.photoURL+'" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--accent-base);flex-shrink:0"/>':
      '<div class="profile-av">'+((G.username||u.displayName||u.email||'?')[0].toUpperCase())+'</div>';
    return '<div class="setup-header">'+
      av+
      '<div style="flex:1;min-width:0;overflow:hidden">'+
        '<div style="font-weight:900;font-size:14px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+nm+'</div>'+
        '<div style="font-size:10px;color:var(--text-muted);font-weight:700">'+(hc?hc.emoji+' '+hc.name+' · ':'')+lvl.title+'</div>'+
      '</div>'+
      '<img src="'+terry_accueil+'" width="54" height="54" class="terry-beat" style="object-fit:contain;flex-shrink:0"/>'+
      '<div style="display:flex;gap:5px;align-items:center">'+passportBtn+trophyBtn+'<button onclick="authSignOut()" class="signout-btn" title="Déconnexion">↪️</button></div>'+
    '</div>';
  }
  return '<div class="setup-header">'+
    '<img src="'+terry_accueil+'" width="70" height="70" class="terry-beat" style="object-fit:contain;flex-shrink:0"/>'+
    '<div style="flex:1;min-width:0">'+
      '<div class="setup-title" style="font-family:Fredoka One,cursive;font-size:26px;line-height:1.05;background:linear-gradient(135deg,#ff4757,#e056fd,#00f2fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:1px">FlagMaster</div>'+
      '<div class="setup-sub" style="font-size:10px;font-weight:900;color:var(--text-muted);letter-spacing:2px;text-transform:uppercase;opacity:0.8;margin-top:1px">Globe Terry • 195 pays</div>'+
    '</div>'+
    passportBtn+trophyBtn+
  '</div>';
}

function _guestBanner(){
  if(!G.guestMode)return '';
  return '<div class="guest-banner">💾 <span>Connecte-toi pour sauvegarder ta progression</span>'+
    '<button onclick="G.guestMode=false;G.screen=\'auth\';render()">Se connecter</button></div>';
}

function getDailyCountry(){var d=Math.floor(Date.now()/86400000);return FLAGS[d%FLAGS.length];}
function renderSetupContext(){
  var stats=loadStats(),daily=getDailyCountry();
  var dayBit='<div class="ctx-daily"><span style="font-size:20px">'+daily.flag+'</span><span class="ctx-key">'+daily.name+'</span></div>';
  if(G.mode==='solo'){
    return '<div class="ctx-band">'+
      '<div class="ctx-stat"><span class="ctx-val">'+stats.totalGames+'</span><span class="ctx-key">parties</span></div>'+
      '<div class="ctx-divider"></div>'+
      '<div class="ctx-stat"><span class="ctx-val">'+(stats.foundFlags?stats.foundFlags.length:0)+'</span><span class="ctx-key">pays</span></div>'+
      '<div class="ctx-divider"></div>'+
      '<div class="ctx-stat"><span class="ctx-val">'+(stats.streak||0)+'🔥</span><span class="ctx-key">jours</span></div>'+
      '<div class="ctx-divider"></div>'+
      dayBit+
    '</div>';
  }
  if(G.mode==='local2'||G.mode==='local4'){
    var lm=null;try{lm=JSON.parse(localStorage.getItem('flagmaster_lastmulti')||'null');}catch(e){}
    var lmHtml=lm?lm.players.map(function(p){return p.avatar+' <b>'+p.score+'</b>';}).join(' · '):'<span style="opacity:0.5">—</span>';
    return '<div class="ctx-band">'+
      '<div class="ctx-last"><span class="ctx-key">🏆 Dernière</span><div class="ctx-players">'+lmHtml+'</div></div>'+
      '<div class="ctx-divider"></div>'+dayBit+
    '</div>';
  }
  return '<div class="ctx-band">'+
    '<div class="ctx-last"><span class="ctx-key">🌐 Top mondial</span><div class="ctx-players">🥇 195 &nbsp;🥈 180 &nbsp;🥉 165</div></div>'+
    '<div class="ctx-divider"></div>'+dayBit+
  '</div>';
}

function createDuelRoom(){
  var uid=G.loggedUser&&G.loggedUser.uid;
  var username=G.username||'Joueur';
  var statusEl=document.getElementById('duel-status');
  if(!uid||!_fbReady){if(statusEl)statusEl.textContent='⚠️ Connexion requise.';return;}
  if(statusEl)statusEl.textContent='⏳ Création de la salle…';
  var duelId=(Date.now().toString(36)+Math.random().toString(36).slice(2,7)).toUpperCase();
  var room={
    id:duelId,
    status:'waiting',
    createdAt:firebase.firestore.FieldValue.serverTimestamp(),
    player1:{uid:uid,username:username,hearts:3,score:0},
    player2:null,
    currentQuestion:0,
    diff:G.diff
  };
  _db.collection('duels').doc(duelId).set(room)
    .then(function(){
      G.duelId=duelId;G.duelRole='player1';
      if(statusEl)statusEl.textContent='✅ Salle créée ! Code : '+duelId;
    })
    .catch(function(e){if(statusEl)statusEl.textContent='Erreur : '+(e.message||e.code);});
}

function renderDuel(app){
  var hearts='❤️❤️❤️';
  var p1=G.players[0]||{name:'Joueur 1',avatar:'🐯',score:0};
  var p2=G.players[1]||{name:'Joueur 2',avatar:'🦊',score:0};
  app.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px">'+
      '<button onclick="G.screen=\'setup\';render()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-family:Nunito,sans-serif;font-size:14px;font-weight:800;padding:4px 0;-webkit-tap-highlight-color:transparent">← Retour</button>'+
      '<div style="font-family:Fredoka One,cursive;font-size:18px;color:#fff">Duel 🤺</div>'+
      '<div style="width:60px"></div>'+
    '</div>'+
    '<div style="width:100%;background:linear-gradient(135deg,rgba(255,71,87,0.12),rgba(155,89,182,0.12));border:1.5px solid rgba(255,71,87,0.35);border-radius:16px;padding:9px 14px;text-align:center;margin-bottom:12px">'+
      '<div style="font-size:10px;font-weight:900;color:var(--danger);letter-spacing:2px;text-transform:uppercase;margin-bottom:2px">🚧 Bientôt disponible</div>'+
      '<div style="font-size:12px;color:var(--text-muted)">Affronte un ami en temps réel • Même série de drapeaux • 3 cœurs chacun</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;width:100%;align-items:start">'+
      '<div style="background:rgba(79,172,254,0.08);border:1.5px solid rgba(79,172,254,0.3);border-radius:18px;padding:14px 10px;text-align:center">'+
        '<div style="font-size:30px;margin-bottom:5px">'+p1.avatar+'</div>'+
        '<div style="font-size:12px;font-weight:900;color:#fff;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+( p1.name||'Joueur 1')+'</div>'+
        '<div style="font-size:20px;letter-spacing:3px">'+hearts+'</div>'+
        '<div style="margin-top:8px;font-family:Fredoka One,cursive;font-size:26px;color:var(--accent-base)">'+p1.score+'</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;justify-content:center;padding-top:18px">'+
        '<div style="font-family:Fredoka One,cursive;font-size:18px;color:rgba(255,255,255,0.25)">VS</div>'+
      '</div>'+
      '<div style="background:rgba(255,71,87,0.08);border:1.5px solid rgba(255,71,87,0.3);border-radius:18px;padding:14px 10px;text-align:center">'+
        '<div style="font-size:30px;margin-bottom:5px">'+p2.avatar+'</div>'+
        '<div style="font-size:12px;font-weight:900;color:#fff;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(p2.name||'Joueur 2')+'</div>'+
        '<div style="font-size:20px;letter-spacing:3px">'+hearts+'</div>'+
        '<div style="margin-top:8px;font-family:Fredoka One,cursive;font-size:26px;color:var(--danger)">'+p2.score+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="width:100%;background:rgba(255,255,255,0.03);border:1.5px dashed rgba(255,255,255,0.1);border-radius:20px;padding:22px;text-align:center;margin-top:12px">'+
      '<div style="font-size:52px;opacity:0.25;filter:grayscale(1)">🏳️</div>'+
      '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;font-weight:700">Drapeau à identifier</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;margin-top:12px;opacity:0.3;pointer-events:none">'+
      ['Pays A','Pays B','Pays C','Pays D'].map(function(o){return '<button class="opt-btn">'+o+'</button>';}).join('')+
    '</div>'+
    '<button class="start-btn" onclick="createDuelRoom()" style="margin-top:10px;width:100%;opacity:'+(G.loggedUser&&!G.guestMode?'1':'0.4')+'"'+(G.loggedUser&&!G.guestMode?'':' disabled')+'>🤺 Créer une salle de Duel</button>'+
    '<div id="duel-status" style="min-height:18px;font-size:12px;font-weight:800;text-align:center;color:var(--accent);margin-top:6px"></div>';
}

function renderSetup(app){
  document.body.classList.add('setup-active');
  var n=G.mode==='local2'?2:G.mode==='local4'?4:1;
  if(G.players.length!==n)G.players=makePlayers(n);
  var modes=[['solo','🎮','Solo','Record'],['local2','👥','2J','Local'],['local4','👨‍👩‍👧','4J','Famille'],['online','🌐','Web','Online']];
  var gmodes=[['classic','🏆','Classique','10q'],['chrono','⏱️','Chrono','Temps'],['survie','💀','Survie','0 erreur']];
  var _cAll=G.continent==='ALL';
  var diffs=[
    ['easy','😊','Facile',G.gameMode==='chrono'?'30s':(_cAll?'Europe':'Niv. 1')],
    ['medium','🌍','Moyen',G.gameMode==='chrono'?'60s':(_cAll?'Monde':'Niv. 1-2')],
    ['hard','🔥','Difficile',G.gameMode==='chrono'?'100s':(_cAll?'195 pays':'Tous')]
  ];
  var ERR=typeof ERR_PENALTY!=='undefined'?ERR_PENALTY:5;
  var conts=[['ALL','🌐','Monde'],['EU','🇪🇺','Europe'],['AF','🌍','Afrique'],['AS','🌏','Asie'],['AM','🌎','Amériques'],['OC','🌊','Océanie']];
  var pool=getPool();

  app.innerHTML=
    _setupHeader()+
    '<div class="card" style="padding:12px 10px;width:100%">'+
      _guestBanner()+
      '<div class="sec-label" style="font-size:11px;margin-bottom:7px">Joueurs</div>'+
      '<div class="mode-grid" style="gap:7px;margin-bottom:10px">'+
      modes.map(function(m){return '<div class="mode-btn'+(G.mode===m[0]?' selected':'')+'" onclick="setMode(\''+m[0]+'\')" style="padding:11px 6px"><span class="mode-icon" style="font-size:24px;margin-bottom:4px">'+m[1]+'</span><div class="mode-label" style="font-size:13px">'+m[2]+'</div><div class="mode-sub" style="font-size:10px">'+m[3]+'</div></div>';}).join('')+'</div>'+

      (G.mode!=='online'&&G.mode!=='solo'?
        G.players.map(function(p,i){return '<div class="player-row" style="margin-bottom:7px"><div class="p-avatar" style="border-color:'+p.color+';width:34px;height:34px;font-size:18px">'+p.avatar+'</div><input class="p-input" placeholder="Joueur '+(i+1)+'" value="'+p.name+'" oninput="G.players['+i+'].name=this.value" maxlength="14" style="height:36px;font-size:13px"/></div>';}).join('')
      :'')+

      '<div class="sec-label" style="font-size:11px;margin-bottom:7px">Mode</div>'+
      '<div class="gmode-grid" style="gap:7px;margin-bottom:10px">'+
      gmodes.map(function(m){return '<div class="gmode-btn'+(G.gameMode===m[0]?' selected':'')+'" onclick="setGMode(\''+m[0]+'\')" style="padding:10px 6px"><span style="font-size:20px;display:block;margin-bottom:2px">'+m[1]+'</span><div style="font-size:12px;font-weight:800;color:var(--text)">'+m[2]+'</div><div style="font-size:10px;color:var(--text2)">'+m[3]+'</div></div>';}).join('')+'</div>'+
      '<button class="gmode-btn" onclick="sfx(\'click\');G.screen=\'duel\';render()" style="width:100%;padding:9px 10px;display:flex;align-items:center;justify-content:center;gap:9px;background:rgba(255,71,87,0.05);border-color:rgba(255,71,87,0.25);margin-bottom:10px">'+
        '<span style="font-size:19px">🤺</span>'+
        '<div style="text-align:left"><div style="font-size:12px;font-weight:800;color:var(--text)">Duel Online</div><div style="font-size:10px;color:var(--text2)">2 joueurs • 3 cœurs</div></div>'+
        '<span style="background:rgba(255,71,87,0.18);border:1px solid rgba(255,71,87,0.4);border-radius:6px;padding:2px 7px;font-size:9px;font-weight:900;color:var(--danger);letter-spacing:1px;margin-left:auto">BIENTÔT</span>'+
      '</button>'+

      (G.gameMode==='chrono'?'<div class="info-box" style="font-size:11px;padding:8px 10px;margin-bottom:9px;line-height:1.5">⏱️ Facile 30s • Moyen 60s • Difficile 100s • ✅ Bonne réponse = +2s • ❌ Erreur = -'+ERR+'s</div>':'')+
      (G.gameMode==='survie'?'<div class="info-box" style="font-size:11px;padding:8px 10px;margin-bottom:9px;line-height:1.5">💀 0 erreur = game over • 🛡️ /25 pays = +1 bouclier (max 3)</div>':'')+

      '<div class="sec-label" style="font-size:11px;margin-bottom:7px">Difficulté</div>'+
      '<div class="diff-row" style="gap:7px;margin-bottom:12px">'+
      diffs.map(function(d){return '<button class="diff-btn'+(G.diff===d[0]?' sel-'+d[0]:'')+'" onclick="setDiff(\''+d[0]+'\')" style="padding:10px 4px;font-size:12px">'+d[1]+' '+d[2]+'<br><span style="font-size:10px;font-weight:600;opacity:0.8">'+d[3]+'</span></button>';}).join('')+'</div>'+

      // ── Zone / Continent ──
      '<div class="sec-label" style="font-size:11px;margin-bottom:7px">🌍 Expédition</div>'+
      '<div class="trophy-tabs" style="gap:6px;padding:0 0 6px" id="zone-tabs">'+
      conts.map(function(c){
        var active=G.continent===c[0];
        var total=c[0]==='ALL'?FLAGS.length:FLAGS.filter(function(f){return f.continent===c[0];}).length;
        return '<button'+(active?' id="active-zone-tab"':'')+' onclick="setContinent(\''+c[0]+'\')" style="flex-shrink:0;padding:7px 12px;border-radius:20px;font-size:12px;font-weight:800;border:1.5px solid '+(active?'var(--accent-base)':'rgba(255,255,255,0.12)')+';background:'+(active?'rgba(0,242,255,0.12)':'rgba(255,255,255,0.03)')+';color:'+(active?'var(--accent-base)':'var(--text-muted)')+';-webkit-tap-highlight-color:transparent;cursor:pointer;white-space:nowrap">'+c[1]+' '+c[2]+' <span style="opacity:0.6;font-size:10px">'+total+'</span></button>';
      }).join('')+
      '</div>'+
      '<div style="font-size:10px;color:'+(pool.length<(G.gameMode==='survie'?G.answerCount+1:TOTAL)?'var(--danger)':'var(--text-muted)')+';font-weight:700;margin-bottom:10px;padding:0 2px">'+
        (pool.length<(G.gameMode==='survie'?G.answerCount+1:TOTAL)?
          '⚠️ '+pool.length+' drapeaux — pas assez pour lancer (min '+(G.gameMode==='survie'?G.answerCount+1:TOTAL)+')':
          '✓ '+pool.length+' drapeau'+(pool.length>1?'s':'')+' disponibles')+
      '</div>'+

      // ── Réponses (4 ou 6) ──
      '<div class="sec-label" style="font-size:11px;margin-bottom:7px">🎯 Réponses</div>'+
      '<div style="display:flex;gap:7px;margin-bottom:12px">'+
        '<button onclick="setAnswerCount(4)" style="flex:1;padding:10px 8px;border-radius:14px;border:1.5px solid '+(G.answerCount===4?'var(--accent-base)':'rgba(255,255,255,0.1)')+';background:'+(G.answerCount===4?'rgba(0,242,255,0.1)':'rgba(255,255,255,0.03)')+';color:'+(G.answerCount===4?'var(--accent-base)':'var(--text-muted)')+';font-family:Nunito,sans-serif;font-size:12px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:center;line-height:1.5">'+
          '📝 Standard<br><span style="font-size:10px;opacity:0.7">4 réponses</span>'+
        '</button>'+
        '<button onclick="setAnswerCount(6)" style="flex:1;padding:10px 8px;border-radius:14px;border:1.5px solid '+(G.answerCount===6?'#C77DFF':'rgba(255,255,255,0.1)')+';background:'+(G.answerCount===6?'rgba(199,125,255,0.1)':'rgba(255,255,255,0.03)')+';color:'+(G.answerCount===6?'#C77DFF':'var(--text-muted)')+';font-family:Nunito,sans-serif;font-size:12px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:center;line-height:1.5">'+
          '🧠 Expert<br><span style="font-size:10px;opacity:0.7">6 réponses</span>'+
        '</button>'+
      '</div>'+

      '<details class="api-key-section" '+(claudeApiKey?'open':'')+'>'+
        '<summary>🤖 Claude AI <span style="opacity:0.5;font-size:9px;font-weight:600">'+(claudeApiKey?'✓ Activé — fun facts après chaque bonne réponse':'Fun facts après chaque bonne réponse')+'</span></summary>'+
        '<input id="claude-key-input" type="password" placeholder="Clé API Anthropic (sk-ant-…)" value="'+claudeApiKey+'" oninput="saveClaudeKey(this.value)"/>'+
        '<div style="font-size:10px;color:var(--text2);margin-top:5px;opacity:0.7">La clé est stockée localement sur cet appareil uniquement.</div>'+
      '</details>'+
      '<div class="setup-footer">'+
        renderSetupContext()+
        '<div class="start-row">'+
          '<button class="start-btn" onclick="startGame()">🚀 Jouer !</button>'+
          '<button id="music-fab-inline" class="music-fab-inline'+(musicOn?' on':'')+'" onclick="toggleMusic()">'+(musicOn?'🔊':'🔇')+'</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  setTimeout(function(){
    var el=document.getElementById('active-zone-tab');
    if(el)el.scrollIntoView({behavior:'instant',block:'nearest',inline:'center'});
  },0);
}
function showTrophyScreen(){sfx('click');G.screen='trophies';G.trophyTab='bronze';render();}
function setTrophyTab(t){sfx('click');G.trophyTab=t;render();}

function resetGame(){
  sfx('click');
  var modal = document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);padding:20px';
  modal.innerHTML=
    '<div style="background:linear-gradient(135deg,#1a0a0a,#2a0808);border:2px solid var(--danger);border-radius:24px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 0 40px rgba(255,71,87,0.4)">'+
    '<div style="font-size:48px;margin-bottom:8px">⚠️</div>'+
    '<div style="font-family:Fredoka One,cursive;font-size:22px;color:var(--danger);margin-bottom:8px">Réinitialiser ?</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:22px;line-height:1.6">Toute ta progression sera effacée :<br>trophées, XP, statistiques, streak, pays trouvés.<br><strong style="color:#fff">Cette action est irréversible.</strong></div>'+
    '<div style="display:flex;gap:12px">'+
      '<button onclick="document.body.removeChild(this.closest(\'[style*=inset:0]\'))" style="flex:1;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#fff;font-family:Nunito,sans-serif;font-size:15px;font-weight:800;cursor:pointer">Annuler</button>'+
      '<button onclick="confirmReset(this)" style="flex:1;padding:14px;border-radius:16px;border:none;background:var(--danger);color:#fff;font-family:Nunito,sans-serif;font-size:15px;font-weight:800;cursor:pointer">Confirmer</button>'+
    '</div>'+
    '</div>';
  document.body.appendChild(modal);
}

function confirmReset(btn){
  try { localStorage.removeItem('flagmaster_stats'); } catch(e){}
  if(G.loggedUser&&G.loggedUser.uid&&_fbReady)try{_db.collection('users').doc(G.loggedUser.uid).delete().catch(function(){});}catch(e){}
  var modal = btn.closest ? btn.closest('[style*="inset:0"]') : btn.parentElement.parentElement.parentElement;
  if(modal) document.body.removeChild(modal);
  sfx('gameover');
  var toast = document.createElement('div');
  toast.style.cssText='position:fixed;bottom:30px;left:50%;transform:translateX(-50%);z-index:9999;background:#1a1a2e;border:1px solid var(--success);border-radius:16px;padding:12px 24px;color:var(--success);font-family:Nunito,sans-serif;font-size:14px;font-weight:800;animation:trophySlideIn 0.4s ease';
  toast.textContent='✓ Progression réinitialisée !';
  document.body.appendChild(toast);
  setTimeout(function(){toast.remove();},2500);
  render();
}

function setMode(m){sfx('click');G.mode=m;var n=m==='local2'?2:m==='local4'?4:1;if(m!=='online')G.players=makePlayers(n);render();}
function setDiff(d){sfx('click');G.diff=d;render();}
function setGMode(g){sfx('click');G.gameMode=g;render();}
function setContinent(c){sfx('click');G.continent=c;render();}
function setAnswerCount(n){sfx('click');G.answerCount=n;render();}

function startGame(){
  sfx('click');
  G.players=G.players.map(function(p,i){
    var nm;
    if(i===0&&G.mode==='solo'&&!G.guestMode&&G.loggedUser){
      nm=G.username||(G.loggedUser.displayName)||(G.loggedUser.email?G.loggedUser.email.split('@')[0]:null)||p.name||'Joueur 1';
    }else{nm=p.name||'Joueur '+(i+1);}
    return{name:nm,score:0,lives:MAX_LIVES,avatar:AVATARS[i],color:COLORS[i]};
  });
  if(G.timerID){clearInterval(G.timerID);G.timerID=null;}
  var pool=getPool();
  var minPool=G.gameMode==='survie'?Math.max(G.answerCount+1,6):TOTAL;
  if(pool.length<minPool){
    var _t=document.createElement('div');
    _t.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:rgba(20,10,10,0.97);border:1.5px solid var(--danger);border-radius:18px;padding:18px 22px;color:#fff;font-family:Nunito,sans-serif;font-size:14px;font-weight:800;text-align:center;max-width:270px;line-height:1.5;box-shadow:0 0 40px rgba(255,71,87,0.4)';
    _t.innerHTML='⚠️ Pas assez de drapeaux !<br><span style="font-size:12px;font-weight:600;color:var(--text-muted)">'+pool.length+' disponibles, '+minPool+' requis.<br>Augmente la difficulté ou change de zone.</span>';
    document.body.appendChild(_t);
    setTimeout(function(){_t.remove();},3000);
    return;
  }
  G.combo=0;G.errors=0;G.streak=0;G.shields=0;G.shieldsUsed=0;G.current=0;G.cp=0;G.answered=false;G.lastWon=false;G.speedCombo=0;G.questionStartTime=0;G.fatalFlag=null;G.newFlagsThisSession=0;G.timedOut=false;
  if(G.gameMode==='survie')G.surviePool=shuffle(pool).map(function(q){return buildQ(q,pool);});
  else G.questions=shuffle(pool).slice(0,TOTAL).map(function(q){return buildQ(q,pool);});
  if(G.gameMode==='chrono'){var t=G.diff==='easy'?30:G.diff==='medium'?60:100;G.maxTime=t;G.timeLeft=t;G.timerID=setInterval(tickTimer,100);}
  G.screen='game';hideTerry();
  stopMusic();
  setTimeout(function(){
    if(G.gameMode==='classic')startMusic('classic');
    else if(G.gameMode==='chrono')startMusic('chrono');
    else startMusic('survie');
  },80);
  render();
}

function _ticTac(){
  if(!musicOn)return;
  try{
    var ac=getAC();if(!ac)return;
    var osc=ac.createOscillator(),g=ac.createGain();
    osc.connect(g);g.connect(ac.destination);
    osc.type='square';osc.frequency.value=1100;
    g.gain.setValueAtTime(0.25,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.055);
    osc.start(ac.currentTime);osc.stop(ac.currentTime+0.055);
  }catch(e){}
}

function flashChronoError(){
  var el=document.getElementById('ct');if(!el)return;
  el.classList.add('flash-err');
  setTimeout(function(){el.classList.remove('flash-err');},400);
}

function floatChronoBonus(text,color){
  var ct=document.getElementById('ct');if(!ct)return;
  var el=document.createElement('span');
  el.textContent=text;
  var r=ct.getBoundingClientRect();
  el.style.cssText='position:fixed;pointer-events:none;font-family:Fredoka One,cursive;font-size:20px;font-weight:900;color:'+color+';text-shadow:0 0 10px '+color+';z-index:9999;left:'+(r.right+6)+'px;top:'+(r.top-4)+'px;animation:floatBonus 0.9s ease forwards;';
  document.body.appendChild(el);
  setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},900);
}

function tickTimer(){
  var prev=G.timeLeft;
  G.timeLeft=Math.max(0,Math.round((G.timeLeft-0.1)*10)/10);
  updateChronoTension(G.timeLeft,G.maxTime);
  // tic-tac on each second crossing in last 10s
  if(G.timeLeft>0&&G.timeLeft<=10&&Math.ceil(G.timeLeft)<Math.ceil(prev))_ticTac();
  var el=document.getElementById('ct'),tr=document.getElementById('cf');
  if(el){el.textContent=Math.ceil(G.timeLeft)+'s';el.className='chrono-time'+(G.timeLeft<=10?' danger':'');}
  if(tr)tr.style.width=Math.round(G.timeLeft/G.maxTime*100)+'%';
  if(G.timeLeft<=10&&G.timeLeft>9.8)showTerry(terry_panique,'');
  if(G.timeLeft<=0){clearInterval(G.timerID);G.timerID=null;G.timedOut=true;endGame(false);}
}

function endGame(won){
  if(G.timerID){clearInterval(G.timerID);G.timerID=null;}
  G.lastWon=!!won;G.screen='end';hideTerry();

  // Collect found flags from this game
  var foundInGame=[];
  var qs=G.gameMode==='survie'?G.surviePool:G.questions;
  if(qs){qs.slice(0,G.current).forEach(function(q){if(foundInGame.indexOf(q.name)===-1)foundInGame.push(q.name);});}

  // Build result object
  var cp=G.cp;
  var result={
    mode:G.gameMode,
    diff:G.diff,
    score:G.players[cp]?G.players[cp].score:0,
    lives:G.players[cp]?G.players[cp].lives:0,
    errors:G.errors||0,
    streak:G.streak||0,
    maxCombo:G.combo||0,
    shieldsUsed:G.shieldsUsed||0,
    shieldsNotUsed:G.shields||0,
    elapsed:G.maxTime?(G.maxTime-G.timeLeft):0,
    foundFlags:foundInGame,
    multiWin:won&&G.players.length>1,
    platineSession:G.platineSession||false
  };

  // Nouveaux drapeaux découverts cette session
  var _prevFoundFlags=loadStats().foundFlags||[];
  G.newFlagsThisSession=foundInGame.filter(function(n){return _prevFoundFlags.indexOf(n)===-1;}).length;

  // Update stats and check trophies
  var updated=updateStatsAfterGame(result);

  // Show XP gain
  G.lastXpGain=updated.xpGain||0;
  G.lastLevelUp=updated.levelUp||null;
  G.lastNewTrophies=updated.newTrophies||[];

  stopMusic();
  setTimeout(function(){startMusic(won?'scorewin':'scorelose');},150);

  // Level-up halo flash
  if(G.lastLevelUp){
    var lc=G.lastLevelUp.color||'#ffcc00';
    updateTerryHalo(lc);
    setTimeout(function(){
      document.querySelectorAll('.terry-beat').forEach(function(el){
        el.classList.add('terry-levelup');
        setTimeout(function(){el.classList.remove('terry-levelup');},900);
      });
    },400);
  }

  // Show trophy notifications with delay
  setTimeout(function(){
    if(updated.newTrophies){
      updated.newTrophies.forEach(function(t,i){
        setTimeout(function(){showTrophyNotif(t);},i*3000);
      });
    }
  },1500);

  if(G.players.length>1){try{localStorage.setItem('flagmaster_lastmulti',JSON.stringify({players:G.players.map(function(p,i){return{name:p.name||'J'+(i+1),score:p.score,avatar:p.avatar};})}));}catch(e){}}
  render();
}

function abandon(){
  sfx('click');
  if(G.timerID){clearInterval(G.timerID);G.timerID=null;}
  stopMusic();hideTerry();G.screen='setup';
  setTimeout(function(){startMusic('accueil');},150);
  render();
}

function goHome(){
  if(G.timerID){clearInterval(G.timerID);G.timerID=null;}
  stopMusic();hideTerry();G.screen='setup';
  setTimeout(function(){startMusic('accueil');},150);
  render();
}

function renderGame(app){
  var p=G.players,cp=G.cp;
  var q=G.gameMode==='survie'?G.surviePool[G.current%G.surviePool.length]:G.questions[G.current];

  // BUSTE = Image 7 GIF = neutre souriant → avatar dans la barre de jeu
  var terrySmall='<img src="'+terry_buste+'" width="34" height="34" style="object-fit:contain;border-radius:50%;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4))"/>';

  var topBar='';
  if(p.length===1){
    // Solo
    topBar='<div class="top-bar">'+
      '<div class="p-tag active">'+terrySmall+
      '<span class="p-tag-name">'+p[0].name+'</span>'+
      '<span class="p-tag-score">'+p[0].score+'pts</span></div>'+
      '<div style="display:flex;align-items:center;gap:5px">'+
        (G.gameMode==='classic'?'<span style="font-size:12px">'+'❤️'.repeat(p[0].lives)+'🖤'.repeat(MAX_LIVES-p[0].lives)+'</span>':'')+
        (G.gameMode==='survie'&&G.shields>0?'<span style="font-size:12px">'+'🛡️'.repeat(G.shields)+'</span>':'')+
        '<button onclick="toggleMusic()" style="background:none;border:none;cursor:pointer;font-size:13px;color:var(--text2)">'+(musicOn?'🔊':'🔇')+'</button>'+
        '<button class="abandon-btn" onclick="abandon()">✕ Quitter</button>'+
      '</div></div>';
  } else {
    // Multi - afficher tous les joueurs avec statut
    topBar='<div style="display:flex;flex-wrap:wrap;gap:5px;width:100%;justify-content:center">'+
      p.map(function(pl,i){
        var isActive=i===cp;
        var isDead=pl.lives<=0;
        var hearts=isDead?'💀':'❤️'.repeat(pl.lives)+'🖤'.repeat(MAX_LIVES-pl.lives);
        return '<div style="display:flex;align-items:center;gap:4px;background:'+(isActive?pl.color+'22':'var(--card)')+
          ';border:1.5px solid '+(isActive?pl.color:isDead?'#333':'var(--border)')+
          ';border-radius:14px;padding:4px 8px;opacity:'+(isDead?'0.35':'1')+'">'+
          '<span style="font-size:15px">'+pl.avatar+'</span>'+
          '<div>'+
            '<div style="font-size:11px;font-weight:800;color:'+(isActive?pl.color:'var(--text)')+';max-width:55px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+pl.name+'</div>'+
            '<div style="font-size:9px;color:var(--text2)">'+hearts+'</div>'+
          '</div>'+
          '<span style="font-family:Fredoka One,cursive;font-size:13px;color:'+pl.color+'">'+pl.score+'</span>'+
        '</div>';
      }).join('')+
    '</div>'+
    '<div style="font-size:12px;font-weight:800;color:var(--purple);text-align:center;margin-top:4px">'+
      p[cp].avatar+' Tour de '+p[cp].name+' !'+
    '</div>'+
    '<div style="display:flex;justify-content:flex-end;width:100%;gap:6px">'+
      '<button onclick="toggleMusic()" style="background:none;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:12px;color:var(--text2);padding:3px 8px">'+(musicOn?'🔊':'🔇')+'</button>'+
      '<button class="abandon-btn" onclick="abandon()">✕</button>'+
    '</div>';
  }

  var progBar='';
  if(G.gameMode==='chrono'){
    var pct=Math.round(G.timeLeft/G.maxTime*100);
    var flames=G.combo>=10?'🔥🔥🔥🔥🔥':G.combo>=5?'🔥🔥🔥🔥':G.combo>=3?'🔥🔥🔥':G.combo>=2?'🔥🔥':G.combo>=1?'🔥':'';
    progBar='<div class="chrono-wrap"><div class="chrono-top"><span id="ct" class="chrono-time'+(G.timeLeft<=10?' danger':'')+'">'+Math.ceil(G.timeLeft)+'s</span>'+(flames?'<span class="combo-tag">'+flames+' x'+G.combo+'</span>':'')+'<span style="font-size:11px;font-weight:800;color:var(--text2)">❌'+G.errors+'(-'+G.errors*ERR_PENALTY+'s)</span></div><div class="chrono-track"><div id="cf" class="chrono-fill" style="width:'+pct+'%"></div></div></div>';
  } else if(G.gameMode==='survie'){
    progBar='<div class="prog-wrap"><div class="prog-meta"><span>💀 Survie</span><span>🔥 '+G.streak+' pays</span></div></div>';
  } else {
    var pct2=Math.round(G.current/TOTAL*100);
    progBar='<div class="prog-wrap"><div class="prog-meta"><span>Q'+(G.current+1)+'/'+TOTAL+'</span><span>'+pct2+'%</span></div><div class="prog-track"><div class="prog-fill" style="width:'+pct2+'%"></div></div></div>';
  }

  app.innerHTML=topBar+progBar+
    '<div class="flag-card">'+
      (G.gameMode==='survie'?'<div style="font-family:Fredoka One,cursive;font-size:15px;color:var(--yellow)">🔥 Série de '+G.streak+' !</div>':'')+
      '<div style="display:flex;align-items:center;justify-content:center;min-height:20px;margin-bottom:2px">'+
        '<div id="combo-streak" class="combo-streak" style="display:none"></div>'+
      '</div>'+
      '<div class="flag-row">'+
      '<div class="flag-circle"><div class="flag-glow"></div><span style="font-size:74px;z-index:1;position:relative">'+q.flag+'</span></div>'+
      '<div id="terry-slot" class="terry-slot"></div>'+
      '</div>'+
      '<div class="q-text">Quel pays est ce drapeau ?</div>'+
      '<div class="options'+(q.choices.length===6?' options-six':'')+'" id="opts">'+q.choices.map(function(c){return '<button class="opt-btn" onclick="choose(this,\''+c.replace(/'/g,"\\'")+'\')">'+c+'</button>';}).join('')+'</div>'+
      (G.gameMode==='survie'&&G.shields>0?'<button class="shield-btn" onclick="useShield()">🛡️ Bouclier ('+G.shields+') — -20% score</button>':'')+
      '<div class="fb-box" id="fb"></div>'+
    '</div>'+
    '<div style="font-size:10px;font-weight:700;color:var(--text2);opacity:.5;text-align:center">'+G.nowPlaying+'</div>';
  G.questionStartTime=Date.now();
  updateTerryCombo(G.speedCombo);
}

function useShield(){
  if(G.shields<=0)return;
  sfx('shield');G.shields--;G.shieldsUsed++;G.current++;
  if(G.current>=G.surviePool.length){var _p=getPool();G.surviePool=shuffle(_p).map(function(q){return buildQ(q,_p);});G.current=0;}
  G.answered=false;render();
}

function choose(btn,val){
  if(G.answered)return;
  G.answered=true;
  try{if(document.activeElement)document.activeElement.blur();}catch(e){}
  document.querySelectorAll('.opt-btn').forEach(function(b){try{b.blur();}catch(e){}});
  var elapsed=G.questionStartTime?Date.now()-G.questionStartTime:9999;
  var q=G.gameMode==='survie'?G.surviePool[G.current%G.surviePool.length]:G.questions[G.current];
  var correct=val===q.name,cp=G.cp;
  document.querySelectorAll('.opt-btn').forEach(function(b){
    b.disabled=true;
    if(b.textContent.trim()===q.name)b.classList.add('correct');
    else if(b===btn&&!correct)b.classList.add('wrong');
  });
  var fb=document.getElementById('fb');

  if(correct&&elapsed<2500){G.speedCombo++;}else{G.speedCombo=0;}
  updateTerryCombo(G.speedCombo);

  if(correct){
    var _prevFound=loadStats().foundFlags||[];
    var _isNewFlag=_prevFound.indexOf(q.name)===-1;
    G.players[cp].score++;G.combo++;
    if(G.gameMode==='chrono'){
      var base=2,comboBonus=COMBO_BONUS[G.combo]||0,totalBonus=base+comboBonus;
      G.timeLeft=Math.min(G.timeLeft+totalBonus,G.maxTime);
      floatChronoBonus('+'+totalBonus+'s',comboBonus>0?'#ffd700':'#00ff88');
      if(comboBonus>0){
        fb.textContent='✓ +'+totalBonus+'s ! COMBO x'+G.combo+' 🔥';
        sfx('combo');
        floatScore(btn,'+1 🔥','#ffd700');
      } else {
        fb.textContent='✓ +'+base+'s !';sfx('correct');
        floatScore(btn,'+1','#00f2ff');
      }
      showTerry(terry_stars,'');
    } else if(G.gameMode==='survie'){
      G.streak++;updateSurvieStreak(G.streak);
      if(G.streak%25===0&&G.shields<3){
        G.shields++;
        fb.textContent='✓ 🛡️ Bouclier gagné ! Série de '+G.streak+' !';
        sfx('shield');
        floatScore(btn,'+🛡️','#a29bfe');
        showTerry(terry_victoire,'');
      } else {
        fb.textContent='✓ '+G.streak+' pays trouvés !';
        sfx('correct');
        floatScore(btn,'+1','#00f2ff');
        showTerry(terry_stars,'');
      }
    } else {
      fb.textContent='✓ Bravo !';sfx('correct');
      floatScore(btn,'+1','#00f2ff');
      showTerry(terry_stars,'');
    }
    if(_isNewFlag){
      setTimeout(function(){floatScore(btn,'🌟 NOUVEAU !','#ffd700');hapticSuccess();},180);
    }
    fb.className='fb-box c';
    getFunFact(q.name, q.flag);

  } else {
    G.combo=0;
    G.fatalFlag={flag:q.flag,name:q.name};
    hapticError();
    if(G.gameMode==='survie'){
      fb.textContent='✗ '+q.name+' — 💀 GAME OVER !';
      fb.className='fb-box w';
      sfx('gameover');
      // terry_gameover = Image 1 GIF = tombe en arrière → game over survie
      showTerry(terry_gameover,'terry-gameover-anim');
      stopMusic();
      setTimeout(function(){endGame(false);},2000);
      return;
    }
    if(G.gameMode==='chrono'){
      G.errors++;G.timeLeft=Math.max(0,G.timeLeft-ERR_PENALTY);
      flashChronoError();
      fb.textContent='✗ '+q.name+' — -'+ERR_PENALTY+'s !';
    } else {
      G.players[cp].lives=Math.max(0,G.players[cp].lives-1);
      if(G.players.length>1&&G.players[cp].lives===0){
        fb.textContent='✗ '+q.name+' — 💀 '+G.players[cp].name+' éliminé !';
      } else {
        fb.textContent='✗ C\'était '+q.name;
      }
    }
    fb.className='fb-box w';sfx('wrong');
    // terry_triste = Image 3 GIF = triste déçu → mauvaise réponse
    showTerry(terry_triste,'');
  }

  setTimeout(function(){
    G.current++;G.answered=false;
    if(G.gameMode==='chrono'){
      if(G.current>=TOTAL||G.timeLeft<=0){clearInterval(G.timerID);G.timerID=null;endGame(G.players[cp].score===TOTAL);return;}
    } else if(G.gameMode==='classic'){
      if(G.players.length===1){
        // Solo
        var alive1=G.players.filter(function(p){return p.lives>0;});
        if(G.current>=TOTAL||alive1.length===0){endGame(G.players[cp].score===TOTAL);return;}
      } else {
        // Multi - vérifier combien de joueurs encore en vie
        var alive=G.players.filter(function(p){return p.lives>0;});
        if(alive.length<=1){
          // 1 survivant ou moins = fin de partie
          endGame(true);return;
        }
        if(G.current>=TOTAL){
          // Fin des questions
          endGame(true);return;
        }
        // Passer au joueur suivant vivant
        var next=(cp+1)%G.players.length;
        var tries=0;
        while(G.players[next].lives===0&&tries<G.players.length){
          next=(next+1)%G.players.length;
          tries++;
        }
        G.cp=next;
      }
    } else {
      if(G.current>=G.surviePool.length){var _p2=getPool();G.surviePool=shuffle(_p2).map(function(q){return buildQ(q,_p2);});G.current=0;}
    }
    render();
  }, claudeApiKey && G.gameMode !== 'chrono' ? 3000 : 1500);
}

function renderEnd(app){
  var won=G.lastWon;
  var isSolo=G.players.length===1;

  // ── ÉCRAN GAME OVER PREMIUM (solo défaite) ──
  if(!won&&isSolo){
    var cp=G.cp;
    var p=G.players[cp]||{name:'Joueur',score:0};
    var stats=loadStats();
    var lvl=getLevel(stats.xp);
    var nxt=getNextLevel(stats.xp);
    var xpPct=nxt?Math.round(((stats.xp-lvl.xp)/(nxt.xp-lvl.xp))*100):100;
    var sc=G.gameMode==='survie'?Math.round(p.score*(1-G.shieldsUsed*0.2)):
           G.gameMode==='chrono'?p.score:p.score;
    var scoreLabel=G.gameMode==='survie'?'pts':G.gameMode==='chrono'?'/'+TOTAL:'/'+TOTAL;
    var ff=G.fatalFlag;
    var nf=G.newFlagsThisSession||0;
    var lc=lvl.color||'#00f2ff';
    var lr=parseInt(lc.slice(1,3),16),lg=parseInt(lc.slice(3,5),16),lb=parseInt(lc.slice(5,7),16);

    var _isTimedOut=G.gameMode==='chrono'&&G.timedOut;
    var _endTitle=_isTimedOut?'TEMPS ÉCOULÉ !':'GAME OVER';
    var _endColor=_isTimedOut?'#ff9f43':'#ff4757';
    var _endGlow=_isTimedOut?'rgba(255,159,67,0.5)':'rgba(255,71,87,0.5)';

    app.innerHTML=
      '<div style="position:fixed;inset:0;z-index:50;background:#0b0c10;display:flex;flex-direction:column;align-items:center;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:env(safe-area-inset-top,0px) 16px env(safe-area-inset-bottom,0px)">'+
        // Terry décomposition
        '<div style="margin-top:16px;margin-bottom:6px">'+
          '<canvas id="terry-end-canvas" style="display:block;margin:0 auto;border-radius:18px;box-shadow:0 4px 24px rgba(0,0,0,0.5)"></canvas>'+
        '</div>'+
        // Titre
        '<div style="font-family:Fredoka One,cursive;font-size:'+(sc===0&&_isTimedOut?'24':'30')+'px;color:'+_endColor+';letter-spacing:2px;animation:debriefPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275);text-shadow:0 0 20px '+_endGlow+'">'+_endTitle+'</div>'+
        // Score
        '<div id="debrief-score" style="font-family:Fredoka One,cursive;font-size:62px;line-height:1;color:'+lc+';text-shadow:0 0 24px rgba('+lr+','+lg+','+lb+',0.7),0 0 48px rgba('+lr+','+lg+','+lb+',0.3);margin:4px 0;animation:debriefScore 0.6s 0.15s cubic-bezier(0.175,0.885,0.32,1.275) both">0</div>'+
        '<div style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:800;letter-spacing:1px;margin-bottom:2px;animation:debriefFade 0.4s 0.3s both">'+scoreLabel.replace('/','/ ')+'</div>'+
        // Rang
        '<div style="font-size:15px;font-weight:900;color:'+lc+';margin-bottom:16px;letter-spacing:1px;animation:debriefFade 0.4s 0.35s both;text-shadow:0 0 10px rgba('+lr+','+lg+','+lb+',0.4)">'+lvl.title+'</div>'+
        // XP
        (G.lastXpGain>0?
          '<div style="display:flex;align-items:center;gap:8px;background:rgba(255,215,0,0.07);border:1px solid rgba(255,215,0,0.2);border-radius:20px;padding:6px 16px;margin-bottom:12px;animation:debriefFade 0.4s 0.4s both">'+
            '<span style="font-size:14px">⭐</span>'+
            '<span style="font-family:Fredoka One,cursive;font-size:15px;color:#ffd700">+'+G.lastXpGain+' XP</span>'+
            (G.lastLevelUp?'<span style="font-size:12px;font-weight:900;color:#00ff88">→ '+G.lastLevelUp.title+'</span>':'')+'</div>':'')+
        // Barre XP
        '<div style="width:88%;max-width:300px;background:rgba(255,255,255,0.06);border-radius:20px;height:5px;overflow:hidden;margin-bottom:16px;animation:debriefFade 0.4s 0.45s both">'+
          '<div id="xp-bar-fill" style="height:100%;border-radius:20px;background:linear-gradient(90deg,'+lc+',#00ff88);width:0%;transition:width 1.2s ease 0.5s"></div>'+
        '</div>'+
        // Drapeau fatal
        (ff?
          '<div style="animation:debriefFade 0.5s 0.5s both;width:100%;max-width:320px;background:rgba(255,71,87,0.06);border:1px solid rgba(255,71,87,0.22);border-radius:18px;padding:14px 16px;margin-bottom:12px;display:flex;align-items:center;gap:14px">'+
            '<span style="font-size:52px;flex-shrink:0;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))">'+ff.flag+'</span>'+
            '<div>'+
              '<div style="font-size:10px;color:rgba(255,107,107,0.7);font-weight:900;letter-spacing:1.5px;margin-bottom:3px">OUPS ! C\'ÉTAIT</div>'+
              '<div style="font-size:18px;font-weight:900;color:#fff;line-height:1.2">'+ff.name+'</div>'+
            '</div>'+
          '</div>':'')+
        // Nouveaux pays passeport
        (nf>0?
          '<div style="animation:debriefFade 0.5s 0.6s both;width:100%;max-width:320px;background:rgba(0,242,255,0.05);border:1px solid rgba(0,242,255,0.18);border-radius:18px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:12px">'+
            '<span style="font-size:26px">📖</span>'+
            '<div>'+
              '<div style="font-size:14px;font-weight:900;color:#00f2ff">+'+nf+' nouveau'+(nf>1?'x':'')+' pays exploré'+(nf>1?'s':'')+'</div>'+
              '<div style="font-size:10px;color:rgba(255,255,255,0.35);font-weight:700;margin-top:1px">Ajouté à ton Passeport !</div>'+
            '</div>'+
          '</div>':'<div style="height:16px"></div>')+
        // Boutons
        '<div style="display:flex;gap:10px;width:100%;max-width:320px;margin-bottom:20px;animation:debriefFade 0.4s 0.7s both">'+
          '<button onclick="G.screen=\'setup\';render()" style="flex:1;padding:14px 8px;border-radius:16px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55);font-family:Nunito,sans-serif;font-size:14px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent">🏠 Menu</button>'+
          '<button onclick="startGame()" style="flex:2;padding:14px 8px;border-radius:16px;border:none;background:linear-gradient(135deg,#ff6b6b,#ff4757);color:#fff;font-family:Fredoka One,cursive;font-size:19px;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:0 4px 24px rgba(255,71,87,0.45)">⚔️ REVANCHE</button>'+
        '</div>'+
      '</div>';

    // Anime le compteur de score
    setTimeout(function(){
      var el=document.getElementById('debrief-score');
      if(el){var t=sc,s=0,start=null;(function step(ts){if(!start)start=ts;var p=Math.min((ts-start)/700,1);el.textContent=Math.round(p*t);if(p<1)requestAnimationFrame(step);else el.textContent=t;})(performance.now());}
      var bar=document.getElementById('xp-bar-fill');
      if(bar)bar.style.width=xpPct+'%';
    },200);

    return;
  }

  // ── ÉCRAN VICTOIRE / MULTI (existant) ──
  var alive=G.players.filter(function(p){return p.lives>0;});
  var sorted=G.players.slice().sort(function(a,b){
    if(a.lives>0&&b.lives<=0)return -1;
    if(a.lives<=0&&b.lives>0)return 1;
    return b.score-a.score;
  });
  var w=sorted[0];
  var medals=['🥇','🥈','🥉','🏅'],won2=G.lastWon;
  var cols=['#FFD93D','#FF6B6B','#6BCB77','#4D96FF','#C77DFF'];
  var confetti='';
  for(var i=0;i<18;i++){confetti+='<div style="position:absolute;left:'+Math.random()*100+'%;width:8px;height:8px;border-radius:2px;background:'+cols[i%cols.length]+';animation:confettiFall '+(1.5+Math.random()*1.5)+'s '+(Math.random()*1.5)+'s linear forwards"></div>';}

  var content='<div class="end-card win">'+
    '<div style="position:relative;overflow:hidden;width:100%;min-height:10px">'+confetti+'</div>'+
    '<img src="'+terry_victoire+'" width="130" height="130" style="object-fit:contain;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.5));animation:reactionPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)"/>'+
    '<div class="win-name">'+w.avatar+' '+w.name+'</div>';

  if(G.gameMode==='chrono'){
    var elapsed=G.maxTime-G.timeLeft,pen=G.errors*ERR_PENALTY,ft=(elapsed+pen).toFixed(1);
    content+='<div style="font-size:36px">'+(w.score===TOTAL?'⚡':w.score>=7?'🏆':'👍')+'</div>'+
      '<div class="end-score win-score">'+ft+'s</div>'+
      '<div class="stat-row">'+
        '<div class="stat-pill"><div class="stat-val">'+w.score+'/'+TOTAL+'</div><div class="stat-lbl">Bons</div></div>'+
        '<div class="stat-pill"><div class="stat-val">'+G.errors+'</div><div class="stat-lbl">Erreurs</div></div>'+
        '<div class="stat-pill"><div class="stat-val">+'+pen+'s</div><div class="stat-lbl">Pénalité</div></div>'+
      '</div>';
  } else if(G.gameMode==='survie'){
    var sv=w.score,fsv=Math.round(sv*(1-G.shieldsUsed*0.2));
    content+='<div style="font-size:36px">'+(sv>=100?'🌍':sv>=50?'🏆':sv>=20?'🥇':'💀')+'</div>'+
      '<div class="end-score win-score">'+fsv+' pts</div>'+
      '<div class="stat-row">'+
        '<div class="stat-pill"><div class="stat-val">'+sv+'</div><div class="stat-lbl">Pays</div></div>'+
        '<div class="stat-pill"><div class="stat-val">'+G.shieldsUsed+'</div><div class="stat-lbl">Boucliers</div></div>'+
        '<div class="stat-pill"><div class="stat-val">'+G.shields+'</div><div class="stat-lbl">Non usés</div></div>'+
      '</div>';
  } else {
    var sc2=w.score,msg=sc2===TOTAL?'Parfait ! 🤩':sc2>=8?'Excellent ! 🌟':sc2>=6?'Très bien ! 👏':sc2>=4?'Pas mal ! 👍':'Entraîne-toi ! 📚';
    content+='<div class="end-score win-score">'+sc2+'/'+TOTAL+'</div>'+
      '<div style="font-size:14px;color:var(--text2);font-weight:700">'+msg+'</div>';
    if(sorted.length>1){
      content+='<div style="width:100%">'+sorted.map(function(pl,i){
        var isDead=pl.lives<=0;
        return '<div class="sb-row" style="opacity:'+(isDead?'0.45':'1')+'">'+
          '<span style="font-family:Fredoka One,cursive;font-size:18px;width:28px;text-align:center">'+(isDead?'💀':medals[i]||'🏅')+'</span>'+
          '<span style="font-size:17px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid '+(isDead?'#444':pl.color)+'">'+pl.avatar+'</span>'+
          '<span style="flex:1;font-size:14px;font-weight:800;color:'+(isDead?'var(--text2)':'var(--text)')+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+pl.name+(isDead?' 💀':'')+'</span>'+
          '<span style="font-family:Fredoka One,cursive;font-size:18px;color:'+(isDead?'#555':pl.color)+'">'+pl.score+'</span>'+
        '</div>';
      }).join('')+'</div>';
    }
  }
  if(G.lastXpGain>0){
    content+='<div style="background:var(--card2);border-radius:12px;padding:8px 16px;display:flex;align-items:center;gap:8px">'+
      '<span style="font-size:16px">⭐</span>'+
      '<span style="font-family:Fredoka One,cursive;font-size:16px;color:var(--yellow)">+'+G.lastXpGain+' XP</span>'+
      (G.lastLevelUp?'<span style="font-size:13px;font-weight:800;color:var(--green)">→ '+G.lastLevelUp.title+'</span>':'')+'</div>';
  }
  var stats2=loadStats();
  var lvl2=getLevel(stats2.xp);
  var nxt2=getNextLevel(stats2.xp);
  var pct2=nxt2?Math.round(((stats2.xp-lvl2.xp)/(nxt2.xp-lvl2.xp))*100):100;
  content+='<div style="width:100%;background:var(--card2);border-radius:20px;height:6px;overflow:hidden">'+
    '<div style="height:100%;border-radius:20px;background:linear-gradient(90deg,var(--accent),var(--purple));width:'+pct2+'%;transition:width 1s ease"></div>'+
  '</div>';
  content+='<div style="font-size:10px;font-weight:700;color:var(--text2);opacity:.6">'+G.nowPlaying+'</div></div>';
  content+='<div class="act-row"><button class="act-btn" onclick="goHome()">🏠 Accueil</button><button class="act-btn primary" onclick="startGame()">🚀 Rejouer</button></div>';
  app.innerHTML=content;
}

// ══════════ TERRY END CANVAS ══════════
var _terryEndCleanup = null;

function initTerryEndCanvas(won) {
  if (_terryEndCleanup) { _terryEndCleanup(); _terryEndCleanup = null; }
  var canvas = document.getElementById('terry-end-canvas');
  if (!canvas || typeof terryFrames === 'undefined' || !terryFrames.length) return;

  var ctx = canvas.getContext('2d');
  var imgs = new Array(terryFrames.length);
  var currentFrame = -1;
  var rafId = null;
  var frame = 0, lastTs = 0;
  var FPS = 14, INTERVAL = 1000 / FPS;
  var forward = !won; // defeat = decompose (forward), victory = skip animation
  var done = false;

  function setCanvasSize(img) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.parentElement ? Math.min(canvas.parentElement.offsetWidth, 260) : 220;
    var h = Math.round(w * img.naturalHeight / img.naturalWidth);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  function drawFrame(n) {
    if (!imgs[n] || !imgs[n].complete) return;
    if (n === currentFrame) return;
    currentFrame = n;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgs[n], 0, 0, canvas.width, canvas.height);
  }

  var img0 = new Image();
  img0.onload = function() {
    setCanvasSize(img0);
    imgs[0] = img0;
    drawFrame(0);
    for (var i = 1; i < terryFrames.length; i++) {
      (function(idx) {
        var img = new Image();
        img.onload = function() { imgs[idx] = img; };
        img.src = terryFrames[idx];
      })(i);
    }
    if (forward) rafId = requestAnimationFrame(animate);
    else { frame = terryFrames.length - 1; /* show end frame for won, or just frame 0 */ }
  };
  img0.src = terryFrames[0];

  function animate(ts) {
    if (done || !canvas.parentElement) { done = true; return; }
    if (ts - lastTs >= INTERVAL) {
      lastTs = ts;
      if (imgs[frame] && imgs[frame].complete) drawFrame(frame);
      frame++;
      if (frame >= terryFrames.length) { done = true; return; }
    }
    rafId = requestAnimationFrame(animate);
  }

  function cleanup() {
    if (rafId) cancelAnimationFrame(rafId);
    done = true;
  }
  _terryEndCleanup = cleanup;
}


setTimeout(function(){
  try{
    initGeoLocation();
    var _mStarted=false;
    var _fab=document.getElementById('music-fab');
    if(_fab)_fab.classList.add('waiting');
    function _onFirstGesture(){
      if(_mStarted)return;
      _mStarted=true;
      document.removeEventListener('click',_onFirstGesture,true);
      document.removeEventListener('touchstart',_onFirstGesture,true);
      var f=document.getElementById('music-fab');if(f)f.classList.remove('waiting');
      var fi=document.getElementById('music-fab-inline');if(fi)fi.classList.remove('waiting');
      if(musicOn)startMusic('accueil');
    }
    document.addEventListener('click',_onFirstGesture,true);
    document.addEventListener('touchstart',_onFirstGesture,true);
    if(_fbReady){
      G.screen='loading';render();
      _auth.onAuthStateChanged(function(user){
        if(user){
          G.loggedUser=user;
          _fbLoadStats(user.uid,function(remote){
            var local=loadStats();
            if(remote)saveStats(_mergeStats(local,remote));
            if(remote&&remote.username){G.username=remote.username;G.screen='setup';}
            else{G.screen='setUsername';}
            render();
          });
        }else{
          G.screen=G.guestMode?'setup':'auth';
          render();
        }
      });
    }else{
      render();
    }
  }
  catch(e){document.getElementById('app').innerHTML='<div style="color:red;padding:1rem">'+e.message+'</div>';}
},50);

