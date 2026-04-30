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

function _hapticsPlugin(){
  try{
    return window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Haptics;
  }catch(e){return null;}
}
function hapticImpact(style){
  try{
    var H=_hapticsPlugin();
    if(H&&H.impact){H.impact({style:style||'LIGHT'});return;}
    if(navigator.vibrate){navigator.vibrate(style==='HEAVY'?[45,30,45]:style==='MEDIUM'?35:15);}
  }catch(e){}
}
function hapticNotify(type){
  try{
    var H=_hapticsPlugin();
    if(H&&H.notification){H.notification({type:type||'SUCCESS'});return;}
    if(navigator.vibrate){navigator.vibrate(type==='ERROR'?[80,40,80]:type==='WARNING'?[45,40,45]:35);}
  }catch(e){}
}
function hapticClick(){hapticImpact('LIGHT');}
function hapticError(){hapticNotify('ERROR');}
function hapticSuccess(){
  hapticNotify('SUCCESS');
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
  fetch('https://ipapi.co/json/')
    .then(function(r){return r.json();})
    .then(function(d){if(d.country_code)_saveGeo(d.country_code);})
    .catch(function(){});
}
function resetGeoLocation(){
  localStorage.removeItem('flagmaster_homecountry');
  initGeoLocation();
}

// ══════════ FIREBASE ══════════
var _fbConfig={apiKey:"AIzaSyCR_UMiPC4FHg84hTr9mIPrSDE66qjy1Q0",authDomain:"flagmaster-162b0.firebaseapp.com",projectId:"flagmaster-162b0",storageBucket:"flagmaster-162b0.firebasestorage.app",messagingSenderId:"1088789064062",appId:"1:1088789064062:web:cc3741e2a5786520e46b2f"};
var _auth=null,_db=null,_fbReady=false;
function _tryInitFirebase(){
  try{
    if(_fbReady)return true;
    if(typeof firebase==='undefined'||!firebase.auth||!firebase.firestore)return false;
    if(!_fbConfig.apiKey||_fbConfig.apiKey==='FIREBASE_API_KEY')return false;
    if(!firebase.apps||!firebase.apps.length)firebase.initializeApp(_fbConfig);
    _auth=firebase.auth();
    _db=firebase.firestore();
    _fbReady=true;
    return true;
  }catch(e){return false;}
}
_tryInitFirebase();
window.addEventListener('load',function(){_tryInitFirebase();});

function _fbSaveStats(uid,stats){if(!_fbReady||!uid)return;try{_db.collection('users').doc(uid).set({stats:stats,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}).catch(function(){});}catch(e){}}
function _fbLoadStats(uid,cb){if(!_fbReady||!uid){cb(null);return;}try{_db.collection('users').doc(uid).get().then(function(doc){cb(doc.exists?doc.data():null);}).catch(function(){cb(null);});}catch(e){cb(null);}}
function _fbWalletSnapshot(){
  return {
    coins:loadCoins(),
    shopUnlocked:loadShopUnlocked(),
    activeBg:loadActiveBg(),
    terrySkin:loadTerrySkin(),
    skinUnlocked:loadSkinUnlocked(),
    galleryUnlocked:loadGalleryUnlocked(),
    capitalsUnlocked:loadCapitalsUnlocked(),
    silhouettesUnlocked:loadSilhouettesUnlocked(),
    inventory:{p5050:loadInv('p5050'),sablier:loadInv('sablier')}
  };
}
function _fbSaveWallet(){
  if(!_fbReady||typeof G==='undefined'||!G.loggedUser||G.guestMode)return;
  try{_db.collection('users').doc(G.loggedUser.uid).set({wallet:_fbWalletSnapshot(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}).catch(function(){});}catch(e){}
}
function _fbApplyWallet(remote){
  var w=(remote&&remote.wallet)||{};
  if(!w)return;
  if(remote){
    if(typeof w.coins!=='number'&&typeof remote.coins==='number')w.coins=remote.coins;
    if(!w.galleryUnlocked&&remote.galleryUnlocked)w.galleryUnlocked=true;
    if(!w.capitalsUnlocked&&remote.capitalsUnlocked)w.capitalsUnlocked=true;
    if(!w.silhouettesUnlocked&&remote.silhouettesUnlocked)w.silhouettesUnlocked=true;
  }
  try{if(typeof w.coins==='number')localStorage.setItem('flagmaster_coins',String(Math.max(0,w.coins|0)));}catch(e){}
  try{if(Array.isArray(w.shopUnlocked))localStorage.setItem('flagmaster_shop_unlocked',JSON.stringify(w.shopUnlocked));}catch(e){}
  try{if(w.activeBg)localStorage.setItem('flagmaster_active_bg',w.activeBg);}catch(e){}
  try{if(w.terrySkin)localStorage.setItem('flagmaster_terry_skin',w.terrySkin);}catch(e){}
  try{if(Array.isArray(w.skinUnlocked))localStorage.setItem('flagmaster_skin_unlocked',JSON.stringify(w.skinUnlocked));}catch(e){}
  try{if(w.galleryUnlocked)localStorage.setItem('flagmaster_gallery_unlocked','1');}catch(e){}
  try{if(w.capitalsUnlocked)localStorage.setItem('flagmaster_capitals_unlocked','1');}catch(e){}
  try{if(w.silhouettesUnlocked)localStorage.setItem('flagmaster_silhouettes_unlocked','1');}catch(e){}
  try{if(w.inventory){if(typeof w.inventory.p5050==='number')localStorage.setItem('flagmaster_inv_p5050',String(Math.max(0,w.inventory.p5050|0)));if(typeof w.inventory.sablier==='number')localStorage.setItem('flagmaster_inv_sablier',String(Math.max(0,w.inventory.sablier|0)));}}catch(e){}
}
function _grantAdminTestWallet(){
  if(!isAdmin)return;
  try{
    if(loadCoins()<50000)saveCoins(50000);
  }catch(e){}
}
function _fbLoadAdmin(uid,cb){
  if(!_fbReady||!uid){cb(false);return;}
  try{
    _db.collection('admins').doc(uid).get()
      .then(function(doc){var d=doc.exists?doc.data():null;cb(!!(doc.exists&&(!d||d.active!==false)));})
      .catch(function(){cb(false);});
  }catch(e){cb(false);}
}
function _usernameKey(v){return String(v||'').trim().toLowerCase();}
function _fbReserveUsername(uid,username){
  var key=_usernameKey(username);
  var userRef=_db.collection('users').doc(uid);
  var nameRef=_db.collection('usernames').doc(key);
  var ts=firebase.firestore.FieldValue.serverTimestamp();
  return _db.runTransaction(function(tx){
    return tx.get(nameRef).then(function(nameDoc){
      if(nameDoc.exists&&nameDoc.data().uid!==uid){
        var err=new Error('Ce pseudo est déjà utilisé par un autre explorateur.');
        err.code='flagmaster/username-taken';
        throw err;
      }
      return tx.get(userRef).then(function(userDoc){
        var previous=userDoc.exists?_usernameKey((userDoc.data()||{}).usernameNormalized||(userDoc.data()||{}).username):'';
        var previousRef=previous&&previous!==key?_db.collection('usernames').doc(previous):null;
        return (previousRef?tx.get(previousRef):Promise.resolve(null)).then(function(previousDoc){
          tx.set(userRef,{username:username,usernameNormalized:key,lastUsernameChange:ts},{merge:true});
          tx.set(nameRef,{uid:uid,username:username,normalized:key,updatedAt:ts},{merge:true});
          if(previousDoc&&previousDoc.exists&&previousDoc.data().uid===uid)tx.delete(previousRef);
        });
      });
    });
  });
}
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

function authSignIn(){if(!_tryInitFirebase()){_setAuthError('Connexion indisponible. Tu peux jouer en invité.');return;}var e=(document.getElementById('auth-email')||{}).value||'',p=(document.getElementById('auth-password')||{}).value||'';if(!e.trim()||!p){_setAuthError('Remplis tous les champs.');return;}_setAuthError('⏳');_auth.signInWithEmailAndPassword(e.trim(),p).catch(function(err){_setAuthError(_fbErrMsg(err));});}
function authSignUp(){if(!_tryInitFirebase()){_setAuthError('Connexion indisponible. Tu peux jouer en invité.');return;}var e=(document.getElementById('auth-email')||{}).value||'',p=(document.getElementById('auth-password')||{}).value||'';if(!e.trim()||!p){_setAuthError('Remplis tous les champs.');return;}if(p.length<6){_setAuthError('Mot de passe : 6 caractères min.');return;}_setAuthError('⏳');_auth.createUserWithEmailAndPassword(e.trim(),p).catch(function(err){_setAuthError(_fbErrMsg(err));});}
function authGoogle(){if(!_tryInitFirebase())return;_auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(function(e){_setAuthError(_fbErrMsg(e));});}
function authApple(){if(!_tryInitFirebase())return;_auth.signInWithPopup(new firebase.auth.OAuthProvider('apple.com')).catch(function(e){_setAuthError(_fbErrMsg(e));});}
function authGuest(){G.guestMode=true;G.screen=localStorage.getItem('flagmaster_active_pack')?'setup':'packSelect';render();}
function playNow(){
  G.guestMode=true;
  G.pack=localStorage.getItem('flagmaster_active_pack')||G.pack||'flags';
  G.mode='solo';
  G.gameMode='classic';
  G.diff='easy';
  G.continent='EU';
  G.answerCount=4;
  applyPackTheme(G.pack);
  startGame();
}
function _clearUserData(){
  var keys=['flagmaster_stats','flagmaster_stats_capitals','flagmaster_stats_football','flagmaster_stats_nba','flagmaster_stats_silhouettes',
    'flagmaster_coins','flagmaster_shop_unlocked','flagmaster_active_bg','flagmaster_terry_skin',
    'flagmaster_skin_unlocked','flagmaster_gallery_unlocked','flagmaster_capitals_unlocked',
    'flagmaster_silhouettes_unlocked','flagmaster_active_pack','flagmaster_inv_p5050','flagmaster_inv_sablier','flagmaster_gallery_music'];
  keys.forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});
  G.username=null;isAdmin=false;G.shopModal=null;
}
function authSignOut(){if(_fbReady&&_auth)_auth.signOut().catch(function(){});_clearUserData();G.loggedUser=null;G.guestMode=false;G.screen='auth';render();}
function _setAuthError(msg){var el=document.getElementById('auth-error');if(el)el.textContent=msg;}
function togglePwdVis(){var i=document.getElementById('auth-password'),b=document.getElementById('pwd-eye');if(!i)return;if(i.type==='password'){i.type='text';if(b)b.textContent='🙈';}else{i.type='password';if(b)b.textContent='👁️';}}
function _fbErrMsg(e){var m={'auth/user-not-found':'Compte introuvable.','auth/wrong-password':'Mot de passe incorrect.','auth/email-already-in-use':'Email déjà utilisé.','auth/invalid-email':'Email invalide.','auth/weak-password':'Mot de passe trop faible.','auth/popup-closed-by-user':'Connexion annulée.','auth/invalid-credential':'Email ou mot de passe incorrect.'};return m[e.code]||'Erreur : '+(e.message||e.code);}
function startFirebaseAuthFlow(){
  if(G._authBootStarted)return true;
  if(!_tryInitFirebase())return false;
  G._authBootStarted=true;
  G.screen='loading';render();
  _auth.onAuthStateChanged(function(user){
    if(user){
      G.loggedUser=user;
      isAdmin=false;
      _fbLoadAdmin(user.uid,function(adminOk){
        isAdmin=!!adminOk;
        _fbLoadStats(user.uid,function(remote){
          var local=loadStats();
          if(remote){saveStats(_mergeStats(local,remote));_fbApplyWallet(remote);}
          _grantAdminTestWallet();
          var hasPackChoice=!!localStorage.getItem('flagmaster_active_pack');
          if(remote&&remote.username){G.username=remote.username;G.screen=hasPackChoice?'setup':'packSelect';}
          else{G.screen='setUsername';}
          render();
        });
      });
    }else{
      G.screen=G.guestMode?'setup':'auth';
      render();
    }
  });
  return true;
}

// ══════════ AUDIO ══════════
var AC=null,musicOn=true,_musicEl=null,_musicFadeIv=null,_musicType='accueil',_appAudioBackgrounded=false,_resumeMusicAfterForeground=false;

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
function resumeAC(cb){
  if(_appAudioBackgrounded)return;
  var ac=getAC();
  if(ac.state==='suspended'){ac.resume().then(function(){if(cb)cb();});}
  else{if(cb)cb();}
}
// n() et dr() restent pour les SFX génératifs
function n(ac,freq,type,dur,vol,when,dest){try{var o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=freq;o.connect(g);g.connect(dest);g.gain.setValueAtTime(vol,when);g.gain.exponentialRampToValueAtTime(0.0001,when+dur);o.start(when);o.stop(when+dur+0.02);}catch(e){}}
function dr(ac,dur,vol,when,dest){try{var buf=ac.createBuffer(1,Math.floor(ac.sampleRate*dur),ac.sampleRate);var d=buf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(d.length*0.25));var s=ac.createBufferSource(),g=ac.createGain();s.buffer=buf;g.gain.value=vol;s.connect(g);g.connect(dest);s.start(when);}catch(e){}}

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

function stopMusic(immediate){
  _stopSynth();
  if(_musicFadeIv){clearInterval(_musicFadeIv);_musicFadeIv=null;}
  if(_musicEl){
    var el=_musicEl;_musicEl=null;
    if(immediate){
      try{el.pause();el.removeAttribute('src');if(el.load)el.load();}catch(e0){}
      return;
    }
    try{var v=el.volume;var iv=setInterval(function(){v=Math.max(0,v-0.05);el.volume=v;if(v<=0){el.pause();el.src='';clearInterval(iv);}},30);}catch(e){try{el.pause();}catch(e2){}}
  }
}

function startMusic(type){
  type=type||_musicType||'accueil';
  _musicType=type;
  if(!musicOn||_appAudioBackgrounded)return;
  stopMusic();
  var names={accueil:'🎵 Accueil',classic:'🏆 Classique',chrono:'⏱️ Chrono',survie:'💀 Survie',scorewin:'🎉 Victoire !',scorelose:'😔 Fin de partie'};
  G.nowPlaying=names[type]||'🎵';
  document.querySelectorAll('.now-playing').forEach(function(el){el.textContent=G.nowPlaying;});
  var src=_MUSIC[type];
  if(type==='accueil'){var _gm=loadGalleryMusic();if(_gm==='MJ_STEPS')src='assets/audio/MJ_STEPS.mp3';}
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
  if(type==='click')hapticClick();
  else if(type==='correct')hapticImpact('LIGHT');
  else if(type==='combo'||type==='shield'||type==='trophy_bronze'||type==='trophy_silver')hapticImpact('MEDIUM');
  else if(type==='trophy_gold'||type==='trophy_platinum')hapticNotify('SUCCESS');
  else if(type==='wrong'||type==='gameover')hapticError();
  if(_appAudioBackgrounded)return;
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

function _musicTypeForCurrentScreen(){
  if(G&&G.screen==='game'){
    if(G.gameMode==='classic')return 'classic';
    if(G.gameMode==='chrono')return 'chrono';
    return 'survie';
  }
  if(G&&G.screen!=='setup')return G&&G.lastWon?'scorewin':'scorelose';
  return 'accueil';
}
function setAppAudioBackgrounded(isBackgrounded){
  isBackgrounded=!!isBackgrounded;
  if(isBackgrounded===_appAudioBackgrounded)return;
  _appAudioBackgrounded=isBackgrounded;
  if(isBackgrounded){
    _resumeMusicAfterForeground=!!(musicOn&&(_musicEl||_synthGain));
    stopMusic(true);
    try{if(AC&&AC.state==='running')AC.suspend();}catch(e){}
    return;
  }
  if(_resumeMusicAfterForeground&&musicOn){
    setTimeout(function(){startMusic(_musicType||_musicTypeForCurrentScreen());},180);
  }
  _resumeMusicAfterForeground=false;
  updateMusicFab();
}
function initAppAudioLifecycle(){
  try{
    document.addEventListener('visibilitychange',function(){setAppAudioBackgrounded(document.hidden);});
    window.addEventListener('pagehide',function(){setAppAudioBackgrounded(true);});
    window.addEventListener('pageshow',function(){setAppAudioBackgrounded(document.hidden);});
    var CapApp=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
    if(CapApp&&CapApp.addListener){
      CapApp.addListener('appStateChange',function(state){setAppAudioBackgrounded(!(state&&state.isActive));});
      CapApp.addListener('pause',function(){setAppAudioBackgrounded(true);});
      CapApp.addListener('resume',function(){setAppAudioBackgrounded(false);});
    }
  }catch(e){}
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
    slot.innerHTML='<img src="'+img+'" width="80" height="80" class="active-skin" style="object-fit:contain;'+terrySkinCss('drop-shadow(0 4px 12px rgba(0,0,0,0.45))')+'">';
    terryTimeout=setTimeout(function(){if(slot)slot.innerHTML='';},1000);
  } else {
    var el=document.getElementById('terry-reaction');
    if(!el){el=document.createElement('img');el.id='terry-reaction';el.className='terry-reaction active-skin';document.body.appendChild(el);}
    el.src=img;el.style.display='block';
    el.className='terry-reaction active-skin'+(anim?' '+anim:'');
    el.style.filter=getTerrySkinFilter('drop-shadow(0 10px 20px rgba(0,0,0,0.5))');
    terryTimeout=setTimeout(function(){if(el)el.style.display='none';},1500);
  }
}
function hideTerry(){
  var slot=document.getElementById('terry-slot');
  if(slot)slot.innerHTML='';
  var el=document.getElementById('terry-reaction');
  if(el)el.style.display='none';
}

// ══════════ GLOBE-COINS & SHOP ══════════
var SHOP_ITEMS=[
  {id:'bg_world_1',   name:'Atlas Aventure',        price:0,   rarity:'Starter',    desc:'Monde clair et coloré',         img:'assets/bg/bg-adventure-pop-opt.jpg', gradient:'linear-gradient(135deg,#7dd3fc 0%,#fef3c7 54%,#86efac 100%)'},
  {id:'bg_world_2',   name:'Archipel des Drapeaux', price:180, rarity:'Rare',       desc:'Îles flottantes premium',       img:'assets/bg/bg-flag-archipelago-ai-opt.png',  gradient:'linear-gradient(135deg,#38bdf8 0%,#a7f3d0 52%,#fde68a 100%)'},
  {id:'bg_capitals_1',name:'Cité des Capitales',    price:320, rarity:'Épique',     desc:'Skyline pour le mode capitales',img:'assets/bg/bg-capital-city-ai-opt.png',      gradient:'linear-gradient(135deg,#facc15 0%,#38bdf8 52%,#a78bfa 100%)'},
  {id:'bg_safari',    name:'Safari Afrique',        price:420, rarity:'Rare',       desc:'Savane solaire et camps aventure', img:'assets/bg/bg-safari-afrique-ai-opt.jpg',    gradient:'linear-gradient(135deg,#fde68a 0%,#86efac 54%,#38bdf8 100%)'},
  {id:'bg_aurora',    name:'Aurores Boréales',      price:560, rarity:'Épique',     desc:'Îles polaires et ciel magique',     img:'assets/bg/bg-aurores-boreales-ai-opt.jpg', gradient:'linear-gradient(135deg,#bae6fd 0%,#a7f3d0 48%,#c4b5fd 100%)'},
  {id:'bg_pirate',    name:'Océan Pirate',          price:620, rarity:'Épique',     desc:'Trésors, cartes et îles turquoise', img:'assets/bg/bg-ocean-pirate-ai-opt.jpg',     gradient:'linear-gradient(135deg,#22d3ee 0%,#fef3c7 52%,#34d399 100%)'},
  {id:'bg_sakura',    name:'Temple Sakura',         price:700, rarity:'Épique',     desc:'Ponts rouges, lanternes et montagne', img:'assets/bg/bg-temple-sakura-ai-opt.jpg',  gradient:'linear-gradient(135deg,#fbcfe8 0%,#bae6fd 52%,#fde68a 100%)'},
  {id:'bg_stadium',   name:'Stade Mondial',         price:760, rarity:'Épique',     desc:'Ambiance finale et confettis',      img:'assets/bg/bg-stade-mondial-ai-opt.jpg',    gradient:'linear-gradient(135deg,#86efac 0%,#38bdf8 50%,#facc15 100%)'},
  {id:'bg_candy',     name:'Monde Bonbon',          price:840, rarity:'Légendaire', desc:'Îles pastel et nuages sucrés',      img:'assets/bg/bg-monde-bonbon-ai-opt.jpg',     gradient:'linear-gradient(135deg,#fbcfe8 0%,#a7f3d0 44%,#fde68a 100%)'},
  {id:'bg_space',     name:'Station Spatiale',      price:900, rarity:'Légendaire', desc:'Orbites, planètes et étoiles',      img:'assets/bg/bg-station-spatiale-ai-opt.jpg', gradient:'linear-gradient(135deg,#1d4ed8 0%,#06b6d4 45%,#facc15 100%)'},
];

var TERRY_SKINS=[
  {id:'default', name:'Terry Original', price:0,    rarity:'Starter',    desc:'Look de base',           filter:'',                                                                                                                                            src:terry_buste},
  {id:'zen',     name:'Terry Zen',      price:350,  rarity:'Rare',       desc:'Calme absolu',           filter:'drop-shadow(0 0 16px rgba(34,197,94,0.62))',                                                                  src:'assets/skins/terry_zen_ai_opt.png'},
  {id:'professor',name:'Terry Professeur',price:540,rarity:'Rare',       desc:'Le maître des atlas',     filter:'drop-shadow(0 0 16px rgba(37,99,235,0.45))',                                                                  src:'assets/skins/terry_professor_ai_opt.png'},
  {id:'pirate',  name:'Terry Pirate',    price:620, rarity:'Rare',       desc:'Chasseur de trésors',     filter:'drop-shadow(0 0 16px rgba(245,158,11,0.62))',                                                                 src:'assets/skins/terry_pirate_ai_opt.png'},
  {id:'aura',    name:'Terry Aura',     price:520,  rarity:'Épique',     desc:'Énergie de champion',    filter:'drop-shadow(0 0 20px rgba(250,204,21,0.82)) drop-shadow(0 0 34px rgba(59,130,246,0.42))',                    src:'assets/skins/terry_aura_ai_opt.png'},
  {id:'aviator', name:'Terry Aviateur', price:720,  rarity:'Épique',     desc:'Pilote du ciel',         filter:'drop-shadow(0 0 18px rgba(14,165,233,0.62)) drop-shadow(0 0 24px rgba(245,158,11,0.24))',                    src:'assets/skins/terry_aviator_ai_opt.png'},
  {id:'astronaut',name:'Terry Astronaute',price:740,rarity:'Épique',     desc:'Mission orbite',          filter:'drop-shadow(0 0 18px rgba(14,165,233,0.72)) drop-shadow(0 0 28px rgba(255,255,255,0.36))',                    src:'assets/skins/terry_astronaut_ai_opt.png'},
  {id:'magician',name:'Terry Magicien',  price:760, rarity:'Épique',     desc:'Boussole enchantée',      filter:'drop-shadow(0 0 18px rgba(168,85,247,0.74))',                                                                 src:'assets/skins/terry_magician_ai_opt.png'},
  {id:'gold',    name:'Terry Gold',     price:800,  rarity:'Légendaire', desc:'Collection prestige',    filter:'drop-shadow(0 0 18px rgba(255,215,0,0.82))',                                                                 src:'assets/terry_gold_opt.png'},
  {id:'samurai', name:'Terry Sakura',    price:880, rarity:'Légendaire', desc:'Esprit calme et précis', filter:'drop-shadow(0 0 18px rgba(244,114,182,0.68)) drop-shadow(0 0 26px rgba(245,158,11,0.28))',                    src:'assets/skins/terry_samurai_ai_opt.png'},
  {id:'neon',    name:'Terry Neon',     price:900,  rarity:'Légendaire', desc:'Style arcade brillant',  filter:'drop-shadow(0 0 18px rgba(0,242,255,0.86))',                                                                  src:'assets/terry_neon_opt.png'},
  {id:'fire',    name:'Terry Feu',      price:900,  rarity:'Légendaire', desc:'Mode super énergie',     filter:'drop-shadow(0 0 18px rgba(255,80,0,0.86))',                                                                   src:'assets/terry_fire_opt.png'},
  {id:'thunder', name:'Terry Tonnerre', price:980,  rarity:'Légendaire', desc:'Aura héroïque originale',filter:'drop-shadow(0 0 18px rgba(250,204,21,0.88)) drop-shadow(0 0 32px rgba(245,158,11,0.42))',                    src:'assets/skins/terry_thunder_ai_opt.png'},
  {id:'dragon',  name:'Terry Dragon',   price:1040, rarity:'Légendaire', desc:'Gardien des cartes',     filter:'drop-shadow(0 0 18px rgba(34,197,94,0.82)) drop-shadow(0 0 30px rgba(245,158,11,0.32))',                    src:'assets/skins/terry_dragon_ai_opt.png'},
];
function raritySlug(r){return String(r||'Starter').toLowerCase().replace(/[éèê]/g,'e').replace(/[^a-z0-9]+/g,'-');}
function rarityBadge(r){return '<span class="rarity-badge rarity-'+raritySlug(r)+'">'+(r||'Starter')+'</span>';}
function loadTerrySkin(){try{var id=localStorage.getItem('flagmaster_terry_skin')||'default';var valid=TERRY_SKINS.map(function(s){return s.id;});if(valid.indexOf(id)===-1){localStorage.setItem('flagmaster_terry_skin','default');return'default';}return id;}catch(e){return'default';}}
function saveTerrySkin(id){try{localStorage.setItem('flagmaster_terry_skin',id);_fbSaveWallet();}catch(e){}}
function loadSkinUnlocked(){try{var valid=TERRY_SKINS.map(function(s){return s.id;});var u=JSON.parse(localStorage.getItem('flagmaster_skin_unlocked')||'["default"]').filter(function(id){return valid.indexOf(id)>-1;});if(u.indexOf('default')===-1)u.push('default');return u;}catch(e){return['default'];}}
function saveSkinUnlocked(arr){try{localStorage.setItem('flagmaster_skin_unlocked',JSON.stringify(arr));_fbSaveWallet();}catch(e){}}
function buySkin(id){
  var item=TERRY_SKINS.filter(function(s){return s.id===id;})[0];
  if(!item)return;
  var coins=loadCoins();
  if(coins<item.price){sfx('wrong');return;}
  saveCoins(coins-item.price);
  var u=loadSkinUnlocked();
  if(u.indexOf(id)===-1)u.push(id);
  saveSkinUnlocked(u);
  saveTerrySkin(id);
  sfx('correct');
  showToast('✅ '+item.name+' débloqué !','#e056fd');
  _shopRender();
}

