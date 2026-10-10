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


const englishTarot: Record<string,{meaning:string;prompt:string}> = {
 "The Collar":{meaning:"Trust grows when agreements stay visible and voluntary.",prompt:"Which agreement gives you the most confidence today?"},
 "The Key":{meaning:"A new layer begins with a clear choice.",prompt:"What would you like to ask permission for today?"},
 "The Crown":{meaning:"Leadership is given, not automatically owned.",prompt:"Who holds the lead today, and how can it be handed back?"},
 "The Brat":{meaning:"Playfulness works best when boundaries are as clear as the challenge.",prompt:"Where could you add playfulness within your agreed limits?"},
 "The Surrender":{meaning:"Letting go is not losing control when everyone knows the boundary.",prompt:"What feels safe enough to let go of intentionally?"},
 "The Safeword":{meaning:"An agreed safeword supports trust, especially as intensity rises.",prompt:"Is your safeword clear and ready to use?"},
 "The Tease":{meaning:"Anticipation can be a meaningful form of connection on its own.",prompt:"How can you build tension without crossing a boundary?"},
 "The Boundary":{meaning:"A strong boundary makes free choice possible.",prompt:"Which boundary must be respected today?"},
 "The Aftercare":{meaning:"The experience does not end when the timer stops. Care afterwards matters.",prompt:"What do you need to land gently after the experience?"},
 "The Mirror":{meaning:"Look at yourself before guessing what the other person feels.",prompt:"Which need would you like to name out loud today?"},
 "The Lock":{meaning:"Not every door needs to open. A deliberate no is a complete choice.",prompt:"Which door stays closed today?"},
 "The Devotion":{meaning:"Devotion grows through repeated choices of trust, communication, and care.",prompt:"What small action shows that you take the other person seriously?"}
};
const englishOracle: Record<string,{meaning:string;prompt:string}> = {
 "Take Control":{meaning:"Taking the lead can feel exciting when it is consciously offered and can always be reclaimed.",prompt:"What kind of leadership feels right for you today?"},
 "Give Control":{meaning:"Trust grows when control is handed over intentionally within clear boundaries.",prompt:"Which boundary must remain non-negotiable?"},
 "Ask First":{meaning:"A short question can build more trust than a big assumption.",prompt:"What would you like to ask explicit permission for first today?"},
 "Tease":{meaning:"Playfulness can build tension without creating pressure.",prompt:"How can you stay playful and communicate clearly?"},
 "Pause":{meaning:"Pausing is not failure. It is an active way to care for the experience.",prompt:"What signal means it is time for a check-in?"},
 "Aftercare":{meaning:"Care after the experience is part of the experience.",prompt:"What helps you settle gently afterwards?"}
};
const englishSigns: Record<string,{name:string;text:string}> = {
 "Ram":{name:"Aries",text:"Lead with clarity. Leadership feels strongest when the other person knows that no is always welcome."},
 "Stier":{name:"Taurus",text:"Surrender does not need to be rushed. Build trust through calm, predictability, and clear aftercare."},
 "Tweelingen":{name:"Gemini",text:"Teasing begins with language. Ask, listen, and never let tension matter more than consent."},
 "Kreeft":{name:"Cancer",text:"Notice the space between intensity and safety. Check in and include aftercare in the agreement."},
 "Leeuw":{name:"Leo",text:"Own the room, not the person. Lead with presence while leaving room for the other person to adjust."},
 "Maagd":{name:"Virgo",text:"Details are powerful. Make boundaries, signals, and safewords clear enough that nobody has to guess."},
 "Weegschaal":{name:"Libra",text:"Balance leading and following. A good dynamic lets both people feel seen and heard."},
 "Schorpioen":{name:"Scorpio",text:"Intensity can go deep, but trust is the foundation. Check consent as the energy grows stronger."},
 "Boogschutter":{name:"Sagittarius",text:"Curiosity can open the door. Keep boundaries visible while exploring something new together."},
 "Steenbok":{name:"Capricorn",text:"Structure can make surrender safer. Agree on the framework and allow freedom within it."},
 "Waterman":{name:"Aquarius",text:"Break routines, not boundaries. An unexpected choice works only when everyone consciously agrees."},
 "Vissen":{name:"Pisces",text:"Intuition is useful, but mind-reading is not real. Ask, listen, and let aftercare close the circle."}
};

