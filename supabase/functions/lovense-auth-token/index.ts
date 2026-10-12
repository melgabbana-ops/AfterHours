import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://after-hours-hazel-eight.vercel.app",
  "http://localhost:5173",
];
function corsFor(origin: string): Record<string,string> {
  const configured = (Deno.env.get("LOVENSE_ALLOWED_ORIGINS") ?? "").split(",").map(x => x.trim()).filter(Boolean);
  const allowList = configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
  return {
    "Access-Control-Allow-Origin": allowList.includes(origin) ? origin : "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}
function json(body: unknown, status: number, cors: Record<string,string>) {
  return new Response(JSON.stringify(body), {status, headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
}

Deno.serve(async (req) => {
  const origin=req.headers.get("origin")??"";
  const cors=corsFor(origin);
  if(req.method==="OPTIONS") return cors["Access-Control-Allow-Origin"]
    ? new Response("ok",{headers:cors})
    : new Response("Origin not allowed",{status:403,headers:{"Vary":"Origin"}});
  if(!cors["Access-Control-Allow-Origin"]) return json({error:"Origin not allowed."},403,cors);
  if(req.method!=="POST") return json({error:"Method not allowed."},405,cors);

  const authorization=req.headers.get("Authorization")??"";
  const bearer=authorization.toLowerCase().startsWith("bearer ")?authorization.slice(7).trim():"";
  if(!bearer) return json({error:"Authentication required."},401,cors);

  const supabaseUrl=Deno.env.get("SUPABASE_URL");
  const anonKey=Deno.env.get("SUPABASE_ANON_KEY")??Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const developerToken=Deno.env.get("LOVENSE_DEVELOPER_TOKEN");
  const platform=Deno.env.get("LOVENSE_PLATFORM_NAME");
  if(!supabaseUrl||!anonKey||!developerToken||!platform) {
    return json({error:"Lovense is not configured yet. Add the Supabase and Lovense server secrets before connecting."},503,cors);
  }

  try {
    const authClient=createClient(supabaseUrl,anonKey,{
      auth:{persistSession:false,autoRefreshToken:false},
      global:{headers:{Authorization:"Bearer "+bearer}}
    });
    const {data:userData,error:userError}=await authClient.auth.getUser(bearer);
    if(userError||!userData.user) return json({error:"Authentication expired. Sign in again."},401,cors);

    let displayName="";
    try {
      const body=await req.json();
      if(body&&typeof body.displayName==="string") displayName=body.displayName.replace(/[\u0000-\u001f<>]/g,"").trim().slice(0,32);
    } catch { /* Display name is optional. */ }

    const response=await fetch("https://api.lovense-api.com/api/basicApi/getToken",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        token:developerToken,
        uid:userData.user.id,
        uname:displayName||"AFTER HOURS member"
      }),
      signal:AbortSignal.timeout(10000)
    });
    if(!response.ok) return json({error:"Lovense could not create a connection token. Try again later."},502,cors);
    const result=await response.json();
    if(result?.code!==0||typeof result?.data?.authToken!=="string"||!result.data.authToken) {
      return json({error:"Lovense refused the connection token. Check developer account and platform configuration."},502,cors);
    }
    return json({authToken:result.data.authToken,uid:userData.user.id,platform},200,cors);
  } catch {
    return json({error:"Lovense connection could not be prepared. No device command was sent."},502,cors);
  }
});
