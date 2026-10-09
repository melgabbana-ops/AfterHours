import React from "react";
import { ArrowUpRight, LockKeyhole, Sparkles } from "lucide-react";

export default function Teaser() {
  return <main className="teaser-screen">
    <div className="teaser-noise" aria-hidden="true"/>
    <div className="teaser-top"><span className="teaser-monogram">AH</span><span className="teaser-private">18+ · PRIVATE PREVIEW</span></div>
    <section className="teaser-content">
      <span className="eyebrow"><Sparkles size={13}/> A NEW WORLD IS TAKING SHAPE</span>
      <h1>UNDER<br/><em>CONSTRUCTION</em></h1>
      <div className="teaser-divider"><span/></div>
      <p className="teaser-kicker">BUILDING KINKY STUFF.</p>
      <p className="teaser-copy">A private world of desire, discovery and deliberate choices is in the making.</p>
      <div className="teaser-terminal"><span className="teaser-live-dot"/><span>DESIGNING THE EXPERIENCE</span><span className="teaser-terminal-percent">IN PROGRESS</span></div>
      <div className="teaser-feature"><div><LockKeyhole/><span>Consent first</span></div><div><Sparkles/><span>Your rules. Your pace.</span></div></div>
      <p className="teaser-signoff">Not everything is meant to be revealed yet.</p>
    </section>
    <footer className="teaser-footer"><span>AFTER HOURS</span><span>THE NIGHT IS BEING BUILT <ArrowUpRight size={12}/></span></footer>
  </main>;
}
