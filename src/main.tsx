import React,{useEffect,useMemo,useRef,useState}from"react";
import UnderConstruction from "./UnderConstruction";
import Teaser from "./Teaser";
import PromptLibrary from "./PromptLibrary";
import BadgeShowcase from "./BadgeShowcase";
import { recordAchievement } from "./achievements";
import{createRoot}from"react-dom/client";
import{Shield,Lock,Play,Pause,RotateCcw,ChevronRight,User,Settings,Home,Timer,CheckCircle2,Square,Activity,LogOut,Sparkles,Radio,Bell,BookOpen}from"lucide-react";
import"./styles.css";
import{Insights}from"./Insights";
import{RadioRoom}from"./RadioRoom";
import MediaVault from"./MediaVault";
import type{AfterHoursState,AvatarStyle,Screen,Safety,SessionHistoryEntry}from"./types";
import{loadState,saveState,loadTimer,saveTimer,clearTimer,defaultState}from"./storage";
import{loadRemoteState,loadRemoteRounds,syncRemoteState,updateRemoteUsername,completeRemoteSession,revokeRemoteConsent}from"./services/backend";
import{supabase,supabaseConfigured}from"./services/supabase";
import{getCurrentUser,sendMagicLink,signInWithProvider,signInWithPassword,signUpWithPassword,resetPassword,updatePassword,signOut}from"./services/auth";
import{playNotificationSound}from"./services/notificationSound";
import{levelFromXp,rankFromXp,rankIndexFromXp,rankNames,rankThresholds}from"./progression";
import{notificationEvents}from"./services/notifications";
import{shouldResumeSession}from"./services/sessionSafety";

class AppErrorBoundary extends React.Component<React.PropsWithChildren, {hasError:boolean}>{
 state={hasError:false};
 static getDerivedStateFromError(){return {hasError:true};}
 componentDidCatch(){try{localStorage.setItem("afterhours.last-ui-error",new Date().toISOString())}catch{}}
 render(){
  if(this.state.hasError)return <div className="gate"><div className="gate-card"><span className="eyebrow">AFTER HOURS</span><h1>Veilige herstelmodus</h1><p>Er ging iets mis in de interface. Je lokale sessiestatus blijft behouden.</p><button onClick={()=>window.location.reload()}>Opnieuw laden</button></div></div>;
  return this.props.children;
 }
}



const roundTasks=[
 {label:"CHECK-IN · INTENTIE",question:"Welke energie past vandaag bij je?",choices:["Rustig opbouwen","Bewust leiden","Eerst afstemmen"]},
 {label:"DYNAMIEK · REGIE",question:"Wat staat deze ronde centraal?",choices:["Tempo","Grenzen","Vertrouwen"]},
 {label:"AFTERCARE · SIGNALEN",question:"Welk signaal krijgt vandaag voorrang?",choices:["Pauze","Stop","Opnieuw afstemmen"]}
];

const fallbackRounds=[
 {title:"De Eerste Stap",text:"Bepaal samen de energie van het moment. Wat is welkom, wat is niet welkom en wat blijft open voor overleg?",time:1200},
 {title:"De Richting",text:"Laat de afgesproken dynamiek leidend zijn. Communiceer helder, respecteer grenzen en geef ruimte om van richting te veranderen.",time:1200},
 {title:"De Verdieping",text:"Blijf aanwezig en let op signalen. Pauzeren of stoppen is altijd een geldige keuze. Sluit af met een korte aftercare-check.",time:1200}
];

const supportItems=[
 {title:"Consent & grenzen",body:"Stoppen mag altijd. Een eerdere afspraak is nooit belangrijker dan een huidige grens."},
 {title:"Veiligheidscheck",body:"Gebruik Pauze bij twijfel en Stop zodra je niet verder wilt."},
 {title:"Account & privacy",body:"Je profiel en sessiegegevens horen bij je eigen account. Deel nooit een wachtwoord of magic-link."}
];

const guidePrompts=[
 {title:"Voor je begint",body:"Check wat vandaag welkom is, wat niet, en welk stopwoord je afspreekt.",action:"Open consent"},
 {title:"Kies de energie",body:"Wil je rustig opbouwen, bewust tempo houden of eerst praten?",action:"Start Experience"},
 {title:"Check de grens",body:"Een grens hoeft niet verdedigd te worden. Vraag, luister en pas de richting aan.",action:"Open Insights"},
 {title:"Na de ervaring",body:"Neem tijd voor aftercare. Sta stil bij wat goed voelde en wat je wilt meenemen.",action:"Open profiel"}
];

