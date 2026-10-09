import type{AfterHoursState}from"./types";

const KEY="afterhours.state.v1";
const TIMER_KEY="afterhours.timer.v1";
const PROFILE_ID="local-profile";

export const defaultState=():AfterHoursState=>{
 const now=new Date().toISOString();
 return {
  ageConfirmed:false,
  ageConfirmedFor:null,
  consent:{status:"pending",confirmedAt:null,revokedAt:null},
  safety:"green",
  profile:{id:PROFILE_ID,displayName:"Night Walker",
   username:"nightwalker",avatarStyle:"sigil",level:1,xp:0,sessions:0,createdAt:now},
  session:{id:crypto.randomUUID(),profileId:PROFILE_ID,status:"ready",round:0,startedAt:null,updatedAt:now},
  history:[],
  notifications:[]
 };
};

function isState(value:unknown):value is AfterHoursState{
 if(!value||typeof value!=="object")return false;
 const v=value as Partial<AfterHoursState>;
 const consent=v.consent as Partial<AfterHoursState["consent"]>|undefined;
 const profile=v.profile as Partial<AfterHoursState["profile"]>|undefined;
 const session=v.session as Partial<AfterHoursState["session"]>|undefined;
 return typeof v.ageConfirmed==="boolean"
  &&(v.ageConfirmedFor===null||typeof v.ageConfirmedFor==="string")
  &&(v.safety==="green"||v.safety==="amber")
  &&!!consent
  &&(consent.status==="pending"||consent.status==="active"||consent.status==="revoked")
  &&(consent.confirmedAt===null||typeof consent.confirmedAt==="string")
  &&(consent.revokedAt===null||typeof consent.revokedAt==="string")
  &&!!profile
  &&typeof profile.id==="string"
  &&typeof profile.displayName==="string"
  &&typeof profile.username==="string"
  &&(profile.avatarStyle===undefined||profile.avatarStyle==="sigil"||profile.avatarStyle==="collar"||profile.avatarStyle==="key"||profile.avatarStyle==="crown")
  &&Number.isFinite(profile.level)
  &&Number.isFinite(profile.xp)
  &&Number.isFinite(profile.sessions)
  &&typeof profile.createdAt==="string"
  &&!!session
  &&typeof session.id==="string"
  &&typeof session.profileId==="string"
  &&(session.status==="ready"||session.status==="active"||session.status==="paused"||session.status==="completed"||session.status==="stopped")
  &&typeof session.round==="number"
  &&Number.isInteger(session.round)
  &&session.round>=0
  &&session.round<3
  &&(session.startedAt===null||typeof session.startedAt==="string")
  &&typeof session.updatedAt==="string"
  &&Array.isArray(v.history)
  &&Array.isArray(v.notifications);
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

type TimerSnapshot={profileId:string;round:number;seconds:number;savedAt:number;running:boolean};

const timerKey=(profileId:string)=>`${TIMER_KEY}:${profileId}`;

export function loadTimer(profileId:string,round:number,initialSeconds:number):number{
 try{
  const parsed=JSON.parse(localStorage.getItem(timerKey(profileId))??"null") as Partial<TimerSnapshot>|null;
  if(!parsed||parsed.profileId!==profileId||parsed.round!==round||!Number.isFinite(parsed.seconds)||!Number.isFinite(parsed.savedAt)||typeof parsed.running!=="boolean")return initialSeconds;
  const elapsed=parsed.running?Math.max(0,Math.floor((Date.now()-Number(parsed.savedAt))/1000)):0;
  return Math.max(0,Math.min(initialSeconds,Number(parsed.seconds)-elapsed));
 }catch{return initialSeconds}
}

export function saveTimer(profileId:string,round:number,seconds:number,running=true):boolean{try{localStorage.setItem(timerKey(profileId),JSON.stringify({profileId,round,seconds,savedAt:Date.now(),running}));return true}catch{return false}}
export function clearTimer(profileId:string):boolean{try{localStorage.removeItem(timerKey(profileId));return true}catch{return false}}
