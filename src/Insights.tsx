import React,{useMemo,useState}from"react";
import{dailyReflectionFor,zodiacSignForBirthDate}from"./astrology";
import{recordAchievement}from"./achievements";
import{RefreshCw,Sparkles,Shield,Star,LockKeyhole,Copy,Check}from"lucide-react";

const tarot=[
{name:"The Collar",meaning:"Vertrouwen wordt sterker wanneer afspraken zichtbaar en vrijwillig blijven.",prompt:"Welke afspraak geeft je vandaag het meeste vertrouwen?"},
{name:"The Key",meaning:"Toegang tot een nieuwe laag begint met een duidelijke keuze.",prompt:"Waarvoor wil je vandaag bewust toestemming vragen?"},
{name:"The Crown",meaning:"Regie is iets dat je krijgt, niet iets dat je vanzelf bezit.",prompt:"Waar ligt vandaag de regie, en hoe kan die worden teruggegeven?"},
{name:"The Brat",meaning:"Speelsheid werkt het best wanneer grenzen net zo duidelijk zijn als de uitdaging.",prompt:"Waar mag vandaag meer speelsheid zitten binnen de afgesproken grenzen?"},
{name:"The Surrender",meaning:"Loslaten is geen verlies van controle wanneer beide mensen weten waar de grens ligt.",prompt:"Wat voelt veilig genoeg om bewust los te laten?"},
{name:"The Safeword",meaning:"Een afgesproken stopwoord maakt ruimte voor vertrouwen, juist wanneer de spanning stijgt.",prompt:"Is je stopwoord nog helder en paraat?"},
{name:"The Tease",meaning:"Anticipatie kan op zichzelf al een bewuste vorm van verbinding zijn.",prompt:"Hoe bouw je spanning op zonder een grens te overschrijden?"},
{name:"The Boundary",meaning:"Een sterke grens maakt een vrije keuze mogelijk.",prompt:"Welke grens moet vandaag absoluut gerespecteerd worden?"},
{name:"The Aftercare",meaning:"De ervaring eindigt niet wanneer de timer stopt. Aandacht erna telt mee.",prompt:"Wat heb je na afloop nodig om goed te landen?"},
{name:"The Mirror",meaning:"Kijk naar jezelf voordat je probeert te raden wat de ander voelt.",prompt:"Welke behoefte wil je vandaag hardop benoemen?"},
{name:"The Lock",meaning:"Niet elke deur hoeft open. Een bewuste nee is een volledige keuze.",prompt:"Welke deur blijft vandaag gesloten?"},
{name:"The Devotion",meaning:"Toewijding ontstaat door herhaaldelijk te kiezen voor vertrouwen, communicatie en zorg.",prompt:"Welke kleine actie laat zien dat je de ander serieus neemt?"}
];

