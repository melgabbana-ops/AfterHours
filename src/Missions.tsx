import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Clock3, Sparkles, ShieldCheck } from "lucide-react";
import { supabaseConfigured } from "./services/supabase";
import { completeMissionRemote, loadMissionProgress, type RemoteMissionProgress } from "./services/missions";

type Language = "nl" | "en";
type MissionKind = "daily" | "weekly" | "special";
type Mission = { id: string; kind: MissionKind; titleNL: string; titleEN: string; descriptionNL: string; descriptionEN: string; reward: number; actionNL: string; actionEN: string };
const missions: Mission[] = [
 {id:"daily-intention",kind:"daily",titleNL:"De intentie",titleEN:"Set the intention",descriptionNL:"Benoem één ding dat je vandaag hoopt te ervaren en één grens. Je hoeft een grens niet uit te leggen.",descriptionEN:"Name one thing you hope to experience today and one boundary. You do not have to explain a boundary.",reward:10,actionNL:"Doe de check-in van vandaag",actionEN:"Complete today's check-in"},
 {id:"daily-reflection",kind:"daily",titleNL:"Lees de sfeer",titleEN:"Read the room",descriptionNL:"Open Kinky Tarot, Oracle of je astrologische reflectie en neem één gedachte mee.",descriptionEN:"Open Kinky Tarot, Oracle or your astrology reflection and take one thought with you.",reward:10,actionNL:"Ontdek Inzichten",actionEN:"Explore Insights"},
 {id:"daily-aftercare",kind:"daily",titleNL:"Aftercare telt",titleEN:"Aftercare matters",descriptionNL:"Kies één vorm van aftercare die je kan helpen tot rust te komen na een intens moment.",descriptionEN:"Choose one aftercare option that could help you settle after an intense moment.",reward:10,actionNL:"Kies aftercare",actionEN:"Choose your aftercare"},
 {id:"weekly-boundaries",kind:"weekly",titleNL:"Grensritueel",titleEN:"Boundary ritual",descriptionNL:"Bespreek één grens, één pauzesignaal en één stopsignaal. Elk antwoord mag worden aangepast of geweigerd.",descriptionEN:"Discuss one boundary, one pause signal and one stop signal. Every answer can be changed or declined.",reward:30,actionNL:"Bekijk je veiligheidsplan",actionEN:"Review your safety plan"},
 {id:"weekly-discovery",kind:"weekly",titleNL:"Nieuwsgierige geest",titleEN:"Curious mind",descriptionNL:"Ontdek drie verschillende kaarten uit The Deck en bewaar één reflectie die je wilt onthouden.",descriptionEN:"Explore three different prompts from The Deck and save one reflection you want to remember.",reward:30,actionNL:"Ontdek The Deck",actionEN:"Explore The Deck"},
 {id:"weekly-care",kind:"weekly",titleNL:"Zorg in de praktijk",titleEN:"Care in practice",descriptionNL:"Maak ruimte voor een check-in zonder druk en spreek af hoe jullie daarna weer contact maken.",descriptionEN:"Make space for a no-pressure check-in and agree how to reconnect afterwards.",reward:30,actionNL:"Plan een check-in",actionEN:"Plan a check-in"},
 {id:"special-consent",kind:"special",titleNL:"Consent, altijd",titleEN:"Consent, always",descriptionNL:"Controleer je grenzen en zorg dat PAUSE, PASS en STOP helder zijn voordat een ervaring begint.",descriptionEN:"Review your limits and make sure PAUSE, PASS and STOP are understood before any experience.",reward:50,actionNL:"Bekijk veiligheidsinstellingen",actionEN:"Review safety settings"},
 {id:"special-explorer",kind:"special",titleNL:"De nieuwsgierige ontdekker",titleEN:"The curious explorer",descriptionNL:"Bezoek The Deck, Kinky Tarot en Astrology. Ontdek op je eigen tempo, zonder prestatiedoel.",descriptionEN:"Visit The Deck, Kinky Tarot and Astrology. Explore at your own pace, without a performance target.",reward:50,actionNL:"Ontdek AFTER HOURS",actionEN:"Explore AFTER HOURS"},
];
const dayKey = () => new Date().toLocaleDateString("sv-SE");
const weekKey = () => { const d=new Date(); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day+3); const first=new Date(d.getFullYear(),0,4); const week=1+Math.round(((d.getTime()-first.getTime())/86400000-3+((first.getDay()+6)%7))/7); return d.getFullYear()+"-W"+String(week).padStart(2,"0"); };
function storageKey(kind: MissionKind) { return "afterhours.missions."+kind+"."+ (kind==="daily"?dayKey():kind==="weekly"?weekKey():"season-1"); }
function readDone(kind: MissionKind): string[] { try { const value=JSON.parse(localStorage.getItem(storageKey(kind))||"[]"); return Array.isArray(value)?value.filter((v):v is string=>typeof v==="string"):[]; } catch { return []; } }

