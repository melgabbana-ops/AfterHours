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
}

function displayName(name: string): string {
  return name.replace(/^[0-9a-f-]{36}-/i, "");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaVault({ sessionId }: MediaVaultProps) {
  const [items, setItems] = useState<PrivateMediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [signedUrl, setSignedUrl] = useState("");
  const [deletingPath, setDeletingPath] = useState("");

  const refresh = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setMessage("");
    try {
      setItems(await listPrivateMedia());
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Privébestanden konden niet worden geladen.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabaseConfigured || !supabase) return;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (data.user && active) await refresh();
        else if (active) setMessage("Log in via Session control om je privékluis te openen.");
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Aanmelden is nodig voor privéopslag.");
      }
    }
    void load();
    return () => { active = false; };
  }, [refresh]);

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
          ? "Bestand veilig geüpload naar je privékluis."
          : "Bestand is geüpload, maar de lijst kon niet worden vernieuwd. Tik op Vernieuwen om opnieuw te proberen.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Uploaden is mislukt.");
    } finally {
      setBusy(false);
    }
  };

  const openItem = async (item: PrivateMediaItem) => {
    setBusy(true);
    setMessage("");
    // Never leave a previously signed URL visible if opening the next item fails.
    setSignedUrl("");
    try {
      setSignedUrl(await createPrivateMediaUrl(item.path));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Het bestand kon niet worden geopend.");
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
      setMessage("Bestand verwijderd.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verwijderen is mislukt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="media-vault auth-panel" aria-labelledby="media-vault-title">
      <span className="eyebrow">PRIVATE STORAGE</span>
      <h3 id="media-vault-title">Mijn privékluis</h3>
      <p>Afbeeldingen en audio blijven privé. Open-links zijn maximaal 60 seconden geldig.</p>
      {!supabaseConfigured ? (
        <small role="status">Privéopslag verschijnt zodra Supabase is geconfigureerd.</small>
      ) : (
        <>
          <label className="media-upload">
            <span>{busy ? "Even wachten…" : "Afbeelding of audio toevoegen"}</span>
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
            <strong>Opgeslagen bestanden</strong>
            <button type="button" onClick={() => void refresh()} disabled={loading || busy}>
              {loading ? "Laden…" : "Vernieuwen"}
            </button>
          </div>
          {loading ? <small>Privébestanden laden…</small> : items.length === 0 ? (
            <small>Nog geen bestanden gevonden. Je bestanden zijn alleen zichtbaar na veilig inloggen.</small>
          ) : (
            <div className="media-list">
              {items.map(item => (
                <div className="media-item" key={item.path}>
                  <div className="media-item-copy">
                    <strong>{displayName(item.name)}</strong>
                    <small>{item.contentType ?? "Privébestand"} · {formatSize(item.size)}</small>
                  </div>
                  {deletingPath === item.path ? (
                    <div className="media-item-actions">
                      <button type="button" onClick={() => void removeItem(item.path)} disabled={busy}>Bevestig</button>
                      <button type="button" onClick={() => setDeletingPath("")} disabled={busy}>Annuleer</button>
                    </div>
                  ) : (
                    <div className="media-item-actions">
                      <button type="button" onClick={() => void openItem(item)} disabled={busy}>Open</button>
                      <button type="button" onClick={() => void removeItem(item.path)} disabled={busy}>Verwijder</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {signedUrl && <a className="media-signed-link" href={signedUrl} target="_blank" rel="noopener noreferrer">Open privébestand (link verloopt na 60 seconden)</a>}
          {message && <small role="status">{message}</small>}
        </>
      )}
    </section>
  );
}
