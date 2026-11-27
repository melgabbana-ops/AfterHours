import { ArrowRight, ShieldCheck, Square } from "lucide-react";
import "./cold-open-intro.css";

type SessionStatus = "ready" | "active" | "paused" | "completed" | "stopped";

type Props = {
  language: "nl" | "en";
  ageConfirmed: boolean;
  sessionStatus: SessionStatus;
  onEnter: () => void;
  onPause: () => void;
  onOpenSafety: () => void;
  onStopNow: () => void;
};

export default function ColdOpenIntro({ language, ageConfirmed, sessionStatus, onEnter, onPause, onOpenSafety, onStopNow }: Props) {
  const activeSession = sessionStatus === "active" || sessionStatus === "paused";
  const t = (nl: string, en: string) => language === "nl" ? nl : en;

  return (
    <main className="cold-open-screen" aria-labelledby="cold-open-title">
      <img
        className="cold-open-art"
        src={`${import.meta.env.BASE_URL}visuals/ah-cinematic-hero.svg`}
        alt=""
        aria-hidden="true"
      />
      <header className="cold-open-header">
        <img src={`${import.meta.env.BASE_URL}after-hours-brand-logo-transparent.svg`} alt="AFTER HOURS" />
        <span className="cold-open-kicker">PRIVATE EXPERIENCE · 18+</span>
      </header>

      <section className="cold-open-content">
        <div className="cold-open-copy">
          <span className="cold-open-kicker">{t("EEN WERELD MET EIGEN REGIE", "A WORLD ON YOUR TERMS")}</span>
          <h1 className="cold-open-title" id="cold-open-title">AFTER <em>HOURS</em></h1>
          <p className="cold-open-lede">
            {t(
              "Een persoonlijke wereld voor bewuste ervaringen. Jouw grenzen bepalen het tempo. Toestemming blijft vrijwillig, specifiek en altijd herroepbaar.",
              "A private world for intentional experiences. Your boundaries set the pace. Consent remains voluntary, specific and always revocable."
            )}
          </p>
        </div>

        <div className="cold-open-actions" aria-label={t("Start en veiligheid", "Entry and safety")}>
          <button type="button" className="cold-open-enter" onClick={onEnter}>
            <ArrowRight aria-hidden="true" />{ageConfirmed ? t("Naar het dashboard", "Enter the dashboard") : t("Ik ben 18+ en ga verder", "I am 18+ and continue")}
          </button>
          <button type="button" onClick={onOpenSafety}>
            <ShieldCheck aria-hidden="true" />{t("Veiligheidsplan openen", "Open safety plan")}
          </button>
          {sessionStatus === "active" && <button type="button" className="cold-open-pause" onClick={onPause} aria-label={t("Pauzeer de actieve sessie onmiddellijk", "Pause the active session immediately")}>{t("PAUZE", "PAUSE")}</button>}
          {activeSession && (
            <button
              type="button"
              className="cold-open-stop"
              onClick={onStopNow}
              aria-label={t("Stop de actieve sessie onmiddellijk", "Stop the active session immediately")}
            >
              <Square aria-hidden="true" />{t("STOP NU", "STOP NOW")}
            </button>
          )}
          {ageConfirmed && <button type="button" className="cold-open-skip" onClick={onEnter}>
            {t("Intro overslaan", "Skip intro")}
          </button>}
          {!ageConfirmed && <p className="cold-open-age-note">{t("Dit is een zelfverklaring, geen officiële leeftijdsverificatie. Consent wordt afzonderlijk gevraagd.", "This is a self-declaration, not formal age verification. Consent is requested separately.")}</p>}
          {activeSession && (
            <p className="cold-open-session-note" role="status">
              {sessionStatus === "active" ? t("Er staat een sessie open. PAUSE en STOP blijven direct beschikbaar.", "A session is open. PAUSE and STOP remain immediately available.") : t("De sessie is gepauzeerd. STOP blijft direct beschikbaar.", "The session is paused. STOP remains immediately available.")}
            </p>
          )}
        </div>
      </section>

      <footer className="cold-open-footer">
        <span>{t("JOUW REGELS · JOUW GRENZEN · JOUW TEMPO", "YOUR RULES · YOUR BOUNDARIES · YOUR PACE")}</span>
        <span>BLACK · CHAMPAGNE · PRIVATE BY DESIGN</span>
      </footer>
    </main>
  );
}
