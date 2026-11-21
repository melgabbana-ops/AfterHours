import { afterEach, describe, expect, it, vi } from "vitest";
import {
  awardLocalKinkTestXp, calculateKinkProfile, clearKinkProfileResult,
  kinkCategories, kinkQuestions, loadKinkProfileResult, saveKinkProfileResult,
} from "./kinkTest";

function installStorage() {
  const values = new Map<string,string>();
  vi.stubGlobal("localStorage", {
    getItem:(key:string)=>values.get(key)??null,
    setItem:(key:string,value:string)=>values.set(key,String(value)),
    removeItem:(key:string)=>values.delete(key),
  });
  return values;
}
afterEach(()=>vi.unstubAllGlobals());

describe("AFTER HOURS Kink Profile test",()=>{
  it("has three balanced questions for each of eight discovery dimensions",()=>{
    expect(kinkCategories).toHaveLength(8);
    expect(kinkQuestions).toHaveLength(24);
    for(const category of kinkCategories) expect(kinkQuestions.filter(q=>q.category===category.id)).toHaveLength(3);
  });
  it("calculates a profile without treating hard limits as interest",()=>{
    const answers=Object.fromEntries(kinkQuestions.map(q=>[q.id,q.category==="power"?"yes":q.category==="service"?"limit":"no"])) as Record<string, "yes"|"limit"|"no">;
    const result=calculateKinkProfile(answers,"2026-11-21T12:00:00.000Z");
    expect(result.archetypeId).toBe("power");
    expect(result.categoryScores.find(x=>x.id==="service")).toMatchObject({percentage:0,hardLimitCount:3});
    expect(result.hardLimitCount).toBe(3);
    expect(result.answeredCount).toBe(24);
  });
  it("keeps incomplete answers honest and ranks curiosity separately",()=>{
    const result=calculateKinkProfile({p1:"curious",p2:"unsure",p3:"yes"});
    expect(result.curiosityCount).toBe(2);
    expect(result.answeredCount).toBe(3);
  });
  it("stores only the result summary per profile and supports deletion",()=>{
    installStorage();
    const result=calculateKinkProfile(Object.fromEntries(kinkQuestions.map(q=>[q.id,"curious"])));
    expect(saveKinkProfileResult("alice",result)).toBe(true);
    expect(loadKinkProfileResult("alice")).toEqual(result);
    expect(loadKinkProfileResult("bob")).toBeNull();
    expect(clearKinkProfileResult("alice")).toBe(true);
    expect(loadKinkProfileResult("alice")).toBeNull();
  });
  it("awards local demo XP only once per profile",()=>{
    installStorage();
    expect(awardLocalKinkTestXp("alice")).toEqual({xpEarned:120,alreadyAwarded:false});
    expect(awardLocalKinkTestXp("alice")).toEqual({xpEarned:0,alreadyAwarded:true});
    expect(awardLocalKinkTestXp("bob")).toEqual({xpEarned:120,alreadyAwarded:false});
  });
});
