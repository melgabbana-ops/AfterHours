import type{AfterHoursNotification,NotificationKind}from"../types";

const id=()=>typeof crypto!=="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`notification-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function createNotification(kind:NotificationKind,title:string,body:string):AfterHoursNotification{
 return{id:id(),kind,title,body,createdAt:new Date().toISOString(),read:false};
}

export const notificationEvents={
 checkIn:(body:string)=>createNotification("checkin","Check-in",body),
 safety:(body:string)=>createNotification("safety","Veiligheid",body),
 message:(title:string,body:string)=>createNotification("message",title,body)
};
