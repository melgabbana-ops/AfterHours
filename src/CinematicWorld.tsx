import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { bindVaultAutoLock } from "./vaultAutoLock";
import { consumeInvitationTokenFromUrl } from "./invitationUrl";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clapperboard, Copy,
  Download, Eye, EyeOff, Flame, LockKeyhole, Mail, Music2, Pause,
  Play, Plus, Save, Share2, ShieldCheck, Sparkles, Square, Star, Trash2,
  UnlockKeyhole, Volume2, VolumeX
} from "lucide-react";
import {
  acceptExperienceInvitation, createExperienceInvitation, createExperienceRun, previewExperienceInvitation,
  deleteExperienceRun, deleteWorldRecord, loadExperienceInvitations,
  loadExperienceRuns, loadWorldRecords, resumeExperienceRun, revokeExperienceInvitation,
  saveWorldRecord, updateExperienceRun, withdrawExperienceConsent,
  type ExperienceInvitation, type ExperienceInvitationPreview, type ExperienceRun, type WorldModule, type WorldRecord
} from "./services/worldRecords";
import "./cinematic-experience.css";

type Props = {
  language: "nl" | "en";
  remoteProfileId: string | null;
  consentActive: boolean;
  canStartExperience: boolean;
  onBack: () => void;
  onRequestConsent: () => void;
  onSafetyPause: () => void;
  onSafetyResume: () => void;
  onSafetyStop: () => void;
  onOpenGameLibrary: () => void;
  onOpenAftercare: () => void;
  onOpenSafetyPlan: () => void;
};
type Tab = "experience" | "director" | "vault" | "sensory" | "invitation" | "dominion" | "deck" | "club";
type Scene = { key: string; title: string; description: string; steps: string[]; custom: boolean };
type ScenePayload = { title: string; description: string; steps: string[]; language: "nl" | "en"; updatedAt: string };
type RecordMap = Record<WorldModule, WorldRecord[]>;
type CheckIn = "unset" | "green" | "yellow" | "red";
type PathChoice = "unset" | "steady" | "gentle" | "deepen" | "skip";

const MODULES: WorldModule[] = ["director", "vault", "dominion", "sensory", "invitation", "ritual", "club"];
const EMPTY_RECORDS: RecordMap = { director: [], vault: [], dominion: [], sensory: [], invitation: [], ritual: [], club: [] };
const BUILTIN_SCENES = [
  {
    key: "builtin:velvet-arrival",
    title: "The Velvet Arrival",
    titleEn: "The Velvet Arrival",
    description: "Een bewuste entree waarin intentie, rollen en grenzen de toon zetten.",
    descriptionEn: "A deliberate entrance where intention, roles and boundaries set the tone.",
    steps: [
      "Neem samen een moment om aan te komen. Benoem wat je vandaag hoopt te ervaren en wat je nodig hebt om je veilig te voelen.",
      "Bespreek de rollen die jullie vrijwillig willen verkennen. Iedere rol blijft optioneel en kan direct worden aangepast.",
      "Kies één kleine, vooraf besproken handeling. Vraag opnieuw om een duidelijk ja voordat je verdergaat.",
      "Rond bewust af. Benoem wat prettig was, wat anders mag en welke aftercare nu welkom is."
    ],
    stepsEn: [
      "Take a moment to arrive together. Name what you hope to experience and what helps you feel safe.",
      "Discuss the roles you both want to explore voluntarily. Every role remains optional and can be changed immediately.",
      "Choose one small, previously discussed action. Ask for a clear yes again before continuing.",
      "Close deliberately. Share what felt good, what could change and what aftercare would help now."
    ]
  },
  {
    key: "builtin:trust-protocol",
    title: "The Trust Protocol",
    titleEn: "The Trust Protocol",
    description: "Een interactieve scène rond communicatie, regie en wederzijds vertrouwen.",
    descriptionEn: "An interactive scene about communication, agency and mutual trust.",
    steps: [
      "Spreek het verbale stopwoord en een non-verbaal stopsignaal af. Test of iedereen de signalen begrijpt.",
      "Benoem harde grenzen, zachte grenzen en onderwerpen die vandaag niet aan bod komen.",
      "Wissel de leiding af in een korte, niet-risicovolle opdracht. De ander mag passen of de opdracht aanpassen.",
      "Doe een check-in zonder aannames. Luister naar het antwoord en verander het plan wanneer iemand dat vraagt."
    ],
    stepsEn: [
      "Agree on a verbal safeword and a non-verbal stop signal. Check that everyone understands them.",
      "Name hard limits, soft limits and topics that are off the table today.",
      "Take turns leading a short, low-risk prompt. The other person may pass or adapt it.",
      "Check in without assumptions. Listen and change the plan whenever someone asks."
    ]
  },
  {
    key: "builtin:afterglow",
    title: "The Afterglow",
    titleEn: "The Afterglow",
    description: "Een zachte afsluiting met ruimte voor herstel, reflectie en verbinding.",
    descriptionEn: "A gentle closing with room for recovery, reflection and connection.",
    steps: [
      "Vertraag en beëindig de scène bewust. Vraag wat de ander op dit moment nodig heeft.",
      "Kies samen passende aftercare: water, rust, warmte, praten of juist even ruimte.",
      "Deel één ding dat goed voelde en één ding dat je een volgende keer anders wilt afstemmen."
    ],
    stepsEn: [
      "Slow down and deliberately end the scene. Ask what the other person needs right now.",
      "Choose aftercare together: water, rest, warmth, conversation or some quiet space.",
      "Share one thing that felt good and one thing you would like to discuss differently next time."
    ]
  }
] as const;

const RITUAL_CARDS = [
  { id: "r01", nl: "Welke afspraak geeft jou vandaag rust?", en: "Which agreement helps you feel at ease today?" },
  { id: "r02", nl: "Welk klein gebaar helpt je om vertrouwen te voelen?", en: "What small gesture helps you feel trust?" },
  { id: "r03", nl: "Hoe wil je dat een check-in klinkt?", en: "How would you like a check-in to sound?" },
  { id: "r04", nl: "Wat zou een fijne afsluiting voor jullie zijn?", en: "What would a good closing look like for you?" },
  { id: "r05", nl: "Welke grens wil je vandaag extra helder houden?", en: "Which boundary should be especially clear today?" },
  { id: "r06", nl: "Wat betekent aandacht voor jou in deze dynamiek?", en: "What does attentiveness mean in this dynamic?" },
  { id: "r07", nl: "Welke rol voelt vandaag passend, en waarom?", en: "Which role feels right today, and why?" },
  { id: "r08", nl: "Wat heb je nodig om zonder druk nee te kunnen zeggen?", en: "What helps you say no without pressure?" }
] as const;

const MILESTONES = [
  ["first-run", "First Midnight", "Eerste ervaring bewust afgerond", "First experience consciously completed"],
  ["scene-maker", "The Director", "Eigen scène ontworpen", "Created a personal scene"],
  ["vault-keeper", "Vault Keeper", "Eerste versleutelde notitie bewaard", "Saved the first encrypted note"],
  ["sound-signature", "Sound Signature", "Eigen soundscape ingesteld", "Configured a personal soundscape"],
  ["secret-sender", "Secret Sender", "Een uitnodiging aangemaakt", "Created an invitation"],
  ["dominion-profile", "Know Thyself", "Persoonlijk dynamiekprofiel ingevuld", "Completed a personal dynamics profile"],
  ["ritual-keeper", "Ritual Keeper", "Eerste reflectiekaart getrokken", "Drew the first reflection card"]
] as const;

