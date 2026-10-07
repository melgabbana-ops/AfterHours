import type{AfterHoursState}from"./types";

const KEY="afterhours.state.v1";
const PROFILE_ID="local-profile";
const SESSION_ID="local-session";

export const defaultState=():AfterHoursState=>{
 const now=new Date().toISOString();
 return {
  ageConfirmed:false,
  consent:{status:"pending",confirmedAt:null,revokedAt:null},
  safety:"green",
  profile:{id:PROFILE_ID,displayName:"Night Walker",level:4,xp:680,sessions:12,createdAt:now},
  session:{id:SESSION_ID,profileId:PROFILE_ID,status:"ready",round:0,startedAt:null,updatedAt:now}
 };
};

function isState(value:unknown):value is AfterHoursState{
 if(!value||typeof value!=="object")return false;
 const v=value as Partial<AfterHoursState>;
 return typeof v.ageConfirmed==="boolean"
  &&(v.safety==="green"||v.safety==="amber")
  &&!!v.consent&&typeof v.consent==="object"
  &&!!v.profile&&typeof v.profile==="object"
  &&!!v.session&&typeof v.session==="object";
}

export function loadState():AfterHoursState{
 try{
  const raw=localStorage.getItem(KEY);
  if(!raw)return defaultState();
  const parsed:unknown=JSON.parse(raw);
  if(!isState(parsed))return defaultState();
  return parsed;
 }catch{return defaultState()}
}

export function saveState(state:AfterHoursState){localStorage.setItem(KEY,JSON.stringify(state))}
export function clearState(){localStorage.removeItem(KEY)}