var POWERUPS=[
  {id:'p5050',   name:'50/50',   icon:'✂️', desc:'Élimine 2 mauvaises réponses', price:250},
  {id:'sablier', name:'Sablier', icon:'⏳', desc:'+5 secondes au chrono',        price:150},
];
var IAP_PRODUCTS={
  coins:[
    {id:'coins_small',storeId:'com.akatsuki.flagmaster.coins.small',icon:'🧭',name:'Petit boost',coins:150,label:'0,99 €',badge:''},
    {id:'coins_medium',storeId:'com.akatsuki.flagmaster.coins.medium',icon:'🌍',name:'Tour du monde',coins:500,label:'2,99 €',badge:'POPULAIRE'},
    {id:'coins_large',storeId:'com.akatsuki.flagmaster.coins.large',icon:'🏆',name:'Légende',coins:1200,label:'5,99 €',badge:'BEST VALUE'}
  ],
  packs:[
    {id:'pack_capitals',storeId:'com.akatsuki.flagmaster.pack.capitals',icon:'🏛️',name:'Carnet des Capitales',sub:'Débloque le mode capitales',label:'1,99 €',pack:'capitals',badge:'PACK'},
    {id:'pack_silhouettes',storeId:'com.akatsuki.flagmaster.pack.silhouettes',icon:'🗺️',name:'Silhouettes du Monde',sub:'Débloque le mode cartes',label:'1,99 €',pack:'silhouettes',badge:'NOUVEAU'},
    {id:'pack_gallery',storeId:'com.akatsuki.flagmaster.pack.gallery',icon:'🎨',name:'Galerie bonus',sub:'Musique et galerie premium',label:'1,99 €',pack:'gallery',badge:'COSMÉTIQUE'}
  ]
};
function isStoreKitAvailable(){try{return !!(window.Capacitor&&window.Capacitor.Plugins&&(window.Capacitor.Plugins.StoreKit||window.Capacitor.Plugins.InAppPurchase));}catch(e){return false;}}
function grantIapProduct(storeId){
  var coin=(IAP_PRODUCTS.coins||[]).filter(function(p){return p.storeId===storeId;})[0];
  if(coin){addCoins(coin.coins);showToast('+'+coin.coins+' Globe-Coins 🪙','#ffd700');_shopRender();return true;}
  var pack=(IAP_PRODUCTS.packs||[]).filter(function(p){return p.storeId===storeId;})[0];
  if(pack&&pack.pack==='capitals'){saveCapitalsUnlocked();showToast('Capitales débloqué ! 🏛️','#f9ca24');_shopRender();return true;}
  if(pack&&pack.pack==='silhouettes'){saveSilhouettesUnlocked();showToast('Silhouettes débloqué ! 🗺️','#38bdf8');_shopRender();return true;}
  if(pack&&pack.pack==='gallery'){saveGalleryUnlocked();showToast('Galerie débloquée ! 🎨','#e056fd');_shopRender();return true;}
  return false;
}
function startIapPurchase(storeId){
  sfx('click');
  if(!isStoreKitAvailable()){
    showToast('Achats App Store bientôt connectés','#f9ca24');
    return;
  }
  showToast('Produit App Store prêt : '+storeId,'#f9ca24');
}
function restorePurchases(){
  sfx('click');
  showToast(isStoreKitAvailable()?'Restauration à brancher StoreKit':'Restauration bientôt disponible','#4facfe');
}
function loadInv(id){try{return parseInt(localStorage.getItem('flagmaster_inv_'+id)||'0',10)||0;}catch(e){return 0;}}
function saveInv(id,n){try{localStorage.setItem('flagmaster_inv_'+id,String(Math.max(0,n|0)));_fbSaveWallet();}catch(e){}}
function buyPowerup(id){
  var item=POWERUPS.filter(function(p){return p.id===id;})[0];
  if(!item)return;
  var coins=loadCoins();
  if(coins<item.price){sfx('wrong');return;}
  saveCoins(coins-item.price);
  saveInv(id,loadInv(id)+1);
  sfx('correct');
  showToast(item.icon+' +1 '+item.name+' !','#4facfe');
  _shopRender();
}
function use5050(){
  if(G.used5050)return;
  var inv=loadInv('p5050');
  if(inv<=0)return;
  saveInv('p5050',inv-1);
  G.used5050=true;
  var q=G.gameMode==='survie'?G.surviePool[G.current%G.surviePool.length]:G.questions[G.current];
  var opts=document.getElementById('opts');
  if(!opts)return;
  var btns=opts.querySelectorAll('.opt-btn');
  var wrongBtns=[];
  for(var i=0;i<btns.length;i++){if(btns[i].textContent.trim()!==q.name&&!btns[i].disabled)wrongBtns.push(btns[i]);}
  wrongBtns.slice(0,2).forEach(function(b){b.style.opacity='0.15';b.style.pointerEvents='none';b.disabled=true;});
  sfx('correct');
}
function useSablier(){
  if(G.gameMode!=='chrono')return;
  var inv=loadInv('sablier');
  if(inv<=0)return;
  saveInv('sablier',inv-1);
  G.timeLeft=Math.min(G.timeLeft+5,G.maxTime);
  sfx('correct');
  var ct=document.getElementById('ct');
  if(ct)ct.textContent=Math.ceil(G.timeLeft)+'s';
}
function triggerBgFade(){
  var el=document.getElementById('bg-fade');
  if(!el)return;
  el.style.animation='none';
  void el.offsetWidth;
  el.style.animation='bgFadeAnim 0.6s ease forwards';
}

function showToast(msg,color){
  var t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(20px);z-index:999999;background:rgba(10,12,20,0.95);border:1px solid '+(color||'rgba(0,242,255,0.4)')+';border-radius:16px;padding:12px 22px;color:'+(color||'#00f2ff')+';font-family:Nunito,sans-serif;font-size:14px;font-weight:800;white-space:nowrap;box-shadow:0 4px 24px rgba(0,0,0,0.5);animation:trophySlideIn 0.35s ease forwards';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){t.style.transition='opacity 0.3s,transform 0.3s';t.style.opacity='0';t.style.transform='translateX(-50%) translateY(-10px)';setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},350);},1400);
}

function _shopRender(){
  var scrollEl=document.querySelector('#app [style*="overflow-y:auto"]');
  var sy=scrollEl?scrollEl.scrollTop:0;
  render();
  requestAnimationFrame(function(){
    var el2=document.querySelector('#app [style*="overflow-y:auto"]');
    if(el2)el2.scrollTop=sy;
  });
}

function equipBg(id){sfx('click');saveActiveBg(id);applyBackground(true);showToast('Fond équipé ✅','#00f2ff');_shopRender();}
function equipSkin(id){sfx('click');saveTerrySkin(id);applyTerrySkinToDOM();showToast('Skin équipé ✅','#e056fd');_shopRender();}

function getTerrySkinDef(){
  return TERRY_SKINS.filter(function(s){return s.id===loadTerrySkin();})[0]||TERRY_SKINS[0];
}
function getTerrySkinSrc(fallback){
  var s=getTerrySkinDef();
  return s.id==='default'?(fallback||terry_buste):(s.src||fallback||terry_buste);
}
function getTerrySkinFilter(base){
  var f=(getTerrySkinDef().filter||'').trim();
  var b=(base||'').trim();
  return (b+(b&&f?' ':'')+f)||'none';
}
function terrySkinCss(base){
  return 'filter:'+getTerrySkinFilter(base)+';';
}
function applyTerrySkinToDOM(){
  var skinDef=getTerrySkinDef();
  var f=getTerrySkinFilter('drop-shadow(0 6px 12px rgba(0,0,0,0.35))');
  var imgs=document.querySelectorAll('img.active-skin, #terry-header, #terry-reaction');
  for(var i=0;i<imgs.length;i++){
    if(imgs[i]){
      if(imgs[i].getAttribute('data-skin-base')){
        imgs[i].src=getTerrySkinSrc(imgs[i].getAttribute('data-skin-base'));
      }
      imgs[i].style.filter=f;
    }
  }
  applySkinTheme(skinDef);
}

function applySkinTheme(skinDef){
  var id=(skinDef&&skinDef.id)||'default';
  var themes={
    default:{accent:'rgba(79,172,254,0.55)',  border:'rgba(79,172,254,0.25)',  glow:'rgba(79,172,254,0.08)'},
    zen:    {accent:'rgba(34,197,94,0.82)',   border:'rgba(34,197,94,0.34)',   glow:'rgba(34,197,94,0.10)'},
    aura:   {accent:'rgba(250,204,21,0.86)',  border:'rgba(250,204,21,0.36)',  glow:'rgba(250,204,21,0.12)'},
    professor:{accent:'rgba(37,99,235,0.78)', border:'rgba(37,99,235,0.34)',  glow:'rgba(37,99,235,0.10)'},
    pirate: {accent:'rgba(245,158,11,0.86)',  border:'rgba(245,158,11,0.36)',  glow:'rgba(245,158,11,0.12)'},
    aviator:{accent:'rgba(14,165,233,0.84)',  border:'rgba(245,158,11,0.32)',  glow:'rgba(14,165,233,0.12)'},
    astronaut:{accent:'rgba(14,165,233,0.86)',border:'rgba(255,255,255,0.48)', glow:'rgba(14,165,233,0.13)'},
    magician:{accent:'rgba(168,85,247,0.86)', border:'rgba(168,85,247,0.36)', glow:'rgba(168,85,247,0.12)'},
    samurai:{accent:'rgba(244,114,182,0.86)', border:'rgba(244,114,182,0.36)', glow:'rgba(244,114,182,0.12)'},
    gold:   {accent:'rgba(255,215,0,0.85)',   border:'rgba(255,215,0,0.35)',   glow:'rgba(255,215,0,0.10)'},
    neon:   {accent:'rgba(0,242,255,0.85)',   border:'rgba(0,242,255,0.35)',   glow:'rgba(0,242,255,0.08)'},
    fire:   {accent:'rgba(255,100,0,0.85)',   border:'rgba(255,80,0,0.35)',    glow:'rgba(255,80,0,0.08)'},
    thunder:{accent:'rgba(250,204,21,0.92)',  border:'rgba(250,204,21,0.38)',  glow:'rgba(250,204,21,0.14)'},
    dragon: {accent:'rgba(34,197,94,0.9)',    border:'rgba(34,197,94,0.38)',   glow:'rgba(34,197,94,0.14)'}
  };
  var t=themes[id]||themes.default;
  var r=document.documentElement;
  r.style.setProperty('--skin-accent',t.accent);
  r.style.setProperty('--skin-border',t.border);
  r.style.setProperty('--skin-glow',t.glow);
}

function loadGalleryUnlocked(){try{return localStorage.getItem('flagmaster_gallery_unlocked')==='1';}catch(e){return false;}}
function saveGalleryUnlocked(){try{localStorage.setItem('flagmaster_gallery_unlocked','1');_fbSaveWallet();}catch(e){}}
function loadGalleryMusic(){try{return localStorage.getItem('flagmaster_gallery_music')||null;}catch(e){return null;}}
function saveGalleryMusic(v){try{if(v)localStorage.setItem('flagmaster_gallery_music',v);else localStorage.removeItem('flagmaster_gallery_music');}catch(e){}}
function loadCapitalsUnlocked(){try{return localStorage.getItem('flagmaster_capitals_unlocked')==='1';}catch(e){return false;}}
function saveCapitalsUnlocked(){try{localStorage.setItem('flagmaster_capitals_unlocked','1');_fbSaveWallet();}catch(e){}}
function loadSilhouettesUnlocked(){try{return localStorage.getItem('flagmaster_silhouettes_unlocked')==='1';}catch(e){return false;}}
function saveSilhouettesUnlocked(){try{localStorage.setItem('flagmaster_silhouettes_unlocked','1');_fbSaveWallet();}catch(e){}}

function loadCoins(){try{return parseInt(localStorage.getItem('flagmaster_coins')||'0',10)||0;}catch(e){return 0;}}
function formatCoins(n){
  n=Math.max(0,parseInt(n||0,10)||0);
  if(n>=1000000)return (Math.floor(n/100000)/10).toFixed(n>=10000000?0:1).replace('.0','')+'M';
  if(n>=1000)return (Math.floor(n/100)/10).toFixed(n>=10000?0:1).replace('.0','')+'K';
  return String(n);
}
function saveCoins(n){try{localStorage.setItem('flagmaster_coins',String(Math.max(0,n|0)));_fbSaveWallet();}catch(e){}}
function addCoins(amount){var c=loadCoins()+amount;saveCoins(c);return c;}
function calculateCoinReward(result){
  var parts=[],amount=0;
  var diffMult=result.diff==='hard'?1.6:result.diff==='medium'?1.25:1;
  if(result.mode==='survie'){
    amount=Math.max(0,Math.floor((result.streak||result.score||0)*2));
    if((result.streak||0)>=20){amount+=15;parts.push('série +15');}
  } else if(result.mode==='chrono'){
    amount=Math.floor((result.score||0)*5*diffMult);
    if((result.score||0)>=TOTAL){amount+=18;parts.push('chrono parfait +18');}
  } else {
    amount=Math.floor((result.score||0)*4*diffMult);
    if((result.score||0)>=TOTAL){amount+=15;parts.push('sans-faute +15');}
  }
  if(G.newFlagsThisSession>0){amount+=Math.min(14,G.newFlagsThisSession*2);parts.push('nouveaux pays +'+Math.min(14,G.newFlagsThisSession*2));}
  if(result.daily){amount+=10;parts.push('défi du jour +10');}
  return {amount:amount,parts:parts};
}
function getNextShopGoal(coins){
  coins=typeof coins==='number'?coins:loadCoins();
  var goals=[];
  var bgs=loadShopUnlocked();
  SHOP_ITEMS.forEach(function(i){if(i.price>0&&bgs.indexOf(i.id)===-1)goals.push({type:'Décor',icon:'🖼️',name:i.name,price:i.price,action:"G.shopModal='backgrounds';_shopRender()"});});
  var skins=loadSkinUnlocked();
  TERRY_SKINS.forEach(function(s){if(s.price>0&&skins.indexOf(s.id)===-1)goals.push({type:'Tenue Terry',icon:'🎭',name:s.name,price:s.price,action:"G.shopModal='skins';_shopRender()"});});
  if(!loadCapitalsUnlocked())goals.push({type:'Univers',icon:'🏛️',name:'Capitales',price:250,action:"G.screen='packSelect';G.shopModal=null;render()"});
  if(!loadSilhouettesUnlocked())goals.push({type:'Univers',icon:'🗺️',name:'Silhouettes du Monde',price:900,action:"G.screen='packSelect';G.shopModal=null;render()"});
  if(!loadGalleryUnlocked())goals.push({type:'Galerie',icon:'🎨',name:'Galerie bonus',price:900,action:"G.shopModal='gallery';_shopRender()"});
  goals=goals.filter(function(g){return g.price>coins;}).sort(function(a,b){return a.price-b.price;});
  return goals[0]||null;
}
function renderNextShopGoal(goal,compact){
  goal=goal||getNextShopGoal(loadCoins());
  if(!goal)return '<div style="border-radius:16px;border:1.5px solid rgba(34,197,94,0.22);background:rgba(34,197,94,0.08);padding:12px 14px;display:flex;align-items:center;gap:10px"><span style="font-size:24px">🏆</span><div><div style="font-size:13px;font-weight:900;color:#16a34a">Collection au top</div><div style="font-size:10px;color:var(--text-muted);font-weight:800">Tu as débloqué les gros objectifs.</div></div></div>';
  var coins=loadCoins(),left=Math.max(0,goal.price-coins),pct=Math.min(100,Math.round(coins/goal.price*100));
  return '<div style="border-radius:18px;border:1.5px solid rgba(14,165,233,0.24);background:linear-gradient(135deg,rgba(255,255,255,0.78),rgba(219,234,254,0.68));padding:'+(compact?'10px 12px':'13px 15px')+';box-shadow:0 8px 18px rgba(31,86,127,0.12);color:#183153">'+
    '<div style="display:flex;align-items:center;gap:11px">'+
      '<div style="width:42px;height:42px;border-radius:14px;background:rgba(14,165,233,0.12);display:flex;align-items:center;justify-content:center;font-size:23px;flex-shrink:0">'+goal.icon+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:9px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#0ea5e9">Prochain objectif</div>'+
        '<div style="font-family:Fredoka One,cursive;font-size:'+(compact?'14':'16')+'px;color:#183153;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+goal.name+'</div>'+
        '<div style="font-size:10px;font-weight:900;color:#52708d">'+left+' 🪙 restantes · '+goal.type+'</div>'+
      '</div>'+
      '<button class="goal-shop-btn" onclick="openShop();'+goal.action+'">Voir</button>'+
    '</div>'+
    '<div style="height:6px;border-radius:999px;background:rgba(14,165,233,0.12);overflow:hidden;margin-top:10px"><div style="height:100%;width:'+pct+'%;border-radius:999px;background:linear-gradient(90deg,#38bdf8,#22c55e,#facc15)"></div></div>'+
  '</div>';
}
function getItemDisplayName(item){
  if(!item)return '';
  if((G.pack||'flags')==='capitals'&&item.countryName)return item.name+' · '+item.countryName;
  return item.name||'';
}
function getDailyFeaturedText(item){
  if(!item)return '';
  var pack=G.pack||'flags';
  if(pack==='capitals')return 'Capitale vedette : '+item.name+(item.countryName?' · '+item.countryName:'');
  if(pack==='silhouettes')return 'Silhouette vedette : '+item.name;
  if(pack==='football')return 'Club vedette : '+item.name;
  if(pack==='nba')return 'Équipe vedette : '+item.name;
  return 'Pays vedette : '+item.name;
}
function showCoinNotif(amount){
  var el=document.createElement('div');
  el.textContent='+'+amount+' 🪙';
  el.style.cssText='position:fixed;top:18%;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(255,215,0,0.15);border:1.5px solid rgba(255,215,0,0.45);border-radius:22px;padding:8px 22px;font-family:Fredoka One,cursive;font-size:20px;color:#ffd700;pointer-events:none;transition:opacity 0.4s ease 0.9s,transform 0.5s ease 0.9s';
  document.body.appendChild(el);
  setTimeout(function(){el.style.opacity='0';el.style.transform='translateX(-50%) translateY(-22px)';},900);
  setTimeout(function(){try{document.body.removeChild(el);}catch(e){}},1500);
}
function loadShopUnlocked(){try{var valid=SHOP_ITEMS.map(function(i){return i.id;});var u=JSON.parse(localStorage.getItem('flagmaster_shop_unlocked')||'["bg_world_1"]').filter(function(id){return valid.indexOf(id)>-1;});if(u.indexOf('bg_world_1')===-1)u.push('bg_world_1');return u;}catch(e){return['bg_world_1'];}}
function saveShopUnlocked(arr){try{localStorage.setItem('flagmaster_shop_unlocked',JSON.stringify(arr));_fbSaveWallet();}catch(e){}}
function loadActiveBg(){try{var id=localStorage.getItem('flagmaster_active_bg')||'bg_world_1';if(id==='default')id='bg_world_1';if(!SHOP_ITEMS.some(function(i){return i.id===id;}))id='bg_world_1';return id;}catch(e){return'bg_world_1';}}
function saveActiveBg(id){try{localStorage.setItem('flagmaster_active_bg',id);_fbSaveWallet();}catch(e){}}

