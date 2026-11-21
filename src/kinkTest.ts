export const KINK_TEST_VERSION = "ah-kink-profile-v1";
export const KINK_TEST_REWARD_XP = 120;

export type KinkAnswer = "limit" | "no" | "unsure" | "curious" | "interested" | "yes";

export interface KinkQuestion {
  id: string;
  category: string;
  nl: string;
  en: string;
}

export const kinkCategories = [
  { id: "power", nl: "Regie & power exchange", en: "Leadership & power exchange", icon: "♛", descriptionNl: "Dynamiek, initiatief en bewust afgesproken rollen.", descriptionEn: "Dynamics, initiative and intentionally agreed roles." },
  { id: "service", nl: "Toewijding & service", en: "Devotion & service", icon: "◇", descriptionNl: "Aandacht, zorg, rituelen en iets voor elkaar betekenen.", descriptionEn: "Attention, care, rituals and doing things for each other." },
  { id: "sensation", nl: "Sensatie & intensiteit", en: "Sensation & intensity", icon: "✦", descriptionNl: "Spanning, contrast en bewust ervaren prikkels.", descriptionEn: "Tension, contrast and consciously explored sensations." },
  { id: "restraint", nl: "Restrictie & ritueel", en: "Restraint & ritual", icon: "⛓", descriptionNl: "Structuur, symboliek en afgesproken beperkingen.", descriptionEn: "Structure, symbolism and agreed limitations." },
  { id: "roleplay", nl: "Rollenspel & fantasie", en: "Roleplay & fantasy", icon: "☾", descriptionNl: "Verhalen, personages en samen een scenario verkennen.", descriptionEn: "Stories, characters and exploring a scenario together." },
  { id: "sensory", nl: "Zintuigen & sfeer", en: "Senses & atmosphere", icon: "❖", descriptionNl: "Muziek, setting, aandacht en zintuiglijke beleving.", descriptionEn: "Music, setting, attention and sensory atmosphere." },
  { id: "audience", nl: "Zichtbaarheid & expressie", en: "Visibility & expression", icon: "◎", descriptionNl: "Expressie, bekeken worden of juist bewust privé blijven.", descriptionEn: "Expression, being seen or intentionally staying private." },
  { id: "structure", nl: "Structuur & afspraken", en: "Structure & agreements", icon: "⬡", descriptionNl: "Duidelijke kaders, check-ins en voorspelbare afspraken.", descriptionEn: "Clear frameworks, check-ins and predictable agreements." },
] as const;

export const kinkQuestions: KinkQuestion[] = [
  { id:"p1",category:"power",nl:"Ik vind het interessant om vooraf bewust af te spreken wie tijdelijk de leiding neemt.",en:"I enjoy intentionally agreeing who takes the lead for a while." },
  { id:"p2",category:"power",nl:"Een duidelijke rolverdeling kan voor mij extra spanning of rust geven.",en:"Clearly defined roles can create extra excitement or calm for me." },
  { id:"p3",category:"power",nl:"Ik ben nieuwsgierig naar het afwisselen van initiatief en overgave.",en:"I am curious about alternating between taking initiative and yielding it." },
  { id:"s1",category:"service",nl:"Ik haal voldoening uit kleine, afgesproken gebaren van aandacht of dienstbaarheid.",en:"I enjoy small, agreed gestures of attention or service." },
  { id:"s2",category:"service",nl:"Een vast ritueel samen kan voor mij betekenisvol zijn.",en:"A shared ritual can feel meaningful to me." },
  { id:"s3",category:"service",nl:"Ik vind het fijn om bewust voor iemand te zorgen binnen duidelijke afspraken.",en:"I like consciously caring for someone within clear agreements." },
  { id:"n1",category:"sensation",nl:"Ik ben nieuwsgierig naar het verkennen van verschillende, vooraf besproken sensaties.",en:"I am curious about exploring different, previously discussed sensations." },
  { id:"n2",category:"sensation",nl:"Afwisseling in tempo, intensiteit of contrast spreekt mij aan.",en:"Variation in pace, intensity or contrast appeals to me." },
  { id:"n3",category:"sensation",nl:"Ik vind het interessant om samen te ontdekken welke prikkels prettig voelen.",en:"I enjoy discovering together which sensations feel pleasant." },
  { id:"r1",category:"restraint",nl:"Symbolische afspraken of accessoires kunnen een ervaring betekenis geven.",en:"Symbolic agreements or accessories can add meaning to an experience." },
  { id:"r2",category:"restraint",nl:"Ik ben nieuwsgierig naar vrijwillige, zorgvuldig afgesproken beperkingen.",en:"I am curious about voluntary, carefully agreed restrictions." },
  { id:"r3",category:"restraint",nl:"Een rustig ritueel met heldere begin- en eindafspraken spreekt mij aan.",en:"A calm ritual with clear start and end agreements appeals to me." },
  { id:"f1",category:"roleplay",nl:"Ik vind het leuk om samen een fictieve rol of personage te verkennen.",en:"I enjoy exploring a fictional role or character together." },
  { id:"f2",category:"roleplay",nl:"Een afgesproken scenario kan mijn fantasie prikkelen.",en:"An agreed scenario can spark my imagination." },
  { id:"f3",category:"roleplay",nl:"Ik ben nieuwsgierig naar speelse persona's die buiten het dagelijks leven vallen.",en:"I am curious about playful personas outside everyday life." },
  { id:"x1",category:"sensory",nl:"Licht, muziek, geur of aankleding kunnen mijn beleving sterk beïnvloeden.",en:"Lighting, music, scent or atmosphere can strongly shape my experience." },
  { id:"x2",category:"sensory",nl:"Ik vind het interessant om één zintuig bewust meer aandacht te geven.",en:"I enjoy consciously giving one sense more attention." },
  { id:"x3",category:"sensory",nl:"Een zorgvuldig opgebouwde sfeer maakt samen ontdekken leuker.",en:"A thoughtfully created atmosphere makes exploring together more enjoyable." },
  { id:"a1",category:"audience",nl:"Ik ben nieuwsgierig naar expressie of zichtbaarheid, mits privacy volledig geregeld is.",en:"I am curious about expression or visibility when privacy is fully protected." },
  { id:"a2",category:"audience",nl:"Ik vind het prettig om zelf te bepalen wat privé blijft en wat ik eventueel deel.",en:"I like deciding for myself what stays private and what I might share." },
  { id:"a3",category:"audience",nl:"Ik vind het interessant om te onderzoeken hoe aandacht of bekeken worden voor mij voelt.",en:"I am interested in exploring how attention or being watched feels to me." },
  { id:"t1",category:"structure",nl:"Duidelijke afspraken vooraf maken ontdekken voor mij prettiger.",en:"Clear agreements beforehand make exploration more comfortable for me." },
  { id:"t2",category:"structure",nl:"Ik wil graag vaste check-ins en een duidelijk stop- of pauzesignaal.",en:"I like having regular check-ins and a clear stop or pause signal." },
  { id:"t3",category:"structure",nl:"Ik vind het belangrijk om achteraf samen te reflecteren en bij te stellen.",en:"I value reflecting together afterwards and adjusting agreements." },
];

