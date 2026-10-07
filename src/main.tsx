import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import{Shield,Lock,Play,Pause,RotateCcw,ChevronRight,User,Settings,Home,Timer,CheckCircle2,Square,Activity,LogOut}from"lucide-react";
import"./styles.css";
import type{AfterHoursState,Screen,Safety}from"./types";
import{loadState,saveState,loadTimer,saveTimer,clearTimer}from"./storage";
import{loadRemoteState,loadRemoteRounds,syncRemoteState}from"./services/backend";
import{supabase,supabaseConfigured}from"./services/supabase";
import{getCurrentUser,sendMagicLink,signOut}from"./services/auth";

const levelFromXp=(value:number)=>Math.max(1,Math.floor(Math.max(0,value)/200)+1);

const fallbackRounds=[
 {title:"De Eerste Stap",text:"Neem een moment. Spreek samen af wat vandaag wel, niet en misschien is.",time:180},
 {title:"De Richting",text:"Kies één opdracht die past bij jullie afgesproken grenzen. Communiceer helder.",time:240},
 {title:"De Verdieping",text:"Blijf aanwezig, check in en gebruik jullie afgesproken stopwoord wanneer nodig.",time:300}
];

function App(){
 const[state,setState]=useState<AfterHoursState>(()=>loadState());
 const[rounds,setRounds]=useState(fallbackRounds);
 const[screen,setScreen]=useState<Screen>("home");
 const[running,setRunning]=useState(()=>state.session.status==="active");
 const[seconds,setSeconds]=useState(()=>loadTimer(state.session.round,rounds[state.session.round]?.time||rounds[0].time));
 const[userEmail,setUserEmail]=useState<string|null>(null);
 const[authEmail,setAuthEmail]=useState("");
 const[authBusy,setAuthBusy]=useState(false);
 const[authMessage,setAuthMessage]=useState("");
 useEffect(()=>{let active=true;
  const hydrate=async()=>{
   const user=await getCurrentUser();
   if(!active)return;
   setUserEmail(user?.email??null);
   if(!user)return;
   const remoteRounds=await loadRemoteRounds();
   if(remoteRounds.length===3)setRounds(remoteRounds.map(r=>({title:r.title,text:r.body,time:r.durationSeconds})));
   const remote=await loadRemoteState();
   if(remote){
    setState(current=>({...remote,ageConfirmed:current.ageConfirmed,safety:current.safety}));
   }else{
    const local=loadState();
    void syncRemoteState(local);
   }
  };
  void hydrate();
  const sub=supabase?.auth.onAuthStateChange((_event,session)=>{
   if(!active)return;
   setUserEmail(session?.user?.email??null);
   if(session?.user){
    window.setTimeout(()=>{if(active)void hydrate()},0);
   }
  });
  return()=>{active=false;sub?.data.subscription.unsubscribe()};
 },[]);

 useEffect(()=>{saveState(state);void syncRemoteState(state)},[state]);
 useEffect(()=>{if(!running)return;const id=setInterval(()=>setSeconds(s=>{const next=Math.max(0,s-1);saveTimer(state.session.round,next,true);return next}),1000);return()=>clearInterval(id)},[running,state.session.round]);
 useEffect(()=>{if(seconds!==0)return;clearTimer();setRunning(false);setState(s=>({...s,session:{...s.session,status:"paused",updatedAt:new Date().toISOString()}}))},[seconds]);

 const round=state.session.round;
 const consent=state.consent.status==="active";
 const safety=state.safety;
 const xp=state.profile.xp;
 const currentLevel=Math.max(1,state.profile.level);
 const levelFloor=(currentLevel-1)*200;
 const nextLevelFloor=currentLevel*200;
 const levelProgress=Math.min(100,Math.max(0,Math.round(((xp-levelFloor)/(nextLevelFloor-levelFloor))*100)));
 const progress=Math.round(((round+1)/rounds.length)*100);
 const clock=useMemo(()=>String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0"),[seconds]);

 const updateSession=(patch:Partial<AfterHoursState["session"]>)=>setState(s=>({...s,session:{...s.session,...patch,updatedAt:new Date().toISOString()}}));
 const startRound=()=>{
  if(!consent){setScreen("home");return}
  setRunning(true);
  saveTimer(round,seconds,true);
  updateSession({status:"active",startedAt:state.session.startedAt||new Date().toISOString()});
 };
 const next=()=>{
  if(!consent){setRunning(false);setScreen("home");return}
  setRunning(false);
  clearTimer();
  if(round<rounds.length-1){
   const n=round+1;
   setState(s=>({...s,session:{...s.session,round:n,status:"ready",updatedAt:new Date().toISOString()}}));
   setSeconds(rounds[n].time);
  }else{
   setState(s=>{const nextXp=s.profile.xp+120;return {...s,profile:{...s.profile,xp:nextXp,level:levelFromXp(nextXp),sessions:s.profile.sessions+1},session:{...s.session,round:0,status:"completed",startedAt:null,updatedAt:new Date().toISOString()}}});
   setSeconds(rounds[0].time);
   setScreen("home");
  }
 };
 const reset=()=>{clearTimer();setSeconds(rounds[round].time);setRunning(false);saveTimer(round,rounds[round].time,false);updateSession({status:"ready"})};
 const stop=()=>{clearTimer();setRunning(false);updateSession({status:"stopped"});setScreen("home")};
 const revokeConsent=()=>{clearTimer();setRunning(false);setState(s=>({...s,consent:{status:"revoked",confirmedAt:s.consent.confirmedAt,revokedAt:new Date().toISOString()},session:{...s.session,status:"stopped",updatedAt:new Date().toISOString()}}));setScreen("home")};
 const confirmConsent=()=>setState(s=>({...s,consent:{status:"active",confirmedAt:new Date().toISOString(),revokedAt:null}}));
 const requestMagicLink=async()=>{setAuthMessage("");setAuthBusy(true);try{await sendMagicLink(authEmail.trim());setAuthMessage("Check je e-mail voor je veilige toegang.");}catch(error){setAuthMessage(error instanceof Error?error.message:"Aanmelden mislukt.")}finally{setAuthBusy(false)}};

 if(!state.ageConfirmed)return <div className="gate"><div className="mark">AH</div><span className="eyebrow">PRIVATE EXPERIENCE · 18+</span><h1>AFTER<br/><i>HOURS</i></h1><p>Een premium interactieve ervaring voor volwassenen. Bewust. Afgesproken. Veilig.</p><button onClick={()=>setState(s=>({...s,ageConfirmed:true}))}>Ik ben 18+ <ChevronRight/></button><small>Je toegang bevestigt alleen je leeftijd. Consent wordt afzonderlijk gevraagd.</small></div>;

 return <div className="app">
 <header><button className="wordmark" onClick={()=>setScreen("home")}>AFTER <i>HOURS</i></button><div className="status"><span></span> privé sessie</div></header>

 {screen==="home"&&<main>
  <section className="hero"><span className="eyebrow">JULLIE AVOND</span><h2>Take your time.</h2><p>Een zorgvuldig opgebouwde ervaring waarin toestemming, communicatie en grenzen altijd voorop staan.</p>
   <div className="safety"><Shield/><div><strong>Veiligheidscheck</strong><span>{safety==="green"?"Jullie grenzen zijn actief":"Check jullie afspraken opnieuw"}</span></div><b>{safety==="green"?"GOED":"CHECK"}</b></div>
  </section>
  <section><div className="sectionhead"><span>THE 60-MINUTE EXPERIENCE</span><em>03 ROUNDS</em></div><article className="gamecard"><div><span className="number">01</span><h3>De Nacht Begint</h3><p>Drie begeleide rondes. Jullie bepalen tempo, grenzen en stopmoment.</p></div><button onClick={()=>consent?setScreen("game"):setScreen("home")}><Play fill="currentColor"/></button></article></section>
  <section className="grid"><button className="tile" onClick={()=>setScreen("profile")}><User/><span>Profiel</span><small>{state.profile.displayName} · Level {state.profile.level}</small></button><button className="tile" onClick={()=>setScreen("admin")}><Activity/><span>Consent</span><small>{consent?"Actief en bevestigd":"Bevestiging vereist"}</small></button><button className="tile" onClick={()=>setScreen("admin")}><Settings/><span>Control room</span><small>Beheer & instellingen</small></button></section>
  {!consent&&<section className="consent-panel"><Shield/><div><strong>Consent is vereist</strong><span>Bevestig jullie vrijwillige toestemming voordat een ervaring kan starten.</span></div><button onClick={confirmConsent}>Bevestigen</button></section>}
  {(consent&&(state.session.status==="active"||state.session.status==="paused"))&&<section className="resume-panel"><Activity/><div><strong>{state.session.status==="active"?"Sessie hervatbaar":"Sessie gepauzeerd"}</strong><span>{state.session.status==="active"?"De timer loopt verder vanaf de opgeslagen positie.":"Jullie kunnen doorgaan vanaf de opgeslagen positie."}</span></div><button onClick={()=>setScreen("game")}>{state.session.status==="active"?"Ga verder":"Hervatten"} <ChevronRight/></button></section>}
 </main>}

 {screen==="game"&&<main>{!consent?<section className="round"><span className="eyebrow">TOEGANG VEREIST</span><h2>Consent eerst.</h2><p>Bevestig jullie vrijwillige toestemming voordat de experience kan worden geopend.</p><button className="gold" onClick={()=>setScreen("home")}>Naar consent <ChevronRight/></button></section>:<><div className="game-top"><button onClick={stop}><LogOut/></button><span>ROUND {String(round+1).padStart(2,"0")} / 03</span></div><div className="progress"><span style={{width:progress+"%"}}/></div><section className="round"><span className="eyebrow">AFTER HOURS</span><h2>{rounds[round].title}</h2><p>{rounds[round].text}</p><div className="timer"><Timer/><strong>{clock}</strong><small>TIJD OVER</small></div><div className="actions"><button className="gold" onClick={()=>running?setRunning(false):startRound()}>{running?<Pause/>:<Play/>}{running?"Pauzeren":"Start ronde"}</button><button onClick={reset}><RotateCcw/> Reset</button><button className="stop" onClick={stop}><Square/> Stop sessie</button></div><div className="consent"><CheckCircle2/><div><strong>Consent bevestigd</strong><span>Jullie kunnen op elk moment stoppen.</span></div></div></section><button className="next" onClick={next}>{round===2?"Afronden":"Volgende ronde"} <ChevronRight/></button></>}</main>}

 {screen==="profile"&&<main><section className="profile"><div className="avatar">N4</div><span className="eyebrow">YOUR PROFILE</span><h2>{state.profile.displayName}</h2><p>Level {state.profile.level} · {xp} XP</p><div className="xp"><span style={{width:levelProgress+"%"}}/></div><small className="xp-label">{Math.max(0,nextLevelFloor-xp)} XP tot Level {currentLevel+1}</small><div className="stats"><div><b>{String(state.profile.level).padStart(2,"0")}</b><small>LEVEL</small></div><div><b>{String(state.profile.sessions).padStart(2,"0")}</b><small>SESSIES</small></div><div><b>{xp}</b><small>XP</small></div></div></section><button className="back" onClick={()=>setScreen("home")}>← Terug</button></main>}

 {screen==="admin"&&<main><section className="admin"><span className="eyebrow">CONTROL ROOM</span><h2>Beheer</h2><div className="adminrow"><Activity/><div><b>Sessie status</b><span>{state.session.status==="active"?"Actief":state.session.status==="paused"?"Gepauzeerd":state.session.status==="completed"?"Afgerond":"Gereed"}</span></div><i/></div><div className="adminrow"><Shield/><div><b>Consent</b><span>{consent?"Bevestigd voor deze sessie":"Nog niet bevestigd"}</span></div><i/></div><div className="adminrow"><Lock/><div><b>Privacy</b><span>{userEmail?"Beveiligde sessie via Supabase":"Lokale sessiedata op dit apparaat"}</span></div><i/></div>{supabaseConfigured&&!userEmail&&<div className="auth-panel"><span className="eyebrow">PRIVATE ACCESS</span><strong>Veilige toegang</strong><p>Ontvang een eenmalige magic link per e-mail. Geen wachtwoord nodig.</p><input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="jij@email.nl" autoComplete="email"/><button onClick={requestMagicLink} disabled={authBusy||!authEmail.trim()}>{authBusy?"Versturen…":"Magic link sturen"}</button>{authMessage&&<small>{authMessage}</small>}</div>}{userEmail&&<div className="auth-panel"><span className="eyebrow">SIGNED IN</span><strong>{userEmail}</strong><button onClick={()=>void signOut()}>Uitloggen</button></div>}<button className="danger-action" onClick={revokeConsent}>Consent intrekken</button></section><button className="back" onClick={()=>setScreen("home")}>← Terug</button></main>}

 <nav><button onClick={()=>setScreen("home")}><Home/><span>Home</span></button><button onClick={()=>consent?setScreen("game"):setScreen("home")}><Timer/><span>Experience</span></button><button onClick={()=>setScreen("profile")}><User/><span>Profiel</span></button></nav>
 </div>
}
createRoot(document.getElementById("root")!).render(<App/>);
