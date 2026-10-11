import{useEffect,useState}from"react";
import{Activity,AlertCircle,ArrowLeft,CheckCircle2,Save,ShieldCheck,Users,Timer,Database}from"lucide-react";
import{supabase,supabaseConfigured}from"./services/supabase";

type Locale="nl"|"en";
type PanelState="loading"|"unavailable"|"setup"|"denied"|"ready";
type Round={
 slug:string;title_nl:string;body_nl:string;title_en:string;body_en:string;
 duration_seconds:number;sort_order:number;active:boolean;
};
type Metrics={
 profiles_total:number;sessions_total:number;sessions_completed:number;sessions_in_progress:number;
 active_consents:number;rounds_total:number;rounds_active:number;private_media_files:number;
};
type AuditEntry={id:string;action:string;metadata:Record<string,unknown>;created_at:string};

export default function AdminDashboard({language,onBack}:{language:Locale;onBack:()=>void}){
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const[status,setStatus]=useState<PanelState>("loading");
 const[metrics,setMetrics]=useState<Metrics|null>(null);
 const[rounds,setRounds]=useState<Round[]>([]);
 const[audit,setAudit]=useState<AuditEntry[]>([]);
 const[message,setMessage]=useState("");
 const[savingSlug,setSavingSlug]=useState<string|null>(null);

 useEffect(()=>{
  let active=true;
  const boot=async()=>{
   if(!supabaseConfigured||!supabase){setStatus("unavailable");return;}
   const client=supabase;
   try{
    const{data:{user},error:userError}=await client.auth.getUser();
    if(!active)return;
    if(userError||!user){setStatus("denied");return;}
    const{data:role,error:roleError}=await client.from("app_admins").select("user_id").eq("user_id",user.id).maybeSingle();
    if(!active)return;
    if(roleError){setStatus("setup");return;}
    if(!role){setStatus("denied");return;}
    const[metricResult,roundResult,auditResult]=await Promise.all([
     client.rpc("admin_dashboard_metrics"),
     client.from("experience_rounds").select("slug,title_nl,body_nl,title_en,body_en,duration_seconds,sort_order,active").order("sort_order",{ascending:true}),
     client.from("admin_audit_log").select("id,action,metadata,created_at").order("created_at",{ascending:false}).limit(12)
    ]);
    if(!active)return;
    if(metricResult.error||roundResult.error){setStatus("setup");return;}
    setMetrics((metricResult.data??{}) as unknown as Metrics);
    setRounds((roundResult.data??[]) as unknown as Round[]);
    setAudit((auditResult.data??[]) as unknown as AuditEntry[]);
    setStatus("ready");
   }catch{
    if(active)setStatus("setup");
   }
  };
  void boot();
  return()=>{active=false};
 },[language]);

 const updateRound=(slug:string,field:"title_nl"|"body_nl"|"title_en"|"body_en"|"duration_seconds"|"active",value:string|number|boolean)=>{
  setRounds(current=>current.map(round=>round.slug===slug?{...round,[field]:value}:round));
 };

 const saveRound=async(round:Round)=>{
  if(!supabaseConfigured||!supabase){setMessage(t("Supabase is niet ingesteld.","Supabase is not configured."));return;}
  setSavingSlug(round.slug);setMessage("");
  try{
   const{error}=await supabase.from("experience_rounds").update({
    title:round.title_nl,body:round.body_nl,title_nl:round.title_nl,body_nl:round.body_nl,
    title_en:round.title_en,body_en:round.body_en,duration_seconds:Number(round.duration_seconds),active:round.active
   }).eq("slug",round.slug);
   if(error)throw error;
   const[metricResult,auditResult]=await Promise.all([
    supabase.rpc("admin_dashboard_metrics"),
    supabase.from("admin_audit_log").select("id,action,metadata,created_at").order("created_at",{ascending:false}).limit(12)
   ]);
   if(metricResult.data)setMetrics(metricResult.data as unknown as Metrics);
   if(auditResult.data)setAudit(auditResult.data as unknown as AuditEntry[]);
   setMessage(t("Wijzigingen opgeslagen en in het auditlog vastgelegd.","Changes saved and recorded in the audit log."));
  }catch(error){
   setMessage(t("Opslaan is mislukt. Controleer de migratie en je beheerdersrechten.","Save failed. Check the migration and your admin permissions."));
  }finally{setSavingSlug(null)}
 };

 const metricCards=metrics?[
  {label:t("Profielen","Profiles"),value:metrics.profiles_total??0,icon:<Users/>},
  {label:t("Alle sessies","All sessions"),value:metrics.sessions_total??0,icon:<Activity/>},
  {label:t("Afgerond","Completed"),value:metrics.sessions_completed??0,icon:<CheckCircle2/>},
  {label:t("Actief of gepauzeerd","Active or paused"),value:metrics.sessions_in_progress??0,icon:<Timer/>},
  {label:t("Actieve consentrecords","Active consent records"),value:metrics.active_consents??0,icon:<ShieldCheck/>},
  {label:t("Privémedia-bestanden","Private media files"),value:metrics.private_media_files??0,icon:<Database/>}
 ]:[];

 return <main className="admin-console">
  <button className="back" onClick={onBack}><ArrowLeft size={15}/> {t("Terug naar profiel","Back to profile")}</button>
  <span className="eyebrow">AFTER HOURS · PRIVATE ADMIN</span>
  <h1>{t("Beheerpaneel","Admin dashboard")}</h1>
  <p className="admin-intro">{t("Alleen geautoriseerde beheerders zien deze gegevens. Statistieken zijn geaggregeerd; persoonlijke sessie-inhoud wordt niet getoond.","Only allowlisted admins can see this data. Metrics are aggregated; private session content is not shown.")}</p>

  {status==="loading"&&<section className="admin-state"><Activity/><strong>{t("Beveiligde toegang controleren…","Checking secure access…")}</strong></section>}
  {status==="unavailable"&&<section className="admin-state"><AlertCircle/><strong>{t("Backend niet beschikbaar","Backend unavailable")}</strong><p>{t("Het paneel vereist de ingestelde Supabase-backend. Er wordt geen lokale beheermodus gebruikt.","This dashboard requires the configured Supabase backend. No local admin mode is provided.")}</p></section>}
  {status==="setup"&&<section className="admin-state"><AlertCircle/><strong>{t("Beheerdermigratie vereist","Admin migration required")}</strong><p>{t("Voer supabase/migrate_admin_dashboard.sql uit in de juiste Supabase-database en geef daarna je geverifieerde auth-user-ID toegang via public.app_admins. Tot die tijd blijft het paneel gesloten.","Run supabase/migrate_admin_dashboard.sql in the correct Supabase database, then allowlist your verified auth user ID in public.app_admins. The panel remains closed until then.")}</p></section>}
  {status==="denied"&&<section className="admin-state"><ShieldCheck/><strong>{t("Geen beheerdersrechten","No admin access")}</strong><p>{t("Deze account staat niet op de server-side beheerderslijst. Alleen een bestaande beheerder of databasebeheerder kan toegang toekennen.","This account is not on the server-side admin allowlist. Only an existing admin or database administrator can grant access.")}</p></section>}

  {status==="ready"&&<>
   <section className="admin-metrics"><div className="admin-section-head"><div><span className="eyebrow">{t("OVERZICHT","OVERVIEW")}</span><h2>{t("Gebruik & activiteit","Usage & activity")}</h2></div><span className="admin-secure"><ShieldCheck size={15}/>{t("Server-geautoriseerd","Server-authorized")}</span></div>
    <div className="admin-metric-grid">{metricCards.map(item=><article key={item.label} className="admin-metric-card"><span>{item.icon}</span><small>{item.label}</small><strong>{item.value.toLocaleString(language==="nl"?"nl-NL":"en-GB")}</strong></article>)}</div>
    <p className="admin-footnote">{t("Er worden geen aantallen voor omzet getoond zolang er geen echte betaalprovider en orderdatabase actief zijn.","Revenue is not shown while no real payment provider and order database are active.")}</p>
   </section>

   <section className="admin-round-editor"><span className="eyebrow">{t("CONTENTBEHEER","CONTENT MANAGEMENT")}</span><h2>{t("Ervaringsrondes","Experience rounds")}</h2><p>{t("Pas Nederlandse en Engelse copy aan. Opslaan werkt alleen met geldige server-side beheerdersrechten.","Edit the Dutch and English copy. Saving works only with valid server-side admin access.")}</p>
    {rounds.map(round=><article key={round.slug} className="admin-round-card">
     <div className="admin-round-top"><div><small>{round.slug} · #{round.sort_order}</small><h3>{round.title_en||round.title_nl}</h3></div><label className="admin-active-toggle"><input type="checkbox" checked={round.active} onChange={event=>updateRound(round.slug,"active",event.target.checked)}/><span>{round.active?t("Actief","Active"):t("Verborgen","Hidden")}</span></label></div>
     <div className="admin-copy-grid">
      <div><label>{t("Titel Nederlands","Dutch title")}</label><input value={round.title_nl} onChange={event=>updateRound(round.slug,"title_nl",event.target.value)} maxLength={90}/><label>{t("Instructie Nederlands","Dutch instruction")}</label><textarea value={round.body_nl} onChange={event=>updateRound(round.slug,"body_nl",event.target.value)} rows={3} maxLength={1000}/></div>
      <div><label>{t("Titel Engels","English title")}</label><input value={round.title_en} onChange={event=>updateRound(round.slug,"title_en",event.target.value)} maxLength={90}/><label>{t("Instructie Engels","English instruction")}</label><textarea value={round.body_en} onChange={event=>updateRound(round.slug,"body_en",event.target.value)} rows={3} maxLength={1000}/></div>
     </div>
     <div className="admin-round-actions"><label>{t("Duur (seconden)","Duration (seconds)")}<input type="number" min={60} max={7200} step={60} value={round.duration_seconds} onChange={event=>updateRound(round.slug,"duration_seconds",Math.max(60,Math.min(7200,Number(event.target.value)||60)))}/></label><button className="gold" onClick={()=>void saveRound(round)} disabled={savingSlug!==null||!round.title_nl.trim()||!round.title_en.trim()||!round.body_nl.trim()||!round.body_en.trim()}><Save size={15}/>{savingSlug===round.slug?t("Opslaan…","Saving…"):t("Wijzigingen opslaan","Save changes")}</button></div>
    </article>)}
    {message&&<p className="admin-save-message" role="status">{message}</p>}
   </section>

   <section className="admin-audit"><span className="eyebrow">{t("BEHEERLOG","AUDIT LOG")}</span><h2>{t("Recente wijzigingen","Recent changes")}</h2>
    {audit.length===0?<p>{t("Nog geen beheeracties geregistreerd.","No admin actions recorded yet.")}</p>:audit.map(item=><div className="admin-audit-row" key={item.id}><div><strong>{item.action}</strong><small>{String(item.metadata?.slug??"")}</small></div><time>{new Date(item.created_at).toLocaleString(language==="nl"?"nl-NL":"en-GB")}</time></div>)}
   </section>
  </>}
 </main>;
}
