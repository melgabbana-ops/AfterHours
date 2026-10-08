import type{AfterHoursState}from"../types";
import{supabase,supabaseConfigured}from"./supabase";

const isUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export interface RemoteRound{slug:string;title:string;body:string;durationSeconds:number}

export async function loadRemoteRounds():Promise<RemoteRound[]>{
 if(!supabaseConfigured||!supabase)return [];
 const{data,error}=await supabase.from("experience_rounds").select("slug,title,body,duration_seconds").eq("active",true).order("sort_order",{ascending:true});
 if(error||!data||data.length===0)return [];
 return data.filter(row=>Number.isInteger(row.duration_seconds)&&row.duration_seconds>0).map(row=>({slug:row.slug,title:row.title,body:row.body,durationSeconds:row.duration_seconds}));
}

export async function loadRemoteState(preferredSessionId?:string):Promise<AfterHoursState|null>{
 if(!supabaseConfigured||!supabase)return null;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return null;

 const{data:profile,error:profileError}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
 if(profileError||!profile)return null;

 const legacyLocalSession=!preferredSessionId||preferredSessionId==="local-session";
 const sessionQuery=legacyLocalSession
  ?supabase.from("sessions").select("*").eq("profile_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle()
  :supabase.from("sessions").select("*").eq("profile_id",user.id).eq("id",preferredSessionId).maybeSingle();
 const{data:session,error:sessionError}=await sessionQuery;
 if(sessionError)return null;
 if(!session&&!legacyLocalSession)return null;
 const effectiveSession=session??{
  id:crypto.randomUUID(),
  profile_id:user.id,
  status:"ready",
  round:0,
  started_at:null,
  updated_at:profile.updated_at??profile.created_at
 };

 const{data:consent}=session
  ?await supabase.from("consent_records").select("status,confirmed_at,revoked_at").eq("session_id",effectiveSession.id).order("created_at",{ascending:false}).limit(1).maybeSingle()
  :{data:null};
 const{data:history}=await supabase.from("session_history").select("id,completed_at,xp_earned,rounds").eq("profile_id",user.id).order("completed_at",{ascending:false}).limit(12);

 return{
  ageConfirmed:false,
  ageConfirmedFor:null,
  safety:"green",
  profile:{id:profile.id,displayName:profile.display_name,username:profile.username??"nightwalker",avatarStyle:profile.avatar_style==="collar"||profile.avatar_style==="key"||profile.avatar_style==="crown"?profile.avatar_style:"sigil",level:profile.level,xp:profile.xp,sessions:profile.sessions,createdAt:profile.created_at},
  session:{id:effectiveSession.id,profileId:effectiveSession.profile_id,status:effectiveSession.status,round:effectiveSession.round,startedAt:effectiveSession.started_at,updatedAt:effectiveSession.updated_at},
  history:(history??[]).map(row=>({id:row.id,completedAt:row.completed_at,xpEarned:row.xp_earned,rounds:row.rounds})),
  notifications:[],
  consent:consent?{status:consent.status==="active"?"active":"revoked",confirmedAt:consent.confirmed_at,revokedAt:consent.revoked_at}:{status:"pending",confirmedAt:null,revokedAt:null}
 };
}

export async function updateRemoteUsername(username:string):Promise<string|null>{
 const normalized=username.trim().toLowerCase();
 if(!/^[a-z0-9_]{3,20}$/.test(normalized))return "Username moet 3-20 tekens bevatten: alleen a-z, 0-9 en _.";
 if(!supabaseConfigured||!supabase)return null;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return userError?.message??"Geen actieve gebruiker voor username-sync.";
 const{error}=await supabase.from("profiles").update({username}).eq("id",user.id);
 if(error)return error.code==="23505"?"Deze username is al in gebruik. Kies een andere username.":error.message;
 return null;
}

export async function completeRemoteSession(sessionId:string,rounds:number):Promise<{error:string|null,xpEarned:number,alreadyCompleted:boolean}>{
 if(!supabaseConfigured||!supabase)return {error:"Server-opslag is niet beschikbaar. Log in en probeer opnieuw.",xpEarned:0,alreadyCompleted:false};
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return {error:userError?.message??"Geen actieve gebruiker.",xpEarned:0,alreadyCompleted:false};
 const{data,error}=await supabase.rpc("complete_session",{p_session_id:sessionId,p_rounds:rounds});
 if(error)return {error:error.message,xpEarned:0,alreadyCompleted:false};
 return {error:null,xpEarned:Number(data?.xp_earned??120),alreadyCompleted:Boolean(data?.already_completed)};
}

let syncQueue=Promise.resolve();
let syncGeneration=0;

export async function syncRemoteState(state:AfterHoursState):Promise<string|null>{
 const generation=++syncGeneration;
 const job=syncQueue.then(()=>{
  if(generation!==syncGeneration)return null;
  return syncRemoteStateNow(state);
 });
 syncQueue=job.then(()=>undefined,()=>undefined);
 return job;
}

async function syncRemoteStateNow(state:AfterHoursState):Promise<string|null>{
 if(!supabaseConfigured||!supabase)return null;
 if(state.session.status==="completed")return null;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return null;

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
  const{data:owned}=await supabase.from("sessions").select("id").eq("id",sessionId).eq("profile_id",user.id).maybeSingle();
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

 if(remoteSessionExists){
  const{error}=await supabase.rpc("set_session_state",{p_session_id:sessionId,p_status:state.session.status,p_round:state.session.round,p_started_at:state.session.startedAt,p_updated_at:state.session.updatedAt});
  if(error)return error.message;
 }else{
  const{error}=await supabase.from("sessions").insert(sessionPayload);
  if(error)return error.message;
  if(state.session.status==="active"){
   const{error:transitionError}=await supabase.rpc("set_session_state",{p_session_id:sessionId,p_status:"active",p_round:0,p_started_at:null,p_updated_at:new Date().toISOString()});
   if(transitionError)return transitionError.message;
  }else if(state.session.status==="paused"||state.session.status==="stopped"){
   const{error:transitionError}=await supabase.rpc("set_session_state",{p_session_id:sessionId,p_status:"ready",p_round:0,p_started_at:null,p_updated_at:new Date().toISOString()});
   if(transitionError)return transitionError.message;
  }
 }

 if(state.consent.status==="active"&&state.consent.confirmedAt){
  const{error}=await supabase.rpc("set_consent_state",{p_session_id:sessionId,p_status:"active",p_confirmed_at:state.consent.confirmedAt,p_revoked_at:null});
  if(error)return error.message;
 }

 if(state.consent.status==="revoked"&&state.consent.revokedAt){
  const{error}=await supabase.rpc("set_consent_state",{p_session_id:sessionId,p_status:"revoked",p_confirmed_at:null,p_revoked_at:state.consent.revokedAt});
  if(error)return error.message;
 }
 return null;
}