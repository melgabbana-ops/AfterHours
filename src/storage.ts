import type{AfterHoursState,AfterHoursNotification,SessionHistoryEntry}from"./types";

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

function isTimestamp(value:unknown):value is string{
 return typeof value==="string"&&value.trim().length>0&&Number.isFinite(Date.parse(value));
}

function isSessionHistoryEntry(value:unknown):value is SessionHistoryEntry{
 if(!value||typeof value!=="object")return false;
 const entry=value as Partial<SessionHistoryEntry>;
 return typeof entry.id==="string"
  &&entry.id.trim().length>0
  &&isTimestamp(entry.completedAt)
  &&typeof entry.xpEarned==="number"
  &&Number.isFinite(entry.xpEarned)
  &&entry.xpEarned>=0
  &&typeof entry.rounds==="number"
  &&Number.isInteger(entry.rounds)
  &&entry.rounds>0
  &&entry.rounds<=20;
}

function isAfterHoursNotification(value:unknown):value is AfterHoursNotification{
 if(!value||typeof value!=="object")return false;
 const notification=value as Partial<AfterHoursNotification>;
 return typeof notification.id==="string"
  &&notification.id.trim().length>0
  &&(notification.kind==="message"||notification.kind==="checkin"||notification.kind==="safety")
  &&typeof notification.title==="string"
  &&notification.title.trim().length>0
  &&typeof notification.body==="string"
  &&notification.body.trim().length>0
  &&isTimestamp(notification.createdAt)
  &&typeof notification.read==="boolean";
}

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
  &&(consent.confirmedAt===null||isTimestamp(consent.confirmedAt))
  &&(consent.revokedAt===null||isTimestamp(consent.revokedAt))
  &&!!profile
  &&typeof profile.id==="string"
  &&typeof profile.displayName==="string"
  &&typeof profile.username==="string"
  &&(profile.avatarStyle===undefined||profile.avatarStyle==="sigil"||profile.avatarStyle==="collar"||profile.avatarStyle==="key"||profile.avatarStyle==="crown")
  &&Number.isInteger(profile.level)
  &&Number(profile.level)>=1
  &&Number.isInteger(profile.xp)
  &&Number(profile.xp)>=0
  &&Number.isInteger(profile.sessions)
  &&Number(profile.sessions)>=0
  &&isTimestamp(profile.createdAt)
  &&!!session
  &&typeof session.id==="string"
  &&session.id.trim().length>0
  &&typeof session.profileId==="string"
  &&session.profileId===profile.id
  &&(session.status==="ready"||session.status==="active"||session.status==="paused"||session.status==="completed"||session.status==="stopped")
  &&typeof session.round==="number"
  &&Number.isInteger(session.round)
  &&session.round>=0
  &&session.round<3
  &&(session.startedAt===null||isTimestamp(session.startedAt))
  &&isTimestamp(session.updatedAt)
  &&Array.isArray(v.history)
  &&Array.isArray(v.notifications);
}

export function loadState():AfterHoursState{
 try{
  const raw=localStorage.getItem(KEY);
  if(!raw)return defaultState();
  const parsed:unknown=JSON.parse(raw);
  if(!isState(parsed))return defaultState();
  return {
   ...parsed,
   history:parsed.history.filter(isSessionHistoryEntry).slice(0,12),
   notifications:parsed.notifications.filter(isAfterHoursNotification).slice(0,20)
  };
 }catch{return defaultState()}
}

export function saveState(state:AfterHoursState){localStorage.setItem(KEY,JSON.stringify(state))}

type TimerSnapshot={profileId:string;round:number;seconds:number;savedAt:number;running:boolean};

const timerKey=(profileId:string)=>`${TIMER_KEY}:${profileId}`;

export function loadTimer(profileId:string,round:number,initialSeconds:number):number{
 try{
  const parsed=JSON.parse(localStorage.getItem(timerKey(profileId))??"null") as Partial<TimerSnapshot>|null;
  if(!parsed
   ||parsed.profileId!==profileId
   ||parsed.round!==round
   ||!Number.isInteger(parsed.round)
   ||!Number.isInteger(parsed.seconds)
   ||Number(parsed.seconds)<0
   ||Number(parsed.seconds)>initialSeconds
   ||!Number.isFinite(parsed.savedAt)
   ||Number(parsed.savedAt)<0
   ||typeof parsed.running!=="boolean"
   ||!Number.isFinite(initialSeconds)
   ||initialSeconds<0
  )return initialSeconds;
  // A device clock rollback must never restore extra active session time.
  // Fail closed at zero so the app transitions the active round to PAUSE.
  if(parsed.running && Number(parsed.savedAt)>Date.now())return 0;
  const elapsed=parsed.running?Math.floor((Date.now()-Number(parsed.savedAt))/1000):0;
  return Math.max(0,Math.min(initialSeconds,Number(parsed.seconds)-elapsed));
 }catch{return initialSeconds}
}

export function saveTimer(profileId:string,round:number,seconds:number,running=true):boolean{try{localStorage.setItem(timerKey(profileId),JSON.stringify({profileId,round,seconds,savedAt:Date.now(),running}));return true}catch{return false}}
export function clearTimer(profileId:string):boolean{try{localStorage.removeItem(timerKey(profileId));return true}catch{return false}}
