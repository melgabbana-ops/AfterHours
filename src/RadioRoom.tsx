import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, Music2, Pause, Play, Repeat1, ShieldCheck, Shuffle, SkipBack, SkipForward, Trash2, Upload, Volume2 } from "lucide-react";
import { formatRadioTime, getNextRadioTrackIndex } from "./services/radioAudio";
import "./radio-local.css";

const PLAYLIST_URL = "https://open.spotify.com/playlist/2sqMS1K9jiMuQbtVffw09I";
const waveform = [8,14,22,12,27,17,34,19,11,29,16,24,9,20,31,14,25,11,18,28,13,22,9,16,26,12,19,30,14,23,10,18,27,13,21,8,17,25,12,20,29,14,22,10,18,26,12,19];
type LocalTrack = { id: string; file: File; url: string };

export function RadioRoom({ onBack, language = "nl" }: { onBack: () => void; language?: "nl" | "en" }) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const audioRef = useRef<HTMLAudioElement>(null);
  const tracksRef = useRef<LocalTrack[]>([]);
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [shuffle, setShuffle] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);
  const [message, setMessage] = useState("");
  tracksRef.current = tracks;
  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] ?? null : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (currentTrack) {
      if (audio.src !== currentTrack.url) { audio.src = currentTrack.url; audio.load(); }
    } else {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [currentTrack?.url]);

  useEffect(() => () => {
    tracksRef.current.forEach(track => URL.revokeObjectURL(track.url));
  }, []);

  const playTrack = async (index: number) => {
    const track = tracks[index];
    const audio = audioRef.current;
    if (!track || !audio) return;
    setCurrentIndex(index);
    setMessage("");
    if (audio.src !== track.url) { audio.src = track.url; audio.load(); }
    else if (audio.ended) audio.currentTime = 0;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setMessage(t("Afspelen is door de browser geblokkeerd. Tik nogmaals op Afspelen.", "Playback was blocked by the browser. Tap Play again."));
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); return; }
    if (currentIndex >= 0) await playTrack(currentIndex);
    else if (tracks.length) await playTrack(0);
    else setMessage(t("Voeg eerst een muziekbestand toe.", "Add an audio file first."));
  };

  const addFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    const accepted = files.filter(file => file.type.startsWith("audio/") || /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac)$/i.test(file.name));
    if (!accepted.length) { setMessage(t("Geen ondersteunde audiobestanden gevonden.", "No supported audio files were found.")); return; }
    const prepared = accepted.map(file => { const url = URL.createObjectURL(file); return { id: url, file, url }; });
    const wasEmpty = tracks.length === 0;
    setTracks(previous => [...previous, ...prepared]);
    if (wasEmpty) setCurrentIndex(0);
    setMessage(t(`${accepted.length} nummer(s) toegevoegd. Bestanden blijven op dit apparaat.`, `${accepted.length} track(s) added. Files stay on this device.`));
  };

  const nextTrack = async () => {
    if (!tracks.length) return;
    await playTrack(getNextRadioTrackIndex(currentIndex, tracks.length, { shuffle }));
  };
  const previousTrack = async () => {
    if (!tracks.length) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; setCurrentTime(0); return; }
    await playTrack(currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1);
  };
  const removeTrack = (index: number) => {
    const removed = tracks[index];
    if (!removed) return;
    if (index === currentIndex) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
    URL.revokeObjectURL(removed.url);
    const remaining = tracks.filter((_, itemIndex) => itemIndex !== index);
    setTracks(remaining);
    if (!remaining.length) setCurrentIndex(-1);
    else if (index < currentIndex) setCurrentIndex(currentIndex - 1);
    else if (index === currentIndex) setCurrentIndex(Math.min(index, remaining.length - 1));
  };
  const seek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    if (!Number.isFinite(nextTime)) return;
    if (audioRef.current) audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return <main className="radio-room ah-radio-reference">
    <section className="radio-hero">
      <span className="eyebrow">AFTER HOURS</span><h2>After Hours Radio</h2>
      <p>{t("De soundtrack van jouw nacht.", "The soundtrack to your night.")}</p>
    </section>
    <section className="radio-player mood-midnight">
      <div className="radio-disc" aria-hidden="true"><span>AH</span></div>
      <span className="eyebrow">{isPlaying ? t("NU AFGESPEELD", "NOW PLAYING") : t("AFTER HOURS SOUND", "AFTER HOURS SOUND")}</span>
      <h3>{currentTrack?.file.name ?? "AFTER HOURS · THE SOUNDTRACK"}</h3>
      <p>{currentTrack ? t("Lokaal bestand · privé op dit apparaat", "Local file · private on this device") : t("Dark R&B · Cinematic · Slow burn · Deep atmosphere", "Dark R&B · Cinematic · Slow burn · Deep atmosphere")}</p>
      <div className="radio-waveform" aria-hidden="true">{waveform.map((height, index) => <i key={index} style={{height: height + "px"}} />)}</div>
      <div className="radio-local-progress">
        <span>{formatRadioTime(currentTime)}</span>
        <input aria-label={t("Nummerpositie", "Track position")} type="range" min="0" max={Math.max(duration, 0)} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={seek} disabled={!currentTrack || !duration}/>
        <span>{formatRadioTime(duration)}</span>
      </div>
      <div className="radio-local-controls">
        <button type="button" aria-label={t("Willekeurige volgorde", "Shuffle")} aria-pressed={shuffle} className={shuffle ? "active" : ""} onClick={() => setShuffle(value => !value)}><Shuffle size={17}/></button>
        <button type="button" aria-label={t("Vorig nummer", "Previous track")} onClick={() => void previousTrack()} disabled={!tracks.length}><SkipBack size={20}/></button>
        <button type="button" className="radio-local-play" aria-label={isPlaying ? t("Pauzeren", "Pause") : t("Afspelen", "Play")} onClick={() => void togglePlayback()}>{isPlaying ? <Pause size={21}/> : <Play size={21}/>}</button>
        <button type="button" aria-label={t("Volgend nummer", "Next track")} onClick={() => void nextTrack()} disabled={!tracks.length}><SkipForward size={20}/></button>
        <button type="button" aria-label={t("Herhaal nummer", "Repeat track")} aria-pressed={repeatOne} className={repeatOne ? "active" : ""} onClick={() => setRepeatOne(value => !value)}><Repeat1 size={18}/></button>
      </div>
      <label className="radio-local-volume"><Volume2 size={16}/><input aria-label={t("Volume", "Volume")} type="range" min="0" max="1" step="0.01" value={volume} onChange={event => setVolume(Number(event.target.value))}/></label>
      <audio ref={audioRef} preload="metadata"
        onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
        onEnded={() => { if (repeatOne && currentIndex >= 0) void playTrack(currentIndex); else void nextTrack(); }}
        onError={() => { setIsPlaying(false); setMessage(t("Dit bestand kan niet door deze browser worden afgespeeld. Probeer MP3 of M4A.", "This file cannot be played by this browser. Try MP3 or M4A.")); }}/>
      <label className="radio-local-upload"><Upload size={17}/><span>{t("Eigen muziek toevoegen", "Add your own music")}</span><input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac" multiple onChange={addFiles}/></label>
      <p className="radio-local-privacy">{t("Je muziek wordt niet geüpload. De bestanden blijven tijdelijk in deze sessie op dit apparaat.", "Your music is not uploaded. Files stay temporarily in this session on this device.")}</p>
      {message && <p className="radio-local-message" role="status">{message}</p>}
    </section>
    {tracks.length > 0 && <section className="radio-local-library" aria-label={t("Jouw muziekbibliotheek", "Your music library")}>
      <div className="radio-local-library-head"><span className="eyebrow">{t("JOUW MUZIEK", "YOUR MUSIC")}</span><strong>{tracks.length} {t("nummers", "tracks")}</strong></div>
      {tracks.map((track, index) => <div className={index === currentIndex ? "radio-local-track active" : "radio-local-track"} key={track.id}>
        <button type="button" className="radio-local-track-play" onClick={() => void playTrack(index)} aria-label={t("Speel ", "Play ") + track.file.name}>
          <Music2 size={16}/><span><strong>{track.file.name}</strong><small>{(track.file.size / (1024 * 1024)).toFixed(1)} MB · {t("lokaal bestand", "local file")}</small></span>
        </button>
        <button type="button" className="radio-local-track-remove" onClick={() => removeTrack(index)} aria-label={t("Verwijder ", "Remove ") + track.file.name}><Trash2 size={15}/></button>
      </div>)}
    </section>}
    <a className="spotify-open" href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer"><span>Spotify</span><strong>{t("Luister naar de playlist", "Listen to the playlist")}</strong><ExternalLink size={17}/></a>
    <section className="radio-note"><ShieldCheck/><div><strong>{t("Privacy van de muziek", "Music privacy")}</strong><span>{t("Eigen bestanden worden alleen lokaal afgespeeld en niet naar AFTER HOURS verzonden. Spotify opent extern.", "Your own files play locally and are not sent to AFTER HOURS. Spotify opens externally.")}</span></div></section>
    <button className="back" onClick={onBack}>← {t("Terug", "Back")}</button>
  </main>;
}