const scoreByAnswer: Record<KinkAnswer, number> = {
  limit: 0, no: 0, unsure: 1, curious: 2, interested: 3, yes: 4,
};

export interface KinkCategoryScore {
  id: string;
  score: number;
  maxScore: number;
  percentage: number;
  hardLimitCount: number;
}

export interface KinkProfileResult {
  version: string;
  completedAt: string;
  archetypeId: string;
  categoryScores: KinkCategoryScore[];
  topCategories: string[];
  curiosityCount: number;
  hardLimitCount: number;
  answeredCount: number;
}

export function calculateKinkProfile(answers: Record<string, KinkAnswer>, completedAt = new Date().toISOString()): KinkProfileResult {
  const categoryScores = kinkCategories.map(category => {
    const questions = kinkQuestions.filter(question => question.category === category.id);
    const answered = questions.filter(question => answers[question.id] !== undefined);
    const score = answered.reduce((sum, question) => sum + scoreByAnswer[answers[question.id]], 0);
    const hardLimitCount = answered.filter(question => answers[question.id] === "limit").length;
    const maxScore = questions.length * 4;
    return { id: category.id, score, maxScore, percentage: Math.round(score / maxScore * 100), hardLimitCount };
  });
  const topCategories = [...categoryScores]
    .sort((a,b) => b.percentage - a.percentage || a.id.localeCompare(b.id))
    .slice(0,3).map(item => item.id);
  return {
    version: KINK_TEST_VERSION,
    completedAt,
    archetypeId: topCategories[0] ?? "structure",
    categoryScores,
    topCategories,
    curiosityCount: Object.values(answers).filter(answer => answer === "curious" || answer === "unsure").length,
    hardLimitCount: Object.values(answers).filter(answer => answer === "limit").length,
    answeredCount: Object.keys(answers).length,
  };
}

const resultKey = (profileId: string) => `afterhours.kink-profile.v1.${profileId}`;
const rewardKey = (profileId: string) => `afterhours.kink-profile.reward.v1.${profileId}`;

export function saveKinkProfileResult(profileId: string, result: KinkProfileResult): boolean {
  if (!profileId.trim()) return false;
  try {
    localStorage.setItem(resultKey(profileId), JSON.stringify(result));
    return true;
  } catch { return false; }
}

export function loadKinkProfileResult(profileId: string): KinkProfileResult | null {
  if (!profileId.trim()) return null;
  try {
    const raw = localStorage.getItem(resultKey(profileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KinkProfileResult;
    if (parsed.version !== KINK_TEST_VERSION || !Array.isArray(parsed.categoryScores)
      || parsed.categoryScores.length !== kinkCategories.length
      || !kinkCategories.every(category => parsed.categoryScores.some(score => score.id === category.id && Number.isFinite(score.percentage)))) return null;
    return parsed;
  } catch { return null; }
}

export function clearKinkProfileResult(profileId: string): boolean {
  try { localStorage.removeItem(resultKey(profileId)); return true; } catch { return false; }
}

export function awardLocalKinkTestXp(profileId: string): { xpEarned: number; alreadyAwarded: boolean } {
  if (!profileId.trim()) return { xpEarned: 0, alreadyAwarded: true };
  try {
    if (localStorage.getItem(rewardKey(profileId)) === KINK_TEST_VERSION) return { xpEarned: 0, alreadyAwarded: true };
    localStorage.setItem(rewardKey(profileId), KINK_TEST_VERSION);
    return { xpEarned: KINK_TEST_REWARD_XP, alreadyAwarded: false };
  } catch { return { xpEarned: 0, alreadyAwarded: true }; }
}
