import React,{useEffect,useMemo,useState} from "react";
import {ArrowLeft,CalendarDays,Check,RefreshCw,Sparkles} from "lucide-react";
import {completeMissionRemote,loadDailyRitualDates} from "./services/missions";
import {supabaseConfigured} from "./services/supabase";

type Language="nl"|"en";
interface DailyCard {id:string;categoryNL:string;categoryEN:string;titleNL:string;titleEN:string;promptNL:string;promptEN:string;practiceNL:string;practiceEN:string;duration:string;}
const rituals:DailyCard[]=[
 {id:"intention",categoryNL:"INTENTIE",categoryEN:"INTENTION",titleNL:"Kies de sfeer",titleEN:"Choose the atmosphere",promptNL:"Welke sfeer past vandaag bij jou: rustig, speels, nieuwsgierig of gefocust?",promptEN:"Which atmosphere fits you today: calm, playful, curious or focused?",practiceNL:"Kies één woord voor vanavond. Benoem ook één ding dat je vandaag níét wilt. De sfeer mag later veranderen.",practiceEN:"Choose one word for tonight. Name one thing you do not want today, too. The mood may change later.",duration:"2 min"},
 {id:"boundaries",categoryNL:"GRENZEN",categoryEN:"BOUNDARIES",titleNL:"Een grens in heldere taal",titleEN:"A boundary, clearly said",promptNL:"Welke afspraak wordt makkelijker wanneer die concreter wordt?",promptEN:"Which agreement becomes easier when it is more specific?",practiceNL:"Maak één afspraak concreet: wat is welkom, wat niet, en welk signaal betekent pauze of stop. Uitleg is nooit verplicht.",practiceEN:"Make one agreement specific: what is welcome, what is not, and which signal means pause or stop. Explanation is never required.",duration:"3 min"},
 {id:"curiosity",categoryNL:"NIEUWSGIERIGHEID",categoryEN:"CURIOSITY",titleNL:"De derde optie",titleEN:"The third option",promptNL:"Welke keuze wil je vandaag zelf maken?",promptEN:"Which choice do you want to make for yourself today?",practiceNL:"Bied jezelf drie uitkomsten: ja, aangepast of vandaag niet. Kies zonder jezelf te overtuigen.",practiceEN:"Offer yourself three outcomes: yes, adapted, or not today. Choose without persuading yourself.",duration:"2 min"},
 {id:"aftercare",categoryNL:"AFTERCARE",categoryEN:"AFTERCARE",titleNL:"Wat helpt je landen?",titleEN:"What helps you land?",promptNL:"Wat helpt jou na een intens moment: stilte, water, praten, muziek of ruimte?",promptEN:"What helps after an intense moment: quiet, water, talking, music or space?",practiceNL:"Kies één aftercare-optie en houd die bereikbaar. Je hoeft niets te delen om zorg te mogen ontvangen.",practiceEN:"Choose one aftercare option and keep it accessible. You do not have to share anything to receive care.",duration:"2 min"},
 {id:"trust",categoryNL:"VERTROUWEN",categoryEN:"TRUST",titleNL:"Vraag in plaats van raden",titleEN:"Ask, don't assume",promptNL:"Wat zou je liever vragen dan zelf invullen?",promptEN:"What would you rather ask than guess?",practiceNL:"Stel één open vraag en luister naar het antwoord. 'Ik weet het nog niet' is een volledig antwoord.",practiceEN:"Ask one open question and listen to the answer. 'I don't know yet' is a complete answer.",duration:"2 min"},
 {id:"presence",categoryNL:"AANDACHT",categoryEN:"PRESENCE",titleNL:"Een moment zonder score",titleEN:"A moment without a score",promptNL:"Wat voelt goed wanneer er niets hoeft te worden bereikt?",promptEN:"What feels good when nothing has to be achieved?",practiceNL:"Neem een minuut om je omgeving op te merken. Geen timer, punten of prestatie, alleen aandacht.",practiceEN:"Take a minute to notice your surroundings. No timer, points or performance, just attention.",duration:"1 min"},
 {id:"voice",categoryNL:"STEM",categoryEN:"VOICE",titleNL:"Zeg het op jouw manier",titleEN:"Say it your way",promptNL:"Welke woorden klinken voor jou uitnodigend, en welke niet?",promptEN:"Which words feel inviting to you, and which do not?",practiceNL:"Kies één zin die je wel prettig vindt en één die je liever vervangt. Deel ze alleen als je wilt.",practiceEN:"Choose one phrase you like and one you would rather replace. Share them only if you wish.",duration:"2 min"},
 {id:"play",categoryNL:"SPEELSHEID",categoryEN:"PLAY",titleNL:"Een kleine verrassing",titleEN:"A small surprise",promptNL:"Welke verrassing zou fijn zijn als je de categorie vooraf kent?",promptEN:"What surprise would feel good if you knew the category first?",practiceNL:"Kies een veilige categorie, bijvoorbeeld muziek, een lief bericht of een keuzevraag. Een verrassing verbergt nooit grenzen.",practiceEN:"Choose a safe category, such as music, a kind message or a choice question. A surprise never hides boundaries.",duration:"2 min"},
 {id:"reflection",categoryNL:"REFLECTIE",categoryEN:"REFLECTION",titleNL:"Wat wil je meenemen?",titleEN:"What will you carry forward?",promptNL:"Welke kleine ontdekking van deze week wil je onthouden?",promptEN:"What small discovery from this week would you like to remember?",practiceNL:"Formuleer één inzicht in je eigen woorden. Je hoeft het niet op te slaan of te delen.",practiceEN:"Put one insight into your own words. You do not have to save it or share it.",duration:"2 min"},
 {id:"choice",categoryNL:"KEUZE",categoryEN:"CHOICE",titleNL:"PASS oefenen",titleEN:"Practise PASS",promptNL:"Wat zou het makkelijker maken om een opdracht over te slaan?",promptEN:"What would make it easier to pass on a prompt?",practiceNL:"Oefen de zin 'PASS is genoeg'. Spreek af dat passen geen straf, schuldgevoel of extra uitleg oplevert.",practiceEN:"Practise the phrase 'PASS is enough'. Agree that passing brings no punishment, guilt or demand for explanation.",duration:"2 min"},
 {id:"pace",categoryNL:"TEMPO",categoryEN:"PACE",titleNL:"Jouw tempo telt",titleEN:"Your pace matters",promptNL:"Wat is vandaag een prettig tempo: langzaam, afwisselend of helemaal geen programma?",promptEN:"What pace feels right today: slow, varied or no plan at all?",practiceNL:"Kies vooraf een tempo en spreek af dat iedereen dit op elk moment mag wijzigen.",practiceEN:"Choose a pace in advance and agree that anyone may change it at any time.",duration:"2 min"},
 {id:"connection",categoryNL:"VERBINDING",categoryEN:"CONNECTION",titleNL:"Een kleine attentie",titleEN:"A small act of care",promptNL:"Welke kleine attentie voelt welkom zonder verplichting?",promptEN:"Which small gesture of care feels welcome without obligation?",practiceNL:"Kies iets kleins zoals water, muziek of een vriendelijk bericht. Vraag eerst of het welkom is.",practiceEN:"Choose something small like water, music or a kind message. Ask if it is welcome first.",duration:"2 min"},
 {id:"quiet",categoryNL:"RUST",categoryEN:"REST",titleNL:"Ruimte laten",titleEN:"Leave some space",promptNL:"Heb je vandaag behoefte aan contact, stilte of allebei?",promptEN:"Do you need connection, quiet or a little of both today?",practiceNL:"Kies hoe je een rustig moment wilt afsluiten en geef jezelf toestemming om eerder te stoppen.",practiceEN:"Choose how you want to end a quiet moment and allow yourself to stop sooner.",duration:"1 min"},
 {id:"reframe",categoryNL:"NIEUWE KIJK",categoryEN:"REFRAME",titleNL:"Van moeten naar mogen",titleEN:"From must to may",promptNL:"Welke verwachting mag je vandaag loslaten?",promptEN:"Which expectation could you let go of today?",practiceNL:"Vervang één 'ik moet' door 'ik mag kiezen'. Dat is genoeg voor vandaag.",practiceEN:"Replace one 'I must' with 'I may choose'. That is enough for today.",duration:"1 min"},
 {id:"closing",categoryNL:"AFRONDING",categoryEN:"CLOSING",titleNL:"Sluit bewust af",titleEN:"Close with intention",promptNL:"Hoe weet je dat een moment echt klaar is?",promptEN:"How do you know when a moment is truly over?",practiceNL:"Kies een eenvoudige afsluitzin of een teken dat de rollen afrondt en je weer terugbrengt naar het gewone moment.",practiceEN:"Choose a simple closing phrase or signal that ends the role and brings you back to the everyday moment.",duration:"2 min"}
];
type Progress={doneDates:string[]};
function todayKey(date=new Date()){return date.toISOString().slice(0,10)}
export function calculateDailyStreak(doneDates: readonly string[], today: string): number {
 const done = new Set(doneDates);
 const anchor = new Date(today + "T12:00:00");
 let count = 0;
 const startOffset = done.has(today) ? 0 : 1;
 for (let offset = startOffset; offset < 120; offset++) {
  const date = new Date(anchor);
  date.setDate(date.getDate() - offset);
  if (done.has(todayKey(date))) count++;
  else break;
 }
 return count;
}

