import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Play, ShieldCheck, Sparkles } from "lucide-react";

type Language = "nl" | "en";
const VIDEO = "https://gcdn.picsart.com/editing-temp/a18ef45a-9ae8-4ce4-93b4-68e40401defc.mp4";

export default function Onboarding({ language = "nl", onComplete }: { language?: Language; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<"iphone" | "android">("iphone");
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const finish = () => {
    try { localStorage.setItem("afterhours.onboarding.completed", "1"); } catch { /* Optional preference */ }
    onComplete();
  };
  const titles = [
    t("MEER DAN EEN GAME. EEN ERVARING.", "MORE THAN A GAME. AN EXPERIENCE."),
    t("DIT KUN JE VERWACHTEN", "WHAT TO EXPECT"),
    t("NEEM AFTER HOURS MEE", "TAKE AFTER HOURS WITH YOU"),
    t("BEKIJK DE TRAILER", "WATCH THE TRAILER"),
  ];
  return <main className="onboarding-screen">
    <div className="onboarding-orbit" aria-hidden="true"><span/><i/><b/></div>
    <header className="onboarding-header">
      <img src="/after-hours-logo.svg" alt="AFTER HOURS"/>
      <span className="eyebrow">PRIVATE EXPERIENCE · 18+</span>
    </header>
    <div className="onboarding-stepper" aria-label={t("Stap","Step") + " " + (step + 1) + " / 4"}>
      {[0,1,2,3].map((index) => <span key={index} className={index === step ? "current" : index < step ? "done" : ""}/>)}
    </div>
    <section className="onboarding-panel">
      <span className="eyebrow">{t("EEN PERSOONLIJKE INTRODUCTIE","YOUR PRIVATE INTRODUCTION")} · 0{step + 1}</span>
      <h1>{titles[step]}</h1>
      {step === 0 && <div className="onboarding-welcome">
        <Sparkles size={28}/>
        <p>{t("Ontdek een wereld van interactieve opdrachten, persoonlijke progressie en bewust gekozen spanning. Jij bepaalt wat past, waar je grens ligt en wanneer je stopt.", "Explore a world of interactive prompts, personal progression and deliberately chosen tension. You decide what fits, where your boundaries are and when to stop.")}</p>
        <div className="onboarding-promise"><ShieldCheck/><span>{t("Jouw grenzen staan altijd boven de game.", "Your boundaries always come before the game.")}</span></div>
      </div>}
      {step === 1 && <div className="onboarding-features">
        {[
          [t("Interactieve ervaringen","Interactive experiences"),t("Rondes, timer en keuzes die bij je passen","Rounds, timer and choices that suit you")],
          [t("XP, ranks en collectibles","XP, ranks and collectibles"),t("Bouw je eigen AFTER HOURS-identiteit op","Build your own AFTER HOURS identity")],
          [t("Mood checks, Oracle en muziek","Mood checks, Oracle and music"),t("Tarot, horoscoop en een donkere soundtrack","Tarot, horoscope and a dark soundtrack")],
          [t("Private media en aftercare","Private media and aftercare"),t("Persoonlijke ruimte, reflectie en rustig afronden","Private space, reflection and a gentle landing")],
        ].map(([title, body]) => <div className="onboarding-feature" key={title}><span><Check size={15}/></span><div><strong>{title}</strong><small>{body}</small></div></div>)}
        <p className="onboarding-safety-note">{t("Toestemming is apart geregeld. PAUSE, PASS en STOP blijven altijd beschikbaar.", "Consent is handled separately. PAUSE, PASS and STOP always remain available.")}</p>
      </div>}
      {step === 2 && <div className="onboarding-install">
        <p>{t("Je kunt AFTER HOURS op je beginscherm zetten, zodat het meer als een app aanvoelt.", "Add AFTER HOURS to your home screen for a more app-like experience.")}</p>
        <div className="onboarding-tabs"><button className={platform === "iphone" ? "selected" : ""} onClick={() => setPlatform("iphone")}>iPhone</button><button className={platform === "android" ? "selected" : ""} onClick={() => setPlatform("android")}>Android</button></div>
        {platform === "iphone" ? <ol><li>{t("Open AFTER HOURS in Safari.", "Open AFTER HOURS in Safari.")}</li><li>{t("Tik op de Deel-knop.", "Tap the Share button.")}</li><li>{t("Kies ‘Zet op beginscherm’.", "Choose ‘Add to Home Screen’.")}</li><li>{t("Tik op ‘Voeg toe’.", "Tap ‘Add’.")}</li></ol> : <ol><li>{t("Open AFTER HOURS in Chrome.", "Open AFTER HOURS in Chrome.")}</li><li>{t("Open het menu ⋮.", "Open the ⋮ menu.")}</li><li>{t("Kies ‘App installeren’ of ‘Toevoegen aan startscherm’.", "Choose ‘Install app’ or ‘Add to Home Screen’.")}</li><li>{t("Bevestig met ‘Installeren’.", "Confirm with ‘Install’.")}</li></ol>}
        <div className="onboarding-install-tip"><Download size={16}/>{t("Je kunt dit ook later doen via het browsermenu.", "You can also do this later from your browser menu.")}</div>
      </div>}
      {step === 3 && <div className="onboarding-trailer">
        <div className="onboarding-video-wrap"><video src={VIDEO} controls playsInline preload="metadata" poster="https://gcdn.picsart.com/cloud-storage/ea428271-664f-4cd5-a566-5bdebb64f775.jpg"/></div>
        <p>{t("Een korte blik op de sfeer. De ervaring zelf begint pas wanneer jij dat wilt.", "A short look at the atmosphere. The experience itself begins only when you choose.")}</p>
      </div>}
    </section>
    <footer className="onboarding-actions">
      <button className="onboarding-later" onClick={finish}>{t("Later","Later")}</button>
      <div>{step > 0 && <button className="onboarding-back" onClick={() => setStep((value) => Math.max(0, value - 1))} aria-label={t("Vorige stap","Previous step")}><ArrowLeft size={16}/></button>}
        {step < 3 ? <button className="onboarding-next" onClick={() => setStep((value) => Math.min(3, value + 1))}>{t("Verder","Continue")} <ArrowRight size={16}/></button> : <button className="onboarding-next" onClick={finish}>{t("Naar AFTER HOURS","Enter AFTER HOURS")} <ArrowRight size={16}/></button>}
      </div>
    </footer>
  </main>;
}
