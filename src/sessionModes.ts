export type SessionModeId = "story" | "random" | "surprise" | "custom" | "boss";

export interface SessionModeDefinition {
  id: SessionModeId;
  title: string;
  titleEN: string;
  descriptionNL: string;
  descriptionEN: string;
  hintNL: string;
  hintEN: string;
}

export const sessionModes: readonly SessionModeDefinition[] = [
  { id: "story", title: "STORY MODE", titleEN: "STORY MODE", descriptionNL: "Doorloop de zeven hoofdstukken van THE ARRIVAL tot AFTER HOURS.", descriptionEN: "Move through seven chapters, from THE ARRIVAL to AFTER HOURS.", hintNL: "Een verhalende route met keuze per hoofdstuk.", hintEN: "A narrative route with a choice at every chapter." },
  { id: "random", title: "RANDOM MODE", titleEN: "RANDOM MODE", descriptionNL: "Trek willekeurig een opdracht uit de gekozen categorie.", descriptionEN: "Draw a random prompt from your selected category.", hintNL: "Geen straf, geen verplichting. Passen blijft altijd mogelijk.", hintEN: "No penalty, no obligation. Passing is always allowed." },
  { id: "surprise", title: "SURPRISE MODE", titleEN: "SURPRISE MODE", descriptionNL: "Laat AFTER HOURS een begeleid scenario voor je kiezen.", descriptionEN: "Let AFTER HOURS choose a guided scenario for you.", hintNL: "De inhoud wordt getoond vóór je ermee instemt.", hintEN: "The content is shown before you agree to it." },
  { id: "custom", title: "CUSTOM MODE", titleEN: "CUSTOM MODE", descriptionNL: "Stel zelf je deck samen met categorieën en losse kaarten.", descriptionEN: "Build your own deck from categories and individual prompts.", hintNL: "Jij kiest de selectie en kunt kaarten overslaan.", hintEN: "You choose the selection and may skip any card." },
  { id: "boss", title: "BOSS MODE", titleEN: "BOSS MODE", descriptionNL: "Een extra gefocuste ervaring in vijf korte fasen.", descriptionEN: "A more focused experience in five short phases.", hintNL: "De uitdaging is communicatie, nooit het overschrijden van grenzen.", hintEN: "The challenge is communication, never crossing a boundary." }
];

export interface StoryChapterDefinition {
  id: string;
  title: string;
  index: number;
  descriptionNL: string;
  descriptionEN: string;
  openingNL: string;
  openingEN: string;
  gameId: "protocol" | "command" | "service" | "trust" | "camera-director" | "ai-dom";
}

export const storyChapters: readonly StoryChapterDefinition[] = [
  { id: "arrival", title: "THE ARRIVAL", index: 1, descriptionNL: "Aankomen, de sfeer kiezen en de eerste afspraken helder maken.", descriptionEN: "Arrive, choose the atmosphere, and clarify the first agreements.", openingNL: "Je komt de AFTER HOURS-wereld binnen. Neem de tijd, kies je sfeer en laat iedere verwachting buiten de afspraken.", openingEN: "You enter the AFTER HOURS world. Take your time, choose your atmosphere, and leave every expectation outside the agreements.", gameId: "trust" },
  { id: "test", title: "THE TEST", index: 2, descriptionNL: "Test of afspraken duidelijk en comfortabel zijn, zonder iemand te testen op gehoorzaamheid.", descriptionEN: "Test whether agreements are clear and comfortable, never someone's obedience.", openingNL: "Dit is geen test die je moet halen. Het is een test van duidelijkheid: iedereen mag vragen, aanpassen en passen.", openingEN: "This is not a test you must pass. It is a test of clarity: everyone may ask, adjust, or pass.", gameId: "protocol" },
  { id: "control", title: "THE CONTROL", index: 3, descriptionNL: "Kies bewust wie de regie heeft over een kleine, veilige keuze.", descriptionEN: "Choose deliberately who leads one small, low-risk decision.", openingNL: "Regie is een afspraak, geen eigendom. De keuze kan op ieder moment terug naar degene die haar geeft.", openingEN: "Control is an agreement, not ownership. The choice can return at any time to the person who offered it.", gameId: "command" },
  { id: "challenge", title: "THE CHALLENGE", index: 4, descriptionNL: "Een creatieve uitdaging rond taal, sfeer of reflectie, altijd aanpasbaar.", descriptionEN: "A creative challenge around language, atmosphere, or reflection, always adjustable.", openingNL: "De uitdaging is helder communiceren. Geen enkele opdracht is bewijs van liefde, loyaliteit of moed.", openingEN: "The challenge is clear communication. No prompt is proof of love, loyalty, or courage.", gameId: "ai-dom" },
  { id: "boundary", title: "THE BOUNDARY", index: 5, descriptionNL: "Maak ruimte voor een grens, heronderhandeling of een duidelijke stop.", descriptionEN: "Make room for a boundary, renegotiation, or a clear stop.", openingNL: "Een grens is geen obstakel om te overwinnen. Neem twijfel serieus en pauzeer wanneer iets niet helder voelt.", openingEN: "A boundary is not an obstacle to overcome. Take uncertainty seriously and pause whenever something is unclear.", gameId: "trust" },
  { id: "night", title: "THE NIGHT", index: 6, descriptionNL: "Werk met sfeer, muziek of een optionele volledig geklede creatieve compositie.", descriptionEN: "Work with atmosphere, music, or an optional fully clothed creative composition.", openingNL: "Laat licht, muziek of een eenvoudig voorwerp de scène vormgeven. Opnemen is nooit vereist en vraagt aparte toestemming.", openingEN: "Let light, music, or a simple object shape the scene. Recording is never required and needs separate consent.", gameId: "camera-director" },
  { id: "after-hours", title: "AFTER HOURS", index: 7, descriptionNL: "Sluit de rol bewust af en kies wat nu prettig voelt.", descriptionEN: "Close the role deliberately and choose what feels right now.", openingNL: "De ervaring eindigt op jullie teken. Laat de rollen los en kies samen voor rust, gesprek, water of ruimte.", openingEN: "The experience ends on your signal. Leave the roles behind and choose quiet, conversation, water, or space together.", gameId: "service" }
];

export function pickRandomId<T extends { id: string }>(items: readonly T[], random: () => number = Math.random): string | null {
  if (!items.length) return null;
  const value = random();
  const safeValue = Number.isFinite(value) ? Math.min(0.999999999, Math.max(0, value)) : 0;
  return items[Math.floor(safeValue * items.length)]?.id ?? items[0].id;
}
