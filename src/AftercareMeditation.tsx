import React, { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Timer } from "lucide-react";
import {
  AFTERCARE_MEDITATION_DURATION_SECONDS,
  AFTERCARE_MEDITATION_PHASES,
  formatAftercareMeditationTime,
  getAftercareMeditationAccessibleTime,
  getAftercareMeditationPhase,
  getAftercareMeditationProgressPercent,
  getAftercareMeditationRemainingSeconds,
  loadAftercareMeditationProgress,
  saveAftercareMeditationProgress,
  clearAftercareMeditationProgress,
  skipAftercareMeditationPhase,
} from "./aftercareMeditation";
import "./AftercareMeditation.css";

type Language = "nl" | "en";

export default function AftercareMeditation({ language }: { language: Language }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    try {
      return loadAftercareMeditationProgress(window.sessionStorage);
    } catch {
      return 0;
    }
  });
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
    try {
      if (elapsedSeconds <= 0) {
        clearAftercareMeditationProgress(window.sessionStorage);
      } else {
        saveAftercareMeditationProgress(window.sessionStorage, elapsedSeconds);
      }
    } catch {
      // Storage can be unavailable in private browsing; the in-memory timer still works.
    }
  }, [elapsedSeconds]);

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

  const skipCurrentPhase = () => {
    const currentElapsed = running && startedAt !== null
      ? Math.min(
        AFTERCARE_MEDITATION_DURATION_SECONDS,
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      )
      : elapsedSeconds;
    const nextElapsed = skipAftercareMeditationPhase(currentElapsed);
    const shouldRemainRunning = running && nextElapsed < AFTERCARE_MEDITATION_DURATION_SECONDS;
    setElapsedSeconds(nextElapsed);
    setRunning(shouldRemainRunning);
    setStartedAt(shouldRemainRunning ? Date.now() - nextElapsed * 1000 : null);
    setMessage(t(
      "Deze stap is overgeslagen. Je kunt op je eigen tempo verdergaan.",
      "This stage was skipped. Continue at your own pace.",
    ));
  };

  const end = () => {
    setRunning(false);
    setStartedAt(null);
    setElapsedSeconds(0);
    try {
      clearAftercareMeditationProgress(window.sessionStorage);
    } catch {
      // Ending the exercise must remain available when browser storage is blocked.
    }
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
          <h3 id="aftercare-meditation-title">{t("Begeleide meditatie · maximaal 30 minuten", "Guided meditation · up to 30 minutes")}</h3>
          <p>{t("Zes optionele stappen van maximaal vijf minuten. Je bepaalt zelf het tempo.", "Six optional stages of up to five minutes. You choose your own pace.")}</p>
        </div>
      </div>

      <div className="aftercare-meditation-clock">
        <time
          dateTime={`PT${remainingSeconds}S`}
          aria-label={getAftercareMeditationAccessibleTime(remainingSeconds, language)}
        >
          {formatAftercareMeditationTime(remainingSeconds)}
        </time>
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
            ? t("De oefening is afgerond. Neem rustig de tijd om terug te keren en kies wat je nu nodig hebt.", "The practice is complete. Take your time returning and choose what you need next.")
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
        {!completed && (
          <button type="button" className="aftercare-meditation-skip" onClick={skipCurrentPhase}>
            <SkipForward aria-hidden="true" />
            {t("Sla deze stap over", "Skip this stage")}
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
          "Optioneel en geen therapie. Forceer of houd je adem niet vast. Als een onderdeel niet prettig voelt, sla het over, pauzeer of beëindig de oefening. De timer telt door als je browser op de achtergrond staat. Je voortgang wordt in deze browsertab bewaard; na vernieuwen kun je handmatig verdergaan. Bij het sluiten van de tab kan de voortgang verdwijnen.",
          "Optional and not therapy. Do not force or hold your breath. If any part feels uncomfortable, skip it, pause or end the practice. The timer continues while your browser is in the background. Progress is saved in this browser tab, so you can resume manually after a reload. Closing the tab may clear that progress.",
        )}
      </p>
      {message && <p className="aftercare-meditation-message" role="status">{message}</p>}
    </section>
  );
}
