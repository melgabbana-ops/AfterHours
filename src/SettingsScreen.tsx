import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, FileText, Languages, LogIn, LogOut, Shield, SlidersHorizontal, UserRound } from "lucide-react";
import "./settings-screen.css";

type Props = {
  language: "nl" | "en";
  onLanguageChange: (language: "nl" | "en") => void;
  privacyMode: boolean;
  onPrivacyModeChange: (enabled: boolean) => void;
  userEmail: string | null;
  onSignOut: () => void | Promise<void>;
  onOpenAccount: () => void;
  onOpenSafety: () => void;
  onOpenLegal: () => void;
  onOpenOnboarding: () => void;
  onBack: () => void;
};

export default function SettingsScreen({
  language, onLanguageChange, privacyMode, onPrivacyModeChange, userEmail,
  onSignOut, onOpenAccount, onOpenSafety, onOpenLegal, onOpenOnboarding, onBack
}: Props) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    if (query.addEventListener) {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return (
    <main className="settings-screen ah-editorial-screen">
      <button type="button" className="back" onClick={onBack}><ArrowLeft size={15} />{t("Terug naar dashboard", "Back to dashboard")}</button>
      <header className="settings-hero">
        <span className="eyebrow">AFTER HOURS · CONTROL & PREFERENCES</span>
        <h1>{t("Instellingen", "Settings")}</h1>
        <p>{t("Stel de app af op jouw voorkeuren. Je taalkeuze en privémodus wijzigen geen consent of sessiestatus.", "Adjust the app to your preferences. Language and privacy mode never change consent or session state.")}</p>
      </header>

      <div className="settings-grid">
        <section className="settings-group">
          <h2><Languages size={18} />{t("Taal", "Language")}</h2>
          <p>{t("Nederlands is de standaard. Engels blijft altijd beschikbaar.", "Dutch is the default. English remains available.")}</p>
          <div className="settings-choice-row" role="group" aria-label={t("Kies de taal", "Choose language")}>
            <button type="button" aria-pressed={language === "nl"} onClick={() => onLanguageChange("nl")}>Nederlands</button>
            <button type="button" aria-pressed={language === "en"} onClick={() => onLanguageChange("en")}>English</button>
          </div>
        </section>

        <section className="settings-group">
          <h2><Shield size={18} />{t("Privémodus", "Privacy mode")}</h2>
          <div className="settings-row">
            <div>
              <strong>{t("Scherm discreet houden", "Keep the screen discreet")}</strong>
              <small>{t("Verbergt gevoelige schermdetails wanneer je de privémodus inschakelt. Dit vervangt geen apparaatbeveiliging of versleuteling.", "Hides sensitive screen details while privacy mode is enabled. It does not replace device security or encryption.")}</small>
            </div>
            <button type="button" className="settings-action" aria-pressed={privacyMode} onClick={() => onPrivacyModeChange(!privacyMode)}>
              {privacyMode ? t("Ingeschakeld", "Enabled") : t("Uitgeschakeld", "Disabled")}
            </button>
          </div>
        </section>

        <section className="settings-group">
          <h2><SlidersHorizontal size={18} />{t("Beweging & toegankelijkheid", "Motion & accessibility")}</h2>
          <div className="settings-row">
            <div>
              <strong>{t("Verminder beweging", "Reduce motion")}</strong>
              <small>{t("AFTER HOURS volgt de toegankelijkheidsinstelling van je apparaat.", "AFTER HOURS follows your device accessibility preference.")}</small>
            </div>
            <span className="settings-status" role="status">{prefersReducedMotion ? t("Actief op apparaat", "Enabled on device") : t("Niet actief op apparaat", "Not enabled on device")}</span>
          </div>
        </section>

        <section className="settings-group">
          <h2><UserRound size={18} />{t("Account", "Account")}</h2>
          <div className="settings-row">
            <div>
              <strong className="settings-account-email">{userEmail || t("Lokale sessie", "Local session")}</strong>
              <small>{userEmail ? t("Je bent aangemeld bij je AFTER HOURS-account.", "You are signed in to your AFTER HOURS account.") : t("Meld je aan om persoonlijke gegevens veilig te synchroniseren.", "Sign in to securely sync personal data.")}</small>
            </div>
            {userEmail
              ? <button type="button" className="settings-action" onClick={() => void onSignOut()}><LogOut size={15} />{t("Uitloggen", "Sign out")}</button>
              : <button type="button" className="settings-action" onClick={onOpenAccount}><LogIn size={15} />{t("Aanmelden", "Sign in")}</button>}
          </div>
        </section>

        <section className="settings-group settings-group-wide">
          <h2>{t("Veiligheid & informatie", "Safety & information")}</h2>
          <div className="settings-links">
            <button type="button" onClick={onOpenSafety}><Shield size={15} />{t("Veiligheidsplan", "Safety plan")}</button>
            <button type="button" onClick={onOpenOnboarding}><BookOpen size={15} />{t("App-uitleg", "App guide")}</button>
            <button type="button" onClick={onOpenLegal}><FileText size={15} />{t("Juridisch & privacy", "Legal & privacy")}</button>
          </div>
        </section>
      </div>
    </main>
  );
}
