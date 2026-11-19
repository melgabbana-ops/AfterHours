import React, { useCallback, useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { loadMoodHistoryRemote, type MoodCode, type MoodEvent, type MoodPhase } from "./services/moods";
import { supabaseConfigured } from "./services/supabase";
import { filterMoodHistoryEvents, type MoodHistoryFilter } from "./moodHistory";

type LocalMoodEvent=MoodEvent;
const label:Record<MoodCode,[string,string]>={
 KINKY:["Kinky","Kinky"],EXCITED:["Opgewonden","Excited"],CURIOUS:["Nieuwsgierig","Curious"],CALM:["Rustig","Calm"],PLAYFUL:["Speels","Playful"],CONFIDENT:["Zelfverzekerd","Confident"],UNSURE:["Onzeker / twijfel","Unsure"],
 "INTO IT":["Ik zit er lekker in","Into it"],MORE:["Ik wil meer","More"],GOOD:["Goed","Good"],NEUTRAL:["Neutraal","Neutral"],"NEED A PAUSE":["Pauze nodig","Need a pause"],OVERWHELMED:["Overweldigd","Overwhelmed"],STOP:["STOP","STOP"],
 RELAXED:["Ontspannen","Relaxed"],SATISFIED:["Tevreden","Satisfied"],ENERGIZED:["Energiek","Energized"],TIRED:["Moe","Tired"],EMOTIONAL:["Emotioneel","Emotional"],OVERSTIMULATED:["Overprikkeld","Overstimulated"]
};
const phaseLabel:Record<MoodPhase,[string,string]>={before:["Vooraf","Before"],during:["Tijdens","During"],after:["Achteraf","Aftercare"]};
function readLocal(profileId:string):LocalMoodEvent[]{
 try{
  const raw=JSON.parse(localStorage.getItem("afterhours.moodhistory."+profileId)||"[]");
  if(!Array.isArray(raw))return [];
  return raw.filter((item):item is LocalMoodEvent=>Boolean(item)&&typeof item.id==="string"&&typeof item.session_id==="string"
   &&(item.phase==="before"||item.phase==="during"||item.phase==="after")
   &&typeof item.mood==="string"&&Object.prototype.hasOwnProperty.call(label,item.mood)
   &&typeof item.created_at==="string");
 }catch{return []}
}
export default function MoodHistory({profileId,language}:{profileId:string;language:"nl"|"en"}){
 const [events,setEvents]=useState<MoodEvent[]>([]);
 const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(true);
 const [filter,setFilter]=useState<MoodHistoryFilter>("all");
 const [visibleCount,setVisibleCount]=useState(10);
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const refresh=useCallback(async()=>{
  setLoading(true);setVisibleCount(10);setMessage("");
  if(!supabaseConfigured){
   setEvents(readLocal(profileId));setMessage(t("Alleen lokaal op dit apparaat opgeslagen.","Stored locally on this device only."));setLoading(false);return;
  }
  try{
   const remote=await loadMoodHistoryRemote(40);
   if(remote){setEvents(remote);setMessage(t("Privé opgeslagen bij je account.","Privately stored with your account."));}
   else{setEvents(readLocal(profileId));setMessage(t("Alleen lokaal op dit apparaat opgeslagen.","Stored locally on this device only."));}
  }catch{
   setEvents(readLocal(profileId));
   setMessage(t("Serverhistorie niet beschikbaar. Dit toont alleen lokale vermeldingen.","Server history unavailable. Showing local entries only."));
  }finally{setLoading(false);}
 },[profileId,language]);
 useEffect(()=>{void refresh()},[refresh]);
 const filteredEvents=filterMoodHistoryEvents(events,filter);
 const visibleEvents=filteredEvents.slice(0,visibleCount);
 const filterOptions:Array<{value:MoodHistoryFilter;label:string}>=[
  {value:"all",label:t("Alles","All")},
  {value:"before",label:t("Vooraf","Before")},
  {value:"during",label:t("Tijdens","During")},
  {value:"after",label:t("Achteraf","Aftercare")},
 ];
 return <section className="mood-history">
  <div className="mood-history-head"><span className="eyebrow"><History size={13}/> AFTER HOURS · MOOD ARCHIVE</span><button type="button" onClick={()=>void refresh()} disabled={loading} aria-label={t("Stemmingen vernieuwen","Refresh mood history")}><RefreshCw size={14}/>{t("Vernieuwen","Refresh")}</button></div>
  <h3>{t("Stemmingsoverzicht","Mood history")}</h3>
  <p className="mood-history-note">{message||t("Persoonlijk en privé. Je hoeft geen stemming uit te leggen.","Personal and private. You do not have to explain a mood.")}</p>
  {loading?<p>{t("Stemmingen laden…","Loading mood history…")}</p>:events.length===0?<p>{t("Nog geen stemmingen opgeslagen.","No moods saved yet.")}</p>:<>
   <div className="mood-history-filters" role="group" aria-label={t("Filter op fase","Filter by phase")}>
    {filterOptions.map(option=><button key={option.value} type="button" aria-pressed={filter===option.value} onClick={()=>{setFilter(option.value);setVisibleCount(10)}}>{option.label}</button>)}
   </div>
   {filteredEvents.length===0?<p>{t("Geen stemmingen in deze fase.","No moods in this phase.")}</p>:<>
    <p className="mood-history-count" role="status" aria-live="polite">{t(`${visibleEvents.length} van ${filteredEvents.length} vermeldingen getoond.`,`${visibleEvents.length} of ${filteredEvents.length} entries shown.`)}</p>
    <ol id="mood-history-list">{visibleEvents.map(event=><li key={event.id}><span className="mood-history-phase">{language==="nl"?phaseLabel[event.phase][0]:phaseLabel[event.phase][1]}</span><strong>{label[event.mood][language==="nl"?0:1]}</strong><time dateTime={event.created_at}>{new Intl.DateTimeFormat(language==="nl"?"nl-NL":"en-GB",{dateStyle:"medium",timeStyle:"short"}).format(new Date(event.created_at))}</time></li>)}</ol>
    {visibleEvents.length<filteredEvents.length&&<button className="mood-history-more" type="button" aria-controls="mood-history-list" onClick={()=>setVisibleCount(current=>Math.min(current+10,filteredEvents.length))}>{t("Meer tonen","Show more")} · {filteredEvents.length-visibleEvents.length}</button>}
   </>}
  </>
 </section>
}
