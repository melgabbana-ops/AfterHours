import type{AfterHoursState}from"./types";

const KEY="afterhours.state.v1";

export const defaultState=():AfterHoursState=>({
 ageConfirmed:false,
 consent:{status:"pending",confirmedAt:null,revokedAt:null},
 safety:"green",
 profile:{id:"local-profile",displayName:"Night Walker",level:4,xp:680,sessions:12,createdAt:new Date().toISOString()},
 session:{id:"local-session",profileId:"local-profile",status:"ready",round:0,startedAt:null,updatedAt:new Date().toISOString()}
});

export function loadState():AfterHoursState{
 try{
  const raw=localStorage.getItem(KEY);
  if(!raw)return defaultState();
  return {...defaultState(),...JSON.parse(raw)};
 }catch{return defaultState()}
}

export function saveState(state:AfterHoursState){localStorage.setItem(KEY,JSON.stringify(state))}
export function clearState(){localStorage.removeItem(KEY)}