function App(){
 useEffect(()=>{if("serviceWorker" in navigator){void navigator.serviceWorker.register("/sw.js").catch(()=>{})}},[]);
 const[state,setState]=useState<AfterHoursState>(()=>loadState());
 const[authReady,setAuthReady]=useState(!supabaseConfigured);
 const[rounds,setRounds]=useState(fallbackRounds);
 const initialScreen=(()=>{const value=new URLSearchParams(window.location.search).get("screen");if(value==="game"||value==="profile"||value==="admin"||value==="insights"||value==="radio"||value==="prompts")return value;return "home" as Screen})();
 const[screen,setScreen]=useState<Screen>(initialScreen);
 useEffect(()=>{if(new URLSearchParams(window.location.search).has("screen"))window.history.replaceState({},document.title,window.location.pathname+window.location.hash)},[]);
 const[running,setRunning]=useState(()=>shouldResumeSession(state.session.status,state.consent.status));
 const[seconds,setSeconds]=useState(()=>loadTimer(state.profile.id,state.session.round,rounds[state.session.round]?.time||rounds[0].time));
 const[userEmail,setUserEmail]=useState<string|null>(null);
 const[authEmail,setAuthEmail]=useState("");
 const[authPassword,setAuthPassword]=useState("");
 const[authMode,setAuthMode]=useState<"magic"|"password">("magic");
 const[authBusy,setAuthBusy]=useState(false);
 const[authMessage,setAuthMessage]=useState("");
 const[passwordRecovery,setPasswordRecovery]=useState(false);
 const[syncUserId,setSyncUserId]=useState<string|null>(null);
 useEffect(()=>{if(syncUserId)recordAchievement("login")},[syncUserId]);
 const[checkIn,setCheckIn]=useState<"clear"|"pause"|"stop">("clear");
 const[aftercareChoice,setAftercareChoice]=useState<"land"|"talk"|"space"|null>(null);
 const[finishing,setFinishing]=useState(false);
 const finishingSession=useRef(false);
 const[displayNameDraft,setDisplayNameDraft]=useState(()=>state.profile.displayName);
 const[usernameDraft,setUsernameDraft]=useState(()=>state.profile.username);
 const[profileMessage,setProfileMessage]=useState("");
 useEffect(()=>{setDisplayNameDraft(state.profile.displayName);setUsernameDraft(state.profile.username)},[state.profile.displayName,state.profile.username]);
 const[selectedTask,setSelectedTask]=useState<string|null>(null);
 const[notificationsOpen,setNotificationsOpen]=useState(false);
 const[guideIndex,setGuideIndex]=useState(()=>Math.floor(Math.random()*guidePrompts.length));
 const hydrateGeneration=useRef(0);
 useEffect(()=>{let active=true;
  const generation=++hydrateGeneration.current;
  const hydrate=async()=>{
   const localState=loadState();
   if(!supabaseConfigured){
    if(!active||generation!==hydrateGeneration.current)return;
    const localRound=Math.min(Math.max(0,localState.session.round),fallbackRounds.length-1);
    setUserEmail(null);
    setSyncUserId(null);
    setState(localState);
    setRunning(shouldResumeSession(localState.session.status,localState.consent.status));
    setSeconds(loadTimer(localState.profile.id,localRound,fallbackRounds[localRound].time));
    setAuthReady(true);
    return;
   }
   let user;
   try{
    user=await getCurrentUser();
   }catch{
    if(!active||generation!==hydrateGeneration.current)return;
    setProfileMessage("Accountstatus kon niet worden gecontroleerd door een verbindingsfout. Je lokale gegevens blijven behouden; controleer je verbinding en laad opnieuw.");
    setAuthReady(true);
    return;
   }
   if(!active||generation!==hydrateGeneration.current)return;
   setUserEmail(user?.email??null);
   setSyncUserId(null);
   if(!user){
    clearTimer(localState.profile.id);
    setRunning(false);
    setSeconds(fallbackRounds[0].time);
    setState(current=>({...defaultState(),ageConfirmed:current.ageConfirmed,ageConfirmedFor:current.ageConfirmedFor,safety:current.safety}));
    setAuthReady(true);
    return;
   }
   setAuthReady(false);
   let remoteRounds:Awaited<ReturnType<typeof loadRemoteRounds>>=[];
   try{
    remoteRounds=await loadRemoteRounds();
   }catch{
    setProfileMessage("De online ervaringsrondes konden niet worden geladen. De standaardrondes blijven beschikbaar.");
   }
   if(!active||generation!==hydrateGeneration.current)return;
   const availableRounds=remoteRounds.length===3?remoteRounds.map(r=>({title:r.title,text:r.body,time:r.durationSeconds})):fallbackRounds;
   if(remoteRounds.length===3)setRounds(availableRounds);
   let remote:AfterHoursState|null=null;
   try{
    remote=await loadRemoteState(localState.session.id);
   }catch{
    setProfileMessage("Online sessiegegevens zijn tijdelijk niet bereikbaar. De app probeert opnieuw en gebruikt intussen beschikbare lokale gegevens.");
   }
   if(!active||generation!==hydrateGeneration.current)return;
   if(remote){
    const sameAccount=localState.profile.id===user.id;
    const remoteIsNewer=!sameAccount||remote.session.id!==localState.session.id||new Date(remote.session.updatedAt).getTime()>=new Date(localState.session.updatedAt).getTime();
    setState(current=>({...remote,ageConfirmed:current.ageConfirmed&&(current.ageConfirmedFor===user.id),ageConfirmedFor:current.ageConfirmedFor===user.id?user.id:null,safety:current.safety,profile:{...remote.profile,username:remote.profile.username||current.profile.username},session:remoteIsNewer?remote.session:current.session,consent:remoteIsNewer?remote.consent:current.consent}));
    if(remoteIsNewer){
     const restoredRound=Math.min(Math.max(0,remote.session.round),availableRounds.length-1);
     setRunning(shouldResumeSession(remote.session.status,remote.consent.status));
     setSeconds(loadTimer(user.id,restoredRound,availableRounds[restoredRound].time));
    }
   }else{
    const sameAccount=localState.profile.id===user.id;
    const hasRecoverableLocalSession=localState.session.status!=="ready"||localState.session.round!==0;
    if(sameAccount&&hasRecoverableLocalSession){
     setState(localState);
     setRunning(shouldResumeSession(localState.session.status,localState.consent.status));
     const restoredRound=Math.min(Math.max(0,localState.session.round),availableRounds.length-1);
     setSeconds(loadTimer(localState.profile.id,restoredRound,availableRounds[restoredRound].time));
    }else{
     clearTimer(localState.profile.id);
     setRunning(false);
     setSeconds(availableRounds[0].time);
     setState(current=>({...defaultState(),ageConfirmed:current.ageConfirmed,ageConfirmedFor:current.ageConfirmedFor,safety:current.safety}));
    }
   }
   setSyncUserId(user.id);
   setAuthReady(true);
  };
  void hydrate();
  const sub=supabase?.auth.onAuthStateChange((event,session)=>{
   if(!active)return;
   setUserEmail(session?.user?.email??null);
   setSyncUserId(null);
   if(event==="PASSWORD_RECOVERY"){
    setPasswordRecovery(true);
    setAuthMessage("");
    setAuthBusy(false);
    setScreen("admin");
   }
   if(event==="SIGNED_OUT"){
    clearTimer(state.profile.id);
    clearTimer("local-profile");
    setUserEmail(null);
    setSyncUserId(null);
    setPasswordRecovery(false);
    setAuthMessage("");
    setAuthBusy(false);
    setRunning(false);
    setState(defaultState());
    setScreen("home");
   }
   if(session?.user){
    window.setTimeout(()=>{if(active&&generation===hydrateGeneration.current)void hydrate()},0);
   }
  });
  return()=>{active=false;sub?.data.subscription.unsubscribe()};
 },[]);

 useEffect(()=>{try{saveState(state)}catch{setProfileMessage("Lokale opslag is niet beschikbaar. Gebruik een ingelogd account om sessiegegevens server-side op te slaan.")}if(!supabaseConfigured||syncUserId){void syncRemoteState(state).then(message=>{if(message)setProfileMessage(message)}).catch(()=>setProfileMessage("Synchronisatie is tijdelijk niet beschikbaar. Controleer je verbinding voordat je verdergaat."))}if(!syncUserId)return;},[state,syncUserId]);
 useEffect(()=>{if(!running)return;const id=setInterval(()=>setSeconds(s=>{const next=Math.max(0,s-1);if(!saveTimer(state.profile.id,state.session.round,next,true))setProfileMessage(current=>current||"Timer kan niet lokaal worden opgeslagen. Houd deze pagina open en controleer je opslaginstellingen.");return next}),1000);return()=>clearInterval(id)},[running,state.session.round,state.profile.id]);
 useEffect(()=>{if(seconds!==0||state.session.status!=="active")return;clearTimer(state.profile.id);setRunning(false);saveTimer(state.profile.id,state.session.round,0,false);void playNotificationSound("checkin");setState(s=>({...s,notifications:[notificationEvents.checkIn("De tijd van deze ronde is voorbij. De sessie staat op pauze en kan veilig worden hervat."),...s.notifications].slice(0,20),session:{...s.session,status:"paused",updatedAt:new Date().toISOString()}}))},[seconds,state.session.status,rounds]);

 const round=state.session.round;
 const consent=state.consent.status==="active";
 const safety=state.safety;
 const unreadNotifications=state.notifications.filter(item=>!item.read).length;
 const markNotificationRead=(id:string)=>setState(s=>({...s,notifications:s.notifications.map(item=>item.id===id?{...item,read:true}:item)}));
 const markAllNotificationsRead=()=>setState(s=>({...s,notifications:s.notifications.map(item=>({...item,read:true}))}));
 useEffect(()=>{if(screen==="home")return;if(!state.ageConfirmed){setScreen("home");return}if(screen==="game"&&state.consent.status!=="active"){setScreen("home")}},[screen,state.ageConfirmed,state.consent.status]);
 const xp=state.profile.xp;
 const currentLevel=Math.max(1,state.profile.level);
 const levelFloor=(currentLevel-1)*200;
 const nextLevelFloor=currentLevel*200;
 const levelProgress=Math.min(100,Math.max(0,Math.round(((xp-levelFloor)/(nextLevelFloor-levelFloor))*100)));
 const progress=Math.round(((round+1)/rounds.length)*100);
 const clock=useMemo(()=>String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0"),[seconds]);
 const persistTimer=(profileId:string,roundIndex:number,value:number,isRunning:boolean)=>{
  if(!saveTimer(profileId,roundIndex,value,isRunning)){
   setProfileMessage("Timer kon niet lokaal worden opgeslagen. Houd deze pagina open en controleer je opslaginstellingen.");
  }
 };

 const updateSession=(patch:Partial<AfterHoursState["session"]>)=>setState(s=>({...s,session:{...s.session,...patch,updatedAt:new Date().toISOString()}}));
 const pauseRound=()=>{setRunning(false);persistTimer(state.profile.id,round,seconds,false);updateSession({status:"paused"})};
 const startRound=()=>{
  if(supabaseConfigured&&!syncUserId){setAuthMessage("Log in voordat je een sessie start, zodat consent en actieve speeltijd veilig worden opgeslagen.");setScreen("admin");return}
  if(!consent){setScreen("home");return}
  const resume=state.session.status==="paused"||state.session.status==="active";
  const remaining=resume&&seconds>0?seconds:rounds[round].time;
  setSeconds(remaining);
  setRunning(true);
  persistTimer(state.profile.id,round,remaining,true);
  updateSession({status:"active",startedAt:state.session.startedAt||new Date().toISOString()});
 };
 const finishSession=async()=>{
  if(finishingSession.current||!aftercareChoice)return;
  if(!syncUserId){setProfileMessage("Log in om een sessie server-side af te ronden en XP veilig op te slaan.");return;}
  finishingSession.current=true;
  setFinishing(true);
  try{
   const completedAt=new Date().toISOString();
   const remoteResult=await completeRemoteSession(state.session.id,rounds.length);
   if(remoteResult.error){setProfileMessage("Sessie kon niet veilig worden afgerond: "+remoteResult.error);return;}
   if(remoteResult.alreadyCompleted){
    const remote=await loadRemoteState(state.session.id);
    if(remote)setState(current=>({...remote,ageConfirmed:current.ageConfirmed,ageConfirmedFor:current.ageConfirmedFor,safety:current.safety,consent:{status:"pending",confirmedAt:null,revokedAt:null}}));
    else setState(current=>({...current,consent:{status:"pending",confirmedAt:null,revokedAt:null},session:{...current.session,round:0,status:"completed",startedAt:null,updatedAt:completedAt}}));
    setRunning(false);
    clearTimer(state.profile.id);
    setProfileMessage("Deze sessie was al server-side afgerond. De opgeslagen status is opnieuw geladen; er is geen nieuwe XP toegekend.");
    setScreen("home");
    return;
   }
   const earned=remoteResult.xpEarned;
   recordAchievement("session_complete",{completedSessions:state.profile.sessions+1});
   void playNotificationSound("message");
   setState(s=>{const nextXp=s.profile.xp+earned;return {...s,consent:{status:"pending",confirmedAt:null,revokedAt:null},profile:{...s.profile,xp:nextXp,level:levelFromXp(nextXp),sessions:s.profile.sessions+1},history:[{id:"session-"+Date.now(),completedAt,xpEarned:earned,rounds:rounds.length},...s.history].slice(0,12),notifications:[notificationEvents.message("Sessie voltooid","De volledige Experience is afgerond en veilig opgeslagen. +"+earned+" XP is toegevoegd."),...s.notifications].slice(0,20),session:{...s.session,round:0,status:"completed",startedAt:null,updatedAt:completedAt}}});
   setSeconds(rounds[0].time);
   setAftercareChoice(null);
   setScreen("home");
  }catch(error){
   setProfileMessage("Sessie kon niet veilig worden afgerond: "+(error instanceof Error?error.message:"onbekende fout"));
  }finally{
   finishingSession.current=false;
   setFinishing(false);
  }
 };
 const next=()=>{
  if(!consent){setRunning(false);setScreen("home");return}
  if(running||state.session.status!=="paused")return;
  if(roundTasks[round]?.choices?.length&&!selectedTask)return;
  setRunning(false);
  clearTimer(state.profile.id);
  if(round<rounds.length-1){
   const n=round+1;
   const now=new Date().toISOString();
   setState(s=>({...s,session:{...s.session,round:n,status:"paused",updatedAt:now}}));
   setSelectedTask(null);
   setSeconds(rounds[n].time);
   persistTimer(state.profile.id,n,rounds[n].time,false);
  }else{
   setAftercareChoice(null);
   setScreen("aftercare");
  }
 };
 const reset=async()=>{
  const now=new Date().toISOString();
  if(state.consent.status==="active"){
   const error=await revokeRemoteConsent(state.session.id,now);
   if(error){setProfileMessage("Consent kon niet veilig worden ingetrokken op de server. De sessie is niet gereset; probeer opnieuw. "+error);return}
  }
  clearTimer(state.profile.id);setSeconds(rounds[0].time);setRunning(false);setSelectedTask(null);persistTimer(state.profile.id,0,rounds[0].time,false);
  setState(s=>({...s,consent:{status:"pending",confirmedAt:null,revokedAt:null},session:{...s.session,id:crypto.randomUUID(),round:0,status:"ready",startedAt:null,updatedAt:now}}))
 };
 const revokeConsentRemotely=(sessionId:string,revokedAt:string)=>{void revokeRemoteConsent(sessionId,revokedAt).then(error=>{if(error)setProfileMessage("De sessie is lokaal gestopt, maar de server kon consent niet bevestigen. Controleer je verbinding. "+error)}).catch(()=>setProfileMessage("De sessie is lokaal gestopt, maar de server kon consent niet bevestigen. Controleer je verbinding."))};
 const stop=()=>{const now=new Date().toISOString();revokeConsentRemotely(state.session.id,now);clearTimer(state.profile.id);setRunning(false);setCheckIn("stop");setState(s=>({...s,consent:{status:"revoked",confirmedAt:null,revokedAt:now},notifications:[notificationEvents.safety("De sessie is veilig gestopt. Bevestig consent opnieuw voordat je opnieuw start."),...s.notifications].slice(0,20),session:{...s.session,status:"stopped",startedAt:null,updatedAt:now}}));setScreen("home")};
 const revokeConsent=()=>{const now=new Date().toISOString();revokeConsentRemotely(state.session.id,now);clearTimer(state.profile.id);setRunning(false);setState(s=>({...s,consent:{status:"revoked",confirmedAt:null,revokedAt:now},session:{...s.session,status:"stopped",startedAt:null,updatedAt:now}}));setSeconds(rounds[round].time);persistTimer(state.profile.id,round,rounds[round].time,false);setScreen("home")};
 const confirmConsent=()=>{if(supabaseConfigured&&!syncUserId){setAuthMessage("Log in om consent en sessievoortgang veilig aan je account te koppelen.");setScreen("admin");return;}setCheckIn("clear");recordAchievement("consent_confirmed");void playNotificationSound("checkin");setState(s=>({...s,notifications:[notificationEvents.checkIn("Je toestemming is bevestigd. Je kunt de experience veilig starten."),...s.notifications].slice(0,20),consent:{status:"active",confirmedAt:new Date().toISOString(),revokedAt:null}}));};
 const handleCheckIn=(choice:"clear"|"pause"|"stop")=>{setCheckIn(choice);void playNotificationSound(choice==="stop"?"safety":"checkin");if(choice==="pause"){setRunning(false);persistTimer(state.profile.id,round,seconds,false);updateSession({status:"paused"})}if(choice==="stop"){stop()}};
 const saveDisplayName=()=>{const name=displayNameDraft.trim().replace(/\s+/g," ");if(name.length<2)return;setState(s=>({...s,profile:{...s.profile,displayName:name}}));setDisplayNameDraft(name)};
 const saveUsername=async()=>{
  const username=usernameDraft.trim().toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20);
  if(username.length<3){setProfileMessage("Username moet minimaal 3 tekens bevatten.");return;}
  setProfileMessage("");
  try{
   if(supabaseConfigured&&syncUserId){
    const message=await updateRemoteUsername(username);
    if(message){setProfileMessage(message);return;}
   }
   setState(s=>({...s,profile:{...s.profile,username}}));
   setUsernameDraft(username);
   setProfileMessage("Username opgeslagen.");
  }catch{
   setProfileMessage("Username kon niet worden opgeslagen. Controleer je verbinding en probeer het opnieuw.");
  }
 };
 const setAvatarStyle=(avatarStyle:AvatarStyle)=>setState(s=>({...s,profile:{...s.profile,avatarStyle}}));
 const avatarStyle=state.profile.avatarStyle??"sigil";
 const avatarSymbols:{style:AvatarStyle,label:string,symbol:string}[]=[
  {style:"sigil",label:"Sigil",symbol:"✦"},
  {style:"collar",label:"Collar",symbol:"◉"},
  {style:"key",label:"Key",symbol:"⌁"},
  {style:"crown",label:"Crown",symbol:"♛"}
 ];
 const setSafety=(next:Safety)=>setState(s=>next===s.safety?s:{...s,notifications:[notificationEvents.safety(next==="green"?"Veiligheidsniveau bevestigd als GOED.":"Veiligheidsniveau staat op CHECK. Neem de afspraken opnieuw door."),...s.notifications].slice(0,20),safety:next});
 const signInProvider=async(provider:"google"|"apple")=>{setAuthMessage("");setAuthBusy(true);try{await signInWithProvider(provider)}catch(error){setAuthMessage(error instanceof Error?error.message:"Aanmelden mislukt.")}finally{setAuthBusy(false)}};
 const requestMagicLink=async()=>{setAuthMessage("");setAuthBusy(true);try{await sendMagicLink(authEmail.trim());setAuthMessage("Check je e-mail voor je veilige toegang.");}catch(error){setAuthMessage(error instanceof Error?error.message:"Aanmelden mislukt.")}finally{setAuthBusy(false)}};
 const submitPasswordAuth=async(createAccount:boolean)=>{setAuthMessage("");setAuthBusy(true);try{if(createAccount){await signUpWithPassword(authEmail.trim(),authPassword);setAuthMessage("Account aangemaakt. Bevestig je e-mail als Supabase e-mailbevestiging actief is.");}else{await signInWithPassword(authEmail.trim(),authPassword);}}catch(error){setAuthMessage(error instanceof Error?error.message:"Aanmelden mislukt.")}finally{setAuthBusy(false)}};
 const handleSignOut=async()=>{setAuthMessage("");try{await signOut()}catch(error){setAuthMessage(error instanceof Error?error.message:"Uitloggen mislukt.")}};
 const requestPasswordReset=async()=>{setAuthMessage("");setAuthBusy(true);try{await resetPassword(authEmail.trim());setAuthMessage("Als dit e-mailadres bekend is, ontvang je een link om je wachtwoord opnieuw in te stellen.");}catch(error){setAuthMessage(error instanceof Error?error.message:"Resetten mislukt.")}finally{setAuthBusy(false)}};
 const saveRecoveredPassword=async()=>{setAuthMessage("");setAuthBusy(true);try{await updatePassword(authPassword);setAuthMessage("Je wachtwoord is bijgewerkt.");setAuthPassword("");setPasswordRecovery(false);}catch(error){setAuthMessage(error instanceof Error?error.message:"Wachtwoord bijwerken mislukt.")}finally{setAuthBusy(false)}};

 if(!authReady)return <div className="gate"><div className="gate-card"><span className="eyebrow">AFTER HOURS</span><h1>Sessie herstellen…</h1><p>Beveiligde toegang wordt gecontroleerd.</p></div></div>;
 if(!state.ageConfirmed)return <div className="gate"><img className="gate-logo" src="/after-hours-logo.svg" alt="AFTER HOURS" /><span className="eyebrow">PRIVATE EXPERIENCE · 18+</span><h1>AFTER<br/><i>HOURS</i></h1><p>Een premium interactieve ervaring voor volwassenen. Bewust. Afgesproken. Veilig.</p><button onClick={()=>setState(s=>({...s,ageConfirmed:true,ageConfirmedFor:syncUserId??"local"}))}>Ik ben 18+ <ChevronRight/></button><small>Dit is een zelfverklaring, geen officiële leeftijdsverificatie. Consent wordt afzonderlijk gevraagd.</small></div>;

 return <div className="app">
 <header><button className="wordmark" onClick={()=>setScreen("home")} aria-label="AFTER HOURS home"><img src="/after-hours-logo.svg" alt="AFTER HOURS" /></button><div className="status"><span></span> privé sessie</div></header>

 {screen==="home"&&<main>  {authReady&&(!supabaseConfigured||!syncUserId)&&<section className="consent-panel" role="status"><Lock/><div><strong>{supabaseConfigured?"Niet ingelogd":"Lokale demo-modus"}</strong><span>{supabaseConfigured?"Je kunt de experience bekijken, maar log in voordat je begint om sessievoortgang en XP aan je account te koppelen.":"De Supabase-backend is niet ingesteld. Voortgang blijft lokaal op dit apparaat; sessies kunnen niet server-side worden afgerond en leveren geen opgeslagen XP op."}</span></div>{supabaseConfigured&&!syncUserId&&<button onClick={()=>setScreen("admin")}>Inloggen</button>}</section>}
  <div className="notification-bar">
   <button className="notification-button" aria-label={unreadNotifications?unreadNotifications+" ongelezen meldingen":"Meldingen"} aria-expanded={notificationsOpen} onClick={()=>setNotificationsOpen(open=>!open)}>
    <Bell size={16}/>
    {unreadNotifications>0&&<span>{unreadNotifications>9?"9+":unreadNotifications}</span>}
   </button>
   {notificationsOpen&&<div className="notification-panel" role="dialog" aria-label="Meldingen">
    <div className="notification-head"><strong>MELDINGEN</strong><button onClick={markAllNotificationsRead} disabled={!unreadNotifications}>Alles gelezen</button></div>
    {state.notifications.length?state.notifications.slice(0,8).map(item=><button key={item.id} className={"notification-item "+(item.read?"":"unread")} onClick={()=>markNotificationRead(item.id)}><b>{item.title}</b><span>{item.body}</span></button>):<small>Geen nieuwe meldingen.</small>}
   </div>}
  </div>
  <section className="hero home-hero">
   <img className="home-wordmark" src="/after-hours-logo.svg" alt="AFTER HOURS"/>
   <span className="eyebrow">WELKOM TERUG</span><h2>{state.profile.displayName||"Mysti"}</h2>
   <div className="home-level"><span>♙</span><div><strong>Level {state.profile.level}</strong><small>{xp} / {nextLevelFloor} XP</small><div className="home-xp"><i style={{width:levelProgress+"%"}}/></div></div></div>
   <button className="home-start gold" onClick={()=>{if(consent){setScreen("game");return}document.getElementById("consent")?.scrollIntoView({behavior:"smooth",block:"center"})}}>START EXPERIENCE <ChevronRight/></button>
  </section>
  <section className="grid home-shortcuts">
   <button className="tile" onClick={()=>setScreen("insights")}><Sparkles/><span>Kinky Tarot</span></button>
   <button className="tile" onClick={()=>setScreen("insights")}><Activity/><span>Horoscoop</span></button>
   <button className="tile" onClick={()=>setScreen("radio")}><Radio/><span>Radio</span></button>
   <button className="tile" onClick={()=>setScreen("prompts")}><BookOpen/><span>Prompt Deck</span></button>
  </section>
  {!consent&&<section id="consent" className="consent-panel"><Shield/><div><strong>Consent is vereist</strong><span>Bevestig je vrijwillige toestemming voordat je een ervaring start.</span></div><button onClick={confirmConsent}>Bevestigen</button></section>}
  {(consent&&(state.session.status==="active"||state.session.status==="paused"))&&<section className="resume-panel"><Activity/><div><strong>{state.session.status==="active"?"Sessie hervatbaar":"Sessie gepauzeerd"}</strong><span>{state.session.status==="active"?"De timer loopt verder vanaf de opgeslagen positie.":"Je kunt doorgaan vanaf de opgeslagen positie."}</span></div><button onClick={()=>setScreen("game")}>{state.session.status==="active"?"Ga verder":"Hervatten"} <ChevronRight/></button></section>}
 </main>}

 {screen==="game"&&<main className="experience-shell">{!consent?<section className="round"><span className="eyebrow">TOEGANG VEREIST</span><h2>Consent eerst.</h2><p>Bevestig je vrijwillige toestemming voordat je de experience opent.</p><button className="gold" onClick={()=>setScreen("home")}>Naar consent <ChevronRight/></button></section>:<><div className="game-top"><button onClick={stop} aria-label="Sessie verlaten"><LogOut/></button><span>ROUND {String(round+1).padStart(2,"0")} / {String(rounds.length).padStart(2,"0")}</span></div><div className="round-steps">{rounds.map((item,index)=><span key={item.title} className={index===round?"current":index<round?"done":""}>{String(index+1).padStart(2,"0")} · {item.title}</span>)}</div><div className="progress"><span style={{width:progress+"%"}}/></div><section className="round"><span className="eyebrow">AFTER HOURS</span><h2>{rounds[round].title}</h2><p>{rounds[round].text}</p><div className="task-card"><span className="eyebrow">{roundTasks[round]?.label}</span><strong>{roundTasks[round]?.question}</strong><div>{roundTasks[round]?.choices.map(choice=><button key={choice} className={selectedTask===choice?"selected":""} aria-pressed={selectedTask===choice} onClick={()=>setSelectedTask(choice)}>{choice}</button>)}</div><small>{selectedTask?"Keuze opgeslagen voor deze ronde. Jullie kunnen altijd van richting veranderen.":"Kies alleen wanneer dit voor beiden goed voelt."}</small></div><div className="timer"><Timer/><strong>{clock}</strong><small>TIJD OVER</small></div><div className="actions"><button className="gold" onClick={()=>running?pauseRound():startRound()}>{running?<Pause/>:<Play/>}{running?"Pauzeren":"Start ronde"}</button><button onClick={reset}><RotateCcw/> Reset</button><button className="stop" onClick={stop}><Square/> Stop sessie</button></div><div className="consent"><CheckCircle2/><div><strong>Consent bevestigd</strong><span>Je kunt op elk moment stoppen.</span></div></div><div className="checkin"><span className="eyebrow">LIVE CHECK-IN</span><strong>Hoe voelt dit moment?</strong><div><button className={checkIn==="clear"?"selected":""} aria-pressed={checkIn==="clear"} onClick={()=>handleCheckIn("clear")}>Goed</button><button className={checkIn==="pause"?"selected":""} aria-pressed={checkIn==="pause"} onClick={()=>handleCheckIn("pause")}>Pauze</button><button className={checkIn==="stop"?"selected stop-choice":""} aria-pressed={checkIn==="stop"} onClick={()=>handleCheckIn("stop")}>Stop</button></div></div></section><button className="next" onClick={next}>{round===rounds.length-1?"Afronden":"Volgende ronde"} <ChevronRight/></button></>}</main>}

 {screen==="aftercare"&&<main className="aftercare-screen"><section className="aftercare-card"><span className="eyebrow">AFTER HOURS · AFTERCARE</span><h2>Land softly.</h2><p>De Experience is voorbij. Kies wat nu het beste past. Niets hoeft meteen.</p><div className="aftercare-options"><button className={aftercareChoice==="land"?"selected":""} onClick={()=>setAftercareChoice("land")}><strong>Rustig landen</strong><span>Even zitten, ademen en het tempo laten zakken.</span></button><button className={aftercareChoice==="talk"?"selected":""} onClick={()=>setAftercareChoice("talk")}><strong>Kort napraten</strong><span>Bespreek samen wat goed voelde en wat je wilt meenemen.</span></button><button className={aftercareChoice==="space"?"selected":""} onClick={()=>setAftercareChoice("space")}><strong>Ruimte & water</strong><span>Neem even afstand, drink iets en kom rustig terug.</span></button></div><div className="aftercare-note"><Shield/><span>Aftercare is geen verplichting om iets te delen. Een pauze, grens of stop blijft altijd geldig.</span></div><button className="gold aftercare-complete" onClick={()=>void finishSession()} disabled={!aftercareChoice||finishing}>{finishing?"Veilig afronden…":"Sessie veilig afronden"}</button><button className="back" onClick={()=>setScreen("home")}>← Terug</button></section></main>}

 {screen==="prompts"&&<PromptLibrary onBack={()=>setScreen("home")} onComplete={()=>recordAchievement("prompt_complete")}/>}

 {screen==="insights"&&<Insights onBack={()=>setScreen("home")}/>}

 {screen==="radio"&&<RadioRoom onBack={()=>setScreen("home")}/>}

 {screen==="profile"&&<main><section className="profile"><div className={`avatar identity-avatar avatar-${avatarStyle}`}><div className="avatar-sigil">{avatarSymbols.find(item=>item.style===avatarStyle)?.symbol??"✦"}</div><div className="avatar-initials">{state.profile.displayName.trim().split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div><span>{rankFromXp(xp)}</span></div><span className="eyebrow">YOUR PROFILE · AFTER HOURS IDENTITY</span><h2>{state.profile.displayName}</h2><p>@{state.profile.username} · Level {state.profile.level} · {xp} XP</p><div className="avatar-picker" aria-label="Kies je AFTER HOURS identity"><span className="eyebrow">IDENTITY SIGIL</span><div className="avatar-options">{avatarSymbols.map(item=><button key={item.style} className={avatarStyle===item.style?"selected":""} onClick={()=>setAvatarStyle(item.style)} aria-pressed={avatarStyle===item.style}><span>{item.symbol}</span><small>{item.label}</small></button>)}</div></div><MediaVault sessionId={state.session.id}/><div className="name-editor"><label htmlFor="display-name">AFTER HOURS-NAAM</label><div><input id="display-name" value={displayNameDraft} onChange={e=>setDisplayNameDraft(e.target.value)} maxLength={24} autoComplete="nickname"/><button onClick={saveDisplayName} disabled={displayNameDraft.trim().length<2}>Opslaan</button></div></div><div className="name-editor"><label htmlFor="after-hours-username">AFTER HOURS-USERNAME</label><div><span className="username-prefix">@</span><input id="after-hours-username" value={usernameDraft} onChange={e=>setUsernameDraft(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20))} maxLength={20} autoComplete="username" aria-describedby="username-help"/><button onClick={saveUsername} disabled={usernameDraft.trim().length<3}>Opslaan</button><span id="username-help" className="username-help">uniek</span></div>{profileMessage&&<small className="profile-message" role="status">{profileMessage}</small>}</div><span className="profile-rank">{rankFromXp(xp)}</span><div className="xp"><span style={{width:levelProgress+"%"}}/></div><small className="xp-label">{Math.max(0,nextLevelFloor-xp)} XP tot Level {currentLevel+1}</small><div className="rank-ladder"><span className="eyebrow">RANK LADDER</span><div>{rankNames.map((rank,index)=><span key={rank} className={index===rankIndexFromXp(xp)?"current":index<rankIndexFromXp(xp)?"passed":""}>{String(index+1).padStart(2,"0")} {rank} · {rankThresholds[index]} XP</span>)}</div></div><div className="stats"><div><b>{String(state.profile.level).padStart(2,"0")}</b><small>LEVEL</small></div><div><b>{String(state.profile.sessions).padStart(2,"0")}</b><small>SESSIES</small></div><div><b>{xp}</b><small>XP</small></div></div><div className="history"><span className="eyebrow">RECENTE SESSIES</span>{state.history.length===0?<small className="history-empty">Nog geen afgeronde sessies.</small>:state.history.slice(0,4).map(item=><div className="history-row" key={item.id}><div><strong>AFTER HOURS Experience</strong><small>{new Date(item.completedAt).toLocaleDateString("nl-NL")} · {item.rounds} rondes</small></div><b>+{item.xpEarned} XP</b></div>)}</div><BadgeShowcase/></section><button className="back" onClick={()=>setScreen("home")}>← Terug</button></main>}

 {screen==="admin"&&<main><section className="admin"><span className="eyebrow">SESSION CONTROL</span><h2>Sessie & veiligheid</h2><div className="adminrow"><Activity/><div><b>Sessie status</b><span>{state.session.status==="active"?"Actief":state.session.status==="paused"?"Gepauzeerd":state.session.status==="completed"?"Afgerond":state.session.status==="stopped"?"Gestopt":"Gereed"}</span></div><i/></div><div className="adminrow"><Shield/><div><b>Consent</b><span>{consent?"Bevestigd voor deze sessie":"Nog niet bevestigd"}</span></div><i/></div><div className="safety-controls"><span className="eyebrow">VEILIGHEIDSNIVEAU</span><strong>{safety==="green"?"Alles volgens afspraak":"Extra check aanbevolen"}</strong><div><button className={safety==="green"?"selected":""} aria-pressed={safety==="green"} onClick={()=>setSafety("green")}>Groen</button><button className={safety==="amber"?"selected":""} aria-pressed={safety==="amber"} onClick={()=>setSafety("amber")}>Amber</button></div></div><div className="adminrow"><Lock/><div><b>Privacy</b><span>{userEmail?"Beveiligde sessie via Supabase":"Lokale sessiedata op dit apparaat"}</span></div><i/></div>{supabaseConfigured&&!userEmail&&<div className="auth-panel"><span className="eyebrow">{passwordRecovery?"PASSWORD RECOVERY":"PRIVATE ACCESS"}</span><strong>{passwordRecovery?"Nieuw wachtwoord instellen":"Veilige toegang"}</strong><p>{passwordRecovery?"Kies een nieuw wachtwoord voor je AFTER HOURS-account.":"Kies je manier van aanmelden. Google en Apple vereisen eenmalige provider-configuratie in Supabase."}</p>{passwordRecovery?null:<div className="auth-providers"><button onClick={()=>void signInProvider("google")} disabled={authBusy}>Google</button><button onClick={()=>void signInProvider("apple")} disabled={authBusy}>Apple</button></div>}<div className="auth-tabs"><button className={authMode==="magic"?"selected":""} onClick={()=>setAuthMode("magic")}>Magic link</button><button className={authMode==="password"?"selected":""} onClick={()=>setAuthMode("password")}>E-mail + wachtwoord</button></div><input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="jij@email.nl" autoComplete="email"/>{(authMode==="password"&&!passwordRecovery)&&<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="Minimaal 8 tekens" autoComplete="current-password"/>}{passwordRecovery&&<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="Nieuw wachtwoord, minimaal 8 tekens" autoComplete="new-password"/>}{passwordRecovery?<button onClick={()=>void saveRecoveredPassword()} disabled={authBusy||authPassword.length<8}>{authBusy?"Opslaan…":"Nieuw wachtwoord opslaan"}</button>:(
 authMode==="magic"
  ?<button onClick={requestMagicLink} disabled={authBusy||!authEmail.trim()}>{authBusy?"Versturen…":"Magic link sturen"}</button>
  :<div className="password-actions"><div className="auth-actions"><button onClick={()=>void submitPasswordAuth(false)} disabled={authBusy||!authEmail.trim()||authPassword.length<8}>Inloggen</button><button onClick={()=>void submitPasswordAuth(true)} disabled={authBusy||!authEmail.trim()||authPassword.length<8}>Account maken</button></div><button className="text-button" onClick={()=>void requestPasswordReset()} disabled={authBusy||!authEmail.trim()}>Wachtwoord vergeten?</button></div>
 )}{authMessage&&<small>{authMessage}</small>}</div>}{userEmail&&<div className="auth-panel"><span className="eyebrow">SIGNED IN</span><strong>{userEmail}</strong><button onClick={()=>void handleSignOut()}>Uitloggen</button></div>}<div className="admin-actions"><button className="secondary" onClick={()=>{reset();setScreen("home")}}>Sessie resetten</button><button className="danger-action" onClick={revokeConsent}>Consent intrekken</button></div></section><button className="back" onClick={()=>setScreen("home")}>← Terug</button></main>}

 {(state.session.status==="active"||state.session.status==="paused")&&screen!=="game"&&<aside className="stop-controller" aria-label="Snelle sessiebediening"><div><span>SESSION CONTROL</span><strong>{state.session.status==="active"?"Sessie loopt":"Sessie gepauzeerd"}</strong></div><button className="stop-controller-pause" onClick={()=>state.session.status==="active"?pauseRound():startRound()} aria-label={state.session.status==="active"?"Sessie pauzeren":"Sessie hervatten"}>{state.session.status==="active"?<Pause/>:<Play/>}{state.session.status==="active"?"Pauze":"Hervat"}</button><button className="stop-controller-stop" onClick={()=>handleCheckIn("stop")} aria-label="Stop de sessie onmiddellijk"><Square/> STOP NU</button></aside>}

 <nav aria-label="Hoofdnavigatie"><button className={screen==="home"?"active":""} onClick={()=>setScreen("home")} aria-current={screen==="home"?"page":undefined}><Home/><span>Home</span></button><button className={screen==="game"?"active":""} onClick={()=>consent?setScreen("game"):setScreen("home")} aria-current={screen==="game"?"page":undefined} aria-disabled={!consent}><Timer/><span>Games</span></button><button className={screen==="insights"?"active":""} onClick={()=>setScreen("insights")} aria-current={screen==="insights"?"page":undefined}><Sparkles/><span>Insights</span></button><button className={screen==="radio"?"active":""} onClick={()=>setScreen("radio")} aria-current={screen==="radio"?"page":undefined}><Radio/><span>Radio</span></button><button className={screen==="profile"?"active":""} onClick={()=>setScreen("profile")} aria-current={screen==="profile"?"page":undefined}><User/><span>Profiel</span></button></nav>
 </div>
}
const root=createRoot(document.getElementById("root")!);
const entryParams=new URLSearchParams(window.location.search);
const enterApp=entryParams.get("enter")==="1";
const maintenancePreview=entryParams.get("maintenance")==="1";
const teaserPreview=entryParams.get("teaser")==="1"||(!enterApp&&!maintenancePreview);
if(teaserPreview){
 root.render(<Teaser/>);
}else if(maintenancePreview){
 root.render(<UnderConstruction/>);
}else{
 void fetch("/maintenance.json",{cache:"no-store"})
  .then(response=>response.ok?response.json():{enabled:false})
  .catch(()=>({enabled:false}))
  .then(config=>root.render(config?.enabled===true?<UnderConstruction/>:<AppErrorBoundary><App/></AppErrorBoundary>));
}
