import React, { useState } from "react";
import { Check, LockKeyhole, ShoppingBag, Sparkles, CalendarDays } from "lucide-react";

type Language = "nl" | "en";
type PackageId = "single" | "collection" | "club-monthly" | "club-annual";
const interestKey = "afterhours.purchase-interest.v1";
function readInterest(): PackageId[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(interestKey) || "[]");
    return Array.isArray(value) ? value.filter((item): item is PackageId => item === "single" || item === "collection" || item === "club-monthly" || item === "club-annual") : [];
  } catch { return []; }
}
interface MonetizationProps { language?: Language; onBack: () => void; onStartFree: () => void; }
export default function Monetization({ language = "nl", onBack, onStartFree }: MonetizationProps) {
  const [interest, setInterest] = useState<PackageId[]>(readInterest);
  const [notice, setNotice] = useState("");
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const markInterest = (id: PackageId) => {
    const next = interest.includes(id) ? interest.filter((item) => item !== id) : [...interest, id];
    setInterest(next);
    try {
      localStorage.setItem(interestKey, JSON.stringify(next));
      setNotice(t("Je voorkeur is alleen op dit apparaat bewaard. Er is geen betaling gestart.", "Your preference is saved on this device only. No payment has been started."));
    } catch { setNotice(t("Opslaan is niet gelukt. Er is geen betaling gestart.", "Could not save your preference. No payment has been started.")); }
  };
  return <main className="monetization-screen">
    <header className="monetization-heading">
      <span className="eyebrow"><ShoppingBag size={14}/> AFTER HOURS · COLLECTIONS</span>
      <h1>{t("Kies jouw ervaring", "Choose your experience")}</h1>
      <p>{t("Begin gratis. Kies later een losse ervaring of, als de checkout live is, optioneel AFTER HOURS Club. Geen advertenties en nooit een betaalmuur rond consent of veiligheid.", "Start free. Later choose a one-time experience or, once checkout is live, optional AFTER HOURS Club. No ads and never a paywall around consent or safety.")}</p>
    </header>
    <section className="monetization-free">
      <div className="monetization-card-top"><span className="eyebrow">{t("ALTIJD GRATIS", "ALWAYS FREE")}</span><span className="monetization-price">€0</span></div>
      <h2>Free Access</h2>
      <p>{t("Een veilige kennismaking met AFTER HOURS.", "A safe introduction to AFTER HOURS.")}</p>
      <ul>
        <li><Check/>{t("Account en persoonlijk profiel", "Account and personal profile")}</li>
        <li><Check/>{t("Consent, grenzen en veiligheidsplan", "Consent, boundaries and safety plan")}</li>
        <li><Check/>{t("Pauze, PASS, STOP en aftercare", "Pause, PASS, STOP and aftercare")}</li>
        <li><Check/>{t("Dagelijks Daily After Hours-ritueel", "Daily After Hours ritual")}</li>
        <li><Check/>{t("Basisinzichten en een kennismakingservaring", "Core insights and an introductory experience")}</li>
      </ul>
      <button className="monetization-button secondary" onClick={onStartFree}>{t("Start gratis", "Start free")}</button>
    </section>
    <div className="monetization-products">
      <section className="monetization-product">
        <div className="monetization-card-top"><span className="eyebrow">{t("LOSSE AANKOOP", "ONE-TIME PURCHASE")}</span><span className="monetization-price">€9,99</span></div>
        <h2>Single Experience</h2>
        <p>{t("Eén premium interactieve ervaring. Eenmalig betalen, zonder terugkerende kosten.", "One premium interactive experience. Pay once, with no recurring charges.")}</p>
        <ul>
          <li><Check/>{t("Eén gekozen premium game", "One selected premium game")}</li>
          <li><Check/>{t("Rondes, timer en voortgang", "Rounds, timer and progress")}</li>
          <li><Check/>{t("Consent en aftercare inbegrepen", "Consent and aftercare included")}</li>
        </ul>
        <button className="monetization-button" onClick={() => markInterest("single")}>{interest.includes("single") ? t("Interesse bewaard ✓", "Interest saved ✓") : t("Bewaar interesse", "Save interest")}</button>
      </section>
      <section className="monetization-product featured">
        <div className="monetization-ribbon">{t("MEEST VOORDELIG", "BEST VALUE")}</div>
        <div className="monetization-card-top"><span className="eyebrow">THE 3-GAME COLLECTION</span><span className="monetization-price">€24,99</span></div>
        <h2>The 3-Game Collection</h2>
        <p>{t("Drie premium games voor één vaste prijs. Bespaar €4,98 ten opzichte van drie losse aankopen.", "Three premium games for one fixed price. Save €4.98 compared with three separate purchases.")}</p>
        <ul>
          <li><Check/>{t("Drie gekozen premium games", "Three selected premium games")}</li>
          <li><Check/>{t("Meer variatie voor een lagere prijs per game", "More variety at a lower price per game")}</li>
          <li><Check/>{t("Geen abonnement of automatische verlenging", "No subscription or automatic renewal")}</li>
        </ul>
        <button className="monetization-button" onClick={() => markInterest("collection")}>{interest.includes("collection") ? t("Interesse bewaard ✓", "Interest saved ✓") : t("Bewaar interesse", "Save interest")}</button>
      </section>
    </div>
    <section className="club-membership">
      <div className="club-membership-heading"><span className="eyebrow"><Sparkles size={13}/> AFTER HOURS · CLUB</span><h2>{t("Blijf terugkomen. Op jouw tempo.","A reason to return. At your pace.")}</h2><p>{t("Voorstel voor terugkerend lidmaatschap. De prijzen en benefits hieronder zijn nog niet actief en worden pas verkocht zodra de provider, inhoud en abonnementsbeheer klaar zijn.","Proposed recurring membership. Prices and benefits below are not active; sales begin only after the provider, content and subscription management are ready.")}</p></div>
      <div className="club-membership-grid">
        <article className="club-membership-card">
          <span className="eyebrow">{t("MAANDELIJK · VOORSTEL","MONTHLY · PROPOSED")}</span>
          <h3>AFTER HOURS Club</h3>
          <div className="club-price">€8,99 <small>/ {t("maand","month")}</small></div>
          <p>{t("Voor wie dagelijks iets nieuws wil ontdekken, zonder een game per keer te kopen.","For people who want something new to explore daily, without buying each game separately.")}</p>
          <ul>
            <li><Check size={14}/>{t("Dagelijks ritueel en wekelijkse themadrops","Daily ritual and weekly themed drops")}</li>
            <li><Check size={14}/>{t("Uitgebreide Tarot/Oracle- en reflectiecollecties","Expanded Tarot/Oracle and reflection collections")}</li>
            <li><Check size={14}/>{t("Club-archief en extra AH-frame/cosmetische collecties wanneer die beschikbaar zijn","Club archive and extra AH frame/cosmetic collections when available")}</li>
          </ul>
          <button className="monetization-button" onClick={()=>markInterest("club-monthly")}>{interest.includes("club-monthly")?t("Interesse bewaard ✓","Interest saved ✓"):t("Bewaar interesse","Register interest")}</button>
        </article>
        <article className="club-membership-card annual">
          <span className="eyebrow">{t("JAARLIJKS · VOORSTEL","YEARLY · PROPOSED")}</span>
          <h3>AFTER HOURS Club · Annual</h3>
          <div className="club-price">€79,99 <small>/ {t("jaar","year")}</small></div>
          <p>{t("Een lagere prijs per maand voor leden die bewust voor een jaar kiezen.","A lower monthly equivalent for members who deliberately choose a yearly plan.")}</p>
          <div className="club-saving">{t("Circa 26% lager dan 12 losse maandbetalingen","About 26% below 12 separate monthly payments")}</div>
          <ul>
            <li><Check size={14}/>{t("Alle beoogde Club-voordelen","All planned Club benefits")}</li>
            <li><Check size={14}/>{t("Transparante verlenging en eenvoudige opzegging vereist","Transparent renewal and simple cancellation required")}</li>
          </ul>
          <button className="monetization-button" onClick={()=>markInterest("club-annual")}>{interest.includes("club-annual")?t("Interesse bewaard ✓","Interest saved ✓"):t("Bewaar interesse","Register interest")}</button>
        </article>
      </div>
      <p className="club-membership-disclaimer"><CalendarDays size={14}/>{t("Dit zijn prijsvoorstellen, geen actief aanbod. De knop bewaart alleen lokale interesse; er start geen betaling of abonnement. De dagelijkse ritualen, consent, PAUSE, PASS, STOP en aftercare blijven gratis.","These are pricing proposals, not an active offer. The button only saves local interest; it does not start a payment or subscription. Daily rituals, consent, PAUSE, PASS, STOP and aftercare remain free.")}</p>
    </section>
    {notice && <p className="monetization-notice" role="status">{notice}</p>}
    <section className="monetization-trust"><LockKeyhole/><div><strong>{t("Veiligheid is nooit premium-only.", "Safety is never premium-only.")}</strong><p>{t("De betaalstroom staat nog niet aan. Deze knoppen registreren alleen lokaal interesse en rekenen niets af. Voor echte betalingen is eerst een server-side checkout nodig bij een provider die volwassen BDSM-gerelateerde digitale content uitdrukkelijk toestaat.", "Checkout is not live yet. These buttons only record local interest and charge nothing. Real payments require a server-side checkout with a provider that explicitly permits adult BDSM-related digital content.")}</p></div></section>
    <button className="back monetization-back" onClick={onBack}>← {t("Terug naar AFTER HOURS", "Back to AFTER HOURS")}</button>
  </main>;
}
