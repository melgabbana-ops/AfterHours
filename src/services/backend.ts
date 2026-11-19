import type{AfterHoursState}from"../types";
import{supabase,supabaseConfigured}from"./supabase";

const isUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

// Serialize session-state writes and consent revocation. A STOP must be applied
// after any already-running sync and must invalidate older queued snapshots.
let syncQueue: Promise<void> = Promise.resolve();
let syncGeneration = 0;

function enqueueRemoteMutation<T>(operation: () => Promise<T>): Promise<T> {
 const job = syncQueue.then(operation);
 syncQueue = job.then(() => undefined, () => undefined);
 return job;
}

export interface RemoteRound{slug:string;title:string;body:string;durationSeconds:number}

const STORY_CHAPTER_IDS = ["arrival", "test", "control", "challenge", "boundary", "night", "after-hours"] as const;
export type StoryChapterId = (typeof STORY_CHAPTER_IDS)[number];

/** Load account-owned Story Mode progress. The RPC derives the user from auth.uid(). */
export async function loadRemoteStoryProgress(): Promise<StoryChapterId[]> {
 if (!supabaseConfigured || !supabase) return [];
 const { data: { user }, error: userError } = await supabase.auth.getUser();
 if (userError) throw new Error(userError.message);
 if (!user) throw new Error("Geen actieve gebruiker voor Story Mode-sync.");
 const { data, error } = await supabase.rpc("get_story_chapter_progress");
 if (error) throw new Error(error.message);
 if (!Array.isArray(data)) throw new Error("Story Mode-voortgang kon niet worden gelezen.");
 return [...new Set(data.map((row: { chapter_id?: unknown }) => row.chapter_id)
  .filter((id: unknown): id is StoryChapterId => typeof id === "string" && (STORY_CHAPTER_IDS as readonly string[]).includes(id)))];
}

/** Idempotently sync a completed chapter to the signed-in account. */
export async function completeRemoteStoryChapter(chapterId: string): Promise<string | null> {
 if (!supabaseConfigured || !supabase) return "Account-sync is niet beschikbaar.";
 if (!(STORY_CHAPTER_IDS as readonly string[]).includes(chapterId)) return "Ongeldig Story Mode-hoofdstuk.";
 const { data: { user }, error: userError } = await supabase.auth.getUser();
 if (userError || !user) return userError?.message ?? "Geen actieve gebruiker voor Story Mode-sync.";
 const { error } = await supabase.rpc("complete_story_chapter", { p_chapter_id: chapterId });
 return error?.message ?? null;
}

export async function loadRemoteRounds(language:"nl"|"en"="nl"):Promise<RemoteRound[]>{
 if(!supabaseConfigured||!supabase)return [];
 const{data,error}=await supabase.from("experience_rounds").select("slug,title_nl,body_nl,title_en,body_en,duration_seconds").eq("active",true).order("sort_order",{ascending:true});
 if(error||!data||data.length===0)return [];
 return data.filter(row=>Number.isInteger(row.duration_seconds)&&row.duration_seconds>0).map(row=>({slug:row.slug,title:language==="en"?row.title_en:row.title_nl,body:language==="en"?row.body_en:row.body_nl,durationSeconds:row.duration_seconds})).filter(row=>typeof row.title==="string"&&row.title.length>0&&typeof row.body==="string"&&row.body.length>0);
}

