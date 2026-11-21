import { useEffect, useState } from "react";
import { CheckCircle2, Play, ShieldCheck, Square, Users } from "lucide-react";
import { bothLocalParticipantsReady, type LocalCouplesSignal } from "./sessionModes";

type Language = "nl" | "en";
type Stage = "setup" | "active" | "paused" | "complete" | "stopped";

type Props = {
  language: Language;
  consentActive: boolean;
  onSafetyPause: () => void;
  onSafetyResume: () => void;
  onSafetyStop: () => void;
};

const SCENES = {
  connection: {
    title: "Samen afstemmen",
    description: "Een rustige start met aandacht voor wensen, grenzen en wederzijds vertrouwen.",
    steps: [
      "Neem samen een moment om aan te komen. Vertel allebei wat vandaag prettig voelt en wat je nodig hebt.",
      "Bespreek harde grenzen, zachte grenzen en wat vandaag buiten de ervaring blijft.",
      "Kies samen één kleine, vooraf besproken opdracht. Vraag opnieuw om een duidelijk ja voordat je verdergaat.",
      "Rond bewust af. Deel wat fijn voelde en welke aftercare nu welkom is."
    ],
    titleEn: "Connect & check in",
    descriptionEn: "A gentle start focused on wishes, boundaries and mutual trust.",
    stepsEn: [
      "Take a moment to arrive together. Each of you can share what feels good today and what you need.",
      "Discuss hard limits, soft limits and what is off the table today.",
      "Choose one small, previously discussed activity. Ask for a clear yes again before continuing.",
      "Close deliberately. Share what felt good and what aftercare would help now."
    ]
  },
  ritual: {
    title: "Ritueel voor twee",
    description: "Een gezamenlijke route waarin jullie om beurten kiezen, leiden en afstemmen.",
    steps: [
      "Spreek af wie deze ronde de leiding neemt. Rollen blijven vrijwillig en mogen op elk moment wisselen.",
      "Noem allebei één wens en één grens voor deze ronde.",
      "Kies samen een veilige, symbolische opdracht die voor beiden goed voelt.",
      "Wissel van rol of rond af. Vraag wat de ander nodig heeft."
    ],
    titleEn: "A ritual for two",
    descriptionEn: "A shared path where you take turns choosing, leading and checking in.",
    stepsEn: [
      "Agree who leads this round. Roles are voluntary and can change at any time.",
      "Each of you names one wish and one boundary for this round.",
      "Choose a safe, symbolic activity that feels right for both of you.",
      "Switch roles or close the scene. Ask what the other person needs."
    ]
  },
  aftercare: {
    title: "Aftercare samen",
    description: "Een zachte gezamenlijke afsluiting met ruimte voor herstel en verbinding.",
    steps: [
      "Stop de activiteit bewust en neem samen rustig de tijd om te landen.",
      "Vraag elkaar wat nu helpt: water, warmte, stilte, praten of juist ruimte.",
      "Deel één ding dat goed voelde. Luister zonder te corrigeren of te verdedigen.",
      "Spreek af hoe en wanneer jullie later nog even bij elkaar inchecken."
    ],
    titleEn: "Aftercare together",
    descriptionEn: "A gentle shared close with room for recovery and connection.",
    stepsEn: [
      "Deliberately end the activity and take a moment to settle together.",
      "Ask what would help now: water, warmth, quiet, conversation or some space.",
      "Each share one thing that felt good. Listen without correcting or defending.",
      "Agree how and when you will check in with each other later."
    ]
  }
} as const;