function applyBackground(fade){
  if(fade)triggerBgFade();
  var id=loadActiveBg();
  var item=SHOP_ITEMS.filter(function(s){return s.id===id;})[0]||SHOP_ITEMS[0];
  var bg=document.querySelector('.blob-bg');
  if(!bg)return;
  bg.style.transition='background 0.5s ease';
  function setBg(value){bg.style.setProperty('background',value,'important');}
  if(item.img){
    var testImg=new Image();
    testImg.onload=function(){
      setBg('linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.32)), url("'+item.img.replace(/"/g,'%22')+'") center/cover no-repeat');
      bg.innerHTML='<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.28));z-index:1"></div>';
    };
    testImg.onerror=function(){
      setBg(item.gradient);
      bg.innerHTML='<div class="blob b1" style="opacity:0.25"></div><div class="blob b2" style="opacity:0.25"></div>';
    };
    testImg.src=item.img;
  } else {
    setBg(item.gradient);
    bg.innerHTML='<div class="blob b1" style="opacity:0.25"></div><div class="blob b2" style="opacity:0.25"></div>';
  }
}

function _coinsBadge(){
  return '<div style="display:flex;align-items:center;gap:4px;background:rgba(255,215,0,0.08);border:1.5px solid rgba(255,215,0,0.25);border-radius:20px;padding:5px 10px;flex-shrink:0">'+
    '<span style="font-size:14px">🪙</span>'+
    '<span style="font-family:Fredoka One,cursive;font-size:13px;color:#ffd700">'+loadCoins()+'</span>'+
  '</div>';
}
function navBackButton(action,label){
  return '<button class="nav-back-btn" onclick="sfx(\'click\');'+action+'">← '+(label||'Retour')+'</button>';
}
function goSetup(){
  G.screen='setup';
  G.shopModal=null;
  render();
}
function goPackSelect(){
  G.screen='packSelect';
  G.shopModal=null;
  render();
}
function enterActivePackFromSelect(){
  var packId=localStorage.getItem('flagmaster_active_pack')||G.pack||'flags';
  if(!PACKS[packId])packId='flags';
  if(packId==='capitals'&&!loadCapitalsUnlocked()&&!isAdmin)packId='flags';
  if(packId==='silhouettes'&&!loadSilhouettesUnlocked()&&!isAdmin)packId='flags';
  if((packId==='football'||packId==='nba')&&!isAdmin)packId='flags';
  G.pack=packId;
  localStorage.setItem('flagmaster_active_pack',packId);
  applyPackTheme(packId);
  G.screen='setup';
  render();
}

function openShop(){sfx('click');G.screen='shop';G.shopModal=null;render();}
function buyBg(id){
  var item=SHOP_ITEMS.filter(function(s){return s.id===id;})[0];
  if(!item)return;
  var coins=loadCoins();
  if(coins<item.price){sfx('wrong');return;}
  saveCoins(coins-item.price);
  var u=loadShopUnlocked();
  if(u.indexOf(id)===-1)u.push(id);
  saveShopUnlocked(u);
  saveActiveBg(id);
  applyBackground(true);
  sfx('correct');
  showToast('✅ '+item.name+' débloqué !','#ffd700');
  _shopRender();
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

// ══════════════════════════════════════════════════════
// 🏛️ CAPITALES DATA
// ══════════════════════════════════════════════════════
var CAP={
  "France":"Paris","Allemagne":"Berlin","Italie":"Rome","Espagne":"Madrid","Royaume-Uni":"Londres",
  "Portugal":"Lisbonne","Belgique":"Bruxelles","Pays-Bas":"Amsterdam","Suisse":"Berne","Suède":"Stockholm",
  "Norvège":"Oslo","Danemark":"Copenhague","Pologne":"Varsovie","Autriche":"Vienne","Grèce":"Athènes",
  "Irlande":"Dublin","Roumanie":"Bucarest","Hongrie":"Budapest","Finlande":"Helsinki","Tchéquie":"Prague",
  "Russie":"Moscou","Ukraine":"Kyiv","Islande":"Reykjavik","Croatie":"Zagreb","Slovaquie":"Bratislava",
  "Bulgarie":"Sofia","Serbie":"Belgrade","Lituanie":"Vilnius","Lettonie":"Riga","Estonie":"Tallinn",
  "Slovénie":"Ljubljana","Biélorussie":"Minsk","Bosnie-Herzégovine":"Sarajevo","Albanie":"Tirana",
  "Macédoine du Nord":"Skopje","Luxembourg":"Luxembourg","Malte":"La Valette","Chypre":"Nicosie",
  "Moldavie":"Chișinău","Monténégro":"Podgorica","Monaco":"Monaco","Liechtenstein":"Vaduz",
  "Saint-Marin":"Saint-Marin","Andorre":"Andorre-la-Vieille",
  "Japon":"Tokyo","Chine":"Pékin","Inde":"New Delhi","Corée du Sud":"Séoul","Turquie":"Ankara",
  "Arabie Saoudite":"Riyad","Iran":"Téhéran","Irak":"Bagdad","Israël":"Jérusalem",
  "Pakistan":"Islamabad","Bangladesh":"Dacca","Indonésie":"Jakarta","Viêt Nam":"Hanoï",
  "Thaïlande":"Bangkok","Singapour":"Singapour","Malaisie":"Kuala Lumpur","Philippines":"Manille",
  "Palestine":"Ramallah","Afghanistan":"Kaboul","Kazakhstan":"Astana","Mongolie":"Oulan-Bator",
  "Népal":"Katmandou","Myanmar":"Naypyidaw","Yémen":"Sanaa","Azerbaïdjan":"Bakou",
  "Géorgie":"Tbilissi","Émirats arabes unis":"Abou Dabi","Jordanie":"Amman","Qatar":"Doha",
  "Koweït":"Koweït","Syrie":"Damas","Liban":"Beyrouth","Cambodge":"Phnom Penh",
  "Laos":"Vientiane","Sri Lanka":"Colombo","Ouzbékistan":"Tachkent","Oman":"Mascate",
  "Bahreïn":"Manama","Kirghizistan":"Bichkek","Tadjikistan":"Douchanbe","Turkménistan":"Achgabat",
  "Brunei":"Bandar Seri Begawan","Bhoutan":"Thimphou","Maldives":"Malé","Timor oriental":"Dili",
  "Corée du Nord":"Pyongyang","Taïwan":"Taipei","Arménie":"Erevan",
  "Maroc":"Rabat","Algérie":"Alger","Égypte":"Le Caire","Nigéria":"Abuja","Afrique du Sud":"Pretoria",
  "Kenya":"Nairobi","Ghana":"Accra","Éthiopie":"Addis-Abeba","Tanzanie":"Dodoma","Cameroun":"Yaoundé",
  "Côte d'Ivoire":"Yamoussoukro","Sénégal":"Dakar","Mali":"Bamako","Soudan":"Khartoum",
  "Libye":"Tripoli","Tunisie":"Tunis","Mozambique":"Maputo","Angola":"Luanda","Zambie":"Lusaka",
  "Zimbabwe":"Harare","Ouganda":"Kampala","Rwanda":"Kigali","Congo (Rép. dém.)":"Kinshasa",
  "Namibie":"Windhoek","Botswana":"Gaborone","Bénin":"Porto-Novo","Togo":"Lomé","Niger":"Niamey",
  "Burkina Faso":"Ouagadougou","Guinée":"Conakry","Tchad":"N'Djaména","Madagascar":"Antananarivo",
  "Malawi":"Lilongwe","Mauritanie":"Nouakchott","Érythrée":"Asmara","Djibouti":"Djibouti",
  "Somalie":"Mogadiscio","Soudan du Sud":"Djouba","Liberia":"Monrovia","Sierra Leone":"Freetown",
  "Gabon":"Libreville","Congo":"Brazzaville","Centrafrique":"Bangui","Guinée équatoriale":"Malabo",
  "Guinée-Bissau":"Bissau","Cap-Vert":"Praia","Gambie":"Banjul","Lesotho":"Maseru",
  "Eswatini":"Mbabane","Burundi":"Gitega","Comores":"Moroni","Maurice":"Port-Louis",
  "Seychelles":"Victoria","São Tomé-et-Príncipe":"São Tomé",
  "États-Unis":"Washington D.C.","Canada":"Ottawa","Brésil":"Brasilia","Argentine":"Buenos Aires",
  "Mexique":"Mexico","Cuba":"La Havane","Colombie":"Bogota","Chili":"Santiago","Pérou":"Lima",
  "Venezuela":"Caracas","Uruguay":"Montevideo","Équateur":"Quito","Bolivie":"Sucre",
  "Paraguay":"Asunción","Guatemala":"Guatemala","Haïti":"Port-au-Prince",
  "République dominicaine":"Saint-Domingue","Honduras":"Tegucigalpa","El Salvador":"San Salvador",
  "Nicaragua":"Managua","Costa Rica":"San José","Panama":"Panama","Jamaïque":"Kingston",
  "Trinité-et-Tobago":"Port of Spain","Guyana":"Georgetown","Suriname":"Paramaribo",
  "Belize":"Belmopan","Bahamas":"Nassau","Barbade":"Bridgetown","Antigua-et-Barbuda":"Saint John's",
  "Dominique":"Roseau","Sainte-Lucie":"Castries","Saint-Vincent-et-les-Grenadines":"Kingstown",
  "Grenade":"Saint George's","Saint-Christophe-et-Niévès":"Basseterre",
  "Australie":"Canberra","Nouvelle-Zélande":"Wellington","Fidji":"Suva",
  "Papouasie-Nouvelle-Guinée":"Port Moresby","Îles Salomon":"Honiara","Vanuatu":"Port-Vila",
  "Samoa":"Apia","Tonga":"Nuku'alofa","Kiribati":"Tarawa","Micronésie":"Palikir",
  "Nauru":"Yaren","Tuvalu":"Funafuti","Palaos":"Ngerulmud","Îles Marshall":"Majuro"
};
var CAPITALS_DATA=(function(){
  return FLAGS.filter(function(f){return !!CAP[f.name];}).map(function(f){
    return {flag:f.flag,name:CAP[f.name],countryName:f.name,lvl:f.lvl,continent:f.continent};
  });
})();

// ══════════════════════════════════════════════════════
// 🗺️ SILHOUETTES DU MONDE DATA — preview premium
// ══════════════════════════════════════════════════════
var SILHOUETTES_DATA=[
  {flag:'🇫🇷',name:'France',lvl:1,continent:'EU',silhouette:'assets/img/silhouettes/france.svg'},
  {flag:'🇮🇹',name:'Italie',lvl:1,continent:'EU',silhouette:'assets/img/silhouettes/italie.svg'},
  {flag:'🇯🇵',name:'Japon',lvl:1,continent:'AS',silhouette:'assets/img/silhouettes/japon.svg'},
  {flag:'🇧🇷',name:'Brésil',lvl:1,continent:'AM',silhouette:'assets/img/silhouettes/bresil.svg'},
  {flag:'🇦🇺',name:'Australie',lvl:1,continent:'OC',silhouette:'assets/img/silhouettes/australie.svg'},
  {flag:'🇮🇳',name:'Inde',lvl:1,continent:'AS',silhouette:'assets/img/silhouettes/inde.svg'},
  {flag:'🇺🇸',name:'États-Unis',lvl:1,continent:'AM',silhouette:'assets/img/silhouettes/etats-unis.svg'},
  {flag:'🇪🇸',name:'Espagne',lvl:1,continent:'EU',silhouette:'assets/img/silhouettes/espagne.svg'},
  {flag:'🇿🇦',name:'Afrique du Sud',lvl:1,continent:'AF',silhouette:'assets/img/silhouettes/afrique-du-sud.svg'},
  {flag:'🇬🇧',name:'Royaume-Uni',lvl:1,continent:'EU',silhouette:'assets/img/silhouettes/royaume-uni.svg'},
  {flag:'🇨🇦',name:'Canada',lvl:2,continent:'AM',silhouette:'assets/img/silhouettes/canada.svg'},
  {flag:'🇲🇽',name:'Mexique',lvl:2,continent:'AM',silhouette:'assets/img/silhouettes/mexique.svg'},
  {flag:'🇨🇳',name:'Chine',lvl:2,continent:'AS',silhouette:'assets/img/silhouettes/chine.svg'},
  {flag:'🇳🇴',name:'Norvège',lvl:2,continent:'EU',silhouette:'assets/img/silhouettes/norvege.svg'},
  {flag:'🇪🇬',name:'Égypte',lvl:2,continent:'AF',silhouette:'assets/img/silhouettes/egypte.svg'},
  {flag:'🇦🇷',name:'Argentine',lvl:2,continent:'AM',silhouette:'assets/img/silhouettes/argentine.svg'},
  {flag:'🇨🇱',name:'Chili',lvl:3,continent:'AM',silhouette:'assets/img/silhouettes/chili.svg'},
  {flag:'🇲🇬',name:'Madagascar',lvl:3,continent:'AF',silhouette:'assets/img/silhouettes/madagascar.svg'}
];

// ══════════════════════════════════════════════════════
// ⚽ FOOTBALL CLUBS DATA
// ══════════════════════════════════════════════════════
var FOOTBALL_CLUBS=[
  // ── PREMIER LEAGUE lvl:1 ──
  {badge:{abbr:'MCI',bg:'#6CABDD',bg2:'#1C2C5B',text:'#FFFFFF',design:'split-h'},name:'Manchester City',lvl:1,continent:'PL'},
  {badge:{abbr:'LFC',bg:'#C8102E',text:'#FFFFFF',design:'solid'},name:'Liverpool',lvl:1,continent:'PL'},
  {badge:{abbr:'ARS',bg:'#EF0107',bg2:'#063672',text:'#FFFFFF',design:'split-h'},name:'Arsenal',lvl:1,continent:'PL'},
  {badge:{abbr:'CHE',bg:'#034694',text:'#FFFFFF',design:'solid'},name:'Chelsea',lvl:1,continent:'PL'},
  {badge:{abbr:'MNU',bg:'#DA291C',bg2:'#FBE122',text:'#FFFFFF',design:'split-h'},name:'Manchester United',lvl:1,continent:'PL'},
  // ── LA LIGA lvl:1 ──
  {badge:{abbr:'RMA',bg:'#00529F',bg2:'#FEBE10',text:'#FFFFFF',design:'split-v'},name:'Real Madrid',lvl:1,continent:'LL'},
  {badge:{abbr:'FCB',bg:'#A50044',bg2:'#004D98',text:'#FEBE10',design:'stripes'},name:'FC Barcelone',lvl:1,continent:'LL'},
  {badge:{abbr:'ATM',bg:'#CB3524',bg2:'#FFFFFF',text:'#CB3524',design:'stripes'},name:'Atlético Madrid',lvl:1,continent:'LL'},
  // ── BUNDESLIGA lvl:1 ──
  {badge:{abbr:'BAY',bg:'#DC052D',bg2:'#0066B2',text:'#FFFFFF',design:'solid'},name:'Bayern Munich',lvl:1,continent:'BL'},
  {badge:{abbr:'BVB',bg:'#FDE100',bg2:'#000000',text:'#000000',design:'split-h'},name:'Borussia Dortmund',lvl:1,continent:'BL'},
  // ── SERIE A lvl:1 ──
  {badge:{abbr:'JUV',bg:'#000000',bg2:'#FFFFFF',text:'#FFFFFF',design:'stripes'},name:'Juventus',lvl:1,continent:'SA'},
  {badge:{abbr:'ACM',bg:'#FB090B',bg2:'#000000',text:'#FFFFFF',design:'stripes'},name:'AC Milan',lvl:1,continent:'SA'},
  {badge:{abbr:'INT',bg:'#010E80',bg2:'#000000',text:'#FFFFFF',design:'stripes'},name:'Inter Milan',lvl:1,continent:'SA'},
  // ── LIGUE 1 lvl:1 ──
  {badge:{abbr:'PSG',bg:'#004170',bg2:'#DA291C',text:'#FFFFFF',design:'split-h'},name:'Paris Saint-Germain',lvl:1,continent:'L1'},
  // ── EUROPE lvl:1 ──
  {badge:{abbr:'AJX',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'split-v'},name:'Ajax Amsterdam',lvl:1,continent:'EU'},

  // ── PREMIER LEAGUE lvl:2 ──
  {badge:{abbr:'TOT',bg:'#132257',bg2:'#FFFFFF',text:'#FFFFFF',design:'split-h'},name:'Tottenham Hotspur',lvl:2,continent:'PL'},
  {badge:{abbr:'NEW',bg:'#241F20',bg2:'#FFFFFF',text:'#241F20',design:'stripes'},name:'Newcastle United',lvl:2,continent:'PL'},
  {badge:{abbr:'WHU',bg:'#7A263A',bg2:'#1BB1E7',text:'#FFFFFF',design:'split-v'},name:'West Ham United',lvl:2,continent:'PL'},
  {badge:{abbr:'AVL',bg:'#670E36',bg2:'#95BFE5',text:'#FFFFFF',design:'stripes'},name:'Aston Villa',lvl:2,continent:'PL'},
  // ── LA LIGA lvl:2 ──
  {badge:{abbr:'SEV',bg:'#C8102E',bg2:'#FFFFFF',text:'#C8102E',design:'split-h'},name:'Séville FC',lvl:2,continent:'LL'},
  {badge:{abbr:'VAL',bg:'#EE6000',bg2:'#000000',text:'#FFFFFF',design:'split-h'},name:'Valence CF',lvl:2,continent:'LL'},
  {badge:{abbr:'BET',bg:'#00954C',bg2:'#FFFFFF',text:'#00954C',design:'stripes'},name:'Real Betis',lvl:2,continent:'LL'},
  // ── BUNDESLIGA lvl:2 ──
  {badge:{abbr:'B04',bg:'#E32221',bg2:'#000000',text:'#FFFFFF',design:'solid'},name:'Bayer Leverkusen',lvl:2,continent:'BL'},
  {badge:{abbr:'RBL',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'split-v'},name:'RB Leipzig',lvl:2,continent:'BL'},
  {badge:{abbr:'BMG',bg:'#000000',bg2:'#FFFFFF',text:'#FFFFFF',design:'stripes'},name:'Borussia Mönchengladbach',lvl:2,continent:'BL'},
  {badge:{abbr:'SGE',bg:'#CC0000',bg2:'#000000',text:'#FFFFFF',design:'split-v'},name:'Eintracht Frankfurt',lvl:2,continent:'BL'},
  {badge:{abbr:'VFB',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'split-h'},name:'VfB Stuttgart',lvl:2,continent:'BL'},
  // ── SERIE A lvl:2 ──
  {badge:{abbr:'NAP',bg:'#12A0C3',text:'#FFFFFF',design:'solid'},name:'Naples',lvl:2,continent:'SA'},
  {badge:{abbr:'ROM',bg:'#9B1B2A',bg2:'#FFD700',text:'#FFD700',design:'solid'},name:'AS Roma',lvl:2,continent:'SA'},
  {badge:{abbr:'LAZ',bg:'#87D8F7',bg2:'#003B71',text:'#003B71',design:'split-h'},name:'Lazio',lvl:2,continent:'SA'},
  {badge:{abbr:'TOR',bg:'#8B1A1A',bg2:'#FFFFFF',text:'#FFFFFF',design:'solid'},name:'Torino',lvl:2,continent:'SA'},
  {badge:{abbr:'BOL',bg:'#003087',bg2:'#CC0000',text:'#FFFFFF',design:'split-h'},name:'Bologna',lvl:2,continent:'SA'},
  // ── LIGUE 1 lvl:2 ──
  {badge:{abbr:'OM',bg:'#009BDE',text:'#FFFFFF',design:'solid'},name:'Olympique Marseille',lvl:2,continent:'L1'},
  {badge:{abbr:'OL',bg:'#CC0000',bg2:'#003B71',text:'#FFFFFF',design:'split-h'},name:'Olympique Lyonnais',lvl:2,continent:'L1'},
  {badge:{abbr:'MON',bg:'#D7001D',bg2:'#FFFFFF',text:'#D7001D',design:'quarters'},name:'AS Monaco',lvl:2,continent:'L1'},
  {badge:{abbr:'LNS',bg:'#E31B22',bg2:'#FFD700',text:'#FFD700',design:'solid'},name:'RC Lens',lvl:2,continent:'L1'},
  // ── EUROPE lvl:2 ──
  {badge:{abbr:'POR',bg:'#003087',bg2:'#FFFFFF',text:'#003087',design:'quarters'},name:'FC Porto',lvl:2,continent:'EU'},
  {badge:{abbr:'BEN',bg:'#CC0000',bg2:'#FFFFFF',text:'#FFFFFF',design:'solid'},name:'Benfica',lvl:2,continent:'EU'},
  {badge:{abbr:'CEL',bg:'#005B29',bg2:'#FFFFFF',text:'#005B29',design:'stripes'},name:'Celtic FC',lvl:2,continent:'EU'},
  {badge:{abbr:'GAL',bg:'#CC0000',bg2:'#FFD700',text:'#FFD700',design:'split-h'},name:'Galatasaray',lvl:2,continent:'EU'},
  {badge:{abbr:'FBH',bg:'#003087',bg2:'#FFD700',text:'#FFD700',design:'split-v'},name:'Fenerbahçe',lvl:2,continent:'EU'},

  // ── PREMIER LEAGUE lvl:3 ──
  {badge:{abbr:'BHA',bg:'#0057B8',bg2:'#FFFFFF',text:'#0057B8',design:'stripes'},name:'Brighton',lvl:3,continent:'PL'},
  {badge:{abbr:'WOL',bg:'#FDB913',bg2:'#231F20',text:'#231F20',design:'split-h'},name:'Wolverhampton',lvl:3,continent:'PL'},
  {badge:{abbr:'CRY',bg:'#1B458F',bg2:'#C4122E',text:'#FFFFFF',design:'split-v'},name:'Crystal Palace',lvl:3,continent:'PL'},
  {badge:{abbr:'EVE',bg:'#003399',text:'#FFFFFF',design:'solid'},name:'Everton',lvl:3,continent:'PL'},
  {badge:{abbr:'BRE',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'stripes'},name:'Brentford',lvl:3,continent:'PL'},
  {badge:{abbr:'FUL',bg:'#CC0000',bg2:'#000000',text:'#FFFFFF',design:'split-h'},name:'Fulham',lvl:3,continent:'PL'},
  {badge:{abbr:'NFO',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'split-h'},name:'Nottingham Forest',lvl:3,continent:'PL'},
  {badge:{abbr:'BOU',bg:'#DA291C',bg2:'#000000',text:'#FFFFFF',design:'stripes'},name:'Bournemouth',lvl:3,continent:'PL'},
  {badge:{abbr:'LEI',bg:'#003090',bg2:'#FDBE11',text:'#FDBE11',design:'solid'},name:'Leicester City',lvl:3,continent:'PL'},
  {badge:{abbr:'SOU',bg:'#D71920',bg2:'#FFFFFF',text:'#D71920',design:'stripes'},name:'Southampton',lvl:3,continent:'PL'},
  {badge:{abbr:'IPS',bg:'#003087',bg2:'#FFFFFF',text:'#FFFFFF',design:'solid'},name:'Ipswich Town',lvl:3,continent:'PL'},
  // ── LA LIGA lvl:3 ──
  {badge:{abbr:'SOC',bg:'#0067A5',bg2:'#FFFFFF',text:'#0067A5',design:'stripes'},name:'Real Sociedad',lvl:3,continent:'LL'},
  {badge:{abbr:'VIL',bg:'#FCE303',bg2:'#005187',text:'#005187',design:'solid'},name:'Villarreal',lvl:3,continent:'LL'},
  {badge:{abbr:'ATH',bg:'#CF212F',bg2:'#FFFFFF',text:'#CF212F',design:'stripes'},name:'Athletic Bilbao',lvl:3,continent:'LL'},
  {badge:{abbr:'CEG',bg:'#8ECAE6',bg2:'#003087',text:'#003087',design:'split-h'},name:'Celta Vigo',lvl:3,continent:'LL'},
  {badge:{abbr:'OSA',bg:'#CC0000',bg2:'#003087',text:'#FFFFFF',design:'split-v'},name:'Osasuna',lvl:3,continent:'LL'},
  {badge:{abbr:'GIR',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'stripes'},name:'Girona',lvl:3,continent:'LL'},
  {badge:{abbr:'GET',bg:'#003087',text:'#FFFFFF',design:'solid'},name:'Getafe',lvl:3,continent:'LL'},
  {badge:{abbr:'RAY',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'split-v'},name:'Rayo Vallecano',lvl:3,continent:'LL'},
  {badge:{abbr:'MAL',bg:'#CC0000',bg2:'#FFD700',text:'#FFFFFF',design:'split-h'},name:'Mallorca',lvl:3,continent:'LL'},
  {badge:{abbr:'ALA',bg:'#003087',bg2:'#FFFFFF',text:'#003087',design:'stripes'},name:'Alavés',lvl:3,continent:'LL'},
  // ── BUNDESLIGA lvl:3 ──
  {badge:{abbr:'HOF',bg:'#1565C0',text:'#FFFFFF',design:'solid'},name:'Hoffenheim',lvl:3,continent:'BL'},
  {badge:{abbr:'WER',bg:'#1D9053',bg2:'#FFFFFF',text:'#1D9053',design:'quarters'},name:'Werder Brême',lvl:3,continent:'BL'},
  {badge:{abbr:'SCF',bg:'#CC0000',bg2:'#000000',text:'#FFFFFF',design:'stripes'},name:'SC Freiburg',lvl:3,continent:'BL'},
  {badge:{abbr:'FCU',bg:'#CC0000',bg2:'#003087',text:'#FFFFFF',design:'split-v'},name:'Union Berlin',lvl:3,continent:'BL'},
  {badge:{abbr:'WOB',bg:'#65B32E',bg2:'#003087',text:'#FFFFFF',design:'split-v'},name:'Wolfsburg',lvl:3,continent:'BL'},
  {badge:{abbr:'KOE',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'stripes'},name:'FC Cologne',lvl:3,continent:'BL'},
  {badge:{abbr:'M05',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'split-h'},name:'Mainz 05',lvl:3,continent:'BL'},
  {badge:{abbr:'FCA',bg:'#CC0000',bg2:'#009B3A',text:'#FFFFFF',design:'split-v'},name:'FC Augsbourg',lvl:3,continent:'BL'},
  // ── SERIE A lvl:3 ──
  {badge:{abbr:'FIO',bg:'#4B0082',text:'#FFFFFF',design:'solid'},name:'Fiorentina',lvl:3,continent:'SA'},
  {badge:{abbr:'ATA',bg:'#1E90FF',bg2:'#000000',text:'#FFFFFF',design:'stripes'},name:'Atalanta',lvl:3,continent:'SA'},
  {badge:{abbr:'UDI',bg:'#000000',bg2:'#FFFFFF',text:'#000000',design:'stripes'},name:'Udinese',lvl:3,continent:'SA'},
  {badge:{abbr:'VER',bg:'#003087',bg2:'#FFD700',text:'#FFFFFF',design:'split-v'},name:'Hellas Vérone',lvl:3,continent:'SA'},
  {badge:{abbr:'CAG',bg:'#CC0000',bg2:'#003087',text:'#FFFFFF',design:'quarters'},name:'Cagliari',lvl:3,continent:'SA'},
  {badge:{abbr:'LEC',bg:'#FFD700',bg2:'#CC0000',text:'#CC0000',design:'stripes'},name:'Lecce',lvl:3,continent:'SA'},
  {badge:{abbr:'EMP',bg:'#0057B8',text:'#FFFFFF',design:'solid'},name:'Empoli',lvl:3,continent:'SA'},
  {badge:{abbr:'MZA',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'stripes'},name:'Monza',lvl:3,continent:'SA'},
  {badge:{abbr:'GEN',bg:'#003087',bg2:'#CC0000',text:'#FFFFFF',design:'split-v'},name:'Genoa',lvl:3,continent:'SA'},
  // ── LIGUE 1 lvl:3 ──
  {badge:{abbr:'LOS',bg:'#E0001B',bg2:'#003870',text:'#FFFFFF',design:'split-v'},name:'Lille OSC',lvl:3,continent:'L1'},
  {badge:{abbr:'REN',bg:'#CC0000',bg2:'#000000',text:'#FFFFFF',design:'split-v'},name:'Stade Rennais',lvl:3,continent:'L1'},
  {badge:{abbr:'NIC',bg:'#CF0A2C',bg2:'#000000',text:'#FFFFFF',design:'split-h'},name:'OGC Nice',lvl:3,continent:'L1'},
  {badge:{abbr:'STR',bg:'#003087',bg2:'#FFFFFF',text:'#003087',design:'stripes'},name:'Strasbourg',lvl:3,continent:'L1'},
  {badge:{abbr:'FCN',bg:'#FFD700',bg2:'#005187',text:'#005187',design:'split-h'},name:'FC Nantes',lvl:3,continent:'L1'},
  {badge:{abbr:'ASS',bg:'#004E2A',bg2:'#FFFFFF',text:'#004E2A',design:'stripes'},name:'Saint-Étienne',lvl:3,continent:'L1'},
  {badge:{abbr:'TFC',bg:'#5B2D8E',bg2:'#FFFFFF',text:'#FFFFFF',design:'solid'},name:'Toulouse FC',lvl:3,continent:'L1'},
  {badge:{abbr:'SB2',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'stripes'},name:'Stade Brestois',lvl:3,continent:'L1'},
  {badge:{abbr:'MHE',bg:'#003087',bg2:'#F96900',text:'#FFFFFF',design:'split-v'},name:'Montpellier',lvl:3,continent:'L1'},
  // ── EUROPE lvl:3 ──
  {badge:{abbr:'PSV',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'stripes'},name:'PSV Eindhoven',lvl:3,continent:'EU'},
  {badge:{abbr:'FEY',bg:'#CC0000',bg2:'#000000',text:'#FFFFFF',design:'split-h'},name:'Feyenoord',lvl:3,continent:'EU'},
  {badge:{abbr:'SPO',bg:'#009B3A',bg2:'#FFFFFF',text:'#009B3A',design:'stripes'},name:'Sporting CP',lvl:3,continent:'EU'},
  {badge:{abbr:'RFC',bg:'#003087',text:'#FFFFFF',design:'solid'},name:'Rangers FC',lvl:3,continent:'EU'},
  {badge:{abbr:'CLB',bg:'#003087',bg2:'#000000',text:'#FFFFFF',design:'split-h'},name:'Club Bruges',lvl:3,continent:'EU'},
  {badge:{abbr:'AND',bg:'#5B2D8E',bg2:'#FFFFFF',text:'#FFFFFF',design:'stripes'},name:'Anderlecht',lvl:3,continent:'EU'},
  {badge:{abbr:'SLA',bg:'#CC0000',bg2:'#FFFFFF',text:'#CC0000',design:'split-v'},name:'Slavia Prague',lvl:3,continent:'EU'},
  {badge:{abbr:'GNK',bg:'#003087',bg2:'#87CEEB',text:'#FFFFFF',design:'split-v'},name:'Dinamo Zagreb',lvl:3,continent:'EU'},
];

// ══════════════════════════════════════════════════════
// 🏀 NBA TEAMS DATA
// ══════════════════════════════════════════════════════
var NBA_TEAMS=[
  // ── FACILE lvl:1 ──
  {badge:{abbr:'LAL',bg:'#552583',bg2:'#FDB927',text:'#FDB927',design:'split-v'},name:'Los Angeles Lakers',lvl:1,continent:'WEST'},
  {badge:{abbr:'GSW',bg:'#1D428A',bg2:'#FFC72C',text:'#FFC72C',design:'split-h'},name:'Golden State Warriors',lvl:1,continent:'WEST'},
  {badge:{abbr:'CHI',bg:'#CE1141',bg2:'#000000',text:'#FFFFFF',design:'split-h'},name:'Chicago Bulls',lvl:1,continent:'EAST'},
  {badge:{abbr:'BOS',bg:'#007A33',bg2:'#FFFFFF',text:'#FFFFFF',design:'stripes'},name:'Boston Celtics',lvl:1,continent:'EAST'},
  {badge:{abbr:'MIA',bg:'#98002E',bg2:'#F9A01B',text:'#F9A01B',design:'split-h'},name:'Miami Heat',lvl:1,continent:'EAST'},
  {badge:{abbr:'NYK',bg:'#006BB6',bg2:'#F58426',text:'#FFFFFF',design:'split-v'},name:'New York Knicks',lvl:1,continent:'EAST'},
  {badge:{abbr:'SAS',bg:'#000000',bg2:'#C4CED4',text:'#FFFFFF',design:'split-v'},name:'San Antonio Spurs',lvl:1,continent:'WEST'},
  {badge:{abbr:'DAL',bg:'#00538C',bg2:'#002B5E',text:'#FFFFFF',design:'split-h'},name:'Dallas Mavericks',lvl:1,continent:'WEST'},
  {badge:{abbr:'MIL',bg:'#00471B',bg2:'#EEE1C6',text:'#EEE1C6',design:'split-h'},name:'Milwaukee Bucks',lvl:1,continent:'EAST'},
  {badge:{abbr:'BRK',bg:'#000000',bg2:'#FFFFFF',text:'#FFFFFF',design:'stripes'},name:'Brooklyn Nets',lvl:1,continent:'EAST'},
  // ── MOYEN lvl:2 ──
  {badge:{abbr:'PHI',bg:'#006BB6',bg2:'#ED174C',text:'#FFFFFF',design:'split-v'},name:'Philadelphia 76ers',lvl:2,continent:'EAST'},
  {badge:{abbr:'TOR',bg:'#CE1141',bg2:'#000000',text:'#FFFFFF',design:'stripes'},name:'Toronto Raptors',lvl:2,continent:'EAST'},
  {badge:{abbr:'ATL',bg:'#E03A3E',bg2:'#C1D32F',text:'#FFFFFF',design:'split-h'},name:'Atlanta Hawks',lvl:2,continent:'EAST'},
  {badge:{abbr:'CLE',bg:'#6F263D',bg2:'#FFB81C',text:'#FFB81C',design:'solid'},name:'Cleveland Cavaliers',lvl:2,continent:'EAST'},
  {badge:{abbr:'IND',bg:'#002D62',bg2:'#FDBB30',text:'#FDBB30',design:'split-h'},name:'Indiana Pacers',lvl:2,continent:'EAST'},
  {badge:{abbr:'HOU',bg:'#CE1141',bg2:'#C4CED4',text:'#FFFFFF',design:'split-h'},name:'Houston Rockets',lvl:2,continent:'WEST'},
  {badge:{abbr:'LAC',bg:'#C8102E',bg2:'#1D428A',text:'#FFFFFF',design:'split-v'},name:'Los Angeles Clippers',lvl:2,continent:'WEST'},
  {badge:{abbr:'DEN',bg:'#0E2240',bg2:'#FEC524',text:'#FEC524',design:'split-h'},name:'Denver Nuggets',lvl:2,continent:'WEST'},
  {badge:{abbr:'UTA',bg:'#002B5C',bg2:'#00471B',text:'#FFFFFF',design:'split-h'},name:'Utah Jazz',lvl:2,continent:'WEST'},
  {badge:{abbr:'PHX',bg:'#1D1160',bg2:'#E56020',text:'#E56020',design:'split-h'},name:'Phoenix Suns',lvl:2,continent:'WEST'},
  {badge:{abbr:'POR',bg:'#E03A3E',bg2:'#000000',text:'#FFFFFF',design:'stripes'},name:'Portland Trail Blazers',lvl:2,continent:'WEST'},
  // ── DIFFICILE lvl:3 ──
  {badge:{abbr:'CHA',bg:'#1D1160',bg2:'#00788C',text:'#FFFFFF',design:'split-v'},name:'Charlotte Hornets',lvl:3,continent:'EAST'},
  {badge:{abbr:'WAS',bg:'#002B5C',bg2:'#E31837',text:'#FFFFFF',design:'split-v'},name:'Washington Wizards',lvl:3,continent:'EAST'},
  {badge:{abbr:'ORL',bg:'#0077C0',bg2:'#000000',text:'#FFFFFF',design:'split-h'},name:'Orlando Magic',lvl:3,continent:'EAST'},
  {badge:{abbr:'DET',bg:'#C8102E',bg2:'#1D42BA',text:'#FFFFFF',design:'split-v'},name:'Detroit Pistons',lvl:3,continent:'EAST'},
  {badge:{abbr:'MIN',bg:'#0C2340',bg2:'#236192',text:'#FFFFFF',design:'split-v'},name:'Minnesota Timberwolves',lvl:3,continent:'WEST'},
  {badge:{abbr:'OKC',bg:'#007AC1',bg2:'#EF3B24',text:'#FFFFFF',design:'split-v'},name:'Oklahoma City Thunder',lvl:3,continent:'WEST'},
  {badge:{abbr:'SAC',bg:'#5A2D81',bg2:'#63727A',text:'#FFFFFF',design:'split-h'},name:'Sacramento Kings',lvl:3,continent:'WEST'},
  {badge:{abbr:'NOP',bg:'#0C2340',bg2:'#C8102E',text:'#FFFFFF',design:'split-h'},name:'New Orleans Pelicans',lvl:3,continent:'WEST'},
  {badge:{abbr:'MEM',bg:'#5D76A9',bg2:'#12173F',text:'#FFFFFF',design:'split-h'},name:'Memphis Grizzlies',lvl:3,continent:'WEST'},
];

// ══════════════════════════════════════════════════════
// 🎮 PACK CONFIGURATION
// ══════════════════════════════════════════════════════
var PACKS={
  flags:{
    id:'flags',name:'Drapeaux du Monde',icon:'🌍',sub:'195 pays',
    accent:'#4facfe',accentGlow:'rgba(79,172,254,0.4)',
    gradient:'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
    blobColors:['rgba(255,71,87,0.15)','rgba(79,172,254,0.15)','rgba(155,89,182,0.15)'],
    question:'Quel pays est ce drapeau ?',
    itemLabel:'drapeau',itemLabelPlural:'drapeaux',
    discoverySingular:'pays exploré',discoveryPlural:'pays explorés',
    zones:{ALL:'🌐 Monde',EU:'🇪🇺 Europe',AF:'🌍 Afrique',AS:'🌏 Asie',AM:'🌎 Amériques',OC:'🌊 Océanie'},
    passportTitle:'📖 Passeport',passportSub:'pays explorés'
  },
  capitals:{
    id:'capitals',name:'Carnet des Capitales',icon:'🏛️',sub:'Les villes-monde de Terry',
    accent:'#f9ca24',accentGlow:'rgba(249,202,36,0.4)',
    gradient:'linear-gradient(135deg,#f9ca24 0%,#f0932b 100%)',
    blobColors:['rgba(249,202,36,0.15)','rgba(240,147,43,0.12)','rgba(255,215,0,0.15)'],
    question:'Quelle capitale correspond à ce pays ?',
    itemLabel:'capitale',itemLabelPlural:'capitales',
    discoverySingular:'capitale retrouvée',discoveryPlural:'capitales retrouvées',
    zones:{ALL:'🌐 Monde',EU:'🇪🇺 Europe',AF:'🌍 Afrique',AS:'🌏 Asie',AM:'🌎 Amériques',OC:'🌊 Océanie'},
    passportTitle:'🏛️ Carnet des Capitales',passportSub:'villes-monde retrouvées'
  },
  silhouettes:{
    id:'silhouettes',name:'Silhouettes du Monde',icon:'🗺️',sub:'Reconnais les pays par leur forme',
    accent:'#38bdf8',accentGlow:'rgba(56,189,248,0.42)',
    gradient:'linear-gradient(135deg,#38bdf8 0%,#22c55e 52%,#facc15 100%)',
    blobColors:['rgba(56,189,248,0.18)','rgba(34,197,94,0.12)','rgba(250,204,21,0.14)'],
    question:'Quel pays a cette silhouette ?',
    itemLabel:'silhouette',itemLabelPlural:'silhouettes',
    discoverySingular:'silhouette classée',discoveryPlural:'silhouettes classées',
    zones:{ALL:'🌐 Monde'},
    startZone:'ALL',
    dailyAllOnly:true,
    passportTitle:'🗺️ Atlas des Silhouettes',passportSub:'formes reconnues'
  },
  football:{
    id:'football',name:'Clubs de Foot',icon:'⚽',sub:'96 clubs',
    accent:'#00d284',accentGlow:'rgba(0,210,132,0.4)',
    gradient:'linear-gradient(135deg,#00d284 0%,#00ff7f 100%)',
    blobColors:['rgba(0,210,132,0.15)','rgba(0,255,127,0.12)','rgba(0,160,80,0.15)'],
    question:'Quel club est ce blason ?',
    itemLabel:'club',itemLabelPlural:'clubs',
    discoverySingular:'club découvert',discoveryPlural:'clubs découverts',
    zones:{ALL:'🌐 Tout',PL:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier L.',LL:'🇪🇸 La Liga',BL:'🇩🇪 Bundesliga',SA:'🇮🇹 Serie A',L1:'🇫🇷 Ligue 1',EU:'🌍 Europe'},
    passportTitle:'⚽ Maillots',passportSub:'clubs découverts'
  },
  nba:{
    id:'nba',name:'Franchises NBA',icon:'🏀',sub:'30 équipes',
    accent:'#ff8c00',accentGlow:'rgba(255,140,0,0.4)',
    gradient:'linear-gradient(135deg,#ff8c00 0%,#ff4500 100%)',
    blobColors:['rgba(255,140,0,0.15)','rgba(255,69,0,0.12)','rgba(200,100,0,0.15)'],
    question:'Quelle franchise NBA est ce logo ?',
    itemLabel:'équipe',itemLabelPlural:'équipes',
    discoverySingular:'équipe découverte',discoveryPlural:'équipes découvertes',
    zones:{ALL:'🌐 Tout',EAST:'🌆 Conférence Est',WEST:'🌅 Conférence Ouest'},
    passportTitle:'🏀 Palmarès',passportSub:'équipes découvertes'
  }
};

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

// Noms alternatifs des trophées selon le pack actif
var TROPHY_PACK_NAMES={
  football:{
    b1:{name:'Premier Coup de Sifflet !',icon:'⚽'},
    b3:{name:'Guerrier',icon:'💪'},
    b6:{name:'But parfait',icon:'🎯'},
    b8:{name:'Recrue',icon:'🌱'},
    s3:{name:'Mur défensif',desc:'50 clubs en Survie sans bouclier'},
    s4:{name:'Continent Cup',desc:'Trouver 1 club sur chaque zone'},
    s6:{name:'Pro',desc:'50 parties jouées'},
    s8:{name:'Encyclopédiste',desc:'Trouver 50 clubs différents'},
    s9:{name:'Capitaine',icon:'🧢'},
    g1:{name:'Hat-Trick Parfait',icon:'👑'},
    g2:{name:'Marathonien',desc:'100 clubs Survie sans bouclier'},
    g4:{name:'Ballon d\'Or',desc:'Trouver les 96 clubs au moins 1 fois',icon:'🏅'},
    g5:{name:'Passeur de Génie',icon:'🎩'},
    g8:{name:'Élite Europe',icon:'⭐'},
    g9:{name:'Champion des Champions',icon:'🏆'},
    p1:{name:'💎 Maître du Ballon',desc:'Tous les Or + L\'Épreuve Ultime en 1 session'}
  },
  nba:{
    b1:{name:'Rookie !',icon:'🏀'},
    b3:{name:'Clutch',icon:'💪'},
    b6:{name:'Tir parfait',icon:'🎯'},
    b8:{name:'Draft Pick',icon:'🌱'},
    s3:{name:'Lockdown',desc:'50 équipes en Survie sans bouclier'},
    s4:{name:'Coast to Coast',desc:'Trouver 1 équipe sur chaque conférence'},
    s6:{name:'Vétéran',desc:'50 parties jouées'},
    s8:{name:'All-Star',desc:'Trouver 25 équipes différentes'},
    s9:{name:'MVP',icon:'🏆'},
    g1:{name:'Triple-Double',icon:'👑'},
    g2:{name:'Ironman',desc:'100 équipes Survie sans bouclier'},
    g4:{name:'Ring Master',desc:'Trouver les 30 équipes au moins 1 fois',icon:'💍'},
    g5:{name:'Clutch King',icon:'🔥'},
    g8:{name:'Hall of Fame',icon:'⭐'},
    g9:{name:'Champion NBA',icon:'🏆'},
    p1:{name:'💎 G.O.A.T.',desc:'Tous les Or + L\'Épreuve Ultime en 1 session'}
  }
};
function _getTrophyDisplay(k){
  var t=TROPHIES[k];
  var ov=(TROPHY_PACK_NAMES[G&&G.pack||'flags']||{})[k];
  if(!ov)return t;
  return{id:t.id,tier:t.tier,icon:ov.icon||t.icon,name:ov.name||t.name,desc:ov.desc||t.desc,check:t.check};
}

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
  var pack=PACKS[(G&&G.pack)||'flags']||PACKS.flags;
  var c=color||pack.accent||'#00f2ff';
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

// ── PACK HELPERS ──
function getPackStatsKey(packId){var id=packId||G.pack||'flags';return id==='flags'?'flagmaster_stats':'flagmaster_stats_'+id;}
function loadStatsForPack(packId){
  try{var s=localStorage.getItem(getPackStatsKey(packId));if(s)return JSON.parse(s);}catch(e){}
  return{totalGames:0,xp:0,streak:0,lastPlayDate:null,foundFlags:[],foundFlagsCount:{},modesPlayed:{},unlockedTrophies:[],maxCombo:0,maxComboHard:0,multiWins:0,finishedWith1Life:false,perfectEasy:false,perfectChronoMedium:false,perfectHard:false,chronoFacile15:false,chronoParfaitHard:false,survieNoBouclier50:false,survieNoBouclier100:false,survieBouc3x75:false,allContinents:false,fast5:false,platineUnlocked:false,platineProgress:{classic:false,chrono:false,survie:false}};
}
function getPackDataById(p){if(p==='football')return FOOTBALL_CLUBS;if(p==='nba')return NBA_TEAMS;if(p==='capitals')return CAPITALS_DATA;if(p==='silhouettes')return SILHOUETTES_DATA;return FLAGS;}
function getCurrentPackData(){return getPackDataById(G.pack||'flags');}
function applyPackTheme(packId){
  var pack=PACKS[packId||'flags']||PACKS.flags;
  var r=document.documentElement;
  r.style.setProperty('--accent-base',pack.accent);
  r.style.setProperty('--accent-glow',pack.accentGlow);
  r.style.setProperty('--accent-gradient',pack.gradient);
  r.style.setProperty('--accent',pack.accent);
  var blobs=document.querySelectorAll('.blob');
  if(blobs[0])blobs[0].style.background=pack.blobColors[0];
  if(blobs[1])blobs[1].style.background=pack.blobColors[1];
  if(blobs[2])blobs[2].style.background=pack.blobColors[2];
}
function selectPack(packId){
  sfx('click');
  if(packId==='capitals'&&!loadCapitalsUnlocked()&&!isAdmin){showToast('Carnet des Capitales verrouillé','#f9ca24');return;}
  if(packId==='silhouettes'&&!loadSilhouettesUnlocked()&&!isAdmin){showToast('Silhouettes verrouillées','#38bdf8');return;}
  G.pack=packId;G.continent='ALL';G.passportTab='ALL';
  localStorage.setItem('flagmaster_active_pack',packId);
  applyPackTheme(packId);
  G.screen='setup';render();
}
function _svgShield(badge){
  var bg=badge.bg||'#333',bg2=badge.bg2,tc=badge.text||'#fff',abbr=badge.abbr||'',design=badge.design||'solid';
  var cid='bc'+abbr.replace(/[^a-zA-Z0-9]/g,'');
  var S='M45,6 L84,19 L84,53 Q84,78 45,90 Q6,78 6,53 L6,19 Z';
  var o='<path d="'+S+'" fill="'+bg+'"/>';
  if(bg2){
    o+='<clipPath id="'+cid+'"><path d="'+S+'"/></clipPath>';
    if(design==='stripes'){o+='<g clip-path="url(#'+cid+')">';for(var i=0;i<9;i++){if(i%2===1)o+='<rect x="'+(i*10)+'" y="0" width="10" height="96" fill="'+bg2+'"/>';}o+='</g>';}
    else if(design==='split-v'){o+='<rect x="45" y="0" width="50" height="96" fill="'+bg2+'" clip-path="url(#'+cid+')"/>';}
    else if(design==='split-h'){o+='<rect x="0" y="48" width="96" height="48" fill="'+bg2+'" clip-path="url(#'+cid+')"/>';}
    else if(design==='quarters'){o+='<rect x="0" y="0" width="45" height="48" fill="'+bg2+'" clip-path="url(#'+cid+')"/>';o+='<rect x="45" y="48" width="45" height="48" fill="'+bg2+'" clip-path="url(#'+cid+')"/>';}
  }
  o+='<path d="'+S+'" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>';
  o+='<text x="45" y="55" text-anchor="middle" dominant-baseline="middle" font-family="\'Fredoka One\',cursive" font-size="17" fill="'+tc+'" letter-spacing="0.5">'+abbr+'</text>';
  return '<svg width="90" height="90" viewBox="0 0 90 96" style="display:block;overflow:visible;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))">'+o+'</svg>';
}
function _svgCircle(badge){
  var bg=badge.bg||'#333',bg2=badge.bg2,tc=badge.text||'#fff',abbr=badge.abbr||'',design=badge.design||'solid';
  var cid='nc'+abbr.replace(/[^a-zA-Z0-9]/g,'');
  var o='<circle cx="45" cy="45" r="40" fill="'+bg+'"/>';
  if(bg2){
    o+='<clipPath id="'+cid+'"><circle cx="45" cy="45" r="40"/></clipPath>';
    if(design==='split-v'){o+='<rect x="45" y="0" width="45" height="90" fill="'+bg2+'" clip-path="url(#'+cid+')"/>';}
    else if(design==='split-h'){o+='<rect x="0" y="45" width="90" height="45" fill="'+bg2+'" clip-path="url(#'+cid+')"/>';}
    else if(design==='stripes'){o+='<g clip-path="url(#'+cid+')">';for(var j=0;j<9;j++){if(j%2===1)o+='<rect x="'+(j*10)+'" y="0" width="10" height="90" fill="'+bg2+'"/>';}o+='</g>';}
    else if(design==='quarters'){o+='<rect x="0" y="0" width="45" height="45" fill="'+bg2+'" clip-path="url(#'+cid+')"/>';o+='<rect x="45" y="45" width="45" height="45" fill="'+bg2+'" clip-path="url(#'+cid+')"/>';}
  }
  o+='<circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>';
  o+='<circle cx="45" cy="45" r="31" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>';
  o+='<text x="45" y="45" text-anchor="middle" dominant-baseline="middle" font-family="\'Fredoka One\',cursive" font-size="16" fill="'+tc+'" letter-spacing="0.5">'+abbr+'</text>';
  return '<svg width="90" height="90" viewBox="0 0 90 90" style="display:block;overflow:visible;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))">'+o+'</svg>';
}
function _badgeFallback(el){
  var badge=JSON.parse(el.getAttribute('data-badge')||'{}');
  var pack=el.getAttribute('data-pack')||'flags';
  var svg=pack==='nba'?_svgCircle(badge):_svgShield(badge);
  var wrap=document.createElement('div');
  wrap.style.cssText='z-index:1;position:relative;width:90px;height:90px;display:flex;align-items:center;justify-content:center';
  wrap.innerHTML=svg;
  if(el.parentNode)el.parentNode.replaceChild(wrap,el);
}
function renderSilhouetteVisual(q,size,muted){
  size=size||112;
  var img=q&&q.silhouette?q.silhouette:'';
  return '<div class="silhouette-visual '+(muted?'muted':'')+'" style="width:'+size+'px;height:'+size+'px">'+
    (img?'<img src="'+img+'" width="'+size+'" height="'+size+'" alt="" loading="lazy"/>':'<span>?</span>')+
  '</div>';
}
function renderTinyItemVisual(item,unlocked,size){
  size=size||34;
  if(item&&item.silhouette)return renderSilhouetteVisual(item,size,!unlocked);
  if(item&&item.badge){
    return '<div style="width:'+size+'px;height:'+size+'px;background:'+(unlocked?item.badge.bg:'rgba(255,255,255,0.05)')+';border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:\'Fredoka One\',cursive;font-size:'+(size>36?12:9)+'px;color:'+(unlocked?item.badge.text:'rgba(255,255,255,0.2)')+';border:1px solid rgba(255,255,255,'+(unlocked?'0.2':'0.05')+')">'+(unlocked?item.badge.abbr:'?')+'</div>';
  }
  return '<span style="font-size:'+size+'px;line-height:1;'+(unlocked?'filter:drop-shadow(0 0 6px rgba(0,242,255,0.5))':'filter:grayscale(1);opacity:0.2')+'">'+(unlocked?(item&&item.flag||'🌍'):'🏳️')+'</span>';
}
function renderItemVisual(q){
  if(q.silhouette)return renderSilhouetteVisual(q,118,false);
  if(q.badge){
    var pack=G.pack||'flags';
    var abbr=(q.badge.abbr||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    var folder=pack==='nba'?'nba':'foot';
    var bd=JSON.stringify(q.badge).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return '<div style="z-index:1;position:relative;width:90px;height:90px;display:flex;align-items:center;justify-content:center">'+
      '<img src="assets/img/'+folder+'/'+abbr+'.svg" width="90" height="90" '+
      'style="object-fit:contain;display:block;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))" '+
      'data-badge="'+bd+'" data-pack="'+pack+'" onerror="_badgeFallback(this)"/></div>';
  }
  return '<span style="font-size:74px;z-index:1;position:relative">'+q.flag+'</span>';
}

// ── STATS STORAGE ──
function loadStats(){return loadStatsForPack(G.pack||'flags');}

function saveStats(stats) {
  try { localStorage.setItem(getPackStatsKey(G.pack||'flags'), JSON.stringify(stats)); } catch(e) {}
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
  var packConf=PACKS[G.pack||'flags']||PACKS.flags;
  var packData=getCurrentPackData();
  var stats=loadStats();
  var found=stats.foundFlags||[];
  var total=packData.length;
  var pct=Math.round(found.length/total*100);
  var zones=packConf.zones;
  var tab=G.passportTab||'ALL';

  var tabsHtml='<div class="trophy-tabs" style="gap:6px;padding:0 0 6px">';
  Object.keys(zones).forEach(function(k){
    var active=k===tab;
    var cnt=k==='ALL'?total:packData.filter(function(f){return f.continent===k;}).length;
    var fcnt=k==='ALL'?found.length:packData.filter(function(f){return f.continent===k&&found.indexOf(f.name)>-1;}).length;
    tabsHtml+='<button '+(active?'id="active-passport-tab" ':'')+' onclick="G.passportTab=\''+k+'\';render()" style="flex-shrink:0;padding:7px 12px;border-radius:20px;font-size:12px;font-weight:800;border:1.5px solid '+(active?'var(--accent-base)':'rgba(255,255,255,0.12)')+';background:'+(active?'rgba(79,172,254,0.12)':'rgba(255,255,255,0.03)')+';color:'+(active?'var(--accent-base)':'var(--text-muted)')+';-webkit-tap-highlight-color:transparent;cursor:pointer">'+zones[k]+' <span style="opacity:0.7">'+fcnt+'/'+cnt+'</span></button>';
  });
  tabsHtml+='</div>';

  var filtered=tab==='ALL'?packData:packData.filter(function(f){return f.continent===tab;});
  var gridHtml='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding-bottom:20px">';
  filtered.forEach(function(f){
    var unlocked=found.indexOf(f.name)>-1;
    var visual=renderTinyItemVisual(f,unlocked,44);
    gridHtml+='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid '+(unlocked?'rgba(0,242,255,0.2)':'rgba(255,255,255,0.05)')+'">'+
      visual+
      '<span style="font-size:8px;font-weight:800;text-align:center;line-height:1.2;color:'+(unlocked?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.2)')+';max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(unlocked?f.name:'???')+'</span>'+
    '</div>';
  });
  gridHtml+='</div>';

  app.innerHTML=
    '<div id="passport-screen" class="swipe-screen" style="position:fixed;inset:0;z-index:50;background:rgba(8,9,14,0.82);backdrop-filter:blur(14px) saturate(180%);-webkit-backdrop-filter:blur(14px) saturate(180%);display:flex;flex-direction:column;padding:env(safe-area-inset-top,0px) 10px env(safe-area-inset-bottom,0px)">'+
      '<div style="flex:0 0 auto;padding:10px 0 8px">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
          navBackButton('goSetup()')+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-family:Fredoka One,cursive;font-size:20px;background:'+packConf.gradient+';-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">'+packConf.passportTitle+'</div>'+
            '<div style="font-size:11px;color:var(--text-muted);font-weight:700">'+found.length+' / '+total+' '+packConf.passportSub+'</div>'+
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
    attachSwipeNav(document.getElementById('passport-screen'),{
      left:function(){shiftPassportTab(1);},
      right:function(){shiftPassportTab(-1);}
    });
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
    '<div class="trophy-grid">' +
    tierKeys.map(function(k) {
      var t = _getTrophyDisplay(k);
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

  var html = '<div id="trophy-screen" class="swipe-screen trophy-screen">'+
    // Header
    '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:10px">'+
      navBackButton('goBack()')+
      '<button onclick="resetGame()" style="background:rgba(255,71,87,0.08);border:1px solid rgba(255,71,87,0.3);border-radius:10px;padding:6px 10px;cursor:pointer;color:var(--danger);font-family:Nunito,sans-serif;font-size:11px;font-weight:800;-webkit-tap-highlight-color:transparent">🗑️ Reset</button>'+
    '</div>'+

    // XP compact (1 ligne)
    '<div style="background:rgba(255,255,255,0.04);border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:10px 12px;width:100%;margin-bottom:8px">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+
        '<img src="'+getTerrySkinSrc(terry_buste)+'" data-skin-base="'+terry_buste+'" width="36" height="36" class="active-skin" style="object-fit:contain;flex-shrink:0;'+terrySkinCss('drop-shadow(0 6px 12px rgba(0,0,0,0.35))')+'"/>'+
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
        '<div style="font-size:9px;font-weight:800;color:var(--text-muted)">'+(PACKS[G.pack||'flags']||PACKS.flags).itemLabelPlural.toUpperCase()+' /'+getCurrentPackData().length+'</div>'+
      '</div>'+
    '</div>'+

    // Onglets
    tabsHtml +

    '<div id="trophy-swipe-zone" class="trophy-swipe-zone">'+
      // Grille trophées
      trophyGridHtml +

      // Épreuve Platine (si onglet platine)
      platineHtml+
    '</div>'+
  '</div>';

  app.innerHTML = html;
  setTimeout(function(){
    var el=document.getElementById('active-trophy-tab');
    if(el)el.scrollIntoView({behavior:'instant',block:'nearest',inline:'center'});
    attachSwipeNav(document.getElementById('trophy-swipe-zone'),{
      left:function(){shiftTrophyTab(1);},
      right:function(){shiftTrophyTab(-1);}
    });
  },0);
}

function goBack() {
  G.screen = 'setup';
  render();
}


var isAdmin=false;
var G={screen:'setup',mode:'solo',diff:'easy',gameMode:'classic',
  players:[{name:'',score:0,lives:3,avatar:'🐯',color:'#4D96FF'}],
  cp:0,questions:[],surviePool:[],current:0,answered:false,
  timeLeft:0,maxTime:0,timerID:null,combo:0,errors:0,streak:0,
  shields:0,shieldsUsed:0,nowPlaying:'',loggedUser:null,guestMode:false,lastWon:false,
  _prevScreen:null,trophyTab:'bronze',passportTab:'ALL',username:null,duelId:null,duelRole:null,
  fatalFlag:null,newFlagsThisSession:0,speedCombo:0,questionStartTime:0,lastXpGain:0,lastLevelUp:null,lastNewTrophies:[],timedOut:false,lastCoinsGained:0,used5050:false,
  continent:'ALL',answerCount:4,localPlayerCount:2,pack:localStorage.getItem('flagmaster_active_pack')||'flags',galleryTab:'videos'};

function shuffle(a){
  var arr=a.slice();
  for(var i=arr.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;
  }
  return arr;
}
function getPool(){
  var data=getCurrentPackData();
  var base=G.diff==='easy'?data.filter(function(f){return f.lvl===1;}):G.diff==='medium'?data.filter(function(f){return f.lvl<=2;}):data;
  return(G.continent&&G.continent!=='ALL')?base.filter(function(f){return f.continent===G.continent;}):base;
}
function buildQ(q,pool){
  var data=getCurrentPackData();
  var n=(G.answerCount||4)-1;
  var wrongSrc=shuffle((pool||data).filter(function(f){return f.name!==q.name;}));
  if(wrongSrc.length<n)wrongSrc=shuffle(data.filter(function(f){return f.name!==q.name;}));
  var w=wrongSrc.slice(0,n);
  var built={flag:q.flag,badge:q.badge,silhouette:q.silhouette,name:q.name,lvl:q.lvl,continent:q.continent,choices:shuffle([q.name].concat(w.map(function(f){return f.name;})))};
  if(q.countryName)built.question='Capitale de '+q.countryName+' ?';
  return built;
}
function makePlayers(n){return Array.from({length:n},function(_,i){return{name:(G.players[i]?G.players[i].name:''),score:0,lives:MAX_LIVES,avatar:AVATARS[i],color:COLORS[i]};});}
function isLocalMode(){return G.mode==='local'||G.mode==='local2'||G.mode==='local4';}
function normalizeLocalMode(){
  if(G.mode==='local2'){G.mode='local';G.localPlayerCount=2;}
  if(G.mode==='local4'){G.mode='local';G.localPlayerCount=4;}
}
function getLocalPlayerCount(){
  normalizeLocalMode();
  var n=parseInt(G.localPlayerCount||2,10)||2;
  return Math.max(2,Math.min(4,n));
}

function _execRender(app){
  document.body.classList.remove('setup-active','auth-active','shop-active');
  if(G.screen==='shop')document.body.classList.add('shop-active');
  if(G.screen==='loading')renderLoading(app);
  else if(G.screen==='packSelect')renderPackSelect(app);
  else if(G.screen==='auth')renderAuth(app);
  else if(G.screen==='privacy')renderPrivacy(app);
  else if(G.screen==='setUsername')renderSetUsername(app);
  else if(G.screen==='setup')renderSetup(app);
  else if(G.screen==='game')renderGame(app);
  else if(G.screen==='trophies')renderTrophies(app);
  else if(G.screen==='passport')renderPassport(app);
  else if(G.screen==='duel')renderDuel(app);
  else if(G.screen==='shop')renderShop(app);
  else { renderEnd(app); }
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
    applyBackground();
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
          applyTerrySkinToDOM();
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
      applyTerrySkinToDOM();
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
  if(!_tryInitFirebase()){_setAuthError('Connexion indisponible. Réessaie dans un instant.');return;}
  _setAuthError('⏳ Vérification…');
  _fbReserveUsername(uid,val).then(function(){
    G.username=val;G.screen='setup';render();
  }).catch(function(e){_setAuthError(e.code==='flagmaster/username-taken'?e.message:'Erreur : '+(e.message||e.code));});
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
      '<button class="auth-btn auth-playnow" onclick="playNow()">🚀 Jouer maintenant</button>'+
      '<div class="auth-fast-note">Mode invité · sauvegarde locale sur cet appareil</div>'+
      '<input id="auth-email" type="email" placeholder="Email" class="auth-input" autocomplete="email"/>'+
      '<div style="position:relative;width:100%">'+
        '<input id="auth-password" type="password" placeholder="Mot de passe" class="auth-input" autocomplete="current-password" style="padding-right:48px;width:100%"/>'+
        '<button type="button" onclick="togglePwdVis()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;line-height:1;padding:4px;-webkit-tap-highlight-color:transparent" id="pwd-eye">👁️</button>'+
      '</div>'+
      '<button class="auth-btn primary" onclick="authSignIn()">Connexion</button>'+
      '<button class="auth-btn secondary" onclick="authSignUp()">Créer un compte</button>'+
      (isAdmin?'<div class="auth-sep"><span>ou</span></div>'+
      '<button class="auth-btn google" onclick="authGoogle()"><span class="auth-provider-icon">G</span>Continuer avec Google</button>'+
      '<button class="auth-btn apple" onclick="authApple()"><span class="auth-provider-icon">🍎</span>Continuer avec Apple</button>':'')+
      '<button class="auth-guest-link" onclick="authGuest()">Choisir un univers sans compte →</button>'+
      '<button class="auth-guest-link" onclick="openPrivacy(\'auth\')" style="opacity:0.75">Confidentialité</button>'+
    '</div>';
}

function openPrivacy(back){
  G.privacyBack=back||G.screen||'setup';
  G.screen='privacy';
  render();
}

function renderPrivacy(app){
  var back=G.privacyBack||'setup';
  document.body.classList.add('auth-active');
  app.innerHTML=
    '<div class="auth-card privacy-card">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%">'+
        navBackButton('G.screen=\''+back+'\';render()')+
        '<div style="font-family:Fredoka One,cursive;font-size:22px;color:#fff;flex:1;text-align:right">Confidentialité</div>'+
      '</div>'+
      '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:18px 16px;display:flex;flex-direction:column;gap:14px">'+
        '<div style="font-size:13px;color:var(--text-muted);line-height:1.55;font-weight:700">FlagMaster utilise le minimum de données nécessaire pour faire fonctionner la progression, les trophées, la sauvegarde et les achats intégrés.</div>'+
        _privacyRow('📱','Mode invité','La progression invitée reste sur cet appareil via le stockage local du navigateur/app.')+
        _privacyRow('☁️','Compte','Si tu te connectes, les scores et trophées peuvent être synchronisés avec Firebase.')+
        _privacyRow('🌍','Pays local','Une localisation approximative par pays peut être utilisée pour personnaliser certains trophées. Aucune position GPS précise n’est demandée.')+
        _privacyRow('🛒','Achats intégrés','Les futurs packs de coins et contenus premium passeront par l’App Store. FlagMaster ne collecte pas les informations de paiement.')+
        _privacyRow('🎵','Audio et haptique','La musique, les sons et les vibrations servent uniquement au feedback de jeu.')+
        _privacyRow('🔐','Contrôle','Tu peux jouer sans compte. La connexion sert seulement à sauvegarder et retrouver ta progression.')+
        _privacyRow('🛟','Support','Pour une suppression de données ou une question, utilise l’adresse/URL support qui sera publiée sur la fiche App Store.')+
        '<div style="font-size:10px;color:var(--text-muted);font-weight:800;opacity:0.75;text-align:center">Dernière mise à jour : 28 avril 2026</div>'+
      '</div>'+
      '<button class="auth-btn auth-playnow" onclick="G.screen=\''+back+'\';render()" style="min-height:50px;font-size:16px">Compris</button>'+
    '</div>';
}

function _privacyRow(icon,title,body){
  return '<div style="display:flex;align-items:flex-start;gap:12px">'+
    '<div style="width:34px;height:34px;border-radius:12px;background:rgba(79,172,254,0.11);border:1px solid rgba(79,172,254,0.24);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+icon+'</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div style="font-size:13px;font-weight:900;color:#fff;margin-bottom:2px">'+title+'</div>'+
      '<div style="font-size:11px;font-weight:700;color:var(--text-muted);line-height:1.45">'+body+'</div>'+
    '</div>'+
  '</div>';
}

function _setupHeader(){
  var u=G.loggedUser;
  var trophyBtn=
    '<button onclick="showTrophyScreen()" style="flex-shrink:0;background:rgba(255,215,0,0.08);border:1.5px solid rgba(255,215,0,0.3);border-radius:12px;padding:8px 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent">'+
      '<span style="font-size:18px;line-height:1">🏆</span>'+
    '</button>';
  var passportBtn=
    '<button onclick="G.screen=\'passport\';render()" style="flex-shrink:0;background:rgba(0,242,255,0.08);border:1.5px solid rgba(0,242,255,0.3);border-radius:12px;padding:8px 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent">'+
      '<span style="font-size:18px;line-height:1">📖</span>'+
    '</button>';
  var shopBtn=
    '<button class="home-shop-btn" onclick="openShop()" title="Boutique">'+
      '<span class="home-shop-icon">🛒</span>'+
      '<span class="home-shop-copy"><b>Boutique</b><small>'+formatCoins(loadCoins())+' 🪙</small></span>'+
    '</button>';
  var privacyBtn=
    '<button onclick="openPrivacy(\'setup\')" style="flex-shrink:0;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;padding:8px 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent">'+
      '<span style="font-size:18px;line-height:1">ℹ️</span>'+
    '</button>';
  if(u&&!G.guestMode){
    var st=loadStats(),lvl=getLevel(st.xp);
    var av=u.photoURL?
      '<img src="'+u.photoURL+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--accent-base);flex-shrink:0"/>':
      '<div class="profile-av" style="width:36px;height:36px;font-size:16px">'+((G.username||u.displayName||u.email||'?')[0].toUpperCase())+'</div>';
    var lvlIcon=lvl.title.split(' ')[0]||'🌱';
    return '<div class="setup-header" style="justify-content:space-between; width:100%; box-sizing:border-box;">'+
      '<div style="display:flex;align-items:center;gap:4px">'+
        av+
        '<span style="font-size:20px;flex-shrink:0" title="'+lvl.title+'">'+lvlIcon+'</span>'+
      '</div>'+
      '<div style="flex:1;display:flex;justify-content:center;">'+
        '<img src="'+getTerrySkinSrc(terry_accueil)+'" data-skin-base="'+terry_accueil+'" width="48" height="48" id="terry-header" class="terry-beat active-skin" style="object-fit:contain;flex-shrink:0"/>'+
      '</div>'+
      '<div style="display:flex;gap:4px;align-items:center;flex-shrink:0">'+shopBtn+passportBtn+trophyBtn+privacyBtn+'</div>'+
    '</div>';
  }
  return '<div class="setup-header" style="justify-content:space-between; width:100%; box-sizing:border-box;">'+
    '<div style="flex:1;display:flex;justify-content:flex-start;">'+
      '<img src="'+getTerrySkinSrc(terry_accueil)+'" data-skin-base="'+terry_accueil+'" width="48" height="48" id="terry-header" class="terry-beat active-skin" style="object-fit:contain;flex-shrink:0"/>'+
    '</div>'+
    '<div style="display:flex;gap:4px;align-items:center;flex-shrink:0">'+shopBtn+passportBtn+trophyBtn+privacyBtn+'</div>'+
  '</div>';
}

function _guestBanner(){
  if(!G.guestMode)return '';
  return '<div class="guest-banner">💾 <span>Connecte-toi pour sauvegarder ta progression</span>'+
    '<button onclick="G.guestMode=false;G.screen=\'auth\';render()">Se connecter</button></div>';
}

function isOnboardingDismissed(){
  try{return localStorage.getItem('flagmaster_onboarding_done')==='1';}catch(e){return false;}
}
function dismissOnboarding(){
  try{localStorage.setItem('flagmaster_onboarding_done','1');}catch(e){}
  render();
}
function startStarterQuest(){
  sfx('click');
  var packConf=PACKS[G.pack||'flags']||PACKS.flags;
  G.mode='solo';
  G.gameMode='classic';
  G.diff='easy';
  G.continent=packConf.startZone||((packConf.zones&&packConf.zones.EU)?'EU':'ALL');
  G.answerCount=4;
  try{localStorage.setItem('flagmaster_onboarding_done','1');}catch(e){}
  startGame();
}
function renderOnboardingCard(){
  var stats=loadStats();
  if(isOnboardingDismissed()||(stats.totalGames||0)>0)return '';
  var steps=[
    ['🕹️','Lance une partie','Facile Europe · 10 drapeaux'],
    ['🧭','Remplis ton passeport','Chaque bonne réponse compte'],
    ['🪙','Gagne des Globe-Coins','Débloque des skins Terry']
  ];
  return '<div class="starter-card">'+
    '<button class="starter-close" onclick="dismissOnboarding()">×</button>'+
    '<div class="starter-hero">'+
      '<img src="'+getTerrySkinSrc(terry_buste)+'" data-skin-base="'+terry_buste+'" class="starter-terry active-skin" style="'+terrySkinCss('drop-shadow(0 10px 18px rgba(31,86,127,0.26))')+'"/>'+
      '<div class="starter-copy">'+
        '<div class="starter-kicker">Nouvelle aventure</div>'+
        '<div class="starter-title">Bienvenue explorateur !</div>'+
        '<div class="starter-sub">Trouve tes premiers drapeaux et débloque tes premières récompenses.</div>'+
      '</div>'+
    '</div>'+
    '<div class="starter-steps">'+steps.map(function(s){
      return '<div class="starter-step"><span>'+s[0]+'</span><div><b>'+s[1]+'</b><small>'+s[2]+'</small></div></div>';
    }).join('')+'</div>'+
    '<button class="starter-play" onclick="startStarterQuest()">🚀 Commencer l’aventure</button>'+
  '</div>';
}

function getDailyDateKey(){
  var d=new Date();
  return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
}
function getDailyItem(){var data=getCurrentPackData();var d=Math.floor(Date.now()/86400000);return data[d%data.length];}
function getDailyKey(){
  return getDailyDateKey()+'_'+(G.pack||'flags');
}
function loadDailyRecord(){
  try{return JSON.parse(localStorage.getItem('flagmaster_daily_record')||'{}');}catch(e){return{};}
}
function saveDailyRecord(r){
  try{localStorage.setItem('flagmaster_daily_record',JSON.stringify(r||{}));}catch(e){}
}
function updateDailyRecord(result){
  if(!G.dailyChallenge)return null;
  var rec=loadDailyRecord(),key=G.dailyChallenge.key;
  var prev=rec[key]||{best:0,attempts:0,perfect:false};
  var score=result&&typeof result.score==='number'?result.score:0;
  var next={
    key:key,
    date:G.dailyChallenge.date,
    pack:G.dailyChallenge.pack,
    featured:G.dailyChallenge.featured,
    zone:G.dailyChallenge.zone,
    best:Math.max(prev.best||0,score),
    attempts:(prev.attempts||0)+1,
    perfect:!!(prev.perfect||score>=TOTAL),
    lastScore:score,
    updatedAt:Date.now()
  };
  rec[key]=next;
  saveDailyRecord(rec);
  return next;
}
function startDailyChallenge(){
  var daily=getDailyItem();
  var packConf=PACKS[G.pack||'flags']||PACKS.flags;
  var zone=packConf.dailyAllOnly?'ALL':((daily&&daily.continent)||'ALL');
  G.mode='solo';
  G.gameMode='classic';
  G.diff='medium';
  G.continent=zone;
  G.answerCount=4;
  G.dailyChallenge={
    key:getDailyKey(),
    date:getDailyDateKey(),
    pack:G.pack||'flags',
    featured:daily?daily.name:'',
    zone:(packConf.zones&&packConf.zones[zone])||'🌐 Monde'
  };
  startGame(true);
}
function renderDailyChallengeCard(){
  var daily=getDailyItem();
  var packConf=PACKS[G.pack||'flags']||PACKS.flags;
  var zoneLabel=packConf.dailyAllOnly?'🌐 Monde':((daily&&daily.continent&&packConf.zones[daily.continent])?packConf.zones[daily.continent]:'🌐 Monde');
  var rec=loadDailyRecord()[getDailyKey()]||null;
  var done=!!(rec&&rec.attempts);
  var visual=daily&&daily.silhouette?renderSilhouetteVisual(daily,38,false):(daily&&daily.badge?'<div style="width:34px;height:34px;background:'+daily.badge.bg+';border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:Fredoka One,cursive;font-size:11px;color:'+daily.badge.text+'">'+daily.badge.abbr+'</div>':'<span style="font-size:34px;line-height:1">'+(daily?daily.flag:'🌍')+'</span>');
  return '<button class="daily-card" onclick="startDailyChallenge()">'+
    '<div class="daily-visual">'+visual+'</div>'+
    '<div class="daily-copy">'+
      '<div class="daily-kicker">Défi du jour '+(done?'<span class="daily-done">fait</span>':'')+'</div>'+
      '<div class="daily-title">'+zoneLabel+'</div>'+
      '<div class="daily-sub">'+(daily?getDailyFeaturedText(daily)+' · ':'')+(done?'Meilleur '+rec.best+'/'+TOTAL+' · '+rec.attempts+' essai'+(rec.attempts>1?'s':''):'10 questions')+'</div>'+
    '</div>'+
    '<span class="daily-arrow">'+(done?'↻':'›')+'</span>'+
  '</button>';
}
function renderSetupContext(){
  var stats=loadStats(),daily=getDailyItem();
  var visual=daily.silhouette?renderSilhouetteVisual(daily,24,false):(daily.badge?'<div style="width:22px;height:22px;background:'+daily.badge.bg+';border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-family:\'Fredoka One\',cursive;font-size:8px;color:'+daily.badge.text+'">'+daily.badge.abbr+'</div>':'<span style="font-size:20px">'+daily.flag+'</span>');
  var dayBit='<div class="ctx-daily">'+visual+'<span class="ctx-key">'+getItemDisplayName(daily)+'</span></div>';
  if(G.mode==='solo'){
    return '<div class="ctx-band">'+
      '<div class="ctx-stat"><span class="ctx-val">'+stats.totalGames+'</span><span class="ctx-key">parties</span></div>'+
      '<div class="ctx-divider"></div>'+
      '<div class="ctx-stat"><span class="ctx-val">'+(stats.foundFlags?stats.foundFlags.length:0)+'</span><span class="ctx-key">'+(PACKS[G.pack||'flags']||PACKS.flags).itemLabelPlural+'</span></div>'+
      '<div class="ctx-divider"></div>'+
      '<div class="ctx-stat"><span class="ctx-val">'+(stats.streak||0)+'🔥</span><span class="ctx-key">jours</span></div>'+
      '<div class="ctx-divider"></div>'+
      dayBit+
    '</div>';
  }
  if(isLocalMode()){
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
      navBackButton('goSetup()')+
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

function renderPackSelect(app){
  app.innerHTML=
    '<div id="pack-select-screen" class="swipe-screen pack-select-screen">'+
    '<div style="text-align:center;padding-top:10px;margin-bottom:18px">'+
      '<img src="'+getTerrySkinSrc(terry_accueil)+'" data-skin-base="'+terry_accueil+'" width="72" height="72" class="terry-beat active-skin" style="object-fit:contain;margin:0 auto 10px;display:block;'+terrySkinCss('drop-shadow(0 6px 12px rgba(0,0,0,0.35))')+'"/>'+
      '<div style="font-family:Fredoka One,cursive;font-size:32px;background:linear-gradient(135deg,#ff4757,#e056fd,#00f2fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.1">Choisis ton Univers !</div>'+
      '<div style="font-size:11px;font-weight:800;color:var(--text-muted);letter-spacing:3px;text-transform:uppercase;margin-top:5px">Sélectionne un pack</div>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:12px;width:100%">'+
    Object.keys(PACKS).filter(function(key){return isAdmin||!(key==='football'||key==='nba');}).map(function(key){
      var pack=PACKS[key];
      var locked=(key==='football'||key==='nba')&&!isAdmin;
      var capitalsLocked=key==='capitals'&&!loadCapitalsUnlocked()&&!isAdmin;
      var silhouettesLocked=key==='silhouettes'&&!loadSilhouettesUnlocked()&&!isAdmin;
      var packData=getPackDataById(key);
      var stats=loadStatsForPack(key);
      var found=stats.foundFlags?stats.foundFlags.length:0;
      var total=packData.length;
      var pct=total>0?Math.round(found/total*100):0;
      var isActive=G.pack===key;
      if(locked){
        return '<div style="display:flex;align-items:center;gap:14px;padding:16px 18px;background:rgba(255,255,255,0.02);border:1.5px solid rgba(255,255,255,0.06);border-radius:20px;opacity:0.55;position:relative;overflow:hidden">'+
          '<span style="font-size:44px;flex-shrink:0;filter:grayscale(1)">'+pack.icon+'</span>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-family:Fredoka One,cursive;font-size:18px;color:#fff;margin-bottom:2px">'+pack.name+'</div>'+
            '<div style="font-size:11px;font-weight:700;color:var(--text-muted)">🏗️ En cours de construction</div>'+
          '</div>'+
          '<span style="font-size:20px">🔒</span>'+
        '</div>';
      }
      if(capitalsLocked||silhouettesLocked){
        var coins=loadCoins();
        var lockPrice=silhouettesLocked?900:250;
        var lockColor=silhouettesLocked?'#38bdf8':'#f9ca24';
        var packIap=(IAP_PRODUCTS.packs||[]).filter(function(p){return p.pack===key;})[0]||{storeId:'com.akatsuki.flagmaster.pack.'+key,label:'1,99 €'};
        var unlockCall=silhouettesLocked?'saveSilhouettesUnlocked()':'saveCapitalsUnlocked()';
        var unlockedMsg=silhouettesLocked?'Silhouettes du Monde débloqué ! 🗺️':'Carnet des Capitales débloqué ! 🏛️';
        var lore=silhouettesLocked?'Terry déplie les cartes secrètes : reconnais les pays uniquement à leur forme.':'Terry suit les lumières des grandes villes pour compléter son atlas secret.';
        return '<div style="display:flex;align-items:center;gap:14px;padding:16px 18px;background:'+lockColor+'08;border:1.5px solid '+lockColor+'44;border-radius:20px;position:relative;overflow:hidden">'+
          '<span style="font-size:44px;flex-shrink:0">'+pack.icon+'</span>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-family:Fredoka One,cursive;font-size:18px;color:#fff;margin-bottom:2px">'+pack.name+'</div>'+
            '<div style="font-size:11px;font-weight:800;color:'+lockColor+';line-height:1.35">'+lore+'</div>'+
            '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:7px">'+
              (coins>=lockPrice
                ? '<button onclick="sfx(\'click\');'+unlockCall+';saveCoins(loadCoins()-'+lockPrice+');showToast(\''+unlockedMsg+'\',\''+lockColor+'\');render()" style="padding:8px 12px;border-radius:11px;border:none;background:'+pack.gradient+';color:#fff;font-family:Fredoka One,cursive;font-size:12px;cursor:pointer;-webkit-tap-highlight-color:transparent">'+lockPrice+' 🪙</button>'
                : '<div style="font-size:11px;font-weight:700;color:'+lockColor+'99;align-self:center">'+lockPrice+' 🪙 requis · tu en as '+coins+'</div>')+
              '<button onclick="startIapPurchase(\''+packIap.storeId+'\')" style="padding:8px 12px;border-radius:11px;border:2px solid rgba(255,255,255,0.8);background:linear-gradient(135deg,#ff7a18,#facc15 62%,#22c55e);color:#fff;font-family:Fredoka One,cursive;font-size:12px;cursor:pointer;-webkit-tap-highlight-color:transparent">'+packIap.label+'</button>'+
            '</div>'+
          '</div>'+
        '</div>';
      }
      return '<button onclick="selectPack(\''+key+'\')" style="'+
        'display:flex;align-items:center;gap:14px;padding:16px 18px;'+
        'background:'+(isActive?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)')+';'+
        'border:1.5px solid '+(isActive?pack.accent:'rgba(255,255,255,0.08)')+';'+
        'border-radius:20px;cursor:pointer;text-align:left;width:100%;'+
        '-webkit-tap-highlight-color:transparent">'+
        '<span style="font-size:44px;flex-shrink:0">'+pack.icon+'</span>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-family:Fredoka One,cursive;font-size:18px;color:#fff;margin-bottom:2px">'+pack.name+'</div>'+
          '<div style="font-size:11px;font-weight:700;color:var(--text-muted)">'+pack.sub+'</div>'+
          '<div style="margin-top:7px;background:rgba(255,255,255,0.08);border-radius:6px;height:4px;overflow:hidden">'+
            '<div style="height:100%;border-radius:6px;background:'+pack.gradient+';width:'+pct+'%"></div>'+
          '</div>'+
          '<div style="font-size:10px;font-weight:700;color:var(--text-muted);margin-top:3px">'+found+' / '+total+' '+pack.passportSub+'</div>'+
        '</div>'+
        (isActive?'<span style="font-size:16px;font-weight:900;color:'+pack.accent+'">✓</span>':'<span style="font-size:20px;color:var(--text-muted)">›</span>')+
      '</button>';
    }).join('')+
    '</div>'+
    '</div>';
  setTimeout(function(){
    attachSwipeNav(document.getElementById('pack-select-screen'),{
      left:function(){sfx('click');enterActivePackFromSelect();}
    },{allowInteractive:true});
  },0);
}

function renderSetup(app){
  document.body.classList.add('setup-active');
  if(G.mode==='online'&&!isAdmin)G.mode='solo';
  normalizeLocalMode();
  var isLocal=isLocalMode();
  var n=isLocal?getLocalPlayerCount():1;
  if(G.players.length!==n)G.players=makePlayers(n);
  var modes=[['solo','🎮','Solo','Record'],['local','👥','Multijoueur local',isLocal?n+' joueurs':'2-4 joueurs']];
  var gmodes=[['classic','🏆','Classique','10q'],['chrono','⏱️','Chrono','Temps'],['survie','💀','Survie','0 erreur']];
  var modeGridCols='1fr 1fr';
  var _cAll=G.continent==='ALL';
  var diffs=[
    ['easy','😊','Facile',G.gameMode==='chrono'?'30s':(_cAll?'Europe':'Niv. 1')],
    ['medium','🌍','Moyen',G.gameMode==='chrono'?'60s':(_cAll?'Monde':'Niv. 1-2')],
    ['hard','🔥','Difficile',G.gameMode==='chrono'?'100s':(_cAll?'195 pays':'Tous')]
  ];
  var ERR=typeof ERR_PENALTY!=='undefined'?ERR_PENALTY:5;
  var packConf=PACKS[G.pack||'flags']||PACKS.flags;
  var zoneKeys=Object.keys(packConf.zones);
  var conts=zoneKeys.map(function(k){var lbl=packConf.zones[k];var sp=lbl.indexOf(' ');return sp>-1?[k,lbl.slice(0,sp),lbl.slice(sp+1)]:[k,lbl,''];});
  var pool=getPool();
  var activeZoneLabel=packConf.zones[G.continent]||packConf.zones.ALL||'🌐 Monde';
  var advancedOpen=G.continent!=='ALL'||G.answerCount!==4;

  app.innerHTML=
    _setupHeader()+
    '<div id="setup-swipe-zone" class="card" style="padding:0;width:100%;display:flex;flex-direction:column">'+
      '<div style="flex:1;min-height:0;overflow-y:auto;padding:12px 10px 4px;-webkit-overflow-scrolling:touch;scrollbar-width:none">'+
      _guestBanner()+
      renderOnboardingCard()+
      renderDailyChallengeCard()+
      '<button onclick="sfx(\'click\');G.screen=\'packSelect\';render()" style="display:flex;align-items:center;gap:8px;width:100%;padding:6px 10px;margin-bottom:8px;background:'+packConf.accent+'18;border:1px solid '+packConf.accent+'44;border-radius:10px;cursor:pointer;-webkit-tap-highlight-color:transparent">'+
        '<span style="font-size:16px">'+packConf.icon+'</span>'+
        '<span style="font-size:11px;font-weight:900;color:#fff;flex:1">'+packConf.name+'</span>'+
        '<span style="font-size:10px;font-weight:800;color:'+packConf.accent+'">Changer ›</span>'+
      '</button>'+
      '<div class="sec-label" style="font-size:11px;margin-bottom:7px">Format</div>'+
      '<div class="mode-grid" style="grid-template-columns:'+modeGridCols+';gap:7px;margin-bottom:10px">'+
      modes.map(function(m){return '<div class="mode-btn'+(G.mode===m[0]?' selected':'')+'" onclick="setMode(\''+m[0]+'\')" style="padding:11px 6px"><span class="mode-icon" style="font-size:24px;margin-bottom:4px">'+m[1]+'</span><div class="mode-label" style="font-size:13px">'+m[2]+'</div><div class="mode-sub" style="font-size:10px">'+m[3]+'</div></div>';}).join('')+'</div>'+

      (isLocal?
        '<div class="local-setup-panel">'+
          '<div class="local-count-row">'+[2,3,4].map(function(nb){return '<button class="local-count-btn'+(n===nb?' selected':'')+'" onclick="setLocalPlayerCount('+nb+')">'+nb+'</button>';}).join('')+'</div>'+
          '<div class="local-player-grid">'+G.players.map(function(p,i){return '<div class="player-row local-player-row"><div class="p-avatar" style="border-color:'+p.color+'">'+p.avatar+'</div><input class="p-input" placeholder="Joueur '+(i+1)+'" value="'+p.name+'" oninput="G.players['+i+'].name=this.value" maxlength="14"/></div>';}).join('')+'</div>'+
        '</div>'
      :'')+

      '<div class="sec-label" style="font-size:11px;margin-bottom:7px">Mode</div>'+
      '<div class="gmode-grid" style="gap:7px;margin-bottom:10px">'+
      gmodes.map(function(m){return '<div class="gmode-btn'+(G.gameMode===m[0]?' selected':'')+'" onclick="setGMode(\''+m[0]+'\')" style="padding:10px 6px"><span style="font-size:20px;display:block;margin-bottom:2px">'+m[1]+'</span><div style="font-size:12px;font-weight:800;color:var(--text)">'+m[2]+'</div><div style="font-size:10px;color:var(--text2)">'+m[3]+'</div></div>';}).join('')+'</div>'+
      (G.gameMode==='chrono'?'<div class="info-box" style="font-size:11px;padding:8px 10px;margin-bottom:9px;line-height:1.5">⏱️ Facile 30s • Moyen 60s • Difficile 100s • ✅ Bonne réponse = +2s • ❌ Erreur = -'+ERR+'s</div>':'')+
      (G.gameMode==='survie'?'<div class="info-box" style="font-size:11px;padding:8px 10px;margin-bottom:9px;line-height:1.5">💀 0 erreur = game over • 🛡️ /25 pays = +1 bouclier (max 3)</div>':'')+

      '<div class="sec-label" style="font-size:11px;margin-bottom:7px">Difficulté</div>'+
      '<div class="diff-row" style="gap:7px;margin-bottom:12px">'+
      diffs.map(function(d){return '<button class="diff-btn'+(G.diff===d[0]?' sel-'+d[0]:'')+'" onclick="setDiff(\''+d[0]+'\')" style="padding:10px 4px;font-size:12px">'+d[1]+' '+d[2]+'<br><span style="font-size:10px;font-weight:600;opacity:0.8">'+d[3]+'</span></button>';}).join('')+'</div>'+

      '<details class="advanced-options" '+(advancedOpen?'open':'')+'>'+
        '<summary>⚙️ Zone et réponses <span>'+activeZoneLabel+' · '+G.answerCount+' choix</span></summary>'+
      // ── Zone / Continent ──
      '<div class="sec-label" style="font-size:11px;margin-bottom:7px">'+packConf.icon+' Zone</div>'+
      '<div class="trophy-tabs" style="gap:6px;padding:0 0 6px" id="zone-tabs">'+
      conts.map(function(c){
        var active=G.continent===c[0];
        var pdata=getCurrentPackData();
        var total=c[0]==='ALL'?pdata.length:pdata.filter(function(f){return f.continent===c[0];}).length;
        return '<button'+(active?' id="active-zone-tab"':'')+' onclick="setContinent(\''+c[0]+'\')" style="flex-shrink:0;padding:7px 12px;border-radius:20px;font-size:12px;font-weight:800;border:1.5px solid '+(active?'var(--accent-base)':'rgba(255,255,255,0.12)')+';background:'+(active?'rgba(79,172,254,0.12)':'rgba(255,255,255,0.03)')+';color:'+(active?'var(--accent-base)':'var(--text-muted)')+';-webkit-tap-highlight-color:transparent;cursor:pointer;white-space:nowrap">'+c[1]+' '+c[2]+' <span style="opacity:0.6;font-size:10px">'+total+'</span></button>';
      }).join('')+
      '</div>'+
      '<div style="font-size:10px;color:'+(pool.length<(G.gameMode==='survie'?G.answerCount+1:TOTAL)?'var(--danger)':'var(--text-muted)')+';font-weight:700;margin-bottom:10px;padding:0 2px">'+
        (pool.length<(G.gameMode==='survie'?G.answerCount+1:TOTAL)?
          '⚠️ '+pool.length+' '+packConf.itemLabelPlural+' — pas assez pour lancer (min '+(G.gameMode==='survie'?G.answerCount+1:TOTAL)+')':
          '✓ '+pool.length+' '+packConf.itemLabel+(pool.length>1?'s':'')+' disponibles')+
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

      (isAdmin?'<details class="api-key-section" '+(claudeApiKey?'open':'')+'>'+
        '<summary>🤖 Claude AI <span style="opacity:0.5;font-size:9px;font-weight:600">'+(claudeApiKey?'✓ Activé — fun facts après chaque bonne réponse':'Fun facts après chaque bonne réponse')+'</span></summary>'+
        '<input id="claude-key-input" type="password" placeholder="Clé API Anthropic (sk-ant-…)" value="'+claudeApiKey+'" oninput="saveClaudeKey(this.value)"/>'+
        '<div style="font-size:10px;color:var(--text2);margin-top:5px;opacity:0.7">La clé est stockée localement sur cet appareil uniquement.</div>'+
      '</details>':'')+
      '</details>'+
      '</div>'+
      '<div class="setup-footer" style="flex-shrink:0;padding:6px 10px 10px;margin-top:0;border-top:1px solid rgba(255,255,255,0.07)">'+
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
    attachSwipeNav(document.getElementById('setup-swipe-zone'),{
      right:function(){sfx('click');goPackSelect();}
    },{allowInteractive:true});
  },0);
}
function showTrophyScreen(){sfx('click');G.screen='trophies';G.trophyTab='bronze';render();}
function setTrophyTab(t){sfx('click');G.trophyTab=t;render();}
function shiftTrophyTab(delta){
  var tabs=['bronze','silver','gold','platinum'];
  var i=Math.max(0,tabs.indexOf(G.trophyTab||'bronze'));
  if(delta<0&&i===0){sfx('click');goBack();return;}
  var next=tabs[Math.max(0,Math.min(tabs.length-1,i+delta))];
  if(next&&next!==G.trophyTab)setTrophyTab(next);
}
function shiftPassportTab(delta){
  var zones=Object.keys((PACKS[G.pack||'flags']||PACKS.flags).zones);
  var i=Math.max(0,zones.indexOf(G.passportTab||'ALL'));
  if(delta<0&&i===0){sfx('click');goSetup();return;}
  var next=zones[Math.max(0,Math.min(zones.length-1,i+delta))];
  if(next&&next!==G.passportTab){sfx('click');G.passportTab=next;render();}
}
function attachSwipeNav(el,handlers,opts){
  if(!el||el._flagMasterSwipeBound)return;
  el._flagMasterSwipeBound=true;
  opts=opts||{};
  if(!window._flagMasterSwipeClickGuard){
    window._flagMasterSwipeClickGuard=true;
    document.addEventListener('click',function(e){
      if(Date.now()-(window._flagMasterSwipeNavAt||0)<420){
        e.preventDefault();
        e.stopPropagation();
      }
    },true);
  }
  var sx=0,sy=0,st=0,tracking=false;
  el.addEventListener('touchstart',function(e){
    if(!e.touches||e.touches.length!==1)return;
    if(e.target&&e.target.closest&&e.target.closest(opts.allowInteractive?'input,textarea,select,video':'button,input,textarea,select,video'))return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now();tracking=true;
  },{passive:true});
  el.addEventListener('touchend',function(e){
    if(!tracking||!e.changedTouches||!e.changedTouches.length)return;
    tracking=false;
    var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Date.now()-st>700||Math.abs(dx)<54||Math.abs(dx)<Math.abs(dy)*1.25)return;
    window._flagMasterSwipeNavAt=Date.now();
    if(dx<0&&handlers.left)handlers.left();
    if(dx>0&&handlers.right)handlers.right();
  },{passive:true});
}

function renderShop(app){
  var coins=loadCoins();
  var modal=G.shopModal||null;

  function _hdr(backAction,title,sub){
    return '<div style="flex:0 0 auto;padding:10px 0 10px">'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        navBackButton(backAction)+
        '<div style="flex:1">'+
          '<div style="font-family:Fredoka One,cursive;font-size:20px;background:linear-gradient(135deg,#ffd700,#ff9f43);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">'+title+'</div>'+
          (sub?'<div style="font-size:10px;color:var(--text-muted);font-weight:700">'+sub+'</div>':'')+
        '</div>'+
        _coinsBadge()+
      '</div>'+
    '</div>';
  }

  var inner='';

  if(!modal){
    var unlockedBgs=loadShopUnlocked();
    var activeSkinId=loadTerrySkin();
    var activeSkinDef=TERRY_SKINS.filter(function(s){return s.id===activeSkinId;})[0];
    var puTotal=POWERUPS.reduce(function(acc,p){return acc+loadInv(p.id);},0);
    var galleryUnlocked=loadGalleryUnlocked();
    var unlockedSkins=loadSkinUnlocked();
    var unlockTotal=SHOP_ITEMS.length+TERRY_SKINS.length+1;
    var unlockCount=unlockedBgs.length+unlockedSkins.length+(galleryUnlocked?1:0);
    var unlockPct=Math.min(100,Math.round(unlockCount/unlockTotal*100));

    var cats=[
      {key:'backgrounds',icon:'🖼️',name:'Décors',sub:unlockedBgs.length+' débloqué(s)',accent:'rgba(79,172,254,0.18)',border:'rgba(79,172,254,0.45)'},
      {key:'skins',icon:'🎭',name:'Tenues Terry',sub:(activeSkinDef?activeSkinDef.name:'Terry Original')+' équipé',accent:'rgba(168,85,247,0.18)',border:'rgba(168,85,247,0.5)'},
      {key:'powerups',icon:'⚡',name:'Bonus',sub:'En stock : ×'+puTotal,accent:'rgba(255,165,0,0.16)',border:'rgba(255,165,0,0.45)'},
      {key:'gallery',icon:'🎨',name:'Galerie',sub:galleryUnlocked?'Débloquée ✓':'Verrouillée · 900 🪙',accent:'rgba(244,114,182,0.15)',border:'rgba(244,114,182,0.45)'}
    ];

    inner='<div style="margin-bottom:12px;border-radius:18px;border:1.5px solid rgba(255,215,0,0.22);background:linear-gradient(135deg,rgba(255,215,0,0.12),rgba(79,172,254,0.06));padding:14px 16px;box-shadow:0 4px 18px rgba(0,0,0,0.22)">'+
      '<div style="display:flex;align-items:center;gap:12px">'+
        '<div style="width:46px;height:46px;border-radius:15px;background:rgba(255,215,0,0.13);border:1px solid rgba(255,215,0,0.26);display:flex;align-items:center;justify-content:center;font-size:24px">🪙</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:10px;font-weight:900;color:rgba(255,215,0,0.72);letter-spacing:1.4px;text-transform:uppercase">Globe-Coins</div>'+
          '<div style="font-family:Fredoka One,cursive;font-size:24px;color:#ffd700;line-height:1">'+coins+'</div>'+
        '</div>'+
        '<div style="text-align:right">'+
          '<div style="font-size:10px;font-weight:900;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase">Collection</div>'+
          '<div style="font-family:Fredoka One,cursive;font-size:18px;color:#fff">'+unlockCount+'/'+unlockTotal+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="height:6px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden;margin-top:12px">'+
        '<div style="height:100%;width:'+unlockPct+'%;border-radius:999px;background:linear-gradient(90deg,#ffd700,#4facfe);box-shadow:0 0 12px rgba(255,215,0,0.45)"></div>'+
      '</div>'+
    '</div>'+
    renderNextShopGoal(getNextShopGoal(coins),false)+
    '<div style="display:flex;flex-direction:column;gap:12px">'+
      cats.map(function(c){
        return '<button onclick="sfx(\'click\');G.shopModal=\''+c.key+'\';_shopRender()" style="display:flex;align-items:center;gap:14px;padding:20px 18px;background:'+c.accent+';border:2px solid '+c.border+';border-radius:26px;cursor:pointer;text-align:left;width:100%;-webkit-tap-highlight-color:transparent;box-shadow:0 4px 20px rgba(0,0,0,0.3)">'+
          '<span style="font-size:38px;flex-shrink:0">'+c.icon+'</span>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-family:Fredoka One,cursive;font-size:17px;color:#fff;margin-bottom:3px">'+c.name+'</div>'+
            '<div style="font-size:11px;font-weight:700;color:var(--text-muted)">'+c.sub+'</div>'+
          '</div>'+
          '<span style="font-size:24px;color:rgba(255,255,255,0.3)">›</span>'+
        '</button>';
      }).join('')+
    '</div>';

    inner+='<div style="margin-top:16px">'+
      '<div style="font-size:11px;font-weight:900;color:rgba(255,215,0,0.75);letter-spacing:1.5px;margin-bottom:10px;text-transform:uppercase">💰 Packs Globe-Coins</div>'+
      '<div class="iap-coin-grid">'+
      IAP_PRODUCTS.coins.map(function(p){
        return '<div class="iap-coin-card">'+
          (p.badge?'<div class="iap-badge">'+p.badge+'</div>':'')+
          '<div style="font-size:24px;margin-bottom:6px">'+p.icon+'</div>'+
          '<div style="font-family:Fredoka One,cursive;font-size:14px;color:#b45309;margin-bottom:2px">'+p.coins+'🪙</div>'+
          '<div style="font-size:9px;font-weight:900;color:#52708d;margin-bottom:8px">'+p.name+'</div>'+
          '<button class="iap-buy-btn" onclick="startIapPurchase(\''+p.storeId+'\')">'+p.label+'</button>'+
        '</div>';
      }).join('')+
      '</div>'+
    '</div>'+
    '<div style="margin-top:16px">'+
      '<div style="font-size:11px;font-weight:900;color:rgba(168,85,247,0.78);letter-spacing:1.5px;margin-bottom:10px;text-transform:uppercase">🔓 Packs premium</div>'+
      '<div class="iap-pack-list">'+
      IAP_PRODUCTS.packs.map(function(p){
        var owned=(p.pack==='capitals'&&loadCapitalsUnlocked())||(p.pack==='gallery'&&loadGalleryUnlocked());
        return '<div class="iap-pack-card '+(owned?'owned':'')+'">'+
          '<div class="iap-pack-icon">'+p.icon+'</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">'+
              '<b>'+p.name+'</b>'+(p.badge?'<span>'+p.badge+'</span>':'')+
            '</div>'+
            '<small>'+p.sub+'</small>'+
          '</div>'+
          (owned?'<div class="iap-owned">Acquis</div>':'<button class="iap-pack-btn" onclick="startIapPurchase(\''+p.storeId+'\')">'+p.label+'</button>')+
        '</div>';
      }).join('')+
      '</div>'+
      '<button class="iap-restore-btn" onclick="restorePurchases()">Restaurer achats</button>'+
    '</div>';

    inner+='<div style="margin-top:12px;background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.15);border-radius:14px;padding:12px 14px">'+
      '<div style="font-size:11px;font-weight:900;color:rgba(255,215,0,0.7);margin-bottom:4px">💡 Gagner des Globe-Coins</div>'+
      '<div style="font-size:11px;color:var(--text-muted);line-height:1.6">Joue des parties, découvre de nouveaux pays et réussis les défis du jour.<br>Sans-faute, chrono parfait et longues séries donnent des bonus.</div>'+
    '</div>';

    if(G.loggedUser&&!G.guestMode){
      inner+='<div style="margin-top:6px">'+
        '<div style="font-size:10px;font-weight:900;color:var(--text-muted);letter-spacing:1.5px;margin-bottom:8px;text-transform:uppercase">👤 Compte</div>'+
        '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px">'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-weight:900;font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(G.username||(G.loggedUser.displayName)||(G.loggedUser.email||'Joueur'))+'</div>'+
            '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">'+(G.loggedUser.email||'')+'</div>'+
          '</div>'+
          '<button onclick="authSignOut()" style="flex-shrink:0;padding:9px 14px;border-radius:12px;border:1px solid rgba(255,71,87,0.3);background:rgba(255,71,87,0.08);color:var(--danger);font-family:Nunito,sans-serif;font-size:12px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent">↪️ Déco</button>'+
        '</div>'+
      '</div>';
    }

  } else if(modal==='backgrounds'){
    var unlocked2=loadShopUnlocked(),activeBg2=loadActiveBg();
    inner='<div class="shop-tip"><b>Décors</b><span>Achète puis équipe un décor pour changer le fond de l’accueil.</span></div>'+
    '<div class="shop-premium-grid">'+
      SHOP_ITEMS.map(function(item){
        var isUnlocked=unlocked2.indexOf(item.id)>-1,isActive=activeBg2===item.id,canBuy=!isUnlocked&&coins>=item.price;
        var blobsPrev='<div style="position:absolute;inset:0;overflow:hidden;border-radius:14px 14px 0 0"><div class="blob b1" style="width:120px;height:120px;opacity:0.42;pointer-events:none"></div><div class="blob b3" style="width:100px;height:100px;opacity:0.34;pointer-events:none;top:20%;left:40%"></div></div>';
        var previewDim='rgba(255,255,255,0.10)';
        var prevExtra=item.img?'<div style="position:absolute;inset:0;background-image:url('+item.img+');background-size:cover;background-position:center;border-radius:14px 14px 0 0"></div><div style="position:absolute;inset:0;background:'+previewDim+';border-radius:14px 14px 0 0"></div>':'';
        return '<div class="shop-premium-card '+(isActive?'active':'')+'" style="border-color:'+(isActive?'#ffd700':isUnlocked?'rgba(56,189,248,0.38)':'rgba(148,163,184,0.22)')+'">'+
          '<div class="shop-premium-preview" style="background:'+item.gradient+'">'+blobsPrev+prevExtra+
            '<div class="shop-rarity-wrap">'+rarityBadge(item.rarity)+'</div>'+
            (isActive?'<div class="shop-active-badge">ACTIF</div>':'')+
          '</div>'+
          '<div class="shop-card-body">'+
            '<div class="shop-card-title">'+item.name+'</div>'+
            '<div class="shop-card-desc">'+(item.desc||'Décor premium')+'</div>'+
            (item.price===0?'<div class="shop-price free">Offert</div>':'<div class="shop-price '+(isUnlocked?'ok':'cost')+'">'+(isUnlocked?'✓ Débloqué':'🪙 '+item.price)+'</div>')+
            '<div class="shop-card-action">'+
              (isActive?'<div class="shop-equipped">⭐ Équipé</div>':
              isUnlocked?'<button class="shop-action-btn equip" onclick="equipBg(\''+item.id+'\')" style="width:100%;padding:8px;border-radius:10px;border:2px solid rgba(255,255,255,0.8);background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:0 6px 12px rgba(14,165,233,0.22)">Équiper</button>':
              item.price===0?'<button class="shop-action-btn equip" onclick="sfx(\'click\');var u=loadShopUnlocked();u.push(\''+item.id+'\');saveShopUnlocked(u);saveActiveBg(\''+item.id+'\');applyBackground(true);render()" style="width:100%;padding:8px;border-radius:10px;border:2px solid rgba(255,255,255,0.8);background:linear-gradient(135deg,#38bdf8,#22c55e);color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent">Obtenir</button>':
              canBuy?'<button class="shop-action-btn buy" onclick="buyBg(\''+item.id+'\')" style="width:100%;padding:8px;border-radius:10px;border:2px solid rgba(255,255,255,0.85);background:linear-gradient(135deg,#ff7a18,#facc15);color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:0 6px 12px rgba(245,158,11,0.24)">🪙 Acheter '+item.price+'</button>':
              '<div class="shop-locked">'+item.price+' 🪙 requis</div>')+
            '</div>'+
          '</div>'+
        '</div>';
      }).join('')+
    '</div>';

  } else if(modal==='skins'){
    var su=loadSkinUnlocked(),activeSkin2=loadTerrySkin();
    inner='<div class="shop-premium-grid">'+
      TERRY_SKINS.map(function(skin){
        var isUnlocked=su.indexOf(skin.id)>-1,isActive=activeSkin2===skin.id,canBuy=!isUnlocked&&coins>=skin.price;
        return '<div class="shop-premium-card skin-card '+(isActive?'active':'')+'" style="border-color:'+(isActive?'#e056fd':isUnlocked?'rgba(224,86,253,0.36)':'rgba(148,163,184,0.22)')+'">'+
          '<div class="shop-premium-preview skin-preview">'+
            '<div class="shop-skin-glow"></div>'+
            '<div class="shop-rarity-wrap">'+rarityBadge(skin.rarity)+'</div>'+
            '<img src="'+(skin.src||terry_buste)+'" onerror="this.onerror=null;this.src=\''+terry_buste+'\'" style="height:88px;max-width:90%;object-fit:contain;filter:'+('drop-shadow(0 8px 14px rgba(0,0,0,0.32)) '+(skin.filter||'')).trim()+';transition:all 0.3s;z-index:2"/>'+
            (isActive?'<div class="shop-active-badge pink">ACTIF</div>':'')+
          '</div>'+
          '<div class="shop-card-body">'+
            '<div class="shop-card-title">'+skin.name+'</div>'+
            '<div class="shop-card-desc">'+(skin.desc||'Tenue premium')+'</div>'+
            (skin.price===0?'<div class="shop-price free">Offert</div>':'<div class="shop-price '+(isUnlocked?'ok':'gem')+'">'+(isUnlocked?'✓ Débloqué':'💎 '+skin.price)+'</div>')+
            '<div class="shop-card-action">'+
              (isActive?'<div class="shop-equipped pink">⭐ Équipé</div>':
              isUnlocked?'<button class="shop-action-btn equip" onclick="equipSkin(\''+skin.id+'\')" style="width:100%;padding:8px;border-radius:10px;border:2px solid rgba(255,255,255,0.8);background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:0 6px 12px rgba(168,85,247,0.22)">Équiper</button>':
              skin.price===0?'<button class="shop-action-btn equip" onclick="sfx(\'click\');var u=loadSkinUnlocked();u.push(\''+skin.id+'\');saveSkinUnlocked(u);saveTerrySkin(\''+skin.id+'\');applyTerrySkinToDOM();_shopRender()" style="width:100%;padding:8px;border-radius:10px;border:2px solid rgba(255,255,255,0.8);background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent">Obtenir</button>':
              canBuy?'<button class="shop-action-btn buy" onclick="buySkin(\''+skin.id+'\')" style="width:100%;padding:8px;border-radius:10px;border:2px solid rgba(255,255,255,0.85);background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:0 6px 12px rgba(168,85,247,0.24)">💎 Acheter '+skin.price+'</button>':
              '<div class="shop-locked">'+skin.price+' 🪙 requis</div>')+
            '</div>'+
          '</div>'+
        '</div>';
      }).join('')+
    '</div>';

  } else if(modal==='powerups'){
    inner='<div style="display:flex;flex-direction:column;gap:10px">'+
      POWERUPS.map(function(pu){
        var qty=loadInv(pu.id),canBuy=coins>=pu.price;
        return '<div style="border-radius:16px;border:1.5px solid rgba(79,172,254,0.2);background:rgba(79,172,254,0.04);padding:12px 14px;display:flex;align-items:center;gap:12px">'+
          '<div style="font-size:30px;flex-shrink:0">'+pu.icon+'</div>'+
          '<div style="flex:1">'+
            '<div style="font-weight:900;font-size:13px;color:#fff">'+pu.name+'</div>'+
            '<div style="font-size:10px;color:var(--text-muted);margin-top:1px">'+pu.desc+'</div>'+
            '<div style="font-size:11px;font-weight:800;color:#4facfe;margin-top:3px">En stock : ×'+qty+'</div>'+
          '</div>'+
          (canBuy?
            '<button class="shop-action-btn buy" onclick="buyPowerup(\''+pu.id+'\')" style="flex-shrink:0;padding:9px 14px;border-radius:12px;border:1px solid rgba(79,172,254,0.35);background:rgba(79,172,254,0.12);color:#4facfe;font-family:Nunito,sans-serif;font-size:12px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent">🪙 '+pu.price+'</button>':
            '<div style="flex-shrink:0;font-size:10px;color:#52708d;font-weight:900;text-align:center">'+pu.price+' 🪙<br>requis</div>')+
        '</div>';
      }).join('')+
    '</div>';

  } else { // gallery
    var galleryUnlocked2=loadGalleryUnlocked();
    if(!galleryUnlocked2){
      inner='<div style="border-radius:16px;border:2px solid rgba(224,86,253,0.2);background:rgba(224,86,253,0.04);padding:24px;text-align:center">'+
        '<div style="font-size:44px;margin-bottom:8px">🔒</div>'+
        '<div style="font-family:Fredoka One,cursive;font-size:16px;color:#e056fd;margin-bottom:6px">Galerie Verrouillée</div>'+
        '<div style="font-size:11px;color:rgba(255,255,255,0.45);max-width:220px;margin:0 auto 16px;line-height:1.6">Croquis, concept arts et boucles d\'animation de l\'univers FlagMaster.</div>'+
        (coins>=900
          ? '<button onclick="saveGalleryUnlocked();saveCoins(loadCoins()-900);showToast(\'Galerie débloquée ! 🎨\',\'#e056fd\');_shopRender()" style="padding:11px 24px;border-radius:14px;border:none;background:linear-gradient(135deg,#e056fd,#9b59b6);color:#fff;font-family:Fredoka One,cursive;font-size:16px;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:0 3px 16px rgba(224,86,253,0.4)">🔓 Débloquer · 900 🪙</button>'
          : '<div style="padding:10px 20px;border-radius:12px;background:rgba(255,255,255,0.54);color:#52708d;font-size:12px;font-weight:900">900 🪙 requis · tu en as '+coins+'</div>')+
      '</div>';
    } else {
      var gTab=G.galleryTab||'videos';
      var isEmpty=(gTab==='videos'&&GALLERY_VIDEOS.length===0)||(gTab==='art'&&GALLERY_ART.length===0);
      var tabContent='';
      if(gTab==='music'){
        var _equippedMusic=loadGalleryMusic();
        tabContent=
          '<div style="border-radius:14px;border:1.5px solid rgba(167,139,250,0.35);background:rgba(167,139,250,0.07);padding:16px;display:flex;align-items:center;gap:12px">'+
            '<div style="width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">🎵</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-weight:900;font-size:13px;color:#fff;margin-bottom:2px">MJ Steps</div>'+
              '<div style="font-size:10px;color:var(--text-muted)">Musique d\'ambiance alternative</div>'+
              '<div style="font-size:10px;color:#a78bfa;font-weight:700;margin-top:2px">'+(_equippedMusic==='MJ_STEPS'?'✓ Équipée — remplace l\'accueil':'Remplace la musique d\'accueil')+'</div>'+
            '</div>'+
            (_equippedMusic==='MJ_STEPS'?
              '<button onclick="saveGalleryMusic(null);startMusic(\'accueil\');showToast(\'Musique originale restaurée 🎵\',\'#a78bfa\');_shopRender()" style="flex-shrink:0;padding:9px 12px;border-radius:10px;border:1px solid rgba(167,139,250,0.5);background:rgba(167,139,250,0.15);color:#a78bfa;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent">Retirer</button>':
              '<button onclick="saveGalleryMusic(\'MJ_STEPS\');startMusic(\'accueil\');showToast(\'MJ Steps équipée ! 🎵\',\'#a78bfa\');_shopRender()" style="flex-shrink:0;padding:9px 12px;border-radius:10px;border:none;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent">Équiper</button>')+
          '</div>';
      } else if(isEmpty){
        var gIcon=gTab==='videos'?'🎬':'✏️',gLabel=gTab==='videos'?'Vidéos & Animations':'Concept Arts';
        tabContent='<div style="text-align:center;padding:28px 16px;color:rgba(255,255,255,0.3)"><div style="font-size:40px;margin-bottom:8px">'+gIcon+'</div><div style="font-size:12px;font-weight:900;color:rgba(255,255,255,0.45)">'+gLabel+' à venir</div></div>';
      } else if(gTab==='videos'){
        tabContent='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+GALLERY_VIDEOS.map(function(v){return '<div style="border-radius:12px;overflow:hidden;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08)"><div style="aspect-ratio:16/9;background:#111;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer" onclick="this.nextSibling.style.display=\'block\';this.style.display=\'none\'">▶️</div><video src="'+v.src+'" controls style="width:100%;display:none"></video><div style="padding:6px 8px;font-size:10px;font-weight:800;color:#fff">'+v.title+'</div></div>';}).join('')+'</div>';
      } else {
        tabContent='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+GALLERY_ART.map(function(a){return '<div style="border-radius:12px;overflow:hidden;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08)"><img src="'+a.src+'" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover"/><div style="padding:6px 8px;font-size:10px;font-weight:800;color:#fff">'+a.title+'</div></div>';}).join('')+'</div>';
      }
      var _gTs='flex:1;padding:8px 6px;border-radius:11px;font-family:Nunito,sans-serif;font-size:10px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent;border:1.5px solid ';
      inner='<div style="display:flex;gap:6px;margin-bottom:12px">'+
        '<button onclick="G.galleryTab=\'videos\';_shopRender()" style="'+_gTs+(gTab==='videos'?'rgba(224,86,253,0.6);background:rgba(224,86,253,0.12);color:#e056fd':'rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4)')+'">🎬 Vidéos</button>'+
        '<button onclick="G.galleryTab=\'art\';_shopRender()" style="'+_gTs+(gTab==='art'?'rgba(224,86,253,0.6);background:rgba(224,86,253,0.12);color:#e056fd':'rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4)')+'">🎨 Art</button>'+
        '<button onclick="G.galleryTab=\'music\';_shopRender()" style="'+_gTs+(gTab==='music'?'rgba(167,139,250,0.7);background:rgba(167,139,250,0.14);color:#a78bfa':'rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4)')+'">🎵 Musique</button>'+
      '</div>'+tabContent;
    }
  }

  var modalTitles={backgrounds:'🖼️ Décors',skins:'🎭 Tenues Terry',powerups:'⚡ Bonus',gallery:'🎨 Galerie'};
  app.innerHTML=
    '<div id="shop-screen" class="swipe-screen" style="position:fixed;inset:0;z-index:50;background:rgba(8,9,14,0.88);backdrop-filter:blur(14px) saturate(180%);-webkit-backdrop-filter:blur(14px) saturate(180%);display:flex;flex-direction:column;padding:env(safe-area-inset-top,0px) 10px env(safe-area-inset-bottom,0px)">'+
      _hdr(
        modal?'G.shopModal=null;_shopRender()':'G.screen=\'setup\';G.shopModal=null;render()',
        modal?modalTitles[modal]:'Boutique',
        modal?null:'Personnalise ton expérience'
      )+
      '<div style="flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:20px;display:flex;flex-direction:column;gap:12px">'+
        inner+
      '</div>'+
    '</div>';
  setTimeout(function(){
    attachSwipeNav(document.getElementById('shop-screen'),{
      right:function(){
        sfx('click');
        if(modal){G.shopModal=null;_shopRender();return;}
        goSetup();
      }
    },{allowInteractive:true});
  },0);
}

var GALLERY_VIDEOS=[];
var GALLERY_ART=[];

function resetGame(){
  sfx('click');
  if(document.getElementById('reset-modal-overlay')) return;
  var modal=document.createElement('div');
  modal.id='reset-modal-overlay';
  modal.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);padding:20px';
  modal.innerHTML=
    '<div style="background:linear-gradient(135deg,#1a0a0a,#2a0808);border:2px solid var(--danger);border-radius:24px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 0 40px rgba(255,71,87,0.4)">'+
    '<div style="font-size:48px;margin-bottom:8px">⚠️</div>'+
    '<div style="font-family:Fredoka One,cursive;font-size:22px;color:var(--danger);margin-bottom:8px">Réinitialiser ?</div>'+
    '<div style="font-size:13px;color:var(--text2);margin-bottom:22px;line-height:1.6">Toute ta progression sera effacée :<br>trophées, XP, statistiques, streak, pays trouvés.<br><strong style="color:#fff">Cette action est irréversible.</strong></div>'+
    '<div style="display:flex;gap:12px">'+
      '<button onclick="closeResetModal()" style="flex:1;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#fff;font-family:Nunito,sans-serif;font-size:15px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent">Annuler</button>'+
      '<button onclick="confirmReset()" style="flex:1;padding:14px;border-radius:16px;border:none;background:var(--danger);color:#fff;font-family:Nunito,sans-serif;font-size:15px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent">Confirmer</button>'+
    '</div>'+
    '</div>';
  document.body.appendChild(modal);
}

function closeResetModal(){
  var m=document.getElementById('reset-modal-overlay');
  if(m&&m.parentNode)m.parentNode.removeChild(m);
}

function confirmReset(){
  closeResetModal();
  try{localStorage.removeItem('flagmaster_stats');}catch(e){}
  if(G.loggedUser&&G.loggedUser.uid&&_fbReady)try{
    if(G.username)_db.collection('usernames').doc(_usernameKey(G.username)).delete().catch(function(){});
    _db.collection('users').doc(G.loggedUser.uid).delete().catch(function(){});
  }catch(e){}
  sfx('gameover');
  var toast=document.createElement('div');
  toast.style.cssText='position:fixed;bottom:30px;left:50%;transform:translateX(-50%);z-index:999999;background:#1a1a2e;border:1px solid var(--success);border-radius:16px;padding:12px 24px;color:var(--success);font-family:Nunito,sans-serif;font-size:14px;font-weight:800;animation:trophySlideIn 0.4s ease';
  toast.textContent='✓ Progression réinitialisée !';
  document.body.appendChild(toast);
  setTimeout(function(){toast.remove();},2500);
  render();
}

function setMode(m){
  sfx('click');
  if(m==='local2'||m==='local4'){G.localPlayerCount=m==='local4'?4:2;m='local';}
  G.mode=m;
  var n=m==='local'?getLocalPlayerCount():1;
  if(m!=='online')G.players=makePlayers(n);
  render();
}
function setLocalPlayerCount(n){
  sfx('click');
  G.mode='local';
  G.localPlayerCount=Math.max(2,Math.min(4,parseInt(n||2,10)||2));
  G.players=makePlayers(G.localPlayerCount);
  render();
}
function setDiff(d){sfx('click');G.diff=d;render();}
function setGMode(g){sfx('click');G.gameMode=g;render();}
function setContinent(c){sfx('click');G.continent=c;render();}
function setAnswerCount(n){sfx('click');G.answerCount=n;render();}

function startGame(isDaily){
  sfx('click');
  if(!isDaily)G.dailyChallenge=null;
  normalizeLocalMode();
  if(isLocalMode()){
    G.localPlayerCount=getLocalPlayerCount();
    if(G.players.length<2){
      showToast('Choisis au moins 2 joueurs !','#ff4757');
      return;
    }
  }
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
    _t.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999999;background:rgba(20,10,10,0.97);border:1.5px solid var(--danger);border-radius:18px;padding:18px 22px;color:#fff;font-family:Nunito,sans-serif;font-size:14px;font-weight:800;text-align:center;max-width:270px;line-height:1.5;box-shadow:0 0 40px rgba(255,71,87,0.4)';
    var packConf=PACKS[G.pack||'flags']||PACKS.flags;
    _t.innerHTML='⚠️ Pas assez de '+packConf.itemLabelPlural+' !<br><span style="font-size:12px;font-weight:600;color:var(--text-muted)">'+pool.length+' disponibles, '+minPool+' requis.<br>Augmente la difficulté ou change de zone.</span>';
    document.body.appendChild(_t);
    setTimeout(function(){_t.remove();},3000);
    return;
  }
  G.combo=0;G.errors=0;G.streak=0;G.shields=0;G.shieldsUsed=0;G.current=0;G.cp=0;G.answered=false;G.lastWon=false;G.speedCombo=0;G.questionStartTime=0;G.fatalFlag=null;G.newFlagsThisSession=0;G.timedOut=false;G.used5050=false;
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
  // tic-tac + haptic heartbeat on each second crossing in last 10s
  if(G.timeLeft>0&&G.timeLeft<=10&&Math.ceil(G.timeLeft)<Math.ceil(prev)){
    _ticTac();
    hapticImpact(G.timeLeft<=5?'HEAVY':'MEDIUM');
  }
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
    platineSession:G.platineSession||false,
    daily:!!G.dailyChallenge
  };
  G.lastDailyRecord=updateDailyRecord(result);

  // Nouveaux drapeaux découverts cette session
  var _prevFoundFlags=loadStats().foundFlags||[];
  G.newFlagsThisSession=foundInGame.filter(function(n){return _prevFoundFlags.indexOf(n)===-1;}).length;

  // Update stats and check trophies
  var updated=updateStatsAfterGame(result);

  // Globe-Coins
  var _coinsBefore=loadCoins();
  G.lastCoinsBefore=_coinsBefore;
  G.lastShopGoalBefore=getNextShopGoal(_coinsBefore);
  var _coinReward=calculateCoinReward(result);
  if(_coinReward.amount>0)addCoins(_coinReward.amount);
  G.lastCoinsAfter=loadCoins();
  G.lastCoinsGained=_coinReward.amount;
  G.lastCoinParts=_coinReward.parts||[];
  G.lastShopGoal=getNextShopGoal(G.lastCoinsAfter);

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
function requestAbandon(){
  sfx('click');
  if(document.getElementById('abandon-modal-overlay'))return;
  var modal=document.createElement('div');
  modal.id='abandon-modal-overlay';
  modal.className='confirm-overlay';
  modal.innerHTML=
    '<div class="confirm-card">'+
      '<div class="confirm-icon">⏸️</div>'+
      '<div class="confirm-title">Quitter la partie ?</div>'+
      '<div class="confirm-copy">Ta partie en cours sera arrêtée et tu reviendras au menu.</div>'+
      '<div class="confirm-actions">'+
        '<button class="confirm-btn ghost" onclick="closeAbandonModal()">Continuer</button>'+
        '<button class="confirm-btn danger" onclick="closeAbandonModal();abandon()">Quitter</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(modal);
}
function closeAbandonModal(){
  var m=document.getElementById('abandon-modal-overlay');
  if(m&&m.parentNode)m.parentNode.removeChild(m);
}

function goHome(){
  if(G.timerID){clearInterval(G.timerID);G.timerID=null;}
  stopMusic();hideTerry();G.screen='setup';
  setTimeout(function(){startMusic('accueil');},150);
  render();
}

function getEndPerformance(score,total,mode,won){
  var ratio=total?score/total:0;
  if(mode==='survie'){
    if(score>=60)return {icon:'🌍',title:'Explorateur légende',copy:'Grosse série, grosse maîtrise.',color:'#22c55e'};
    if(score>=25)return {icon:'🏆',title:'Très solide',copy:'Tu tiens la route sous pression.',color:'#f59e0b'};
    return {icon:'🛡️',title:'Encore une série',copy:'Relance et vise le prochain palier.',color:'#0ea5e9'};
  }
  if(mode==='chrono'){
    if(score>=total)return {icon:'⚡',title:'Chrono parfait',copy:'Rapide, propre, efficace.',color:'#f59e0b'};
    if(score>=Math.ceil(total*0.7))return {icon:'⏱️',title:'Bon rythme',copy:'Quelques secondes et ça passe.',color:'#0ea5e9'};
    return {icon:'🎯',title:'Échauffement',copy:'Une relance et tu grattes du temps.',color:'#8b5cf6'};
  }
  if(ratio>=1)return {icon:'👑',title:'Sans-faute',copy:'Terry valide. C’est propre.',color:'#f59e0b'};
  if(ratio>=0.8)return {icon:'🌟',title:'Excellent run',copy:'Tu es à deux doigts du parfait.',color:'#22c55e'};
  if(ratio>=0.6)return {icon:'👏',title:'Bonne mission',copy:'La base est là, on consolide.',color:'#0ea5e9'};
  if(won)return {icon:'🚀',title:'Mission terminée',copy:'Pas parfait, mais ça avance.',color:'#8b5cf6'};
  return {icon:'🔁',title:'Revanche ouverte',copy:'Le meilleur run est juste après.',color:'#ef4444'};
}

function renderPerformanceCard(perf,score,total){
  return '<div class="result-performance" style="--result-color:'+perf.color+'">'+
    '<div class="result-performance-icon">'+perf.icon+'</div>'+
    '<div class="result-performance-copy">'+
      '<b>'+perf.title+'</b>'+
      '<span>'+perf.copy+'</span>'+
    '</div>'+
    '<div class="result-performance-score">'+score+(total?'/'+total:'')+'</div>'+
  '</div>';
}

function getNextRunMission(score,total,mode,won){
  if(mode==='survie'){
    var next=score<10?10:score<25?25:score<50?50:score<100?100:score+25;
    return {icon:'🔥',title:'Prochaine série',copy:'Tiens jusqu’à '+next+' bonnes réponses.',tag:'Objectif '+next};
  }
  if(mode==='chrono'){
    if(score>=total)return {icon:'⚡',title:'Mission expert',copy:'Refais le parfait avec moins d’erreurs.',tag:'Run propre'};
    var chronoTarget=Math.min(total,Math.max(score+2,Math.ceil(total*0.7)));
    return {icon:'⏱️',title:'Prochaine mission',copy:'Passe à '+chronoTarget+'/'+total+' avant la fin du temps.',tag:chronoTarget+'/'+total};
  }
  if(score>=total)return {icon:'👑',title:'Mission prestige',copy:'Garde le sans-faute et monte la difficulté.',tag:'Sans-faute'};
  var target=Math.min(total,score<6?6:score<8?8:10);
  return {icon:'🎯',title:'Prochaine mission',copy:'Vise '+target+'/'+total+' sur le prochain run.',tag:target+'/'+total};
}

function renderNextRunMission(score,total,mode,won){
  var m=getNextRunMission(score,total,mode,won);
  return '<div class="result-mission">'+
    '<div class="result-mission-icon">'+m.icon+'</div>'+
    '<div class="result-mission-copy">'+
      '<b>'+m.title+'</b>'+
      '<span>'+m.copy+'</span>'+
    '</div>'+
    '<div class="result-mission-tag">'+m.tag+'</div>'+
  '</div>';
}

function renderEndLootCard(){
  var gained=G.lastCoinsGained||0;
  var before=typeof G.lastCoinsBefore==='number'?G.lastCoinsBefore:Math.max(0,loadCoins()-gained);
  var after=typeof G.lastCoinsAfter==='number'?G.lastCoinsAfter:loadCoins();
  var goal=G.lastShopGoalBefore||G.lastShopGoal||getNextShopGoal(after);
  var progress='';
  if(goal){
    var fromPct=Math.min(100,Math.round(before/goal.price*100));
    var toPct=Math.min(100,Math.round(after/goal.price*100));
    var left=Math.max(0,goal.price-after);
    progress='<div class="loot-goal-row">'+
      '<span>'+goal.icon+' '+goal.name+'</span>'+
      '<b>'+left+' 🪙 restantes</b>'+
    '</div>'+
    '<div class="loot-track"><div class="loot-track-before" style="width:'+fromPct+'%"></div><div class="loot-track-after" style="width:'+toPct+'%"></div></div>';
  } else {
    progress='<div class="loot-goal-row complete"><span>🏆 Collection au top</span><b>Objectifs majeurs débloqués</b></div>';
  }
  return '<div class="result-loot-card">'+
    '<div class="result-loot-top">'+
      '<div class="result-loot-icon">🪙</div>'+
      '<div class="result-loot-copy">'+
        '<b>'+(gained>0?'+'+gained+' Globe-Coin'+(gained>1?'s':''):'Pas de coins cette fois')+'</b>'+
        '<span>Total : '+after+' 🪙'+(G.lastCoinParts&&G.lastCoinParts.length?' · '+G.lastCoinParts.join(' · '):'')+'</span>'+
      '</div>'+
      '<button class="result-loot-shop" onclick="openShop()">Shop</button>'+
    '</div>'+
    progress+
  '</div>';
}

function renderGame(app){
  var p=G.players,cp=G.cp;
  var q=G.gameMode==='survie'?G.surviePool[G.current%G.surviePool.length]:G.questions[G.current];

  // BUSTE = Image 7 GIF = neutre souriant → avatar dans la barre de jeu
  var terrySmall='<img src="'+getTerrySkinSrc(terry_buste)+'" data-skin-base="'+terry_buste+'" width="34" height="34" class="active-skin" style="object-fit:contain;border-radius:50%;'+terrySkinCss('drop-shadow(0 2px 6px rgba(0,0,0,0.4))')+'"/>';

  var topBar='';
  if(p.length===1){
    // Solo
	    topBar='<div class="top-bar">'+
	      '<div class="p-tag active">'+terrySmall+
	      '<span class="p-tag-name">'+p[0].name+'</span>'+
	      '<span class="p-tag-score">'+p[0].score+'pts</span></div>'+
	      '<div class="game-status-actions">'+
	        (G.gameMode==='classic'?'<span class="life-hearts">'+'❤️'.repeat(p[0].lives)+'🖤'.repeat(MAX_LIVES-p[0].lives)+'</span>':'')+
	        (G.gameMode==='survie'&&G.shields>0?'<span class="life-hearts">'+'🛡️'.repeat(G.shields)+'</span>':'')+
	        '<button class="game-music-btn" onclick="toggleMusic()">'+(musicOn?'🔊':'🔇')+'</button>'+
	        '<button class="abandon-btn" onclick="requestAbandon()">✕ Quitter</button>'+
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
	          '<div style="min-width:0">'+
	            '<div style="font-size:11px;font-weight:800;color:'+(isActive?pl.color:'var(--text)')+';max-width:55px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+pl.name+'</div>'+
	            '<div class="life-hearts mini">'+hearts+'</div>'+
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
      '<button class="abandon-btn" onclick="requestAbandon()">✕</button>'+
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
      '<div class="flag-circle"><div class="flag-glow"></div>'+renderItemVisual(q)+'</div>'+
      '<div id="terry-slot" class="terry-slot"></div>'+
      '</div>'+
      '<div class="q-text">'+(q.question||(PACKS[G.pack||'flags']||PACKS.flags).question)+'</div>'+
      '<div class="options'+(q.choices.length===6?' options-six':'')+'" id="opts">'+q.choices.map(function(c){return '<button class="opt-btn" onclick="choose(this,\''+c.replace(/'/g,"\\'")+'\')">'+c+'</button>';}).join('')+'</div>'+
      (G.gameMode==='survie'&&G.shields>0?'<button class="shield-btn" onclick="useShield()">🛡️ Bouclier ('+G.shields+') — -20% score</button>':'')+
      (!G.used5050&&loadInv('p5050')>0?'<button class="shield-btn" style="background:rgba(224,86,253,0.12);border-color:rgba(224,86,253,0.4);color:#e056fd" onclick="use5050()">✂️ 50/50  ×'+loadInv('p5050')+'</button>':'')+
      (G.gameMode==='chrono'&&loadInv('sablier')>0?'<button class="shield-btn" style="background:rgba(79,172,254,0.12);border-color:rgba(79,172,254,0.4);color:#4facfe" onclick="useSablier()">⏳ Sablier  ×'+loadInv('sablier')+'</button>':'')+
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
    G.fatalFlag={flag:q.flag,name:q.name,badge:q.badge,silhouette:q.silhouette};
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
    var packConf=PACKS[G.pack||'flags']||PACKS.flags;
    var discoveryLabel=nf>1?(packConf.discoveryPlural||packConf.itemLabelPlural):(packConf.discoverySingular||packConf.itemLabel);
    var lc=lvl.color||'#00f2ff';
    var lr=parseInt(lc.slice(1,3),16),lg=parseInt(lc.slice(3,5),16),lb=parseInt(lc.slice(5,7),16);
    var perf=getEndPerformance(sc,TOTAL,G.gameMode,won);

    var _isTimedOut=G.gameMode==='chrono'&&G.timedOut;
    var _endTitle=_isTimedOut?'TEMPS ÉCOULÉ !':'FIN DE MANCHE';
    var _endColor=_isTimedOut?'#ff9f43':'#ff4757';
    var _endGlow=_isTimedOut?'rgba(255,159,67,0.5)':'rgba(255,71,87,0.5)';

    app.innerHTML=
      '<div style="position:fixed;inset:0;z-index:50;background:linear-gradient(180deg,rgba(24,49,83,0.74),rgba(14,165,233,0.26));backdrop-filter:blur(12px) saturate(170%);-webkit-backdrop-filter:blur(12px) saturate(170%);display:flex;flex-direction:column;align-items:center;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:env(safe-area-inset-top,0px) 16px env(safe-area-inset-bottom,0px)">'+
        '<div style="margin-top:16px;margin-bottom:6px">'+
          '<img src="'+terry_gameover+'" width="130" height="130" style="object-fit:contain;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.5));animation:reactionPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)"/>'+
        '</div>'+
        // Titre
        '<div style="font-family:Fredoka One,cursive;font-size:'+(sc===0&&_isTimedOut?'24':'30')+'px;color:'+_endColor+';letter-spacing:2px;animation:debriefPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275);text-shadow:0 0 20px '+_endGlow+'">'+_endTitle+'</div>'+
        // Score
        '<div id="debrief-score" class="debrief-score" style="--debrief-color:'+lc+';--debrief-rgb:'+lr+','+lg+','+lb+';animation:debriefScore 0.6s 0.15s cubic-bezier(0.175,0.885,0.32,1.275) both">0</div>'+
        '<div style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:800;letter-spacing:1px;margin-bottom:2px;animation:debriefFade 0.4s 0.3s both">'+scoreLabel.replace('/','/ ')+'</div>'+
        // Rang
        '<div style="font-size:15px;font-weight:900;color:'+lc+';margin-bottom:16px;letter-spacing:1px;animation:debriefFade 0.4s 0.35s both;text-shadow:0 0 10px rgba('+lr+','+lg+','+lb+',0.4)">'+lvl.title+'</div>'+
        '<div style="width:100%;max-width:320px;margin-bottom:12px;animation:debriefFade 0.4s 0.38s both">'+renderPerformanceCard(perf,sc,G.gameMode==='survie'?0:TOTAL)+'</div>'+
        '<div style="width:100%;max-width:320px;margin-bottom:12px;animation:debriefFade 0.4s 0.39s both">'+renderNextRunMission(sc,G.gameMode==='survie'?0:TOTAL,G.gameMode,won)+'</div>'+
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
            '<div style="width:58px;height:58px;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+renderTinyItemVisual(ff,true,54)+'</div>'+
            '<div>'+
              '<div style="font-size:10px;color:rgba(255,107,107,0.7);font-weight:900;letter-spacing:1.5px;margin-bottom:3px">OUPS ! C\'ÉTAIT</div>'+
              '<div style="font-size:18px;font-weight:900;color:#fff;line-height:1.2">'+ff.name+'</div>'+
            '</div>'+
          '</div>':'')+
        // Nouveaux pays passeport
        (nf>0?
          '<div style="animation:debriefFade 0.5s 0.6s both;width:100%;max-width:320px;background:rgba(0,242,255,0.05);border:1px solid rgba(0,242,255,0.18);border-radius:18px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:12px">'+
            '<span style="font-size:26px">📖</span>'+
            '<div>'+
              '<div style="font-size:14px;font-weight:900;color:#00f2ff">+'+nf+' '+discoveryLabel+'</div>'+
              '<div style="font-size:10px;color:rgba(255,255,255,0.35);font-weight:700;margin-top:1px">Ajouté à ton '+(G.pack==='capitals'?'Carnet':G.pack==='silhouettes'?'Atlas':'Passeport')+' !</div>'+
            '</div>'+
          '</div>':'')+
        '<div style="width:100%;max-width:320px;margin-bottom:12px;animation:debriefFade 0.5s 0.65s both">'+renderEndLootCard()+'</div>'+
        (G.lastShopGoal?'<div style="width:100%;max-width:320px;margin-bottom:12px;animation:debriefFade 0.5s 0.67s both">'+renderNextShopGoal(G.lastShopGoal,true)+'</div>':'')+
        (G.lastDailyRecord?
          '<div style="animation:debriefFade 0.5s 0.68s both;width:100%;max-width:320px;background:rgba(255,165,2,0.06);border:1px solid rgba(255,165,2,0.22);border-radius:18px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:12px">'+
            '<span style="font-size:26px">'+(G.lastDailyRecord.perfect?'🏆':'📅')+'</span>'+
            '<div style="flex:1">'+
              '<div style="font-size:14px;font-weight:900;color:#ffa502">Défi du jour : '+G.lastDailyRecord.best+'/'+TOTAL+'</div>'+
              '<div style="font-size:10px;color:rgba(255,255,255,0.42);font-weight:700;margin-top:1px">'+G.lastDailyRecord.zone+' · '+G.lastDailyRecord.attempts+' essai'+(G.lastDailyRecord.attempts>1?'s':'')+'</div>'+
            '</div>'+
          '</div>':'')+
        // Boutons
        '<div style="display:flex;gap:10px;width:100%;max-width:320px;margin-bottom:20px;animation:debriefFade 0.4s 0.7s both">'+
          '<button onclick="goHome()" style="flex:1;padding:14px 8px;border-radius:16px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55);font-family:Nunito,sans-serif;font-size:14px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent">🏠 Menu</button>'+
          '<button onclick="startGame()" style="flex:2;padding:14px 8px;border-radius:16px;border:none;background:linear-gradient(135deg,#ff7a18,#facc15 45%,#22c55e);color:#fff;font-family:Fredoka One,cursive;font-size:19px;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:0 10px 22px rgba(245,158,11,0.34), inset 0 -3px 0 rgba(124,45,18,0.16)">🚀 REJOUER</button>'+
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
    var perf2=getEndPerformance(sc2,TOTAL,G.gameMode,won2);
    content+='<div class="end-score win-score">'+sc2+'/'+TOTAL+'</div>'+
      '<div style="font-size:14px;color:var(--text2);font-weight:700">'+msg+'</div>'+
      renderPerformanceCard(perf2,sc2,TOTAL)+
      renderNextRunMission(sc2,TOTAL,G.gameMode,won2);
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
  content+=renderEndLootCard();
  if(G.lastShopGoal)content+='<div style="width:100%">'+renderNextShopGoal(G.lastShopGoal,true)+'</div>';
  if(G.lastDailyRecord){
    content+='<div style="background:rgba(255,165,2,0.06);border:1px solid rgba(255,165,2,0.22);border-radius:12px;padding:8px 16px;display:flex;align-items:center;gap:8px">'+
      '<span style="font-size:18px">'+(G.lastDailyRecord.perfect?'🏆':'📅')+'</span>'+
      '<span style="font-family:Fredoka One,cursive;font-size:14px;color:#ffa502">Défi du jour '+G.lastDailyRecord.best+'/'+TOTAL+'</span>'+
      '<span style="font-size:10px;color:rgba(255,255,255,0.45);font-weight:700;margin-left:auto">'+G.lastDailyRecord.attempts+' essai'+(G.lastDailyRecord.attempts>1?'s':'')+'</span>'+
    '</div>';
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
    var skinDef=TERRY_SKINS.filter(function(s){return s.id===loadTerrySkin();})[0];
    ctx.filter=(skinDef&&skinDef.filter)||'none';
    ctx.drawImage(imgs[n], 0, 0, canvas.width, canvas.height);
    ctx.filter='none';
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
    initAppAudioLifecycle();
    applyPackTheme(G.pack||'flags');
    initGeoLocation();
    var _mStarted=false;
    var _fab=document.getElementById('music-fab');
    if(_fab)_fab.classList.add('waiting');
    function _onFirstGesture(){
      if(G.screen!=='setup')return;
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
    if(!startFirebaseAuthFlow()){
      G.screen=G.guestMode?'setup':'auth';
      render();
      setTimeout(function(){startFirebaseAuthFlow();},900);
    }
  }
  catch(e){document.getElementById('app').innerHTML='<div style="color:red;padding:1rem">'+e.message+'</div>';}
},50);


// --- Global interaction listeners ---
var _firstClickDone = false;
function _tapRipple(e){
  var el=e.target&&e.target.closest&&e.target.closest('button, .mode-btn, .gmode-btn, .diff-btn, .opt-btn, .act-btn, .daily-card, .auth-guest-link');
  if(!el||el.disabled||el.classList.contains('no-ripple'))return;
  var rect=el.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  var size=Math.max(rect.width,rect.height)*1.45;
  var x=(e.clientX||rect.left+rect.width/2)-rect.left-size/2;
  var y=(e.clientY||rect.top+rect.height/2)-rect.top-size/2;
  var r=document.createElement('span');
  r.className='tap-ripple';
  r.style.width=size+'px';
  r.style.height=size+'px';
  r.style.left=x+'px';
  r.style.top=y+'px';
  if(getComputedStyle(el).position==='static')el.style.position='relative';
  if(getComputedStyle(el).overflow==='visible')el.style.overflow='hidden';
  el.appendChild(r);
  setTimeout(function(){if(r&&r.parentNode)r.parentNode.removeChild(r);},520);
}
document.addEventListener('pointerdown', _tapRipple, {passive:true});
document.addEventListener('click', function(e){
  // Haptic feedback for buttons
  var btn = e.target.closest('button, .opt-btn, .diff-btn, .gmode-btn, .mode-btn');
  if(btn){
    hapticClick();
  }

  // Audio on first click
  if(!_firstClickDone){
    _firstClickDone = true;
    if(typeof resumeAC === 'function'){
      resumeAC(function(){}); // Ensure AudioContext is resumed
    }
    if(typeof musicOn !== 'undefined' && musicOn) {
      if (typeof _musicEl === 'undefined' || !_musicEl) {
        if(typeof startMusic === 'function') startMusic(G.screen === 'game' ? G.gameMode : 'accueil');
      } else if (_musicEl && _musicEl.paused) {
        try { _musicEl.play(); } catch(err){}
      }
    }
  }
});
