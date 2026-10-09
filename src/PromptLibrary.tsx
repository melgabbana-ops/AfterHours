import React, { useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Heart, Shuffle, ShieldCheck } from "lucide-react";

type PromptKind = "Kinky opdrachten" | "Kinky vragen" | "Vanille & verbinding" | "Aftercare";
type PromptItem = { id: string; kind: PromptKind; intensity: "Zacht" | "Stevig in taal" | "Reflectie"; title: string; text: string; note?: string };

const prompts: PromptItem[] = [
  {id:"k01",kind:"Kinky opdrachten",intensity:"Zacht",title:"De bewuste buiging",text:"Als je daar oprecht zin in hebt, neem dan een houding aan die voor jou nederigheid of toewijding symboliseert. Houd die alleen zolang het prettig voelt.",note:"Alleen op uitnodiging en zonder fysieke druk."},
  {id:"k02",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De formele toestemming",text:"Vraag met woorden om toestemming voor één vooraf besproken, niet-risicovolle handeling. Wacht op een duidelijk ja en accepteer een nee zonder discussie."},
  {id:"k03",kind:"Kinky opdrachten",intensity:"Zacht",title:"Ogen op mij",text:"Maak alleen oogcontact als dat fijn voelt. Vertel daarna in één zin wat je op dit moment nodig hebt."},
  {id:"k04",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De opdracht",text:"Geef een korte, respectvolle opdracht binnen de afgesproken grenzen, bijvoorbeeld: 'Leg je telefoon weg en kies een nummer dat bij je stemming past.' De ander mag altijd passen."},
  {id:"k05",kind:"Kinky opdrachten",intensity:"Zacht",title:"Het ritueel",text:"Kies samen een klein beginritueel: een buiging, een afgesproken aanspreekvorm of een moment stilte. Spreek vooraf af dat het optioneel blijft."},
  {id:"k06",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Vraag en wacht",text:"Vraag om een eenvoudige gunst die eerder is goedgekeurd. Wacht op het antwoord in plaats van het in te vullen. Een weigering is een volledig antwoord."},
  {id:"k07",kind:"Kinky opdrachten",intensity:"Zacht",title:"De belofte",text:"Benoem één afspraak die je vandaag bewust wilt respecteren. Laat de ander bevestigen, aanpassen of afwijzen wat je voorstelt."},
  {id:"k08",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De rol kiezen",text:"Kies voor deze ronde een rol of dynamiek die jullie al besproken hebben. Beschrijf in één zin wat die rol vandaag wel en niet betekent."},
  {id:"k09",kind:"Kinky opdrachten",intensity:"Zacht",title:"Stilte op verzoek",text:"Spreek maximaal één minuut stilte af, alleen als dat voor iedereen comfortabel is. Gebruik daarna een check-in: groen, geel of rood."},
  {id:"k10",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De grens hardop",text:"Noem één grens die vandaag absoluut blijft staan. De ander herhaalt die grens in eigen woorden, zonder te onderhandelen."},
  {id:"k11",kind:"Kinky opdrachten",intensity:"Zacht",title:"De keuze uit twee",text:"Bied twee veilige, vooraf goedgekeurde opties aan. Laat de ander kiezen of allebei afwijzen."},
  {id:"k12",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Compliment op commando",text:"Geef op verzoek één oprecht compliment over een keuze, eigenschap of inspanning. Geen opmerkingen over iemands lichaam tenzij die welkom zijn."},
  {id:"k13",kind:"Kinky opdrachten",intensity:"Zacht",title:"Het teken van vertrouwen",text:"Kies samen een klein voorwerp als symbool van vertrouwen. Leg uit wat het voor jou betekent en spreek af wanneer je het weglegt."},
  {id:"k14",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De check-in leiden",text:"Neem de leiding in een korte check-in: vraag naar groen, geel of rood, luister naar het antwoord en pas het plan aan zonder druk."},
  {id:"q01",kind:"Kinky vragen",intensity:"Reflectie",title:"Wat betekent overgave?",text:"Wanneer voelt overgave voor jou als een vrije keuze, en wat zou die vrijheid direct wegnemen?"},
  {id:"q02",kind:"Kinky vragen",intensity:"Reflectie",title:"De taal van macht",text:"Welke woorden of aanspreekvormen voelen spannend en welkom? Welke woorden zijn een harde nee?"},
  {id:"q03",kind:"Kinky vragen",intensity:"Reflectie",title:"Leiden met zorg",text:"Waaraan merk je dat iemand verantwoordelijkheid neemt zonder jouw keuzes over te nemen?"},
  {id:"q04",kind:"Kinky vragen",intensity:"Reflectie",title:"Speelse weerstand",text:"Welke vormen van plagen of uitdagende taal zijn leuk voor jou, en welke zouden echt kwetsend voelen?"},
  {id:"q05",kind:"Kinky vragen",intensity:"Reflectie",title:"Een grens die veranderde",text:"Is er iets waar je nieuwsgierig naar bent maar nog niet klaar voor bent? Wat zou je nodig hebben om er veilig over te praten?"},
  {id:"q06",kind:"Kinky vragen",intensity:"Reflectie",title:"De kracht van nee",text:"Wat helpt jou om zonder schuldgevoel nee te zeggen, ook wanneer de ander enthousiast is?"},
  {id:"q07",kind:"Kinky vragen",intensity:"Reflectie",title:"De nasleep",text:"Welke vorm van aftercare helpt je het meest: praten, stilte, warmte, ruimte of iets anders?"},
  {id:"q08",kind:"Kinky vragen",intensity:"Reflectie",title:"Een fantasie bespreken",text:"Welke fantasie zou je eerst alleen willen bespreken, zonder verwachting dat je die ooit uitvoert?"},
  {id:"q09",kind:"Kinky vragen",intensity:"Reflectie",title:"Vertrouwen verdienen",text:"Welke kleine, herhaalbare actie bouwt voor jou meer vertrouwen op dan grote beloften?"},
  {id:"q10",kind:"Kinky vragen",intensity:"Reflectie",title:"De rode lijn",text:"Welke grens wil je dat de ander onthoudt, ook als je die niet iedere keer opnieuw benoemt?"},
  {id:"v01",kind:"Vanille & verbinding",intensity:"Zacht",title:"Twee minuten aandacht",text:"Leg schermen weg en geef elkaar twee minuten onverdeelde aandacht. Je hoeft niets op te lossen of te presteren."},
  {id:"v02",kind:"Vanille & verbinding",intensity:"Zacht",title:"Kies de soundtrack",text:"Kies ieder één nummer dat je stemming beschrijft. Luister samen en vertel waarom je het koos."},
  {id:"v03",kind:"Vanille & verbinding",intensity:"Reflectie",title:"Een kleine waardering",text:"Noem iets kleins dat de ander recent deed en dat je waardeerde. Houd het concreet en oprecht."},
  {id:"v04",kind:"Vanille & verbinding",intensity:"Zacht",title:"De mini-date",text:"Bedenk samen een date van maximaal twintig minuten die weinig kost en voor beiden prettig voelt."},
  {id:"v05",kind:"Vanille & verbinding",intensity:"Reflectie",title:"Wat heb je nodig?",text:"Maak deze zin af: 'Ik voel me vandaag gesteund wanneer…' Luister zonder meteen advies te geven."},
  {id:"v06",kind:"Vanille & verbinding",intensity:"Zacht",title:"Een keuze cadeau",text:"Laat de ander kiezen tussen twee kleine activiteiten. Respecteer de keuze, ook als die anders is dan je eigen voorkeur."},
  {id:"v07",kind:"Vanille & verbinding",intensity:"Reflectie",title:"Samen groeien",text:"Welke gewoonte zou je samen willen opbouwen, en wat is de kleinste haalbare eerste stap?"},
  {id:"v08",kind:"Vanille & verbinding",intensity:"Zacht",title:"Een vriendelijk bericht",text:"Schrijf een kort bericht waarin je benoemt wat je aan de ander waardeert. Versturen is optioneel."},
  {id:"a01",kind:"Aftercare",intensity:"Zacht",title:"Groen, geel of rood?",text:"Check in zonder aannames: groen betekent oké, geel betekent vertragen en afstemmen, rood betekent onmiddellijk stoppen."},
  {id:"a02",kind:"Aftercare",intensity:"Reflectie",title:"Wat landt goed?",text:"Kies wat je nu nodig hebt: water, warmte, stilte, een gesprek, ruimte of praktische hulp. Je hoeft geen uitleg te geven."},
  {id:"a03",kind:"Aftercare",intensity:"Reflectie",title:"Geen evaluatieplicht",text:"Je hoeft niet meteen te analyseren. Spreek af of je nu, later of helemaal niet wilt napraten."},
  {id:"a04",kind:"Aftercare",intensity:"Zacht",title:"De volgende dag",text:"Plan een vrijblijvende check-in voor later: 'Hoe voel je je nu terugkijkend, en is er iets dat je nodig hebt?'"},
  {id:"a05",kind:"Aftercare",intensity:"Reflectie",title:"Wat nemen we mee?",text:"Noem één ding dat goed voelde en één ding dat je volgende keer anders wilt. Allebei mogen ook passen."},
  {id:"k15",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Protocol op maat",text:"Kies samen één klein protocol voor deze ronde, zoals eerst vragen en dan handelen. Spreek af wanneer het geldt en wanneer je het mag onderbreken."},
  {id:"k16",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De aanspreekvorm",text:"Vraag of een afgesproken titel of aanspreekvorm vandaag welkom is. Gebruik die alleen na een duidelijk ja en stop meteen als het niet meer goed voelt."},
  {id:"k17",kind:"Kinky opdrachten",intensity:"Zacht",title:"Dienstbaarheid, zelf gekozen",text:"Kies een kleine attentie of servicehandeling die de ander echt waardeert. Vraag eerst wat welkom is en maak er geen verplichting van."},
  {id:"k18",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De speelse uitdaging",text:"Bied een speelse, vooraf goedgekeurde uitdaging aan. De ander mag de uitdaging aannemen, aanpassen of overslaan zonder straf of schuldgevoel."},
  {id:"k19",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De grens van plagen",text:"Spreek één soort plagerige taal af die welkom is en één onderwerp dat verboden terrein blijft. Check daarna of de afspraak nog goed voelt."},
  {id:"k20",kind:"Kinky opdrachten",intensity:"Zacht",title:"Regie overdragen",text:"Laat de ander voor één kleine, veilige keuze de regie nemen, zoals muziek of volgorde. Je kunt de keuze altijd terugnemen of opnieuw afstemmen."},
  {id:"q11",kind:"Kinky vragen",intensity:"Reflectie",title:"Dominantie zonder druk",text:"Welke vorm van dominante taal voelt aantrekkelijk, en waaraan merk je dat het omslaat van spannend naar onprettig?"},
  {id:"q12",kind:"Kinky vragen",intensity:"Reflectie",title:"Overgave met grenzen",text:"Wat helpt je om controle vrijwillig uit handen te geven, terwijl je weet dat je die altijd terug kunt nemen?"},
  {id:"q13",kind:"Kinky vragen",intensity:"Reflectie",title:"Regels die werken",text:"Welke afspraak maakt een power dynamic leuker of duidelijker? Welke regel zou juist te beperkend voelen?"},
  {id:"q14",kind:"Kinky vragen",intensity:"Reflectie",title:"Fantasie versus werkelijkheid",text:"Welke fantasie vind je prettig om over te praten, maar wil je niet uitvoeren? Allebei mogen waar zijn."},
  {id:"q15",kind:"Kinky vragen",intensity:"Reflectie",title:"Herstel van vertrouwen",text:"Wat zou je nodig hebben als een afspraak per ongeluk wordt gemist, en hoe kan iemand verantwoordelijkheid nemen zonder je onder druk te zetten?"},
];

const kinds: Array<"Alles" | PromptKind> = ["Alles","Kinky opdrachten","Kinky vragen","Vanille & verbinding","Aftercare"];

export default function PromptLibrary({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const [kind, setKind] = useState<(typeof kinds)[number]>("Alles");
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const pool = useMemo(() => prompts.filter((item) => kind === "Alles" || item.kind === kind), [kind]);
  const current = pool[index % Math.max(1, pool.length)];

  const changeKind = (next: (typeof kinds)[number]) => { setKind(next); setIndex(0); setCopied(false); };
  const next = () => { setIndex((value) => pool.length > 1 ? (value + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length : 0); setCopied(false); };
  const toggleSaved = () => setSaved((items) => items.includes(current.id) ? items.filter((id) => id !== current.id) : [...items, current.id]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(`AFTER HOURS · ${current.kind.toUpperCase()}\n${current.title}\n\n${current.text}\n\nAlleen met vrije, expliciete en herroepbare toestemming.`); setCopied(true); }
    catch { setCopied(false); }
  };

  return <main className="prompt-library">
    <section className="prompt-hero"><span className="eyebrow">AFTER HOURS · PROMPT DECK</span><h2>Choose your tension.</h2><p>Van zachte verbinding tot duidelijke power dynamics. Jij kiest wat past, wat niet past en wanneer je stopt.</p>
      <div className="prompt-filters" role="group" aria-label="Filter opdrachten">{kinds.map((item) => <button key={item} className={kind === item ? "active" : ""} onClick={() => changeKind(item)}>{item}</button>)}</div>
    </section>
    <section className="prompt-card">
      <div className="prompt-card-top"><span className="eyebrow">{current.kind.toUpperCase()}</span><span className="prompt-intensity">{current.intensity}</span></div>
      <div className="prompt-glyph" aria-hidden="true">✦</div><h3>{current.title}</h3><p>{current.text}</p>
      {current.note && <p className="prompt-note">{current.note}</p>}
      <div className="prompt-consent"><ShieldCheck/><span>18+ · Vrijwillig · Je mag altijd passen of stoppen.</span></div>
      <div className="prompt-actions"><button className="gold" onClick={next}><Shuffle/> Volgende kaart</button><button onClick={toggleSaved}><Heart fill={saved.includes(current.id) ? "currentColor" : "none"}/>{saved.includes(current.id) ? "Bewaard" : "Bewaar"}</button><button onClick={() => { if (!completed.includes(current.id)) { setCompleted((items) => [...items, current.id]); onComplete(); } }}>{completed.includes(current.id) ? <Check/> : <ArrowRight/>}{completed.includes(current.id) ? "Gedaan" : "Markeer gedaan"}</button><button onClick={() => void copy()}>{copied ? <Check/> : <Copy/>}{copied ? "Gekopieerd" : "Kopieer"}</button></div>
    </section>
    <section className="prompt-count"><span>{pool.length} kaarten in deze selectie</span><span>{saved.length} lokaal bewaard</span></section>
    <button className="prompt-back" onClick={onBack}><ArrowRight/> Terug</button>
  </main>;
}
