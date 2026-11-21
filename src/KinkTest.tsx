import React, { useMemo, useState } from "react";\nimport "./kink-test.css";
import { ArrowLeft, ArrowRight, Award, Check, ChevronRight, Eye, Lock, RotateCcw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import {
  calculateKinkProfile, kinkCategories, kinkQuestions, loadKinkProfileResult,
  saveKinkProfileResult, clearKinkProfileResult, type KinkAnswer, type KinkProfileResult,
} from "./kinkTest";
import { recordAchievement } from "./achievements";

type RewardResult = { xpEarned: number; alreadyAwarded: boolean; totalXp?: number | null; source?: "account" | "device" };
type Props = { profileId: string; language: "nl" | "en"; onBack: () => void; onReward: () => Promise<RewardResult> };

const answerOptions: { id: KinkAnswer; nl: string; en: string; score: number }[] = [
  { id:"limit",nl:"Harde grens",en:"Hard limit",score:0 },
  { id:"no",nl:"Niet voor mij",en:"Not for me",score:0 },
  { id:"unsure",nl:"Weet ik nog niet",en:"Not sure yet",score:1 },
  { id:"curious",nl:"Nieuwsgierig",en:"Curious",score:2 },
  { id:"interested",nl:"Spreekt me aan",en:"Interested",score:3 },
  { id:"yes",nl:"Heel interessant",en:"Very interested",score:4 },
];
const archetypeCopy: Record<string,{nl:string;en:string}> = {
  power:{nl:"The Intentional Lead",en:"The Intentional Lead"},
  service:{nl:"The Devoted Heart",en:"The Devoted Heart"},
  sensation:{nl:"The Sensory Seeker",en:"The Sensory Seeker"},
  restraint:{nl:"The Ritual Architect",en:"The Ritual Architect"},
  roleplay:{nl:"The Story Weaver",en:"The Story Weaver"},
  sensory:{nl:"The Atmosphere Curator",en:"The Atmosphere Curator"},
  audience:{nl:"The Private Exhibitionist",en:"The Private Exhibitionist"},
  structure:{nl:"The Boundary Strategist",en:"The Boundary Strategist"},
};

export default function KinkTest({profileId,language,onBack,onReward}:Props) {
  const en=language==="en";
  const t=(nl:string,english:string)=>en?english:nl;
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<string,KinkAnswer>>({});
  const [result,setResult]=useState<KinkProfileResult|null>(null);
  const [savePrivate,setSavePrivate]=useState(false);
  const [saved,setSaved]=useState(false);
  const [reward,setReward]=useState<RewardResult|null>(null);
  const [rewardMessage,setRewardMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [showSaved,setShowSaved]=useState(false);
  const savedResult=useMemo(()=>loadKinkProfileResult(profileId),[profileId,saved,showSaved]);
  const current=kinkQuestions[index];
  const category=kinkCategories.find(item=>item.id===current.category)!;
  const selected=answers[current.id];
  const progress=Math.round((Object.keys(answers).length/kinkQuestions.length)*100);

  const finish=async()=>{
    if(Object.keys(answers).length!==kinkQuestions.length)return;
    const calculated=calculateKinkProfile(answers);
    setResult(calculated);
    setBusy(true);setError("");
    try {
      const awarded=await onReward();
      setReward(awarded);
      setRewardMessage(awarded.alreadyAwarded
        ?t("Je eerste ontdekking is al beloond. Je profiel is bijgewerkt!","Your first discovery has already been rewarded. Your profile is updated!")
        :t("Je eerste ontdekking is beloond!","Your first discovery has been rewarded!"));
    } catch {
      setRewardMessage(t("Je resultaat is klaar. De accountbeloning wacht nog op de beveiligde XP-koppeling.","Your result is ready. The account reward is waiting for the secure XP connection."));
    } finally { setBusy(false); }
    recordAchievement("kink_test_complete",{profileId});
    if(calculated.hardLimitCount>0)recordAchievement("kink_test_boundaries",{profileId});
  };

  const persist=()=>{
    if(!result)return;
    const ok=saveKinkProfileResult(profileId,result);
    setSaved(ok);
    setError(ok?"":t("Opslaan lukte niet. Controleer de opslagruimte op dit apparaat.","Could not save. Check available storage on this device."));
  };
  const reset=()=>{
    setIndex(0);setAnswers({});setResult(null);setReward(null);setRewardMessage("");
    setSaved(false);setSavePrivate(false);setError("");
  };

  if(showSaved&&savedResult&&!result) return <main className="ah-kink-test"><button className="back" onClick={()=>setShowSaved(false)}><ArrowLeft/> {t("Terug","Back")}</button><ResultPanel result={savedResult} language={language}/><button className="kink-danger" onClick={()=>{clearKinkProfileResult(profileId);setShowSaved(false);setSaved(false)}}><Trash2 size={15}/> {t("Verwijder mijn privéresultaat","Delete my private result")}</button></main>;

  return <main className="ah-kink-test">
    <button className="back" onClick={onBack}><ArrowLeft/> {t("Terug","Back")}</button>
    {!result ? <>
      <section className="kink-hero">
        <span className="eyebrow">AFTER HOURS · DISCOVERY LAB</span>
        <div className="kink-hero-mark">AH<span>✦</span></div>
        <p className="kink-kicker">{t("24 VRAGEN · 8 DIMENSIES · JOUW PROFIEL","24 QUESTIONS · 8 DIMENSIONS · YOUR PROFILE")}</p>
        <h1>{t("Ontdek jouw","Discover your")} <i>Kink Profile</i></h1>
        <p>{t("Geen label, geen oordeel. Ontdek wat je aanspreekt, waar je nieuwsgierig naar bent en wat jouw grenzen zijn. Jij bepaalt wat je bewaart of deelt.","No labels, no judgement. Explore what appeals to you, what you're curious about and where your boundaries are. You decide what to save or share.")}</p>
        <div className="kink-privacy-note"><ShieldCheck size={17}/><span>{t("Je antwoorden blijven tijdens de test alleen in dit scherm. Alleen het samenvattende profiel wordt bewaard als jij daar straks expliciet voor kiest.","Your answers stay in this screen during the test. Only the summary is saved if you explicitly choose to do so.")}</span></div>
      </section>
      <div className="kink-progress-head"><span>{t("ONTDEKKING","DISCOVERY")} {String(index+1).padStart(2,"0")} / {String(kinkQuestions.length).padStart(2,"0")}</span><strong>{progress}%</strong></div>
      <div className="kink-progress"><span style={{width:progress+"%"}}/></div>
      <section className="kink-question-card" key={current.id}>
        <div className="kink-question-category"><span>{category.icon}</span><small>{en?category.en:category.nl}</small></div>
        <span className="kink-question-count">{t("VRAAG","QUESTION")} {String(index+1).padStart(2,"0")}</span>
        <h2>{en?current.en:current.nl}</h2>
        <p>{t("Kies wat op dit moment bij je past. Je kunt altijd ‘Weet ik nog niet’ kiezen.","Choose what feels right at this moment. You can always choose ‘Not sure yet’.")}</p>
        <div className="kink-answer-list">
          {answerOptions.map(option=><button key={option.id} className={selected===option.id?"selected":""} aria-pressed={selected===option.id} onClick={()=>setAnswers(prev=>({...prev,[current.id]:option.id}))}>
            <span className="kink-answer-dot">{selected===option.id?<Check size={14}/>:null}</span><span>{en?option.en:option.nl}</span><small>{option.score?("+"+option.score):""}</small>
          </button>)}
        </div>
        <div className="kink-nav-actions">
          <button className="kink-secondary" onClick={()=>setIndex(i=>Math.max(0,i-1))} disabled={index===0}><ArrowLeft size={15}/>{t("Vorige","Previous")}</button>
          {index<kinkQuestions.length-1
            ?<button className="kink-primary" onClick={()=>setIndex(i=>i+1)}>{t("Volgende","Next")}<ArrowRight size={15}/></button>
            :<button className="kink-primary" onClick={()=>void finish()} disabled={!selected||Object.keys(answers).length!==kinkQuestions.length||busy}>{busy?t("Profiel maken…","Building profile…"):t("Onthul mijn profiel","Reveal my profile")}<Sparkles size={15}/></button>}
        </div>
        {error&&<p className="kink-error" role="alert">{error}</p>}
      </section>
      <div className="kink-footer-hint">{t("Geen haast. Er is geen goed of fout antwoord.","No rush. There are no right or wrong answers.")}</div>
    </> : <>
      <div className="kink-result-top"><span className="eyebrow">YOUR AFTER HOURS SIGNATURE</span><div className="kink-result-seal">AH<span>✦</span></div><h1>{t("Jouw Kink Profile","Your Kink Profile")}</h1><p>{t("Een momentopname van jouw nieuwsgierigheid. Jij blijft de baas over je grenzen.","A snapshot of your curiosity. You remain in charge of your boundaries.")}</p></div>
      <ResultPanel result={result} language={language}/>
      <section className="kink-reward-card"><div className="kink-reward-icon"><Award/></div><div><span className="eyebrow">{t("DISCOVERY REWARD","DISCOVERY REWARD")}</span><h3>{reward&&reward.xpEarned>0?("+"+reward.xpEarned+" XP"):reward?.alreadyAwarded?t("Al geclaimd","Already claimed"):t("XP in afwachting","XP pending")}</h3><p>{rewardMessage||t("Je eerste volledige Kink Profile levert een eenmalige beloning op.","Your first completed Kink Profile earns a one-time reward.")}</p>{reward?.totalXp!==undefined&&reward.totalXp!==null&&<small>{t("Totaal account-XP: ","Total account XP: ")}{reward.totalXp}</small>}</div></section>
      <section className="kink-unlocks"><span className="eyebrow">{t("UNLOCKED","UNLOCKED")}</span><div><span>✦</span><strong>The Self-Knowing</strong><small>{t("Eerste Kink Profile afgerond","First Kink Profile completed")}</small></div>{result.hardLimitCount>0&&<div><span>◇</span><strong>Boundary Architect</strong><small>{t("Je grenzen bewust benoemd","You consciously identified boundaries")}</small></div>}</section>
      <section className="kink-save-card"><div><Lock size={17}/><div><strong>{t("Bewaar je resultaat privé?","Save your result privately?")}</strong><p>{t("Alleen de scores en categorieën worden lokaal op dit apparaat opgeslagen. Je ruwe antwoorden worden niet bewaard of gedeeld.","Only scores and categories are stored locally on this device. Your raw answers are not saved or shared.")}</p></div></div><label><input type="checkbox" checked={savePrivate} onChange={e=>setSavePrivate(e.target.checked)}/>{t("Ja, bewaar mijn privéprofiel","Yes, save my private profile")}</label>{savePrivate&&<button className="kink-primary" onClick={persist}>{saved?t("Opgeslagen","Saved"):t("Bewaar privéprofiel","Save private profile")} <Check size={15}/></button>}{saved&&<small className="kink-saved-note">{t("Je kunt dit resultaat altijd verwijderen via deze test.","You can delete this result anytime from this test.")}</small>}</section>
      {saved&&<button className="kink-danger" onClick={()=>{clearKinkProfileResult(profileId);setSaved(false);setSavePrivate(false)}}><Trash2 size={15}/>{t("Verwijder opgeslagen profiel","Delete saved profile")}</button>}
      <div className="kink-result-actions"><button className="kink-secondary" onClick={reset}><RotateCcw size={15}/>{t("Opnieuw ontdekken","Retake test")}</button><button className="kink-primary" onClick={onBack}>{t("Terug naar AFTER HOURS","Back to AFTER HOURS")}<ChevronRight size={15}/></button></div>
    </>}
    {!result&&savedResult&&<button className="kink-saved-link" onClick={()=>setShowSaved(true)}><Eye size={15}/>{t("Bekijk eerder opgeslagen privéprofiel","View previously saved private profile")}</button>}
  </main>;
}

function ResultPanel({result,language}:{result:KinkProfileResult;language:"nl"|"en"}) {
  const en=language==="en";
  const top=result.topCategories.map(id=>kinkCategories.find(category=>category.id===id)).filter(Boolean);
  const archetype=archetypeCopy[result.archetypeId]??archetypeCopy.structure;
  return <section className="kink-profile-result">
    <div className="kink-archetype"><span className="eyebrow">{en?"YOUR DISCOVERY ARCHETYPE":"JOUW ONTDEKKINGSARCHETYPE"}</span><h2>{en?archetype.en:archetype.nl}</h2><p>{en?"Your strongest current interest area, not a fixed identity.":"Je sterkste interessegebied van dit moment, geen vaststaand label."}</p></div>
    <div className="kink-top-categories">{top.map((category,index)=><div key={category!.id}><span>0{index+1}</span><strong>{en?category!.en:category!.nl}</strong></div>)}</div>
    <div className="kink-score-list"><span className="eyebrow">{en?"YOUR EIGHT DIMENSIONS":"JOUW ACHT DIMENSIES"}</span>{result.categoryScores.map(score=>{const category=kinkCategories.find(item=>item.id===score.id)!;return <div className="kink-score-row" key={score.id}><div><strong>{en?category.en:category.nl}</strong><small>{score.hardLimitCount?score.hardLimitCount+(en?" hard limit(s)":" harde grens/grenzen"):en?"Interest score":"Interessescore"}</small></div><div className="kink-score-track"><span style={{width:score.percentage+"%"}}/></div><b>{score.percentage}%</b></div>})}</div>
    <div className="kink-result-facts"><div><strong>{result.curiosityCount}</strong><small>{en?"Curiosity answers":"Nieuwsgierige antwoorden"}</small></div><div><strong>{result.hardLimitCount}</strong><small>{en?"Hard limits":"Harde grenzen"}</small></div><div><strong>{result.answeredCount}/24</strong><small>{en?"Answered":"Beantwoord"}</small></div></div>
    <p className="kink-disclaimer">{en?"This is a playful self-reflection tool, not a psychological assessment or compatibility guarantee. A score never overrides consent, communication or a current boundary.":"Dit is een speelse zelfreflectietest, geen psychologische beoordeling of compatibiliteitsgarantie. Een score gaat nooit boven consent, communicatie of een actuele grens."}</p>
  </section>;
}
