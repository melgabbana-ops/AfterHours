import React,{useMemo,useState}from"react";
import{RefreshCw,Sparkles,Shield,Star,LockKeyhole}from"lucide-react";

const tarot=[
{name:"The Collar",meaning:"Vertrouwen wordt sterker wanneer afspraken zichtbaar en vrijwillig blijven.",prompt:"Welke afspraak geeft jullie vandaag het meeste vertrouwen?"},
{name:"The Key",meaning:"Toegang tot een nieuwe laag begint met een duidelijke keuze.",prompt:"Waarvoor willen jullie vandaag bewust toestemming vragen?"},
{name:"The Crown",meaning:"Regie is iets dat je krijgt, niet iets dat je vanzelf bezit.",prompt:"Waar ligt vandaag de regie, en hoe kan die worden teruggegeven?"},
{name:"The Brat",meaning:"Speelsheid werkt het best wanneer grenzen net zo duidelijk zijn als de uitdaging.",prompt:"Waar mag vandaag meer speelsheid zitten binnen jullie afspraken?"},
{name:"The Surrender",meaning:"Loslaten is geen verlies van controle wanneer beide mensen weten waar de grens ligt.",prompt:"Wat voelt veilig genoeg om bewust los te laten?"},
{name:"The Safeword",meaning:"Een afgesproken stopwoord maakt ruimte voor vertrouwen, juist wanneer de spanning stijgt.",prompt:"Is jullie stopwoord nog helder en voor beiden paraat?"},
{name:"The Tease",meaning:"Anticipatie kan op zichzelf al een bewuste vorm van verbinding zijn.",prompt:"Hoe kunnen jullie spanning opbouwen zonder een grens te overschrijden?"},
{name:"The Boundary",meaning:"Een sterke grens maakt een vrije keuze mogelijk.",prompt:"Welke grens moet vandaag absoluut gerespecteerd worden?"},
{name:"The Aftercare",meaning:"De ervaring eindigt niet wanneer de timer stopt. Aandacht erna telt mee.",prompt:"Wat hebben jullie na afloop nodig om goed te landen?"},
{name:"The Mirror",meaning:"Kijk naar jezelf voordat je probeert te raden wat de ander voelt.",prompt:"Welke behoefte wil je vandaag hardop benoemen?"},
{name:"The Lock",meaning:"Niet elke deur hoeft open. Een bewuste nee is een volledige keuze.",prompt:"Welke deur blijft vandaag gesloten?"},
{name:"The Devotion",meaning:"Toewijding ontstaat door herhaaldelijk te kiezen voor vertrouwen, communicatie en zorg.",prompt:"Welke kleine actie laat vandaag zien dat jullie elkaar serieus nemen?"}
];

const oracle=[
{name:"Take Control",meaning:"Regie kan spannend zijn wanneer die bewust wordt gegeven en altijd kan worden teruggenomen.",prompt:"Welke vorm van regie voelt vandaag goed voor jullie beiden?"},
{name:"Give Control",meaning:"Vertrouwen groeit wanneer controle bewust wordt overgedragen binnen duidelijke grenzen.",prompt:"Welke grens blijft onvoorwaardelijk staan?"},
{name:"Ask First",meaning:"Een korte vraag kan meer vertrouwen geven dan een grote aanname.",prompt:"Waar wil je vandaag eerst expliciet toestemming voor vragen?"},
{name:"Tease",meaning:"Speelsheid mag spanning opbouwen zonder druk te creëren.",prompt:"Hoe kunnen jullie vandaag speels blijven én duidelijk communiceren?"},
{name:"Pause",meaning:"Pauzeren is geen mislukking. Het is actief zorg dragen voor de ervaring.",prompt:"Welk signaal betekent voor jullie: even terug naar check-in?"},
{name:"Aftercare",meaning:"Zorg na de ervaring hoort bij de ervaring.",prompt:"Wat helpt jullie om na afloop rustig te landen?"}
];

