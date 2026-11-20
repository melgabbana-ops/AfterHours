import React, { useState } from "react";
import { Check, LockKeyhole, Pause, Play, Save, Square, Trash2 } from "lucide-react";
interface SafetyPlanProps {
  profileId: string;
  language?: "nl" | "en";
  sessionStatus?: "ready" | "active" | "paused" | "completed" | "stopped";
  onPause?: () => void;
  onResume?: () => void;
  onStopNow?: () => void;
}

import {
  clearSafetyPlan,
  createEmptySafetyPlan,
  hasUnscopedSafetyPlan,
  readSafetyPlan,
  writeSafetyPlan,
  type ReadinessChecks,
  type SafetyPlanData,
} from "./safetyPlanStorage";

export default function SafetyPlan({
  profileId,
  language = "nl",
  sessionStatus = "ready",
  onPause,
  onResume,
  onStopNow,
}: SafetyPlanProps) {
  const [plan, setPlan] = useState<SafetyPlanData>(() => readSafetyPlan(profileId));
  const [legacyPlanDetected, setLegacyPlanDetected] = useState(() => hasUnscopedSafetyPlan());
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const isSessionActive = sessionStatus === "active" || sessionStatus === "paused";
  const readinessCount = Object.values(plan.readiness).filter(Boolean).length;
  const statusLabel = ({
    ready: t("Gereed", "Ready"),
    active: t("Sessie loopt", "Session active"),
    paused: t("Sessie gepauzeerd", "Session paused"),
    completed: t("Sessie afgerond", "Session completed"),
    stopped: t("Sessie gestopt", "Session stopped"),
  })[sessionStatus];

  const update = (field: "safeword" | "amberSignal" | "boundaries", value: string) => {
    setPlan((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setMessage("");
  };

  const updateReadiness = (field: keyof ReadinessChecks, checked: boolean) => {
    setPlan((current) => ({
      ...current,
      readiness: { ...current.readiness, [field]: checked },
    }));
    setSaved(false);
    setMessage("");
  };

  const save = () => {
    const nextPlan: SafetyPlanData = {
      safeword: plan.safeword.trim().slice(0, 80),
      amberSignal: plan.amberSignal.trim().slice(0, 80),
      boundaries: plan.boundaries.trim().slice(0, 1000),
      readiness: { ...plan.readiness },
    };
    if (writeSafetyPlan(nextPlan, profileId)) {
      setPlan(nextPlan);
      setSaved(true);
      setLegacyPlanDetected(false);
      setMessage(t("Veiligheidsafspraken opgeslagen voor dit profiel op dit apparaat.", "Safety agreements saved for this profile on this device."));
    } else {
      setSaved(false);
      setMessage(t("Opslaan is niet gelukt. Controleer de opslagruimte van je browser.", "Saving failed. Check your browser storage."));
    }
  };

  const clear = () => {
    if (clearSafetyPlan(profileId)) {
      setPlan(createEmptySafetyPlan());
      setSaved(false);
      setMessage(t("Lokale veiligheidsafspraken verwijderd.", "Local safety agreements deleted."));
    } else {
      setMessage(t("Verwijderen is niet gelukt. Probeer het opnieuw via je browserinstellingen.", "Could not delete the plan. Try again through your browser settings."));
    }
  };

  return <section className="safety-plan" aria-labelledby="safety-plan-title">
    <div className="safety-plan-heading"><LockKeyhole/><div><span className="eyebrow">{t("PRIVÉ · OP DIT APPARAAT", "PRIVATE · ON THIS DEVICE")}</span><h3 id="safety-plan-title">{t("Jouw veiligheidsplan", "Your safety plan")}</h3></div></div>
    <p className="safety-plan-intro">{t("Leg vooraf vast welke signalen je wilt gebruiken. Deze notities blijven lokaal in deze browser en zijn apart per AFTER HOURS-profiel opgeslagen. Ze worden niet naar AFTER HOURS-servers gesynchroniseerd. Iedereen met toegang tot dit browserprofiel kan ze mogelijk bekijken. Gebruik dit daarom niet op een gedeeld apparaat en noteer geen namen of andere gevoelige details.", "Set out the signals you want to use before you begin. These notes stay in this browser and are stored separately for each AFTER HOURS profile. They are not synced to AFTER HOURS servers. Anyone with access to this browser profile may be able to view them. Do not use this on a shared device or include names or other sensitive details.")}</p>
    {legacyPlanDetected && <p className="safety-plan-footnote" role="status">{t("Een eerder opgeslagen veiligheidsplan had nog geen profielkoppeling. Omdat niet vaststaat bij welk profiel het hoort, is het niet automatisch overgezet of verwijderd. Voer je signalen opnieuw in voor dit profiel; de oude lokale gegevens zijn ongewijzigd gebleven.", "A safety plan from an earlier version had no profile link. Because its owner cannot be determined, it has not been imported or deleted. Re-enter your signals for this profile; the old local data remains unchanged.")}</p>}

    <section className="safety-room-panel" aria-labelledby="safety-room-title">
      <div className="safety-room-status">
        <div>
          <span className="eyebrow">{t("CONTROL ROOM · VEILIGHEID", "CONTROL ROOM · SAFETY")}</span>
          <h4 id="safety-room-title">{t("Check-in voor je start", "Check in before you start")}</h4>
        </div>
        <span className={"safety-room-pill safety-room-pill--" + sessionStatus} role="status" aria-live="polite"><i aria-hidden="true"/>{statusLabel}</span>
      </div>
      <p className="safety-room-summary">{t("Neem samen even de drie punten door. Deze checklist is een herinnering, geen digitale toestemming of vervanging van een gesprek.", "Review these three points together. This checklist is a reminder, not digital consent or a replacement for talking.")}</p>
      <div className="safety-readiness-meter" aria-label={t(readinessCount + " van 3 punten afgevinkt", readinessCount + " of 3 items checked")}>
        <div><span>{t("VOORBEREIDING", "PREPAREDNESS")}</span><strong>{readinessCount}/3</strong></div>
        <span className="safety-readiness-track"><i style={{ width: (readinessCount / 3 * 100) + "%" }}/></span>
      </div>
      <div className="safety-readiness-list">
        <label className="safety-readiness-item">
          <input type="checkbox" checked={plan.readiness.consentDiscussed} onChange={(event) => updateReadiness("consentDiscussed", event.target.checked)}/>
          <span><strong>{t("Vrijwillige toestemming is besproken", "Willing consent has been discussed")}</strong><small>{t("Iedereen mag van gedachten veranderen.", "Anyone can change their mind.")}</small></span>
          <i aria-hidden="true">{plan.readiness.consentDiscussed ? <Check/> : null}</i>
        </label>
        <label className="safety-readiness-item">
          <input type="checkbox" checked={plan.readiness.signalsDiscussed} onChange={(event) => updateReadiness("signalsDiscussed", event.target.checked)}/>
          <span><strong>{t("Stopwoord en pauzesignaal zijn helder", "Safeword and pause signal are clear")}</strong><small>{t("Stop betekent stoppen; pauze betekent direct afstemmen.", "Stop means stop; pause means check in now.")}</small></span>
          <i aria-hidden="true">{plan.readiness.signalsDiscussed ? <Check/> : null}</i>
        </label>
        <label className="safety-readiness-item">
          <input type="checkbox" checked={plan.readiness.aftercareDiscussed} onChange={(event) => updateReadiness("aftercareDiscussed", event.target.checked)}/>
          <span><strong>{t("Aftercare en grenzen zijn besproken", "Aftercare and boundaries are discussed")}</strong><small>{t("Spreek af wat rust of steun achteraf betekent.", "Agree what rest or support afterwards looks like.")}</small></span>
          <i aria-hidden="true">{plan.readiness.aftercareDiscussed ? <Check/> : null}</i>
        </label>
      </div>
      {isSessionActive ? <div className="safety-emergency-controls" aria-label={t("Directe sessiebediening", "Immediate session controls")}>
        {sessionStatus === "active"
          ? <button type="button" className="safety-pause-action" onClick={onPause} disabled={!onPause}><Pause size={16}/>{t("PAUZEER SESSIE", "PAUSE SESSION")}</button>
          : <button type="button" className="safety-pause-action" onClick={onResume} disabled={!onResume}><Play size={16}/>{t("HERVAT SESSIE", "RESUME SESSION")}</button>}
        <button type="button" className="safety-stop-action" onClick={onStopNow} disabled={!onStopNow}><Square size={16}/>{t("STOP NU", "STOP NOW")}</button>
      </div> : <p className="safety-room-footnote">{t("De directe pauze- en stopknoppen verschijnen hier zolang een sessie actief of gepauzeerd is.", "Immediate pause and stop controls appear here while a session is active or paused.")}</p>}
    </section>

    <label htmlFor="ah-safeword">{t("Stopwoord", "Safeword")} <span>{t("Volledig stoppen", "Stop completely")}</span></label>
    <input id="ah-safeword" maxLength={80} value={plan.safeword} onChange={(event) => update("safeword", event.target.value)} placeholder={t("Bijvoorbeeld: ROOD", "For example: RED")}/>
    <label htmlFor="ah-amber-signal">{t("Pauze- of bijstuurwoord", "Pause or slow-down signal")} <span>{t("Even vertragen en afstemmen", "Slow down and check in")}</span></label>
    <input id="ah-amber-signal" maxLength={80} value={plan.amberSignal} onChange={(event) => update("amberSignal", event.target.value)} placeholder={t("Bijvoorbeeld: ORANJE", "For example: AMBER")}/>
    <p className="safety-plan-footnote">{t("Wanneer je vrijwillig spraakbediening start, worden deze lokale signalen gebruikt voor STOP en PAUZE. Ze worden niet naar de server gestuurd.", "When you voluntarily start voice control, these local signals are used for STOP and PAUSE. They are not sent to the server.")}</p>
    <label htmlFor="ah-boundaries">{t("Grenzen en afspraken", "Boundaries and agreements")} <span>{t("Bewaar alleen wat veilig voelt op dit apparaat.", "Only save what feels safe to keep on this device.")}</span></label>
    <textarea id="ah-boundaries" maxLength={1000} rows={3} value={plan.boundaries} onChange={(event) => update("boundaries", event.target.value)} placeholder={t("Wat is niet welkom? Wat vraagt eerst een check-in? Wat helpt bij aftercare?", "What is not welcome? What needs a check-in first? What helps with aftercare?")}/>
    <div className="safety-plan-actions"><button className="gold" onClick={save}><Save/>{saved ? " " + t("Opgeslagen", "Saved") : " " + t("Afspraken opslaan", "Save agreements")}</button><button onClick={clear}><Trash2/> {t("Wissen", "Clear")}</button></div>
    {message && <p className="safety-plan-message" role="status">{saved && <Check/>}{message}</p>}
    <p className="safety-plan-footnote">{t("Een stopwoord vervangt geen communicatie. Je mag altijd stoppen, ook zonder het afgesproken woord te gebruiken.", "A safeword does not replace communication. You can always stop, even without using the agreed word.")}</p>
  </section>;
}
