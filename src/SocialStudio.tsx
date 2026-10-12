import React, { useMemo, useState } from "react";
import { ArrowLeft, Copy, Check, RefreshCw, Download } from "lucide-react";

type Language = "nl" | "en";
type Platform = "Instagram" | "TikTok" | "Facebook" | "YouTube" | "X" | "Pinterest" | "Threads" | "Website";
type Format = "POST" | "STORY" | "REEL COVER" | "TRAILER COVER" | "ANNOUNCEMENT" | "LEVEL REVEAL" | "CHARACTER REVEAL" | "FEATURE REVEAL" | "COUNTDOWN";

const platforms: Platform[] = ["Instagram","TikTok","Facebook","YouTube","X","Pinterest","Threads","Website"];
const formats: Format[] = ["POST","STORY","REEL COVER","TRAILER COVER","ANNOUNCEMENT","LEVEL REVEAL","CHARACTER REVEAL","FEATURE REVEAL","COUNTDOWN"];
const copyBank: Record<Format,{nl:{headline:string;body:string;cta:string};en:{headline:string;body:string;cta:string}}> = {
 "POST":{nl:{headline:"JOUW NACHT. JOUW REGELS.",body:"AFTER HOURS bouwt aan een premium 18+ ervaring rond gekozen dynamiek, persoonlijke grenzen en bewust spel. Jij houdt de regie. Elke opdracht is optioneel.",cta:"Volg de ontwikkeling."},en:{headline:"YOUR NIGHT. YOUR RULES.",body:"AFTER HOURS is building a premium 18+ experience around chosen dynamics, personal boundaries and intentional play. You stay in control. Every prompt is optional.",cta:"Follow the build."}},
 "STORY":{nl:{headline:"ER KOMT IETS AAN NA DONKER.",body:"Een privéwereld in aanbouw. Kies je eigen route, houd je grenzen helder en onthoud dat PASS en STOP altijd tellen.",cta:"Binnenkort meer."},en:{headline:"SOMETHING IS COMING AFTER DARK.",body:"A private world under construction. Choose your route, keep your boundaries clear, and remember that PASS and STOP always count.",cta:"More soon."}},
 "REEL COVER":{nl:{headline:"AFTER HOURS",body:"18+ · YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.",cta:"UNDER CONSTRUCTION"},en:{headline:"AFTER HOURS",body:"18+ · YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.",cta:"UNDER CONSTRUCTION"}},
 "TRAILER COVER":{nl:{headline:"THE NIGHT IS YOURS",body:"Een nieuwe interactieve ervaring voor volwassenen komt eraan.",cta:"Bekijk de teaser."},en:{headline:"THE NIGHT IS YOURS",body:"A new interactive experience for adults is on its way.",cta:"Watch the teaser."}},
 "ANNOUNCEMENT":{nl:{headline:"DE NACHT WORDT INTERACTIEF.",body:"AFTER HOURS ontwikkelt een premium interactieve ervaring met een eigen stijl, spelmodi, persoonlijke groei en consent-first opdrachten.",cta:"Volg de voortgang."},en:{headline:"THE NIGHT BECOMES INTERACTIVE.",body:"AFTER HOURS is developing a premium interactive experience with its own style, game modes, personal progression and consent-first prompts.",cta:"Follow progress."}},
 "LEVEL REVEAL":{nl:{headline:"ELKE STAP TELT.",body:"Ontdek de wereld van AFTER HOURS: van THE CURIOUS tot AFTER HOURS. Groei hoort bij je eigen tempo, niet bij het negeren van grenzen.",cta:"Ontdek de ranks."},en:{headline:"EVERY STEP COUNTS.",body:"Explore the AFTER HOURS world, from THE CURIOUS to AFTER HOURS. Growth follows your own pace, never the ignoring of boundaries.",cta:"Explore the ranks."}},
 "CHARACTER REVEAL":{nl:{headline:"JOUW IDENTITEIT. JOUW STIJL.",body:"Een persoonlijke AFTER HOURS identiteit die met je ervaring kan meegroeien. Jij bepaalt wat je deelt en wat privé blijft.",cta:"Bekijk de character studio."},en:{headline:"YOUR IDENTITY. YOUR STYLE.",body:"A personal AFTER HOURS identity designed to grow with your experience. You decide what to share and what stays private.",cta:"Discover the character studio."}},
 "FEATURE REVEAL":{nl:{headline:"KIES JOUW ROUTE.",body:"Story, Random, Surprise, Custom of Boss Mode: verschillende routes, met keuzes en grenzen die altijd bij jou blijven.",cta:"Ontdek de spelmodi."},en:{headline:"CHOOSE YOUR ROUTE.",body:"Story, Random, Surprise, Custom or Boss Mode: different paths, with choices and boundaries that always stay yours.",cta:"Explore the game modes."}},
 "COUNTDOWN":{nl:{headline:"NOG EVEN…",body:"AFTER HOURS is in ontwikkeling. We delen pas een lanceringsdatum wanneer die bevestigd is.",cta:"Blijf op de hoogte."},en:{headline:"JUST A LITTLE LONGER…",body:"AFTER HOURS is in development. We will share a launch date only when it is confirmed.",cta:"Stay tuned."}}
};

