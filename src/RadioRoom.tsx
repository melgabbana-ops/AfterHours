import React,{useState}from"react";
import{ChevronRight,Radio,Volume2,ExternalLink}from"lucide-react";

const moods=[
 {name:"Midnight",desc:"Donker, langzaam, cinematic",tracks:["Dark ambient","Cinematic night","Midnight atmosphere"],search:"dark ambient cinematic playlist"},
 {name:"Velvet",desc:"Warm, elegant, sensueel",tracks:["Velvet lounge","Late night R&B","Downtempo lounge"],search:"late night lounge downtempo playlist"},
 {name:"Focus",desc:"Rustig, minimalistisch, aanwezig",tracks:["Minimal ambient","Deep focus","Quiet atmosphere"],search:"minimal ambient deep focus playlist"},
 {name:"Pulse",desc:"Meer energie, meer beweging",tracks:["Night drive","Dark electronic","Deep techno"],search:"dark electronic night drive playlist"}
];

export function RadioRoom({onBack,language="nl"}:{onBack:()=>void;language?:"nl"|"en"}){
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const[mood,setMood]=useState(0); const[track,setTrack]=useState(0);
 const current=moods[mood];
 const openSpotify=()=>window.open("https://open.spotify.com/search/"+encodeURIComponent(current.search),"_blank","noopener,noreferrer");
 const changeMood=(index:number)=>{setMood(index);setTrack(0)};
 return <main className="radio-room">
  <section className="radio-hero"><span className="eyebrow">AFTER HOURS · RADIO</span><h2>Set the mood.</h2><p>Kies je frequentie en open passende muziek in Spotify. De selectie blijft consent-first, zonder dat AFTER HOURS zelf muziek streamt.</p></section>
  <section className={"radio-player mood-"+current.name.toLowerCase()}>
   <div className="radio-disc"><Radio/><span>AH</span></div>
   <span className="eyebrow">YOUR FREQUENCY · {current.name.toUpperCase()}</span><h3>{current.tracks[track]}</h3><p>{current.name} · {current.desc}</p>
   <div className="radio-vibe"><span>0{mood+1}</span><strong>{current.name}</strong><small>{current.tracks.length} luisterrichtingen</small></div>
   <div className="radio-controls"><button aria-label="Vorige luisterrichting" onClick={()=>setTrack((track+current.tracks.length-1)%current.tracks.length)}>‹</button><button className="radio-play" aria-label="Open muziek in Spotify" onClick={openSpotify}><ExternalLink size={18}/></button><button aria-label="Volgende luisterrichting" onClick={()=>setTrack((track+1)%current.tracks.length)}>›</button></div>
   <button className="radio-volume" onClick={openSpotify}><Volume2/><span>Open selectie in Spotify</span><ExternalLink size={14}/></button>
  </section>
  <section className="moods"><div className="sectionhead"><span>CHOOSE YOUR FREQUENCY</span><em>{current.name}</em></div>{moods.map((item,index)=><button key={item.name} className={index===mood?"mood active":"mood"} aria-pressed={index===mood} onClick={()=>changeMood(index)}><span className="mood-number">0{index+1}</span><div><strong>{item.name}</strong><small>{item.desc}</small></div><ChevronRight/></button>)}</section>
  <section className="radio-note"><Radio/><div><strong>Spotify-koppeling</strong><span>Deze knop opent een Spotify-zoekopdracht voor de gekozen sfeer. In-app streaming vereist een aparte Spotify-integratie en moet voldoen aan hun account- en gebruiksvoorwaarden. Je hebt Spotify nodig om daar af te spelen.</span></div></section>
  <button className="back" onClick={onBack}>← Terug</button>
 </main>
}
