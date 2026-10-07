import React,{useState}from"react";
import{ChevronRight,Headphones,Pause,Play,Radio,Volume2}from"lucide-react";

const moods=[
 {name:"Midnight",desc:"Donker, langzaam, cinematic",tracks:["Velvet After Dark","Nocturne Signals","Gold in the Shadows"]},
 {name:"Velvet",desc:"Warm, elegant, sensueel",tracks:["Velvet Room","Afterglow","Late Hours"]},
 {name:"Focus",desc:"Rustig, minimalistisch, aanwezig",tracks:["Quiet Control","Slow Pulse","Stillness"]},
 {name:"Pulse",desc:"Meer energie, meer beweging",tracks:["Night Drive","Neon Pulse","After Midnight"]}
];

export function RadioRoom({onBack}:{onBack:()=>void}){
 const[mood,setMood]=useState(0); const[playing,setPlaying]=useState(false); const[track,setTrack]=useState(0);
 const current=moods[mood];
 return <main className="radio-room">
  <section className="radio-hero"><span className="eyebrow">AFTER HOURS · RADIO</span><h2>Set the mood.</h2><p>Een eigen soundtrack voor jullie avond. Kies een sfeer en laat de ruimte het tempo volgen.</p></section>
  <section className="radio-player">
   <div className="radio-disc"><Radio/><span>AH</span></div>
   <span className="eyebrow">NOW PLAYING</span><h3>{current.tracks[track]}</h3><p>{current.name} · {current.desc}</p>
   <div className="radio-controls"><button aria-label="Vorige nummer" onClick={()=>setTrack((track+current.tracks.length-1)%current.tracks.length)}>‹</button><button className="radio-play" onClick={()=>setPlaying(!playing)}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><button aria-label="Volgende nummer" onClick={()=>setTrack((track+1)%current.tracks.length)}>›</button></div>
   <div className="radio-volume"><Volume2/><span/><span/><span/><span/><span/></div>
  </section>
  <section className="moods"><div className="sectionhead"><span>CHOOSE YOUR FREQUENCY</span><em>{current.name}</em></div>{moods.map((item,index)=><button key={item.name} className={index===mood?"mood active":"mood"} onClick={()=>{setMood(index);setTrack(0);setPlaying(false)}}><span className="mood-number">0{index+1}</span><div><strong>{item.name}</strong><small>{item.desc}</small></div><ChevronRight/></button>)}</section>
  <section className="radio-note"><Headphones/><div><strong>Externe muziek</strong><span>Spotify of een andere speler kan later gekoppeld worden via een officiële embed of link. De app neemt de muzieklicentie niet over.</span></div></section>
  <button className="back" onClick={onBack}>← Terug</button>
 </main>
}