const signs=[
["Ram","Durf vandaag duidelijk te zijn zonder haast te maken."],["Stier","Rust en comfort mogen de toon zetten."],["Tweelingen","Een goed gesprek kan meer openen dan een grote geste."],["Kreeft","Let extra op emotionele signalen en nazorg."],
["Leeuw","Neem ruimte in, maar laat ruimte voor de ander."],["Maagd","Een kleine afspraak kan veel veiligheid geven."],["Weegschaal","Zoek het punt waar verlangen en grenzen elkaar respecteren."],["Schorpioen","Intensiteit werkt het best wanneer vertrouwen zichtbaar blijft."],
["Boogschutter","Nieuwsgierigheid mag leiden, zolang de route afgesproken blijft."],["Steenbok","Structuur kan verrassend veel vrijheid geven."],["Waterman","Een onverwachte keuze kan mooi zijn wanneer iedereen mee is."],["Vissen","Intuïtie is waardevol, maar vraag het altijd na."]
];

export function Insights({onBack}:{onBack:()=>void}){
 const[tab,setTab]=useState<"tarot"|"oracle"|"astro">("tarot");
 const[cardIndex,setCardIndex]=useState(()=>Math.floor(Math.random()*tarot.length));
 const[oracleIndex,setOracleIndex]=useState(()=>Math.floor(Math.random()*oracle.length));
 const[spread,setSpread]=useState<number[]>([]);
 const[sign,setSign]=useState("Weegschaal");
 const card=tarot[cardIndex];
 const signText=useMemo(()=>signs.find(([name])=>name===sign)?.[1]??"",[sign]);
 const drawSpread=()=>setSpread(Array.from({length:3},()=>Math.floor(Math.random()*tarot.length)));
 return <main className="insights">
 <section className="insights-hero"><span className="eyebrow">AFTER HOURS · INSIGHTS</span><h2>Read the room.</h2><p>Een kinky reflectie voor het moment. Speels, bewust en altijd consent-first.</p>
 <div className="insight-tabs"><button className={tab==="tarot"?"active":""} onClick={()=>setTab("tarot")}><Sparkles/> Kinky Tarot</button><button className={tab==="oracle"?"active":""} onClick={()=>setTab("oracle")}><LockKeyhole/> Oracle</button><button className={tab==="astro"?"active":""} onClick={()=>setTab("astro")}><Star/> Astrology</button></div></section>
 {tab==="tarot"?<section className="tarot-card"><span className="eyebrow">KINKY TAROT · {spread.length?"3-CARD SPREAD":"SINGLE CARD"}</span><div className="tarot-symbol">✦</div><h3>{spread.length?spread.map(i=>tarot[i].name).join(" · "):card.name}</h3><p>{spread.length?spread.map(i=>tarot[i].meaning).join(" "):card.meaning}</p><div className="tarot-prompt"><span>REFLECTIE</span><strong>{spread.length?spread.map(i=>tarot[i].prompt).join(" · "):card.prompt}</strong></div><div className="insight-actions"><button className="gold" onClick={()=>{setSpread([]);setCardIndex((cardIndex+1)%tarot.length)}}><RefreshCw/> Trek opnieuw</button><button onClick={drawSpread}>3 kaarten</button></div></section>
 :tab==="oracle"?<section className="tarot-card"><span className="eyebrow">AFTER HOURS ORACLE</span><div className="tarot-symbol">⛓</div><h3>{oracle[oracleIndex].name}</h3><p>{oracle[oracleIndex].meaning}</p><div className="tarot-prompt"><span>ORACLE PROMPT</span><strong>{oracle[oracleIndex].prompt}</strong></div><button className="gold" onClick={()=>setOracleIndex((oracleIndex+1)%oracle.length)}><RefreshCw/> Nieuwe boodschap</button></section>
 :<section className="astro-card"><span className="eyebrow">ASTROLOGICAL REFLECTION</span><h3>Jouw teken</h3><select value={sign} onChange={e=>setSign(e.target.value)}>{signs.map(([name])=><option key={name}>{name}</option>)}</select><div className="astro-reading"><Star/><strong>{sign}</strong><p>{signText}</p></div><div className="insight-safety"><Shield/><span>Gebruik dit als reflectie, niet als voorspelling. Jullie afspraken en consent blijven leidend.</span></div></section>}
 <section className="insight-footer"><span>18+ · KINKY REFLECTIE · CONSENT FIRST</span><button onClick={onBack}>← Terug</button></section>
 </main>
}