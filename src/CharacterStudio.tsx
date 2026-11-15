import React, { useEffect, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";

type Role = "dominant" | "submissive" | "switch";
type CharacterLook = { role: Role; neckDetail: "collar" | "chain" | "none"; accessory: "crescent" | "earring" | "sigil"; mask: boolean };
const DEFAULT_LOOK: CharacterLook = { role: "dominant", neckDetail: "collar", accessory: "sigil", mask: false };
const KEY = "afterhours.character-look.v2";

function loadLook(profileId: string): CharacterLook {
  try {
    const raw = localStorage.getItem(KEY + ":" + profileId) ?? localStorage.getItem("afterhours.character-look.v1:" + profileId);
    if (!raw) return DEFAULT_LOOK;
    const old = JSON.parse(raw) as Record<string, unknown>;
    const role: Role = old.role === "submissive" || old.role === "switch" ? old.role : old.gender === "male" ? "submissive" : "dominant";
    const neck = old.neckDetail === "chain" || old.neckDetail === "none" ? old.neckDetail : "collar";
    const accessory = old.accessory === "crescent" || old.accessory === "earring" ? old.accessory : "sigil";
    return { role, neckDetail: neck, accessory, mask: old.mask === true };
  } catch { return DEFAULT_LOOK; }
}

export default function CharacterStudio({ profileId, language = "nl" }: { profileId: string; language?: "nl" | "en" }) {
  const [look, setLook] = useState<CharacterLook>(() => loadLook(profileId));
  const [expanded, setExpanded] = useState(true);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  useEffect(() => { setLook(loadLook(profileId)); }, [profileId]);
  const update = (patch: Partial<CharacterLook>) => {
    const next = { ...look, ...patch };
    setLook(next);
    try { localStorage.setItem(KEY + ":" + profileId, JSON.stringify(next)); } catch { /* Local-only fallback */ }
  };
  const roleName = look.role === "dominant" ? t("Dominant", "Dominant") : look.role === "submissive" ? t("Volgend", "Submissive") : t("Switch", "Switch");
  return <section className="character-studio">
    <button className="character-studio-toggle" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
      <span><Sparkles size={16}/><span><strong>{t("CHARACTER ATELIER", "CHARACTER ATELIER")}</strong><small>{t("Jouw rol. Jouw signatuur. Jouw stijl.", "Your role. Your signature. Your style.")}</small></span></span>
      <ChevronDown className={expanded ? "rotated" : ""} size={17}/>
    </button>
    {expanded && <div className="character-studio-body">
      <div className="character-preview">
        <div className="character-portrait">
          <img src="/visuals/ah-profile-photo.jpg" alt={t("Cinematische AFTER HOURS character-portret", "Cinematic AFTER HOURS character portrait")} loading="lazy"/>
          <span className="character-portrait-mark">{look.accessory === "crescent" ? "☾" : look.accessory === "earring" ? "◉" : "✦"}</span>
          {look.mask && <span className="character-mask-overlay" aria-hidden="true"/>}
          {look.neckDetail !== "none" && <span className={"character-neck-overlay " + look.neckDetail} aria-hidden="true"/>}
          <span className="character-portrait-caption">{roleName.toUpperCase()}</span>
        </div>
        <div className="character-preview-caption"><span className="eyebrow">AFTER HOURS IDENTITY</span><strong>{roleName}</strong><small>{t("Een volwassen, stijlvolle identiteit. Je voorkeuren blijven altijd aanpasbaar.", "A mature, elegant identity. Your preferences remain yours to change.")}</small></div>
      </div>
      <div className="character-options">
        <div className="character-field"><span className="eyebrow">{t("KIES JE ROL", "CHOOSE YOUR ROLE")}</span><div className="character-segment wrap">
          {(["dominant", "submissive", "switch"] as Role[]).map(role => <button key={role} className={look.role === role ? "selected" : ""} aria-pressed={look.role === role} onClick={() => update({ role })}>{role === "dominant" ? t("Dominant", "Dominant") : role === "submissive" ? t("Volgend", "Submissive") : "Switch"}{look.role === role && <Check size={14}/>}</button>)}
        </div></div>
        <div className="character-field"><span className="eyebrow">{t("NEKDETAIL", "NECK DETAIL")}</span><div className="character-segment wrap">
          <button className={look.neckDetail === "collar" ? "selected" : ""} aria-pressed={look.neckDetail === "collar"} onClick={() => update({ neckDetail: "collar" })}>{t("Collar", "Collar")}</button>
          <button className={look.neckDetail === "chain" ? "selected" : ""} aria-pressed={look.neckDetail === "chain"} onClick={() => update({ neckDetail: "chain" })}>{t("Ketting", "Chain")}</button>
          <button className={look.neckDetail === "none" ? "selected" : ""} aria-pressed={look.neckDetail === "none"} onClick={() => update({ neckDetail: "none" })}>{t("Geen", "None")}</button>
        </div></div>
        <div className="character-field"><span className="eyebrow">{t("SIGNATUURDETAIL", "SIGNATURE DETAIL")}</span><div className="character-segment wrap">
          <button className={look.accessory === "sigil" ? "selected" : ""} aria-pressed={look.accessory === "sigil"} onClick={() => update({ accessory: "sigil" })}>Sigil</button>
          <button className={look.accessory === "crescent" ? "selected" : ""} aria-pressed={look.accessory === "crescent"} onClick={() => update({ accessory: "crescent" })}>{t("Halvemaan", "Crescent")}</button>
          <button className={look.accessory === "earring" ? "selected" : ""} aria-pressed={look.accessory === "earring"} onClick={() => update({ accessory: "earring" })}>{t("Oorbel", "Earring")}</button>
        </div></div>
        <label className="character-mask-toggle"><input type="checkbox" checked={look.mask} onChange={event => update({ mask: event.target.checked })}/><span>{t("Voeg een elegant masker toe aan je signatuur", "Add an elegant mask to your signature")}</span></label>
        <p className="character-save-note">{t("Je character-keuzes worden op dit apparaat bewaard. Je sessievoortgang en XP blijven behouden.", "Your character choices are saved on this device. Your session progress and XP remain unchanged.")}</p>
      </div>
    </div>}
  </section>;
}