export async function loadRemoteState(preferredSessionId?:string):Promise<AfterHoursState|null>{
 if(!supabaseConfigured||!supabase)return null;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError)throw new Error("Accountstatus kon niet worden gecontroleerd: "+userError.message);
 if(!user)return null;

 const{data:profile,error:profileError}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
 if(profileError)throw new Error("Profiel kon niet worden geladen: "+profileError.message);
 if(!profile)return null;

 const legacyLocalSession=!preferredSessionId||preferredSessionId==="local-session";
 let sessionQuery=legacyLocalSession
  ?supabase.from("sessions").select("*").eq("profile_id",user.id).order("updated_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle()
  :supabase.from("sessions").select("*").eq("profile_id",user.id).eq("id",preferredSessionId).maybeSingle();
 let{data:session,error:sessionError}=await sessionQuery;
 if(sessionError)throw new Error("Sessie kon niet worden geladen: "+sessionError.message);
 // A device-local session ID may not exist on this account. Recover the latest
 // server-owned session before deciding that no remote session is available.
 if(!session&&!legacyLocalSession){
  const fallback=await supabase.from("sessions").select("*").eq("profile_id",user.id).order("updated_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle();
  if(fallback.error)throw new Error("Herstel van de laatste sessie is mislukt: "+fallback.error.message);
  session=fallback.data;
 }
 const effectiveSession=session??{
  id:crypto.randomUUID(),
  profile_id:user.id,
  status:"ready",
  round:0,
  started_at:null,
  updated_at:profile.updated_at??profile.created_at
 };

 const{data:consent,error:consentError}=session
  ?await supabase.from("consent_records").select("status,confirmed_at,revoked_at").eq("session_id",effectiveSession.id).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle()
  :{data:null,error:null};
 if(consentError)throw new Error("Toestemmingsstatus kon niet worden geladen: "+consentError.message);
 const{data:history,error:historyError}=await supabase.from("session_history").select("id,completed_at,xp_earned,rounds").eq("profile_id",user.id).order("completed_at",{ascending:false}).limit(12);
 if(historyError)throw new Error("Sessiegeschiedenis kon niet worden geladen: "+historyError.message);

 return{
  ageConfirmed:false,
  ageConfirmedFor:null,
  safety:"green",
  profile:{id:profile.id,displayName:profile.display_name,username:profile.username??"nightwalker",avatarStyle:profile.avatar_style==="collar"||profile.avatar_style==="key"||profile.avatar_style==="crown"?profile.avatar_style:"sigil",level:profile.level,xp:profile.xp,sessions:profile.sessions,createdAt:profile.created_at},
  session:{id:effectiveSession.id,profileId:effectiveSession.profile_id,status:effectiveSession.status,round:effectiveSession.round,startedAt:effectiveSession.started_at,updatedAt:effectiveSession.updated_at},
  history:(history??[]).map(row=>({id:row.id,completedAt:row.completed_at,xpEarned:row.xp_earned,rounds:row.rounds})),
  notifications:[],
  consent:session&&(effectiveSession.status==="completed"||effectiveSession.status==="stopped")
   ?{status:"pending",confirmedAt:null,revokedAt:null}
   :consent
    ?{status:consent.status==="active"?"active":consent.status==="revoked"?"revoked":"pending",confirmedAt:consent.confirmed_at,revokedAt:consent.revoked_at}
    :{status:"pending",confirmedAt:null,revokedAt:null}
 };
}

export async function updateRemoteUsername(username:string):Promise<string|null>{
 const normalized=username.trim().toLowerCase();
 if(!/^[a-z0-9_]{3,20}$/.test(normalized))return "Username moet 3-20 tekens bevatten: alleen a-z, 0-9 en _.";
 if(!supabaseConfigured||!supabase)return null;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return userError?.message??"Geen actieve gebruiker voor username-sync.";
 const{error}=await supabase.from("profiles").update({username:normalized}).eq("id",user.id);
 if(error)return error.code==="23505"?"Deze username is al in gebruik. Kies een andere username.":error.message;
 return null;
}

export function revokeRemoteConsent(sessionId:string,revokedAt:string):Promise<string|null>{
 const client=supabase;
 if(!supabaseConfigured||!client||!isUuid(sessionId))return Promise.resolve(null);
 // Drop queued state snapshots from before STOP. If a sync is already in
 // flight, the revocation waits for it and is therefore the final server write.
 syncGeneration += 1;
 return enqueueRemoteMutation(async()=>{
  const{data:{user},error:userError}=await client.auth.getUser();
  if(userError||!user)return userError?.message??"Geen actieve gebruiker voor consent-sync.";
  const{data:session,error:sessionError}=await client.from("sessions").select("id").eq("id",sessionId).eq("profile_id",user.id).maybeSingle();
  if(sessionError)return sessionError.message;
  if(!session)return null;
  // Always ask the server to enforce revocation, even if the latest consent
  // record already says revoked or is inconsistent with the session state.
  // The database RPC is responsible for idempotently stopping active/paused sessions.
  const{error}=await client.rpc("set_consent_state",{p_session_id:sessionId,p_status:"revoked",p_confirmed_at:null,p_revoked_at:revokedAt});
  return error?.message??null;
 });
}

export async function completeRemoteSession(sessionId:string,rounds:number):Promise<{error:string|null,xpEarned:number,alreadyCompleted:boolean}>{
 if(!supabaseConfigured||!supabase)return {error:"Server-opslag is niet beschikbaar. Log in en probeer opnieuw.",xpEarned:0,alreadyCompleted:false};
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return {error:userError?.message??"Geen actieve gebruiker.",xpEarned:0,alreadyCompleted:false};
 const{data,error}=await supabase.rpc("complete_session",{p_session_id:sessionId,p_rounds:rounds});
 if(error)return {error:error.message,xpEarned:0,alreadyCompleted:false};
 return {error:null,xpEarned:Number(data?.xp_earned??120),alreadyCompleted:Boolean(data?.already_completed)};
}

export function syncRemoteState(state:AfterHoursState):Promise<string|null>{
 const generation=++syncGeneration;
 return enqueueRemoteMutation(()=>{
  if(generation!==syncGeneration)return Promise.resolve(null);
  return syncRemoteStateNow(state);
 });
}

async function syncRemoteStateNow(state:AfterHoursState):Promise<string|null>{
 if(!supabaseConfigured||!supabase)return null;
 if(state.session.status==="completed")return null;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return userError?.message??"Geen actieve gebruiker voor sessie-sync.";

 const{error:profileError}=await supabase.from("profiles").upsert({
  id:user.id,
  display_name:state.profile.displayName,
  username:state.profile.username,
  avatar_style:state.profile.avatarStyle??"sigil"
 });
 if(profileError)return profileError.code==="23505"?"Deze username is al in gebruik. Kies een andere username.":profileError.message;

 let sessionId=isUuid(state.session.id)?state.session.id:null;
 let remoteSessionExists=false;
 if(sessionId){
  const{data:owned,error:ownershipError}=await supabase.from("sessions").select("id").eq("id",sessionId).eq("profile_id",user.id).maybeSingle();
  if(ownershipError)return "Sessie-eigenaarschap kon niet worden gecontroleerd. Je sessie is niet gewijzigd. "+ownershipError.message;
  remoteSessionExists=Boolean(owned);
 }
 if(!sessionId){
  sessionId=crypto.randomUUID();
  remoteSessionExists=false;
 }

 if(!remoteSessionExists && (state.session.status!=="ready" || state.session.round!==0)) return "Lokale sessie behouden: server-sessie ontbreekt.";

 const sessionPayload={
  id:sessionId,
  profile_id:user.id,
  status:"ready" as const,
  round:0,
  started_at:null,
  updated_at:state.session.updatedAt
 };

 if(!remoteSessionExists){
  const{error}=await supabase.from("sessions").insert(sessionPayload);
  if(error)return error.message;
 }

 if(state.consent.status==="active"&&state.consent.confirmedAt){
  const{error}=await supabase.rpc("set_consent_state",{p_session_id:sessionId,p_status:"active",p_confirmed_at:state.consent.confirmedAt,p_revoked_at:null});
  if(error)return error.message;
 }

 if(state.consent.status==="revoked"&&state.consent.revokedAt){
  const{error}=await supabase.rpc("set_consent_state",{p_session_id:sessionId,p_status:"revoked",p_confirmed_at:null,p_revoked_at:state.consent.revokedAt});
  if(error)return error.message;
 }
 if(state.consent.status==="pending"){
  const{data:latestConsent,error:consentError}=await supabase.from("consent_records").select("status,confirmed_at,revoked_at").eq("session_id",sessionId).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle();
  if(consentError)return consentError.message;
  if(latestConsent?.status==="active"){
   const{error}=await supabase.rpc("set_consent_state",{p_session_id:sessionId,p_status:"revoked",p_confirmed_at:null,p_revoked_at:state.session.updatedAt});
   if(error)return error.message;
  }
 }

 // Persist consent before asking the server to activate or resume a session.
 // The database rejects active state transitions unless the latest consent event is active.
 if(remoteSessionExists){
  const{error}=await supabase.rpc("set_session_state",{p_session_id:sessionId,p_status:state.session.status,p_round:state.session.round,p_started_at:state.session.startedAt,p_updated_at:state.session.updatedAt});
  if(error)return error.message;
 }else if(state.session.status==="active"){
  const{error}=await supabase.rpc("set_session_state",{p_session_id:sessionId,p_status:"active",p_round:0,p_started_at:null,p_updated_at:new Date().toISOString()});
  if(error)return error.message;
 }
 return null;
}