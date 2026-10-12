import React,{useCallback,useEffect,useRef,useState} from "react";
import { ArrowLeft, CircleStop, Link2, RefreshCw, ShieldCheck, Unplug, Vibrate } from "lucide-react";
import { supabase, supabaseConfigured } from "./services/supabase";

type Language="nl"|"en";
type Toy={id?:string;name?:string;nickname?:string;toyType?:string;connected?:boolean;battery?:number};
type QrResult={qrcodeUrl?:string;qrcode?:string};
type AuthResult={authToken:string;uid:string;platform:string};
interface LovenseSdk {
 on(event:string,callback:(payload:any)=>void):void;
 getQrcode():Promise<QrResult>;
 getAppStatus():boolean;
 getOnlineToys():Toy[];
 connectLovenseAPP():void|Promise<void>;
 sendToyCommand(command:{vibrate?:number;time?:number;toyId?:string}):unknown;
 stopToyAction(toyId?:string):unknown;
 destroy():void;
}
declare global { interface Window { LovenseBasicSdk?: (options:{uid:string;platform:string;authToken:string;appType:"connect";debug:boolean})=>LovenseSdk } }
const SDK_URL="https://api.lovense-api.com/basic-sdk/core.min.js";
let sdkLoading:Promise<void>|null=null;
function loadLovenseSdk():Promise<void>{
 if(window.LovenseBasicSdk)return Promise.resolve();
 if(sdkLoading)return sdkLoading;
 sdkLoading=new Promise((resolve,reject)=>{
  const existing=document.querySelector<HTMLScriptElement>('script[data-lovense-sdk="true"]');
  const script=existing??document.createElement("script");
  const cleanup=()=>{script.removeEventListener("load",onLoad);script.removeEventListener("error",onError)};
  const onLoad=()=>{cleanup();window.LovenseBasicSdk?resolve():reject(new Error("Lovense SDK loaded without its constructor."))};
  const onError=()=>{cleanup();sdkLoading=null;reject(new Error("Lovense SDK could not be loaded."))};
  script.addEventListener("load",onLoad,{once:true});
  script.addEventListener("error",onError,{once:true});
  if(!existing){script.src=SDK_URL;script.async=true;script.crossOrigin="anonymous";script.dataset.lovenseSdk="true";document.head.appendChild(script)}
  else if(window.LovenseBasicSdk){cleanup();resolve()}
 });
 return sdkLoading;
}
export default function LovenseControl({language="nl",isAuthenticated,onBack}:{language?:Language;isAuthenticated:boolean;onBack:()=>void}){
 const [consent,setConsent]=useState(false);
 const [controlsEnabled,setControlsEnabled]=useState(false);
 const [busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);
 const [connected,setConnected]=useState(false);
 const [toys,setToys]=useState<Toy[]>([]);
 const [selectedToy,setSelectedToy]=useState("all");
 const [strength,setStrength]=useState(2);
 const [qr,setQr]=useState("");
 const [message,setMessage]=useState("");
 const sdkRef=useRef<LovenseSdk|null>(null);
 const stopAll=useCallback(()=>{try{sdkRef.current?.stopToyAction()}catch{}},[]);
 const t=(nl:string,en:string)=>language==="nl"?nl:en;
 const refreshToys=useCallback(()=>{
  const sdk=sdkRef.current;if(!sdk)return;
  try{const current=sdk.getOnlineToys();setToys(Array.isArray(current)?current.filter(item=>item&&typeof item==="object"):[])}catch{setToys([])}
 },[]);
 const disconnect=useCallback(()=>{
  stopAll();try{sdkRef.current?.destroy()}catch{}
  sdkRef.current=null;setReady(false);setConnected(false);setControlsEnabled(false);setToys([]);setQr("");setBusy(false);
 },[stopAll]);
 useEffect(()=>()=>{stopAll();try{sdkRef.current?.destroy()}catch{}sdkRef.current=null},[stopAll]);
 const connect=async()=>{
  if(!isAuthenticated){setMessage(t("Log eerst in om Lovense veilig aan je account te koppelen.","Sign in first to securely link Lovense to your account."));return}
  if(!consent){setMessage(t("Bevestig eerst dat je vrijwillig wilt verbinden.","First confirm that you freely choose to connect."));return}
  if(!supabaseConfigured||!supabase){setMessage(t("Supabase is niet ingesteld. De verbinding is niet gestart.","Supabase is not configured. No connection was started."));return}
  setBusy(true);setMessage("");setQr("");
  try{
   await loadLovenseSdk();
   const {data,error}=await supabase.functions.invoke("lovense-auth-token",{body:{displayName:"AFTER HOURS member"}});
   if(error)throw new Error(error.message||"Could not prepare a Lovense connection.");
   const auth=data as AuthResult;
   if(!auth||typeof auth.authToken!=="string"||typeof auth.uid!=="string"||typeof auth.platform!=="string")throw new Error(t("De server is nog niet ingesteld voor Lovense.","The server is not configured for Lovense yet."));
   const SDK=window.LovenseBasicSdk;if(!SDK)throw new Error("Lovense SDK unavailable.");
   const sdk=SDK({uid:auth.uid,platform:auth.platform,authToken:auth.authToken,appType:"connect",debug:false});sdkRef.current=sdk;
   sdk.on("sdkError",(info)=>{setMessage(typeof info?.message==="string"?info.message:t("Lovense gaf een verbindingsfout.","Lovense reported a connection error."));setBusy(false)});
   sdk.on("appStatusChange",(status)=>{const on=status===true||status?.status===true;setConnected(on);if(on){setMessage(t("Lovense is verbonden. Controleer welk apparaat geselecteerd is.","Lovense is connected. Check which device is selected."));refreshToys();setBusy(false)}});
   sdk.on("ready",async()=>{
    setReady(true);setBusy(false);
    try{const qrData=await sdk.getQrcode();if(qrData?.qrcodeUrl)setQr(qrData.qrcodeUrl)}catch{setMessage(t("De SDK is klaar. Gebruik Open Lovense Connect als de QR-code niet verschijnt.","The SDK is ready. Use Open Lovense Connect if the QR code does not appear."))}
    setConnected(Boolean(sdk.getAppStatus()));refreshToys();
   });
  }catch(error){setBusy(false);setMessage(error instanceof Error?error.message:t("Lovense kon niet worden gestart.","Lovense could not be started."))}
 };
 const testPulse=()=>{
  if(!sdkRef.current||!ready||!connected||!controlsEnabled)return;
  try{sdkRef.current.sendToyCommand({vibrate:Math.max(1,Math.min(5,strength)),time:5,...(selectedToy!=="all"?{toyId:selectedToy}:{})});setMessage(t("Korte testpuls gestart. Gebruik STOP NOW op ieder moment.","Short test pulse started. Use STOP NOW at any time."))}
  catch{setMessage(t("De opdracht kon niet worden verstuurd.","The command could not be sent."))}
 };
 const openConnectApp=()=>{if(!sdkRef.current||!ready)return;try{void sdkRef.current.connectLovenseAPP()}catch{setMessage(t("Lovense Connect kon niet worden geopend. Gebruik de QR-code.","Lovense Connect could not be opened. Use the QR code."))}};
 return <main className="lovense-screen">
  <header className="lovense-heading"><button className="back" type="button" onClick={()=>{disconnect();onBack()}}><ArrowLeft size={16}/>{t("Terug","Back")}</button><span className="eyebrow">AFTER HOURS · CONNECT</span><h1>Lovense <em>Connect</em></h1><p>{t("Een optionele koppeling voor compatibele apparaten. Jij bepaalt wanneer er iets gebeurt.","An optional connection for compatible devices. You decide when anything happens.")}</p></header>
  <div className="lovense-private-note"><ShieldCheck size={18}/><div><strong>{t("Jij houdt altijd de regie","You stay in control")}</strong><span>{t("Geen automatische opdrachten. De eerste test duurt maximaal 5 seconden. PAUSE, OVERWHELMED en STOP hebben altijd voorrang.","No automatic commands. The first test lasts at most 5 seconds. PAUSE, OVERWHELMED and STOP always take priority.")}</span></div></div>
  {!isAuthenticated&&<div className="lovense-alert" role="status">{t("Log in om een beveiligde verbinding te starten.","Sign in to start a secure connection.")}</div>}
  <section className="lovense-connect-card"><span className="eyebrow">{t("STAP 01 · VERBINDEN","STEP 01 · CONNECT")}</span><h2>{t("Koppel via Lovense Connect","Pair with Lovense Connect")}</h2><p>{t("Open de Lovense-app, koppel jouw apparaat daarin en bevestig de verbinding. De browser gebruikt alleen de officiële Lovense SDK; je hoeft geen Bluetooth-permissie aan AFTER HOURS te geven.","Open the Lovense app, pair your device there, and confirm the connection. The browser uses the official Lovense SDK; you do not need to grant AFTER HOURS Bluetooth permission.")}</p>
   <label className="lovense-consent"><input type="checkbox" checked={consent} disabled={busy||ready} onChange={e=>setConsent(e.target.checked)}/><span>{t("Ik wil vrijwillig verbinden en begrijp dat ik alleen handmatige korte testopdrachten activeer. Ik kan direct stoppen of ontkoppelen.","I freely choose to connect and understand that only short manual test commands are enabled. I can stop or disconnect immediately.")}</span></label>
   {!ready?<button className="lovense-primary" type="button" onClick={()=>void connect()} disabled={!isAuthenticated||!consent||busy}>{busy?t("Verbinden…","Connecting…"):t("Verbind Lovense","Connect Lovense")}</button>:<div className="lovense-connection-state"><span className={connected?"connection-dot online":"connection-dot"}/><strong>{connected?t("App verbonden","App connected"):t("Wachten op Lovense-app","Waiting for Lovense app")}</strong><button type="button" onClick={openConnectApp}><Link2 size={15}/>{t("Open Lovense Connect","Open Lovense Connect")}</button></div>}
   {qr&&<div className="lovense-qr"><img src={qr} alt={t("QR-code om Lovense te koppelen","QR code to pair Lovense")}/><p>{t("Scan met Lovense Remote/Connect. Deel deze QR-code niet met anderen.","Scan with Lovense Remote/Connect. Do not share this QR code.")}</p></div>}
  </section>
  <section className="lovense-control-card"><span className="eyebrow">{t("STAP 02 · HANDMATIGE CONTROLE","STEP 02 · MANUAL CONTROL")}</span><h2><Vibrate size={18}/> {t("Test de verbinding","Test the connection")}</h2><p>{t("De eerste versie ondersteunt alleen een handmatig gestarte korte test. Er is geen automatische koppeling aan opdrachten, camera of beloningen.","The first version supports only a manually started short test. There is no automatic link to prompts, camera or rewards.")}</p>
   <label className="lovense-consent"><input type="checkbox" checked={controlsEnabled} disabled={!connected||!ready} onChange={e=>{if(!e.target.checked)stopAll();setControlsEnabled(e.target.checked)}}/><span>{t("Ik activeer de handmatige bediening voor deze sessie.","I enable manual controls for this session.")}</span></label>
   <label className="lovense-slider">{t("Testintensiteit","Test strength")} <strong>{strength}/5</strong><input aria-label={t("Testintensiteit","Test strength")} type="range" min={1} max={5} step={1} value={strength} onChange={e=>setStrength(Number(e.target.value))}/></label>
   {toys.length>0&&<label className="lovense-toy-select">{t("Apparaat","Toy")}<select value={selectedToy} onChange={e=>setSelectedToy(e.target.value)}><option value="all">{t("Alle verbonden apparaten","All connected devices")}</option>{toys.map((toy,index)=><option key={toy.id??index} value={toy.id??"all"}>{toy.nickname||toy.name||toy.toyType||t("Lovense-apparaat","Lovense device")}{toy.battery!==undefined?" · "+toy.battery+"%":""}</option>)}</select></label>}
   <div className="lovense-action-row"><button type="button" onClick={testPulse} disabled={!ready||!connected||!controlsEnabled}><Vibrate size={16}/>{t("Test 5 seconden","Test for 5 seconds")}</button><button type="button" className="lovense-stop" onClick={stopAll}><CircleStop size={17}/>{t("STOP NOW","STOP NOW")}</button></div>
   <button type="button" className="lovense-secondary" onClick={refreshToys} disabled={!ready}><RefreshCw size={14}/>{t("Apparaten vernieuwen","Refresh devices")}</button>
  </section>
  {message&&<p className="lovense-status-message" role="status">{message}</p>}
  <button type="button" className="lovense-disconnect" onClick={()=>{disconnect();setConsent(false);setMessage(t("Verbonden sessie beëindigd.","Connection ended."))}} disabled={!ready}><Unplug size={16}/>{t("Ontkoppelen en stoppen","Disconnect and stop")}</button>
  <p className="lovense-footer">{t("Compatibiliteit en koppeling vereisen een goedgekeurde Lovense Developer-configuratie en de bijbehorende Lovense-app. Dit scherm verstuurt geen opdrachten voordat je ze zelf start.","Compatibility and pairing require an approved Lovense Developer configuration and the Lovense app. This screen sends no commands until you start them yourself.")}</p>
 </main>;
}
