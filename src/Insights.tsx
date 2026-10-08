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
["Ram","Leid met helderheid. Regie voelt het sterkst wanneer de ander weet dat nee altijd welkom blijft."],["Stier","Surrender hoeft niet gehaast. Bouw vertrouwen via rust, voorspelbaarheid en duidelijke aftercare."],["Tweelingen","Tease begint met taal. Vraag, luister en laat spanning nooit belangrijker worden dan toestemming."],["Kreeft","Voel de ruimte tussen intensiteit en veiligheid. Check signalen en maak aftercare onderdeel van de afspraak."],
["Leeuw","Own the room, not the person. Neem regie met aanwezigheid en geef de ander altijd ruimte om bij te sturen."],["Maagd","Details zijn kracht. Maak grenzen, signalen en stopwoorden vooraf zo duidelijk dat niemand hoeft te gokken."],["Weegschaal","Zoek de balans tussen leiden en volgen. Goede dynamiek laat beide kanten zichtbaar en gehoord blijven."],["Schorpioen","Intensiteit mag diep gaan, maar trust is de basis. Check consent juist wanneer de energie sterker wordt."],
["Boogschutter","Nieuwsgierigheid mag de deur openen. Houd de grenzen zichtbaar terwijl je samen iets nieuws verkent."],["Steenbok","Structuur kan surrender juist veiliger maken. Spreek de kaders af en laat binnen die kaders ruimte ontstaan."],["Waterman","Breek met routine, niet met grenzen. Een onverwachte keuze werkt alleen wanneer iedereen bewust meedoet."],["Vissen","Intuïtie is mooi, maar gedachten lezen bestaat niet. Vraag na, luister en laat aftercare de cirkel sluiten."]
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
 :<section className="astro-card"><span className="eyebrow">KINKY ASTROLOGY · DYNAMIEK</span><h3>Jouw after-hours energie</h3><select value={sign} onChange={e=>setSign(e.target.value)}>{signs.map(([name])=><option key={name}>{name}</option>)}</select><div className="astro-reading"><Star/><strong>{sign}</strong><p>{signText}</p></div><div className="insight-safety"><Shield/><span>Gebruik dit als kinky reflectie, niet als voorspelling. Regie, surrender, tease, trust, grenzen en aftercare blijven altijd ondergeschikt aan jullie actuele consent.</span></div></section>}
 <section className="insight-footer"><span>18+ · KINKY REFLECTIE · CONSENT FIRST</span><button onClick={onBack}>← Terug</button></section>
 </main>
}