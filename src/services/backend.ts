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

export async function saveRemoteHistory(entry:import("../types").SessionHistoryEntry):Promise<void>{
 if(!supabaseConfigured||!supabase)return;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return;
 await supabase.from("session_history").upsert({id:entry.id,profile_id:user.id,completed_at:entry.completedAt,xp_earned:entry.xpEarned,rounds:entry.rounds},{onConflict:"id"});
}

export async function loadRemoteState():Promise<AfterHoursState|null>{
 if(!supabaseConfigured||!supabase)return null;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return null;

 const{data:profile,error:profileError}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
 if(profileError||!profile)return null;

 const{data:session,error:sessionError}=await supabase.from("sessions").select("*").eq("profile_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();
 if(sessionError||!session)return null;

 const{data:consent}=await supabase.from("consent_records").select("status,confirmed_at,revoked_at").eq("session_id",session.id).order("created_at",{ascending:false}).limit(1).maybeSingle();

 return{
  ageConfirmed:false,
  safety:"green",
  profile:{id:profile.id,displayName:profile.display_name,username:profile.username??"night-walker",level:profile.level,xp:profile.xp,sessions:profile.sessions,createdAt:profile.created_at},
  session:{id:session.id,profileId:session.profile_id,status:session.status,round:session.round,startedAt:session.started_at,updatedAt:session.updated_at},
  history:[],
  notifications:[],
  consent:consent?{status:consent.status==="active"?"active":"revoked",confirmedAt:consent.confirmed_at,revokedAt:consent.revoked_at}:{status:"pending",confirmedAt:null,revokedAt:null}
 };
}

export async function syncRemoteState(state:AfterHoursState):Promise<void>{
 if(!supabaseConfigured||!supabase)return;
 const{data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)return;

 const{error:profileError}=await supabase.from("profiles").upsert({
  id:user.id,
  display_name:state.profile.displayName,
  username:state.profile.username,
  level:state.profile.level,
  xp:state.profile.xp,
  sessions:state.profile.sessions
 });
 if(profileError)return;

 let sessionId=isUuid(state.session.id)?state.session.id:null;
 if(sessionId){
  const{data:owned}=await supabase.from("sessions").select("id").eq("id",sessionId).eq("profile_id",user.id).maybeSingle();
  if(!owned)sessionId=null;
 }
 if(!sessionId){
  const{data:existing}=await supabase.from("sessions").select("id").eq("profile_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();
  sessionId=existing?.id??null;
 }

 const sessionPayload={
  profile_id:user.id,
  status:state.session.status,
  round:state.session.round,
  started_at:state.session.startedAt,
  updated_at:state.session.updatedAt
 };

 if(sessionId){
  const{error}=await supabase.from("sessions").update(sessionPayload).eq("id",sessionId).eq("profile_id",user.id);
  if(error)return;
 }else{
  const{data:created,error}=await supabase.from("sessions").insert(sessionPayload).select("id").single();
  if(error||!created)return;
  sessionId=created.id;
 }

 if(state.consent.status==="active"&&state.consent.confirmedAt){
  const{data:existing}=await supabase.from("consent_records").select("id").eq("session_id",sessionId).eq("status","active").eq("confirmed_at",state.consent.confirmedAt).maybeSingle();
  if(!existing){
   await supabase.from("consent_records").insert({session_id:sessionId,status:"active",confirmed_at:state.consent.confirmedAt});
  }
 }

 if(state.consent.status==="revoked"&&state.consent.revokedAt){
  const{data:existing}=await supabase.from("consent_records").select("id").eq("session_id",sessionId).eq("status","revoked").eq("revoked_at",state.consent.revokedAt).maybeSingle();
  if(!existing){
   await supabase.from("consent_records").insert({session_id:sessionId,status:"revoked",revoked_at:state.consent.revokedAt});
  }
 }
}