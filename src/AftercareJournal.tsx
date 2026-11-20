import React,{useEffect,useState}from"react";
import{BookHeart,LockKeyhole,Plus,Trash2,Unlock}from"lucide-react";
import{AFTERCARE_JOURNAL_LEGACY_STORAGE_KEY,getAftercareJournalStorageKey}from"./aftercareJournalStorage";
import"./AftercareJournal.css";

type Entry={id:string;createdAt:string;title:string;feeling:string;needs:string;reflection:string};
const encoder=new TextEncoder();
const decoder=new TextDecoder();

function toArrayBuffer(bytes:Uint8Array):ArrayBuffer{
 const copy=new ArrayBuffer(bytes.byteLength);
 new Uint8Array(copy).set(bytes);
 return copy;
}

async function deriveKey(passphrase:string,salt:Uint8Array){
 const material=await crypto.subtle.importKey("raw",toArrayBuffer(encoder.encode(passphrase)),"PBKDF2",false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",salt:toArrayBuffer(salt),iterations:210000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
function bytesToBase64(bytes:Uint8Array){let binary="";bytes.forEach(value=>binary+=String.fromCharCode(value));return btoa(binary);}
function base64ToBytes(value:string){return Uint8Array.from(atob(value),char=>char.charCodeAt(0));}
async function encryptEntries(entries:Entry[],passphrase:string){
 const salt=crypto.getRandomValues(new Uint8Array(16));const iv=crypto.getRandomValues(new Uint8Array(12));const key=await deriveKey(passphrase,salt);
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv:toArrayBuffer(iv)},key,toArrayBuffer(encoder.encode(JSON.stringify(entries))));
 return JSON.stringify({version:1,salt:bytesToBase64(salt),iv:bytesToBase64(iv),cipher:bytesToBase64(new Uint8Array(cipher))});
}
async function decryptEntries(raw:string,passphrase:string):Promise<Entry[]>{
 const envelope=JSON.parse(raw) as {version:number;salt:string;iv:string;cipher:string};
 if(envelope.version!==1)throw new Error("unsupported");
 const key=await deriveKey(passphrase,base64ToBytes(envelope.salt));
 const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:toArrayBuffer(base64ToBytes(envelope.iv))},key,toArrayBuffer(base64ToBytes(envelope.cipher)));
 const parsed:unknown=JSON.parse(decoder.decode(plain));
 if(!Array.isArray(parsed)||!parsed.every(item=>item&&typeof item.id==="string"&&typeof item.reflection==="string"))throw new Error("invalid");
 return parsed as Entry[];
}

