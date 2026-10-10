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
  { label: "Violet", color: "#5D3470" },
];
const OUTFITS = [
  { label: "Obsidian", color: "#171019" }, { label: "Violet", color: "#32163D" },
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
      <linearGradient id="ahPortraitGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7E2C9A" stopOpacity=".55"/><stop offset="1" stopColor="#0A080D" stopOpacity="0"/></linearGradient>
      <linearGradient id="ahGoldLine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4D991"/><stop offset="1" stopColor="#8E642D"/></linearGradient>
    </defs>
    <rect width="240" height="300" rx="14" fill="#09070B"/>
    <ellipse cx="123" cy="122" rx="94" ry="118" fill="url(#ahPortraitGlow)"/>
    <path d="M18 281 Q22 218 75 203 L96 195 L143 195 L165 203 Q220 222 222 281 Z" fill={look.outfit} stroke="#6F532A" strokeWidth="1.4"/>
    <path d="M77 211 L98 193 L120 225 L143 193 L164 211 L151 252 L91 252 Z" fill="#08070A" stroke="#C39A4C" strokeWidth="1.4"/>
    <path d="M95 194 L120 224 L145 194 L136 183 L104 183 Z" fill={look.skin}/>
    {longHair && <path d={look.hairStyle === "curls" ? "M68 91 Q48 31 91 34 Q124 13 153 36 Q193 39 173 108 L169 181 Q151 200 148 154 L91 164 Q84 194 68 174 Z" : "M68 96 Q49 28 95 31 Q132 12 157 36 Q190 48 172 112 L170 177 Q157 192 151 151 L83 154 Q77 188 67 171 Z"} fill={look.hair}/>}
    <path d="M86 72 Q120 47 154 72 L159 132 Q154 170 121 180 Q88 170 82 132 Z" fill={look.skin} stroke="#8B5B47" strokeWidth=".8"/>
    {shortHair && <path d="M81 89 Q70 43 111 39 Q150 34 159 70 L153 96 Q135 75 121 70 Q102 83 82 96 Z" fill={look.hair}/>}
    {!shortHair && <path d="M82 94 Q72 54 95 39 Q120 24 148 43 Q167 54 159 95 Q140 74 121 68 Q105 83 82 94 Z" fill={look.hair}/>}
    <path d="M96 111 Q104 106 110 111 M132 111 Q139 106 146 111" stroke="#3B2525" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M121 114 L117 129 L124 130" stroke="#885B49" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    <path d="M111 145 Q121 151 132 144" stroke="#633A36" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    {look.mask && <path d="M84 105 Q120 91 156 105 L150 132 Q121 145 90 132 Z" fill="#100C14" stroke="url(#ahGoldLine)" strokeWidth="1.6"/>}
    {look.neckDetail === "collar" && <><path d="M94 185 Q120 198 147 185 L151 197 Q120 212 90 197 Z" fill="#09070B" stroke="url(#ahGoldLine)" strokeWidth="2"/><circle cx="120" cy="203" r="4" fill="#D7AE5D"/></>}
    {look.neckDetail === "chain" && <><path d="M95 185 Q120 214 145 185" stroke="url(#ahGoldLine)" strokeWidth="2" fill="none"/><circle cx="120" cy="207" r="4" fill="#D7AE5D"/></>}
    {look.neckDetail === "none" && null}
    {look.accessory === "crescent" && <path d="M154 75 A11 11 0 1 0 167 90 A9 9 0 0 1 154 75 Z" fill="#E1C17B" stroke="#6F532A" strokeWidth=".8"/>}
    {look.accessory === "earring" && <><circle cx="83" cy="135" r="3" fill="#D7AE5D"/><path d="M83 138 L83 147 L88 151" stroke="#D7AE5D" strokeWidth="1.5" fill="none"/></>}
    {look.accessory === "sigil" && <><path d="M120 234 l7 8 -7 8 -7 -8 Z" fill="none" stroke="#D7AE5D" strokeWidth="1.5"/><circle cx="120" cy="242" r="15" fill="none" stroke="#6F532A" strokeWidth=".8"/></>}
    <rect x="8" y="8" width="224" height="284" rx="10" fill="none" stroke="url(#ahGoldLine)" strokeOpacity=".65" strokeWidth="1.2"/>
    <path d="M17 46 V17 H46 M194 17 H223 V46 M17 254 V283 H46 M194 283 H223 V254" fill="none" stroke="#D7AE5D" strokeWidth="2"/>
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
          <button className={look.gender === "female" ? "selected" : ""} onClick={() => update({ gender: "female" })}>{t("Vrouwelijk", "Feminine")}{look.gender === "female" && <Check size={14}/>}</button>
          <button className={look.gender === "male" ? "selected" : ""} onClick={() => update({ gender: "male" })}>{t("Mannelijk", "Masculine")}{look.gender === "male" && <Check size={14}/>}</button>
        </div></div>
        <div className="character-field"><span className="eyebrow">{t("HUIDTINT", "SKIN TONE")}</span><div className="character-swatches">{SKINS.map((item) => <button key={item.color} className={look.skin === item.color ? "selected" : ""} onClick={() => update({ skin: item.color })} aria-label={item.label} title={item.label} style={{ background: item.color }}>{look.skin === item.color && <Check size={13}/>}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("HAARKLEUR", "HAIR COLOUR")}</span><div className="character-swatches">{HAIRS.map((item) => <button key={item.color} className={look.hair === item.color ? "selected" : ""} onClick={() => update({ hair: item.color })} aria-label={item.label} title={item.label} style={{ background: item.color }}>{look.hair === item.color && <Check size={13}/>}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("HAARSTIJL", "HAIR STYLE")}</span><div className="character-segment wrap">{HAIR_STYLES.map((item) => <button key={item.id} className={look.hairStyle === item.id ? "selected" : ""} onClick={() => update({ hairStyle: item.id })}>{t(item.nl, item.en)}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("OUTFIT", "OUTFIT")}</span><div className="character-swatches outfit-swatches">{OUTFITS.map((item) => <button key={item.color} className={look.outfit === item.color ? "selected" : ""} onClick={() => update({ outfit: item.color })} aria-label={item.label} title={item.label} style={{ background: item.color }}>{look.outfit === item.color && <Check size={13}/>}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("DETAILS", "DETAILS")}</span><div className="character-segment wrap">
          <button className={look.neckDetail === "collar" ? "selected" : ""} onClick={() => update({ neckDetail: "collar" })}>{t("Collar", "Collar")}</button>
          <button className={look.neckDetail === "chain" ? "selected" : ""} onClick={() => update({ neckDetail: "chain" })}>{t("Ketting", "Chain")}</button>
          <button className={look.neckDetail === "none" ? "selected" : ""} onClick={() => update({ neckDetail: "none" })}>{t("Geen", "None")}</button>
          <button className={look.accessory === "crescent" ? "selected" : ""} onClick={() => update({ accessory: "crescent" })}>{t("Halvemaan", "Crescent")}</button>
          <button className={look.accessory === "earring" ? "selected" : ""} onClick={() => update({ accessory: "earring" })}>{t("Oorbel", "Earring")}</button>
          <button className={look.accessory === "sigil" ? "selected" : ""} onClick={() => update({ accessory: "sigil" })}>Sigil</button>
        </div></div>
        <label className="character-mask-toggle"><input type="checkbox" checked={look.mask} onChange={(event) => update({ mask: event.target.checked })}/><span>{t("Voeg een elegant masker toe", "Add an elegant mask")}</span></label>
        <p className="character-save-note">{t("Je look wordt op dit apparaat bewaard. Spelvoortgang, XP en ranks blijven voor ieder character gelijk.", "Your look is saved on this device. Gameplay, XP and ranks remain the same for every character.")}</p>
      </div>
    </div>}
  </section>;
}
