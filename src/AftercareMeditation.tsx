import React, { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import {
  AFTERCARE_MEDITATION_DURATION_SECONDS,
  AFTERCARE_MEDITATION_PHASES,
  formatAftercareMeditationTime,
  getAftercareMeditationPhase,
  getAftercareMeditationProgressPercent,
  getAftercareMeditationRemainingSeconds,
} from "./aftercareMeditation";
import "./AftercareMeditation.css";

type Language = "nl" | "en";

export default function AftercareMeditation({ language }: { language: Language }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const completed = elapsedSeconds >= AFTERCARE_MEDITATION_DURATION_SECONDS;
  const remainingSeconds = getAftercareMeditationRemainingSeconds(elapsedSeconds);
  const progress = getAftercareMeditationProgressPercent(elapsedSeconds);
  const phase = getAftercareMeditationPhase(elapsedSeconds);
  const phaseNumber = AFTERCARE_MEDITATION_PHASES.findIndex((item) => item.id === phase.id) + 1;

  useEffect(() => {
    if (!running || startedAt === null) return;
    const updateElapsed = () => {
      const elapsed = Math.min(
        AFTERCARE_MEDITATION_DURATION_SECONDS,
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
      setElapsedSeconds(elapsed);
      if (elapsed >= AFTERCARE_MEDITATION_DURATION_SECONDS) setRunning(false);
    };
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    document.addEventListener("visibilitychange", updateElapsed);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateElapsed);
    };
  }, [running, startedAt]);

  const start = () => {
    const elapsed = completed ? 0 : elapsedSeconds;
    setElapsedSeconds(elapsed);
    setStartedAt(Date.now() - elapsed * 1000);
    setMessage("");
    setRunning(true);
  };

  const pause = () => {
    if (startedAt !== null) {
      const elapsed = Math.min(
        AFTERCARE_MEDITATION_DURATION_SECONDS,
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
      setElapsedSeconds(elapsed);
    }
    setRunning(false);
    setStartedAt(null);
  };

  const end = () => {
    setRunning(false);
    setStartedAt(null);
    setElapsedSeconds(0);
    setMessage(t("Meditatie beëindigd. Je kunt rustig verdergaan.", "Meditation ended. You can continue at your own pace."));
  };

  const phaseTitle = language === "nl" ? phase.titleNl : phase.titleEn;
  const phaseInstruction = language === "nl" ? phase.instructionNl : phase.instructionEn;

  return (
    <section className="aftercare-meditation" aria-labelledby="aftercare-meditation-title">
      <div className="aftercare-meditation-heading">
        <Timer aria-hidden="true" />
        <div>
          <span className="eyebrow">AFTER HOURS · OPTIONAL PRACTICE</span>
          <h3 id="aftercare-meditation-title">{t("Begeleide meditatie · 30 minuten", "Guided meditation · 30 minutes")}</h3>
          <p>{t("Zes rustige stappen van vijf minuten. Je bepaalt zelf het tempo.", "Six gentle five-minute stages. You choose your own pace.")}</p>
        </div>
      </div>

      <div className="aftercare-meditation-clock">
        <time>{formatAftercareMeditationTime(remainingSeconds)}</time>
        <span>{t("resterend", "remaining")}</span>
      </div>

      <div
        className="aftercare-meditation-progress"
        role="progressbar"
        aria-label={t("Voortgang meditatie", "Meditation progress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: progress + "%" }} />
      </div>

      <div className="aftercare-meditation-phase">
        <div className="aftercare-meditation-phase-meta">
          <span>{t("Stap", "Stage")} {phaseNumber} / {AFTERCARE_MEDITATION_PHASES.length}</span>
          <span>{phaseTitle}</span>
        </div>
        <h4>{completed ? t("Goed geland", "Gently completed") : phaseTitle}</h4>
        <p role="status" aria-live="polite">
          {completed
            ? t("De 30 minuten zijn voorbij. Neem rustig de tijd om terug te keren en kies wat je nu nodig hebt.", "The 30 minutes are complete. Take your time returning and choose what you need next.")
            : phaseInstruction}
        </p>
      </div>

      <div className="aftercare-meditation-actions">
        {!running && (
          <button type="button" className="gold" onClick={start}>
            {completed ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
            {completed ? t("Opnieuw beginnen", "Start again") : elapsedSeconds > 0 ? t("Verdergaan", "Resume") : t("Start meditatie", "Start meditation")}
          </button>
        )}
        {running && (
          <button type="button" className="gold" onClick={pause}>
            <Pause aria-hidden="true" />{t("Pauzeren", "Pause")}
          </button>
        )}
        {(running || elapsedSeconds > 0) && (
          <button type="button" className="aftercare-meditation-end" onClick={end}>
            {t("Beëindig meditatie", "End meditation")}
          </button>
        )}
      </div>

      <p className="aftercare-meditation-disclaimer">
        {t(
          "Optioneel en geen therapie. Forceer of houd je adem niet vast. Als een onderdeel niet prettig voelt, sla het over, pauzeer of beëindig de oefening. De timer telt door als je browser op de achtergrond staat, maar wordt niet bewaard na vernieuwen of sluiten.",
          "Optional and not therapy. Do not force or hold your breath. If any part feels uncomfortable, skip it, pause or end the practice. The timer continues while your browser is in the background, but is not saved after reload or closing.",
        )}
      </p>
      {message && <p className="aftercare-meditation-message" role="status">{message}</p>}
    </section>
  );
}
