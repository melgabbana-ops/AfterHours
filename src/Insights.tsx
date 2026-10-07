import React,{useMemo,useState}from"react";
import{ChevronRight,RefreshCw,Sparkles,Shield,Star}from"lucide-react";

const tarot=[
 {name:"The Velvet Key",meaning:"Openheid ontstaat wanneer beide kanten duidelijk zeggen wat vandaag goed voelt.",prompt:"Welke grens wil je vandaag extra helder maken?"},
 {name:"The Mirror",meaning:"Kijk eerst naar wat je zelf nodig hebt voordat je de ander probeert te lezen.",prompt:"Wat heb jij nodig om ontspannen te blijven?"},
 {name:"The Threshold",meaning:"Een goed gekozen grens maakt ruimte voor vertrouwen en spel.",prompt:"Welke grens verdient een expliciete check-in?"},
 {name:"The Anchor",meaning:"Rust is geen onderbreking van de ervaring. Het is onderdeel ervan.",prompt:"Wat helpt jullie om te vertragen?"},
 {name:"The Signal",meaning:"Kleine signalen zijn waardevol wanneer je ze serieus neemt.",prompt:"Welk afgesproken signaal willen jullie actief gebruiken?"},
 {name:"The Crown",meaning:"Regie werkt alleen wanneer die vrijwillig en voortdurend bevestigd is.",prompt:"Wie neemt vandaag welk deel van de regie?"},
 {name:"The Veil",meaning:"Niet alles hoeft vooraf vast te liggen. Laat ruimte voor een bewuste keuze.",prompt:"Wat mag vandaag nog een open vraag blijven?"},
 {name:"The Flame",meaning:"Energie groeit wanneer nieuwsgierigheid en veiligheid samen oplopen.",prompt:"Wat maakt jullie nieuwsgierig binnen de afgesproken grenzen?"},
 {name:"The Compass",meaning:"Een duidelijke richting voorkomt dat tempo belangrijker wordt dan comfort.",prompt:"Wat is jullie gezamenlijke stopmoment?"},
 {name:"The Hourglass",meaning:"Tijd geeft structuur. Een timer kan helpen om bewust te blijven.",prompt:"Wanneer plannen jullie de volgende check-in?"},
 {name:"The Rose",meaning:"Aandacht voor detail kan een ervaring zachter en bewuster maken.",prompt:"Welk klein detail verdient vandaag meer aandacht?"},
 {name:"The Gate",meaning:"Toegang is nooit vanzelfsprekend. Elke nieuwe stap vraagt opnieuw om toestemming.",prompt:"Waar ligt vandaag jullie duidelijke 'nee'?"}
];

const signs=[
 ["Ram","Durf vandaag duidelijk te zijn zonder haast te maken."],["Stier","Rust en comfort mogen de toon zetten."],["Tweelingen","Een goed gesprek kan meer openen dan een grote geste."],["Kreeft","Let extra op emotionele signalen en nazorg."],
 ["Leeuw","Neem ruimte in, maar laat ruimte voor de ander."],["Maagd","Een kleine afspraak kan veel veiligheid geven."],["Weegschaal","Zoek het punt waar verlangen en grenzen elkaar respecteren."],["Schorpioen","Intensiteit werkt het best wanneer vertrouwen zichtbaar blijft."],
 ["Boogschutter","Nieuwsgierigheid mag leiden, zolang de route afgesproken blijft."],["Steenbok","Structuur kan verrassend veel vrijheid geven."],["Waterman","Een onverwachte keuze kan mooi zijn wanneer iedereen mee is."],["Vissen","Intuïtie is waardevol, maar vraag het altijd na."]
];

export function Insights({onBack}:{onBack:()=>void}){
 const[tab,setTab]=useState<"tarot"|"astro">("tarot");
 const[cardIndex,setCardIndex]=useState(()=>Math.floor(Math.random()*tarot.length));
 const[sign,setSign]=useState("Weegschaal");
 const card=tarot[cardIndex];
 const signText=useMemo(()=>signs.find(([name])=>name===sign)?.[1]??"",[sign]);
 return <main className="insights">
  <section className="insights-hero"><span className="eyebrow">AFTER HOURS · INSIGHTS</span><h2>Read the room.</h2><p>Een speelse reflectie voor het moment. Geen voorspelling, wel een uitnodiging om bewust te kiezen.</p>
   <div className="insight-tabs"><button className={tab==="tarot"?"active":""} onClick={()=>setTab("tarot")}><Sparkles/> Kinky Tarot</button><button className={tab==="astro"?"active":""} onClick={()=>setTab("astro")}><Star/> Astrology</button></div>
  </section>
  {tab==="tarot"?<section className="tarot-card"><span className="eyebrow">CARD {String(cardIndex+1).padStart(2,"0")} / 12</span><div className="tarot-symbol">✦</div><h3>{card.name}</h3><p>{card.meaning}</p><div className="tarot-prompt"><span>REFLECTIE</span><strong>{card.prompt}</strong></div><button className="gold" onClick={()=>setCardIndex((cardIndex+1)%tarot.length)}><RefreshCw/> Trek opnieuw</button></section>:<section className="astro-card"><span className="eyebrow">ASTROLOGICAL REFLECTION</span><h3>Jouw teken</h3><select value={sign} onChange={e=>setSign(e.target.value)}>{signs.map(([name])=><option key={name}>{name}</option>)}</select><div className="astro-reading"><Star/><strong>{sign}</strong><p>{signText}</p></div><div className="insight-safety"><Shield/><span>Gebruik dit als reflectie, niet als voorspelling. Jullie afspraken en consent blijven leidend.</span></div></section>}
  <section className="insight-footer"><span>18+ · REFLECTIE · CONSENT FIRST</span><button onClick={onBack}>← Terug</button></section>
 </main>
}
