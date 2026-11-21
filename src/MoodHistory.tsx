import React, { useCallback, useEffect, useState } from "react";
import { Download, History, RefreshCw, Trash2 } from "lucide-react";
import { loadMoodHistoryRemote, type MoodCode, type MoodEvent, type MoodPhase } from "./services/moods";
import { supabaseConfigured } from "./services/supabase";
import { buildMoodHistoryCsv, filterMoodHistoryEvents, readLocalMoodHistoryEvents, removeLocalMoodHistoryEvent, type MoodHistoryFilter } from "./moodHistory";
import "./MoodHistory.css";

type MoodHistorySource = "local" | "remote";
const label: Record<MoodCode, [string, string]> = {
  KINKY: ["Kinky", "Kinky"], EXCITED: ["Opgewonden", "Excited"], CURIOUS: ["Nieuwsgierig", "Curious"], CALM: ["Rustig", "Calm"], PLAYFUL: ["Speels", "Playful"], CONFIDENT: ["Zelfverzekerd", "Confident"], UNSURE: ["Onzeker / twijfel", "Unsure"],
  "INTO IT": ["Ik zit er lekker in", "Into it"], MORE: ["Ik wil meer", "More"], GOOD: ["Goed", "Good"], NEUTRAL: ["Neutraal", "Neutral"], "NEED A PAUSE": ["Pauze nodig", "Need a pause"], OVERWHELMED: ["Overweldigd", "Overwhelmed"], STOP: ["STOP", "STOP"],
  RELAXED: ["Ontspannen", "Relaxed"], SATISFIED: ["Tevreden", "Satisfied"], ENERGIZED: ["Energiek", "Energized"], TIRED: ["Moe", "Tired"], EMOTIONAL: ["Emotioneel", "Emotional"], OVERSTIMULATED: ["Overprikkeld", "Overstimulated"]
};
const phaseLabel: Record<MoodPhase, [string, string]> = { before: ["Vooraf", "Before"], during: ["Tijdens", "During"], after: ["Achteraf", "Aftercare"] };