function readProgress(profileId:string):Progress {
 try{const value=JSON.parse(localStorage.getItem("afterhours.dailyritual."+profileId)||"{}");return {doneDates:Array.isArray(value.doneDates)?value.doneDates.filter((x:unknown)=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)).slice(-120):[]}}catch{return {doneDates:[]}}
}
export default function DailyAfterHours({profileId,language="nl",onBack,onOpenMissions,onOpenInsights}:{profileId:string;language?:Language;onBack:()=>void;onOpenMissions:()=>void;onOpenInsights:()=>void}){
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const today=todayKey();
 const card=useMemo(()=>{const stamp=Math.floor(new Date(today+"T12:00:00").getTime()/86400000);return rituals[((stamp%rituals.length)+rituals.length)%rituals.length]},[today]);
 const [progress,setProgress]=useState<Progress>(()=>readProgress(profileId));
 const [message,setMessage]=useState("");
 const [progressSource,setProgressSource]=useState<"loading"|"server"|"local">("loading");
 useEffect(()=>{
  let active=true;
  const local=readProgress(profileId);
  setProgress(local);
  setProgressSource("loading");
  void loadDailyRitualDates().then(remoteDates=>{
   if(!active)return;
   if(remoteDates===null){setProgressSource("local");return;}
   const merged={doneDates:Array.from(new Set([...local.doneDates,...remoteDates])).sort().slice(-120)};
   setProgress(merged);
   try{localStorage.setItem("afterhours.dailyritual."+profileId,JSON.stringify(merged))}catch{}
   setProgressSource("server");
  }).catch(()=>{if(active)setProgressSource("local")});
  return()=>{active=false};
 },[profileId]);
 const [busy,setBusy]=useState(false);
 const done=progress.doneDates.includes(today);
 const streak=useMemo(()=>calculateDailyStreak(progress.doneDates,today),[progress,today]);
 const complete=async()=>{
  if(done||busy)return;
  setBusy(true);setMessage("");
  let serverSaved=false;
  try{
   const result=await completeMissionRemote("daily-intention");
   serverSaved=true;
   setMessage(result.already_completed?t("Deze dagmissie was al op je account geregistreerd.","Today's mission was already registered on your account."):t("Dagmissie op de server bevestigd. De missiepunten zijn niet hetzelfde als XP.","Daily mission confirmed on the server. Mission points are separate from XP."));
  }catch{
   setMessage(t("Vandaag lokaal afgevinkt; serverbeloning niet bevestigd.","Marked complete locally; server reward was not confirmed."));
  }
  const next={doneDates:Array.from(new Set([...progress.doneDates,today])).sort().slice(-120)};
  setProgress(next);
  try{localStorage.setItem("afterhours.dailyritual."+profileId,JSON.stringify(next))}catch{}
  if(!serverSaved&&!supabaseConfigured)setMessage(t("Dagritueel bewaard op dit apparaat; geen serverbeloning toegekend.","Daily ritual saved on this device; no server reward awarded."));
  setBusy(false);
 };
 return <main className="daily-screen">
  <header className="daily-heading"><button className="back" type="button" onClick={onBack}><ArrowLeft size={16}/>{t("Terug","Back")}</button><span className="eyebrow">AFTER HOURS · DAILY RITUAL</span><h1>{t("Jouw moment.","Your moment.")}</h1><p>{t("Elke dag één klein ritueel voor intentie, nieuwsgierigheid en zorg. Geen puntenjacht. Geen druk.","One small daily ritual for intention, curiosity and care. No points chase. No pressure.")}</p></header>
  <section className="daily-streak"><div><CalendarDays size={18}/><span>{t("Jouw ritme","Your rhythm")}</span></div><strong>{streak} <small>{t("dagen","days")}</small></strong><p>{t("Een ritme is geen verplichting. Een gemiste dag is geen mislukking.","A streak is not an obligation. A missed day is not a failure.")}</p></section>
  <article className="daily-ritual-card"><div className="daily-card-top"><span className="eyebrow">{language==="nl"?card.categoryNL:card.categoryEN}</span><span>{card.duration}</span></div><span className="daily-glyph">☾</span><h2>{language==="nl"?card.titleNL:card.titleEN}</h2><p className="daily-prompt">{language==="nl"?card.promptNL:card.promptEN}</p><div className="daily-practice"><span>{t("JOUW RITUEEL","YOUR RITUAL")}</span><p>{language==="nl"?card.practiceNL:card.practiceEN}</p></div>
   <button className="daily-complete" type="button" onClick={()=>void complete()} disabled={done||busy||progressSource==="loading"}>{done?<><Check size={16}/>{t("Vandaag afgerond","Completed today")}</>:<><Sparkles size={16}/>{busy?t("Bewaren…","Saving…"):t("Ik heb mijn moment genomen","I took my moment")}</>}</button>
   {message&&<p className="daily-message" role="status">{message}</p>}
  </article>
  <section className="daily-next-steps"><h3>{t("Ga verder op jouw manier","Continue your way")}</h3><button type="button" onClick={onOpenMissions}><span><strong>{t("Missies van vandaag","Today's missions")}</strong><small>{t("Kleine stappen, op eigen tempo.","Small steps, at your own pace.")}</small></span><span>↗</span></button><button type="button" onClick={onOpenInsights}><span><strong>{t("Inzichten","Insights")}</strong><small>{t("Tarot, Oracle en reflectie.","Tarot, Oracle and reflection.")}</small></span><span>↗</span></button></section>
  <p className="daily-footnote">{progressSource==="server"?t("Je ritme wordt gesynchroniseerd via je account, zodat het op andere apparaten terugkomt.","Your streak syncs through your account and follows you across devices."):progressSource==="loading"?t("Je ritme wordt gecontroleerd…","Checking your streak…"):t("Je ritme wordt lokaal bijgehouden zolang accountsynchronisatie niet beschikbaar is.","Your streak is stored locally while account sync is unavailable.")} {t("Veiligheidsfuncties blijven gratis.","Safety features always remain free.")}</p>
 </main>;
}
