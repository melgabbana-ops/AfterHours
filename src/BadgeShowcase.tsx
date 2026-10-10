import React, { useEffect, useState } from "react";
import { Award, LockKeyhole, Sparkles } from "lucide-react";
import { achievementEventName, badgeCatalog, listEarnedBadges } from "./achievements";

export default function BadgeShowcase() {
  const language = (() => { try { return localStorage.getItem("afterhours.language") === "en" ? "en" : "nl"; } catch { return "nl"; } })();
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const [earned, setEarned] = useState(listEarnedBadges);
  const badgeCopy: Record<string, {description: string}> = {
    first_login: {description: "Your first secure sign-in."},
    sky_watcher: {description: "You explored your astrology reflection."},
    daily_orbit: {description: "You opened today's star reflection."},
    consent_first: {description: "You confirmed the consent check."},
    first_session: {description: "You completed your first session."},
    three_sessions: {description: "You completed three sessions."},
    first_prompt: {description: "You marked your first prompt as done."}
  };
  useEffect(() => {
    const refresh = () => setEarned(listEarnedBadges());
    window.addEventListener(achievementEventName(), refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(achievementEventName(), refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const uniqueEarned = new Set(earned.map((badge) => badge.id));
  const dailyVisits = earned.filter((badge) => badge.id === "daily_orbit").length;

  return <section className="badge-showcase" aria-labelledby="badge-showcase-title">
    <div className="badge-showcase-heading"><Award/><div><span className="eyebrow">YOUR COLLECTION</span><h3 id="badge-showcase-title">{t("Badges & mijlpalen","Badges & milestones")}</h3></div><strong>{uniqueEarned.size}/{badgeCatalog.length}</strong></div>
    <p className="badge-showcase-intro">{t("Verdien badges door de app te ontdekken, je grenzen bewust te checken en ervaringen af te ronden. Geen badge is belangrijker dan je comfort of consent.","Earn badges by exploring the app, checking your boundaries, and completing experiences. No badge matters more than your comfort or consent.")}</p>
    <div className="badge-grid">{badgeCatalog.map((badge) => {
      const unlocked = uniqueEarned.has(badge.id);
      return <article className={`badge-tile ${unlocked ? "is-earned" : "is-locked"}`} key={badge.id}>
        <div className="badge-symbol">{unlocked ? badge.icon : <LockKeyhole/>}</div>
        <div className="badge-copy"><strong>{badge.title}</strong><span>{unlocked ? (language === "en" ? badgeCopy[badge.id]?.description ?? badge.description : badge.description) : t("Nog te ontgrendelen","Still locked")}</span></div>
        {unlocked && <Sparkles className="badge-earned-mark"/>}
      </article>;
    })}</div>
    <p className="badge-showcase-footnote">{t("Lokaal opgeslagen op dit apparaat. Daily Orbit ontgrendeld:","Stored locally on this device. Daily Orbit unlocked:")} {dailyVisits} {dailyVisits === 1 ? t("dag","day") : t("dagen","days")}. {t("Badges worden op dit moment niet tussen apparaten gesynchroniseerd.","Badges are not currently synced between devices.")}</p>
  </section>;
}
