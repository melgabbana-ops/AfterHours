let audioContext:AudioContext|null=null;
type AudioWindow=Window&{webkitAudioContext?:typeof AudioContext};
const getContext=():AudioContext|null=>{
 if(typeof window==="undefined")return null;
 if(audioContext&&audioContext.state!=="closed")return audioContext;
 const AudioContextConstructor=window.AudioContext??(window as AudioWindow).webkitAudioContext;
 if(!AudioContextConstructor)return null;
 try{audioContext=new AudioContextConstructor();return audioContext;}catch{return null;}
};
let gestureBound=false;
/** Call from a real user gesture so iOS Safari can unlock Web Audio for this app session. */
export function primeNotificationAudio(){
 const c=getContext();if(!c)return;
 if(c.state==="suspended")void c.resume().catch(()=>undefined);
}
function bindGestureUnlock(){
 if(typeof window==="undefined"||gestureBound)return;
 gestureBound=true;
 const unlock=()=>{primeNotificationAudio();};
 window.addEventListener("pointerdown",unlock,{passive:true});
 window.addEventListener("keydown",unlock);
}
bindGestureUnlock();
function voice(frequency:number,start:number,duration:number,peak:number,wave:OscillatorType="sine",endFrequency=frequency){
 const c=getContext();if(!c)return;
 const osc=c.createOscillator(),gain=c.createGain(),filter=c.createBiquadFilter();
 osc.type=wave;osc.frequency.setValueAtTime(frequency,c.currentTime+start);
 if(endFrequency!==frequency)osc.frequency.exponentialRampToValueAtTime(endFrequency,c.currentTime+start+duration);
 filter.type="lowpass";filter.frequency.setValueAtTime(2400,c.currentTime+start);
 gain.gain.setValueAtTime(0,c.currentTime+start);
 gain.gain.linearRampToValueAtTime(peak,c.currentTime+start+0.018);
 gain.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+start+duration);
 osc.connect(filter).connect(gain).connect(c.destination);
 osc.start(c.currentTime+start);osc.stop(c.currentTime+start+duration+0.03);
}
function playSignature(kind:"message"|"checkin"|"safety"){
 // Original three-note "Velvet Gate" motif, synthesized locally. No downloaded or borrowed app sound.
 if(kind==="safety"){
  voice(220,0,0.24,0.045,"triangle",196);
  voice(164.81,0.19,0.34,0.04,"triangle",146.83);
  voice(110,0.34,0.42,0.028,"sine",98);
  return;
 }
 if(kind==="checkin"){
  voice(392,0,0.2,0.026,"sine",392);
  voice(587.33,0.13,0.24,0.03,"sine",523.25);
  voice(783.99,0.28,0.38,0.022,"sine",659.25);
  return;
 }
 voice(329.63,0,0.2,0.024,"sine",349.23);
 voice(493.88,0.13,0.24,0.028,"sine",523.25);
 voice(659.25,0.29,0.42,0.018,"sine",587.33);
}
export async function playNotificationSound(kind:"message"|"checkin"|"safety"="message"){
 const c=getContext();if(!c)return;
 try{if(c.state==="suspended")await c.resume();}catch{return;}
 if(c.state!=="running")return;
 playSignature(kind);
}
export function notificationAudioAvailable(){return typeof window!=="undefined"&&("AudioContext"in window||"webkitAudioContext"in(window as AudioWindow));}