type Props={profileId:string;language:"nl"|"en";onBack:()=>void};
export default function AftercareJournal({profileId,language,onBack}:Props){
 const storageKey=getAftercareJournalStorageKey(profileId);
 const[pass,setPass]=useState("");const[unlocked,setUnlocked]=useState(false);const[hasVault,setHasVault]=useState(false);const[hasLegacyVault,setHasLegacyVault]=useState(false);const[storageReady,setStorageReady]=useState(false);const[entries,setEntries]=useState<Entry[]>([]);
 const[title,setTitle]=useState("");const[feeling,setFeeling]=useState("");const[needs,setNeeds]=useState("");const[reflection,setReflection]=useState("");const[message,setMessage]=useState("");const[saving,setSaving]=useState(false);const[unlocking,setUnlocking]=useState(false);
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 useEffect(()=>{
  setStorageReady(false);
  if(!storageKey){setHasVault(false);setHasLegacyVault(false);setMessage(t("Er is geen geldig profiel gevonden. Open je profiel opnieuw en probeer het nog eens.","No valid profile was found. Reopen your profile and try again."));setStorageReady(true);return;}
  try{
   setHasVault(Boolean(localStorage.getItem(storageKey)));
   setHasLegacyVault(Boolean(localStorage.getItem(AFTERCARE_JOURNAL_LEGACY_STORAGE_KEY)));
  }catch{
   setHasVault(false);setHasLegacyVault(false);setMessage(t("Opslag is niet beschikbaar op dit apparaat.","Storage is unavailable on this device."));
  }finally{setStorageReady(true);}
 },[storageKey,language]);
 const unlock=async()=>{
  if(!storageKey){setMessage(t("Er is geen geldig profiel gevonden. Je journal is niet geopend.","No valid profile was found. Your journal was not opened."));return;}
  if(pass.length<8){setMessage(t("Gebruik minimaal 8 tekens voor je wachtzin.","Use at least 8 characters for your passphrase."));return;}
  if(unlocking)return;
  setUnlocking(true);
  try{
   const raw=localStorage.getItem(storageKey);
   if(raw){const loaded=await decryptEntries(raw,pass);setEntries(loaded);}
   else{
    const encrypted=await encryptEntries([],pass);
    localStorage.setItem(storageKey,encrypted);
    if(localStorage.getItem(storageKey)!==encrypted)throw new Error("storage verification failed");
    setEntries([]);
   }
   setUnlocked(true);setHasVault(true);setMessage(t("Je profielgebonden journal is lokaal en versleuteld geopend.","Your profile-specific journal is open and encrypted on this device."));
  }catch{setMessage(t("Niet geopend. Controleer je wachtzin of browseropslag.","Could not unlock. Check your passphrase or browser storage."));}
  finally{setUnlocking(false);}
 };
 const persist=async(next:Entry[]):Promise<boolean>=>{
  if(!storageKey||saving)return false;
  setSaving(true);
  try{
   const encrypted=await encryptEntries(next,pass);
   localStorage.setItem(storageKey,encrypted);
   if(localStorage.getItem(storageKey)!==encrypted)throw new Error("storage verification failed");
   setEntries(next);setMessage(t("Versleuteld opgeslagen voor dit profiel op dit apparaat.","Encrypted and saved for this profile on this device."));
   return true;
  }catch{
   setMessage(t("Opslaan is niet gelukt. Je wijzigingen zijn niet bevestigd; probeer opnieuw.","Save failed. Your changes were not confirmed; please try again."));
   return false;
  }finally{setSaving(false);}
 };
 const add=async()=>{
  if(saving||(!reflection.trim()&&!feeling.trim()&&!needs.trim()))return;
  const entry:Entry={id:crypto.randomUUID(),createdAt:new Date().toISOString(),title:title.trim().slice(0,80),feeling:feeling.trim().slice(0,1200),needs:needs.trim().slice(0,1200),reflection:reflection.trim().slice(0,4000)};
  if(await persist([entry,...entries])){setTitle("");setFeeling("");setNeeds("");setReflection("");}
 };
 const remove=async(id:string)=>{if(saving)return;await persist(entries.filter(entry=>entry.id!==id));};
 const lock=()=>{setUnlocked(false);setPass("");setEntries([]);setTitle("");setFeeling("");setNeeds("");setReflection("");};
 return <main className="ah-journal-screen ah-editorial-screen"><section className="ah-journal-card"><span className="eyebrow">AFTER HOURS · PRIVATE JOURNAL</span><div className="ah-journal-title"><BookHeart/><div><h2>{t("Aftercare Journal","Aftercare Journal")}</h2><p>{t("Een rustige plek om stil te staan bij wat je voelt en nodig hebt.","A quiet place to reflect on what you feel and need.")}</p></div></div>
 {!unlocked?<div className="ah-journal-lock"><LockKeyhole/><h3>{t(hasVault?"Open je journal":"Maak je privéjournal aan",hasVault?"Unlock your journal":"Create your private journal")}</h3><p>{t("Je wachtzin versleutelt je notities met AES-GCM op dit apparaat. We kunnen deze niet herstellen als je hem vergeet.","Your passphrase encrypts notes with AES-GCM on this device. It cannot be recovered if forgotten.")}</p>{hasLegacyVault&&!hasVault&&<p className="ah-journal-legacy-notice" role="status">{t("Er is een eerder journal zonder profielkoppeling gevonden. Het wordt niet automatisch geopend of verplaatst, zodat privénotities niet tussen profielen worden gedeeld. De oude versleutelde gegevens blijven onaangeroerd.","An older journal without a profile link was found. It is not opened or moved automatically, so private notes are not shared between profiles. The old encrypted data remains untouched.")}</p>}<label htmlFor="ah-journal-pass">{t("Privé-wachtzin","Private passphrase")}</label><input id="ah-journal-pass" type="password" autoComplete={hasVault?"current-password":"new-password"} minLength={8} value={pass} onChange={event=>setPass(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void unlock();}}/><button className="gold" onClick={()=>void unlock()} disabled={!storageReady||!storageKey||pass.length<8||unlocking}><Unlock/>{unlocking?t("Controleren…","Checking…"):t("Journal openen","Unlock journal")}</button></div>:<>
 <div className="ah-journal-toolbar"><span>{entries.length} {t("notities","entries")}</span><button type="button" onClick={lock} disabled={saving}><LockKeyhole/>{t("Vergrendelen","Lock")}</button></div>
 <div className="ah-journal-form"><h3>{t("Nieuwe reflectie","New reflection")}</h3><label htmlFor="ah-journal-entry-title">{t("Titel (optioneel)","Title (optional)")}</label><input id="ah-journal-entry-title" maxLength={80} value={title} onChange={event=>setTitle(event.target.value)}/><label htmlFor="ah-journal-feeling">{t("Hoe voel ik me nu?","How do I feel right now?")}</label><textarea id="ah-journal-feeling" rows={2} maxLength={1200} value={feeling} onChange={event=>setFeeling(event.target.value)}/><label htmlFor="ah-journal-needs">{t("Wat heb ik nu nodig?","What do I need right now?")}</label><textarea id="ah-journal-needs" rows={2} maxLength={1200} value={needs} onChange={event=>setNeeds(event.target.value)}/><label htmlFor="ah-journal-reflection">{t("Wat wil ik onthouden?","What would I like to remember?")}</label><textarea id="ah-journal-reflection" rows={4} maxLength={4000} value={reflection} onChange={event=>setReflection(event.target.value)}/><button className="gold" onClick={()=>void add()} disabled={saving||(!feeling.trim()&&!needs.trim()&&!reflection.trim())}><Plus/>{saving?t("Opslaan…","Saving…"):t("Reflectie opslaan","Save reflection")}</button></div>
 <div className="ah-journal-entries">{entries.map(entry=><article key={entry.id}><div><span>{new Intl.DateTimeFormat(language==="nl"?"nl-NL":"en-GB",{dateStyle:"medium",timeStyle:"short"}).format(new Date(entry.createdAt))}</span><button aria-label={t("Notitie verwijderen","Delete entry")} onClick={()=>void remove(entry.id)} disabled={saving}><Trash2/></button></div><h3>{entry.title||t("Reflectie","Reflection")}</h3>{entry.feeling&&<p><strong>{t("Gevoel","Feeling")}:</strong> {entry.feeling}</p>}{entry.needs&&<p><strong>{t("Behoefte","Need")}:</strong> {entry.needs}</p>}{entry.reflection&&<p>{entry.reflection}</p>}</article>)}{entries.length===0&&<p>{t("Je journal is nog leeg. Neem alle tijd die je nodig hebt.","Your journal is empty. Take all the time you need.")}</p>}</div>
 </>}
 <p className="ah-journal-privacy" role="status" aria-live="polite">{message||t("Privé voor dit profiel en op dit apparaat. Niet gesynchroniseerd of geüpload. Vergrendel je journal wanneer je klaar bent.","Private to this profile and on this device. Not synced or uploaded. Lock your journal when finished.")}</p>
 <button className="back" onClick={()=>{if(unlocked)lock();onBack();}}>← {t("Terug","Back")}</button></section></main>;
}
