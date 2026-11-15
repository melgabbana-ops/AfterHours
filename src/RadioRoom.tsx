import React from "react";
import { ExternalLink, Radio, ShieldCheck } from "lucide-react";

const PLAYLIST_URL = "https://open.spotify.com/playlist/2sqMS1K9jiMuQbtVffw09I";
export function RadioRoom({ onBack, language = "nl" }: { onBack: () => void; language?: "nl" | "en" }) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  return <main className="radio-room">
    <section className="radio-hero"><span className="eyebrow">AFTER HOURS · RADIO</span><h2>{t("De soundtrack van jouw nacht.", "The soundtrack to your night.")}</h2><p>{t("Een zorgvuldig samengestelde AFTER HOURS-selectie. Open de playlist in Spotify en laat de muziek de sfeer dragen.", "A curated AFTER HOURS selection. Open the playlist in Spotify and let the music set the atmosphere.")}</p></section>
    <section className="radio-player mood-midnight">
      <div className="radio-disc"><Radio/><span>AH</span></div>
      <span className="eyebrow">{t("OFFICIËLE AFTER HOURS PLAYLIST", "OFFICIAL AFTER HOURS PLAYLIST")}</span>
      <h3>AFTER HOURS · THE SOUNDTRACK</h3>
      <p>{t("Dark R&B · Cinematic · Slow burn · Deep atmosphere", "Dark R&B · Cinematic · Slow burn · Deep atmosphere")}</p>
      <div className="radio-vibe"><span>01</span><strong>AFTER HOURS</strong><small>{t("Geselecteerd voor de experience", "Curated for the experience")}</small></div>
      <a className="spotify-open" href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer"><span>Spotify</span><strong>{t("Open playlist", "Open playlist")}</strong><ExternalLink size={17}/></a>
    </section>
    <section className="radio-note"><ShieldCheck/><div><strong>{t("Privacy van de playlist", "Playlist privacy")}</strong><span>{t("AFTER HOURS toont hier geen Spotify-profielnaam of profielfoto. Spotify opent extern. De eigenaar van een gedeelde playlist kan binnen Spotify zelf nog zichtbaar zijn; gebruik voor volledige scheiding een apart AFTER HOURS-account.", "AFTER HOURS does not display a Spotify profile name or photo here. Spotify opens externally. The owner of a shared playlist may still be visible inside Spotify; use a separate AFTER HOURS account for full separation.")}</span></div></section>
    <button className="back" onClick={onBack}>← {t("Terug", "Back")}</button>
  </main>;
}
