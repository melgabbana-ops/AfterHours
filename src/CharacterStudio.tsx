import React, { useEffect, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";

type Language = "nl" | "en";
type Gender = "female" | "male";
type CharacterLook = {
  gender: Gender;
  skin: string;
  hair: string;
  hairStyle: string;
  outfit: string;
  mask: boolean;
  neckDetail: string;
  accessory: string;
};
const DEFAULT_LOOK: CharacterLook = {
  gender: "female", skin: "#B97855", hair: "#21151B", hairStyle: "waves",
  outfit: "#171019", mask: false, neckDetail: "collar", accessory: "crescent",
};
const SKINS = [
  { label: "Porcelain", color: "#F1D4C2" }, { label: "Warm", color: "#DCA889" },
  { label: "Bronze", color: "#B97855" }, { label: "Deep", color: "#784833" },
  { label: "Ebony", color: "#4D3028" },
];
const HAIRS = [
  { label: "Midnight", color: "#21151B" }, { label: "Espresso", color: "#4A2B22" },
  { label: "Auburn", color: "#793B2B" }, { label: "Platinum", color: "#C6B5A1" },
  { label: "Violet", color: "#8D744C" },
];
const OUTFITS = [
  { label: "Obsidian", color: "#171019" }, { label: "Violet", color: "#211C13" },
  { label: "Burgundy", color: "#451B2A" }, { label: "Gold accent", color: "#332711" },
];
const HAIR_STYLES = [
  { id: "waves", nl: "Golvend", en: "Waves" }, { id: "sleek", nl: "Strak", en: "Sleek" },
  { id: "short", nl: "Kort", en: "Short" }, { id: "curls", nl: "Krullen", en: "Curls" },
];
const KEY = "afterhours.character-look.v1";

function loadLook(profileId: string): CharacterLook {
  try {
    const raw = localStorage.getItem(KEY + ":" + profileId);
    if (!raw) return DEFAULT_LOOK;
    const parsed = JSON.parse(raw) as Partial<CharacterLook>;
    return { ...DEFAULT_LOOK, ...parsed, gender: parsed.gender === "male" ? "male" : "female" };
  } catch { return DEFAULT_LOOK; }
}
function AvatarArt({ look }: { look: CharacterLook }) {
  const longHair = look.hairStyle === "waves" || look.hairStyle === "curls";
  const shortHair = look.hairStyle === "short" || (look.gender === "male" && look.hairStyle === "sleek");
  return <svg className="character-art" viewBox="0 0 240 300" role="img" aria-label="AFTER HOURS custom character portrait">
    <defs>
      <linearGradient id="ahPortraitGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9a713e" stopOpacity=".38"/><stop offset="1" stopColor="#050505" stopOpacity="0"/></linearGradient>
      <linearGradient id="ahGoldLine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3d49a"/><stop offset="1" stopColor="#8e642d"/></linearGradient>
      <linearGradient id="ahVelvet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={look.outfit}/><stop offset="1" stopColor="#050505"/></linearGradient>
    </defs>
    <rect width="240" height="300" rx="14" fill="#080706"/>
    <ellipse cx="120" cy="132" rx="104" ry="132" fill="url(#ahPortraitGlow)"/>
    <path d="M18 284 Q22 226 70 208 L97 192 L143 192 L170 208 Q218 228 222 284Z" fill="url(#ahVelvet)" stroke="#98713c" strokeOpacity=".68" strokeWidth="1.2"/>
    <path d="M77 211 L99 193 L120 224 L143 193 L164 211 L151 257 L89 257Z" fill="#090807" stroke="url(#ahGoldLine)" strokeOpacity=".8" strokeWidth="1.2"/>
    <path d="M96 190 L120 223 L144 190 L136 175 L104 175Z" fill={look.skin}/>
    {longHair && <path d={look.hairStyle === "curls" ? "M67 104 Q43 35 91 28 Q124 5 158 31 Q197 45 174 119 L174 183 Q158 202 147 151 L91 160 Q79 203 64 179Z" : "M68 104 Q47 28 95 25 Q133 5 160 35 Q194 48 174 119 L171 181 Q157 196 150 150 L85 155 Q77 194 66 176Z"} fill={look.hair}/>}
    <path d="M84 70 Q120 42 156 70 L161 133 Q155 172 120 184 Q85 172 79 133Z" fill={look.skin} stroke="#8b5b47" strokeOpacity=".55" strokeWidth=".8"/>
    {shortHair && <path d="M78 92 Q69 38 111 31 Q153 28 162 75 L155 102 Q136 76 120 67 Q101 82 81 99Z" fill={look.hair}/>}
    {!shortHair && <path d="M79 96 Q70 50 96 31 Q123 15 151 37 Q170 54 160 98 Q140 74 120 66 Q102 81 79 96Z" fill={look.hair}/>}
    <path d="M90 119 Q120 128 150 119" fill="none" stroke="#9b7452" strokeOpacity=".24" strokeWidth="1"/>
    {look.mask && <path d="M81 104 Q120 89 159 104 L151 137 Q120 148 89 137Z" fill="#100d09" stroke="url(#ahGoldLine)" strokeWidth="1.6"/>}
    {look.neckDetail === "collar" && <><path d="M92 183 Q120 198 148 183 L153 197 Q120 214 87 197Z" fill="#080706" stroke="url(#ahGoldLine)" strokeWidth="2"/><circle cx="120" cy="204" r="4" fill="#d7a84f"/></>}
    {look.neckDetail === "chain" && <><path d="M94 183 Q120 215 146 183" stroke="url(#ahGoldLine)" strokeWidth="2" fill="none"/><circle cx="120" cy="207" r="4" fill="#d7a84f"/></>}
    {look.accessory === "crescent" && <path d="M154 74 A11 11 0 1 0 168 91 A9 9 0 0 1 154 74Z" fill="#e1c17b" stroke="#6f532a" strokeWidth=".8"/>}
    {look.accessory === "earring" && <><circle cx="82" cy="137" r="3" fill="#d7a84f"/><path d="M82 140v8l5 5" stroke="#d7a84f" strokeWidth="1.5" fill="none"/></>}
    {look.accessory === "sigil" && <><path d="M120 235l7 8-7 8-7-8Z" fill="none" stroke="#d7a84f" strokeWidth="1.5"/><circle cx="120" cy="243" r="15" fill="none" stroke="#8e642d" strokeWidth=".8"/></>}
    <rect x="8" y="8" width="224" height="284" rx="10" fill="none" stroke="url(#ahGoldLine)" strokeOpacity=".62" strokeWidth="1.2"/>
    <path d="M17 46V17h29M194 17h29v29M17 254v29h29M194 283h29v-29" fill="none" stroke="#d7a84f" strokeWidth="1.6"/>
  </svg>;
}

export default function CharacterStudio({ profileId, language = "nl" }: { profileId: string; language?: Language }) {
  const [look, setLook] = useState<CharacterLook>(() => loadLook(profileId));
  const [expanded, setExpanded] = useState(true);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  useEffect(() => { setLook(loadLook(profileId)); }, [profileId]);
  const update = (patch: Partial<CharacterLook>) => {
    const next = { ...look, ...patch };
    setLook(next);
    try { localStorage.setItem(KEY + ":" + profileId, JSON.stringify(next)); } catch { /* local-only fallback */ }
  };
  return <section className="character-studio">
    <button className="character-studio-toggle" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
      <span><Sparkles size={15}/><span><strong>{t("CHARACTER STUDIO", "CHARACTER STUDIO")}</strong><small>{t("Jouw identiteit. Jouw evolutie.", "Your identity. Your evolution.")}</small></span></span>
      <ChevronDown className={expanded ? "rotated" : ""} size={17}/>
    </button>
    {expanded && <div className="character-studio-body">
      <div className="character-preview"><AvatarArt look={look}/><div className="character-preview-caption"><span className="eyebrow">AFTER HOURS IDENTITY</span><strong>{look.gender === "female" ? t("The Femme", "The Femme") : t("The Masque", "The Masque")}</strong><small>{t("Cosmetische identiteit · altijd aanpasbaar", "Cosmetic identity · always customizable")}</small></div></div>
      <div className="character-options">
        <div className="character-field"><span className="eyebrow">{t("KIES JE CHARACTER", "CHOOSE YOUR CHARACTER")}</span><div className="character-segment">
          <button className={look.gender === "female" ? "selected" : ""} aria-pressed={look.gender === "female"} onClick={() => update({ gender: "female" })}>{t("Vrouwelijk", "Feminine")}{look.gender === "female" && <Check size={14}/>}</button>
          <button className={look.gender === "male" ? "selected" : ""} aria-pressed={look.gender === "male"} onClick={() => update({ gender: "male" })}>{t("Mannelijk", "Masculine")}{look.gender === "male" && <Check size={14}/>}</button>
        </div></div>
        <div className="character-field"><span className="eyebrow">{t("HUIDTINT", "SKIN TONE")}</span><div className="character-swatches">{SKINS.map((item) => <button key={item.color} className={look.skin === item.color ? "selected" : ""} aria-pressed={look.skin === item.color} onClick={() => update({ skin: item.color })} aria-label={item.label} title={item.label} style={{ background: item.color }}>{look.skin === item.color && <Check size={13}/>}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("HAARKLEUR", "HAIR COLOUR")}</span><div className="character-swatches">{HAIRS.map((item) => <button key={item.color} className={look.hair === item.color ? "selected" : ""} aria-pressed={look.hair === item.color} onClick={() => update({ hair: item.color })} aria-label={item.label} title={item.label} style={{ background: item.color }}>{look.hair === item.color && <Check size={13}/>}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("HAARSTIJL", "HAIR STYLE")}</span><div className="character-segment wrap">{HAIR_STYLES.map((item) => <button key={item.id} className={look.hairStyle === item.id ? "selected" : ""} aria-pressed={look.hairStyle === item.id} onClick={() => update({ hairStyle: item.id })}>{t(item.nl, item.en)}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("OUTFIT", "OUTFIT")}</span><div className="character-swatches outfit-swatches">{OUTFITS.map((item) => <button key={item.color} className={look.outfit === item.color ? "selected" : ""} aria-pressed={look.outfit === item.color} onClick={() => update({ outfit: item.color })} aria-label={item.label} title={item.label} style={{ background: item.color }}>{look.outfit === item.color && <Check size={13}/>}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("DETAILS", "DETAILS")}</span><div className="character-segment wrap">
          <button className={look.neckDetail === "collar" ? "selected" : ""} aria-pressed={look.neckDetail === "collar"} onClick={() => update({ neckDetail: "collar" })}>{t("Collar", "Collar")}</button>
          <button className={look.neckDetail === "chain" ? "selected" : ""} aria-pressed={look.neckDetail === "chain"} onClick={() => update({ neckDetail: "chain" })}>{t("Ketting", "Chain")}</button>
          <button className={look.neckDetail === "none" ? "selected" : ""} aria-pressed={look.neckDetail === "none"} onClick={() => update({ neckDetail: "none" })}>{t("Geen", "None")}</button>
          <button className={look.accessory === "crescent" ? "selected" : ""} aria-pressed={look.accessory === "crescent"} onClick={() => update({ accessory: "crescent" })}>{t("Halvemaan", "Crescent")}</button>
          <button className={look.accessory === "earring" ? "selected" : ""} aria-pressed={look.accessory === "earring"} onClick={() => update({ accessory: "earring" })}>{t("Oorbel", "Earring")}</button>
          <button className={look.accessory === "sigil" ? "selected" : ""} aria-pressed={look.accessory === "sigil"} onClick={() => update({ accessory: "sigil" })}>Sigil</button>
        </div></div>
        <label className="character-mask-toggle"><input type="checkbox" checked={look.mask} onChange={(event) => update({ mask: event.target.checked })}/><span>{t("Voeg een elegant masker toe", "Add an elegant mask")}</span></label>
        <p className="character-save-note">{t("Je look wordt op dit apparaat bewaard. Spelvoortgang, XP en ranks blijven voor ieder character gelijk.", "Your look is saved on this device. Gameplay, XP and ranks remain the same for every character.")}</p>
      </div>
    </div>}
  </section>;
}
