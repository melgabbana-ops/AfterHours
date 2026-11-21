import React,{useCallback,useEffect,useRef,useState}from"react";
import{BookHeart,LockKeyhole,Plus,Trash2,Unlock}from"lucide-react";
import{AFTERCARE_JOURNAL_LEGACY_STORAGE_KEY,getAftercareJournalStorageKey}from"./aftercareJournalStorage";
import{AftercareJournalError,getAftercareJournalErrorMessage,getAftercareJournalFailure}from"./aftercareJournalErrors";
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
function readJournalStorage(key:string):string|null{
 try{return localStorage.getItem(key);}catch{throw new AftercareJournalError("storage");}
}
function writeJournalStorage(key:string,value:string):void{
 try{localStorage.setItem(key,value);if(localStorage.getItem(key)!==value)throw new Error("storage verification failed");}
 catch(error){if(error instanceof AftercareJournalError)throw error;throw new AftercareJournalError("storage");}
}
async function encryptEntries(entries:Entry[],passphrase:string){
 const salt=crypto.getRandomValues(new Uint8Array(16));const iv=crypto.getRandomValues(new Uint8Array(12));const key=await deriveKey(passphrase,salt);
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv:toArrayBuffer(iv)},key,toArrayBuffer(encoder.encode(JSON.stringify(entries))));
 return JSON.stringify({version:1,salt:bytesToBase64(salt),iv:bytesToBase64(iv),cipher:bytesToBase64(new Uint8Array(cipher))});
}
async function decryptEntries(raw:string,passphrase:string):Promise<Entry[]>{
  if(!globalThis.crypto?.subtle)throw new AftercareJournalError("cryptoUnavailable");
  let envelope:unknown;
  try{envelope=JSON.parse(raw);}catch{throw new AftercareJournalError("invalidEnvelope");}
  if(!envelope||typeof envelope!=="object")throw new AftercareJournalError("invalidEnvelope");
  const candidate=envelope as Record<string,unknown>;
  if(typeof candidate.version!=="number")throw new AftercareJournalError("invalidEnvelope");
  if(candidate.version!==1)throw new AftercareJournalError("unsupportedVersion");
  if(typeof candidate.salt!=="string"||typeof candidate.iv!=="string"||typeof candidate.cipher!=="string")throw new AftercareJournalError("invalidEnvelope");
  let salt:Uint8Array,iv:Uint8Array,cipher:Uint8Array;
  try{salt=base64ToBytes(candidate.salt);iv=base64ToBytes(candidate.iv);cipher=base64ToBytes(candidate.cipher);}catch{throw new AftercareJournalError("invalidEnvelope");}
  if(salt.length!==16||iv.length!==12||cipher.length<16)throw new AftercareJournalError("invalidEnvelope");
  let key:CryptoKey;
  try{key=await deriveKey(passphrase,salt);}catch{throw new AftercareJournalError("cryptoUnavailable");}
  let plain:ArrayBuffer;
  try{plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:toArrayBuffer(iv)},key,toArrayBuffer(cipher));}
  catch{throw new AftercareJournalError("authentication");}
  let parsed:unknown;
  try{parsed=JSON.parse(decoder.decode(plain));}catch{throw new AftercareJournalError("invalidPayload");}
  const validEntry=(item:unknown):item is Entry=>Boolean(item&&typeof item==="object"&&typeof (item as Entry).id==="string"&&typeof (item as Entry).createdAt==="string"&&typeof (item as Entry).title==="string"&&typeof (item as Entry).feeling==="string"&&typeof (item as Entry).needs==="string"&&typeof (item as Entry).reflection==="string");
  if(!Array.isArray(parsed)||!parsed.every(validEntry))throw new AftercareJournalError("invalidPayload");
  return parsed;
}

