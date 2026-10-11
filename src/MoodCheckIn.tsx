import React from "react";
import { moodCatalog, type MoodCode, type MoodPhase } from "./services/moods";

type Language = "nl" | "en";
const copy: Record<MoodPhase, Partial<Record<MoodCode, [string,string]>>> = {
 before: {
  KINKY:["Kinky","Kinky"], EXCITED:["Opgewonden","Excited"], CURIOUS:["Nieuwsgierig","Curious"],
  CALM:["Rustig","Calm"], PLAYFUL:["Speels","Playful"], CONFIDENT:["Zelfverzekerd","Confident"], UNSURE:["Onzeker / twijfel","Unsure"]
 },
 during: {
  "INTO IT":["Ik zit er lekker in","Into it"], MORE:["Ik wil meer","More"], GOOD:["Goed","Good"],
  NEUTRAL:["Neutraal","Neutral"], "NEED A PAUSE":["Ik heb pauze nodig","I need a pause"],
  OVERWHELMED:["Overweldigd","Overwhelmed"], STOP:["Stop","Stop"]
 },
 after: {
  RELAXED:["Ontspannen","Relaxed"], SATISFIED:["Tevreden","Satisfied"], ENERGIZED:["Energiek","Energized"],
  TIRED:["Moe","Tired"], EMOTIONAL:["Emotioneel","Emotional"], OVERSTIMULATED:["Overprikkeld","Overstimulated"],
  NEUTRAL:["Neutraal","Neutral"], UNSURE:["Weet ik nog niet","Unsure"]
 }
};
const headings:Record<MoodPhase,[string,string]>={before:["Hoe voel je je vooraf?","How are you feeling before?"],during:["Hoe voelt dit moment?","How are you feeling right now?"],after:["Hoe voel je je achteraf?","How are you feeling afterwards?"]};
const detail:Record<MoodPhase,[string,string]>={before:["Je antwoord is optioneel en helpt je eigen tempo te kiezen.","Your answer is optional and helps you choose your own pace."],during:["Verander op ieder moment van keuze. Pauze, overweldiging en STOP gaan vóór timer en voortgang.","Change your choice at any time. Pause, overwhelm, and STOP take priority over timers and progress."],after:["Je hoeft niets uit te leggen of te delen. Kies wat voor jou klopt.","You do not have to explain or share anything. Choose what feels right for you."]};
export default function MoodCheckIn({phase,language,selected,onSelect}:{
 phase:MoodPhase;language:Language;selected:MoodCode|null;onSelect:(mood:MoodCode)=>void;
}) {
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 return <section className={"mood-checkin mood-checkin-"+phase} aria-label={t(...headings[phase])}>
  <span className="eyebrow">AFTER HOURS · {phase.toUpperCase()} CHECK-IN</span>
  <h3>{t(...headings[phase])}</h3><p>{t(...detail[phase])}</p>
  <div className="mood-choice-grid">{moodCatalog[phase].map(mood=>{
   const label=copy[phase][mood]?.[language==="nl"?0:1] ?? mood;
   const urgent=mood==="STOP"||mood==="OVERWHELMED"||mood==="NEED A PAUSE";
   return <button type="button" key={mood} className={(selected===mood?"selected ":"")+(urgent?"mood-urgent":"")} aria-pressed={selected===mood} onClick={()=>onSelect(mood)}>{label}</button>;
  })}</div>
 </section>;
}
