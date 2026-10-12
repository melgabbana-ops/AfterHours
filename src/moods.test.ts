import { describe, expect, it } from "vitest";
import { isMoodCode, moodCatalog } from "./services/moods";

describe("approved mood catalog", () => {
 it("contains every approved pre-session mood",()=>{
  expect(moodCatalog.before).toEqual(["KINKY","EXCITED","CURIOUS","CALM","PLAYFUL","CONFIDENT","UNSURE"]);
 });
 it("contains every approved in-session mood",()=>{
  expect(moodCatalog.during).toEqual(["INTO IT","MORE","GOOD","NEUTRAL","NEED A PAUSE","OVERWHELMED","STOP"]);
 });
 it("contains every approved post-session mood",()=>{
  expect(moodCatalog.after).toEqual(["RELAXED","SATISFIED","ENERGIZED","TIRED","EMOTIONAL","OVERSTIMULATED","NEUTRAL","UNSURE"]);
 });
 it("rejects mood values in the wrong phase",()=>{
  expect(isMoodCode("during","OVERWHELMED")).toBe(true);
  expect(isMoodCode("after","OVERWHELMED")).toBe(false);
 });
});
