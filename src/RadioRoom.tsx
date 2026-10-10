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
 const moodDescription=(name:string,desc:string)=>language==="en"?({"Midnight":"Dark, slow, cinematic","Velvet":"Warm, elegant, sensual","Focus":"Calm, minimal, present","Pulse":"More energy, more movement"} as Record<string,string>)[name]??desc:desc;
 const openSpotify=()=>window.open("https://open.spotify.com/search/"+encodeURIComponent(current.search),"_blank","noopener,noreferrer");
 const changeMood=(index:number)=>{setMood(index);setTrack(0)};
 return <main className="radio-room">
  <section className="radio-hero"><span className="eyebrow">AFTER HOURS · RADIO</span><h2>{t("Bepaal de sfeer.","Set the mood.")}</h2><p>{t("Kies je frequentie en open passende muziek in Spotify. De selectie blijft consent-first, zonder dat AFTER HOURS zelf muziek streamt.","Choose your frequency and open matching music in Spotify. The selection is consent-first. AFTER HOURS does not stream music itself.")}</p></section>
  <section className={"radio-player mood-"+current.name.toLowerCase()}>
   <div className="radio-disc"><Radio/><span>AH</span></div>
   <span className="eyebrow">{t("JOUW FREQUENTIE","YOUR FREQUENCY")} · {current.name.toUpperCase()}</span><h3>{current.tracks[track]}</h3><p>{current.name} · {moodDescription(current.name,current.desc)}</p>
   <div className="radio-vibe"><span>0{mood+1}</span><strong>{current.name}</strong><small>{current.tracks.length} {t("luisterrichtingen","listening directions")}</small></div>
   <div className="radio-controls"><button aria-label={t("Vorige luisterrichting","Previous listening direction")} onClick={()=>setTrack((track+current.tracks.length-1)%current.tracks.length)}>‹</button><button className="radio-play" aria-label={t("Open muziek in Spotify","Open music in Spotify")} onClick={openSpotify}><ExternalLink size={18}/></button><button aria-label={t("Volgende luisterrichting","Next listening direction")} onClick={()=>setTrack((track+1)%current.tracks.length)}>›</button></div>
   <button className="radio-volume" onClick={openSpotify}><Volume2/><span>{t("Open selectie in Spotify","Open selection in Spotify")}</span><ExternalLink size={14}/></button>
  </section>
  <section className="moods"><div className="sectionhead"><span>{t("KIES JE FREQUENTIE","CHOOSE YOUR FREQUENCY")}</span><em>{current.name}</em></div>{moods.map((item,index)=><button key={item.name} className={index===mood?"mood active":"mood"} aria-pressed={index===mood} onClick={()=>changeMood(index)}><span className="mood-number">0{index+1}</span><div><strong>{item.name}</strong><small>{moodDescription(item.name,item.desc)}</small></div><ChevronRight/></button>)}</section>
  <section className="radio-note"><Radio/><div><strong>{t("Spotify-koppeling","Spotify connection")}</strong><span>{t("Deze knop opent een Spotify-zoekopdracht voor de gekozen sfeer. In-app streaming vereist een aparte Spotify-integratie en moet voldoen aan hun account- en gebruiksvoorwaarden. Je hebt Spotify nodig om daar af te spelen.","This button opens a Spotify search for the selected mood. In-app streaming requires a separate Spotify integration and must follow its account and usage terms. You need Spotify to play it there.")}</span></div></section>
  <button className="back" onClick={onBack}>← {t("Terug","Back")}</button>
 </main>
}
