import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, LockKeyhole, LockOpen, Plus, Save, Trash2 } from "lucide-react";
import {
  createPrivateJournalVault,
  deletePrivateJournalEntry,
  hasPrivateJournalVault,
  loadPrivateJournalEntries,
  PRIVATE_JOURNAL_ENTRY_LIMIT,
  PRIVATE_JOURNAL_MIN_PASSPHRASE,
  savePrivateJournalEntry,
  unlockPrivateJournalVault,
  type PrivateJournalEntry,
} from "./services/privateJournal";
import "./private-journal.css";

type Language = "nl" | "en";
export default function AftercareJournal({ language, onClose }: { language: Language; onClose: () => void }) {
  const [vaultExists, setVaultExists] = useState(() => hasPrivateJournalVault());
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [entries, setEntries] = useState<PrivateJournalEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lockGeneration = useRef(0);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;

  const lock = useCallback(() => {
    lockGeneration.current += 1;
    setKey(null);
    setEntries([]);
    setActiveId(null);
    setTitle("");
    setBody("");
    setPassphrase("");
    setConfirmation("");
    setBusy(false);
    setMessage(language === "nl"
      ? "Journal automatisch vergrendeld toen de app naar de achtergrond ging. Niet-opgeslagen tekst is gewist."
      : "Journal automatically locked when the app went into the background. Unsaved text was cleared.");
    setError("");
  }, [language]);

  useEffect(() => {
    const lockWhenHidden = () => {
      if (document.visibilityState !== "visible") lock();
    };
    const lockOnPageHide = () => lock();
    document.addEventListener("visibilitychange", lockWhenHidden);
    window.addEventListener("pagehide", lockOnPageHide);
    lockWhenHidden();
    return () => {
      document.removeEventListener("visibilitychange", lockWhenHidden);
      window.removeEventListener("pagehide", lockOnPageHide);
    };
  }, [lock]);

  const openVault = async (event: React.FormEvent) => {
    event.preventDefault();
    const generation = lockGeneration.current;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let unlocked: CryptoKey;
      if (vaultExists) {
        unlocked = await unlockPrivateJournalVault(passphrase);
      } else {
        if (passphrase !== confirmation) throw new Error(t("De wachtzinnen komen niet overeen.", "The passphrases do not match."));
        unlocked = await createPrivateJournalVault(passphrase, undefined, () => generation === lockGeneration.current && document.visibilityState === "visible");
        setVaultExists(true);
      }
      const loaded = await loadPrivateJournalEntries(unlocked);
      if (generation !== lockGeneration.current || document.visibilityState !== "visible") return;
      setKey(unlocked);
      setEntries(loaded);
      setActiveId(null);
      setTitle("");
      setBody("");
      setPassphrase("");
      setConfirmation("");
      setMessage(t("Je privékluis is ontgrendeld.", "Your private vault is unlocked."));
    } catch (reason) {
      if (generation === lockGeneration.current) setError(reason instanceof Error ? reason.message : t("Ontgrendelen is niet gelukt.", "Could not unlock the vault."));
    } finally {
      if (generation === lockGeneration.current) setBusy(false);
    }
  };

  const startNew = () => {
    setActiveId(null);
    setTitle("");
    setBody("");
    setMessage("");
    setError("");
  };
  const openEntry = (entry: PrivateJournalEntry) => {
    setActiveId(entry.id);
    setTitle(entry.title);
    setBody(entry.body);
    setMessage("");
    setError("");
  };
  const save = async () => {
    if (!key) return;
    const generation = lockGeneration.current;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const canCommit = () => generation === lockGeneration.current && document.visibilityState === "visible";
      const saved = await savePrivateJournalEntry(key, { title, body }, activeId ?? undefined, undefined, undefined, canCommit);
      const loaded = await loadPrivateJournalEntries(key);
      if (!canCommit()) return;
      setEntries(loaded);
      setActiveId(saved.id);
      setTitle(saved.title);
      setBody(saved.body);
      setMessage(t("Versleuteld opgeslagen op dit apparaat.", "Encrypted and saved on this device."));
    } catch (reason) {
      if (generation === lockGeneration.current) setError(reason instanceof Error ? reason.message : t("Opslaan is niet gelukt.", "Could not save the entry."));
    } finally {
      if (generation === lockGeneration.current) setBusy(false);
    }
  };
  const remove = () => {
    if (!activeId || !window.confirm(t("Deze journalnotitie definitief verwijderen?", "Permanently delete this journal entry?"))) return;
    if (!deletePrivateJournalEntry(activeId)) {
      setError(t("Verwijderen is niet gelukt.", "Could not delete the entry."));
      return;
    }
    setEntries(current => current.filter(entry => entry.id !== activeId));
    startNew();
    setMessage(t("Notitie verwijderd.", "Entry deleted."));
  };
  return <section className="ah-private-journal" aria-labelledby="ah-private-journal-title">
    <header className="ah-private-journal-head">
      <div className="ah-private-journal-brand"><LockKeyhole aria-hidden="true"/><span className="eyebrow">AFTER HOURS · PRIVATE JOURNAL</span></div>
      <button type="button" className="ah-journal-close" onClick={onClose}><ArrowLeft size={15}/>{t("Terug","Back")}</button>
    </header>
    <div className="ah-private-journal-intro">
      <span className="ah-journal-mark"><BookOpen aria-hidden="true"/></span>
      <h3 id="ah-private-journal-title">{t("Jouw stille ruimte","Your private space")}</h3>
      <p>{t("Een plek voor gedachten, reflecties en herinneringen. Alleen jij bepaalt wat hier blijft.", "A place for thoughts, reflections and memories. You decide what stays here.")}</p>
    </div>
    {!key ? <form className="ah-journal-unlock" onSubmit={openVault}>
      <span className="eyebrow">{vaultExists ? t("KLUIS VERGRENDELD","VAULT LOCKED") : t("NIEUWE PRIVÉKLUIS","NEW PRIVATE VAULT")}</span>
      <label htmlFor="ah-journal-passphrase">{t("Wachtzin","Passphrase")}</label>
      <input id="ah-journal-passphrase" type="password" value={passphrase} onChange={event=>setPassphrase(event.target.value)} minLength={PRIVATE_JOURNAL_MIN_PASSPHRASE} autoComplete="current-password" required/>
      {!vaultExists && <><label htmlFor="ah-journal-confirm">{t("Herhaal wachtzin","Confirm passphrase")}</label><input id="ah-journal-confirm" type="password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} minLength={PRIVATE_JOURNAL_MIN_PASSPHRASE} autoComplete="new-password" required/><small>{t("Gebruik minimaal 12 tekens. Een lange, unieke wachtzin werkt het best.", "Use at least 12 characters. A long, unique passphrase works best.")}</small></>}
      <button className="ah-journal-primary" type="submit" disabled={busy||passphrase.length<PRIVATE_JOURNAL_MIN_PASSPHRASE||(!vaultExists&&confirmation.length<PRIVATE_JOURNAL_MIN_PASSPHRASE)}><LockOpen size={15}/>{busy?t("Even geduld…","Please wait…"):vaultExists?t("Kluis ontgrendelen","Unlock vault"):t("Privékluis aanmaken","Create private vault")}</button>
    </form> : <div className="ah-journal-workspace">
      <aside className="ah-journal-list">
        <div className="ah-journal-list-head"><span className="eyebrow">{t("JOURNAAL","JOURNAL")} · {entries.length}</span><button type="button" onClick={startNew} aria-label={t("Nieuwe notitie","New entry")}><Plus size={16}/></button></div>
        {entries.length===0?<p className="ah-journal-empty">{t("Je kluis is nog leeg. Begin wanneer je wilt.", "Your vault is empty. Begin whenever you like.")}</p>:entries.map(entry=><button type="button" key={entry.id} className={activeId===entry.id?"active":""} onClick={()=>openEntry(entry)}><strong>{entry.title}</strong><small>{new Date(entry.updatedAt).toLocaleDateString(language==="en"?"en-GB":"nl-NL")}</small></button>)}
      </aside>
      <div className="ah-journal-editor">
        <label htmlFor="ah-journal-title">{t("TITEL","TITLE")}</label>
        <input id="ah-journal-title" value={title} maxLength={120} onChange={event=>setTitle(event.target.value)} placeholder={t("Een moment om te bewaren…","A moment to remember…")}/>
        <label htmlFor="ah-journal-body">{t("JOUW REFLECTIE","YOUR REFLECTION")}</label>
        <textarea id="ah-journal-body" value={body} maxLength={PRIVATE_JOURNAL_ENTRY_LIMIT} rows={8} onChange={event=>setBody(event.target.value)} placeholder={t("Schrijf vrijuit. Je woorden worden versleuteld voordat ze worden opgeslagen.", "Write freely. Your words are encrypted before they are stored.")}/>
        <small className="ah-journal-count">{body.length.toLocaleString(language==="en"?"en-GB":"nl-NL")} / {PRIVATE_JOURNAL_ENTRY_LIMIT}</small>
        <div className="ah-journal-actions"><button type="button" className="ah-journal-primary" onClick={()=>void save()} disabled={busy||(!title.trim()&&!body.trim())}><Save size={15}/>{t("Versleuteld opslaan","Save encrypted")}</button>{activeId&&<button type="button" className="ah-journal-delete" onClick={remove}><Trash2 size={15}/>{t("Verwijderen","Delete")}</button>}</div>
      </div>
      <div className="ah-journal-lock-row"><span><LockKeyhole size={13}/>{t("Kluis ontgrendeld op dit apparaat","Vault unlocked on this device")}</span><button type="button" onClick={lock}>{t("Vergrendelen","Lock vault")}</button></div>
    </div>}
    <div className="ah-journal-privacy"><LockKeyhole size={15}/><p>{t("Je notitietekst wordt lokaal versleuteld met AES‑GCM 256-bit. Je wachtzin wordt niet opgeslagen. Zonder wachtzin is herstel niet mogelijk. Dit dagboek wordt niet gesynchroniseerd met je account of andere apparaten.", "Your journal text is encrypted locally with AES‑GCM 256-bit. Your passphrase is never stored. Without it, recovery is impossible. This journal is not synced to your account or other devices.")}</p></div>
    {error&&<p className="ah-journal-error" role="alert">{error}</p>}
    {message&&<p className="ah-journal-message" role="status">{message}</p>}
  </section>;
}
