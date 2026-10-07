import type{AfterHoursState}from"../types";
import{supabase,supabaseConfigured}from"./supabase";

const isUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function loadRemoteState():Promise<AfterHoursState|null>{
 if(!supabaseConfigured||!supabase)return null;
 const{data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const{data:profile}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
 if(!profile)return null;
 const{data:session}=await supabase.from("sessions").select("*").eq("profile_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();
 if(!session)return null;
 const{data:consent}=await supabase.from("consent_records").select("status,confirmed_at,revoked_at").eq("session_id",session.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
 return{
  ageConfirmed:false,
  safety:"green",
  profile:{id:profile.id,displayName:profile.display_name,level:profile.level,xp:profile.xp,sessions:profile.sessions,createdAt:profile.created_at},
  session:{id:session.id,profileId:session.profile_id,status:session.status,round:session.round,startedAt:session.started_at,updatedAt:session.updated_at},
  consent:consent?{status:consent.status==="active"?"active":"revoked",confirmedAt:consent.confirmed_at,revokedAt:consent.revoked_at}:{status:"pending",confirmedAt:null,revokedAt:null}
 };
}

export async function syncRemoteState(state:AfterHoursState):Promise<void>{
 if(!supabaseConfigured||!supabase)return;
 const{data:{user}}=await supabase.auth.getUser();
 if(!user)return;
 await supabase.from("profiles").upsert({id:user.id,display_name:state.profile.displayName,level:state.profile.level,xp:state.profile.xp,sessions:state.profile.sessions});
 let sessionId=isUuid(state.session.id)?state.session.id:null;
 if(!sessionId){
  const{data:existing}=await supabase.from("sessions").select("id").eq("profile_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();
  sessionId=existing?.id??null;
 }
 if(sessionId){
  await supabase.from("sessions").upsert({id:sessionId,profile_id:user.id,status:state.session.status,round:state.session.round,started_at:state.session.startedAt,updated_at:state.session.updatedAt});
 }else{
  await supabase.from("sessions").insert({profile_id:user.id,status:state.session.status,round:state.session.round,started_at:state.session.startedAt,updated_at:state.session.updatedAt});
 }
 if(state.consent.status==="active"&&state.consent.confirmedAt){
  const{data:existing}=await supabase.from("consent_records").select("id").eq("session_id",sessionId??"").eq("status","active").eq("confirmed_at",state.consent.confirmedAt).maybeSingle();
  if(!existing&&sessionId)await supabase.from("consent_records").insert({session_id:sessionId,status:"active",confirmed_at:state.consent.confirmedAt});
 }
 if(state.consent.status==="revoked"&&state.consent.revokedAt){
  const{data:existing}=await supabase.from("consent_records").select("id").eq("session_id",sessionId??"").eq("status","revoked").eq("revoked_at",state.consent.revokedAt).maybeSingle();
  if(!existing&&sessionId)await supabase.from("consent_records").insert({session_id:sessionId,status:"revoked",revoked_at:state.consent.revokedAt});
 }
}
