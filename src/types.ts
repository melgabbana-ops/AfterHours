export type Screen="home"|"game"|"profile"|"admin"|"insights"|"radio";
export type Safety="green"|"amber";
export type ConsentStatus="pending"|"active"|"revoked";

export interface UserProfile{
 id:string;
 displayName:string;
 username:string;
 level:number;
 xp:number;
 sessions:number;
 createdAt:string;
}

export type NotificationKind="message"|"checkin"|"safety";

export interface AfterHoursNotification{
 id:string;
 kind:NotificationKind;
 title:string;
 body:string;
 createdAt:string;
 read:boolean;
}

export interface SessionHistoryEntry{
 id:string;
 completedAt:string;
 xpEarned:number;
 rounds:number;
}

export interface Session{
 id:string;
 profileId:string;
 status:"ready"|"active"|"paused"|"completed"|"stopped";
 round:number;
 startedAt:string|null;
 updatedAt:string;
}

export interface ConsentRecord{
 status:ConsentStatus;
 confirmedAt:string|null;
 revokedAt:string|null;
}

export interface AfterHoursState{
 ageConfirmed:boolean;
 consent:ConsentRecord;
 safety:Safety;
 profile:UserProfile;
 session:Session;
 history:SessionHistoryEntry[];
 notifications:AfterHoursNotification[];
}