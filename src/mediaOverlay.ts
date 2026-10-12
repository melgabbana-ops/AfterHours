export type OverlayFrameStyle = "clean" | "after-hours" | "cinematic";
export interface OverlayFrameDefinition {
  id: OverlayFrameStyle;
  titleNL: string;
  titleEN: string;
  descriptionNL: string;
  descriptionEN: string;
}
export const mediaOverlayFrames: readonly OverlayFrameDefinition[] = [
  {id:"clean",titleNL:"CLEAN",titleEN:"CLEAN",descriptionNL:"Subtiele goudkleurige hoeken en klein AH-watermerk.",descriptionEN:"Subtle gold corners and a small AH watermark."},
  {id:"after-hours",titleNL:"AFTER HOURS",titleEN:"AFTER HOURS",descriptionNL:"Dubbele sierlijn, maansikkel en merkregel.",descriptionEN:"Double ornamental border, crescent and brand line."},
  {id:"cinematic",titleNL:"CINEMATIC",titleEN:"CINEMATIC",descriptionNL:"Filmische boven- en onderbalk met gouden details.",descriptionEN:"Cinematic top and bottom bars with gold details."}
];

function trackedText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,spacing:number) {
  let cursor=x;
  for(const character of text) {
    ctx.fillText(character,cursor,y);
    cursor+=ctx.measureText(character).width+spacing;
  }
}
function moon(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number,color:string) {
  ctx.save();
  ctx.fillStyle=color;
  ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
  ctx.globalCompositeOperation="destination-out";
  ctx.beginPath();ctx.arc(x+radius*.42,y-radius*.27,radius*.86,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function goldCorner(ctx:CanvasRenderingContext2D,x:number,y:number,dx:number,dy:number,length:number) {
  ctx.beginPath();ctx.moveTo(x+dx*length,y);ctx.lineTo(x,y);ctx.lineTo(x,y+dy*length);ctx.stroke();
}
export function drawAfterHoursOverlay(ctx:CanvasRenderingContext2D,width:number,height:number,style:OverlayFrameStyle) {
  if(width<1||height<1)return;
  const short=Math.min(width,height);
  const pad=Math.max(12,short*.045);
  const gold="#D7A84F";
  const ivory="#F4EBDD";
  const fine=Math.max(1,short/700);
  ctx.save();
  ctx.textBaseline="alphabetic";
  if(style==="clean") {
    ctx.strokeStyle="rgba(215,168,79,.92)";ctx.lineWidth=fine*1.35;
    goldCorner(ctx,pad,pad,1,1,short*.1);goldCorner(ctx,width-pad,pad,-1,1,short*.1);
    goldCorner(ctx,pad,height-pad,1,-1,short*.1);goldCorner(ctx,width-pad,height-pad,-1,-1,short*.1);
    ctx.fillStyle="rgba(7,5,9,.55)";ctx.fillRect(pad,pad,short*.42,short*.095);
    ctx.fillStyle=gold;ctx.font=`500 ${Math.max(10,short*.021)}px Georgia,serif`;
    trackedText(ctx,"AFTER HOURS",pad*1.6,pad+short*.055,short*.003);
    ctx.fillStyle=ivory;ctx.font=`500 ${Math.max(8,short*.012)}px Arial,sans-serif`;
    trackedText(ctx,"18+  ·  YOUR RULES",width-pad-short*.22,height-pad*.38,short*.0015);
  } else if(style==="after-hours") {
    const border=pad*.48;
    ctx.strokeStyle="rgba(215,168,79,.94)";ctx.lineWidth=fine;
    ctx.strokeRect(pad,pad,width-2*pad,height-2*pad);
    ctx.strokeStyle="rgba(215,168,79,.48)";ctx.lineWidth=fine*.65;
    ctx.strokeRect(pad+border,pad+border,width-2*(pad+border),height-2*(pad+border));
    const band=short*.14;
    const top=ctx.createLinearGradient(0,0,0,band);
    top.addColorStop(0,"rgba(7,5,9,.88)");top.addColorStop(1,"rgba(7,5,9,0)");
    ctx.fillStyle=top;ctx.fillRect(0,0,width,band);
    const bottom=ctx.createLinearGradient(0,height-band,0,height);
    bottom.addColorStop(0,"rgba(7,5,9,0)");bottom.addColorStop(1,"rgba(7,5,9,.92)");
    ctx.fillStyle=bottom;ctx.fillRect(0,height-band,width,band);
    moon(ctx,pad+short*.045,pad+short*.04,short*.018,gold);
    ctx.fillStyle=gold;ctx.font=`500 ${Math.max(12,short*.026)}px Georgia,serif`;
    trackedText(ctx,"AFTER HOURS",pad+short*.08,pad+short*.047,short*.004);
    ctx.fillStyle=ivory;ctx.font=`500 ${Math.max(7,short*.0105)}px Arial,sans-serif`;
    trackedText(ctx,"YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.",pad+short*.025,height-pad-short*.025,short*.0018);
    ctx.strokeStyle=gold;ctx.lineWidth=fine;
    ctx.beginPath();ctx.moveTo(width-pad-short*.11,height-pad-short*.043);ctx.lineTo(width-pad,height-pad-short*.043);ctx.stroke();
  } else {
    const bar=short*.105;
    ctx.fillStyle="rgba(5,4,7,.94)";ctx.fillRect(0,0,width,bar);ctx.fillRect(0,height-bar,width,bar);
    ctx.strokeStyle="rgba(215,168,79,.9)";ctx.lineWidth=fine;
    ctx.beginPath();ctx.moveTo(pad,bar*.77);ctx.lineTo(width-pad,bar*.77);ctx.moveTo(pad,height-bar*.77);ctx.lineTo(width-pad,height-bar*.77);ctx.stroke();
    moon(ctx,pad+short*.028,bar*.43,short*.014,gold);
    ctx.fillStyle=gold;ctx.font=`500 ${Math.max(10,short*.022)}px Georgia,serif`;
    trackedText(ctx,"AFTER HOURS",pad+short*.055,bar*.53,short*.004);
    ctx.fillStyle=ivory;ctx.font=`500 ${Math.max(7,short*.011)}px Arial,sans-serif`;
    trackedText(ctx,"PRIVATE FRAME  ·  18+",width-pad-short*.18,bar*.53,short*.0015);
    ctx.fillStyle=gold;ctx.font=`500 ${Math.max(7,short*.012)}px Arial,sans-serif`;
    trackedText(ctx,"YOUR RULES  ·  YOUR LIMITS",pad+short*.028,height-bar*.37,short*.002);
    ctx.fillStyle="#B9A8BC";ctx.font=`500 ${Math.max(7,short*.01)}px Arial,sans-serif`;
    trackedText(ctx,"AH",width-pad-short*.045,height-bar*.37,short*.002);
  }
  ctx.restore();
}
export async function composeImageWithOverlay(file:File,style:OverlayFrameStyle):Promise<File> {
  if(!file.type.startsWith("image/"))return file;
  const objectUrl=URL.createObjectURL(file);
  try {
    const image=new Image();
    image.decoding="async";image.src=objectUrl;
    await image.decode();
    const originalWidth=image.naturalWidth||image.width;
    const originalHeight=image.naturalHeight||image.height;
    if(!originalWidth||!originalHeight)throw new Error("Could not read the selected image.");
    const scale=Math.min(1,2560/Math.max(originalWidth,originalHeight));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(originalWidth*scale));
    canvas.height=Math.max(1,Math.round(originalHeight*scale));
    const ctx=canvas.getContext("2d");
    if(!ctx)throw new Error("Image overlay is not supported in this browser.");
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    drawAfterHoursOverlay(ctx,canvas.width,canvas.height,style);
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Could not render image overlay.")),"image/jpeg",.92));
    const basename=file.name.replace(/\.[^.]+$/,"").replace(/[^a-zA-Z0-9_-]+/g,"-").slice(0,70)||"after-hours-photo";
    return new File([blob],basename+"-after-hours.jpg",{type:"image/jpeg",lastModified:Date.now()});
  } finally {URL.revokeObjectURL(objectUrl);}
}
export function drawCameraFrame(ctx:CanvasRenderingContext2D,video:HTMLVideoElement,width:number,height:number,style:OverlayFrameStyle) {
  if(video.videoWidth<1||video.videoHeight<1)return;
  const sourceRatio=video.videoWidth/video.videoHeight;
  const targetRatio=width/height;
  let sx=0,sy=0,sw=video.videoWidth,sh=video.videoHeight;
  if(sourceRatio>targetRatio){sw=video.videoHeight*targetRatio;sx=(video.videoWidth-sw)/2;}
  else {sh=video.videoWidth/targetRatio;sy=(video.videoHeight-sh)/2;}
  ctx.drawImage(video,sx,sy,sw,sh,0,0,width,height);
  drawAfterHoursOverlay(ctx,width,height,style);
}
