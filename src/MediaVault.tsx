import { useCallback, useEffect, useState } from "react";
import {
  createPrivateMediaUrl,
  deletePrivateMedia,
  listPrivateMedia,
  uploadPrivateMedia,
  type PrivateMediaItem,
} from "./services/media";
import { supabase, supabaseConfigured } from "./services/supabase";

interface MediaVaultProps {
  sessionId: string;
  language?: "nl" | "en";
}

function displayName(name: string): string {
  return name.replace(/^[0-9a-f-]{36}-/i, "");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaVault({ sessionId, language = "nl" }: MediaVaultProps) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const [items, setItems] = useState<PrivateMediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [signedUrl, setSignedUrl] = useState("");
  const [deletingPath, setDeletingPath] = useState("");

  const refresh = useCallback(async (isActive: () => boolean = () => true): Promise<boolean> => {
    if (isActive()) {
      setLoading(true);
      setMessage("");
    }
    try {
      const nextItems = await listPrivateMedia();
      if (isActive()) setItems(nextItems);
      return true;
    } catch (error) {
      if (isActive()) {
        setMessage(error instanceof Error ? error.message : t("Privébestanden konden niet worden geladen.", "Private files could not be loaded."));
      }
      return false;
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabaseConfigured || !supabase) return;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (data.user && active) await refresh(() => active);
        else if (active) setMessage(t("Log in via Session Control om je privékluis te openen.", "Sign in through Session Control to open your private vault."));
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : t("Aanmelden is nodig voor privéopslag.", "Sign-in is required for private storage."));
      }
    }
    void load();
    return () => { active = false; };
  }, [refresh, language]);

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMessage("");
    setSignedUrl("");
    try {
      await uploadPrivateMedia(file, sessionId);
      const refreshed = await refresh();
      setMessage(
        refreshed
          ? t("Bestand veilig geüpload naar je privékluis.", "File safely uploaded to your private vault.")
          : t("Bestand is geüpload, maar de lijst kon niet worden vernieuwd. Tik op Vernieuwen om opnieuw te proberen.", "The file uploaded, but the list could not refresh. Tap Refresh to try again."),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("Uploaden is mislukt.", "Upload failed."));
    } finally {
      setBusy(false);
    }
  };

  const openItem = async (item: PrivateMediaItem) => {
    setBusy(true);
    setMessage("");
    setSignedUrl("");
    try {
      setSignedUrl(await createPrivateMediaUrl(item.path));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("Het bestand kon niet worden geopend.", "The file could not be opened."));
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (path: string) => {
    if (deletingPath !== path) {
      setDeletingPath(path);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await deletePrivateMedia(path);
      setItems(current => current.filter(item => item.path !== path));
      setDeletingPath("");
      setSignedUrl("");
      setMessage(t("Bestand verwijderd.", "File deleted."));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("Verwijderen is mislukt.", "Could not delete the file."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="media-vault auth-panel" aria-labelledby="media-vault-title">
      <span className="eyebrow">{t("PRIVÉOPSLAG", "PRIVATE STORAGE")}</span>
      <h3 id="media-vault-title">{t("Mijn privékluis", "My private vault")}</h3>
      <p>{t("Afbeeldingen en audio blijven privé. Open-links zijn maximaal 60 seconden geldig.", "Images and audio stay private. Open links are valid for up to 60 seconds.")}</p>
      {!supabaseConfigured ? (
        <small role="status">{t("Privéopslag verschijnt zodra Supabase is geconfigureerd.", "Private storage will appear once Supabase is configured.")}</small>
      ) : (
        <>
          <label className="media-upload">
            <span>{busy ? t("Even wachten…", "Please wait…") : t("Afbeelding of audio toevoegen", "Add image or audio")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac"
              disabled={busy}
              onChange={event => {
                const file = event.currentTarget.files?.[0];
                void upload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <div className="media-vault-head">
            <strong>{t("Opgeslagen bestanden", "Saved files")}</strong>
            <button type="button" onClick={() => void refresh()} disabled={loading || busy}>
              {loading ? t("Laden…", "Loading…") : t("Vernieuwen", "Refresh")}
            </button>
          </div>
          {loading ? <small>{t("Privébestanden laden…", "Loading private files…")}</small> : items.length === 0 ? (
            <small>{t("Nog geen bestanden gevonden. Je bestanden zijn alleen zichtbaar na veilig inloggen.", "No files yet. Your files are only visible after you sign in securely.")}</small>
          ) : (
            <div className="media-list">
              {items.map(item => (
                <div className="media-item" key={item.path}>
                  <div className="media-item-copy">
                    <strong>{displayName(item.name)}</strong>
                    <small>{item.contentType ?? t("Privébestand", "Private file")} · {formatSize(item.size)}</small>
                  </div>
                  {deletingPath === item.path ? (
                    <div className="media-item-actions">
                      <button type="button" onClick={() => void removeItem(item.path)} disabled={busy}>{t("Bevestig", "Confirm")}</button>
                      <button type="button" onClick={() => setDeletingPath("")} disabled={busy}>{t("Annuleer", "Cancel")}</button>
                    </div>
                  ) : (
                    <div className="media-item-actions">
                      <button type="button" onClick={() => void openItem(item)} disabled={busy}>{t("Open", "Open")}</button>
                      <button type="button" onClick={() => void removeItem(item.path)} disabled={busy}>{t("Verwijder", "Delete")}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {signedUrl && <a className="media-signed-link" href={signedUrl} target="_blank" rel="noopener noreferrer">{t("Open privébestand (link verloopt na 60 seconden)", "Open private file (link expires after 60 seconds)")}</a>}
          {message && <small role="status">{message}</small>}
        </>
      )}
    </section>
  );
}