type Props={profileId:string;language:"nl"|"en";onBack:()=>void};
export default function AftercareJournal({profileId,language,onBack}:Props){
 const storageKey=getAftercareJournalStorageKey(profileId);
 const[pass,setPass]=useState("");const[unlocked,setUnlocked]=useState(false);const[hasVault,setHasVault]=useState(false);const[hasLegacyVault,setHasLegacyVault]=useState(false);const[storageReady,setStorageReady]=useState(false);const[entries,setEntries]=useState<Entry[]>([]);
 const[title,setTitle]=useState("");const[feeling,setFeeling]=useState("");const[needs,setNeeds]=useState("");const[reflection,setReflection]=useState("");const[message,setMessage]=useState("");const[saving,setSaving]=useState(false);const[unlocking,setUnlocking]=useState(false);const lockGeneration=useRef(0);
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const lock=useCallback(()=>{
  lockGeneration.current+=1;
  setUnlocked(false);setPass("");setEntries([]);setTitle("");setFeeling("");setNeeds("");setReflection("");
  setSaving(false);setUnlocking(false);
  setMessage(language==="nl"?"Journal automatisch vergrendeld toen de app naar de achtergrond ging. Niet-opgeslagen tekst is gewist. Open het opnieuw met je wachtzin.":"Journal automatically locked when the app went into the background. Unsaved text was cleared. Unlock it again with your passphrase.");
 },[language]);
 useEffect(()=>{
  const lockWhenHidden=()=>{if(document.visibilityState!=="visible")lock();};
  const lockOnPageHide=()=>lock();
  document.addEventListener("visibilitychange",lockWhenHidden);
  window.addEventListener("pagehide",lockOnPageHide);
  lockWhenHidden();
  return()=>{
   document.removeEventListener("visibilitychange",lockWhenHidden);
   window.removeEventListener("pagehide",lockOnPageHide);
  };
 },[lock]);
 useEffect(()=>{
  setStorageReady(false);
  if(!storageKey){setHasVault(false);setHasLegacyVault(false);setMessage(t("Er is geen geldig profiel gevonden. Open je profiel opnieuw en probeer het nog eens.","No valid profile was found. Reopen your profile and try again."));setStorageReady(true);return;}
  try{
   setHasVault(Boolean(readJournalStorage(storageKey)));
   setHasLegacyVault(Boolean(readJournalStorage(AFTERCARE_JOURNAL_LEGACY_STORAGE_KEY)));
  }catch(error){
   setHasVault(false);setHasLegacyVault(false);setMessage(getAftercareJournalErrorMessage(getAftercareJournalFailure(error,"storage"),language));
  }finally{setStorageReady(true);}
 },[storageKey,language]);
 const unlock=async()=>{
  if(!storageKey){setMessage(t("Er is geen geldig profiel gevonden. Je journal is niet geopend.","No valid profile was found. Your journal was not opened."));return;}
  if(pass.length<8){setMessage(t("Gebruik minimaal 8 tekens voor je wachtzin.","Use at least 8 characters for your passphrase."));return;}
  if(unlocking)return;
  const generation=lockGeneration.current;
  setUnlocking(true);
  try{
   const raw=readJournalStorage(storageKey);
   let loaded:Entry[];
   if(raw!==null)loaded=await decryptEntries(raw,pass);
   else{
    const encrypted=await encryptEntries([],pass);
    if(generation!==lockGeneration.current||document.visibilityState!=="visible")return;
    writeJournalStorage(storageKey,encrypted);
    loaded=[];
   }
   if(generation!==lockGeneration.current||document.visibilityState!=="visible")return;
   setEntries(loaded);
   setUnlocked(true);setHasVault(true);setMessage(t("Je profielgebonden journal is lokaal en versleuteld geopend.","Your profile-specific journal is open and encrypted on this device."));
  }catch(error){
   if(generation===lockGeneration.current)setMessage(getAftercareJournalErrorMessage(getAftercareJournalFailure(error),language));
  }finally{
   if(generation===lockGeneration.current)setUnlocking(false);
  }
 };
 const persist=async(next:Entry[]):Promise<boolean>=>{
  if(!storageKey||saving)return false;
  const generation=lockGeneration.current;
  setSaving(true);
  try{
   const encrypted=await encryptEntries(next,pass);
   if(generation!==lockGeneration.current||document.visibilityState!=="visible")return false;
   writeJournalStorage(storageKey,encrypted);
   if(generation!==lockGeneration.current||document.visibilityState!=="visible")return false;
   setEntries(next);setMessage(t("Versleuteld opgeslagen voor dit profiel op dit apparaat.","Encrypted and saved for this profile on this device."));
   return true;
  }catch(error){
   if(generation===lockGeneration.current)setMessage(getAftercareJournalErrorMessage(getAftercareJournalFailure(error),language));
   return false;
  }finally{
   if(generation===lockGeneration.current)setSaving(false);
  }
 };
 const add=async()=>{
  if(saving||(!reflection.trim()&&!feeling.trim()&&!needs.trim()))return;
  const entry:Entry={id:crypto.randomUUID(),createdAt:new Date().toISOString(),title:title.trim().slice(0,80),feeling:feeling.trim().slice(0,1200),needs:needs.trim().slice(0,1200),reflection:reflection.trim().slice(0,4000)};
  if(await persist([entry,...entries])){setTitle("");setFeeling("");setNeeds("");setReflection("");}
 };
 const remove=async(id:string)=>{if(saving)return;await persist(entries.filter(entry=>entry.id!==id));};

 return <main className="ah-journal-screen ah-editorial-screen"><section className="ah-journal-card"><span className="eyebrow">AFTER HOURS · PRIVATE JOURNAL</span><div className="ah-journal-title"><BookHeart/><div><h2>{t("Aftercare Journal","Aftercare Journal")}</h2><p>{t("Een rustige plek om stil te staan bij wat je voelt en nodig hebt.","A quiet place to reflect on what you feel and need.")}</p></div></div>
 {!unlocked?<div className="ah-journal-lock"><LockKeyhole/><h3>{t(hasVault?"Open je journal":"Maak je privéjournal aan",hasVault?"Unlock your journal":"Create your private journal")}</h3><p>{t("Je wachtzin versleutelt je notities met AES-GCM op dit apparaat. We kunnen deze niet herstellen als je hem vergeet.","Your passphrase encrypts notes with AES-GCM on this device. It cannot be recovered if forgotten.")}</p>{hasLegacyVault&&!hasVault&&<p className="ah-journal-legacy-notice" role="status">{t("Er is een eerder journal zonder profielkoppeling gevonden. Het wordt niet automatisch geopend of verplaatst, zodat privénotities niet tussen profielen worden gedeeld. De oude versleutelde gegevens blijven onaangeroerd.","An older journal without a profile link was found. It is not opened or moved automatically, so private notes are not shared between profiles. The old encrypted data remains untouched.")}</p>}<label htmlFor="ah-journal-pass">{t("Privé-wachtzin","Private passphrase")}</label><input id="ah-journal-pass" type="password" autoComplete={hasVault?"current-password":"new-password"} minLength={8} value={pass} onChange={event=>setPass(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void unlock();}}/><button className="gold" onClick={()=>void unlock()} disabled={!storageReady||!storageKey||pass.length<8||unlocking}><Unlock/>{unlocking?t("Controleren…","Checking…"):t("Journal openen","Unlock journal")}</button></div>:<>
 <div className="ah-journal-toolbar"><span>{entries.length} {t("notities","entries")}</span><button type="button" onClick={lock} disabled={saving}><LockKeyhole/>{t("Vergrendelen","Lock")}</button></div>
 <div className="ah-journal-form"><h3>{t("Nieuwe reflectie","New reflection")}</h3><label htmlFor="ah-journal-entry-title">{t("Titel (optioneel)","Title (optional)")}</label><input id="ah-journal-entry-title" maxLength={80} value={title} onChange={event=>setTitle(event.target.value)}/><label htmlFor="ah-journal-feeling">{t("Hoe voel ik me nu?","How do I feel right now?")}</label><textarea id="ah-journal-feeling" rows={2} maxLength={1200} value={feeling} onChange={event=>setFeeling(event.target.value)}/><label htmlFor="ah-journal-needs">{t("Wat heb ik nu nodig?","What do I need right now?")}</label><textarea id="ah-journal-needs" rows={2} maxLength={1200} value={needs} onChange={event=>setNeeds(event.target.value)}/><label htmlFor="ah-journal-reflection">{t("Wat wil ik onthouden?","What would I like to remember?")}</label><textarea id="ah-journal-reflection" rows={4} maxLength={4000} value={reflection} onChange={event=>setReflection(event.target.value)}/><button className="gold" onClick={()=>void add()} disabled={saving||(!feeling.trim()&&!needs.trim()&&!reflection.trim())}><Plus/>{saving?t("Opslaan…","Saving…"):t("Reflectie opslaan","Save reflection")}</button></div>
 <div className="ah-journal-entries">{entries.map(entry=><article key={entry.id}><div><span>{new Intl.DateTimeFormat(language==="nl"?"nl-NL":"en-GB",{dateStyle:"medium",timeStyle:"short"}).format(new Date(entry.createdAt))}</span><button aria-label={t("Notitie verwijderen","Delete entry")} onClick={()=>void remove(entry.id)} disabled={saving}><Trash2/></button></div><h3>{entry.title||t("Reflectie","Reflection")}</h3>{entry.feeling&&<p><strong>{t("Gevoel","Feeling")}:</strong> {entry.feeling}</p>}{entry.needs&&<p><strong>{t("Behoefte","Need")}:</strong> {entry.needs}</p>}{entry.reflection&&<p>{entry.reflection}</p>}</article>)}{entries.length===0&&<p>{t("Je journal is nog leeg. Neem alle tijd die je nodig hebt.","Your journal is empty. Take all the time you need.")}</p>}</div>
 </>}
 <p className="ah-journal-privacy" role="status" aria-live="polite">{message||t("Privé voor dit profiel en op dit apparaat. Niet gesynchroniseerd of geüpload. Vergrendel je journal wanneer je klaar bent.","Private to this profile and on this device. Not synced or uploaded. Lock your journal when finished.")}</p>
 <button className="back" onClick={()=>{if(unlocked)lock();onBack();}}>← {t("Terug","Back")}</button></section></main>;
}
