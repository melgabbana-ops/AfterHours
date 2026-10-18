import React from "react";
import { formatMaintenanceDate, getMaintenanceStatus, type MaintenanceConfig } from "./maintenance";

type Language = "nl" | "en";

export default function UnderConstruction({ config, language: initialLanguage }: { config?: MaintenanceConfig; language?: Language }) {
 const [language,setLanguage]=React.useState<Language>(()=>{if(initialLanguage)return initialLanguage;try{return localStorage.getItem("afterhours.language")==="en"?"en":"nl"}catch{return "en"}});
 React.useEffect(()=>{try{localStorage.setItem("afterhours.language",language);document.documentElement.lang=language}catch{/* Optional language preference */}},[language]);
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const status=getMaintenanceStatus(config);
 const scheduled=Boolean(config);
 const message=scheduled?(language==="nl"?status.messageNL:status.messageEN):t(
  "We bouwen aan een privéwereld vol kinky ervaringen en bewuste keuzes. De ervaring wordt verfijnd. Kom binnenkort terug.",
  "We're building a private world of kinky experiences and deliberate choices. The experience is being refined. Please check back soon."
 );
 const endTime=status.endsAtMs!==null&&status.endsAtMs>Date.now()?formatMaintenanceDate(status.endsAtMs,language):null;
 return <main className="maintenance-screen">
  <img className="maintenance-logo" src="/after-hours-logo.svg" alt="AFTER HOURS" />
  <div className="teaser-top-actions"><span className="maintenance-eyebrow">AFTER HOURS · PRIVATE WORLD</span><button className="language-toggle" type="button" aria-label={t("Taal wijzigen","Change language")} onClick={()=>setLanguage(language==="nl"?"en":"nl")}><span className={language==="nl"?"language-active":""}>NL</span><span className="language-divider">/</span><span className={language==="en"?"language-active":""}>EN</span></button></div>
  <h1>{scheduled?t("IN","UNDER"):t("IN","UNDER")}<br/><em>{scheduled?t("ONDERHOUD","MAINTENANCE"):t("AANBOUW","CONSTRUCTION")}</em></h1>
  <h2>{scheduled?t("We zijn even bezig achter de schermen.","We're making a few things better.") : t("Iets bijzonders is onderweg.","Something worth waiting for.")}</h2>
  <div className="maintenance-rule"/>
  <p>{message}</p>
  {endTime&&<p className="maintenance-end-time">{t("Verwacht einde (indicatie): ","Expected finish (estimate): ")}{endTime}</p>}
  <div className="maintenance-status"><span/> {scheduled?t("GEPLAND ONDERHOUD","SCHEDULED MAINTENANCE"):t("IN ONTWIKKELING · BINNENKORT TERUG","IN DEVELOPMENT · BACK SOON")}</div>
  <footer>AFTER HOURS · CINEMATIC BLACK & GOLD</footer>
 </main>
}
