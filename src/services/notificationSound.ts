let audioContext:AudioContext|null=null;
const context=()=>audioContext??=new AudioContext();
function tone(f:number,d:number,s:number,type:OscillatorType="sine",g=0.035){
 const c=context(),o=c.createOscillator(),a=c.createGain(),t=c.currentTime+s;
 o.type=type;o.frequency.setValueAtTime(f,t);a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(g,t+0.012);a.gain.exponentialRampToValueAtTime(0.001,t+d);o.connect(a).connect(c.destination);o.start(t);o.stop(t+d+0.02);
}
export async function playNotificationSound(kind:"message"|"checkin"|"safety"="message"){
 const c=context();if(c.state==="suspended")await c.resume();
 if(kind==="safety"){tone(196,0.18,0,"triangle",0.045);tone(146.83,0.28,0.16,"triangle",0.04);return;}
 if(kind==="checkin"){tone(392,0.12,0,"sine",0.03);tone(523.25,0.22,0.11,"sine",0.035);return;}
 tone(329.63,0.12,0,"sine",0.028);tone(493.88,0.18,0.1,"sine",0.032);
}
export function notificationAudioAvailable(){return typeof window!=="undefined"&&("AudioContext" in window||"webkitAudioContext" in window);}
