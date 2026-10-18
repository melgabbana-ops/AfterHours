import React from "react";
import { ArrowUpRight, LockKeyhole, Sparkles, ChevronRight, Gamepad2, Layers3, MoonStar, Target, UsersRound, ShoppingBag } from "lucide-react";

export default function Teaser() {
  const [language, setLanguage] = React.useState<"nl"|"en">(() => { try { return localStorage.getItem("afterhours.language") === "en" ? "en" : "nl"; } catch { return "nl"; } });
  React.useEffect(() => { try { localStorage.setItem("afterhours.language", language); document.documentElement.lang = language; } catch { /* Language preference is optional. */ } }, [language]);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const [introUnavailable, setIntroUnavailable] = React.useState(false);
  const [introEnded, setIntroEnded] = React.useState(false);
  const features = [
    { icon: Gamepad2, title: t("Kinky games", "Kinky games"), copy: t("Interactieve ervaringen", "Interactive experiences") },
    { icon: Layers3, title: t("Kinky tarot", "Kinky tarot"), copy: t("Kaarten en reflectie", "Cards and reflection") },
    { icon: MoonStar, title: t("Astrologie", "Astrology"), copy: t("Ontdek jouw sterrenbeeld", "Explore your zodiac") },
    { icon: Target, title: t("Missies", "Missions"), copy: t("Daily · weekly · special", "Daily · weekly · special") },
    { icon: UsersRound, title: t("Connect", "Connect"), copy: t("Op jouw voorwaarden", "On your terms") },
    { icon: ShoppingBag, title: t("Shop", "Shop"), copy: t("Jouw AFTER HOURS", "Your AFTER HOURS") },
  ];
  return <main className="teaser-screen moodboard-landing">
    <div className="teaser-noise" aria-hidden="true"/>
    <div className="teaser-top"><img className="teaser-logo" src="/after-hours-logo.svg" alt="AFTER HOURS" /><div className="teaser-top-actions"><span className="teaser-private">18+ · {t("PRIVÉWERELD","PRIVATE EXPERIENCE")}</span><button className="language-toggle teaser-language-toggle" type="button" aria-label={t("Taal wijzigen","Change language")} onClick={() => setLanguage(language === "nl" ? "en" : "nl")}><span className={language === "nl" ? "language-active" : ""}>NL</span><span className="language-divider">/</span><span className={language === "en" ? "language-active" : ""}>EN</span></button></div></div>
    {!introUnavailable && !introEnded && <section className="teaser-film" aria-label={t("AFTER HOURS-intro","AFTER HOURS intro")}>
      <video className="teaser-film-video" autoPlay muted playsInline preload="metadata" poster="https://gcdn.picsart.com/cloud-storage/ea428271-664f-4cd5-a566-5bdebb64f775.jpg" onEnded={() => setIntroEnded(true)} onError={() => setIntroUnavailable(true)}>
        <source src="https://gcdn.picsart.com/editing-temp/a18ef45a-9ae8-4ce4-93b4-68e40401defc.mp4" type="video/mp4"/>
      </video>
      <div className="teaser-film-brand" aria-hidden="true"><img src="/after-hours-logo.svg" alt="" /><div><strong>AFTER HOURS</strong><span>YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.</span></div></div>
      <button className="teaser-film-skip" type="button" onClick={() => setIntroEnded(true)}>{t("INTRO OVERSLAAN","SKIP INTRO")}</button>
    </section>}
    {(introEnded || introUnavailable) && <section className="teaser-film teaser-film-endcard" aria-label="AFTER HOURS"><img className="teaser-endcard-logo" src="/after-hours-logo.svg" alt="AFTER HOURS" /><p>YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.</p><span>18+ · PRIVATE EXPERIENCE</span></section>}
    <section className="teaser-content">
      <span className="eyebrow"><Sparkles size={13}/> {t("KINKY · PLAY · CONNECT","KINKY · PLAY · CONNECT")}</span>
      <h1>AFTER<br/><em>HOURS</em></h1>
      <div className="teaser-divider"><span/></div>
      <p className="teaser-kicker">{t("JOUW REGELS. JOUW GRENZEN. JOUW ERVARING.","YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.")}</p>
      <p className="teaser-copy">{t("Een premium interactieve wereld voor volwassenen. Bewust gekozen, veilig en helemaal op jouw tempo.","A premium interactive world for adults. Deliberate, safe, and entirely at your pace.")}</p>
      <a className="teaser-enter" href="/?enter=1">{t("IK BEN 18+ · BETREED AFTER HOURS","I AM 18+ · ENTER AFTER HOURS")} <ChevronRight size={18}/></a>
      <p className="teaser-age-note">{t("Leeftijdsverklaring is geen officiële leeftijdsverificatie. Toestemming wordt afzonderlijk gevraagd.","Self-declared age is not formal age verification. Consent is requested separately.")}</p>
    </section>
    <section className="moodboard-feature-grid" aria-label={t("Ontdek AFTER HOURS","Explore AFTER HOURS")}>
      {features.map(({icon: Icon,title,copy},i)=><a className="moodboard-feature-card" href="/?enter=1" key={title}><span className="moodboard-feature-number">0{i+1}</span><Icon aria-hidden="true"/><strong>{title}</strong><small>{copy}</small></a>)}
    </section>
    <section className="moodboard-missions">
      <div className="moodboard-ornament" aria-hidden="true">✧</div>
      <span className="eyebrow">{t("EXPLORE · PLAY · BELONG","EXPLORE · PLAY · BELONG")}</span>
      <h2>{t("JOUW NACHT. JOUW REGELS.","YOUR NIGHT. YOUR RULES.")}</h2>
      <p>{t("Ontdek nieuwe ervaringen, bouw je progressie op en bepaal zelf wat bij jou past.","Discover new experiences, build your progress, and choose what feels right for you.")}</p>
      <div className="moodboard-mission-columns">
        <article><Sparkles/><strong>{t("Dagelijkse missies","Daily missions")}</strong><span>{t("Kleine stappen, nieuwe ontdekkingen","Small steps, new discoveries")}</span></article>
        <article><Target/><strong>{t("Persoonlijke progressie","Personal progress")}</strong><span>{t("XP, ranks en badges","XP, ranks and badges")}</span></article>
        <article><LockKeyhole/><strong>{t("Consent first","Consent first")}</strong><span>{t("Jouw grenzen blijven leidend","Your boundaries come first")}</span></article>
      </div>
      <a className="moodboard-secondary-cta" href="/?enter=1">{t("ONTDEK DE PRIVÉWERELD","EXPLORE THE PRIVATE WORLD")} <ChevronRight size={16}/></a>
    </section>
    <footer className="teaser-footer"><span>{t("EXPLORE · PLAY · BELONG","EXPLORE · PLAY · BELONG")} <ArrowUpRight size={12}/></span></footer>
  </main>;
}