const oracle=[
{name:"Take Control",meaning:"Regie kan spannend zijn wanneer die bewust wordt gegeven en altijd kan worden teruggenomen.",prompt:"Welke vorm van regie voelt vandaag goed voor je?"},
{name:"Give Control",meaning:"Vertrouwen groeit wanneer controle bewust wordt overgedragen binnen duidelijke grenzen.",prompt:"Welke grens blijft onvoorwaardelijk staan?"},
{name:"Ask First",meaning:"Een korte vraag kan meer vertrouwen geven dan een grote aanname.",prompt:"Waar wil je vandaag eerst expliciet toestemming voor vragen?"},
{name:"Tease",meaning:"Speelsheid mag spanning opbouwen zonder druk te creëren.",prompt:"Hoe blijf je speels én duidelijk communiceren?"},
{name:"Pause",meaning:"Pauzeren is geen mislukking. Het is actief zorg dragen voor de ervaring.",prompt:"Welk signaal betekent voor jou: even terug naar check-in?"},
{name:"Aftercare",meaning:"Zorg na de ervaring hoort bij de ervaring.",prompt:"Wat helpt je om na afloop rustig te landen?"}
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
 const[birthDate,setBirthDate]=useState("");
 const[copied,setCopied]=useState(false);
 const card=tarot[cardIndex];
 const activeSign=useMemo(()=>birthDate?zodiacSignForBirthDate(birthDate)??sign:sign,[birthDate,sign]);
 const signText=useMemo(()=>signs.find(([name])=>name===activeSign)?.[1]??"",[activeSign]);
 const dailyReflection=useMemo(()=>dailyReflectionFor(activeSign),[activeSign]);
 const drawRandomIndex=(length:number,exclude:number)=>{let next=Math.floor(Math.random()*length);if(length>1&&next===exclude)next=(next+1+Math.floor(Math.random()*(length-1)))%length;return next};
 const drawSpread=()=>{const pool=tarot.map((_,index)=>index);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}setSpread(pool.slice(0,3));setCopied(false)};
 const copyReflection=async()=>{const textToCopy=tab==="tarot"?(spread.length?spread.map((index,position)=>`${["I · INTENTIE","II · DYNAMIEK","III · AFTERCARE"][position]}\n${tarot[index].name}\n${tarot[index].meaning}\nReflectie: ${tarot[index].prompt}`).join("\n\n"):`${card.name}\n${card.meaning}\nReflectie: ${card.prompt}`):tab==="oracle"?`${oracle[oracleIndex].name}\n${oracle[oracleIndex].meaning}\nReflectie: ${oracle[oracleIndex].prompt}`:`${activeSign} · AFTER-HOURS ENERGIE\n${signText}\n\nVandaag: ${dailyReflection.title}\n${dailyReflection.prompt}`;try{await navigator.clipboard.writeText(`AFTER HOURS · ${tab.toUpperCase()}\n\n${textToCopy}\n\nConsent first.`);setCopied(true)}catch{setCopied(false)}};
 return <main className="insights">
 <section className="insights-hero"><span className="eyebrow">AFTER HOURS · INSIGHTS</span><h2>Read the room.</h2><p>Een kinky reflectie voor het moment. Speels, bewust en altijd consent-first.</p>
 <div className="insight-tabs"><button className={tab==="tarot"?"active":""} onClick={()=>setTab("tarot")}><Sparkles/> Kinky Tarot</button><button className={tab==="oracle"?"active":""} onClick={()=>setTab("oracle")}><LockKeyhole/> Oracle</button><button className={tab==="astro"?"active":""} onClick={()=>{setTab("astro");recordAchievement("horoscope")}}><Star/> Astrology</button></div></section>
 {tab==="tarot"?<section className="tarot-card"><span className="eyebrow">KINKY TAROT · {spread.length?"3-CARD SPREAD":"SINGLE CARD"}</span>{spread.length?<div className="tarot-spread">{spread.map((index,position)=><article className="tarot-spread-card" key={tarot[index].name}><span>{["I · INTENTIE","II · DYNAMIEK","III · AFTERCARE"][position]}</span><h4>{tarot[index].name}</h4><p>{tarot[index].meaning}</p><strong>{tarot[index].prompt}</strong></article>)}</div>:<><div className="tarot-symbol">✦</div><h3>{card.name}</h3><p>{card.meaning}</p><div className="tarot-prompt"><span>REFLECTIE</span><strong>{card.prompt}</strong></div></>}<div className="insight-actions"><button className="gold" onClick={()=>{setSpread([]);setCardIndex(drawRandomIndex(tarot.length,cardIndex));setCopied(false)}}><RefreshCw/> Trek opnieuw</button><button onClick={drawSpread}>3 kaarten</button><button onClick={()=>void copyReflection()}>{copied?<Check/>:<Copy/>}{copied?" Gekopieerd":" Kopieer legging"}</button></div></section>
 :tab==="oracle"?<section className="tarot-card"><span className="eyebrow">AFTER HOURS ORACLE</span><div className="tarot-symbol">⛓</div><h3>{oracle[oracleIndex].name}</h3><p>{oracle[oracleIndex].meaning}</p><div className="tarot-prompt"><span>ORACLE PROMPT</span><strong>{oracle[oracleIndex].prompt}</strong></div><div className="insight-actions"><button className="gold" onClick={()=>{setOracleIndex(drawRandomIndex(oracle.length,oracleIndex));setCopied(false)}}><RefreshCw/> Nieuwe boodschap</button><button onClick={()=>void copyReflection()}>{copied?<Check/>:<Copy/>}{copied?" Gekopieerd":" Kopieer reflectie"}</button></div></section>
 :<section className="astro-card"><span className="eyebrow">KINKY ASTROLOGY · DYNAMIEK</span><h3>Jouw after-hours energie</h3><label className="astro-label" htmlFor="astro-birth-date">Geboortedatum <span>(optioneel, wordt niet opgeslagen)</span></label><input className="astro-date" id="astro-birth-date" type="date" value={birthDate} max={new Date().toISOString().slice(0,10)} onChange={e=>setBirthDate(e.target.value)} aria-describedby="astro-date-help"/><p className="astro-date-help" id="astro-date-help">Vul je geboortedatum in om je sterrenbeeld automatisch te bepalen, of kies het hieronder zelf.</p><label className="astro-label" htmlFor="astro-sign">Sterrenbeeld</label><select id="astro-sign" value={activeSign} onChange={e=>{setSign(e.target.value);setBirthDate("")}}>{signs.map(([name])=><option key={name}>{name}</option>)}</select><div className="astro-reading"><Star/><strong>{activeSign}</strong><p>{signText}</p><div className="astro-daily"><span>REFLECTIE VAN VANDAAG · {dailyReflection.title.toUpperCase()}</span><p>{dailyReflection.prompt}</p></div></div><div className="insight-safety"><Shield/><span>Gebruik dit als kinky reflectie, niet als voorspelling. Regie, surrender, tease, trust, grenzen en aftercare blijven altijd ondergeschikt aan jullie actuele consent.</span></div><button className="astro-copy" onClick={()=>void copyReflection()}>{copied?<Check/>:<Copy/>}{copied?" Gekopieerd":" Kopieer reflectie"}</button></section>}
 <section className="insight-footer"><span>18+ · KINKY REFLECTIE · CONSENT FIRST</span><button onClick={onBack}>← Terug</button></section>
 </main>
}