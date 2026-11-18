import { supabase, supabaseConfigured } from "./supabase";

export type MoodPhase = "before" | "during" | "after";
export const moodCatalog = {
  before: ["KINKY","EXCITED","CURIOUS","CALM","PLAYFUL","CONFIDENT","UNSURE"],
  during: ["INTO IT","MORE","GOOD","NEUTRAL","NEED A PAUSE","OVERWHELMED","STOP"],
  after: ["RELAXED","SATISFIED","ENERGIZED","TIRED","EMOTIONAL","OVERSTIMULATED","NEUTRAL","UNSURE"]
} as const;
export type MoodCode = (typeof moodCatalog)[MoodPhase][number];
export interface MoodEvent { id:string; session_id:string; phase:MoodPhase; mood:MoodCode; created_at:string; }
export function isMoodCode(phase:MoodPhase,mood:string):mood is MoodCode {
 if (phase !== "before" && phase !== "during" && phase !== "after") return false;
 return (moodCatalog[phase] as readonly string[]).includes(mood);
}

export function isMoodEvent(row: unknown): row is MoodEvent {
 if (!row || typeof row !== "object" || Array.isArray(row)) return false;
 const value = row as Record<string, unknown>;
 return typeof value.id === "string" && value.id.trim().length > 0
  && typeof value.session_id === "string" && value.session_id.trim().length > 0
  && (value.phase === "before" || value.phase === "during" || value.phase === "after")
  && typeof value.mood === "string" && isMoodCode(value.phase, value.mood)
  && typeof value.created_at === "string"
  && value.created_at.length > 0
  && Number.isFinite(Date.parse(value.created_at));
}
export async function recordSessionMoodRemote(sessionId:string,phase:MoodPhase,mood:MoodCode):Promise<string|null>{
 if(!supabaseConfigured||!supabase)return null;
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return authError?.message??"Meld je aan om stemmingschecks aan je account te koppelen.";
 const {error}=await supabase.rpc("record_session_mood",{p_session_id:sessionId,p_phase:phase,p_mood:mood});
 return error?.message??null;
}
export async function loadMoodHistoryRemote(limit=40):Promise<MoodEvent[]|null>{
 if(!supabaseConfigured||!supabase)return null;
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)throw new Error(authError?.message??"Log in om je stemmingsoverzicht te bekijken.");
 const {data,error}=await supabase.rpc("get_session_mood_history",{p_limit:Math.max(1,Math.min(100,Math.floor(limit)))});
 if(error)throw error;
 if(!Array.isArray(data))throw new Error("Het stemmingsoverzicht kon niet worden gelezen.");
 return data.filter(isMoodEvent);
}
