import React from "react";
import { ArrowUpRight, LockKeyhole, Sparkles, ChevronRight } from "lucide-react";

export default function Teaser() {
  const [language, setLanguage] = React.useState<"nl"|"en">(() => { try { return localStorage.getItem("afterhours.language") === "nl" ? "nl" : "en"; } catch { return "en"; } });
  React.useEffect(() => { try { localStorage.setItem("afterhours.language", language); document.documentElement.lang = language; } catch { /* Language preference is optional. */ } }, [language]);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const [introUnavailable, setIntroUnavailable] = React.useState(false);
  const [introEnded, setIntroEnded] = React.useState(false);

  return <main className="teaser-screen">
    <div className="teaser-noise" aria-hidden="true"/>
    <div className="teaser-top"><span className="teaser-private">18+ · {t("PRIVÉPREVIEW","PRIVATE PREVIEW")}</span><button className="language-toggle teaser-language-toggle" type="button" aria-label={t("Taal wijzigen","Change language")} onClick={() => setLanguage(language === "nl" ? "en" : "nl")}><span className={language === "nl" ? "language-active" : ""}>NL</span><span className="language-divider">/</span><span className={language === "en" ? "language-active" : ""}>EN</span></button></div>
    {!introUnavailable && !introEnded && <section className="teaser-film" aria-label={t("AFTER HOURS-intro","AFTER HOURS intro")}>
      <video className="teaser-film-video" autoPlay muted playsInline preload="metadata" poster="/IMG_7718.jpeg"
        onEnded={() => setIntroEnded(true)} onError={() => setIntroUnavailable(true)}>
        <source src="/after-hours-intro.mp4" type="video/mp4"/>
      </video>
      <button className="teaser-film-skip" type="button" onClick={() => setIntroEnded(true)}>{t("INTRO OVERSLAAN","SKIP INTRO")}</button>
    </section>}
    <section className="teaser-content">
      <span className="eyebrow"><Sparkles size={13}/> {t("EEN NIEUWE WERELD KRIJGT VORM","A NEW WORLD IS TAKING SHAPE")}</span>
      <h1>{t("IN","UNDER")}<br/><em>{t("AANBOUW","CONSTRUCTION")}</em></h1>
      <div className="teaser-divider"><span/></div>
      <p className="teaser-kicker">{t("WE BOUWEN AAN KINKY ERVARINGEN.","BUILDING KINKY STUFF.")}</p>
      <p className="teaser-copy">{t("Een privéwereld vol verlangen, ontdekking en bewuste keuzes is in de maak.","A private world of desire, discovery and deliberate choices is in the making.")}</p>
      <div className="teaser-terminal"><span className="teaser-live-dot"/><span>{t("DE ERVARING WORDT ONTWORPEN","DESIGNING THE EXPERIENCE")}</span><span className="teaser-terminal-percent">{t("IN ONTWIKKELING","IN PROGRESS")}</span></div>
      <div className="teaser-feature"><div><LockKeyhole/><span>{t("Toestemming eerst","Consent first")}</span></div><div><Sparkles/><span>{t("Jouw regels. Jouw tempo.","Your rules. Your pace.")}</span></div></div>
      <p className="teaser-signoff">{t("Nog niet alles wordt onthuld.","Not everything is meant to be revealed yet.")}</p>
      <a className="teaser-enter" href="/?enter=1">{t("OPEN DE PRIVÉPREVIEW","ENTER THE PRIVATE PREVIEW")} <ChevronRight size={15}/></a>
    </section>
    <footer className="teaser-footer"><span>{t("DE NACHT WORDT GEBOUWD","THE NIGHT IS BEING BUILT")} <ArrowUpRight size={12}/></span></footer>
  </main>;
}
