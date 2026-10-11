import React from "react";

export default function UnderConstruction(){
 const [language,setLanguage]=React.useState<"nl"|"en">(()=>{try{return localStorage.getItem("afterhours.language")==="nl"?"nl":"en"}catch{return "en"}});
 React.useEffect(()=>{try{localStorage.setItem("afterhours.language",language);document.documentElement.lang=language}catch{/* Optional language preference */}},[language]);
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 return <main className="maintenance-screen">
  <img className="maintenance-logo" src="/after-hours-logo.svg" alt="AFTER HOURS" />
  <div className="teaser-top-actions"><span className="maintenance-eyebrow">AFTER HOURS · PRIVATE WORLD</span><button className="language-toggle" type="button" aria-label={t("Taal wijzigen","Change language")} onClick={()=>setLanguage(language==="nl"?"en":"nl")}><span className={language==="nl"?"language-active":""}>NL</span><span className="language-divider">/</span><span className={language==="en"?"language-active":""}>EN</span></button></div>
  <h1>{t("IN","UNDER")}<br/><em>{t("AANBOUW","CONSTRUCTION")}</em></h1>
  <h2>{t("Iets bijzonders is onderweg.","Something worth waiting for.")}</h2>
  <div className="maintenance-rule"/>
  <p>{t("We bouwen aan een privéwereld vol kinky ervaringen en bewuste keuzes. De ervaring wordt verfijnd. Kom binnenkort terug.","We're building a private world of kinky experiences and deliberate choices. The experience is being refined. Please check back soon.")}</p>
  <div className="maintenance-status"><span/> {t("IN ONTWIKKELING · BINNENKORT TERUG","IN DEVELOPMENT · BACK SOON")}</div>
  <footer>AFTER HOURS · CINEMATIC BLACK & GOLD</footer>
 </main>
}