export default function LocalCouplesMode({ language, consentActive, onSafetyPause, onSafetyResume, onSafetyStop }: Props) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const [sceneKey, setSceneKey] = useState<keyof typeof SCENES>("connection");
  const [names, setNames] = useState([t("Deelnemer 1", "Participant 1"), t("Deelnemer 2", "Participant 2")]);
  const [consents, setConsents] = useState([false, false]);
  const [stage, setStage] = useState<Stage>("setup");
  const [step, setStep] = useState(0);
  const [signals, setSignals] = useState<[LocalCouplesSignal, LocalCouplesSignal]>(["unset", "unset"]);
  const [notice, setNotice] = useState("");
  const scene = SCENES[sceneKey];
  const title = language === "nl" ? scene.title : scene.titleEn;
  const description = language === "nl" ? scene.description : scene.descriptionEn;
  const steps = language === "nl" ? scene.steps : scene.stepsEn;
  const ready = consentActive && consents.every(Boolean);

  useEffect(() => {
    if (consentActive || (stage !== "active" && stage !== "paused")) return;
    setStage("stopped");
    setSignals(["red", "red"]);
    setNotice(t("Toestemming is ingetrokken. De gezamenlijke route is direct beëindigd.", "Consent was withdrawn. The shared path has ended immediately."));
    onSafetyStop();
  }, [consentActive, stage, onSafetyStop]);
  function setSignal(index: 0 | 1, value: LocalCouplesSignal) {
    const next: [LocalCouplesSignal, LocalCouplesSignal] = [...signals];
    next[index] = value;
    setSignals(next);
    if (value === "red") {
      setStage("stopped");
      setNotice(t("STOP gekozen. De lokale ervaring is direct beëindigd.", "STOP selected. The local experience has ended immediately."));
      onSafetyStop();
      return;
    }
    if (value === "yellow") {
      setStage("paused");
      onSafetyPause();
      setNotice(t("PAUZE gekozen. Neem de tijd en stem opnieuw af. Hervatten kan alleen als jullie allebei groen aangeven.", "PAUSE selected. Take your time and check in. Resume only when both of you choose green."));
      return;
    }
    if (next.every((signal) => signal === "green")) {
      if (stage === "paused") {
        onSafetyResume();
        setNotice(t("Jullie hebben allebei opnieuw groen aangegeven.", "Both of you have chosen green again."));
      } else setNotice(t("Jullie hebben allebei groen aangegeven.", "Both of you have chosen green."));
      setStage("active");
    }
  }

  function advance() {
    if (!bothLocalParticipantsReady(signals)) return;
    if (step + 1 >= steps.length) {
      setStage("complete");
      setNotice(t("De gezamenlijke route is afgerond. Neem rustig de tijd voor aftercare.", "Your shared path is complete. Take your time for aftercare."));
      return;
    }
    setStep((current) => current + 1);
    setSignals(["unset", "unset"]);
    setStage("active");
    setNotice("");
  }

  function passStep() {
    if (stage !== "active" || !bothLocalParticipantsReady(signals)) return;
    if (step + 1 >= steps.length) {
      setStage("complete");
      setNotice(t("Jullie hebben de laatste stap overgeslagen en de route afgerond.", "You skipped the final step and completed the route."));
      return;
    }
    setStep((current) => current + 1);
    setSignals(["unset", "unset"]);
    setNotice(t("Stap overgeslagen. Geen uitleg nodig.", "Step skipped. No explanation needed."));
  }

  function stop() {
    setStage("stopped");
    setSignals(["red", "red"]);
    setNotice(t("De lokale ervaring is beëindigd. Er is niets opgeslagen.", "The local experience has ended. Nothing was saved."));
    onSafetyStop();
  }

  function reset() {
    setStage("setup");
    setStep(0);
    setConsents([false, false]);
    setSignals(["unset", "unset"]);
    setNotice("");
  }

  return (
    <section className="cw-section cw-local-couples">
      <div className="cw-section-heading">
        <span className="cw-kicker">02 · PLAY TOGETHER · ONE DEVICE</span>
        <h2><Users /> {t("Samen op één toestel", "Together on one device")}</h2>
        <p>{t("Een lokale tweepersoonsmodus zonder accountkoppeling. Beide deelnemers geven afzonderlijk toestemming en checken per stap in.", "A local two-person mode without account linking. Each participant gives consent separately and checks in at every step.")}</p>
      </div>

      <div className="cw-local-note"><ShieldCheck size={18} /><span>{t("Deze modus werkt alleen op dit toestel. Er worden geen namen, keuzes of sessiegegevens opgeslagen of gedeeld. De app luistert niet naar gesproken stopwoorden: gebruik de STOP- en PAUZE-knoppen.", "This mode runs only on this device. Names, choices and session details are not saved or shared. Spoken safewords are not monitored: use the STOP and PAUSE buttons.")}</span></div>

      {stage === "setup" ? (
        <>
          <div className="cw-panel cw-local-panel">
            <h3>{t("Kies jullie gezamenlijke route", "Choose your shared path")}</h3>
            <div className="cw-local-scenes">
              {(Object.keys(SCENES) as Array<keyof typeof SCENES>).map((key) => (
                <button type="button" key={key} className={sceneKey === key ? "selected" : ""} aria-pressed={sceneKey === key} onClick={() => setSceneKey(key)}>
                  <strong>{language === "nl" ? SCENES[key].title : SCENES[key].titleEn}</strong>
                  <span>{language === "nl" ? SCENES[key].description : SCENES[key].descriptionEn}</span>
                </button>
              ))}
            </div>
            <div className="cw-local-participants">
              {[0, 1].map((index) => (
                <label key={index}>
                  <span>{t("Naam", "Name")} · {index + 1}</span>
                  <input value={names[index]} maxLength={24} onChange={(event) => setNames((current) => current.map((name, i) => i === index ? event.target.value : name))} />
                  <span className="cw-local-consent">
                    <input type="checkbox" checked={consents[index]} onChange={(event) => setConsents((current) => current.map((value, i) => i === index ? event.target.checked : value))} />
                    {t("Ik geef vrijwillig toestemming voor deze gezamenlijke route en kan op elk moment stoppen.", "I freely consent to this shared path and can stop at any time.")}
                  </span>
                </label>
              ))}
            </div>
            {!consentActive && <p className="cw-local-warning">{t("Bevestig eerst de algemene AFTER HOURS-consent voordat je start.", "Confirm general AFTER HOURS consent before starting.")}</p>}
            <button type="button" className="cw-primary" disabled={!ready} onClick={() => { setStage("active"); setStep(0); setSignals(["unset", "unset"]); setNotice(""); }}>
              <Play size={15} />{t("Start gezamenlijke route", "Start shared path")}
            </button>
          </div>
        </>
      ) : (
        <div className="cw-panel cw-local-panel">
          {stage === "active" || stage === "paused" ? (
            <>
              <div className="cw-local-progress"><span>{t("STAP", "STEP")} {step + 1} / {steps.length}</span><span>{title}</span></div>
              <div className="cw-local-step"><span className="cw-kicker">{t("SAMEN", "TOGETHER")}</span><p>{steps[step]}</p></div>
              <p className="cw-local-prompt">{t("Check allebei in voordat jullie verdergaan.", "Both participants check in before you continue.")}</p>
              <div className="cw-local-checkins">
                {[0, 1].map((index) => (
                  <div className="cw-local-checkin" key={index}>
                    <strong>{names[index].trim() || t("Deelnemer", "Participant")} · {t("jouw check-in", "your check-in")}</strong>
                    <div>
                      <button type="button" className={signals[index] === "green" ? "chosen green" : ""} onClick={() => setSignal(index as 0 | 1, "green")} disabled={stage === "paused" && signals.some((signal) => signal === "red")}>{t("Groen", "Green")}</button>
                      <button type="button" className={signals[index] === "yellow" ? "chosen yellow" : ""} onClick={() => setSignal(index as 0 | 1, "yellow")}>{t("Pauze", "Pause")}</button>
                      <button type="button" className={signals[index] === "red" ? "chosen red" : ""} onClick={() => setSignal(index as 0 | 1, "red")}>{t("STOP", "STOP")}</button>
                    </div>
                  </div>
                ))}
              </div>
              {notice && <p className="cw-local-status" role="status" aria-live="polite">{notice}</p>}
              {stage === "paused" && <p className="cw-local-warning">{t("De route staat stil. Hervatten kan pas als beide deelnemers opnieuw groen kiezen.", "The path is paused. Resume only after both participants choose green again.")}</p>}
              <div className="cw-local-actions">
                <button type="button" className="cw-primary" disabled={!bothLocalParticipantsReady(signals)} onClick={advance}><CheckCircle2 size={15} />{t("Verder", "Continue")}</button>
                <button type="button" onClick={passStep} disabled={stage !== "active" || !bothLocalParticipantsReady(signals)}>{t("Sla deze stap over", "Pass this step")}</button>
                <button type="button" className="cw-danger" onClick={stop}><Square size={14} />{t("Beëindig direct", "Stop now")}</button>
              </div>
            </>
          ) : (
            <>
              <div className="cw-local-finish">
                {stage === "complete" ? <CheckCircle2 /> : <ShieldCheck />}
                <h3>{stage === "complete" ? t("Route afgerond", "Path complete") : t("Route beëindigd", "Path stopped")}</h3>
                <p>{notice || t("Neem rustig de tijd om na te praten of ruimte te nemen.", "Take time to talk or have some space.")}</p>
              </div>
              <button type="button" className="cw-primary" onClick={reset}>{t("Nieuwe gezamenlijke route", "New shared path")}</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
