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
 return (moodCatalog[phase] as readonly string[]).includes(mood);
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
 return data.filter((row:unknown):row is MoodEvent=>{
  if(!row||typeof row!=="object")return false;
  const v=row as Record<string,unknown>;
  return typeof v.id==="string"&&typeof v.session_id==="string"
   &&(v.phase==="before"||v.phase==="during"||v.phase==="after")
   &&typeof v.mood==="string"&&isMoodCode(v.phase,v.mood)&&typeof v.created_at==="string";
 });
}
