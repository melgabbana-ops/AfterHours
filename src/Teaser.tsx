import React from "react";

const INTRO_VIDEO = "https://gcdn.picsart.com/editing-temp/a18ef45a-9ae8-4ce4-93b4-68e40401defc.mp4";
import { ArrowUpRight, LockKeyhole, Sparkles, ChevronRight, Gamepad2, Layers3, MoonStar, Target, UsersRound, ShoppingBag, Volume2, VolumeX, ShieldCheck } from "lucide-react";
import { getTeaserVideoMotionSettings, subscribeToReducedMotionPreference, TEASER_REDUCED_MOTION_QUERY } from "./teaserMotion";

export default function Teaser() {
  const [language, setLanguage] = React.useState<"nl"|"en">(() => { try { return localStorage.getItem("afterhours.language") === "en" ? "en" : "nl"; } catch { return "nl"; } });
  React.useEffect(() => { try { localStorage.setItem("afterhours.language", language); document.documentElement.lang = language; } catch { /* Language preference is optional. */ } }, [language]);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const [introVideoUnavailable, setIntroVideoUnavailable] = React.useState(false);
  const [introVideoReady, setIntroVideoReady] = React.useState(false);
  const [introMuted, setIntroMuted] = React.useState(true);
  const introVideoRef = React.useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => {
    try {
      return typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia(TEASER_REDUCED_MOTION_QUERY).matches
        : false;
    } catch {
      return false;
    }
  });
  const videoMotion = getTeaserVideoMotionSettings(prefersReducedMotion);
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia(TEASER_REDUCED_MOTION_QUERY);
    setPrefersReducedMotion(mediaQuery.matches);
    return subscribeToReducedMotionPreference(mediaQuery, setPrefersReducedMotion);
  }, []);
  React.useEffect(() => {
    const video = introVideoRef.current;
    if (!video) return;
    if (prefersReducedMotion) {
      video.pause();
      return;
    }
    if (!introVideoUnavailable) void video.play().catch(() => undefined);
  }, [prefersReducedMotion, introVideoUnavailable]);
  const toggleIntroAudio = () => {
    const video = introVideoRef.current;
    const nextMuted = !introMuted;
    if (video) {
      video.muted = nextMuted;
      if (!nextMuted) void video.play().catch(() => { video.muted = true; setIntroMuted(true); });
    }
    setIntroMuted(nextMuted);
  };
  const features = [
    { icon: Gamepad2, title: t("Kinky games", "Kinky games"), copy: t("Interactieve ervaringen", "Interactive experiences") },
    { icon: Layers3, title: t("Kinky tarot", "Kinky tarot"), copy: t("Kaarten en reflectie", "Cards and reflection") },
    { icon: MoonStar, title: t("Astrologie", "Astrology"), copy: t("Ontdek jouw sterrenbeeld", "Explore your zodiac") },
    { icon: Target, title: t("Missies", "Missions"), copy: t("Daily · weekly · special", "Daily · weekly · special") },
    { icon: UsersRound, title: t("Connect", "Connect"), copy: t("Op jouw voorwaarden", "On your terms") },
    { icon: ShoppingBag, title: t("Shop", "Shop"), copy: t("Jouw AFTER HOURS", "Your AFTER HOURS") },
  ];
  return <main className="teaser-screen moodboard-landing" style={{"--ah-cinematic-background": `url("${import.meta.env.BASE_URL}visuals/reference-home.svg")`} as React.CSSProperties}>
    <div className="teaser-noise" aria-hidden="true"/>
    <div className="teaser-top"><img className="teaser-logo" src={`${import.meta.env.BASE_URL}after-hours-brand-logo-transparent.svg`} alt="AFTER HOURS" /><div className="teaser-top-actions"><span className="teaser-private">18+ · {t("PRIVÉWERELD","PRIVATE EXPERIENCE")}</span><button className="language-toggle teaser-language-toggle" type="button" aria-label={t("Taal wijzigen","Change language")} onClick={() => setLanguage(language === "nl" ? "en" : "nl")}><span className={language === "nl" ? "language-active" : ""}>NL</span><span className="language-divider">/</span><span className={language === "en" ? "language-active" : ""}>EN</span></button></div></div>
    <a className="teaser-safety-link" href="./?stop=1"><ShieldCheck size={14}/><span>{t("DIRECTE TOEGANG · VEILIGHEID / STOP","DIRECT ACCESS · SAFETY / STOP")}</span></a>
    <section className="teaser-film teaser-film-motion" aria-label={t("AFTER HOURS-intro","AFTER HOURS intro")}>
      <div className="teaser-atmosphere" aria-hidden="true"><span/><span/><span/><i/><i/></div>
      {introVideoUnavailable ? <div className="teaser-film-fallback" role="img" aria-label={t("Cinematische AFTER HOURS-achtergrond","Cinematic AFTER HOURS background")}/> : <video ref={introVideoRef} className="teaser-film-video" src={INTRO_VIDEO} autoPlay={videoMotion.autoPlay} muted={introMuted} loop={videoMotion.loop} controls={videoMotion.controls} playsInline preload={videoMotion.preload} poster={`${import.meta.env.BASE_URL}visuals/reference-home.svg`} aria-label={prefersReducedMotion ? t("AFTER HOURS-introvideo. Automatisch afspelen is uitgeschakeld vanwege de voorkeur voor minder beweging. Gebruik de videobediening om zelf af te spelen.","AFTER HOURS intro video. Autoplay is disabled because reduced motion is enabled. Use the video controls to play it when you choose.") : t("AFTER HOURS officiële introvideo","AFTER HOURS official intro video")} onLoadedData={() => setIntroVideoReady(true)} onError={() => setIntroVideoUnavailable(true)}/>}
      {!introVideoUnavailable && introVideoReady && <button className="teaser-audio-toggle" type="button" onClick={toggleIntroAudio} aria-label={introMuted ? t("Geluid aanzetten","Turn sound on") : t("Geluid dempen","Mute sound")} aria-pressed={!introMuted}>{introMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}<span>{introMuted ? t("GELUID AAN","SOUND ON") : t("GELUID UIT","MUTE SOUND")}</span></button>}
      <div className="teaser-film-brand">
        <img src={`${import.meta.env.BASE_URL}after-hours-brand-logo-transparent.svg`} alt="AFTER HOURS"/>
        <div><strong>AFTER HOURS</strong><span>YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.</span></div>
      </div>
      <span className="teaser-film-caption">{t("EEN WERELD BUITEN DE GEWONE REGELS","A WORLD BEYOND THE ORDINARY")}</span>
    </section>
    <section className="teaser-content">
      <span className="eyebrow"><Sparkles size={13}/> {t("KINKY · PLAY · CONNECT","KINKY · PLAY · CONNECT")}</span>
      <h1>AFTER<br/><em>HOURS</em></h1>
      <div className="teaser-divider"><span/></div>
      <p className="teaser-kicker">{t("JOUW REGELS. JOUW GRENZEN. JOUW ERVARING.","YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.")}</p>
      <p className="teaser-copy">{t("Een premium interactieve wereld voor volwassenen. Bewust gekozen, veilig en helemaal op jouw tempo.","A premium interactive world for adults. Deliberate, safe, and entirely at your pace.")}</p>
      <a className="teaser-enter" href="./?enter=1">{t("IK BEN 18+ · BETREED AFTER HOURS","I AM 18+ · ENTER AFTER HOURS")} <ChevronRight size={18}/></a>
      <p className="teaser-age-note">{t("Leeftijdsverklaring is geen officiële leeftijdsverificatie. Toestemming wordt afzonderlijk gevraagd.","Self-declared age is not formal age verification. Consent is requested separately.")}</p>
    </section>
    <section className="moodboard-feature-grid" aria-label={t("Ontdek AFTER HOURS","Explore AFTER HOURS")}>
      {features.map(({icon: Icon,title,copy},i)=><a className="moodboard-feature-card" href="./?enter=1" key={title}><span className="moodboard-feature-number">0{i+1}</span><Icon aria-hidden="true"/><strong>{title}</strong><small>{copy}</small></a>)}
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
      <a className="moodboard-secondary-cta" href="./?enter=1">{t("ONTDEK DE PRIVÉWERELD","EXPLORE THE PRIVATE WORLD")} <ChevronRight size={16}/></a>
    </section>
    <footer className="teaser-footer"><span>{t("EXPLORE · PLAY · BELONG","EXPLORE · PLAY · BELONG")} <ArrowUpRight size={12}/></span></footer>
  </main>;
}
