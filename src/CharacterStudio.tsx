import React, { useEffect, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { rankProgressFromXp } from "./progression";
import "./CharacterRankEvolution.css";

type Language = "nl" | "en";
type Gender = "female" | "male";
type TattooStyle = "ornamental" | "roses" | "script";
type OutfitStyle = "harness" | "leather" | "corset";
type DynamicRole = "dominant" | "sub" | "slave" | "switch";
type CharacterLook = {
  gender: Gender;
  skin: string;
  hair: string;
  hairStyle: string;
  outfit: string;
  mask: boolean;
  tattoos: boolean;
  tattooStyle: TattooStyle;
  outfitStyle: OutfitStyle;
  dynamicRole: DynamicRole;
  neckDetail: string;
  accessory: string;
};
const DEFAULT_LOOK: CharacterLook = {
  gender: "female", skin: "#B97855", hair: "#21151B", hairStyle: "waves",
  outfit: "#100e0a", mask: false, tattoos: true, tattooStyle: "ornamental", outfitStyle: "harness", dynamicRole: "sub", neckDetail: "collar", accessory: "crescent",
};
const SKINS = [
  { label: "Porcelain", color: "#F1D4C2" }, { label: "Warm", color: "#DCA889" },
  { label: "Bronze", color: "#B97855" }, { label: "Deep", color: "#784833" },
  { label: "Ebony", color: "#4D3028" },
];
const HAIRS = [
  { label: "Midnight", color: "#21151B" }, { label: "Espresso", color: "#4A2B22" },
  { label: "Auburn", color: "#793B2B" }, { label: "Platinum", color: "#C6B5A1" },
  { label: "Bronze", color: "#8D744C" },
];
const OUTFITS = [
  { label: "Obsidian", color: "#100e0a" }, { label: "Espresso", color: "#241b11" },
  { label: "Warm umber", color: "#3b2a1b" }, { label: "Gold accent", color: "#332711" },
];
const HAIR_STYLES = [
  { id: "waves", nl: "Golvend", en: "Waves" }, { id: "sleek", nl: "Strak", en: "Sleek" },
  { id: "short", nl: "Kort", en: "Short" }, { id: "curls", nl: "Krullen", en: "Curls" },
];
const KEY = "afterhours.character-look.v1";

export function normalizeCharacterLook(value: unknown): CharacterLook {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...DEFAULT_LOOK };
  const candidate = value as Partial<CharacterLook>;
  return {
    gender: candidate.gender === "male" ? "male" : "female",
    skin: SKINS.some((item) => item.color === candidate.skin) ? candidate.skin! : DEFAULT_LOOK.skin,
    hair: HAIRS.some((item) => item.color === candidate.hair) ? candidate.hair! : DEFAULT_LOOK.hair,
    hairStyle: HAIR_STYLES.some((item) => item.id === candidate.hairStyle) ? candidate.hairStyle! : DEFAULT_LOOK.hairStyle,
    outfit: OUTFITS.some((item) => item.color === candidate.outfit) ? candidate.outfit! : DEFAULT_LOOK.outfit,
    mask: typeof candidate.mask === "boolean" ? candidate.mask : DEFAULT_LOOK.mask,
    tattoos: typeof candidate.tattoos === "boolean" ? candidate.tattoos : DEFAULT_LOOK.tattoos,
    tattooStyle: ["ornamental", "roses", "script"].includes(candidate.tattooStyle || "") ? candidate.tattooStyle! : DEFAULT_LOOK.tattooStyle,
    outfitStyle: ["harness", "leather", "corset"].includes(candidate.outfitStyle || "") ? candidate.outfitStyle! : DEFAULT_LOOK.outfitStyle,
    dynamicRole: ["dominant", "sub", "slave", "switch"].includes(candidate.dynamicRole || "") ? candidate.dynamicRole! : DEFAULT_LOOK.dynamicRole,
    neckDetail: ["collar", "chain", "none"].includes(candidate.neckDetail || "") ? candidate.neckDetail! : DEFAULT_LOOK.neckDetail,
    accessory: ["crescent", "earring", "sigil"].includes(candidate.accessory || "") ? candidate.accessory! : DEFAULT_LOOK.accessory,
  };
}

