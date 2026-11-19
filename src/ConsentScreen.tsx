import React,{useState}from"react";
import{ChevronRight,Shield,Heart,Lock}from"lucide-react";

export default function ConsentScreen({language="nl",onConfirm,onBack}:{language?:"nl"|"en";onConfirm:()=>void;onBack:()=>void}){
 const[checks,setChecks]=useState([false,false,false,false]);
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const labels=[
  t("Ik geef bewust en vrijwillig toestemming voor deze ervaring.","I give informed and voluntary consent to this experience."),
  t("Ik bepaal mijn eigen grenzen en voorkeuren.","I set my own boundaries and preferences."),
  t("Ik kan op elk moment pauzeren of stoppen.","I can pause or stop at any time."),
  t("Ik bevind mij in een veilige en private omgeving.","I am in a safe and private space.")
 ];
 const ready=checks.every(Boolean);
 return <main className="consent-screen ah-editorial-screen">
  <section className="consent-visual">
   <span className="eyebrow">AFTER HOURS · CONSENT & SAFETY</span>
   <h2>{t("Consent & grenzen","Consent & boundaries")}</h2>
   <p>{t("Een bewuste ervaring begint met duidelijke afspraken. Jij houdt altijd de regie over jouw grenzen.","A mindful experience starts with clear agreements. You always remain in control of your boundaries.")}</p>
  </section>
  <section className="consent-form" aria-label={t("Consentformulier","Consent form")}>
   {labels.map((label,index)=><label className={"consent-check "+(checks[index]?"checked":"")} key={index}>
    <input type="checkbox" checked={checks[index]} onChange={e=>setChecks(old=>old.map((v,i)=>i===index?e.target.checked:v))}/>
    <span className="custom-check" aria-hidden="true">✓</span><span>{label}</span>
   </label>)}
   <button className="consent-boundaries" type="button" onClick={()=>document.getElementById("consent-safety-note")?.scrollIntoView({behavior:"smooth",block:"center"})}><Shield/><span>{t("Bekijk grenzen en veiligheidsafspraken","Review boundaries and safety agreements")}</span><ChevronRight/></button>
   <div className="consent-safety-note" id="consent-safety-note"><Lock/><span>{t("STOP betekent direct stoppen. PAUZE betekent vertragen en opnieuw afstemmen. Toestemming kan altijd worden ingetrokken.","STOP means stop immediately. PAUSE means slow down and check in again. Consent can always be withdrawn.")}</span></div>
   <button className="gold consent-submit" type="button" disabled={!ready} onClick={onConfirm}>{t("IK GEEF TOESTEMMING","I CONSENT")} <ChevronRight/></button>
   <button className="back" type="button" onClick={onBack}>← {t("Terug naar home","Back home")}</button>
  </section>
 </main>;
}
