import React,{useEffect,useState}from"react";
import{BookHeart,LockKeyhole,Plus,Trash2,Unlock}from"lucide-react";
import"./AftercareJournal.css";

type Entry={id:string;createdAt:string;title:string;feeling:string;needs:string;reflection:string};
const STORAGE_KEY="afterhours.aftercare-journal.v1";
const encoder=new TextEncoder();
const decoder=new TextDecoder();
async function deriveKey(passphrase:string,salt:Uint8Array){
 const material=await crypto.subtle.importKey("raw",encoder.encode(passphrase),"PBKDF2",false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:210000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
function bytesToBase64(bytes:Uint8Array){let binary="";bytes.forEach(value=>binary+=String.fromCharCode(value));return btoa(binary);}
function base64ToBytes(value:string){return Uint8Array.from(atob(value),char=>char.charCodeAt(0));}
async function encryptEntries(entries:Entry[],passphrase:string){
 const salt=crypto.getRandomValues(new Uint8Array(16));const iv=crypto.getRandomValues(new Uint8Array(12));const key=await deriveKey(passphrase,salt);
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,encoder.encode(JSON.stringify(entries)));
 return JSON.stringify({version:1,salt:bytesToBase64(salt),iv:bytesToBase64(iv),cipher:bytesToBase64(new Uint8Array(cipher))});
}
async function decryptEntries(raw:string,passphrase:string):Promise<Entry[]>{
 const envelope=JSON.parse(raw) as {version:number;salt:string;iv:string;cipher:string};
 if(envelope.version!==1)throw new Error("unsupported");
 const key=await deriveKey(passphrase,base64ToBytes(envelope.salt));
 const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:base64ToBytes(envelope.iv)},key,base64ToBytes(envelope.cipher));
 const parsed:unknown=JSON.parse(decoder.decode(plain));
 if(!Array.isArray(parsed)||!parsed.every(item=>item&&typeof item.id==="string"&&typeof item.reflection==="string"))throw new Error("invalid");
 return parsed as Entry[];
}
type Props={language:"nl"|"en";onBack:()=>void};
export default function AftercareJournal({language,onBack}:Props){
 const[pass,setPass]=useState("");const[unlocked,setUnlocked]=useState(false);const[hasVault,setHasVault]=useState(false);const[entries,setEntries]=useState<Entry[]>([]);
 const[title,setTitle]=useState("");const[feeling,setFeeling]=useState("");const[needs,setNeeds]=useState("");const[reflection,setReflection]=useState("");const[message,setMessage]=useState("");
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 useEffect(()=>{try{setHasVault(Boolean(localStorage.getItem(STORAGE_KEY)))}catch{setMessage(t("Opslag is niet beschikbaar op dit apparaat.","Storage is unavailable on this device."));}},[]);
 const unlock=async()=>{if(pass.length<8){setMessage(t("Gebruik minimaal 8 tekens voor je wachtzin.","Use at least 8 characters for your passphrase."));return;}
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const loaded=await decryptEntries(raw,pass);setEntries(loaded);}else{localStorage.setItem(STORAGE_KEY,await encryptEntries([],pass));}
   setUnlocked(true);setHasVault(true);setMessage(t("Je journal is lokaal en versleuteld geopend.","Your journal is open, encrypted on this device."));
  }catch{setMessage(t("Niet geopend. Controleer je wachtzin of browseropslag.","Could not unlock. Check your passphrase or browser storage."));}
 };
 const persist=async(next:Entry[])=>{try{localStorage.setItem(STORAGE_KEY,await encryptEntries(next,pass));setEntries(next);setMessage(t("Versleuteld opgeslagen op dit apparaat.","Encrypted and saved on this device."));}catch{setMessage(t("Opslaan is niet gelukt. Je wijzigingen zijn niet bevestigd.","Save failed. Your changes were not confirmed."));}};
 const add=()=>{if(!reflection.trim()&&!feeling.trim()&&!needs.trim())return;const entry:Entry={id:crypto.randomUUID(),createdAt:new Date().toISOString(),title:title.trim().slice(0,80),feeling:feeling.trim().slice(0,1200),needs:needs.trim().slice(0,1200),reflection:reflection.trim().slice(0,4000)};void persist([entry,...entries]);setTitle("");setFeeling("");setNeeds("");setReflection("");};
 const remove=(id:string)=>void persist(entries.filter(entry=>entry.id!==id));
 const lock=()=>{setUnlocked(false);setPass("");setEntries([]);setTitle("");setFeeling("");setNeeds("");setReflection("");};
 return <main className="ah-journal-screen ah-editorial-screen"><section className="ah-journal-card"><span className="eyebrow">AFTER HOURS · PRIVATE JOURNAL</span><div className="ah-journal-title"><BookHeart/><div><h2>{t("Aftercare Journal","Aftercare Journal")}</h2><p>{t("Een rustige plek om stil te staan bij wat je voelt en nodig hebt.","A quiet place to reflect on what you feel and need.")}</p></div></div>
 {!unlocked?<div className="ah-journal-lock"><LockKeyhole/><h3>{t(hasVault?"Open je journal":"Maak je privéjournal aan",hasVault?"Unlock your journal":"Create your private journal")}</h3><p>{t("Je wachtzin versleutelt je notities met AES-GCM op dit apparaat. We kunnen deze niet herstellen als je hem vergeet.","Your passphrase encrypts notes with AES-GCM on this device. It cannot be recovered if forgotten.")}</p><label htmlFor="ah-journal-pass">{t("Privé-wachtzin","Private passphrase")}</label><input id="ah-journal-pass" type="password" autoComplete="current-password" minLength={8} value={pass} onChange={event=>setPass(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void unlock();}}/><button className="gold" onClick={()=>void unlock()}><Unlock/>{t("Journal openen","Unlock journal")}</button></div>:<>
 <div className="ah-journal-toolbar"><span>{entries.length} {t("notities","entries")}</span><button type="button" onClick={lock}><LockKeyhole/>{t("Vergrendelen","Lock")}</button></div>
 <div className="ah-journal-form"><h3>{t("Nieuwe reflectie","New reflection")}</h3><label>{t("Titel (optioneel)","Title (optional)")}</label><input maxLength={80} value={title} onChange={event=>setTitle(event.target.value)}/><label>{t("Hoe voel ik me nu?","How do I feel right now?")}</label><textarea rows={2} maxLength={1200} value={feeling} onChange={event=>setFeeling(event.target.value)}/><label>{t("Wat heb ik nu nodig?","What do I need right now?")}</label><textarea rows={2} maxLength={1200} value={needs} onChange={event=>setNeeds(event.target.value)}/><label>{t("Wat wil ik onthouden?","What would I like to remember?")}</label><textarea rows={4} maxLength={4000} value={reflection} onChange={event=>setReflection(event.target.value)}/><button className="gold" onClick={add} disabled={!feeling.trim()&&!needs.trim()&&!reflection.trim()}><Plus/>{t("Reflectie opslaan","Save reflection")}</button></div>
 <div className="ah-journal-entries">{entries.map(entry=><article key={entry.id}><div><span>{new Intl.DateTimeFormat(language==="nl"?"nl-NL":"en-GB",{dateStyle:"medium",timeStyle:"short"}).format(new Date(entry.createdAt))}</span><button aria-label={t("Notitie verwijderen","Delete entry")} onClick={()=>remove(entry.id)}><Trash2/></button></div><h3>{entry.title||t("Reflectie","Reflection")}</h3>{entry.feeling&&<p><strong>{t("Gevoel","Feeling")}:</strong> {entry.feeling}</p>}{entry.needs&&<p><strong>{t("Behoefte","Need")}:</strong> {entry.needs}</p>}{entry.reflection&&<p>{entry.reflection}</p>}</article>)}{entries.length===0&&<p>{t("Je journal is nog leeg. Neem alle tijd die je nodig hebt.","Your journal is empty. Take all the time you need.")}</p>}</div>
 </>}
 <p className="ah-journal-privacy" role="status">{message||t("Privé op dit apparaat. Niet gesynchroniseerd of geüpload. Vergrendel je journal wanneer je klaar bent.","Private on this device. Not synced or uploaded. Lock your journal when finished.")}</p>
 <button className="back" onClick={()=>{if(unlocked)lock();onBack();}}>← {t("Terug","Back")}</button></section></main>;
}