export default function Missions({language="nl",onBack,onExplore}:{language?:Language;onBack:()=>void;onExplore:(destination:string)=>void}) {
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const [kind,setKind]=useState<MissionKind>("daily");
 const [done,setDone]=useState<Record<MissionKind,string[]>>(()=>({daily:readDone("daily"),weekly:readDone("weekly"),special:readDone("special")}));
 const [remoteProgress,setRemoteProgress]=useState<RemoteMissionProgress[]|null>(null);
 const [syncMessage,setSyncMessage]=useState("");
 const [busyMission,setBusyMission]=useState<string|null>(null);
 const active=useMemo(()=>missions.filter(m=>m.kind===kind),[kind]);
 const refreshRemoteProgress=async()=>{const rows=await loadMissionProgress();if(rows===null)return;setRemoteProgress(rows);};
 useEffect(()=>{
  if(!supabaseConfigured)return;
  let alive=true;
  void loadMissionProgress().then(rows=>{if(!alive)return;setRemoteProgress(rows);if(rows?.length===0)setSyncMessage(t("Log in om missies veilig aan je account te koppelen.","Sign in to securely link missions to your account."));}).catch(error=>{if(alive){setRemoteProgress([]);setSyncMessage(error instanceof Error?error.message:t("Missies konden niet van de server worden geladen.","Missions could not be loaded from the server."));}});
  return()=>{alive=false};
 },[]);
 const completedIds=remoteProgress===null?done[kind]:remoteProgress.filter(item=>item.mission_kind===kind&&item.completed).map(item=>item.mission_id);
 const complete=async(mission:Mission)=>{
  if(completedIds.includes(mission.id)||busyMission)return;
  if(supabaseConfigured){
   setBusyMission(mission.id);setSyncMessage("");
   try{const result=await completeMissionRemote(mission.id);await refreshRemoteProgress();setSyncMessage(result.already_completed?t("Deze missie was al veilig geregistreerd.","This mission was already recorded safely."):t("Missie bevestigd op de server. Je missiepunten zijn bijgewerkt.","Mission confirmed on the server. Your mission points are updated."));}
   catch(error){setSyncMessage(error instanceof Error?error.message:t("De missie kon niet worden opgeslagen.","This mission could not be saved."));}
   finally{setBusyMission(null)}
   return;
  }
  const next=[...done[kind],mission.id];
  try{localStorage.setItem(storageKey(kind),JSON.stringify(next));}catch{}
  setDone(previous=>({...previous,[kind]:next}));
 };
 const total=active.reduce((sum,m)=>sum+m.reward,0), earned=active.filter(m=>completedIds.includes(m.id)).reduce((sum,m)=>sum+(remoteProgress?.find(item=>item.mission_id===m.id&&item.completed&&item.mission_kind===kind)?.reward_points??m.reward),0);
 const labels:Record<MissionKind,{nl:string;en:string;subNl:string;subEn:string}> = {
  daily:{nl:"Daily",en:"Daily",subNl:"Kleine intenties voor vandaag",subEn:"Small intentions for today"},
  weekly:{nl:"Weekly",en:"Weekly",subNl:"Bewust ontdekken, stap voor stap",subEn:"Mindful discovery, one step at a time"},
  special:{nl:"Special",en:"Special",subNl:"Blijvende mijlpalen, zonder tijdsdruk",subEn:"Long-term milestones, no time pressure"}
 };
 return <main className="missions-screen">
  <header className="missions-hero"><button className="back" onClick={onBack}><ArrowLeft size={16}/> {t("Terug","Back")}</button><span className="eyebrow">AFTER HOURS · MISSIONS</span><h1>{t("Jouw volgende hoofdstuk.","Your next chapter.")}</h1><p>{t("Progress is personal. Grenzen zijn geen opdrachten en niets hoeft afgemaakt te worden.","Progress is personal. Boundaries are never tasks, and nothing has to be completed.")}</p><div className="missions-progress"><div><span>{t("Deze categorie","This category")}</span><strong>{active.filter(m=>completedIds.includes(m.id)).length} / {active.length}</strong></div><div className="missions-progress-track"><i style={{width:(active.length?active.filter(m=>completedIds.includes(m.id)).length/active.length*100:0)+"%"}}/></div><small>{earned} / {total} {t("missiepunten verdiend","mission points earned")}</small></div></header>
  <div className="mission-tabs" role="tablist" aria-label={t("Missiecategorie","Mission category")}>{(["daily","weekly","special"] as MissionKind[]).map(value=><button key={value} role="tab" aria-selected={kind===value} className={kind===value?"active":""} onClick={()=>setKind(value)}>{labels[value][language==="nl"?"nl":"en"]}<small>{value==="daily"?t("Vernieuwt dagelijks","Resets daily"):value==="weekly"?t("Vernieuwt wekelijks","Resets weekly"):t("Blijvend","Ongoing")}</small></button>)}</div>
  <p className="mission-category-subtitle">{labels[kind][language==="nl"?"subNl":"subEn"]}</p>
  {syncMessage&&<p className="mission-sync-message" role="status">{syncMessage}</p>}
  {supabaseConfigured&&remoteProgress===null&&<p className="mission-sync-message" role="status">{t("Missies synchroniseren…","Syncing missions…")}</p>}
  <section className="mission-list">{active.map(mission=>{const completed=completedIds.includes(mission.id);return <article className={"mission-card"+(completed?" completed":"")} key={mission.id}><div className="mission-icon">{completed?<CheckCircle2/>:<Sparkles/>}</div><div className="mission-copy"><div className="mission-card-meta"><span>{mission.kind.toUpperCase()} · {t("MISSIE","MISSION")}</span><strong>+{mission.reward} MP</strong></div><h2>{language==="nl"?mission.titleNL:mission.titleEN}</h2><p>{language==="nl"?mission.descriptionNL:mission.descriptionEN}</p><div className="mission-card-footer"><span><Clock3 size={14}/>{mission.kind==="daily"?t("Vandaag","Today"):mission.kind==="weekly"?t("Deze week","This week"):t("Op eigen tempo","At your pace")}</span><button disabled={completed||busyMission!==null} onClick={()=>completed?undefined:onExplore(mission.id.includes("aftercare")?"aftercare":mission.id.includes("boundaries")||mission.id.includes("consent")?"safety":mission.id.includes("reflection")||mission.id.includes("explorer")?"insights":mission.id.includes("discovery")?"prompts":"home")}>{completed?t("Voltooid","Completed"):t("Open onderdeel","Open feature")}</button></div><button className="mission-complete" disabled={completed||busyMission!==null} onClick={()=>void complete(mission)}>{completed?<CheckCircle2 size={16}/>:<Circle size={16}/>} {busyMission===mission.id?t("Opslaan…","Saving…"):completed?t("Afgerond","Completed"):t("Markeer als afgerond","Mark as complete")}</button></div></article>})}</section>
  <aside className="mission-safety-note"><ShieldCheck/><p>{t("Missies zijn uitnodigingen, geen verplichtingen. Je mag overslaan, aanpassen of stoppen. Consent en je eigen grenzen gaan altijd voor beloningen.","Missions are invitations, never obligations. You can skip, adapt or stop. Consent and your own boundaries always come before rewards.")}</p></aside>
 </main>;
}
