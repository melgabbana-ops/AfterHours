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

export async function loadRemoteHistory():Promise<import("../types").SessionHistoryEntry[]> {
 if(!supabaseConfigured||!supabase)return [];
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return [];
 const{data,error}=await supabase.from("session_history").select("id,completed_at,xp_earned,rounds").eq("profile_id",user.id).order("completed_at",{ascending:false}).limit(12);
 if(error||!data)return [];
 return data.map(row=>({id:row.id,completedAt:row.completed_at,xpEarned:row.xp_earned,rounds:row.rounds}));
}

export async function loadRemoteState():Promise<AfterHoursState|null>{
 if(!supabaseConfigured||!supabase)return null;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return null;

 const{data:profile,error:profileError}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
 if(profileError||!profile)return null;

 const{data:session,error:sessionError}=await supabase.from("sessions").select("*").eq("profile_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();
 if(sessionError)return null;

 const effectiveSession=session??{
  id:crypto.randomUUID(),
  profile_id:user.id,
  status:"ready",
  round:0,
  started_at:null,
  updated_at:profile.updated_at??profile.created_at
 };

 const{data:consent}=effectiveSession.id==="local-session"
  ?{data:null}
  :await supabase.from("consent_records").select("status,confirmed_at,revoked_at").eq("session_id",effectiveSession.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
 const{data:history}=await supabase.from("session_history").select("id,completed_at,xp_earned,rounds").eq("profile_id",user.id).order("completed_at",{ascending:false}).limit(12);

 return{
  ageConfirmed:false,
  safety:"green",
  profile:{id:profile.id,displayName:profile.display_name,username:profile.username??"nightwalker",avatarStyle:profile.avatar_style==="collar"||profile.avatar_style==="key"||profile.avatar_style==="crown"?profile.avatar_style:"sigil",level:profile.level,xp:profile.xp,sessions:profile.sessions,createdAt:profile.created_at},
  session:{id:effectiveSession.id,profileId:effectiveSession.profile_id,status:effectiveSession.status,round:effectiveSession.round,startedAt:effectiveSession.started_at,updatedAt:effectiveSession.updated_at},
  history:(history??[]).map(row=>({id:row.id,completedAt:row.completed_at,xpEarned:row.xp_earned,rounds:row.rounds})),
  notifications:[],
  consent:consent?{status:consent.status==="active"?"active":"revoked",confirmedAt:consent.confirmed_at,revokedAt:consent.revoked_at}:{status:"pending",confirmedAt:null,revokedAt:null}
 };
}

export async function updateRemoteUsername(username:string):Promise<string|null>{
 if(!supabaseConfigured||!supabase)return null;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return userError?.message??"Geen actieve gebruiker voor username-sync.";
 const{error}=await supabase.from("profiles").update({username}).eq("id",user.id);
 if(error)return error.code==="23505"?"Deze username is al in gebruik. Kies een andere username.":error.message;
 return null;
}

export async function completeRemoteSession(sessionId:string,rounds:number):Promise<{error:string|null,xpEarned:number}>{
 if(!supabaseConfigured||!supabase)return {error:null,xpEarned:120};
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return {error:userError?.message??"Geen actieve gebruiker.",xpEarned:0};
 const{data,error}=await supabase.rpc("complete_session",{p_session_id:sessionId,p_rounds:rounds});
 if(error)return {error:error.message,xpEarned:0};
 return {error:null,xpEarned:Number(data?.xp_earned??120)};
}

export async function syncRemoteState(state:AfterHoursState):Promise<string|null>{
 if(!supabaseConfigured||!supabase)return null;
 if(state.session.status==="completed")return null;
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
 if(sessionId){
  const{data:owned}=await supabase.from("sessions").select("id").eq("id",sessionId).eq("profile_id",user.id).maybeSingle();
  if(!owned)sessionId=null;
 }
 if(!sessionId){
  const{data:existing}=await supabase.from("sessions").select("id").eq("profile_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();
  sessionId=existing?.id??crypto.randomUUID();
 }

 const sessionPayload={
  id:sessionId,
  profile_id:user.id,
  status:state.session.status,
  round:state.session.round,
  started_at:state.session.startedAt,
  updated_at:state.session.updatedAt
 };

 if(sessionId){
  const{error}=await supabase.rpc("set_session_state",{p_session_id:sessionId,p_status:state.session.status,p_round:state.session.round,p_started_at:state.session.startedAt});
  if(error)return error.message;
 }else{
  const{error}=await supabase.from("sessions").insert(sessionPayload);
  if(error)return error.message;
 }

 if(state.consent.status==="active"&&state.consent.confirmedAt){
  const{data:existing}=await supabase.from("consent_records").select("id").eq("session_id",sessionId).eq("status","active").eq("confirmed_at",state.consent.confirmedAt).maybeSingle();
  if(!existing){
   const{error}=await supabase.from("consent_records").insert({session_id:sessionId,status:"active",confirmed_at:state.consent.confirmedAt});
   if(error)return error.message;
  }
 }

 if(state.consent.status==="revoked"&&state.consent.revokedAt){
  const{data:existing}=await supabase.from("consent_records").select("id").eq("session_id",sessionId).eq("status","revoked").eq("revoked_at",state.consent.revokedAt).maybeSingle();
  if(!existing){
   const{error}=await supabase.from("consent_records").insert({session_id:sessionId,status:"revoked",revoked_at:state.consent.revokedAt});
   if(error)return error.message;
  }
 }
 return null;
}