export default function MoodHistory({ profileId, language }: { profileId: string; language: "nl" | "en" }) {
  const [events, setEvents] = useState<MoodEvent[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MoodHistoryFilter>("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const [source, setSource] = useState<MoodHistorySource>("local");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;

  const refresh = useCallback(async () => {
    setLoading(true); setVisibleCount(10); setMessage(""); setPendingDelete(null);
    if (!supabaseConfigured) {
      setSource("local"); setEvents(readLocalMoodHistoryEvents(profileId)); setMessage(t("Alleen lokaal op dit apparaat opgeslagen.", "Stored locally on this device only.")); setLoading(false); return;
    }
    try {
      const remote = await loadMoodHistoryRemote(40);
      if (remote) { setSource("remote"); setEvents(remote); setMessage(t("Privé opgeslagen bij je account.", "Privately stored with your account.")); }
      else { setSource("local"); setEvents(readLocalMoodHistoryEvents(profileId)); setMessage(t("Alleen lokaal op dit apparaat opgeslagen.", "Stored locally on this device only.")); }
    } catch {
      setSource("local"); setEvents(readLocalMoodHistoryEvents(profileId));
      setMessage(t("Serverhistorie niet beschikbaar. Dit toont alleen lokale vermeldingen.", "Server history unavailable. Showing local entries only."));
    } finally { setLoading(false); }
  }, [profileId, language]);

  useEffect(() => { void refresh(); }, [refresh]);

  const filteredEvents = filterMoodHistoryEvents(events, filter);
  const visibleEvents = filteredEvents.slice(0, visibleCount);

  const removeLocalEvent = (eventId: string) => {
    if (source !== "local") return;
    const removed = removeLocalMoodHistoryEvent(profileId, eventId);
    if (!removed) { setMessage(t("Verwijderen is niet gelukt. Browseropslag is mogelijk geblokkeerd.", "Could not delete this entry. Browser storage may be unavailable.")); return; }
    setEvents((current) => current.filter((event) => event.id !== eventId));
    setPendingDelete(null);
    setMessage(t("Vermelding verwijderd van dit apparaat.", "Entry deleted from this device."));
  };

  const exportHistory = () => {
    if (loading || events.length === 0) return;
    try {
      const csv = buildMoodHistoryCsv(events, language, (mood) => label[mood][language === "nl" ? 0 : 1]);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "after-hours-mood-history-" + new Date().toISOString().slice(0, 10) + ".csv";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setMessage(t(
        "CSV-bestand klaargezet met " + events.length + " geladen vermeldingen.",
        "CSV file prepared with " + events.length + " loaded entries.",
      ));
    } catch {
      setMessage(t("Exporteren is niet gelukt op dit apparaat.", "Export could not be created on this device."));
    }
  };

  const filterOptions: Array<{ value: MoodHistoryFilter; label: string }> = [
    { value: "all", label: t("Alles", "All") },
    { value: "before", label: t("Vooraf", "Before") },
    { value: "during", label: t("Tijdens", "During") },
    { value: "after", label: t("Achteraf", "Aftercare") },
  ];

  return <section className="mood-history">
    <div className="mood-history-head">
      <span className="eyebrow"><History size={13} /> AFTER HOURS · MOOD ARCHIVE</span>
      <div className="mood-history-actions">
        {events.length > 0 && <button className="mood-history-export" type="button" onClick={exportHistory} disabled={loading}
          aria-label={t("Exporteer geladen stemmingsvermeldingen als CSV", "Export loaded mood entries as CSV")}>
          <Download size={14} />{t("Exporteer CSV", "Export CSV")}
        </button>}
        <button type="button" onClick={() => void refresh()} disabled={loading} aria-label={t("Stemmingen vernieuwen", "Refresh mood history")}>
          <RefreshCw size={14} />{t("Vernieuwen", "Refresh")}
        </button>
      </div>
    </div>
    <h3>{t("Stemmingsoverzicht", "Mood history")}</h3>
    <p className="mood-history-note" role="status" aria-live="polite">{message || t("Persoonlijk en privé. Je hoeft geen stemming uit te leggen.", "Personal and private. You do not have to explain a mood.")}</p>
    {events.length > 0 && <p className="mood-history-export-note">{t(
      "De export bevat alleen de vermeldingen die nu in dit overzicht zijn geladen.",
      "The export includes only the entries currently loaded in this history view.",
    )}</p>}
    {source === "remote" && <p className="mood-history-remote-note">{t("Accountvermeldingen kunnen momenteel niet vanuit dit scherm worden verwijderd.", "Account entries cannot yet be deleted from this screen.")}</p>}
    {loading ? <p>{t("Stemmingen laden…", "Loading mood history…")}</p> : events.length === 0 ? <p>{t("Nog geen stemmingen opgeslagen.", "No moods saved yet.")}</p> : <>
      <div className="mood-history-filters" role="group" aria-label={t("Filter op fase", "Filter by phase")}>
        {filterOptions.map((option) => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => { setFilter(option.value); setVisibleCount(10); }}>{option.label}</button>)}
      </div>
      {filteredEvents.length === 0 ? <p>{t("Geen stemmingen in deze fase.", "No moods in this phase.")}</p> : <>
        <p className="mood-history-count" role="status" aria-live="polite">{t(visibleEvents.length + " van " + filteredEvents.length + " vermeldingen getoond.", visibleEvents.length + " of " + filteredEvents.length + " entries shown.")}</p>
        <ol id="mood-history-list">{visibleEvents.map((event) => <li key={event.id}>
          <span className="mood-history-phase">{language === "nl" ? phaseLabel[event.phase][0] : phaseLabel[event.phase][1]}</span>
          <strong>{label[event.mood][language === "nl" ? 0 : 1]}</strong>
          <time dateTime={event.created_at}>{new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</time>
          {source === "local" && <button className="mood-history-delete" type="button" aria-label={t("Verwijder stemming " + label[event.mood][0], "Delete mood " + label[event.mood][1])} onClick={() => setPendingDelete(event.id)}><Trash2 size={13} /><span>{t("Verwijderen", "Delete")}</span></button>}
          {pendingDelete === event.id && source === "local" && <div className="mood-history-delete-confirm" role="group" aria-label={t("Verwijderen bevestigen", "Confirm deletion")}>
            <span>{t("Deze vermelding alleen van dit apparaat verwijderen?", "Delete this entry from this device only?")}</span>
            <button type="button" onClick={() => removeLocalEvent(event.id)}>{t("Definitief verwijderen", "Delete entry")}</button>
            <button type="button" onClick={() => setPendingDelete(null)}>{t("Annuleren", "Cancel")}</button>
          </div>}
        </li>)}</ol>
        {visibleEvents.length < filteredEvents.length && <button className="mood-history-more" type="button" aria-controls="mood-history-list" onClick={() => setVisibleCount((current) => Math.min(current + 10, filteredEvents.length))}>{t("Meer tonen", "Show more")} · {filteredEvents.length - visibleEvents.length}</button>}
      </>}
    </>}
  </section>;
}
