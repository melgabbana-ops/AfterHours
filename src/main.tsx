import React,{useEffect,useMemo,useRef,useState}from"react";
import UnderConstruction from "./UnderConstruction";
import Teaser from "./Teaser";

import BadgeShowcase from "./BadgeShowcase";
import { recordAchievement } from "./achievements";
import{createRoot}from"react-dom/client";
import{Shield,Lock,Play,Pause,RotateCcw,ChevronRight,User,Settings,Home,Timer,CheckCircle2,Square,Activity,LogOut,Sparkles,Radio,Bell,BookOpen,EyeOff,ShoppingBag,MessageCircle,CalendarDays}from"lucide-react";
import"./styles.css";











import MoodCheckIn from "./MoodCheckIn";



import { recordSessionMoodRemote, type MoodCode, type MoodPhase } from "./services/moods";
import type{AfterHoursState,AvatarStyle,Screen,Safety,SessionHistoryEntry}from"./types";
import{loadState,saveState,loadTimer,saveTimer,clearTimer,defaultState}from"./storage";
import{loadRemoteState,loadRemoteRounds,syncRemoteState,updateRemoteUsername,completeRemoteSession,revokeRemoteConsent}from"./services/backend";
import{supabase,supabaseConfigured}from"./services/supabase";
import{getCurrentUser,sendMagicLink,signInWithProvider,signInWithPassword,signUpWithPassword,resetPassword,updatePassword,signOut}from"./services/auth";
import{playNotificationSound}from"./services/notificationSound";
import{levelFromXp,rankFromXp,rankIndexFromXp,rankNames,rankThresholds}from"./progression";
import{notificationEvents}from"./services/notifications";
import{shouldResumeSession}from"./services/sessionSafety";
import {getMaintenanceStatus,formatMaintenanceDate,type MaintenanceConfig} from "./maintenance";
const PromptLibrary = React.lazy(() => import("./PromptLibrary"));
const Insights = React.lazy(async () => ({ default: (await import("./Insights")).Insights }));
const RadioRoom = React.lazy(async () => ({ default: (await import("./RadioRoom")).RadioRoom }));
const MediaVault = React.lazy(() => import("./MediaVault"));
const SafetyPlan = React.lazy(() => import("./SafetyPlan"));
const Monetization = React.lazy(() => import("./Monetization"));
const CharacterStudio = React.lazy(() => import("./CharacterStudio"));
const Onboarding = React.lazy(() => import("./Onboarding"));
const Missions = React.lazy(() => import("./Missions"));
const AdminDashboard = React.lazy(() => import("./AdminDashboard"));
const LegalCenter = React.lazy(() => import("./LegalCenter"));
const SocialStudio = React.lazy(() => import("./SocialStudio"));
const MoodHistory = React.lazy(() => import("./MoodHistory"));
const LovenseControl = React.lazy(() => import("./LovenseControl"));
const DailyAfterHours = React.lazy(() => import("./DailyAfterHours"));

class AppErrorBoundary extends React.Component<React.PropsWithChildren, {hasError:boolean}>{
 state={hasError:false};
 static getDerivedStateFromError(){return {hasError:true};}
 componentDidCatch(){try{localStorage.setItem("afterhours.last-ui-error",new Date().toISOString())}catch{}}
 render(){
  if(this.state.hasError)return <div className="gate"><div className="gate-card"><img className="gate-logo" src="/after-hours-logo.svg" alt="AFTER HOURS" /><h1>Veilige herstelmodus</h1><p>Er ging iets mis in de interface. Je lokale sessiestatus blijft behouden.</p><button onClick={()=>window.location.reload()}>Opnieuw laden</button></div></div>;
  return this.props.children;
 }
}



const roundTasks=[
 {label:"CHECK-IN · INTENTIE",question:"Welke energie past vandaag bij je?",choices:["Rustig opbouwen","Bewust leiden","Eerst afstemmen"]},
 {label:"DYNAMIEK · REGIE",question:"Wat staat deze ronde centraal?",choices:["Tempo","Grenzen","Vertrouwen"]},
 {label:"AFTERCARE · SIGNALEN",question:"Welk signaal krijgt vandaag voorrang?",choices:["Pauze","Stop","Opnieuw afstemmen"]}
];
const roundTasksEnglish=[
 {label:"CHECK-IN · INTENTION",question:"What kind of energy feels right for you today?",choices:["Build slowly","Lead with intention","Check in first"]},
 {label:"DYNAMIC · LEADERSHIP",question:"What should guide this round?",choices:["Pace","Boundaries","Trust"]},
 {label:"AFTERCARE · SIGNALS",question:"Which signal takes priority today?",choices:["Pause","Stop","Check in again"]}
];

