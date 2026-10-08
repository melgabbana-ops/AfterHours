import React,{useState}from"react";
import{ChevronRight,Radio,Volume2}from"lucide-react";



const moods=[
 {name:"Midnight",desc:"Donker, langzaam, cinematic",tracks:["Velvet After Dark","Nocturne Signals","Gold in the Shadows"]},
 {name:"Velvet",desc:"Warm, elegant, sensueel",tracks:["Velvet Room","Afterglow","Late Hours"]},
 {name:"Focus",desc:"Rustig, minimalistisch, aanwezig",tracks:["Quiet Control","Slow Pulse","Stillness"]},
 {name:"Pulse",desc:"Meer energie, meer beweging",tracks:["Night Drive","Neon Pulse","After Midnight"]}
];

export function RadioRoom({onBack}:{onBack:()=>void}){
 const[mood,setMood]=useState(0); const[track,setTrack]=useState(0);
 const current=moods[mood];
 return <main className="radio-room">
  <section className="radio-hero"><span className="eyebrow">AFTER HOURS · RADIO</span><h2>Set the mood.</h2><p>Een curated moodboard voor jullie avond. Kies een sfeer en laat de ruimte de juiste toon zetten.</p></section>
  <section className={"radio-player mood-"+current.name.toLowerCase()}>
   <div className="radio-disc"><Radio/><span>AH</span></div>
   <span className="eyebrow">NOW PLAYING · {current.name.toUpperCase()}</span><h3>{current.tracks[track]}</h3><p>{current.name} · {current.desc}</p>
   <div className="radio-vibe"><span>01</span><strong>{current.name}</strong><small>{current.tracks.length} curated moods</small></div>
   <div className="radio-controls"><button aria-label="Vorige sfeer" onClick={()=>setTrack((track+current.tracks.length-1)%current.tracks.length)}>‹</button><button className="radio-play" aria-label="Geselecteerde sfeer" aria-disabled="true">AH</button><button aria-label="Volgende sfeer" onClick={()=>setTrack((track+1)%current.tracks.length)}>›</button></div>
   <div className="radio-volume" aria-label="Audio niet beschikbaar"><Volume2/><span>Geen audio stream</span></div>
  </section>
  <section className="moods"><div className="sectionhead"><span>CHOOSE YOUR FREQUENCY</span><em>{current.name}</em></div>{moods.map((item,index)=><button key={item.name} className={index===mood?"mood active":"mood"} onClick={()=>{setMood(index);setTrack(0)}}><span className="mood-number">0{index+1}</span><div><strong>{item.name}</strong><small>{item.desc}</small></div><ChevronRight/></button>)}</section>
  <section className="radio-note"><Radio/><div><strong>Curated moodboard</strong><span>Deze ruimte kiest alleen de sfeer en tracknamen. AFTER HOURS levert geen muziekstream of gelicentieerde audio.</span></div></section>
  <button className="back" onClick={onBack}>← Terug</button>
 </main>
}