export function renderText(platform:Platform,format:Format,language:Language,headline:string,body:string,cta:string):string{
 const tag=platform==="YouTube"?"#YouTube":platform==="Pinterest"?"#Pinterest":platform==="TikTok"?"#TikTok":"#AfterHours";
 const hashtag="#AFTERHOURS #18PLUS #CONSENTFIRST";
 if(platform==="X")return headline+"\n\n"+body+"\n"+cta+"\n"+tag;
 if(platform==="Website")return headline+"\n\n"+body+"\n\n"+cta;
 if(platform==="YouTube")return headline+"\n\n"+body+"\n\n"+cta+"\n\n"+hashtag;
 if(platform==="Pinterest")return headline+"\n\n"+body+"\n\n"+cta+"\n"+hashtag;
 if(format==="STORY"||format==="REEL COVER"||format==="TRAILER COVER")return headline+"\n"+body+"\n"+cta;
 return headline+"\n\n"+body+"\n\n"+cta+"\n\n"+hashtag+" "+tag;
}

function safeExportName(value:string):string {
 return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48)||"after-hours";
}

export default function SocialStudio({language="nl",onBack}:{language?:Language;onBack:()=>void}){
 const [platform,setPlatform]=useState<Platform>("Instagram");
 const [format,setFormat]=useState<Format>("POST");
 const [headline,setHeadline]=useState("");
 const [body,setBody]=useState("");
 const [cta,setCta]=useState("");
 const [copied,setCopied]=useState(false);
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const defaults=copyBank[format][language];
 const currentHeadline=headline||defaults.headline;
 const currentBody=body||defaults.body;
 const currentCta=cta||defaults.cta;
 const output=useMemo(()=>renderText(platform,format,language,currentHeadline,currentBody,currentCta),[platform,format,language,currentHeadline,currentBody,currentCta]);
 const reset=()=>{setHeadline("");setBody("");setCta("");setCopied(false)};
 const copy=async()=>{try{await navigator.clipboard.writeText(output);setCopied(true)}catch{setCopied(false)}};
 const download=()=>{
  const blob=new Blob([output+"\n"],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download=safeExportName("after-hours-"+platform+"-"+format)+"-"+language+".txt";
  anchor.style.display="none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 return <main className="social-screen">
  <header className="social-heading"><button type="button" className="back" onClick={onBack}><ArrowLeft size={16}/>{t("Terug","Back")}</button><span className="eyebrow">AFTER HOURS · CREATOR STUDIO</span><h1>{t("Social studio","Social studio")}</h1><p>{t("Pas de boodschap aan en kopieer tekst voor je platform. Dit maakt tekst, geen kant-en-klare beeld- of videobestanden.","Adapt the message and copy text for your platform. This creates text, not finished image or video files.")}</p></header>
  <section className="social-editor"><label>{t("Platform","Platform")}<select value={platform} onChange={e=>{setPlatform(e.target.value as Platform);setCopied(false)}}>{platforms.map(item=><option key={item}>{item}</option>)}</select></label>
   <label>{t("Templateformaat","Template format")}<select value={format} onChange={e=>{setFormat(e.target.value as Format);reset()}}>{formats.map(item=><option key={item}>{item}</option>)}</select></label>
   <label>{t("Kopregel","Headline")}<input value={currentHeadline} onChange={e=>{setHeadline(e.target.value);setCopied(false)}} maxLength={140}/></label>
   <label>{t("Berichttekst","Post copy")}<textarea value={currentBody} onChange={e=>{setBody(e.target.value);setCopied(false)}} rows={5} maxLength={2000}/></label>
   <label>{t("Call to action","Call to action")}<input value={currentCta} onChange={e=>{setCta(e.target.value);setCopied(false)}} maxLength={180}/></label>
  </section>
  <section className="social-preview"><span className="eyebrow">{platform.toUpperCase()} · {format}</span><h2>{currentHeadline}</h2><p>{currentBody}</p><strong>{currentCta}</strong><div className="social-output"><pre>{output}</pre><small>{output.length} {t("tekens","characters")}</small></div><div className="social-actions"><button type="button" onClick={copy}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?t("Gekopieerd","Copied"):t("Kopieer tekst","Copy text")}</button><button type="button" onClick={download}><Download size={15}/>{t("Download .txt","Download .txt")}</button><button type="button" onClick={reset}><RefreshCw size={15}/>{t("Template herstellen","Reset template")}</button></div>{copied&&<small role="status">{t("Tekst staat op je klembord.","Copy is on your clipboard.")}</small>}</section>
  <p className="social-note">{t("Controleer platformregels, auteursrechten en eventuele advertentiebeperkingen voordat je publiceert. Gebruik geen niet-consensuele beelden of herkenbare media zonder aparte toestemming.","Check platform rules, copyright and advertising restrictions before publishing. Never use non-consensual or identifiable media without separate permission.")}</p>
 </main>
}