const signs=[
["Ram","Leid met helderheid. Regie voelt het sterkst wanneer de ander weet dat nee altijd welkom blijft."],["Stier","Surrender hoeft niet gehaast. Bouw vertrouwen via rust, voorspelbaarheid en duidelijke aftercare."],["Tweelingen","Tease begint met taal. Vraag, luister en laat spanning nooit belangrijker worden dan toestemming."],["Kreeft","Voel de ruimte tussen intensiteit en veiligheid. Check signalen en maak aftercare onderdeel van de afspraak."],
["Leeuw","Own the room, not the person. Neem regie met aanwezigheid en geef de ander altijd ruimte om bij te sturen."],["Maagd","Details zijn kracht. Maak grenzen, signalen en stopwoorden vooraf zo duidelijk dat niemand hoeft te gokken."],["Weegschaal","Zoek de balans tussen leiden en volgen. Goede dynamiek laat beide kanten zichtbaar en gehoord blijven."],["Schorpioen","Intensiteit mag diep gaan, maar trust is de basis. Check consent juist wanneer de energie sterker wordt."],
["Boogschutter","Nieuwsgierigheid mag de deur openen. Houd de grenzen zichtbaar terwijl je samen iets nieuws verkent."],["Steenbok","Structuur kan surrender juist veiliger maken. Spreek de kaders af en laat binnen die kaders ruimte ontstaan."],["Waterman","Breek met routine, niet met grenzen. Een onverwachte keuze werkt alleen wanneer iedereen bewust meedoet."],["Vissen","Intuïtie is mooi, maar gedachten lezen bestaat niet. Vraag na, luister en laat aftercare de cirkel sluiten."]
];

