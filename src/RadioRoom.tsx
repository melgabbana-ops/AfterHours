import React from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";

const PLAYLIST_URL = "https://open.spotify.com/playlist/2sqMS1K9jiMuQbtVffw09I";
const waveform = [8,14,22,12,27,17,34,19,11,29,16,24,9,20,31,14,25,11,18,28,13,22,9,16,26,12,19,30,14,23,10,18,27,13,21,8,17,25,12,20,29,14,22,10,18,26,12,19];

export function RadioRoom({ onBack, language = "nl" }: { onBack: () => void; language?: "nl" | "en" }) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  return <main className="radio-room ah-radio-reference">
    <section className="radio-hero">
      <span className="eyebrow">AFTER HOURS</span>
      <h2>After Hours Radio</h2>
      <p>{t("De soundtrack van jouw nacht.", "The soundtrack to your night.")}</p>
    </section>
    <section className="radio-player mood-midnight">
      <div className="radio-disc" aria-hidden="true"><span>AH</span></div>
      <span className="eyebrow">{t("NU AFGESPEELD", "NOW PLAYING")}</span>
      <h3>AFTER HOURS · THE SOUNDTRACK</h3>
      <p>{t("Dark R&B · Cinematic · Slow burn · Deep atmosphere", "Dark R&B · Cinematic · Slow burn · Deep atmosphere")}</p>
      <div className="radio-waveform" aria-hidden="true">{waveform.map((height, index) => <i key={index} style={{height: height + "px"}} />)}</div>
      <a className="spotify-open" href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer">
        <span>Spotify</span><strong>{t("Luister naar de playlist", "Listen to the playlist")}</strong><ExternalLink size={17}/>
      </a>
    </section>
    <section className="radio-note"><ShieldCheck/><div><strong>{t("Privacy van de playlist", "Playlist privacy")}</strong><span>{t("Spotify opent extern. Je AFTER HOURS-scherm toont geen Spotify-profielnaam of profielfoto.", "Spotify opens externally. Your AFTER HOURS screen does not show a Spotify profile name or photo.")}</span></div></section>
    <button className="back" onClick={onBack}>← {t("Terug", "Back")}</button>
  </main>;
}