function loadLook(profileId: string): CharacterLook {
  try {
    const raw = localStorage.getItem(KEY + ":" + profileId);
    if (!raw) return { ...DEFAULT_LOOK };
    return normalizeCharacterLook(JSON.parse(raw));
  } catch { return { ...DEFAULT_LOOK }; }
}
function AvatarArt({ look }: { look: CharacterLook }) {
  const masculine = look.gender === "male";
  const longHair = look.hairStyle === "waves" || look.hairStyle === "curls";
  const shortHair = look.hairStyle === "short" || (masculine && look.hairStyle === "sleek");
  const hairShape = shortHair
    ? "M62 125 C55 65 80 29 119 25 C163 21 187 60 178 125 L163 105 C151 82 133 72 119 70 C103 75 83 91 76 119Z"
    : "M59 142 C48 72 72 23 119 20 C171 17 194 66 181 144 L176 217 C169 230 158 211 157 182 L153 123 C145 91 132 77 119 72 C101 81 86 101 82 129 L78 207 C68 222 59 202 59 142Z";
  return <svg className="character-art" viewBox="0 0 240 300" role="img" aria-label={masculine ? "AFTER HOURS masculine character portrait" : "AFTER HOURS feminine character portrait"}>
    <defs>
      <linearGradient id="ahPortraitBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#302113"/><stop offset=".48" stopColor="#100c08"/><stop offset="1" stopColor="#050403"/></linearGradient>
      <linearGradient id="ahPortraitGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f1d9ad"/><stop offset=".5" stopColor="#b58a50"/><stop offset="1" stopColor="#6f4a26"/></linearGradient>
      <linearGradient id="ahPortraitSkin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={look.skin}/><stop offset=".48" stopColor={look.skin}/><stop offset="1" stopColor="#20120e"/></linearGradient>
      <linearGradient id="ahPortraitCloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={look.outfit}/><stop offset="1" stopColor="#030303"/></linearGradient>
      <radialGradient id="ahPortraitLight" cx="50%" cy="35%" r="65%"><stop offset="0" stopColor="#d5a969" stopOpacity=".22"/><stop offset="1" stopColor="#080604" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="240" height="300" rx="8" fill="url(#ahPortraitBg)"/>
    <rect width="240" height="300" rx="8" fill="url(#ahPortraitLight)"/>
    <path d="M18 300 C22 242 47 218 83 204 L104 188 L136 188 L157 204 C193 218 218 242 222 300Z" fill="url(#ahPortraitCloth)"/>
    <path d="M78 218 L103 194 L120 219 L137 194 L162 218 L151 300 L89 300Z" fill="#090806" stroke="url(#ahPortraitGold)" strokeOpacity=".5" strokeWidth="1"/>
    {look.outfitStyle === "harness" && <>
      <path d="M79 216 L105 197 L120 221 L135 197 L161 216" fill="none" stroke="#b58a50" strokeOpacity=".8" strokeWidth="2"/>
      <path d="M92 207 L111 300 M148 207 L129 300" fill="none" stroke="#171411" strokeWidth="8"/>
      <path d="M92 207 L111 300 M148 207 L129 300" fill="none" stroke="url(#ahPortraitGold)" strokeOpacity=".9" strokeWidth="1.5"/>
      <path d="M88 229 Q120 244 152 229" fill="none" stroke="#b58a50" strokeWidth="2"/>
      <rect x="114" y="238" width="12" height="10" rx="2" fill="#17120d" stroke="#d0ad72" strokeWidth="1"/>
      <circle cx="120" cy="243" r="2" fill="#d0ad72"/>
    </>}
    {look.outfitStyle === "leather" && <>
      <path d="M78 218 L103 194 L120 219 L137 194 L162 218 L151 300 L89 300Z" fill="#090806" stroke="url(#ahPortraitGold)" strokeOpacity=".55" strokeWidth="1"/>
      <path d="M104 197 L120 219 L136 197 L129 300 L111 300Z" fill="#211b16" stroke="#8f6b42" strokeWidth="1"/>
      <path d="M98 213 L112 228 M142 213 L128 228" stroke="#d0ad72" strokeWidth="1.2"/>
      <path d="M92 248 L148 248" stroke="#8f6b42" strokeWidth="1"/>
    </>}
    {look.outfitStyle === "corset" && <>
      <path d="M78 218 L103 194 L120 219 L137 194 L162 218 L151 300 L89 300Z" fill="#090806" stroke="url(#ahPortraitGold)" strokeOpacity=".55" strokeWidth="1"/>
      <path d="M101 213 Q120 225 139 213 L132 300 L108 300Z" fill="#17110e" stroke="#b58a50" strokeWidth="1.2"/>
      <path d="M110 228 L130 278 M130 228 L110 278 M109 246 L131 246 M108 264 L132 264" fill="none" stroke="#c19a62" strokeWidth="1"/>
    </>}
    <path d={hairShape} fill={look.hair}/>
    {longHair && <path d={look.hairStyle==="curls"?"M62 80 C49 101 69 118 57 143 C48 165 64 185 60 211 M178 78 C193 99 173 119 185 145 C195 168 177 190 181 211":"M65 78 C52 107 70 129 61 160 C57 180 69 196 67 211 M175 78 C188 106 170 129 179 160 C183 180 171 196 173 211"} fill="none" stroke={look.hair} strokeWidth={look.hairStyle==="curls"?13:10} strokeLinecap="round"/>}
    <path d={masculine?"M82 76 C93 56 147 56 158 76 L157 140 C155 168 139 187 120 190 C101 187 85 168 83 140Z":"M82 77 C94 56 146 56 158 77 L158 141 C155 170 139 189 120 192 C101 189 85 170 82 141Z"} fill="url(#ahPortraitSkin)"/>
    <path d="M81 82 C91 56 146 53 159 82 C153 68 140 63 120 65 C102 65 91 72 81 93Z" fill={look.hair}/>
    <path d="M91 124 C101 119 110 119 115 123 M125 123 C132 119 141 119 149 124" fill="none" stroke="#21120f" strokeOpacity=".72" strokeWidth="2" strokeLinecap="round"/>
    <path d="M91 132 C98 128 108 128 114 132 M126 132 C133 128 143 128 149 132" fill="none" stroke="#160e0c" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M101 134 Q106 137 111 134 M129 134 Q134 137 139 134" fill="none" stroke="#e0b89b" strokeOpacity=".62" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M120 132 C117 143 116 148 120 150" fill="none" stroke="#6e4030" strokeOpacity=".65" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M109 159 Q120 164 131 159 Q120 169 109 159Z" fill="#542b28" stroke="#241311" strokeWidth="1"/>
    <path d="M112 160 Q120 162 128 160" fill="none" stroke="#e1b29b" strokeOpacity=".65" strokeWidth=".8"/>
    {look.mask && <path d="M83 113 C105 105 135 105 157 113 L151 143 C132 150 108 150 89 143Z" fill="#0b0907" stroke="url(#ahPortraitGold)" strokeWidth="1.2"/>}
    {look.tattoos && <g fill="none" stroke="#171310" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" opacity=".82">
      {/* Chicano-inspired black-and-grey ornamental neck and collarbone ink */}
      <path d="M91 158 C88 166 91 174 98 180 C101 183 102 187 101 190 M149 158 C152 166 149 174 142 180 C139 183 138 187 139 190"/>
      <path d="M95 165 C99 160 104 162 105 167 C106 172 101 176 97 173 C94 171 94 168 97 166 C100 164 103 167 101 170"/>
      <path d="M145 165 C141 160 136 162 135 167 C134 172 139 176 143 173 C146 171 146 168 143 166 C140 164 137 167 139 170"/>
      <path d="M97 179 C101 177 104 180 103 184 M143 179 C139 177 136 180 137 184"/>
      <path d="M108 181 C112 176 116 177 120 182 C124 177 128 176 132 181 M108 184 C113 188 116 188 120 184 C124 188 127 188 132 184"/>
      <path d="M112 168 C115 164 118 164 120 168 C122 164 125 164 128 168 M120 168 L120 178"/>
      <path d="M89 173 l-4 4 5 2 M151 173 l4 4 -5 2"/>
      <path d="M106 190 C111 194 115 195 120 194 C125 195 129 194 134 190" strokeWidth="1"/>
      <path d="M117 174 l3 -3 3 3 -3 3Z" strokeWidth=".9"/>
      {look.tattooStyle === "ornamental" && <>
        <path d="M84 213 C77 207 79 198 87 196 C95 194 100 201 96 208 C93 213 87 216 84 213Z"/>
        <path d="M87 197 C88 202 92 205 96 208 M82 205 C88 204 92 201 94 197 M86 213 C83 218 83 222 87 225"/>
        <path d="M156 213 C163 207 161 198 153 196 C145 194 140 201 144 208 C147 213 153 216 156 213Z"/>
        <path d="M153 197 C152 202 148 205 144 208 M158 205 C152 204 148 201 146 197 M154 213 C157 218 157 222 153 225"/>
        <path d="M102 205 Q108 198 114 205 M126 205 Q132 198 138 205 M105 211 Q120 219 135 211" strokeWidth=".9"/>
        <path d="M120 196 l3 5 -3 5 -3 -5Z M112 202 l-3 4 3 4 M128 202 l3 4 -3 4" strokeWidth=".9"/>
      </>}
      {look.tattooStyle === "roses" && <>
        <path d="M88 210 C78 204 81 192 90 193 C99 193 101 204 94 210 C91 213 89 215 88 219Z"/>
        <path d="M88 195 C87 202 95 202 96 196 M83 202 Q89 205 96 207 M89 219 Q98 221 101 228"/>
        <path d="M152 210 C162 204 159 192 150 193 C141 193 139 204 146 210 C149 213 151 215 152 219Z"/>
        <path d="M152 195 C153 202 145 202 144 196 M157 202 Q151 205 144 207 M151 219 Q142 221 139 228"/>
      </>}
      {look.tattooStyle === "script" && <>
        <path d="M84 205 Q91 196 98 205 Q91 214 84 205 M142 205 Q149 196 156 205 Q149 214 142 205"/>
        <path d="M87 215 Q94 211 100 216 M140 216 Q146 211 153 215 M105 207 Q120 214 135 207" strokeWidth=".9"/>
      </>}
    </g>}
    <path d="M101 188 L120 216 L139 188" fill="none" stroke="url(#ahPortraitGold)" strokeOpacity=".55" strokeWidth="1"/>
    {look.neckDetail==="collar"&&<><path d="M88 184 C105 201 135 201 152 184 L157 201 C137 219 103 219 83 201Z" fill="#090806" stroke="url(#ahPortraitGold)" strokeWidth="1.5"/><circle cx="120" cy="211" r="3" fill="#d8b477"/></>}
    {look.neckDetail==="chain"&&<><path d="M91 185 C108 220 132 220 149 185" fill="none" stroke="url(#ahPortraitGold)" strokeWidth="1.5"/><path d="M120 208 l4 5 -4 5 -4 -5Z" fill="#d8b477"/></>}
    {look.accessory==="crescent"&&<path d="M159 83 A10 10 0 1 0 171 99 A8 8 0 0 1 159 83Z" fill="#dfbd83"/>}
    {look.accessory==="earring"&&<><circle cx="82" cy="147" r="2.5" fill="#dfbd83"/><path d="M82 150v10l5 4" fill="none" stroke="#dfbd83" strokeWidth="1.2"/></>}
    {look.accessory==="sigil"&&<><path d="M120 238l8 9-8 9-8-9Z" fill="none" stroke="url(#ahPortraitGold)" strokeWidth="1.3"/><circle cx="120" cy="247" r="15" fill="none" stroke="#9b7445" strokeWidth=".7"/></>}
    <path d="M17 50V17H50 M190 17h33v33 M17 250v33h33 M190 283h33v-33" fill="none" stroke="url(#ahPortraitGold)" strokeOpacity=".9" strokeWidth="1.3"/>
    <rect x="8" y="8" width="224" height="284" rx="6" fill="none" stroke="url(#ahPortraitGold)" strokeOpacity=".55" strokeWidth=".8"/>
  </svg>;
}

