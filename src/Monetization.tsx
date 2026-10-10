import React, { useState } from "react";
import { Check, LockKeyhole, ShoppingBag } from "lucide-react";

type Language = "nl" | "en";
type PackageId = "single" | "collection";
const interestKey = "afterhours.purchase-interest.v1";
function readInterest(): PackageId[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(interestKey) || "[]");
    return Array.isArray(value) ? value.filter((item): item is PackageId => item === "single" || item === "collection") : [];
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
      <p>{t("Begin gratis. Kies later alleen wat bij je past. Geen verplicht abonnement, geen advertenties en geen betaalmuur rond veiligheid.", "Start free. Buy only what suits you later. No required subscription, no ads, and no paywall around safety.")}</p>
    </header>
    <section className="monetization-free">
      <div className="monetization-card-top"><span className="eyebrow">{t("ALTIJD GRATIS", "ALWAYS FREE")}</span><span className="monetization-price">€0</span></div>
      <h2>Free Access</h2>
      <p>{t("Een veilige kennismaking met AFTER HOURS.", "A safe introduction to AFTER HOURS.")}</p>
      <ul>
        <li><Check/>{t("Account en persoonlijk profiel", "Account and personal profile")}</li>
        <li><Check/>{t("Consent, grenzen en veiligheidsplan", "Consent, boundaries and safety plan")}</li>
        <li><Check/>{t("Pauze, PASS, STOP en aftercare", "Pause, PASS, STOP and aftercare")}</li>
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
    {notice && <p className="monetization-notice" role="status">{notice}</p>}
    <section className="monetization-trust"><LockKeyhole/><div><strong>{t("Veiligheid is nooit premium-only.", "Safety is never premium-only.")}</strong><p>{t("De betaalstroom staat nog niet aan. Deze knoppen registreren alleen lokaal interesse en rekenen niets af. Voor echte betalingen is eerst een server-side checkout nodig bij een provider die volwassen BDSM-gerelateerde digitale content uitdrukkelijk toestaat.", "Checkout is not live yet. These buttons only record local interest and charge nothing. Real payments require a server-side checkout with a provider that explicitly permits adult BDSM-related digital content.")}</p></div></section>
    <button className="back monetization-back" onClick={onBack}>← {t("Terug naar AFTER HOURS", "Back to AFTER HOURS")}</button>
  </main>;
}
