import React, { useState } from "react";
import { Check, LockKeyhole, Save, Trash2 } from "lucide-react";

const STORAGE_KEY = "afterhours.safety-plan.v1";

interface SafetyPlanData {
  safeword: string;
  amberSignal: string;
  boundaries: string;
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

export default function SafetyPlan() {
  const [plan, setPlan] = useState<SafetyPlanData>(loadPlan);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

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
      setMessage("Veiligheidsafspraken opgeslagen op dit apparaat.");
    } catch {
      setSaved(false);
      setMessage("Opslaan is niet gelukt. Controleer de opslagruimte van je browser.");
    }
  };

  const clear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPlan(emptyPlan);
      setSaved(false);
      setMessage("Lokale veiligheidsafspraken verwijderd.");
    } catch {
      setMessage("Verwijderen is niet gelukt. Probeer het opnieuw via je browserinstellingen.");
    }
  };

  return <section className="safety-plan" aria-labelledby="safety-plan-title">
    <div className="safety-plan-heading"><LockKeyhole/><div><span className="eyebrow">PRIVATE · ON THIS DEVICE</span><h3 id="safety-plan-title">Jullie veiligheidsplan</h3></div></div>
    <p className="safety-plan-intro">Spreek signalen samen af vóór je begint. Deze notities blijven lokaal in deze browser en worden niet naar AFTER HOURS-servers gesynchroniseerd.</p>
    <label htmlFor="ah-safeword">Stopwoord <span>Volledig stoppen</span></label>
    <input id="ah-safeword" maxLength={80} value={plan.safeword} onChange={(event) => update("safeword", event.target.value)} placeholder="Bijvoorbeeld: ROOD"/>
    <label htmlFor="ah-amber-signal">Pauze- of bijstuurwoord <span>Even vertragen en afstemmen</span></label>
    <input id="ah-amber-signal" maxLength={80} value={plan.amberSignal} onChange={(event) => update("amberSignal", event.target.value)} placeholder="Bijvoorbeeld: ORANJE"/>
    <label htmlFor="ah-boundaries">Grenzen en afspraken <span>Deel alleen wat veilig voelt om op dit apparaat te bewaren.</span></label>
    <textarea id="ah-boundaries" maxLength={1000} rows={3} value={plan.boundaries} onChange={(event) => update("boundaries", event.target.value)} placeholder="Wat is niet welkom? Wat vraagt eerst een check-in? Wat helpt bij aftercare?"/>
    <div className="safety-plan-actions"><button className="gold" onClick={save}><Save/>{saved ? " Opgeslagen" : " Afspraken opslaan"}</button><button onClick={clear}><Trash2/> Wissen</button></div>
    {message && <p className="safety-plan-message" role="status">{saved && <Check/>}{message}</p>}
    <p className="safety-plan-footnote">Een stopwoord is geen vervanging voor communicatie. Stoppen mag altijd, ook zonder het afgesproken woord te gebruiken.</p>
  </section>;
}