export function Insights({onBack,language="nl"}:{onBack:()=>void;language?:"nl"|"en"}){
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const[tab,setTab]=useState<"tarot"|"oracle"|"astro">("tarot");
 const[cardIndex,setCardIndex]=useState(()=>Math.floor(Math.random()*tarot.length));
 const[oracleIndex,setOracleIndex]=useState(()=>Math.floor(Math.random()*oracle.length));
 const[spread,setSpread]=useState<number[]>([]);
 const[sign,setSign]=useState("Weegschaal");
 const[birthDate,setBirthDate]=useState("");
 const[copied,setCopied]=useState(false);
 const localizedTarot = language === "en" ? tarot.map(item=>({...item,...englishTarot[item.name]})) : tarot;
 const localizedOracle = language === "en" ? oracle.map(item=>({...item,...englishOracle[item.name]})) : oracle;
 const card=localizedTarot[cardIndex];
 const activeSign=useMemo(()=>birthDate?zodiacSignForBirthDate(birthDate)??sign:sign,[birthDate,sign]);
 const signText=useMemo(()=>language==="en"?(englishSigns[activeSign]?.text??""):signs.find(([name])=>name===activeSign)?.[1]??"",[activeSign,language]);
 const dailyReflection=useMemo(()=>dailyReflectionFor(activeSign),[activeSign]);
 const drawRandomIndex=(length:number,exclude:number)=>{let next=Math.floor(Math.random()*length);if(length>1&&next===exclude)next=(next+1+Math.floor(Math.random()*(length-1)))%length;return next};
 const drawSpread=()=>{const pool=localizedTarot.map((_,index)=>index);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}setSpread(pool.slice(0,3));setCopied(false)};
 const copyReflection=async()=>{const textToCopy=tab==="tarot"?(spread.length?spread.map((index,position)=>`${["I · INTENTIE","II · DYNAMIEK","III · AFTERCARE"][position]}\n${localizedTarot[index].name}\n${localizedTarot[index].meaning}\nReflectie: ${localizedTarot[index].prompt}`).join("\n\n"):`${card.name}\n${card.meaning}\n${language==="en"?"Reflection":"Reflectie"}: ${card.prompt}`):tab==="oracle"?`${localizedOracle[oracleIndex].name}\n${localizedOracle[oracleIndex].meaning}\n${language==="en"?"Reflection":"Reflectie"}: ${localizedOracle[oracleIndex].prompt}`:`${activeSign} · AFTER-HOURS ENERGIE\n${signText}\n\nVandaag: ${dailyReflection.title}\n${dailyReflection.prompt}`;try{await navigator.clipboard.writeText(`AFTER HOURS · ${tab.toUpperCase()}\n\n${textToCopy}\n\nConsent first.`);setCopied(true)}catch{setCopied(false)}};
 return <main className="insights">
 <section className="insights-hero"><span className="eyebrow">AFTER HOURS · INSIGHTS</span><h2>{t("Lees de ruimte.","Read the room.")}</h2><p>{t("Een kinky reflectie voor het moment. Speels, bewust en altijd consent-first.","A kinky reflection for the moment. Playful, mindful, and always consent-first.")}</p>
 <div className="insight-tabs"><button className={tab==="tarot"?"active":""} onClick={()=>setTab("tarot")}><Sparkles/> {t("Kinky Tarot","Kinky Tarot")}</button><button className={tab==="oracle"?"active":""} onClick={()=>setTab("oracle")}><LockKeyhole/> Oracle</button><button className={tab==="astro"?"active":""} onClick={()=>{setTab("astro");recordAchievement("horoscope")}}><Star/> Astrology</button></div></section>
 {tab==="tarot"?<section className="tarot-card"><span className="eyebrow">KINKY TAROT · {spread.length?"3-CARD SPREAD":"SINGLE CARD"}</span>{spread.length?<div className="tarot-spread">{spread.map((index,position)=><article className="tarot-spread-card" key={tarot[index].name}><span>{["I · INTENTIE","II · DYNAMIEK","III · AFTERCARE"][position]}</span><h4>{tarot[index].name}</h4><p>{tarot[index].meaning}</p><strong>{tarot[index].prompt}</strong></article>)}</div>:<><div className="tarot-symbol">✦</div><h3>{card.name}</h3><p>{card.meaning}</p><div className="tarot-prompt"><span>REFLECTIE</span><strong>{card.prompt}</strong></div></>}<div className="insight-actions"><button className="gold" onClick={()=>{setSpread([]);setCardIndex(drawRandomIndex(tarot.length,cardIndex));setCopied(false)}}><RefreshCw/> {t("Trek opnieuw","Draw again")}</button><button onClick={drawSpread}>{t("3 kaarten","3 cards")}</button><button onClick={()=>void copyReflection()}>{copied?<Check/>:<Copy/>}{copied?t(" Gekopieerd"," Copied") : t(" Kopieer legging"," Copy spread")}</button></div></section>
 :tab==="oracle"?<section className="tarot-card"><span className="eyebrow">AFTER HOURS ORACLE</span><div className="tarot-symbol">⛓</div><h3>{localizedOracle[oracleIndex].name}</h3><p>{localizedOracle[oracleIndex].meaning}</p><div className="tarot-prompt"><span>ORACLE PROMPT</span><strong>{localizedOracle[oracleIndex].prompt}</strong></div><div className="insight-actions"><button className="gold" onClick={()=>{setOracleIndex(drawRandomIndex(oracle.length,oracleIndex));setCopied(false)}}><RefreshCw/> Nieuwe boodschap</button><button onClick={()=>void copyReflection()}>{copied?<Check/>:<Copy/>}{copied?t(" Gekopieerd"," Copied") : t(" Kopieer reflectie"," Copy reflection")}</button></div></section>
 :<section className="astro-card"><span className="eyebrow">KINKY ASTROLOGY · DYNAMIEK</span><h3>{t("Jouw after-hours energie","Your after-hours energy")}</h3><label className="astro-label" htmlFor="astro-birth-date">{t("Geboortedatum","Date of birth")} <span>({t("optioneel, wordt niet opgeslagen","optional, not stored")})</span></label><input className="astro-date" id="astro-birth-date" type="date" value={birthDate} max={new Date().toISOString().slice(0,10)} onChange={e=>setBirthDate(e.target.value)} aria-describedby="astro-date-help"/><p className="astro-date-help" id="astro-date-help">{t("Vul je geboortedatum in om je sterrenbeeld automatisch te bepalen, of kies het hieronder zelf.","Enter your date of birth to determine your zodiac sign automatically, or choose it below.")}</p><label className="astro-label" htmlFor="astro-sign">{t("Sterrenbeeld","Zodiac sign")}</label><select id="astro-sign" value={activeSign} onChange={e=>{setSign(e.target.value);setBirthDate("")}}>{signs.map(([name])=><option key={name} value={name}>{language==="en"?(englishSigns[name]?.name??name):name}</option>)}</select><div className="astro-reading"><Star/><strong>{language==="en"?(englishSigns[activeSign]?.name??activeSign):activeSign}</strong><p>{signText}</p><div className="astro-daily"><span>REFLECTIE VAN VANDAAG · {dailyReflection.title.toUpperCase()}</span><p>{dailyReflection.prompt}</p></div></div><div className="insight-safety"><Shield/><span>{t("Gebruik dit als kinky reflectie, niet als voorspelling. Regie, surrender, tease, trust, grenzen en aftercare blijven altijd ondergeschikt aan je actuele consent.","Use this as a kinky reflection, not a prediction. Power dynamics, teasing, trust, boundaries and aftercare always remain subject to your current consent.")}</span></div><button className="astro-copy" onClick={()=>void copyReflection()}>{copied?<Check/>:<Copy/>}{copied?" Gekopieerd":" Kopieer reflectie"}</button></section>}
 <section className="insight-footer"><span>18+ · KINKY REFLECTIE · CONSENT FIRST</span><button onClick={onBack}>← {t("Terug","Back")}</button></section>
 </main>
}