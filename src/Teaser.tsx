import React from "react";
import { ArrowUpRight, LockKeyhole, Sparkles, ChevronRight, VolumeX, Play } from "lucide-react";

export default function Teaser() {
  const [introDismissed, setIntroDismissed] = React.useState(false);
  return <main className="teaser-screen">
    <div className="teaser-noise" aria-hidden="true"/>
    {!introDismissed && <div className="teaser-intro" role="region" aria-label="AFTER HOURS video intro">
      <video className="teaser-intro-video" autoPlay muted playsInline preload="metadata" onEnded={() => setIntroDismissed(true)} onError={() => setIntroDismissed(true)} poster="/IMG_7718.jpeg">
        <source src="/after-hours-intro.mp4" type="video/mp4"/>
      </video>
      <div className="teaser-intro-controls"><span><VolumeX size={13}/> SOUND OFF</span><button type="button" onClick={() => setIntroDismissed(true)}><Play size={13}/> SKIP INTRO</button></div>
    </div> }
    <div className="teaser-top"><span className="teaser-private">18+ · PRIVATE PREVIEW</span></div>
    <section className="teaser-content">
      <span className="eyebrow"><Sparkles size={13}/> A NEW WORLD IS TAKING SHAPE</span>
      <h1>UNDER<br/><em>CONSTRUCTION</em></h1>
      <div className="teaser-divider"><span/></div>
      <p className="teaser-kicker">BUILDING KINKY STUFF.</p>
      <p className="teaser-copy">A private world of desire, discovery and deliberate choices is in the making.</p>
      <div className="teaser-terminal"><span className="teaser-live-dot"/><span>DESIGNING THE EXPERIENCE</span><span className="teaser-terminal-percent">IN PROGRESS</span></div>
      <div className="teaser-feature"><div><LockKeyhole/><span>Consent first</span></div><div><Sparkles/><span>Your rules. Your pace.</span></div></div>
      <p className="teaser-signoff">Not everything is meant to be revealed yet.</p>
      <a className="teaser-enter" href="/?enter=1">ENTER THE PRIVATE PREVIEW <ChevronRight size={15}/></a>
    </section>
    <footer className="teaser-footer"><span>THE NIGHT IS BEING BUILT <ArrowUpRight size={12}/></span></footer>
  </main>;
}
