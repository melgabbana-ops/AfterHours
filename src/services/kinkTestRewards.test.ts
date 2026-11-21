import { describe, expect, it } from "vitest";
import { isKinkTestRewardPayload } from "./kinkTestRewards";

describe("Kink Test server reward validation",()=>{
  it("accepts a bounded first award or an idempotent replay",()=>{
    expect(isKinkTestRewardPayload({xp_earned:120,already_awarded:false,total_xp:320})).toBe(true);
    expect(isKinkTestRewardPayload({xp_earned:0,already_awarded:true,total_xp:320})).toBe(true);
  });
  it("rejects malformed or unbounded server rewards",()=>{
    for(const value of [null,{},[],{xp_earned:-1,already_awarded:false,total_xp:0},{xp_earned:121,already_awarded:false,total_xp:121},{xp_earned:120,already_awarded:"no",total_xp:120},{xp_earned:0,already_awarded:true,total_xp:"120"}]) {
      expect(isKinkTestRewardPayload(value)).toBe(false);
    }
  });
});
