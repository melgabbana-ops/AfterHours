const zodiacBoundaries: Array<{ sign: string; month: number; day: number }> = [
  { sign: "Steenbok", month: 1, day: 1 },
  { sign: "Waterman", month: 1, day: 20 },
  { sign: "Vissen", month: 2, day: 19 },
  { sign: "Ram", month: 3, day: 21 },
  { sign: "Stier", month: 4, day: 20 },
  { sign: "Tweelingen", month: 5, day: 21 },
  { sign: "Kreeft", month: 6, day: 21 },
  { sign: "Leeuw", month: 7, day: 23 },
  { sign: "Maagd", month: 8, day: 23 },
  { sign: "Weegschaal", month: 9, day: 23 },
  { sign: "Schorpioen", month: 10, day: 23 },
  { sign: "Boogschutter", month: 11, day: 22 },
  { sign: "Steenbok", month: 12, day: 22 },
];

export const dailyReflectionThemes = [
  { title: "Heldere intentie", prompt: "Zeg hardop wat je vandaag hoopt te ervaren, zonder dat de ander jouw verwachting hoeft in te vullen." },
  { title: "Ruimte voor nee", prompt: "Maak vandaag bewust ruimte voor een eerlijk nee en behandel het als waardevolle informatie." },
  { title: "Nieuwsgierigheid", prompt: "Stel één open vraag voordat je een aanname doet over wat de ander wil." },
  { title: "Rust en ritme", prompt: "Kies een tempo waarbij iedereen makkelijk kan pauzeren en van gedachten kan veranderen." },
  { title: "Vertrouwen", prompt: "Benoem één concrete afspraak die jullie helpt je veilig en gehoord te voelen." },
  { title: "Speels ontdekken", prompt: "Verken een kleine nieuwe mogelijkheid, maar alleen wanneer die voor iedereen welkom voelt." },
  { title: "Zorg na afloop", prompt: "Spreek af hoe jullie na een intens moment weer rustig bij elkaar kunnen landen." },
] as const;

const englishDailyReflectionThemes = [
  { title: "Clear Intention", prompt: "Say out loud what you hope to experience today, without expecting the other person to guess." },
  { title: "Room for No", prompt: "Make deliberate room for an honest no today and treat it as valuable information." },
  { title: "Curiosity", prompt: "Ask one open question before making an assumption about what the other person wants." },
  { title: "Calm and Rhythm", prompt: "Choose a pace that makes it easy for everyone to pause and change their mind." },
  { title: "Trust", prompt: "Name one concrete agreement that helps you feel safe and heard." },
  { title: "Playful Discovery", prompt: "Explore one small new possibility, but only if it feels welcome to everyone." },
  { title: "Care Afterwards", prompt: "Agree how you can help each other settle after an intense moment." },
] as const;

/** Returns a zodiac sign from YYYY-MM-DD without storing the birth date. from YYYY-MM-DD without storing the birth date. */
export function zodiacSignForBirthDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  const current = month * 100 + day;
  for (let index = zodiacBoundaries.length - 1; index >= 0; index -= 1) {
    const boundary = zodiacBoundaries[index];
    if (current >= boundary.month * 100 + boundary.day) return boundary.sign;
  }
  return "Steenbok";
}

/** Stable per local calendar day and sign; a reflective prompt, not a prediction. */
export function dailyReflectionFor(sign: string, date = new Date(), language: "nl" | "en" = "nl") {
  const signIndex = ["Ram", "Stier", "Tweelingen", "Kreeft", "Leeuw", "Maagd", "Weegschaal", "Schorpioen", "Boogschutter", "Steenbok", "Waterman", "Vissen"].indexOf(sign);
  const dayKey = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const index = ((dayKey + Math.max(0, signIndex)) % dailyReflectionThemes.length);
  return language === "en" ? englishDailyReflectionThemes[index] : dailyReflectionThemes[index];
}