function sceneFromRecord(record: WorldRecord): Scene | null {
  const payload = record.payload as Partial<ScenePayload>;
  if (typeof payload.title !== "string" || !Array.isArray(payload.steps)) return null;
  const steps = payload.steps.filter((step): step is string => typeof step === "string" && step.trim().length > 0).slice(0, 40);
  if (!steps.length) return null;
  return { key: record.record_key, title: payload.title, description: typeof payload.description === "string" ? payload.description : "", steps, custom: true };
}
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer as ArrayBuffer;
}
async function deriveVaultKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations: 210000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export default function CinematicWorld({
  language, remoteProfileId, consentActive, canStartExperience,
  onBack, onRequestConsent, onSafetyPause, onSafetyResume, onSafetyStop,
  onOpenGameLibrary, onOpenAftercare, onOpenSafetyPlan
}: Props) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const [tab, setTab] = useState<Tab>(() => new URLSearchParams(window.location.search).has("invite") ? "invitation" : "experience");
  const [records, setRecords] = useState<RecordMap>(EMPTY_RECORDS);
  const [runs, setRuns] = useState<ExperienceRun[]>([]);
  const [experienceInvites, setExperienceInvites] = useState<ExperienceInvitation[]>([]);
  const [selectedInviteRunId, setSelectedInviteRunId] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [incomingInviteToken, setIncomingInviteToken] = useState<string | null>(() => consumeInvitationTokenFromUrl(window.location.href).token);
  const [invitePreview, setInvitePreview] = useState<ExperienceInvitationPreview | null>(null);
  const [invitePreviewLoading, setInvitePreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [runConsent, setRunConsent] = useState(false);
  const [selectedSceneKey, setSelectedSceneKey] = useState<string | null>(null);
  const [resumePrepared, setResumePrepared] = useState(false);
  const [stopSignal, setStopSignal] = useState("");
  const [checkIn, setCheckIn] = useState<CheckIn>("unset");
  const [pathChoice, setPathChoice] = useState<PathChoice>("unset");
  const [lastPathChoice, setLastPathChoice] = useState<PathChoice>("unset");
  const [interactionLog, setInteractionLog] = useState<Array<{ stepIndex: number; choice: string; at: string }>>([]);
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [runStatus, setRunStatus] = useState<"active" | "paused" | "completed" | null>(null);
  const [editingSceneKey, setEditingSceneKey] = useState<string | null>(null);
  const [sceneTitle, setSceneTitle] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [sceneSteps, setSceneSteps] = useState("Aankomen en afstemmen\nGrenzen en signalen bevestigen\nEen gezamenlijke opdracht kiezen\nAftercare en reflectie");
  const [vaultPassphrase, setVaultPassphrase] = useState("");
  const [vaultTitle, setVaultTitle] = useState("");
  const [vaultDraft, setVaultDraft] = useState("");
  const [vaultPlain, setVaultPlain] = useState<{ title: string; content: string } | null>(null);
  const [vaultMessage, setVaultMessage] = useState("");
  const vaultSensitiveRef = useRef(false);
  const vaultSensitive = Boolean(vaultPassphrase || vaultPlain || vaultTitle || vaultDraft);
  vaultSensitiveRef.current = vaultSensitive;
  const lockVault = useCallback((message?: string) => {
    setVaultPassphrase("");
    setVaultPlain(null);
    setVaultTitle("");
    setVaultDraft("");
    if (message) setVaultMessage(message);
  }, []);

  useLayoutEffect(() => {
    const consumed = consumeInvitationTokenFromUrl(window.location.href);
    if (consumed.hadInviteParameter) {
      window.history.replaceState(window.history.state, "", consumed.sanitizedUrl);
    }
  }, []);

  useEffect(() => bindVaultAutoLock(
    window,
    document,
    () => vaultSensitiveRef.current,
    (reason) => lockVault(
      reason === "idle"
        ? (language === "nl" ? "Kluis automatisch vergrendeld na inactiviteit." : "Vault automatically locked after inactivity.")
        : (language === "nl" ? "Kluis automatisch vergrendeld." : "Vault automatically locked."),
    ),
  ), [vaultSensitive, language, lockVault]);

  useEffect(() => {
    if (tab === "vault" || !vaultSensitive) return;
    lockVault(language === "nl" ? "Kluis vergrendeld bij verlaten van de kluis." : "Vault locked when leaving the vault.");
  }, [tab, vaultSensitive, language, lockVault]);
  const [domRole, setDomRole] = useState("");
  const [domAddress, setDomAddress] = useState("");
  const [domHardLimits, setDomHardLimits] = useState("");
  const [domSoftLimits, setDomSoftLimits] = useState("");
  const [domAftercare, setDomAftercare] = useState("");
  const [sensoryTheme, setSensoryTheme] = useState("embers");
  const [sensoryVolume, setSensoryVolume] = useState(0.035);
  const [soundOn, setSoundOn] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const [inviteTitle, setInviteTitle] = useState(t("Een uitnodiging na middernacht", "A Midnight Invitation"));
  const [inviteMessage, setInviteMessage] = useState(t(
    "Ik nodig je uit om samen iets nieuws te verkennen. Alleen als dit voor jou goed voelt. We bespreken vooraf grenzen, signalen en aftercare.",
    "I invite you to explore something new together. Only if it feels right to you. We will discuss boundaries, signals and aftercare first."
  ));
  const [currentCard, setCurrentCard] = useState<{ title: string; id: string } | null>(null);
  const [customCardTitle, setCustomCardTitle] = useState("");
  const [customCardText, setCustomCardText] = useState("");

  const scenes = useMemo<Scene[]>(() => {
    const builtIns: Scene[] = BUILTIN_SCENES.map((scene) => ({
      key: scene.key,
      title: language === "nl" ? scene.title : scene.titleEn,
      description: language === "nl" ? scene.description : scene.descriptionEn,
      steps: language === "nl" ? [...scene.steps] : [...scene.stepsEn],
      custom: false
    }));
    const custom = records.director.map(sceneFromRecord).filter((scene): scene is Scene => Boolean(scene));
    return [...custom, ...builtIns];
  }, [records.director, language]);
  const vaultRecords = records.vault;
  const ritualRecords = records.ritual;
  const customRitualCards = ritualRecords
    .filter((record) => record.record_key.startsWith("card:"))
    .map((record) => ({ id: record.record_key, title: String(record.payload.title ?? ""), text: String(record.payload.text ?? "") }))
    .filter((card) => card.title && card.text);
  const recoverableRun = runs.find((run) => run.user_id === remoteProfileId && (run.status === "active" || run.status === "paused")) ?? null;
  const invitableRuns = runs.filter((run) => run.user_id === remoteProfileId && run.status === "paused");
  const joinedRuns = runs.filter((run) => run.user_id !== remoteProfileId && (run.status === "active" || run.status === "paused"));
  const selectedScene = scenes.find((scene) => scene.key === selectedSceneKey) ?? null;

  async function refreshData(userId = remoteProfileId) {
    if (!userId) return;
    const [director, vault, dominion, sensory, invitation, ritual, club, history, invites] = await Promise.all([
      loadWorldRecords("director", userId),
      loadWorldRecords("vault", userId),
      loadWorldRecords("dominion", userId),
      loadWorldRecords("sensory", userId),
      loadWorldRecords("invitation", userId),
      loadWorldRecords("ritual", userId),
      loadWorldRecords("club", userId),
      loadExperienceRuns(userId),
      loadExperienceInvitations(userId)
    ]);
    setRecords({ director, vault, dominion, sensory, invitation, ritual, club });
    setRuns(history);
    setExperienceInvites(invites);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setRecords(EMPTY_RECORDS);
    setRuns([]);
    setExperienceInvites([]);
    setInviteLink("");
    setSelectedInviteRunId("");
    setVaultPlain(null);
    setVaultPassphrase("");
    setVaultDraft("");
    setVaultTitle("");
    setDomRole("");
    setDomAddress("");
    setDomHardLimits("");
    setDomSoftLimits("");
    setDomAftercare("");
    setRunConsent(false);
    setSelectedSceneKey(null);
    setResumePrepared(false);
    setStopSignal("");
    setCheckIn("unset");
    setPathChoice("unset");
    setLastPathChoice("unset");
    setInteractionLog([]);
    setActiveRunId(null);
    setActiveScene(null);
    setRunStatus(null);
    setSceneTitle("");
    setSceneDescription("");
    setSceneSteps("Aankomen en afstemmen\nGrenzen en signalen bevestigen\nEen gezamenlijke opdracht kiezen\nAftercare en reflectie");
    setInviteTitle(t("Een uitnodiging na middernacht", "A Midnight Invitation"));
    setInviteMessage(t("Ik nodig je uit om samen iets nieuws te verkennen. Alleen als dit voor jou goed voelt. We bespreken vooraf grenzen, signalen en aftercare.", "I invite you to explore something new together. Only if it feels right to you. We will discuss boundaries, signals and aftercare first."));
    setCustomCardTitle("");
    setCustomCardText("");
    setCurrentCard(null);
    setVaultMessage("");
    setMessage("");
    if (audioContext.current) { void audioContext.current.close(); audioContext.current = null; masterGain.current = null; setSoundOn(false); }
    if (!remoteProfileId) {
      setLoading(false);
      setError(t("Meld je aan om deze privéruimtes veilig aan je AFTER HOURS-account te koppelen.", "Sign in to securely connect these private spaces to your AFTER HOURS account."));
      return () => { active = false; };
    }
    const load = async () => {
      try {
        const [director, vault, dominion, sensory, invitation, ritual, club, history, invites] = await Promise.all([
          loadWorldRecords("director", remoteProfileId),
          loadWorldRecords("vault", remoteProfileId),
          loadWorldRecords("dominion", remoteProfileId),
          loadWorldRecords("sensory", remoteProfileId),
          loadWorldRecords("invitation", remoteProfileId),
          loadWorldRecords("ritual", remoteProfileId),
          loadWorldRecords("club", remoteProfileId),
          loadExperienceRuns(remoteProfileId),
          loadExperienceInvitations(remoteProfileId)
        ]);
        if (!active) return;
        setRecords({ director, vault, dominion, sensory, invitation, ritual, club });
        setRuns(history);
        setExperienceInvites(invites);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : t("Privégegevens konden niet worden geladen.", "Private data could not be loaded."));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [remoteProfileId, language]);

  useEffect(() => {
    let active = true;
    if (!incomingInviteToken || !remoteProfileId) {
      setInvitePreview(null);
      setInvitePreviewLoading(false);
      return () => { active = false; };
    }
    const loadPreview = async () => {
      setInvitePreviewLoading(true);
      setInvitePreview(null);
      try {
        if (!/^[a-f0-9]{64}$/i.test(incomingInviteToken)) throw new Error(t("Deze uitnodigingslink is ongeldig.", "This invitation link is invalid."));
        const tokenBytes = new Uint8Array(incomingInviteToken.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)));
        const digest = await crypto.subtle.digest("SHA-256", tokenBytes);
        const tokenHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const preview = await previewExperienceInvitation(tokenHash, remoteProfileId);
        if (active) setInvitePreview(preview);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : t("De uitnodiging kan niet worden bekeken.", "The invitation could not be previewed."));
      } finally {
        if (active) setInvitePreviewLoading(false);
      }
    };
    void loadPreview();
    return () => { active = false; };
  }, [incomingInviteToken, remoteProfileId]);

  useEffect(() => {
    const profile = records.dominion.find((record) => record.record_key === "profile");
    if (!profile) return;
    const payload = profile.payload;
    setDomRole(String(payload.role ?? ""));
    setDomAddress(String(payload.address ?? ""));
    setDomHardLimits(String(payload.hardLimits ?? ""));
    setDomSoftLimits(String(payload.softLimits ?? ""));
    setDomAftercare(String(payload.aftercare ?? ""));
  }, [records.dominion]);

  useEffect(() => {
    const preferences = records.sensory.find((record) => record.record_key === "preferences");
    if (!preferences) return;
    setSensoryTheme(String(preferences.payload.theme ?? "embers"));
    const volume = Number(preferences.payload.volume);
    if (Number.isFinite(volume)) setSensoryVolume(Math.max(0.005, Math.min(0.12, volume)));
  }, [records.sensory]);

  useEffect(() => {
    if (!consentActive && runStatus === "active" && activeRunId) void stopScene(true);
  }, [consentActive, runStatus, activeRunId]);

  useEffect(() => () => {
    if (audioContext.current) {
      void audioContext.current.close();
      audioContext.current = null;
      masterGain.current = null;
    }
  }, []);

  async function persist(module: WorldModule, key: string, payload: Record<string, unknown>, milestone?: string) {
    if (!remoteProfileId) throw new Error(t("Meld je eerst aan om veilig op te slaan.", "Sign in first to save securely."));
    const saved = await saveWorldRecord(module, key, payload, remoteProfileId);
    setRecords((current) => ({
      ...current,
      [module]: [saved, ...current[module].filter((record) => record.record_key !== key)]
    }));
    if (milestone) {
      const definition = MILESTONES.find((item) => item[0] === milestone);
      if (definition) {
        const recordKey = "milestone:" + milestone;
        const badge = await saveWorldRecord("club", recordKey, {
          title: language === "nl" ? definition[2] : definition[3],
          unlockedAt: new Date().toISOString()
        }, remoteProfileId);
        setRecords((current) => ({
          ...current,
          club: [badge, ...current.club.filter((record) => record.record_key !== recordKey)]
        }));
      }
    }
    return saved;
  }

  function requestStartAccess() {
    if (!canStartExperience || !consentActive) {
      onRequestConsent();
      setMessage(t("Controleer eerst je account en de algemene consentstatus.", "Review your account and app consent status first."));
      return false;
    }
    if (!runConsent || stopSignal.trim().length < 2) {
      setMessage(t("Bevestig je toestemming voor deze specifieke scène en vul je afgesproken stopsignaal in.", "Confirm consent for this specific scene and enter your agreed stop signal."));
      return false;
    }
    return true;
  }

  async function startScene(scene: Scene) {
    setError("");
    setMessage("");
    if (!requestStartAccess()) return;
    if (!remoteProfileId) { onRequestConsent(); return; }
    setBusy(true);
    try {
      const snapshot = { sceneKey: scene.key, title: scene.title, description: scene.description, steps: scene.steps };
      const runId = await createExperienceRun({
        sceneKey: scene.key,
        sceneSnapshot: snapshot,
        totalSteps: scene.steps.length,
        expectedUserId: remoteProfileId
      });
      setActiveScene(scene);
      setActiveRunId(runId);
      setStepIndex(0);
      setRunStatus("active");
      setCheckIn("unset");
      setPathChoice("unset");
      setLastPathChoice("unset");
      setInteractionLog([]);
      setRunConsent(false);
      setSelectedSceneKey(null);
      setResumePrepared(false);
      setStopSignal("");
      await refreshData();
      setMessage(t("Je scène is gestart. Je toestemming is voor deze run vastgelegd.", "Your scene has started. Your consent for this run has been recorded."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("De scène kon niet veilig worden gestart.", "The scene could not be started safely."));
    } finally {
      setBusy(false);
    }
  }

  async function resumeScene(run: ExperienceRun) {
    setError("");
    setMessage("");
    if (!requestStartAccess()) return;
    const snapshot = run.scene_snapshot as { sceneKey?: unknown; title?: unknown; description?: unknown; steps?: unknown };
    if (typeof snapshot.title !== "string" || !Array.isArray(snapshot.steps)) {
      setError(t("Deze opgeslagen scène kan niet worden hervat.", "This saved scene cannot be resumed."));
      return;
    }
    const steps = snapshot.steps.filter((step): step is string => typeof step === "string").slice(0, 40);
    if (!steps.length) {
      setError(t("Deze scène bevat geen hervatbare stappen.", "This scene has no resumable steps."));
      return;
    }
    setBusy(true);
    try {
      await resumeExperienceRun({ runId: run.id, expectedUserId: remoteProfileId!, currentStep: run.current_step });
      setActiveScene({
        key: typeof snapshot.sceneKey === "string" ? snapshot.sceneKey : run.scene_key,
        title: snapshot.title,
        description: typeof snapshot.description === "string" ? snapshot.description : "",
        steps,
        custom: !String(snapshot.sceneKey ?? "").startsWith("builtin:")
      });
      setActiveRunId(run.id);
      setStepIndex(Math.min(run.current_step, steps.length - 1));
      setRunStatus("active");
      setCheckIn("unset");
      setPathChoice("unset");
      setInteractionLog(run.interaction_log ?? []);
      setLastPathChoice((run.interaction_log?.[run.interaction_log.length - 1]?.choice as PathChoice) ?? "unset");
      setRunConsent(false);
      setResumePrepared(false);
      setSelectedSceneKey(null);
      setStopSignal("");
      await refreshData();
      onSafetyResume();
      setMessage(t("De scène is hervat na een nieuwe consentbevestiging.", "The scene resumed after fresh consent confirmation."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Hervatten is niet gelukt.", "Could not resume the scene."));
    } finally {
      setBusy(false);
    }
  }

  async function pauseScene() {
    if (!activeRunId || !remoteProfileId) return;
    setBusy(true);
    try {
      await updateExperienceRun({ runId: activeRunId, expectedUserId: remoteProfileId, status: "paused", currentStep: stepIndex });
      setRunStatus("paused");
      setCheckIn("unset");
      setPathChoice("unset");
      onSafetyPause();
      setMessage(t("Gepauzeerd. Voor hervatten is een nieuwe check-in en consent nodig.", "Paused. Resuming requires a fresh check-in and consent."));
      try { await refreshData(); } catch { setMessage(t("Gepauzeerd. Je verbinding is nodig om de geschiedenis te verversen.", "Paused. Reconnect to refresh the history.")); }
    } catch {
      setRunStatus("paused");
      setCheckIn("unset");
      onSafetyPause();
      onSafetyStop();
      setError(t("De server kon de pauze niet bevestigen. De app is daarom uit voorzorg gestopt. Controleer je verbinding voordat je opnieuw begint.", "The server could not confirm the pause. The app has therefore stopped as a precaution. Check your connection before starting again."));
    } finally {
      setBusy(false);
    }
  }

  async function stopScene(fromConsentChange = false) {
    if (activeRunId && remoteProfileId) {
      try {
        await updateExperienceRun({ runId: activeRunId, expectedUserId: remoteProfileId, status: "stopped", currentStep: stepIndex });
        await refreshData();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t("De stop is lokaal uitgevoerd, maar de serverbevestiging ontbreekt.", "The stop was applied locally, but server confirmation is missing."));
      }
    }
    setRunStatus(null);
    setActiveRunId(null);
    setActiveScene(null);
    setRunConsent(false);
    setResumePrepared(false);
    setSelectedSceneKey(null);
    setStopSignal("");
    setCheckIn("unset");
    setPathChoice("unset");
    if (!fromConsentChange) setMessage(t("De scène is gestopt. Er wordt niets automatisch hervat.", "The scene has stopped. Nothing will resume automatically."));
    onSafetyStop();
  }

  async function completeScene(finalInteractionLog = interactionLog) {
    if (!activeRunId || !activeScene || !remoteProfileId) return;
    setBusy(true);
    try {
      await updateExperienceRun({
        runId: activeRunId,
        expectedUserId: remoteProfileId,
        status: "completed",
        currentStep: activeScene.steps.length,
        completed: true,
        interactionLog: finalInteractionLog
      });
      setInteractionLog(finalInteractionLog);
      setPathChoice("unset");
      const firstCompletion = runs.filter((run) => run.status === "completed").length === 0;
      setRunStatus("completed");
      setCheckIn("unset");
      if (firstCompletion) {
        const definition = MILESTONES[0];
        await persist("club", "milestone:" + definition[0], {
          title: language === "nl" ? definition[2] : definition[3],
          unlockedAt: new Date().toISOString()
        });
      }
      await refreshData();
      setMessage(t("Ervaring afgerond. De aftercarefase staat nu centraal.", "Experience complete. Aftercare is now the focus."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Afronden kon niet worden opgeslagen.", "Could not save completion."));
    } finally {
      setBusy(false);
    }
  }

  async function advanceStep() {
    if (!activeScene || !activeRunId || !remoteProfileId || runStatus !== "active") return;
    if (checkIn === "red") { await stopScene(); return; }
    if (checkIn === "yellow") { await pauseScene(); return; }
    if (checkIn !== "green") {
      setMessage(t("Kies eerst groen, geel of rood bij je check-in.", "Choose green, yellow or red at your check-in first."));
      return;
    }
    if (pathChoice === "unset") {
      setMessage(t("Kies eerst hoe je deze fase wilt vervolgen.", "Choose how you want to continue this step first."));
      return;
    }
    const nextLog = [...interactionLog, { stepIndex, choice: pathChoice, at: new Date().toISOString() }];
    if (stepIndex >= activeScene.steps.length - 1) {
      await completeScene(nextLog);
      return;
    }
    setBusy(true);
    try {
      const next = stepIndex + 1;
      await updateExperienceRun({
        runId: activeRunId,
        expectedUserId: remoteProfileId,
        status: "active",
        currentStep: next,
        interactionLog: nextLog
      });
      setInteractionLog(nextLog);
      setLastPathChoice(pathChoice);
      setPathChoice("unset");
      setStepIndex(next);
      setCheckIn("unset");
      await refreshData();
    } catch (cause) {
      // Fail closed if another participant withdrew consent or the server state changed.
      setRunStatus(null);
      setActiveRunId(null);
      setActiveScene(null);
      setRunConsent(false);
      setCheckIn("unset");
      setPathChoice("unset");
      onSafetyStop();
      setError(cause instanceof Error ? cause.message : t("De voortgang kon niet worden opgeslagen. De ervaring is uit voorzorg gestopt.", "Progress could not be saved. The experience was stopped as a precaution."));
    } finally {
      setBusy(false);
    }
  }

  async function handleBack() {
    if (runStatus === "active") await pauseScene();
    setVaultPassphrase("");
    setVaultPlain(null);
    if (audioContext.current) {
      await audioContext.current.close();
      audioContext.current = null;
      masterGain.current = null;
      setSoundOn(false);
    }
    onBack();
  }

  async function saveDirectorScene() {
    setError("");
    const steps = sceneSteps.split("\n").map((step) => step.trim()).filter(Boolean).slice(0, 40);
    if (!sceneTitle.trim() || !steps.length) {
      setMessage(t("Geef je scène een naam en voeg minimaal één fase toe.", "Name your scene and add at least one phase."));
      return;
    }
    setBusy(true);
    try {
      const key = editingSceneKey ?? ("scene:" + crypto.randomUUID());
      await persist("director", key, {
        title: sceneTitle.trim(),
        description: sceneDescription.trim(),
        steps,
        language,
        updatedAt: new Date().toISOString()
      }, "scene-maker");
      setEditingSceneKey(key);
      setMessage(t("Scène opgeslagen. Je vindt hem nu direct terug in The Experience Engine.", "Scene saved. You can now find it directly in The Experience Engine."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Scène opslaan is niet gelukt.", "Could not save scene."));
    } finally {
      setBusy(false);
    }
  }

  function editScene(scene: Scene) {
    setEditingSceneKey(scene.key);
    setSceneTitle(scene.title);
    setSceneDescription(scene.description);
    setSceneSteps(scene.steps.join("\n"));
    setTab("director");
  }

  async function removeScene(key: string) {
    if (!remoteProfileId || !window.confirm(t("Deze eigen scène definitief verwijderen?", "Permanently delete this personal scene?"))) return;
    try {
      await deleteWorldRecord("director", key, remoteProfileId);
      setRecords((current) => ({ ...current, director: current.director.filter((record) => record.record_key !== key) }));
      if (editingSceneKey === key) {
        setEditingSceneKey(null);
        setSceneTitle("");
        setSceneDescription("");
        setSceneSteps("");
      }
      setMessage(t("Scène verwijderd.", "Scene deleted."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Verwijderen is niet gelukt.", "Could not delete scene."));
    }
  }

  async function saveVaultNote() {
    setError("");
    if (!remoteProfileId) { setVaultPassphrase(""); setError(t("Meld je aan om de versleutelde kluis te gebruiken.", "Sign in to use the encrypted vault.")); return; }
    if (vaultPassphrase.length < 10 || !vaultTitle.trim() || !vaultDraft.trim()) {
      setVaultPassphrase("");
      setVaultMessage(t("Gebruik minimaal 10 tekens als wachtzin en vul titel en notitie in.", "Use a passphrase of at least 10 characters and enter a title and note."));
      return;
    }
    setBusy(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveVaultKey(vaultPassphrase, salt);
      const plaintext = new TextEncoder().encode(JSON.stringify({ title: vaultTitle.trim(), content: vaultDraft }));
      const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
      const recordKey = "vault:" + crypto.randomUUID();
      await persist("vault", recordKey, {
        version: 1,
        algorithm: "AES-256-GCM",
        kdf: "PBKDF2-SHA256-210000",
        salt: bytesToBase64(salt),
        iv: bytesToBase64(iv),
        ciphertext: bytesToBase64(new Uint8Array(encrypted))
      }, "vault-keeper");
      setVaultTitle("");
      setVaultDraft("");
      setVaultPlain(null);
      setVaultMessage(t("Versleuteld opgeslagen. De server heeft alleen ciphertext ontvangen.", "Encrypted and saved. The server received ciphertext only."));
    } catch (cause) {
      setVaultMessage(cause instanceof Error ? cause.message : t("Versleutelen of opslaan is niet gelukt.", "Encryption or saving failed."));
    } finally {
      setVaultPassphrase("");
      setBusy(false);
    }
  }

  async function unlockVault(record: WorldRecord | undefined) {
    if (!record) { setVaultPassphrase(""); setVaultMessage(t("Er is nog geen versleutelde notitie.", "There is no encrypted note yet.")); return; }
    if (vaultPassphrase.length < 10) { setVaultPassphrase(""); setVaultMessage(t("Vul eerst je wachtzin in.", "Enter your passphrase first.")); return; }
    try {
      const payload = record.payload as { salt?: string; iv?: string; ciphertext?: string };
      if (!payload.salt || !payload.iv || !payload.ciphertext) throw new Error("Invalid encrypted vault item.");
      const key = await deriveVaultKey(vaultPassphrase, base64ToBytes(payload.salt));
      const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(payload.iv)) },
        key,
        toArrayBuffer(base64ToBytes(payload.ciphertext))
      );
      const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as { title?: string; content?: string };
      setVaultPlain({ title: String(parsed.title ?? ""), content: String(parsed.content ?? "") });
      setVaultMessage(t("Notitie alleen in deze open sessie ontsleuteld.", "Note decrypted in this open session only."));
    } catch {
      setVaultPlain(null);
      setVaultMessage(t("Ontgrendelen mislukt. Controleer je wachtzin.", "Could not unlock. Check your passphrase."));
    } finally {
      setVaultPassphrase("");
    }
  }

  async function deleteVaultNote(key: string) {
    if (!remoteProfileId || !window.confirm(t("Deze versleutelde notitie definitief verwijderen?", "Permanently delete this encrypted note?"))) return;
    try {
      await deleteWorldRecord("vault", key, remoteProfileId);
      setRecords((current) => ({ ...current, vault: current.vault.filter((record) => record.record_key !== key) }));
      lockVault(t("Versleutelde notitie verwijderd en kluis vergrendeld.", "Encrypted note deleted and vault locked."));
    } catch (cause) {
      setVaultMessage(cause instanceof Error ? cause.message : t("Verwijderen is niet gelukt.", "Could not delete note."));
    }
  }

  async function saveDominion() {
    setBusy(true);
    try {
      await persist("dominion", "profile", {
        role: domRole.trim(),
        address: domAddress.trim(),
        hardLimits: domHardLimits.trim(),
        softLimits: domSoftLimits.trim(),
        aftercare: domAftercare.trim(),
        updatedAt: new Date().toISOString()
      }, "dominion-profile");
      setMessage(t("Je dynamiekprofiel is privé opgeslagen.", "Your dynamics profile has been saved privately."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Profiel opslaan is niet gelukt.", "Could not save profile."));
    } finally {
      setBusy(false);
    }
  }

  async function saveSensory() {
    setBusy(true);
    try {
      await persist("sensory", "preferences", { theme: sensoryTheme, volume: sensoryVolume, updatedAt: new Date().toISOString() }, "sound-signature");
      setMessage(t("Je soundscape-instellingen zijn opgeslagen.", "Your soundscape settings have been saved."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Soundscape opslaan is niet gelukt.", "Could not save soundscape."));
    } finally {
      setBusy(false);
    }
  }

  async function startAmbient() {
    try {
      const context = new AudioContext();
      const master = context.createGain();
      const filter = context.createBiquadFilter();
      const low = context.createOscillator();
      const high = context.createOscillator();
      const pulse = context.createOscillator();
      const pulseGain = context.createGain();
      const baseFrequency = sensoryTheme === "rain" ? 72 : sensoryTheme === "noir" ? 48 : 56;
      low.type = "sine";
      low.frequency.value = baseFrequency;
      high.type = "triangle";
      high.frequency.value = baseFrequency * 1.51;
      high.detune.value = -9;
      pulse.type = "sine";
      pulse.frequency.value = 0.13;
      pulseGain.gain.value = sensoryVolume * 0.18;
      master.gain.value = sensoryVolume;
      filter.type = "lowpass";
      filter.frequency.value = sensoryTheme === "rain" ? 480 : 310;
      low.connect(filter);
      high.connect(filter);
      filter.connect(master);
      pulse.connect(pulseGain);
      pulseGain.connect(master.gain);
      master.connect(context.destination);
      low.start();
      high.start();
      pulse.start();
      await context.resume();
      audioContext.current = context;
      masterGain.current = master;
      setSoundOn(true);
    } catch {
      setError(t("Je browser kon de soundscape niet starten. Controleer audio-instellingen.", "Your browser could not start the soundscape. Check audio settings."));
    }
  }

  async function stopAmbient() {
    if (audioContext.current) {
      await audioContext.current.close();
      audioContext.current = null;
      masterGain.current = null;
    }
    setSoundOn(false);
  }

  function updateVolume(value: number) {
    setSensoryVolume(value);
    if (masterGain.current) masterGain.current.gain.setTargetAtTime(value, masterGain.current.context.currentTime, 0.2);
  }

  async function createRunInvitation(runId: string) {
    if (!remoteProfileId) return;
    const run = runs.find((item) => item.id === runId && item.user_id === remoteProfileId);
    if (!run || run.status !== "paused") {
      setError(t("Pauzeer eerst je eigen ervaring. De scène blijft gepauzeerd totdat iedereen de uitnodiging heeft bekeken en geaccepteerd.", "Pause your own experience first. The scene must remain paused until everyone has reviewed and accepted the invitation."));
      return;
    }
    setBusy(true);
    setError("");
    setInviteLink("");
    try {
      const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
      const token = Array.from(tokenBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
      const digest = await crypto.subtle.digest("SHA-256", tokenBytes);
      const tokenHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      await createExperienceInvitation({ runId, tokenHash, expectedUserId: remoteProfileId });
      const url = new URL(window.location.href);
      url.searchParams.set("screen", "cinematic");
      url.searchParams.set("invite", token);
      url.hash = "";
      setInviteLink(url.toString());
      await refreshData();
      try {
        if (navigator.share) {
          await navigator.share({ title: t("AFTER HOURS · uitnodiging", "AFTER HOURS · invitation"), text: t("Je bent uitgenodigd om deel te nemen. Je kiest zelf of je accepteert. Inloggen is vereist.", "You are invited to participate. You choose whether to accept. Sign-in is required."), url: url.toString() });
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url.toString());
          setMessage(t("Veilige uitnodigingslink gekopieerd. De link verloopt over zeven dagen.", "Secure invitation link copied. It expires in seven days."));
        } else {
          setMessage(t("Uitnodigingslink aangemaakt. Kopieer de link hieronder.", "Invitation link created. Copy the link below."));
        }
      } catch (cause) {
        if (!(cause instanceof Error && cause.name === "AbortError")) throw cause;
        setMessage(t("Delen geannuleerd. De link blijft hieronder beschikbaar.", "Sharing cancelled. The link remains available below."));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Uitnodiging kon niet worden aangemaakt.", "Could not create invitation."));
    } finally {
      setBusy(false);
    }
  }

  async function acceptIncomingInvitation() {
    if (!remoteProfileId || !incomingInviteToken || !invitePreview) return;
    setBusy(true);
    setError("");
    try {
      const tokenBytes = new Uint8Array(incomingInviteToken.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
      if (!/^[a-f0-9]{64}$/i.test(incomingInviteToken) || tokenBytes.length !== 32) {
        throw new Error(t("Deze uitnodigingslink is ongeldig.", "This invitation link is invalid."));
      }
      const digest = await crypto.subtle.digest("SHA-256", tokenBytes);
      const tokenHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const accepted = await acceptExperienceInvitation(tokenHash, remoteProfileId);
      setIncomingInviteToken(null);
      setInvitePreview(null);
      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      window.history.replaceState({}, "", url.toString());
      await refreshData();
      setMessage(t("Uitnodiging geaccepteerd. Je eigen toestemming is vastgelegd. De eigenaar kan de ervaring nu hervatten; als jij later je toestemming intrekt, stopt de ervaring voor iedereen.", "Invitation accepted. Your own consent has been recorded. The host can now resume; if you later withdraw consent, the experience stops for everyone."));
      setTab("invitation");
      void accepted;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Uitnodiging accepteren is niet gelukt.", "Could not accept invitation."));
    } finally {
      setBusy(false);
    }
  }

  async function withdrawSharedConsent(runId: string) {
    if (!remoteProfileId) return;
    if (!window.confirm(t("Je toestemming intrekken? De gedeelde ervaring wordt direct voor iedereen gestopt.", "Withdraw your consent? The shared experience will immediately stop for everyone."))) return;
    setBusy(true);
    try {
      await withdrawExperienceConsent(runId, remoteProfileId);
      await refreshData();
      setMessage(t("Je toestemming is ingetrokken. De gedeelde ervaring is gestopt.", "Your consent has been withdrawn. The shared experience has stopped."));
      onSafetyStop();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Toestemming intrekken is niet gelukt.", "Could not withdraw consent."));
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvite(invite: ExperienceInvitation) {
    if (!remoteProfileId || invite.status !== "pending") return;
    if (!window.confirm(t("Deze uitnodigingslink direct ongeldig maken?", "Revoke this invitation link immediately?"))) return;
    setBusy(true);
    try {
      await revokeExperienceInvitation(invite.id, remoteProfileId);
      await refreshData();
      setMessage(t("Uitnodigingslink ingetrokken.", "Invitation link revoked."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Uitnodiging intrekken is niet gelukt.", "Could not revoke invitation."));
    } finally {
      setBusy(false);
    }
  }

  async function createInvitation(shareAfterSave = false) {
    setBusy(true);
    setError("");
    try {
      const key = "invitation:" + crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const url = new URL(window.location.href);
      url.searchParams.set("screen", "cinematic");
      url.hash = "";
      const body = inviteTitle.trim() + "\n\n" + inviteMessage.trim() + "\n\n" + url.toString();
      await persist("invitation", key, { title: inviteTitle.trim(), message: inviteMessage.trim(), createdAt, shareStatus: "draft" }, "secret-sender");
      if (shareAfterSave) {
        if (navigator.share) {
          await navigator.share({ title: inviteTitle.trim(), text: body, url: url.toString() });
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(body);
          setMessage(t("Uitnodiging opgeslagen en gekopieerd. Je kunt hem nu zelf versturen.", "Invitation saved and copied. You can send it yourself."));
        } else {
          setMessage(t("Uitnodiging opgeslagen. Kopieer de tekst handmatig om hem te delen.", "Invitation saved. Copy the text manually to share it."));
        }
        await persist("invitation", key, { title: inviteTitle.trim(), message: inviteMessage.trim(), createdAt, sharedAt: new Date().toISOString(), shareStatus: "shared" });
      } else {
        setMessage(t("Uitnodiging als concept opgeslagen.", "Invitation saved as a draft."));
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") {
        setMessage(t("Delen geannuleerd. Je concept blijft bewaard.", "Sharing cancelled. Your draft remains saved."));
      } else {
        setError(cause instanceof Error ? cause.message : t("Uitnodiging opslaan is niet gelukt.", "Could not save invitation."));
      }
    } finally {
      setBusy(false);
    }
  }

  async function drawRitualCard() {
    const cards = [
      ...RITUAL_CARDS.map((card) => ({ id: card.id, title: language === "nl" ? card.nl : card.en })),
      ...customRitualCards.map((card) => ({ id: card.id, title: card.title }))
    ];
    if (!cards.length) return;
    let selected = cards[Math.floor(Math.random() * cards.length)];
    if (cards.length > 1 && selected.id === currentCard?.id) selected = cards[(cards.findIndex((card) => card.id === selected.id) + 1) % cards.length];
    setCurrentCard(selected);
    try {
      await persist("ritual", "draw:" + crypto.randomUUID(), { cardId: selected.id, title: selected.title, drawnAt: new Date().toISOString() }, "ritual-keeper");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Kaart getrokken, maar de geschiedenis kon niet worden opgeslagen.", "Card drawn, but history could not be saved."));
    }
  }


  async function removeRitualCard(key: string) {
    if (!remoteProfileId || !window.confirm(t("Deze eigen reflectiekaart verwijderen?", "Delete this custom reflection card?"))) return;
    try {
      await deleteWorldRecord("ritual", key, remoteProfileId);
      setRecords((current) => ({ ...current, ritual: current.ritual.filter((record) => record.record_key !== key) }));
      if (currentCard?.id === key) setCurrentCard(null);
      setMessage(t("Eigen kaart verwijderd.", "Custom card deleted."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Kaart verwijderen is niet gelukt.", "Could not delete card."));
    }
  }

  async function saveCustomRitualCard() {
    if (!customCardTitle.trim() || !customCardText.trim()) return;
    try {
      await persist("ritual", "card:" + crypto.randomUUID(), {
        title: customCardTitle.trim(),
        text: customCardText.trim(),
        language,
        createdAt: new Date().toISOString()
      });
      setCustomCardTitle("");
      setCustomCardText("");
      setMessage(t("Je eigen reflectiekaart is toegevoegd aan Ritual Deck.", "Your custom reflection card was added to Ritual Deck."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Kaart opslaan is niet gelukt.", "Could not save card."));
    }
  }

  function exportBackup() {
    const backup = {
      product: "AFTER HOURS",
      exportedAt: new Date().toISOString(),
      note: "Vault records contain ciphertext only. Keep this backup in a trusted location.",
      records,
      experienceRuns: runs
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "after-hours-private-world-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAllWorldData() {
    if (!remoteProfileId || !window.confirm(t("Alle scènes, kluisnotities, profielen, uitnodigingen, rituelen en ervaringsgeschiedenis definitief verwijderen?", "Permanently delete all scenes, vault notes, profiles, invitations, rituals and experience history?"))) return;
    const wasRunning = runStatus === "active" || runStatus === "paused";
    setBusy(true);
    try {
      for (const module of MODULES) {
        for (const record of records[module]) await deleteWorldRecord(module, record.record_key, remoteProfileId);
      }
      for (const run of runs) await deleteExperienceRun(run.id, remoteProfileId);
      setRecords(EMPTY_RECORDS);
      setRuns([]);
      setVaultPlain(null);
      setActiveRunId(null);
      setActiveScene(null);
      setRunStatus(null);
      setMessage(t("Alle AFTER HOURS World-gegevens zijn verwijderd.", "All AFTER HOURS World data has been deleted."));
      if (wasRunning) onSafetyStop();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Niet alle gegevens konden worden verwijderd. Probeer opnieuw.", "Not all data could be deleted. Try again."));
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  const tabItems: { id: Tab; label: string; icon: typeof Flame }[] = [
    { id: "experience", label: "Experience Engine", icon: Play },
    { id: "director", label: "Director's Room", icon: Clapperboard },
    { id: "vault", label: "Black Vault", icon: LockKeyhole },
    { id: "sensory", label: "Sensory Lab", icon: Music2 },
    { id: "invitation", label: "Secret Invitation", icon: Mail },
    { id: "dominion", label: "Dominion", icon: ShieldCheck },
    { id: "deck", label: "Ritual Deck", icon: Star },
    { id: "club", label: "Midnight Club", icon: Flame }
  ];
  const completedRuns = runs.filter((run) => run.status === "completed").length;
  const sceneCount = records.director.filter((record) => record.record_key.startsWith("scene:")).length;
  const ritualDrawCount = records.ritual.filter((record) => record.record_key.startsWith("draw:")).length;
  const interactionCount = runs.reduce((total, run) => total + (run.interaction_log?.length ?? 0), 0);
  const unlocked = new Set(records.club.filter((record) => record.record_key.startsWith("milestone:")).map((record) => record.record_key.slice("milestone:".length)));
  const memberLevel = Math.max(1, Math.floor((completedRuns + sceneCount + ritualDrawCount) / 3) + 1);

  return (
    <main className="cw-world">
      <div className="cw-world-backdrop" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}visuals/ah-grand-candlelit-chamber.svg`} alt="" decoding="async" /></div>
      <header className="cw-header">
        <button type="button" onClick={() => void handleBack()} aria-label={t("Terug", "Back")}><ArrowLeft /></button>
        <span>AFTER HOURS · PRIVATE WORLD</span>
        <span className="cw-live"><i /> {loading ? t("SYNCHRONISEERT", "SYNCING") : remoteProfileId ? "PRIVATE" : "ACCOUNT REQUIRED"}</span>
      </header>

      <section className="cw-hero">
        <div className="cw-hero-emblem"><Flame /></div>
        <span className="cw-kicker">A WORLD AFTER DARK</span>
        <h1>The Midnight Experience</h1>
        <p>{t(
          "Geen losse tools. Eén persoonlijke wereld waarin scènes, rituelen, privacy en aftercare samenkomen. Jij houdt altijd de regie.",
          "Not a set of separate tools. One personal world where scenes, rituals, privacy and aftercare work together. You always stay in control."
        )}</p>
      </section>

      <div className="cw-tabs" role="tablist" aria-label="AFTER HOURS private world">
        {tabItems.map((item) => {
          const Icon = item.icon;
          return (
            <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "active" : ""} key={item.id} onClick={() => { setTab(item.id); setMessage(""); setError(""); }}>
              <Icon size={14} />{item.label}
            </button>
          );
        })}
      </div>

      {error && <div className="cw-alert" role="alert"><ShieldCheck size={16} /><span>{error}</span></div>}
      {message && <div className="cw-feedback" role="status" aria-live="polite"><CheckCircle2 size={15} />{message}</div>}
      {loading && <div className="cw-loading">{t("Je privéwereld wordt veilig geladen…", "Loading your private world securely…")}</div>}
      {!remoteProfileId && <div className="cw-account-gate"><LockKeyhole /><div><strong>{t("Persoonlijke opslag vereist", "Personal storage required")}</strong><p>{t("Je kunt de wereld bekijken, maar opslaan, hervatten en privégegevens openen vereist een ingelogd AFTER HOURS-account.", "You can explore the world, but saving, resuming and opening private data requires a signed-in AFTER HOURS account.")}</p></div><button type="button" onClick={onRequestConsent}>{t("Account controleren", "Check account")}</button></div>}

      {tab === "experience" && (
        <section className="cw-section">
          <div className="cw-section-heading"><span className="cw-kicker">01 · THE HEART OF AFTER HOURS</span><h2><Sparkles /> The Experience Engine</h2><p>{t("Kies een bestaande scène of speel je eigen ontwerp uit The Director's Room. Elke stap wordt bewaard, elke hervatting vraagt opnieuw om consent.", "Choose a built-in scene or run your own creation from The Director's Room. Every step is saved, and every resume requires fresh consent.")}</p></div>

          {recoverableRun && !activeRunId && (
            <div className="cw-resume-card">
              <div><span className="cw-kicker">{t("OPENSTAANDE ERVARING", "UNFINISHED EXPERIENCE")}</span><h3>{String(recoverableRun.scene_snapshot.title ?? recoverableRun.scene_key)}</h3><p>{t("Laatst opgeslagen bij fase", "Last saved at step")} {recoverableRun.current_step + 1} / {recoverableRun.total_steps}. {t("Er wordt niets automatisch hervat.", "Nothing resumes automatically.")}</p></div>
              <button type="button" className="cw-primary" onClick={() => { setResumePrepared(true); setSelectedSceneKey(null); setRunConsent(false); setStopSignal(""); setMessage(t("Bevestig opnieuw consent en je stopsignaal voordat je hervat.", "Confirm consent and your stop signal again before resuming.")); }} disabled={busy}>{t("Voorbereiden", "Prepare")}</button>
              {resumePrepared && <div className="cw-run-gate"><label><input type="checkbox" checked={runConsent} onChange={(event) => setRunConsent(event.target.checked)} />{t("Ik stem nu opnieuw vrijwillig in met deze specifieke scène.", "I freely consent again to this specific scene.")}</label><input value={stopSignal} onChange={(event) => setStopSignal(event.target.value)} placeholder={t("Afgesproken stopsignaal", "Agreed stop signal")} maxLength={32} /><button type="button" className="cw-primary" disabled={!runConsent || stopSignal.trim().length < 2 || busy || !canStartExperience || !consentActive} onClick={() => void resumeScene(recoverableRun)}>{t("Hervat met nieuwe consent", "Resume with fresh consent")}</button></div>}
            </div>
          )}

          {activeScene && runStatus && (
            <div className="cw-active-scene">
              <div className="cw-scene-art"><span className="cw-kicker">{t("LIVE SCÈNE", "LIVE SCENE")} · {String(stepIndex + 1).padStart(2, "0")} / {String(activeScene.steps.length).padStart(2, "0")}</span><h3>{activeScene.title}</h3><p>{activeScene.description}</p></div>
              {runStatus === "completed" ? (
                <div className="cw-aftercare"><CheckCircle2 /><h3>{t("De ervaring is afgerond", "Experience complete")}</h3><p>{t("Neem rustig de tijd. Vraag wat prettig voelt: water, warmte, praten, stilte of ruimte. Een korte check-in en aftercare horen bij de ervaring.", "Take your time. Ask what feels right: water, warmth, conversation, quiet or space. A check-in and aftercare are part of the experience.")}</p><div className="cw-card-actions"><button type="button" className="cw-primary" onClick={onOpenAftercare}>{t("Open AFTERCARE", "Open AFTERCARE")}</button><button type="button" onClick={() => { setActiveScene(null); setActiveRunId(null); setRunStatus(null); setTab("club"); }}>{t("Midnight Club", "Midnight Club")}</button></div></div>
              ) : (
                <>
                  <div className="cw-step-progress"><span style={{ width: (((stepIndex + 1) / activeScene.steps.length) * 100) + "%" }} /></div>
                  {lastPathChoice !== "unset" && <div className="cw-choice-note">{lastPathChoice === "gentle" ? t("Je koos voor een rustiger tempo.", "You chose a gentler pace.") : lastPathChoice === "deepen" ? t("Je koos voor extra verdieping en reflectie.", "You chose deeper reflection.") : lastPathChoice === "skip" ? t("De vorige fase is bewust overgeslagen.", "The previous step was consciously skipped.") : t("Je koos ervoor het afgesproken tempo aan te houden.", "You chose to keep the agreed pace.")}</div>}
                  <div className="cw-step-card"><span className="cw-kicker">{t("FASE", "STEP")} {stepIndex + 1}</span><p>{activeScene.steps[stepIndex]}</p></div>
                  <div className="cw-checkin"><strong>{t("Hoe voelt dit voor jou?", "How does this feel for you?")}</strong><div>
                    <button type="button" className={checkIn === "green" ? "selected green" : "green"} onClick={() => setCheckIn("green")}>{t("Groen · Verder", "Green · Continue")}</button>
                    <button type="button" className={checkIn === "yellow" ? "selected yellow" : "yellow"} onClick={() => { setCheckIn("yellow"); void pauseScene(); }}>{t("Geel · Pauze", "Yellow · Pause")}</button>
                    <button type="button" className={checkIn === "red" ? "selected red" : "red"} onClick={() => { setCheckIn("red"); void stopScene(); }}>{t("Rood · Stop", "Red · Stop")}</button>
                  </div><small>{t("Je stopsignaal is alleen in deze sessie nodig en wordt niet opgeslagen.", "Your stop signal is only needed in this session and is never stored.")}</small></div>
                  <div className="cw-choice-panel"><strong>{t("Kies je volgende pad", "Choose your next path")}</strong><div>
                    <button type="button" className={pathChoice === "steady" ? "selected" : ""} onClick={() => setPathChoice("steady")}>{t("Aangehouden tempo", "Keep this pace")}</button>
                    <button type="button" className={pathChoice === "gentle" ? "selected" : ""} onClick={() => setPathChoice("gentle")}>{t("Zachter en rustiger", "Softer and slower")}</button>
                    <button type="button" className={pathChoice === "deepen" ? "selected" : ""} onClick={() => setPathChoice("deepen")}>{t("Meer verdieping", "Explore deeper")}</button>
                    <button type="button" className={pathChoice === "skip" ? "selected" : ""} onClick={() => setPathChoice("skip")}>{t("Deze fase overslaan", "Skip this step")}</button>
                  </div><small>{t("Je keuze wordt bij deze ervaring bewaard en bepaalt de toon van de volgende fase.", "Your choice is saved with this experience and shapes the tone of the next step.")}</small></div>
                  <div className="cw-run-actions">
                    <button type="button" onClick={() => void pauseScene()} disabled={busy}><Pause size={15} />{t("Pauzeren", "Pause")}</button>
                    <button type="button" className="cw-primary" onClick={() => void advanceStep()} disabled={busy || checkIn !== "green" || pathChoice === "unset"}>{stepIndex === activeScene.steps.length - 1 ? t("Afronden", "Complete") : t("Volgende fase", "Next step")}<ArrowRight size={15} /></button>
                    <button type="button" className="cw-stop" onClick={() => void stopScene()} disabled={busy}><Square size={14} /> STOP</button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="cw-engine-integrations"><button type="button" onClick={onOpenGameLibrary}><BookOpen size={15} />{t("Open bestaande AFTER HOURS-spellen en opdrachten", "Open existing AFTER HOURS games and prompts")}</button><button type="button" onClick={() => soundOn ? void stopAmbient() : void startAmbient()}><Music2 size={15} />{soundOn ? t("Soundscape uitschakelen", "Turn soundscape off") : t("Start de AFTER HOURS-soundscape", "Start the AFTER HOURS soundscape")}</button><button type="button" onClick={onOpenSafetyPlan}><ShieldCheck size={15} />{t("Open veiligheidsplan", "Open safety plan")}</button></div>
          <div className="cw-scene-grid">
            {scenes.map((scene) => (
              <article className="cw-scene-card" key={scene.key}>
                <div className="cw-scene-card-top"><span className="cw-kicker">{scene.custom ? t("EIGEN SCÈNE", "YOUR SCENE") : t("AFTER HOURS ORIGINAL", "AFTER HOURS ORIGINAL")}</span><span>{String(scene.steps.length).padStart(2, "0")} {t("FASES", "STEPS")}</span></div>
                <h3>{scene.title}</h3><p>{scene.description}</p>
                <div className="cw-card-actions"><button type="button" className="cw-primary" onClick={() => { setSelectedSceneKey(scene.key); setResumePrepared(false); setRunConsent(false); setStopSignal(""); setMessage(t("Bevestig de scène-consent onderaan voordat je start.", "Confirm scene consent below before starting.")); }} disabled={busy}>{t("Selecteer scène", "Select scene")}</button>{scene.custom && <button type="button" onClick={() => editScene(scene)} aria-label={t("Scène bewerken", "Edit scene")}><Clapperboard size={15} /></button>}</div>
                {scene.custom && <button type="button" className="cw-text-button" onClick={() => void removeScene(scene.key)}>{t("Scène verwijderen", "Delete scene")}</button>}
                
              </article>
            ))}
          </div>
          {selectedScene && !resumePrepared && !activeRunId && <div className="cw-selected-scene-gate"><div><span className="cw-kicker">{t("GEREED OM TE STARTEN", "READY TO BEGIN")}</span><h3>{selectedScene.title}</h3><p>{t("Lees de fases door, bespreek grenzen en bevestig opnieuw toestemming voor deze specifieke scène.", "Review the steps, discuss boundaries and confirm fresh consent for this specific scene.")}</p></div><div className="cw-run-gate"><label><input type="checkbox" checked={runConsent} onChange={(event) => setRunConsent(event.target.checked)} />{t("Ik bevestig mijn eigen vrijwillige deelname aan deze specifieke scène. Andere deelnemers moeten zelf afzonderlijk instemmen.", "I confirm my own voluntary participation in this specific scene. Other participants must consent separately themselves.")}</label><input value={stopSignal} onChange={(event) => setStopSignal(event.target.value)} placeholder={t("Afgesproken stopsignaal", "Agreed stop signal")} maxLength={32} /><button type="button" className="cw-primary" disabled={!runConsent || stopSignal.trim().length < 2 || busy || !canStartExperience || !consentActive} onClick={() => void startScene(selectedScene)}><Play size={15} />{t("Start deze ervaring", "Start this experience")}</button></div></div>}
          {!canStartExperience && consentActive && <div className="cw-consent-gate"><ShieldCheck /><div><strong>{t("Accountstatus niet bevestigd", "Account status not verified")}</strong><p>{t("De app kan je account- of serverstatus nog niet bevestigen. Er start niets totdat dit is gecontroleerd.", "The app cannot verify your account or server status yet. Nothing starts until this is checked.")}</p></div><button type="button" onClick={onRequestConsent}>{t("Account opnieuw controleren", "Recheck account")}</button></div>}
          {!consentActive && <div className="cw-consent-gate"><ShieldCheck /><div><strong>{t("Algemene consent vereist", "App consent required")}</strong><p>{t("De Experience Engine start alleen wanneer je algemene AFTER HOURS-consent actief is én je per scène opnieuw toestemming geeft.", "The Experience Engine starts only when your general AFTER HOURS consent is active and you give fresh consent for each scene.")}</p></div><button type="button" onClick={onRequestConsent}>{t("Consent bekijken", "Review consent")}</button></div>}
        </section>
      )}

      {tab === "director" && (
        <section className="cw-section">
          <div className="cw-section-heading"><span className="cw-kicker">02 · DESIGN YOUR SCENE</span><h2><Clapperboard /> The Director's Room</h2><p>{t("Ontwerp een scène met eigen fases. Zodra je opslaat, verschijnt die direct in The Experience Engine.", "Design a scene with your own steps. Once saved, it appears directly in The Experience Engine.")}</p></div>
          <div className="cw-form-panel">
            <label>{t("Naam van de scène", "Scene title")}<input value={sceneTitle} onChange={(event) => setSceneTitle(event.target.value)} maxLength={80} placeholder={t("Bijvoorbeeld: The Golden Hour", "For example: The Golden Hour")} /></label>
            <label>{t("Sfeer en intentie", "Atmosphere and intention")}<textarea value={sceneDescription} onChange={(event) => setSceneDescription(event.target.value)} rows={3} maxLength={500} /></label>
            <label>{t("Scènefases, één per regel (max. 40)", "Scene steps, one per line (max. 40)")}<textarea value={sceneSteps} onChange={(event) => setSceneSteps(event.target.value)} rows={7} maxLength={5000} /></label>
            <div className="cw-card-actions"><button type="button" className="cw-primary" onClick={() => void saveDirectorScene()} disabled={busy || !remoteProfileId}><Save size={15} />{editingSceneKey ? t("Wijzigingen opslaan", "Save changes") : t("Scène opslaan", "Save scene")}</button><button type="button" onClick={() => { setEditingSceneKey(null); setSceneTitle(""); setSceneDescription(""); setSceneSteps(""); }}>{t("Nieuwe scène", "New scene")}</button></div>
          </div>
          <div className="cw-saved-list"><h3>{t("Jouw scènes", "Your scenes")} <span>{sceneCount}</span></h3>{scenes.filter((scene) => scene.custom).length ? scenes.filter((scene) => scene.custom).map((scene) => <div className="cw-saved-row" key={scene.key}><div><strong>{scene.title}</strong><small>{scene.steps.length} {t("fases · direct speelbaar", "steps · ready to run")}</small></div><button type="button" onClick={() => editScene(scene)}>{t("Bewerken", "Edit")}</button><button type="button" onClick={() => setTab("experience")}>{t("Start", "Run")}</button></div>) : <p>{t("Je hebt nog geen eigen scènes. Maak hierboven je eerste ontwerp.", "You have no custom scenes yet. Create your first design above.")}</p>}</div>
        </section>
      )}

      {tab === "vault" && (
        <section className="cw-section">
          <div className="cw-section-heading"><span className="cw-kicker">03 · PRIVATE BY DESIGN</span><h2><LockKeyhole /> The Black Vault</h2><p>{t("Je notities worden op je toestel versleuteld vóór ze naar Supabase gaan. De server bewaart alleen AES-GCM-ciphertext. Je wachtzin wordt nooit verstuurd of opgeslagen.", "Your notes are encrypted on your device before they reach Supabase. The server stores AES-GCM ciphertext only. Your passphrase is never sent or stored.")}</p></div>
          <div className="cw-form-panel">
            <label>{t("Kluiswachtzin (minimaal 10 tekens)", "Vault passphrase (at least 10 characters)")}<input type="password" autoComplete="new-password" value={vaultPassphrase} onChange={(event) => setVaultPassphrase(event.target.value)} /></label>
            <label>{t("Titel van je notitie", "Note title")}<input value={vaultTitle} onChange={(event) => setVaultTitle(event.target.value)} maxLength={80} /></label>
            <label>{t("Privénotitie", "Private note")}<textarea rows={5} value={vaultDraft} onChange={(event) => setVaultDraft(event.target.value)} maxLength={12000} /></label>
            <button type="button" className="cw-primary" disabled={busy || !remoteProfileId || vaultPassphrase.length < 10 || !vaultTitle.trim() || !vaultDraft.trim()} onClick={() => void saveVaultNote()}><LockKeyhole size={15} />{t("Versleutelen en opslaan", "Encrypt and save")}</button>
            {vaultMessage && <p className="cw-inline-message" role="status">{vaultMessage}</p>}
          </div>
          <div className="cw-saved-list"><h3>{t("Versleutelde notities", "Encrypted notes")} <span>{vaultRecords.length}</span></h3>
            {vaultRecords.map((record) => <div className="cw-saved-row" key={record.record_key}><div><strong>{t("Privénotitie", "Private note")}</strong><small>{new Date(record.updated_at).toLocaleString(language === "nl" ? "nl-NL" : "en-GB")}</small></div><button type="button" onClick={() => void unlockVault(record)}><UnlockKeyhole size={14} />{t("Open", "Unlock")}</button><button type="button" onClick={() => void deleteVaultNote(record.record_key)} aria-label={t("Verwijderen", "Delete")}><Trash2 size={14} /></button></div>)}
          </div>
          {vaultPlain && <div className="cw-decrypted"><div><Eye size={15} /><strong>{vaultPlain.title}</strong><button type="button" onClick={() => lockVault(t("Kluis vergrendeld.", "Vault locked."))}><EyeOff size={14} />{t("Vergrendelen", "Lock")}</button></div><p>{vaultPlain.content}</p></div>}
          <p className="cw-privacy-note">{t("Belangrijk: zonder je wachtzin is ontsleutelen niet mogelijk. Bewaar een eigen back-up op een vertrouwde plek.", "Important: without your passphrase, decryption is impossible. Keep your own backup in a trusted place.")}</p>
        </section>
      )}

      {tab === "sensory" && (
        <section className="cw-section">
          <div className="cw-section-heading"><span className="cw-kicker">04 · THE AFTER HOURS SIGNATURE</span><h2><Music2 /> The Sensory Lab</h2><p>{t("Een originele, zachte soundscape die in de browser wordt opgebouwd. Geen externe muziekstream en geen extra betaalde dienst.", "An original, gentle soundscape generated in your browser. No external music stream and no paid service.")}</p></div>
          <div className="cw-form-panel">
            <label>{t("Sfeer", "Atmosphere")}<select value={sensoryTheme} onChange={(event) => setSensoryTheme(event.target.value)}><option value="embers">{t("Embers · warme gloed", "Embers · warm glow")}</option><option value="rain">{t("Nocturne · zachte regen", "Nocturne · soft rain")}</option><option value="noir">{t("Noir · diepe resonantie", "Noir · deep resonance")}</option></select></label>
            <label>{t("Volume", "Volume")} <strong>{Math.round(sensoryVolume * 100)}%</strong><input type="range" min="0.005" max="0.12" step="0.005" value={sensoryVolume} onChange={(event) => updateVolume(Number(event.target.value))} /></label>
            <div className="cw-card-actions"><button type="button" className="cw-primary" onClick={() => soundOn ? void stopAmbient() : void startAmbient()}>{soundOn ? <VolumeX size={15} /> : <Volume2 size={15} />}{soundOn ? t("Soundscape uit", "Turn soundscape off") : t("Luister naar de soundscape", "Play the soundscape")}</button><button type="button" onClick={() => void saveSensory()} disabled={busy || !remoteProfileId}><Save size={15} />{t("Instellingen bewaren", "Save settings")}</button></div>
            <p className="cw-privacy-note">{t("Audio start alleen na je tik. Houd het volume comfortabel. De soundscape stopt wanneer je deze ruimte verlaat.", "Audio starts only after your tap. Keep the volume comfortable. The soundscape stops when you leave this space.")}</p>
          </div>
        </section>
      )}

      {tab === "invitation" && (
        <section className="cw-section">
          <div className="cw-section-heading"><span className="cw-kicker">05 · A MOMENT TO REMEMBER</span><h2><Mail /> The Secret Invitation</h2><p>{t("Pauzeer eerst je ervaring. Deel daarna een beveiligde uitnodigingslink. De ontvanger bekijkt de volledige scène en geeft zelf expliciet toestemming voordat jij hervat.", "Pause your experience first. Then share a secure invitation link. The recipient reviews the full scene and explicitly consents before you resume.")}</p></div>
          {incomingInviteToken && (
            <div className="cw-form-panel cw-invite-accept">
              <span className="cw-kicker">{t("PERSOONLIJKE UITNODIGING", "PERSONAL INVITATION")}</span>
              <h3>{t("Je bent uitgenodigd", "You are invited")}</h3>
              <p>{t("Bekijk eerst de exacte inhoud. Door te accepteren leg je alleen jouw eigen toestemming vast. Je kunt later altijd stoppen of je toestemming intrekken.", "Review the exact contents first. Accepting records only your own consent. You can always stop later or withdraw consent.")}</p>
              {!remoteProfileId ? <p>{t("Log in op je eigen AFTER HOURS-account om de scène te bekijken en eventueel te accepteren.", "Sign in to your own AFTER HOURS account to preview and optionally accept the scene.")}</p> : null}
              {invitePreviewLoading && <p>{t("Scène veilig ophalen…", "Loading scene securely…")}</p>}
              {invitePreview && <div className="cw-invite-preview"><strong>{invitePreview.title}</strong>{invitePreview.description && <p>{invitePreview.description}</p>}<ol>{invitePreview.steps.slice(0, 12).map((step, index) => <li key={index}>{step}</li>)}</ol><small>{t("Uitnodiging verloopt", "Invitation expires")} {new Date(invitePreview.expires_at).toLocaleString(language === "nl" ? "nl-NL" : "en-GB")}</small></div>}
              <button type="button" className="cw-primary" disabled={busy || !remoteProfileId || !invitePreview || invitePreviewLoading} onClick={() => void acceptIncomingInvitation()}><CheckCircle2 size={15} />{t("Ik accepteer en geef mijn eigen toestemming", "Accept and give my own consent")}</button>
            </div>
          )}
          <div className="cw-form-panel">
            <h3>{t("Deel een ervaring", "Invite someone to an experience")}</h3>
            <p>{t("Alleen gepauzeerde ervaringen kunnen worden uitgenodigd. De link is maximaal zeven dagen geldig, kan één keer worden geaccepteerd en bevat geen wachtwoord of persoonsgegevens.", "Only paused experiences can be invited. The link is valid for up to seven days, can be accepted once and contains no password or personal data.")}</p>
            <label>{t("Ervaring", "Experience")}<select value={selectedInviteRunId} onChange={(event) => setSelectedInviteRunId(event.target.value)}><option value="">{t("Kies een gepauzeerde ervaring", "Choose a paused experience")}</option>{invitableRuns.map((run) => <option key={run.id} value={run.id}>{String(run.scene_snapshot.title ?? run.scene_key)} · {t("Gepauzeerd", "Paused")}</option>)}</select></label>
            <button type="button" className="cw-primary" disabled={busy || !remoteProfileId || !selectedInviteRunId} onClick={() => void createRunInvitation(selectedInviteRunId)}><Share2 size={15} />{t("Maak veilige uitnodigingslink", "Create secure invitation link")}</button>
            {inviteLink && <div className="cw-invite-link"><label>{t("Jouw eenmalige uitnodigingslink", "Your one-time invitation link")}<input readOnly value={inviteLink} /></label><button type="button" onClick={() => { void navigator.clipboard?.writeText(inviteLink); setMessage(t("Uitnodigingslink gekopieerd.", "Invitation link copied.")); }}><Copy size={15} />{t("Kopieer link", "Copy link")}</button></div>}
          </div>
          {joinedRuns.length > 0 && <div className="cw-saved-list"><h3>{t("Ervaringen waarvoor jij toestemming gaf", "Experiences you consented to")} <span>{joinedRuns.length}</span></h3>{joinedRuns.map((run) => <div className="cw-saved-row" key={run.id}><div><strong>{String(run.scene_snapshot.title ?? run.scene_key)}</strong><small>{t("Je neemt deel als gast ·", "You are a participant ·")} {run.status === "active" ? t("Actief", "Active") : t("Gepauzeerd", "Paused")}</small></div><button type="button" className="cw-danger" disabled={busy} onClick={() => void withdrawSharedConsent(run.id)}>{t("Toestemming intrekken en stoppen", "Withdraw consent and stop")}</button></div>)}</div>}
          <div className="cw-saved-list"><h3>{t("Uitnodigingen en toestemmingen", "Invitations and consent")} <span>{experienceInvites.length}</span></h3>{experienceInvites.map((invite) => <div className="cw-saved-row" key={invite.id}><div><strong>{invite.status === "accepted" ? t("Toestemming ontvangen", "Consent received") : invite.status === "pending" && new Date(invite.expires_at).getTime() <= Date.now() ? t("Verlopen", "Expired") : t(invite.status === "revoked" ? "Ingetrokken" : "Wacht op acceptatie", invite.status === "revoked" ? "Revoked" : "Awaiting acceptance")}</strong><small>{t("Geldig tot", "Expires")} {new Date(invite.expires_at).toLocaleString(language === "nl" ? "nl-NL" : "en-GB")}{invite.accepted_at ? " · " + t("Geaccepteerd", "Accepted") + " " + new Date(invite.accepted_at).toLocaleString(language === "nl" ? "nl-NL" : "en-GB") : ""}</small></div>{invite.status === "pending" && new Date(invite.expires_at).getTime() > Date.now() ? <button type="button" disabled={busy} onClick={() => void revokeInvite(invite)}>{t("Intrekken", "Revoke")}</button> : null}</div>)}</div>
          <div className="cw-saved-list"><h3>{t("Eerdere uitnodigingsconcepten", "Previous invitation drafts")} <span>{records.invitation.length}</span></h3>{records.invitation.map((record) => <div className="cw-saved-row" key={record.record_key}><div><strong>{String(record.payload.title ?? t("Uitnodiging", "Invitation"))}</strong><small>{record.payload.shareStatus === "shared" ? t("Gedeeld", "Shared") : t("Concept", "Draft")} · {new Date(record.updated_at).toLocaleDateString(language === "nl" ? "nl-NL" : "en-GB")}</small></div><button type="button" onClick={() => { setInviteTitle(String(record.payload.title ?? "")); setInviteMessage(String(record.payload.message ?? "")); }}>{t("Open", "Open")}</button></div>)}</div>
        </section>
      )}

      {tab === "dominion" && (
        <section className="cw-section">
          <div className="cw-section-heading"><span className="cw-kicker">06 · KNOW YOUR DYNAMIC</span><h2><ShieldCheck /> The Dominion</h2><p>{t("Een persoonlijk dynamiekprofiel als hulpmiddel voor gesprekken en afstemming. Dit profiel is nooit toestemming voor een toekomstige handeling.", "A personal dynamics profile to support conversations and alignment. This profile is never consent for a future action.")}</p></div>
          <div className="cw-form-panel">
            <label>{t("Voorkeursrol of dynamiek", "Preferred role or dynamic")}<input value={domRole} onChange={(event) => setDomRole(event.target.value)} maxLength={100} /></label>
            <label>{t("Aanspreekvorm of titel", "Preferred form of address or title")}<input value={domAddress} onChange={(event) => setDomAddress(event.target.value)} maxLength={100} /></label>
            <label>{t("Harde grenzen · niet onderhandelbaar", "Hard limits · non-negotiable")}<textarea rows={3} value={domHardLimits} onChange={(event) => setDomHardLimits(event.target.value)} maxLength={2500} /></label>
            <label>{t("Zachte grenzen · eerst bespreken", "Soft limits · discuss first")}<textarea rows={3} value={domSoftLimits} onChange={(event) => setDomSoftLimits(event.target.value)} maxLength={2500} /></label>
            <label>{t("Aftercare die bij jou past", "Aftercare that works for you")}<textarea rows={3} value={domAftercare} onChange={(event) => setDomAftercare(event.target.value)} maxLength={1800} /></label>
            <button type="button" className="cw-primary" onClick={() => void saveDominion()} disabled={busy || !remoteProfileId}><Save size={15} />{t("Profiel privé opslaan", "Save private profile")}</button>
          </div>
          <p className="cw-privacy-note">{t("Je kunt dit profiel op ieder moment aanpassen of verwijderen. Iedere scène vraagt opnieuw om expliciete, actuele toestemming.", "You can edit or delete this profile at any time. Every scene still requires fresh, explicit consent.")}</p>
        </section>
      )}

      {tab === "deck" && (
        <section className="cw-section">
          <div className="cw-section-heading"><span className="cw-kicker">07 · CONTENT THAT GROWS WITH YOU</span><h2><Star /> The Ritual Deck</h2><p>{t("Reflectiekaarten voor verbinding, grenzen en aftercare. Voeg je eigen kaarten toe; iedere trekking wordt in je privégeschiedenis bewaard.", "Reflection cards for connection, boundaries and aftercare. Add your own cards; every draw is saved to your private history.")}</p></div>
          <div className="cw-ritual-card">{currentCard ? <><span className="cw-kicker">{t("JOUW KAART", "YOUR CARD")}</span><p>{currentCard.title}</p></> : <><span className="cw-kicker">THE RITUAL DECK</span><p>{t("Trek een kaart om een nieuw gesprek te openen.", "Draw a card to open a new conversation.")}</p></>}<button type="button" className="cw-primary" onClick={() => void drawRitualCard()} disabled={busy || !remoteProfileId}><Sparkles size={15} />{t("Trek een kaart", "Draw a card")}</button></div>
          <div className="cw-form-panel">
            <h3>{t("Maak je eigen kaart", "Create your own card")}</h3>
            <label>{t("Kaarttitel", "Card title")}<input value={customCardTitle} onChange={(event) => setCustomCardTitle(event.target.value)} maxLength={90} /></label>
            <label>{t("Reflectievraag of ritueel", "Reflection prompt or ritual")}<textarea rows={3} value={customCardText} onChange={(event) => setCustomCardText(event.target.value)} maxLength={500} /></label>
            <button type="button" className="cw-primary" onClick={() => void saveCustomRitualCard()} disabled={busy || !remoteProfileId || !customCardTitle.trim() || !customCardText.trim()}><Plus size={15} />{t("Kaart toevoegen", "Add card")}</button>
          </div>
          <div className="cw-saved-list"><h3>{t("Eigen kaarten en trekkingen", "Custom cards and draws")} <span>{customRitualCards.length + ritualDrawCount}</span></h3>{customRitualCards.map((card) => <div className="cw-saved-row" key={card.id}><div><strong>{card.title}</strong><small>{card.text}</small></div><button type="button" onClick={() => setCurrentCard({ id: card.id, title: card.text })}>{t("Trek", "Draw")}</button><button type="button" onClick={() => void removeRitualCard(card.id)} aria-label={t("Kaart verwijderen", "Delete card")}><Trash2 size={14} /></button></div>)}</div>
        </section>
      )}

      {tab === "club" && (
        <section className="cw-section">
          <div className="cw-section-heading"><span className="cw-kicker">08 · YOUR LONG GAME</span><h2><Flame /> The Midnight Club</h2><p>{t("Een privéoverzicht dat groeit door wat je daadwerkelijk ontwerpt, bewaart en afrondt. Geen nepstreaks of willekeurige punten.", "A private overview that grows through what you actually design, save and complete. No fake streaks or random points.")}</p></div>
          <div className="cw-member-card"><span className="cw-kicker">MIDNIGHT MEMBER</span><strong>LEVEL {String(memberLevel).padStart(2, "0")}</strong><p>{t("Je lidmaatschap groeit met bewuste ervaringen en eigen creaties.", "Your membership grows through intentional experiences and personal creations.")}</p></div>
          <div className="cw-stats-grid">
            <div><strong>{completedRuns}</strong><span>{t("Ervaringen afgerond", "Runs completed")}</span></div>
            <div><strong>{sceneCount}</strong><span>{t("Eigen scènes", "Custom scenes")}</span></div>
            <div><strong>{vaultRecords.length}</strong><span>{t("Kluisnotities", "Vault notes")}</span></div>
            <div><strong>{ritualDrawCount}</strong><span>{t("Kaarten getrokken", "Cards drawn")}</span></div>
            <div><strong>{records.invitation.length}</strong><span>{t("Uitnodigingen", "Invitations")}</span></div>
            <div><strong>{unlocked.size}</strong><span>{t("Badges verdiend", "Badges earned")}</span></div>
            <div><strong>{interactionCount}</strong><span>{t("Keuzes gemaakt", "Choices made")}</span></div>
          </div>
          <div className="cw-badges"><h3>{t("Jouw mijlpalen", "Your milestones")}</h3>{MILESTONES.map((item) => <div key={item[0]} className={unlocked.has(item[0]) ? "earned" : ""}><span>{unlocked.has(item[0]) ? <CheckCircle2 size={17} /> : <Star size={17} />}</span><div><strong>{item[1]}</strong><small>{language === "nl" ? item[2] : item[3]}</small></div><em>{unlocked.has(item[0]) ? t("ONTGRENDELD", "UNLOCKED") : t("NOG TE VERDIENEN", "LOCKED")}</em></div>)}</div>
          <div className="cw-form-panel"><h3>{t("Jouw gegevens blijven van jou", "Your data stays yours")}</h3><p>{t("Exporteer een back-up of verwijder alle gegevens van deze acht onderdelen. Kluisnotities blijven versleuteld in de export.", "Export a backup or delete all data from these eight modules. Vault notes remain encrypted in the export.")}</p><div className="cw-card-actions"><button type="button" className="cw-primary" onClick={exportBackup} disabled={!remoteProfileId}><Download size={15} />{t("Exporteer back-up", "Export backup")}</button><button type="button" className="cw-danger" onClick={() => void deleteAllWorldData()} disabled={busy || !remoteProfileId}><Trash2 size={15} />{t("Verwijder alle World-gegevens", "Delete all World data")}</button></div></div>
          <div className="cw-saved-list"><h3>{t("Recente ervaringen", "Recent experiences")} <span>{runs.length}</span></h3>{runs.slice(0, 8).map((run) => <div className="cw-saved-row" key={run.id}><div><strong>{String(run.scene_snapshot.title ?? run.scene_key)}</strong><small>{run.status.toUpperCase()} · {new Date(run.updated_at).toLocaleString(language === "nl" ? "nl-NL" : "en-GB")}</small></div><span>{run.current_step}/{run.total_steps}</span></div>)}</div>
        </section>
      )}

      <footer className="cw-footer"><span><LockKeyhole size={12} /> PRIVATE BY DESIGN</span><span>{t("Jouw account · Jouw grenzen · Jouw regie", "Your account · Your boundaries · Your control")}</span></footer>
    </main>
  );
}
