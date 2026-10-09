import React, { useEffect, useState } from "react";
import { Award, LockKeyhole, Sparkles } from "lucide-react";
import { achievementEventName, badgeCatalog, listEarnedBadges } from "./achievements";

export default function BadgeShowcase() {
  const [earned, setEarned] = useState(listEarnedBadges);
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
    <div className="badge-showcase-heading"><Award/><div><span className="eyebrow">YOUR COLLECTION</span><h3 id="badge-showcase-title">Badges & milestones</h3></div><strong>{uniqueEarned.size}/{badgeCatalog.length}</strong></div>
    <p className="badge-showcase-intro">Verdien badges door de app te ontdekken, je grenzen bewust te checken en ervaringen af te ronden. Geen badge is belangrijker dan je comfort of consent.</p>
    <div className="badge-grid">{badgeCatalog.map((badge) => {
      const unlocked = uniqueEarned.has(badge.id);
      return <article className={`badge-tile ${unlocked ? "is-earned" : "is-locked"}`} key={badge.id}>
        <div className="badge-symbol">{unlocked ? badge.icon : <LockKeyhole/>}</div>
        <div className="badge-copy"><strong>{badge.title}</strong><span>{unlocked ? badge.description : "Nog te ontgrendelen"}</span></div>
        {unlocked && <Sparkles className="badge-earned-mark"/>}
      </article>;
    })}</div>
    <p className="badge-showcase-footnote">Lokaal opgeslagen op dit apparaat. Daily Orbit ontgrendeld: {dailyVisits} {dailyVisits === 1 ? "dag" : "dagen"}. Badges worden op dit moment niet tussen apparaten gesynchroniseerd.</p>
  </section>;
}