export default function CharacterStudio({ profileId, language = "nl", xp = 0 }: { profileId: string; language?: Language; xp?: number }) {
  const [look, setLook] = useState<CharacterLook>(() => loadLook(profileId));
  const [expanded, setExpanded] = useState(true);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const rank = rankProgressFromXp(xp);
  const nextRankMessage = rank.isMaxRank ? t("Hoogste rang bereikt", "Highest rank reached") : t(`Nog ${rank.xpToNext} XP tot ${rank.nextRankName}`, `${rank.xpToNext} XP to ${rank.nextRankName}`);
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
      <div className="character-preview">
        <div className={`character-art-frame character-art-rank-${rank.rankIndex}`} data-rank={rank.rankIndex}>
          <AvatarArt look={look}/>
        </div>
        <div className="character-preview-details">
          <div className="character-preview-caption"><span className="eyebrow">AFTER HOURS IDENTITY</span><strong>{look.gender === "female" ? t("The Femme", "The Femme") : t("The Sovereign", "The Sovereign")}</strong><small className={`character-role-label role-${look.dynamicRole}`}>{({ dominant: t("Dominant", "Dominant"), sub: t("Sub", "Sub"), slave: t("Slaaf", "Slave"), switch: t("Switch", "Switch") })[look.dynamicRole]}</small><small>{t("Cosmetische identiteit · altijd aanpasbaar", "Cosmetic identity · always customizable")}</small></div>
          <div className="character-rank-panel">
            <div className="character-rank-heading">
              <span className="eyebrow">{t("RANG-EVOLUTIE", "RANK EVOLUTION")}</span>
              <strong>{rank.rankName}</strong>
            </div>
            <div className="character-rank-progress-track" role="progressbar" aria-label={t("Voortgang naar volgende rang", "Progress to next rank")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rank.progressPercent} aria-valuetext={nextRankMessage}>
              <span className="character-rank-progress-fill" style={{ width: `${rank.progressPercent}%` }}/>
            </div>
            <div className="character-rank-meta"><small>{nextRankMessage}</small><small>{Math.floor(rank.xp)} XP</small></div>
          </div>
        </div>
      </div>
      <div className="character-options">
        <div className="character-field"><span className="eyebrow">{t("KIES JE CHARACTER", "CHOOSE YOUR CHARACTER")}</span><div className="character-segment">
          <button className={look.gender === "female" ? "selected" : ""} aria-pressed={look.gender === "female"} onClick={() => update({ gender: "female" })}>{t("Vrouwelijk", "Feminine")}{look.gender === "female" && <Check size={14}/>}</button>
          <button className={look.gender === "male" ? "selected" : ""} aria-pressed={look.gender === "male"} onClick={() => update({ gender: "male" })}>{t("Mannelijk", "Masculine")}{look.gender === "male" && <Check size={14}/>}</button>
        </div></div>
        <div className="character-field"><span className="eyebrow">{t("BDSM-ROL", "BDSM ROLE")}</span><div className="character-segment wrap">
          <button className={look.dynamicRole === "dominant" ? "selected" : ""} aria-pressed={look.dynamicRole === "dominant"} onClick={() => update({ dynamicRole: "dominant" })}>{t("Dominant", "Dominant")}</button>
          <button className={look.dynamicRole === "sub" ? "selected" : ""} aria-pressed={look.dynamicRole === "sub"} onClick={() => update({ dynamicRole: "sub" })}>{t("Sub", "Sub")}</button>
          <button className={look.dynamicRole === "slave" ? "selected" : ""} aria-pressed={look.dynamicRole === "slave"} onClick={() => update({ dynamicRole: "slave" })}>{t("Slaaf", "Slave")}</button>
          <button className={look.dynamicRole === "switch" ? "selected" : ""} aria-pressed={look.dynamicRole === "switch"} onClick={() => update({ dynamicRole: "switch" })}>Switch</button>
        </div>
        <div className="character-role-card" aria-live="polite">
          <strong>{({ dominant: t("Leidend · Dominant", "Leading · Dominant"), sub: t("Volgend · Sub", "Following · Sub"), slave: t("Slave-dynamiek · Slaaf", "Slave dynamic · Slave"), switch: t("Wisselende dynamiek · Switch", "Flexible dynamic · Switch") })[look.dynamicRole]}</strong>
          <p>{({
            dominant: t("Je character kiest een leidende presentatie. Afspraken en toestemming blijven per interactie nodig.", "Your character has a leading presentation. Agreements and consent are still required for every interaction."),
            sub: t("Je character kiest een volgende presentatie. Grenzen en persoonlijke voorkeuren blijven altijd leidend.", "Your character has a submissive presentation. Limits and personal preferences always remain in control."),
            slave: t("Je character gebruikt een expliciete slave-identiteit binnen een afgesproken, vrijwillige dynamiek. Dit geeft niemand automatisch zeggenschap buiten die afspraken.", "Your character uses an explicit slave identity within an agreed, consensual dynamic. This grants nobody authority outside those agreements."),
            switch: t("Je character kan per spel of afgesproken scène van rol wisselen.", "Your character can change roles per game or agreed scene.")
          })[look.dynamicRole]}</p>
          <small>{t("Een profielrol is geen toestemming. Leg grenzen, stopwoorden en afspraken apart vast voordat je samen speelt.", "A profile role is not consent. Set limits, safewords and agreements separately before playing together.")}</small>
        </div>
      </div>
        <div className="character-field"><span className="eyebrow">{t("HUIDTINT", "SKIN TONE")}</span><div className="character-swatches">{SKINS.map((item) => <button key={item.color} className={look.skin === item.color ? "selected" : ""} aria-pressed={look.skin === item.color} onClick={() => update({ skin: item.color })} aria-label={item.label} title={item.label} style={{ background: item.color }}>{look.skin === item.color && <Check size={13}/>}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("HAARKLEUR", "HAIR COLOUR")}</span><div className="character-swatches">{HAIRS.map((item) => <button key={item.color} className={look.hair === item.color ? "selected" : ""} aria-pressed={look.hair === item.color} onClick={() => update({ hair: item.color })} aria-label={item.label} title={item.label} style={{ background: item.color }}>{look.hair === item.color && <Check size={13}/>}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("HAARSTIJL", "HAIR STYLE")}</span><div className="character-segment wrap">{HAIR_STYLES.map((item) => <button key={item.id} className={look.hairStyle === item.id ? "selected" : ""} aria-pressed={look.hairStyle === item.id} onClick={() => update({ hairStyle: item.id })}>{t(item.nl, item.en)}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("OUTFIT", "OUTFIT")}</span><div className="character-swatches outfit-swatches">{OUTFITS.map((item) => <button key={item.color} className={look.outfit === item.color ? "selected" : ""} aria-pressed={look.outfit === item.color} onClick={() => update({ outfit: item.color })} aria-label={item.label} title={item.label} style={{ background: item.color }}>{look.outfit === item.color && <Check size={13}/>}</button>)}</div></div>
        <div className="character-field"><span className="eyebrow">{t("TATTOOSTIJL", "TATTOO STYLE")}</span><div className="character-segment wrap">
          <button className={look.tattooStyle === "ornamental" ? "selected" : ""} aria-pressed={look.tattooStyle === "ornamental"} onClick={() => update({ tattooStyle: "ornamental" })}>{t("Ornamentaal", "Ornamental")}</button>
          <button className={look.tattooStyle === "roses" ? "selected" : ""} aria-pressed={look.tattooStyle === "roses"} onClick={() => update({ tattooStyle: "roses" })}>{t("Rozen", "Roses")}</button>
          <button className={look.tattooStyle === "script" ? "selected" : ""} aria-pressed={look.tattooStyle === "script"} onClick={() => update({ tattooStyle: "script" })}>{t("Script", "Script")}</button>
        </div></div>
        <div className="character-field"><span className="eyebrow">{t("KLEDINGSTIJL", "CLOTHING STYLE")}</span><div className="character-segment wrap">
          <button className={look.outfitStyle === "harness" ? "selected" : ""} aria-pressed={look.outfitStyle === "harness"} onClick={() => update({ outfitStyle: "harness" })}>{t("Harness", "Harness")}</button>
          <button className={look.outfitStyle === "leather" ? "selected" : ""} aria-pressed={look.outfitStyle === "leather"} onClick={() => update({ outfitStyle: "leather" })}>{t("Leer", "Leather")}</button>
          <button className={look.outfitStyle === "corset" ? "selected" : ""} aria-pressed={look.outfitStyle === "corset"} onClick={() => update({ outfitStyle: "corset" })}>{t("Korset", "Corset")}</button>
        </div></div>
        <div className="character-field"><span className="eyebrow">{t("DETAILS", "DETAILS")}</span><div className="character-segment wrap">
          <button className={look.neckDetail === "collar" ? "selected" : ""} aria-pressed={look.neckDetail === "collar"} onClick={() => update({ neckDetail: "collar" })}>{t("Collar", "Collar")}</button>
          <button className={look.neckDetail === "chain" ? "selected" : ""} aria-pressed={look.neckDetail === "chain"} onClick={() => update({ neckDetail: "chain" })}>{t("Ketting", "Chain")}</button>
          <button className={look.neckDetail === "none" ? "selected" : ""} aria-pressed={look.neckDetail === "none"} onClick={() => update({ neckDetail: "none" })}>{t("Geen", "None")}</button>
          <button className={look.accessory === "crescent" ? "selected" : ""} aria-pressed={look.accessory === "crescent"} onClick={() => update({ accessory: "crescent" })}>{t("Halvemaan", "Crescent")}</button>
          <button className={look.accessory === "earring" ? "selected" : ""} aria-pressed={look.accessory === "earring"} onClick={() => update({ accessory: "earring" })}>{t("Oorbel", "Earring")}</button>
          <button className={look.accessory === "sigil" ? "selected" : ""} aria-pressed={look.accessory === "sigil"} onClick={() => update({ accessory: "sigil" })}>Sigil</button>
        </div></div>
        <label className="character-mask-toggle"><input type="checkbox" checked={look.tattoos} onChange={(event) => update({ tattoos: event.target.checked })}/><span>{t("Chicano black-and-grey tattoo details", "Chicano black-and-grey tattoo details")}</span></label>
        <label className="character-mask-toggle"><input type="checkbox" checked={look.mask} onChange={(event) => update({ mask: event.target.checked })}/><span>{t("Voeg een elegant masker toe", "Add an elegant mask")}</span></label>
        <p className="character-save-note">{t("Je look wordt op dit apparaat bewaard. Spelvoortgang, XP en ranks blijven voor ieder character gelijk.", "Your look is saved on this device. Gameplay, XP and ranks remain the same for every character.")}</p>
      </div>
    </div>}
  </section>;
}
