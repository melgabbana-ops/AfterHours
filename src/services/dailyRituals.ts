import { supabase, supabaseConfigured } from "./supabase";

export interface DailyRitualCompletion {
  ritual_date: string;
  completed_at: string | null;
  already_completed?: boolean;
}

export async function loadDailyRitualHistory(): Promise<string[] | null> {
  if (!supabaseConfigured || !supabase) return null;
  const {data:auth,error:authError}=await supabase.auth.getUser();
  if(authError)throw authError;
  if(!auth.user)return null;
  const {data,error}=await supabase.rpc("get_daily_ritual_history");
  if(error)throw error;
  if(!Array.isArray(data))throw new Error("Invalid daily ritual history response.");
  return data.map((row:unknown)=>{
    if(!row||typeof row!=="object"||typeof (row as Record<string,unknown>).ritual_date!=="string")throw new Error("Invalid daily ritual history row.");
    return (row as {ritual_date:string}).ritual_date;
  }).filter((date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)).slice(-120);
}

export async function completeDailyRitualRemote():Promise<DailyRitualCompletion|null>{
  if(!supabaseConfigured||!supabase)return null;
  const {data:auth,error:authError}=await supabase.auth.getUser();
  if(authError)throw authError;
  if(!auth.user)return null;
  const {data,error}=await supabase.rpc("complete_daily_ritual");
  if(error)throw error;
  if(!data||typeof data!=="object"||typeof (data as Record<string,unknown>).ritual_date!=="string")throw new Error("Invalid daily ritual completion response.");
  return data as DailyRitualCompletion;
}