const fallbackRounds=[
 {title:"De Eerste Stap",text:"Neem even de tijd. Spreek af wat vandaag welkom is, wat niet past en wat openblijft voor overleg.",time:1200},
 {title:"De Richting",text:"Kies een opdracht binnen de afgesproken grenzen. Communiceer helder en geef ruimte om van richting te veranderen.",time:1200},
 {title:"De Verdieping",text:"Blijf aanwezig, check bij elkaar in en gebruik het afgesproken stopwoord als dat nodig is. Sluit af met aftercare.",time:1200}
];
const fallbackRoundsEnglish=[
 {title:"The First Step",text:"Take a moment. Agree on what feels welcome today, what is off-limits, and what remains open for discussion.",time:1200},
 {title:"Choose Your Direction",text:"Choose a prompt within the agreed boundaries. Communicate clearly and leave room to change direction.",time:1200},
 {title:"Go Deeper, Stay Present",text:"Stay present, check in with each other, and use the agreed safeword when needed. Finish with aftercare.",time:1200}
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

function App({maintenanceConfig}:{maintenanceConfig:MaintenanceConfig}){
 const [maintenanceNow,setMaintenanceNow]=useState(()=>Date.now());
 useEffect(()=>{const id=window.setInterval(()=>setMaintenanceNow(Date.now()),30_000);return()=>window.clearInterval(id)},[]);
 const maintenanceStatus=useMemo(()=>getMaintenanceStatus(maintenanceConfig,maintenanceNow),[maintenanceConfig,maintenanceNow]);
 const [appUpdateReady,setAppUpdateReady]=useState(false);
 useEffect(()=>{
  if(!("serviceWorker" in navigator))return;
  let active=true;
  const announceUpdate=(registration:ServiceWorkerRegistration)=>{if(active&&registration.waiting&&navigator.serviceWorker.controller)setAppUpdateReady(true);};
  void navigator.serviceWorker.register("/sw.js").then(registration=>{
   announceUpdate(registration);
   registration.addEventListener("updatefound",()=>{
    const installing=registration.installing;
    if(!installing)return;
    installing.addEventListener("statechange",()=>{if(installing.state==="installed"&&navigator.serviceWorker.controller)announceUpdate(registration);});
   });
   void registration.update().catch(()=>{});
  }).catch(()=>{});
  const onControllerChange=()=>{if(active)window.location.reload();};
  navigator.serviceWorker.addEventListener("controllerchange",onControllerChange);
  return()=>{active=false;navigator.serviceWorker.removeEventListener("controllerchange",onControllerChange);};
 },[]);
 const applyAppUpdate=()=>{setAppUpdateReady(false);navigator.serviceWorker?.getRegistration().then(registration=>registration?.waiting?.postMessage({type:"SKIP_WAITING"}));};
 const [language,setLanguage]=useState<"nl"|"en">(()=>{try{return localStorage.getItem("afterhours.language")==="en"?"en":"nl"}catch{return "nl"}});
 useEffect(()=>{try{localStorage.setItem("afterhours.language",language);document.documentElement.lang=language}catch{}},[language]);
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const shareWhatsAppInvite=()=>{const invite=new URL(window.location.href);invite.search="";invite.hash="";const text=language==="en"?"Discover AFTER HOURS, a private 18+ interactive experience.":"Ontdek AFTER HOURS, een privé interactieve ervaring voor 18+.";window.open("https://wa.me/?text="+encodeURIComponent(text+" "+invite.origin+invite.pathname),"_blank","noopener,noreferrer");};
 const localizedRoundTasks=language==="en"?roundTasksEnglish:roundTasks;
 const[state,setState]=useState<AfterHoursState>(()=>loadState());
 const[authReady,setAuthReady]=useState(!supabaseConfigured);
 const[rounds,setRounds]=useState(fallbackRounds);
 useEffect(()=>{let active=true;const refreshRounds=async()=>{if(!supabaseConfigured){setRounds(language==="en"?fallbackRoundsEnglish:fallbackRounds);return;}try{const remote=await loadRemoteRounds(language);if(!active)return;setRounds(remote.length===3?remote.map(item=>({title:item.title,text:item.body,time:item.durationSeconds})):(language==="en"?fallbackRoundsEnglish:fallbackRounds));}catch{if(active)setRounds(language==="en"?fallbackRoundsEnglish:fallbackRounds);}};void refreshRounds();return()=>{active=false}},[language]);
 const initialScreen=(()=>{const value=new URLSearchParams(window.location.search).get("screen");if(value==="game"||value==="profile"||value==="admin"||value==="insights"||value==="radio"||value==="prompts"||value==="safety"||value==="store"||value==="onboarding"||value==="controlroom"||value==="legal"||value==="social")return value;return "home" as Screen})();
 const[screen,setScreen]=useState<Screen>(initialScreen);
 const[privacyMode,setPrivacyMode]=useState(false);
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
 const[isBusinessAdmin,setIsBusinessAdmin]=useState(false);
 useEffect(()=>{let active=true;const checkAdmin=async()=>{if(!syncUserId||!supabaseConfigured||!supabase){setIsBusinessAdmin(false);return;}try{const{data,error}=await supabase.from("app_admins").select("user_id").eq("user_id",syncUserId).maybeSingle();if(active)setIsBusinessAdmin(!error&&Boolean(data));}catch{if(active)setIsBusinessAdmin(false);}};void checkAdmin();return()=>{active=false}},[syncUserId]);
 useEffect(()=>{if(syncUserId)recordAchievement("login",{profileId:syncUserId})},[syncUserId]);
 const[checkIn,setCheckIn]=useState<"clear"|"pause"|"stop">("clear");
 const[moodBefore,setMoodBefore]=useState<MoodCode|null>(null);
 const[moodDuring,setMoodDuring]=useState<MoodCode|null>(null);
 const[moodAfter,setMoodAfter]=useState<MoodCode|null>(null);
 const[moodMessage,setMoodMessage]=useState("");
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
    setProfileMessage(t("Accountstatus kon niet worden gecontroleerd door een verbindingsfout. Je lokale gegevens blijven behouden; controleer je verbinding en laad opnieuw.","Account status could not be checked because of a connection error. Your local data is preserved; check your connection and reload."));
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
    remoteRounds=await loadRemoteRounds(language);
   }catch{
    setProfileMessage(t("De online ervaringsrondes konden niet worden geladen. De standaardrondes blijven beschikbaar.","Online experience rounds could not be loaded. The default rounds remain available."));
   }
   if(!active||generation!==hydrateGeneration.current)return;
   const availableRounds=remoteRounds.length===3?remoteRounds.map(r=>({title:r.title,text:r.body,time:r.durationSeconds})):fallbackRounds;
   if(remoteRounds.length===3)setRounds(availableRounds);
   let remote:AfterHoursState|null=null;
   try{
    remote=await loadRemoteState(localState.session.id);
   }catch{
    setProfileMessage(t("Online sessiegegevens zijn tijdelijk niet bereikbaar. De app probeert opnieuw en gebruikt intussen beschikbare lokale gegevens.","Online session data is temporarily unavailable. The app will retry and use available local data in the meantime."));
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

 useEffect(()=>{try{saveState(state)}catch{setProfileMessage(t("Lokale opslag is niet beschikbaar. Gebruik een ingelogd account om sessiegegevens server-side op te slaan.","Local storage is unavailable. Sign in to save session data on the server."))}if(!supabaseConfigured||syncUserId){void syncRemoteState(state).then(message=>{if(message)setProfileMessage(message)}).catch(()=>setProfileMessage(t("Synchronisatie is tijdelijk niet beschikbaar. Controleer je verbinding voordat je verdergaat.","Sync is temporarily unavailable. Check your connection before continuing.")))}if(!syncUserId)return;},[state,syncUserId]);
 useEffect(()=>{if(!running)return;const id=setInterval(()=>setSeconds(s=>{const next=Math.max(0,s-1);if(!saveTimer(state.profile.id,state.session.round,next,true))setProfileMessage(current=>current||t("Timer kan niet lokaal worden opgeslagen. Houd deze pagina open en controleer je opslaginstellingen.","The timer cannot be saved locally. Keep this page open and check your storage settings."));return next}),1000);return()=>clearInterval(id)},[running,state.session.round,state.profile.id]);
 useEffect(()=>{if(seconds!==0||state.session.status!=="active")return;clearTimer(state.profile.id);setRunning(false);saveTimer(state.profile.id,state.session.round,0,false);void playNotificationSound("checkin");setState(s=>({...s,notifications:[notificationEvents.checkIn(t("De tijd van deze ronde is voorbij. De sessie staat op pauze en kan veilig worden hervat.","Time is up for this round. The session is paused and can be safely resumed.")),...s.notifications].slice(0,20),session:{...s.session,status:"paused",updatedAt:new Date().toISOString()}}))},[seconds,state.session.status,rounds]);

 const round=state.session.round;
 const consent=state.consent.status==="active";
 const safety=state.safety;
 const unreadNotifications=state.notifications.filter(item=>!item.read).length;
 const markNotificationRead=(id:string)=>setState(s=>({...s,notifications:s.notifications.map(item=>item.id===id?{...item,read:true}:item)}));
 const markAllNotificationsRead=()=>setState(s=>({...s,notifications:s.notifications.map(item=>({...item,read:true}))}));
 useEffect(()=>{if(screen==="home"||screen==="legal")return;if(!state.ageConfirmed){setScreen("home");return}if(screen==="game"&&state.consent.status!=="active"){setScreen("home")}},[screen,state.ageConfirmed,state.consent.status]);
 const xp=state.profile.xp;
 const currentLevel=Math.max(1,state.profile.level);
 const levelFloor=(currentLevel-1)*200;
 const nextLevelFloor=currentLevel*200;
 const levelProgress=Math.min(100,Math.max(0,Math.round(((xp-levelFloor)/(nextLevelFloor-levelFloor))*100)));
 const progress=Math.round(((round+1)/rounds.length)*100);
 const clock=useMemo(()=>String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0"),[seconds]);
 const persistTimer=(profileId:string,roundIndex:number,value:number,isRunning:boolean)=>{
  if(!saveTimer(profileId,roundIndex,value,isRunning)){
   setProfileMessage(t("Timer kon niet lokaal worden opgeslagen. Houd deze pagina open en controleer je opslaginstellingen.","The timer could not be saved locally. Keep this page open and check your storage settings."));
  }
 };

 const updateSession=(patch:Partial<AfterHoursState["session"]>)=>setState(s=>({...s,session:{...s.session,...patch,updatedAt:new Date().toISOString()}}));
 const pauseRound=()=>{setRunning(false);persistTimer(state.profile.id,round,seconds,false);updateSession({status:"paused"})};
 const startRound=()=>{
  if(supabaseConfigured&&!syncUserId){setAuthMessage(t("Log in voordat je een sessie start, zodat consent en actieve speeltijd veilig worden opgeslagen.","Sign in before starting a session so consent and active play time can be saved securely."));setScreen("admin");return}
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
  if(!syncUserId){setProfileMessage(t("Log in om een sessie server-side af te ronden en XP veilig op te slaan.","Sign in to finish a session on the server and save XP securely."));return;}
  finishingSession.current=true;
  setFinishing(true);
  try{
   const completedAt=new Date().toISOString();
   const remoteResult=await completeRemoteSession(state.session.id,rounds.length);
   if(remoteResult.error){setProfileMessage(t("Sessie kon niet veilig worden afgerond: ","The session could not be finished safely: ")+remoteResult.error);return;}
   if(remoteResult.alreadyCompleted){
    const remote=await loadRemoteState(state.session.id);
    if(remote)setState(current=>({...remote,ageConfirmed:current.ageConfirmed,ageConfirmedFor:current.ageConfirmedFor,safety:current.safety,consent:{status:"pending",confirmedAt:null,revokedAt:null}}));
    else setState(current=>({...current,consent:{status:"pending",confirmedAt:null,revokedAt:null},session:{...current.session,round:0,status:"completed",startedAt:null,updatedAt:completedAt}}));
    setRunning(false);
    clearTimer(state.profile.id);
    setProfileMessage(t("Deze sessie was al server-side afgerond. De opgeslagen status is opnieuw geladen; er is geen nieuwe XP toegekend.","This session was already completed on the server. Its saved state was reloaded; no extra XP was awarded."));
    setScreen("home");
    return;
   }
   const earned=remoteResult.xpEarned;
   recordAchievement("session_complete",{completedSessions:state.profile.sessions+1,profileId:syncUserId});
   void playNotificationSound("message");
   setState(s=>{const nextXp=s.profile.xp+earned;return {...s,consent:{status:"pending",confirmedAt:null,revokedAt:null},profile:{...s.profile,xp:nextXp,level:levelFromXp(nextXp),sessions:s.profile.sessions+1},history:[{id:"session-"+Date.now(),completedAt,xpEarned:earned,rounds:rounds.length},...s.history].slice(0,12),notifications:[notificationEvents.message(t("Sessie voltooid","Session complete"),t("De volledige Experience is afgerond en veilig opgeslagen. +","The full experience has been completed and saved securely. +")+earned+" XP "+t("is toegevoegd.","has been awarded.")),...s.notifications].slice(0,20),session:{...s.session,round:0,status:"completed",startedAt:null,updatedAt:completedAt}}});
   setSeconds(rounds[0].time);
   setAftercareChoice(null);
   setScreen("home");
  }catch(error){
   setProfileMessage(t("Sessie kon niet veilig worden afgerond: ","The session could not be finished safely: ")+(error instanceof Error?error.message:t("onbekende fout","unknown error")));
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
 const stop=()=>{const now=new Date().toISOString();revokeConsentRemotely(state.session.id,now);clearTimer(state.profile.id);setRunning(false);setCheckIn("stop");setState(s=>({...s,consent:{status:"revoked",confirmedAt:null,revokedAt:now},notifications:[notificationEvents.safety(t("De sessie is veilig gestopt. Bevestig consent opnieuw voordat je opnieuw start.","The session has been safely stopped. Confirm consent again before restarting.")),...s.notifications].slice(0,20),session:{...s.session,status:"stopped",startedAt:null,updatedAt:now}}));setScreen("home")};
 const revokeConsent=()=>{const now=new Date().toISOString();revokeConsentRemotely(state.session.id,now);clearTimer(state.profile.id);setRunning(false);setState(s=>({...s,consent:{status:"revoked",confirmedAt:null,revokedAt:now},session:{...s.session,status:"stopped",startedAt:null,updatedAt:now}}));setSeconds(rounds[round].time);persistTimer(state.profile.id,round,rounds[round].time,false);setScreen("home")};
 const confirmConsent=()=>{if(supabaseConfigured&&!syncUserId){setAuthMessage(t("Log in om consent en sessievoortgang veilig aan je account te koppelen.","Sign in to securely link consent and session progress to your account."));setScreen("admin");return;}setCheckIn("clear");recordAchievement("consent_confirmed",{profileId:syncUserId});void playNotificationSound("checkin");setState(s=>({...s,notifications:[notificationEvents.checkIn(t("Je toestemming is bevestigd. Je kunt de experience veilig starten.","Your consent is confirmed. You can safely start the experience.")),...s.notifications].slice(0,20),consent:{status:"active",confirmedAt:new Date().toISOString(),revokedAt:null}}));};
 const handleCheckIn=(choice:"clear"|"pause"|"stop")=>{setCheckIn(choice);void playNotificationSound(choice==="stop"?"safety":"checkin");if(choice==="pause"){setRunning(false);persistTimer(state.profile.id,round,seconds,false);updateSession({status:"paused"})}if(choice==="stop"){stop()}};
 const handleMoodChoice=(phase:MoodPhase,mood:MoodCode)=>{
  if(phase==="before")setMoodBefore(mood);
  if(phase==="during")setMoodDuring(mood);
  if(phase==="after")setMoodAfter(mood);
  setMoodMessage("");
  try{
   const key="afterhours.moodhistory."+state.profile.id;
   const previous=JSON.parse(localStorage.getItem(key)||"[]");
   const events=Array.isArray(previous)?previous:[];
   localStorage.setItem(key,JSON.stringify([{id:crypto.randomUUID(),session_id:state.session.id,phase,mood,created_at:new Date().toISOString()},...events].slice(0,100)));
  }catch{/* Local mood history is an optional fallback. */}
  if(supabaseConfigured&&syncUserId){
   void recordSessionMoodRemote(state.session.id,phase,mood).then(error=>{
    if(error)setMoodMessage(t("Stemming lokaal bewaard; serveropslag nog niet bevestigd.","Mood saved locally; server storage is not confirmed.")+" "+error);
   }).catch(()=>setMoodMessage(t("Stemming lokaal bewaard; synchronisatie is niet gelukt.","Mood saved locally; synchronisation failed.")));
  }
  if(phase==="during"&&mood==="STOP"){stop();return}
  if(phase==="during"&&(mood==="NEED A PAUSE"||mood==="OVERWHELMED")){
   setMoodMessage(t("Je bent in controle. Neem je tijd.","You are in control. Take your time."));
   handleCheckIn("pause");
  }
 };
 const saveDisplayName=()=>{const name=displayNameDraft.trim().replace(/\s+/g," ");if(name.length<2)return;setState(s=>({...s,profile:{...s.profile,displayName:name}}));setDisplayNameDraft(name)};
 const saveUsername=async()=>{
  const username=usernameDraft.trim().toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20);
  if(username.length<3){setProfileMessage(t("Username moet minimaal 3 tekens bevatten.","Your username must contain at least 3 characters."));return;}
  setProfileMessage("");
  try{
   if(supabaseConfigured&&syncUserId){
    const message=await updateRemoteUsername(username);
    if(message){setProfileMessage(message);return;}
   }
   setState(s=>({...s,profile:{...s.profile,username}}));
   setUsernameDraft(username);
   setProfileMessage(t("Username opgeslagen.","Username saved."));
  }catch{
   setProfileMessage(t("Username kon niet worden opgeslagen. Controleer je verbinding en probeer het opnieuw.","Your username could not be saved. Check your connection and try again."));
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
 const signInProvider=async(provider:"google"|"apple")=>{setAuthMessage("");setAuthBusy(true);try{await signInWithProvider(provider)}catch(error){setAuthMessage(error instanceof Error?error.message:t("Aanmelden mislukt.","Sign-in failed."))}finally{setAuthBusy(false)}};
 const requestMagicLink=async()=>{setAuthMessage("");setAuthBusy(true);try{await sendMagicLink(authEmail.trim());setAuthMessage(t("Check je e-mail voor je veilige toegang.","Check your email for your secure sign-in link."));}catch(error){setAuthMessage(error instanceof Error?error.message:t("Aanmelden mislukt.","Sign-in failed."))}finally{setAuthBusy(false)}};
 const submitPasswordAuth=async(createAccount:boolean)=>{setAuthMessage("");setAuthBusy(true);try{if(createAccount){await signUpWithPassword(authEmail.trim(),authPassword);setAuthMessage(t("Account aangemaakt. Bevestig je e-mail als Supabase e-mailbevestiging actief is.","Account created. Confirm your email if Supabase email confirmation is enabled."));}else{await signInWithPassword(authEmail.trim(),authPassword);}}catch(error){setAuthMessage(error instanceof Error?error.message:t("Aanmelden mislukt.","Sign-in failed."))}finally{setAuthBusy(false)}};
 const handleSignOut=async()=>{setAuthMessage("");try{await signOut()}catch(error){setAuthMessage(error instanceof Error?error.message:t("Uitloggen mislukt.","Sign-out failed."))}};
 const requestPasswordReset=async()=>{setAuthMessage("");setAuthBusy(true);try{await resetPassword(authEmail.trim());setAuthMessage(t("Als dit e-mailadres bekend is, ontvang je een link om je wachtwoord opnieuw in te stellen.","If this email address is registered, you will receive a link to reset your password."));}catch(error){setAuthMessage(error instanceof Error?error.message:"Resetten mislukt.")}finally{setAuthBusy(false)}};
 const saveRecoveredPassword=async()=>{setAuthMessage("");setAuthBusy(true);try{await updatePassword(authPassword);setAuthMessage(t("Je wachtwoord is bijgewerkt.","Your password has been updated."));setAuthPassword("");setPasswordRecovery(false);}catch(error){setAuthMessage(error instanceof Error?error.message:"Wachtwoord bijwerken mislukt.")}finally{setAuthBusy(false)}};

 if(maintenanceStatus.active)return <UnderConstruction config={maintenanceConfig} language={language}/>;
 if(screen==="legal")return <React.Suspense fallback={<div className="gate"><div className="gate-card"><p>{t("Scherm laden…","Loading screen…")}</p></div></div>}><LegalCenter language={language} onBack={()=>setScreen("home")}/></React.Suspense>;
 if(!authReady)return <div className="gate"><div className="gate-card"><img className="gate-logo" src="/after-hours-logo.svg" alt="AFTER HOURS" /><h1>{t("Sessie herstellen…","Restoring session…")}</h1><p>{t("Beveiligde toegang wordt gecontroleerd.","Checking secure access.")}</p></div></div>;
 if(!state.ageConfirmed)return <div className="gate"><img className="gate-logo" src="/after-hours-logo.svg" alt="AFTER HOURS" /><span className="eyebrow">PRIVATE EXPERIENCE · 18+</span><h1>AFTER<br/><i>HOURS</i></h1><p>Een premium interactieve ervaring voor volwassenen. Bewust. Afgesproken. Veilig.</p><button onClick={()=>{setState(s=>({...s,ageConfirmed:true,ageConfirmedFor:syncUserId??"local"}));try{if(localStorage.getItem("afterhours.onboarding.completed")!=="1")setScreen("onboarding")}catch{setScreen("onboarding")}}}>Ik ben 18+ <ChevronRight/></button><small>Dit is een zelfverklaring, geen officiële leeftijdsverificatie. Consent wordt afzonderlijk gevraagd.</small><div className="gate-legal-links"><button type="button" onClick={()=>setScreen("legal")}>Juridische informatie / Privacy</button></div></div>;

 return <div className={`app ${privacyMode?"privacy-mode":""}`}>
 {appUpdateReady&&<aside className="app-update-notice" role="status"><span>{t("Een nieuwe versie van AFTER HOURS staat klaar.","A new version of AFTER HOURS is ready.")}</span><button type="button" onClick={applyAppUpdate}>{t("Nu vernieuwen","Refresh now")}</button><button type="button" aria-label={t("Melding sluiten","Dismiss update notice")} onClick={()=>setAppUpdateReady(false)}>×</button></aside>}
 {maintenanceStatus.warning&&<aside className="maintenance-warning" role="status" aria-live="polite"><div><strong>{t("Gepland onderhoud komt eraan","Scheduled maintenance is coming up")}</strong><span>{language==="nl"?maintenanceStatus.messageNL:maintenanceStatus.messageEN}</span><small>{t("Start: ","Starts: ")}{maintenanceStatus.startsAtMs===null?"":formatMaintenanceDate(maintenanceStatus.startsAtMs,language)}{maintenanceStatus.endsAtMs!==null?" · "+t("verwacht einde: ","expected finish: ")+formatMaintenanceDate(maintenanceStatus.endsAtMs,language):""}</small></div></aside>}
 <header><button className="wordmark brand-nav" onClick={()=>setScreen("home")} aria-label="AFTER HOURS home"><img src="/after-hours-logo.svg" alt="AFTER HOURS" /></button><div className="header-tools"><button type="button" className="safety-shortcut" aria-label={t("Veiligheidsplan openen","Open safety plan")} title={t("Veiligheidsplan","Safety plan")} onClick={()=>setScreen("safety")}><Shield size={17}/></button><button type="button" className="privacy-shortcut" aria-label={privacyMode?t("Privémodus uitschakelen","Turn privacy mode off"):t("Privémodus inschakelen","Turn privacy mode on")} title={privacyMode?t("Privémodus uitschakelen","Turn privacy mode off"):t("Privémodus","Privacy mode")} aria-pressed={privacyMode} onClick={()=>setPrivacyMode(value=>!value)}><EyeOff size={16}/></button><button type="button" className="language-toggle" aria-label={t("Taal wijzigen","Change language")} onClick={()=>setLanguage(language==="nl"?"en":"nl")}><span className={language==="nl"?"language-active":""}>NL</span><span className="language-divider">/</span><span className={language==="en"?"language-active":""}>EN</span></button><div className="status"><span></span> {t("privé sessie","private session")}</div></div></header>

 {screen==="home"&&<main>  {authReady&&(!supabaseConfigured||!syncUserId)&&<section className="consent-panel" role="status"><Lock/><div><strong>{supabaseConfigured?t("Niet ingelogd","Not signed in"):t("Lokale demo-modus","Local demo mode")}</strong><span>{supabaseConfigured?t("Je kunt de experience bekijken, maar log in voordat je begint om sessievoortgang en XP aan je account te koppelen.","You can preview the experience, but sign in before starting to link session progress and XP to your account."):t("De Supabase-backend is niet ingesteld. Voortgang blijft lokaal op dit apparaat; sessies kunnen niet server-side worden afgerond en leveren geen opgeslagen XP op.","The Supabase backend is not configured. Progress stays on this device; sessions cannot be completed server-side and XP will not be saved.")}</span></div>{supabaseConfigured&&!syncUserId&&<button onClick={()=>setScreen("admin")}>{t("Inloggen","Sign in")}</button>}</section>}
  <MoodCheckIn phase="before" language={language} selected={moodBefore} onSelect={mood=>handleMoodChoice("before",mood)}/>
  <div className="notification-bar">
   <button className="notification-button" aria-label={unreadNotifications?unreadNotifications+" "+t("ongelezen meldingen","unread notifications"):t("Meldingen","Notifications")} aria-expanded={notificationsOpen} onClick={()=>setNotificationsOpen(open=>!open)}>
    <Bell size={16}/>
    {unreadNotifications>0&&<span>{unreadNotifications>9?"9+":unreadNotifications}</span>}
   </button>
   {notificationsOpen&&<div className="notification-panel" role="dialog" aria-label={t("Meldingen","Notifications")}>
    <div className="notification-head"><strong>{t("MELDINGEN","NOTIFICATIONS")}</strong><button onClick={markAllNotificationsRead} disabled={!unreadNotifications}>{t("Alles gelezen","Mark all read")}</button></div>
    {state.notifications.length?state.notifications.slice(0,8).map(item=><button key={item.id} className={"notification-item "+(item.read?"":"unread")} onClick={()=>markNotificationRead(item.id)}><b>{item.title}</b><span>{item.body}</span></button>):<small>{t("Geen nieuwe meldingen.","No new notifications.")}</small>}
   </div>}
  </div>
  <section className="hero home-hero">
   <img className="home-wordmark" src="/after-hours-logo.svg" alt="AFTER HOURS"/>
   <span className="eyebrow">{t("WELKOM TERUG","WELCOME BACK")}</span><h2>{state.profile.displayName||"Mysti"}</h2>
   <div className="home-level"><span>♙</span><div><strong>Level {state.profile.level}</strong><small>{xp} / {nextLevelFloor} XP</small><div className="home-xp"><i style={{width:levelProgress+"%"}}/></div></div></div>
   <button className="home-start gold" onClick={()=>{if(consent){setScreen("game");return}document.getElementById("consent")?.scrollIntoView({behavior:"smooth",block:"center"})}}>{t("START EXPERIENCE","START EXPERIENCE")} <ChevronRight/></button>
  </section>
  <section className="grid home-shortcuts">
   <button className="tile" onClick={()=>setScreen("insights")}><Sparkles/><span>{t("Kinky Tarot","Kinky Tarot")}</span></button>
   <button className="tile" onClick={()=>setScreen("insights")}><Activity/><span>{t("Horoscoop","Horoscope")}</span></button>
   <button className="tile" onClick={()=>setScreen("radio")}><Radio/><span>Radio</span></button>
   <button className="tile" onClick={()=>setScreen("prompts")}><BookOpen/><span>The Deck</span></button>
   <button className="tile" onClick={()=>setScreen("missions")}><Activity/><span>{t("Missies","Missions")}</span></button>
   <button className="tile" onClick={()=>setScreen("daily")}><CalendarDays/><span>{t("Daily After Hours","Daily After Hours")}</span></button>
   <button className="tile" onClick={()=>setScreen("store")}><ShoppingBag/><span>{t("Collecties & prijzen","Collections & pricing")}</span></button>
   <button className="tile" onClick={()=>setScreen("social")}><MessageCircle/><span>{t("Social studio","Social studio")}</span></button>
   <button className="tile" onClick={()=>setScreen("lovense")}><Activity/><span>{t("Lovense Connect","Lovense Connect")}</span></button>
   <button className="tile" onClick={()=>setScreen("legal")}><BookOpen/><span>{t("Juridische info","Legal information")}</span></button>
   <button className="tile" onClick={shareWhatsAppInvite}><MessageCircle/><span>{t("Deel via WhatsApp","Invite via WhatsApp")}</span></button>
   {isBusinessAdmin&&<button className="tile admin-launch-tile" onClick={()=>setScreen("controlroom")}><Shield/><span>{t("Beheerpaneel","Admin dashboard")}</span></button>}
  </section>
  {!consent&&<section id="consent" className="consent-panel"><Shield/><div><strong>{t("Consent is vereist","Consent is required")}</strong><span>{t("Bevestig je vrijwillige toestemming voordat je een ervaring start.","Confirm your voluntary consent before starting an experience.")}</span></div><button onClick={confirmConsent}>{t("Bevestigen","Confirm")}</button></section>}
  {(consent&&(state.session.status==="active"||state.session.status==="paused"))&&<section className="resume-panel"><Activity/><div><strong>{state.session.status==="active"?t("Sessie hervatbaar","Session ready to resume"):t("Sessie gepauzeerd","Session paused")}</strong><span>{state.session.status==="active"?t("De timer loopt verder vanaf de opgeslagen positie.","The timer resumes from its saved position."):t("Je kunt doorgaan vanaf de opgeslagen positie.","You can continue from the saved position.")}</span></div><button onClick={()=>setScreen("game")}>{state.session.status==="active"?t("Ga verder","Continue"):t("Hervatten","Resume")} <ChevronRight/></button></section>}
 </main>}

 {screen==="game"&&<main className="experience-shell">{!consent?<section className="round"><span className="eyebrow">TOEGANG VEREIST</span><h2>{t("Consent eerst.","Consent first.")}</h2><p>{t("Bevestig je vrijwillige toestemming voordat je de experience opent.","Confirm your voluntary consent before opening the experience.")}</p><button className="gold" onClick={()=>setScreen("home")}>{t("Naar consent","Go to consent")} <ChevronRight/></button></section>:<><div className="game-top"><button onClick={stop} aria-label={t("Sessie verlaten","Leave session")}><LogOut/></button><span>ROUND {String(round+1).padStart(2,"0")} / {String(rounds.length).padStart(2,"0")}</span></div><div className="round-steps">{rounds.map((item,index)=><span key={item.title} className={index===round?"current":index<round?"done":""}>{String(index+1).padStart(2,"0")} · {item.title}</span>)}</div><div className="progress"><span style={{width:progress+"%"}}/></div><section className="round"><span className="eyebrow">AFTER HOURS</span><h2>{rounds[round].title}</h2><p>{rounds[round].text}</p><div className="task-card"><span className="eyebrow">{localizedRoundTasks[round]?.label}</span><strong>{localizedRoundTasks[round]?.question}</strong><div>{localizedRoundTasks[round]?.choices.map(choice=><button key={choice} className={selectedTask===choice?"selected":""} aria-pressed={selectedTask===choice} onClick={()=>setSelectedTask(choice)}>{choice}</button>)}</div><small>{selectedTask?t("Je keuze is bewaard voor deze ronde. Je kunt altijd van richting veranderen.","Your choice is saved for this round. You can always change direction."):t("Kies alleen als dit voor jou goed voelt en stem samen af.","Choose only if it feels right for you, and check in with each other.")}</small></div><div className="timer"><Timer/><strong>{clock}</strong><small>{t("TIJD OVER","TIME LEFT")}</small></div><div className="actions"><button className="gold" onClick={()=>running?pauseRound():startRound()}>{running?<Pause/>:<Play/>}{running?t("Pauzeren","Pause"):t("Start ronde","Start round")}</button><button onClick={reset}><RotateCcw/> {t("Reset","Reset")}</button><button className="stop" onClick={stop}><Square/> {t("Stop sessie","Stop session")}</button></div><div className="consent"><CheckCircle2/><div><strong>{t("Consent bevestigd","Consent confirmed")}</strong><span>{t("Je kunt op elk moment stoppen.","You can stop at any time.")}</span></div></div><MoodCheckIn phase="during" language={language} selected={moodDuring} onSelect={mood=>handleMoodChoice("during",mood)}/>{moodMessage&&<p className="mood-save-message" role="status">{moodMessage}</p>}</section><button className="next" onClick={next}>{round===rounds.length-1?t("Afronden","Finish"):t("Volgende ronde","Next round")} <ChevronRight/></button></>}</main>}

 {screen==="aftercare"&&<main className="aftercare-screen"><section className="aftercare-card"><span className="eyebrow">AFTER HOURS · AFTERCARE</span><h2>{t("Rustig landen","Land softly.")}</h2><p>{t("De Experience is voorbij. Kies wat nu het beste past. Niets hoeft meteen.","The Experience is over. Choose what feels right now. Nothing has to happen immediately.")}</p><MoodCheckIn phase="after" language={language} selected={moodAfter} onSelect={mood=>handleMoodChoice("after",mood)}/>{moodMessage&&<p className="mood-save-message" role="status">{moodMessage}</p>}<div className="aftercare-options"><button className={aftercareChoice==="land"?"selected":""} onClick={()=>setAftercareChoice("land")}><strong>{t("Rustig landen","Land softly")}</strong><span>{t("Even zitten, ademen en het tempo laten zakken.","Sit for a moment, breathe, and let the pace settle.")}</span></button><button className={aftercareChoice==="talk"?"selected":""} onClick={()=>setAftercareChoice("talk")}><strong>{t("Kort napraten","Talk it through")}</strong><span>{t("Bespreek samen wat goed voelde en wat je wilt meenemen.","Share what felt good and what you want to carry forward.")}</span></button><button className={aftercareChoice==="space"?"selected":""} onClick={()=>setAftercareChoice("space")}><strong>{t("Ruimte & water","Space & water")}</strong><span>{t("Neem even afstand, drink iets en kom rustig terug.","Take a little space, have some water, and return at your own pace.")}</span></button></div><div className="aftercare-note"><Shield/><span>{t("Aftercare is geen verplichting om iets te delen. Een pauze, grens of stop blijft altijd geldig.","Aftercare never obliges you to share. A pause, boundary, or stop is always valid.")}</span></div><button className="gold aftercare-complete" onClick={()=>void finishSession()} disabled={!aftercareChoice||finishing}>{finishing?t("Veilig afronden…","Finishing safely…"):t("Sessie veilig afronden","Finish session safely")}</button><button className="back" onClick={()=>setScreen("home")}>← {t("Terug","Back")}</button></section></main>}

 <React.Suspense fallback={<main className="feature-loading" role="status"><p>{t("Scherm wordt geladen…","Loading screen…")}</p></main>}>
 {screen==="prompts"&&<PromptLibrary playerId={state.profile.id} language={language} onBack={()=>setScreen("home")} onComplete={()=>recordAchievement("prompt_complete",{profileId:syncUserId})}/>}
 {screen==="missions"&&<Missions language={language} onBack={()=>setScreen("home")} onExplore={(destination)=>setScreen((destination==="aftercare"?"aftercare":destination==="safety"?"safety":destination==="insights"?"insights":destination==="prompts"?"prompts":"home"))}/> }
 {screen==="daily"&&<DailyAfterHours profileId={state.profile.id} language={language} onBack={()=>setScreen("home")} onOpenMissions={()=>setScreen("missions")} onOpenInsights={()=>setScreen("insights")}/>}
 {screen==="social"&&<SocialStudio language={language} onBack={()=>setScreen("home")}/>}
 {screen==="lovense"&&<LovenseControl language={language} isAuthenticated={Boolean(supabaseConfigured&&syncUserId)} onBack={()=>setScreen("home")}/>}

 {screen==="insights"&&<Insights language={language} profileId={syncUserId} onBack={()=>setScreen("home")}/>}

 {screen==="radio"&&<RadioRoom language={language} onBack={()=>setScreen("home")}/>}

 {screen==="safety"&&<main className="safety-screen"><SafetyPlan language={language}/><button className="back" onClick={()=>setScreen("home")}>← {t("Terug","Back")}</button></main>}

 {screen==="store"&&<Monetization language={language} onBack={()=>setScreen("home")} onStartFree={()=>setScreen("home")}/> }

 {screen==="onboarding"&&<Onboarding language={language} onComplete={()=>setScreen("home")}/> }

 {screen==="controlroom"&&<AdminDashboard language={language} onBack={()=>setScreen("profile")}/>}
 {screen==="profile"&&<main><section className="profile"><div className={`avatar identity-avatar avatar-${avatarStyle}`}><div className="avatar-sigil">{avatarSymbols.find(item=>item.style===avatarStyle)?.symbol??"✦"}</div><div className="avatar-initials">{state.profile.displayName.trim().split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div><span>{rankFromXp(xp)}</span></div><span className="eyebrow">YOUR PROFILE · AFTER HOURS IDENTITY</span><h2>{state.profile.displayName}</h2><p>@{state.profile.username} · Level {state.profile.level} · {xp} XP</p><CharacterStudio profileId={state.profile.id} language={language}/><MoodHistory profileId={state.profile.id} language={language}/>
   <div className="avatar-picker" aria-label={t("Kies je AFTER HOURS identity","Choose your AFTER HOURS identity")}><span className="eyebrow">IDENTITY SIGIL</span><div className="avatar-options">{avatarSymbols.map(item=><button key={item.style} className={avatarStyle===item.style?"selected":""} onClick={()=>setAvatarStyle(item.style)} aria-pressed={avatarStyle===item.style}><span>{item.symbol}</span><small>{item.label}</small></button>)}</div></div><MediaVault sessionId={state.session.id} language={language}/><div className="name-editor"><label htmlFor="display-name">{t("AFTER HOURS-NAAM","AFTER HOURS NAME")}</label><div><input id="display-name" value={displayNameDraft} onChange={e=>setDisplayNameDraft(e.target.value)} maxLength={24} autoComplete="nickname"/><button onClick={saveDisplayName} disabled={displayNameDraft.trim().length<2}>{t("Opslaan","Save")}</button></div></div><div className="name-editor"><label htmlFor="after-hours-username">{t("AFTER HOURS-USERNAME","AFTER HOURS USERNAME")}</label><div><span className="username-prefix">@</span><input id="after-hours-username" value={usernameDraft} onChange={e=>setUsernameDraft(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20))} maxLength={20} autoComplete="username" aria-describedby="username-help"/><button onClick={saveUsername} disabled={usernameDraft.trim().length<3}>{t("Opslaan","Save")}</button><span id="username-help" className="username-help">{t("uniek","unique")}</span></div>{profileMessage&&<small className="profile-message" role="status">{profileMessage}</small>}</div><span className="profile-rank">{rankFromXp(xp)}</span><div className="xp"><span style={{width:levelProgress+"%"}}/></div><small className="xp-label">{Math.max(0,nextLevelFloor-xp)} XP {t("tot Level","to Level")} {currentLevel+1}</small><div className="rank-ladder"><span className="eyebrow">RANK LADDER</span><div>{rankNames.map((rank,index)=><span key={rank} className={index===rankIndexFromXp(xp)?"current":index<rankIndexFromXp(xp)?"passed":""}>{String(index+1).padStart(2,"0")} {rank} · {rankThresholds[index]} XP</span>)}</div></div><div className="stats"><div><b>{String(state.profile.level).padStart(2,"0")}</b><small>LEVEL</small></div><div><b>{String(state.profile.sessions).padStart(2,"0")}</b><small>{t("SESSIES","SESSIONS")}</small></div><div><b>{xp}</b><small>XP</small></div></div><div className="history"><span className="eyebrow">{t("RECENTE SESSIES","RECENT SESSIONS")}</span>{state.history.length===0?<small className="history-empty">{t("Nog geen afgeronde sessies.","No completed sessions yet.")}</small>:state.history.slice(0,4).map(item=><div className="history-row" key={item.id}><div><strong>AFTER HOURS Experience</strong><small>{new Date(item.completedAt).toLocaleDateString(language==="en"?"en-GB":"nl-NL")} · {item.rounds} {t("rondes","rounds")}</small></div><b>+{item.xpEarned} XP</b></div>)}</div><BadgeShowcase profileId={syncUserId}/></section><button className="back" onClick={()=>setScreen("home")}>← {t("Terug","Back")}</button></main>}

 {screen==="admin"&&<main><section className="admin"><span className="eyebrow">SESSION CONTROL</span><h2>{t("Sessie & veiligheid","Session & safety")}</h2><div className="adminrow"><Activity/><div><b>{t("Sessie status","Session status")}</b><span>{state.session.status==="active"?t("Actief","Active"):state.session.status==="paused"?t("Gepauzeerd","Paused"):state.session.status==="completed"?t("Afgerond","Completed"):state.session.status==="stopped"?t("Gestopt","Stopped"):t("Gereed","Ready")}</span></div><i/></div><div className="adminrow"><Shield/><div><b>Consent</b><span>{consent?t("Bevestigd voor deze sessie","Confirmed for this session"):t("Nog niet bevestigd","Not confirmed yet")}</span></div><i/></div><div className="safety-controls"><span className="eyebrow">{t("VEILIGHEIDSNIVEAU","SAFETY LEVEL")}</span><strong>{safety==="green"?t("Alles volgens afspraak","Within agreed limits"):t("Extra check aanbevolen","Additional check recommended")}</strong><div><button className={safety==="green"?"selected":""} aria-pressed={safety==="green"} onClick={()=>setSafety("green")}>{t("Groen","Green")}</button><button className={safety==="amber"?"selected":""} aria-pressed={safety==="amber"} onClick={()=>setSafety("amber")}>{t("Amber","Amber")}</button></div></div><div className="adminrow"><Lock/><div><b>{t("Privacy","Privacy")}</b><span>{userEmail?t("Beveiligde sessie via Supabase","Secure session via Supabase"):t("Lokale sessiedata op dit apparaat","Session data stored locally on this device")}</span></div><i/></div>{supabaseConfigured&&!userEmail&&<div className="auth-panel"><span className="eyebrow">{passwordRecovery?"PASSWORD RECOVERY":"PRIVATE ACCESS"}</span><strong>{passwordRecovery?t("Nieuw wachtwoord instellen","Set a new password"):t("Veilige toegang","Secure access")}</strong><p>{passwordRecovery?t("Kies een nieuw wachtwoord voor je AFTER HOURS-account.","Choose a new password for your AFTER HOURS account."):t("Kies je manier van aanmelden. Google en Apple vereisen eenmalige provider-configuratie in Supabase.","Choose how to sign in. Google and Apple require one-time provider setup in Supabase.")}</p>{passwordRecovery?null:<div className="auth-providers"><button onClick={()=>void signInProvider("google")} disabled={authBusy}>Google</button><button onClick={()=>void signInProvider("apple")} disabled={authBusy}>Apple</button></div>}<div className="auth-tabs"><button className={authMode==="magic"?"selected":""} onClick={()=>setAuthMode("magic")}>Magic link</button><button className={authMode==="password"?"selected":""} onClick={()=>setAuthMode("password")}>E-mail + wachtwoord</button></div><input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder={t("jij@email.nl","you@email.com")} autoComplete="email"/>{(authMode==="password"&&!passwordRecovery)&&<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder={t("Minimaal 8 tekens","At least 8 characters")} autoComplete="current-password"/>}{passwordRecovery&&<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder={t("Nieuw wachtwoord, minimaal 8 tekens","New password, at least 8 characters")} autoComplete="new-password"/>}{passwordRecovery?<button onClick={()=>void saveRecoveredPassword()} disabled={authBusy||authPassword.length<8}>{authBusy?t("Opslaan…","Saving…"):t("Nieuw wachtwoord opslaan","Save new password")}</button>:(
 authMode==="magic"
  ?<button onClick={requestMagicLink} disabled={authBusy||!authEmail.trim()}>{authBusy?t("Versturen…","Sending…"):t("Magic link sturen","Send magic link")}</button>
  :<div className="password-actions"><div className="auth-actions"><button onClick={()=>void submitPasswordAuth(false)} disabled={authBusy||!authEmail.trim()||authPassword.length<8}>{t("Inloggen","Sign in")}</button><button onClick={()=>void submitPasswordAuth(true)} disabled={authBusy||!authEmail.trim()||authPassword.length<8}>{t("Account maken","Create account")}</button></div><button className="text-button" onClick={()=>void requestPasswordReset()} disabled={authBusy||!authEmail.trim()}>{t("Wachtwoord vergeten?","Forgot password?")}</button></div>
 )}{authMessage&&<small>{authMessage}</small>}</div>}{userEmail&&<div className="auth-panel"><span className="eyebrow">SIGNED IN</span><strong>{userEmail}</strong><button onClick={()=>void handleSignOut()}>{t("Uitloggen","Sign out")}</button></div>}<div className="admin-actions"><button className="secondary" onClick={()=>{reset();setScreen("home")}}>{t("Sessie resetten","Reset session")}</button><button className="danger-action" onClick={revokeConsent}>{t("Consent intrekken","Revoke consent")}</button></div></section><button className="back" onClick={()=>setScreen("home")}>← {t("Terug","Back")}</button></main>}
 </React.Suspense>

 {(state.session.status==="active"||state.session.status==="paused")&&screen!=="game"&&<aside className="stop-controller" aria-label={t("Snelle sessiebediening","Quick session controls")}><div><span>SESSION CONTROL</span><strong>{state.session.status==="active"?t("Sessie loopt","Session active"):t("Sessie gepauzeerd","Session paused")}</strong></div><button className="stop-controller-pause" onClick={()=>state.session.status==="active"?pauseRound():startRound()} aria-label={state.session.status==="active"?t("Sessie pauzeren","Pause session"):t("Sessie hervatten","Resume session")}>{state.session.status==="active"?<Pause/>:<Play/>}{state.session.status==="active"?t("Pauze","Pause"):t("Hervat","Resume")}</button><button className="stop-controller-stop" onClick={()=>handleCheckIn("stop")} aria-label={t("Stop de sessie onmiddellijk","Stop the session now")}><Square/> STOP NU</button></aside>}

 <nav aria-label="Hoofdnavigatie"><button className={screen==="home"?"active":""} onClick={()=>setScreen("home")} aria-current={screen==="home"?"page":undefined}><Home/><span>Home</span></button><button className={screen==="game"?"active":""} onClick={()=>consent?setScreen("game"):setScreen("home")} aria-current={screen==="game"?"page":undefined} aria-disabled={!consent}><Timer/><span>Games</span></button><button className={screen==="insights"?"active":""} onClick={()=>setScreen("insights")} aria-current={screen==="insights"?"page":undefined}><Sparkles/><span>Insights</span></button><button className={screen==="radio"?"active":""} onClick={()=>setScreen("radio")} aria-current={screen==="radio"?"page":undefined}><Radio/><span>Radio</span></button><button className={screen==="profile"?"active":""} onClick={()=>setScreen("profile")} aria-current={screen==="profile"?"page":undefined}><User/><span>{t("Profiel","Profile")}</span></button></nav>
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
  .then(rawConfig=>{
   const config=rawConfig as MaintenanceConfig;
   const maintenance=getMaintenanceStatus(config);
   root.render(maintenance.active
    ?<UnderConstruction config={config}/>
    :<AppErrorBoundary><App maintenanceConfig={config}/></AppErrorBoundary>);
  });
}
