/**
 * AFTER HOURS design system source of truth.
 * Import these tokens in app components/styles instead of inventing page-specific values.
 * Approved logo: /after-hours-logo.svg (keep the original asset unchanged).
 */
export const afterHoursDesign = {
  brand: {
    name: "AFTER HOURS",
    tagline: "YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.",
    logoSrc: "/after-hours-logo.svg",
    age: "18+",
  },
  colors: {
    ink: "#08050B",
    surface: "#110916",
    surfaceRaised: "#1A1022",
    plum: "#260B31",
    purple: "#8B19B7",
    neonPurple: "#E12BFF",
    gold: "#D9A441",
    goldLight: "#FFE1A0",
    ivory: "#F7F0E8",
    muted: "#B7AAB9",
    border: "rgba(217,164,65,.38)",
    danger: "#F32655",
    success: "#58D6A5",
  },
  typography: {
    display: '"Cinzel", "Times New Roman", serif',
    body: '"DM Sans", system-ui, sans-serif',
    trackingDisplay: ".12em",
    trackingLabel: ".18em",
  },
  effects: {
    pageBackground: "radial-gradient(ellipse at 50% 0%, #351044 0%, #130918 42%, #08050B 100%)",
    cardBackground: "linear-gradient(145deg, rgba(35,16,43,.96), rgba(10,7,13,.98))",
    goldGlow: "0 0 22px rgba(217,164,65,.18)",
    purpleGlow: "0 0 28px rgba(225,43,255,.18)",
    radiusCard: "18px",
    radiusControl: "999px",
  },
  layout: {
    mobileMax: "767px",
    tabletMax: "1023px",
    contentMax: "1120px",
    pageGutter: "20px",
    navHeight: "72px",
    touchTarget: "44px",
  },
  navigation: [
    { id: "home", label: "Home", icon: "house" },
    { id: "deck", label: "The Deck", icon: "layers" },
    { id: "radio", label: "Radio", icon: "music-2" },
    { id: "missions", label: "Missies", icon: "trophy" },
    { id: "profile", label: "Profiel", icon: "user-round" },
  ],
  pages: {
    intro: { title: "Welkom bij AFTER HOURS", pattern: "cinematic-brand-gate", logo: true },
    home: { title: "Jouw wereld", pattern: "personal-dashboard", logo: true },
    deck: { title: "The Deck", pattern: "filterable-experience-library" },
    experience: { title: "Mijn ervaring", pattern: "guided-session-progress" },
    safety: { title: "Veiligheid", pattern: "safety-first-controls" },
    radio: { title: "Radio Room", pattern: "immersive-audio-player", logo: true },
    character: { title: "Character Studio", pattern: "character-customizer" },
    missions: { title: "Missies", pattern: "missions-and-rewards" },
    tarot: { title: "Kinky Tarot", pattern: "card-reading" },
    horoscope: { title: "Horoscoop", pattern: "astrology-reading" },
    media: { title: "Mijn Media", pattern: "private-media-vault" },
    profile: { title: "Profiel", pattern: "rank-and-progression" },
    settings: { title: "Instellingen", pattern: "grouped-settings" },
    insights: { title: "Inzichten", pattern: "tabbed-insights" },
    daily: { title: "Dagelijks ritueel", pattern: "daily-practice" },
    social: { title: "Social Studio", pattern: "content-composer" },
  },
  principles: [
    "Mobile-first and responsive from iPhone upwards",
    "Black and aubergine foundations, restrained gold, selective neon-purple accents",
    "Use the approved logo asset; never recreate the mark with text or generated artwork",
    "Each page has its own information hierarchy while sharing tokens and navigation",
    "Consent, boundaries, safe word and stop controls remain clear and accessible",
    "Respect reduced-motion preferences and minimum 44px touch targets",
    "Do not use generated concept images as production UI or as fake interactive controls",
  ],
} as const;

export type AfterHoursPageId = keyof typeof afterHoursDesign.pages;
