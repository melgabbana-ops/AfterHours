import React, { useState } from "react";
import { Check, LockKeyhole, Save, Trash2 } from "lucide-react";

const STORAGE_KEY = "afterhours.safety-plan.v1";

interface SafetyPlanData {
  safeword: string;
  amberSignal: string;
  boundaries: string;
}

interface SafetyPlanProps {
  language?: "nl" | "en";
}

const emptyPlan: SafetyPlanData = { safeword: "", amberSignal: "", boundaries: "" };

function loadPlan(): SafetyPlanData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPlan;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return emptyPlan;
    const plan = value as Partial<SafetyPlanData>;
    return {
      safeword: typeof plan.safeword === "string" ? plan.safeword.slice(0, 80) : "",
      amberSignal: typeof plan.amberSignal === "string" ? plan.amberSignal.slice(0, 80) : "",
      boundaries: typeof plan.boundaries === "string" ? plan.boundaries.slice(0, 1000) : "",
    };
  } catch {
    return emptyPlan;
  }
}

export default function SafetyPlan({ language = "nl" }: SafetyPlanProps) {
  const [plan, setPlan] = useState<SafetyPlanData>(loadPlan);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const t = (nl: string, en: string) => language === "nl" ? nl : en;

  const update = (field: keyof SafetyPlanData, value: string) => {
    setPlan((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setMessage("");
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        safeword: plan.safeword.trim().slice(0, 80),
        amberSignal: plan.amberSignal.trim().slice(0, 80),
        boundaries: plan.boundaries.trim().slice(0, 1000),
      }));
      setPlan((current) => ({
        safeword: current.safeword.trim().slice(0, 80),
        amberSignal: current.amberSignal.trim().slice(0, 80),
        boundaries: current.boundaries.trim().slice(0, 1000),
      }));
      setSaved(true);
      setMessage(t("Veiligheidsafspraken opgeslagen op dit apparaat.", "Safety agreements saved on this device."));
    } catch {
      setSaved(false);
      setMessage(t("Opslaan is niet gelukt. Controleer de opslagruimte van je browser.", "Saving failed. Check your browser storage."));
    }
  };

  const clear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPlan(emptyPlan);
      setSaved(false);
      setMessage(t("Lokale veiligheidsafspraken verwijderd.", "Local safety agreements deleted."));
    } catch {
      setMessage(t("Verwijderen is niet gelukt. Probeer het opnieuw via je browserinstellingen.", "Could not delete the plan. Try again through your browser settings."));
    }
  };

  return <section className="safety-plan" aria-labelledby="safety-plan-title">
    <div className="safety-plan-heading"><LockKeyhole/><div><span className="eyebrow">{t("PRIVÉ · OP DIT APPARAAT", "PRIVATE · ON THIS DEVICE")}</span><h3 id="safety-plan-title">{t("Jouw veiligheidsplan", "Your safety plan")}</h3></div></div>
    <p className="safety-plan-intro">{t("Leg vooraf vast welke signalen je wilt gebruiken. Deze notities blijven lokaal in deze browser en worden niet naar AFTER HOURS-servers gesynchroniseerd.", "Set out the signals you want to use before you begin. These notes stay in this browser and are not synced to AFTER HOURS servers.")}</p>
    <label htmlFor="ah-safeword">{t("Stopwoord", "Safeword")} <span>{t("Volledig stoppen", "Stop completely")}</span></label>
    <input id="ah-safeword" maxLength={80} value={plan.safeword} onChange={(event) => update("safeword", event.target.value)} placeholder={t("Bijvoorbeeld: ROOD", "For example: RED")}/>
    <label htmlFor="ah-amber-signal">{t("Pauze- of bijstuurwoord", "Pause or slow-down signal")} <span>{t("Even vertragen en afstemmen", "Slow down and check in")}</span></label>
    <input id="ah-amber-signal" maxLength={80} value={plan.amberSignal} onChange={(event) => update("amberSignal", event.target.value)} placeholder={t("Bijvoorbeeld: ORANJE", "For example: AMBER")}/>
    <label htmlFor="ah-boundaries">{t("Grenzen en afspraken", "Boundaries and agreements")} <span>{t("Bewaar alleen wat veilig voelt op dit apparaat.", "Only save what feels safe to keep on this device.")}</span></label>
    <textarea id="ah-boundaries" maxLength={1000} rows={3} value={plan.boundaries} onChange={(event) => update("boundaries", event.target.value)} placeholder={t("Wat is niet welkom? Wat vraagt eerst een check-in? Wat helpt bij aftercare?", "What is not welcome? What needs a check-in first? What helps with aftercare?")}/>
    <div className="safety-plan-actions"><button className="gold" onClick={save}><Save/>{saved ? " " + t("Opgeslagen", "Saved") : " " + t("Afspraken opslaan", "Save agreements")}</button><button onClick={clear}><Trash2/> {t("Wissen", "Clear")}</button></div>
    {message && <p className="safety-plan-message" role="status">{saved && <Check/>}{message}</p>}
    <p className="safety-plan-footnote">{t("Een stopwoord vervangt geen communicatie. Je mag altijd stoppen, ook zonder het afgesproken woord te gebruiken.", "A safeword does not replace communication. You can always stop, even without using the agreed word.")}</p>
  </section>;
}
