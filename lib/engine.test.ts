import { describe, expect, it } from "vitest";
import {
  cardPayoff,
  cashFlow,
  creditSummary,
  blankProfile,
  defaultProfile,
  estimateTax,
  futureImpacts,
  futureProofScore,
  monthsToEmergencyGoal,
  projectRetirement,
  runway,
  SCORE_WEIGHTS,
} from "./engine";

describe("estimateTax", () => {
  it("charges no state tax in Texas but does in California", () => {
    expect(estimateTax(80000, "single", "TX", 0).state).toBe(0);
    expect(estimateTax(80000, "single", "CA", 0).state).toBeGreaterThan(0);
  });

  it("lowers income tax (not FICA) when retirement contributions rise", () => {
    const a = estimateTax(80000, "single", "TX", 0);
    const b = estimateTax(80000, "single", "TX", 10);
    expect(b.federal).toBeLessThan(a.federal);
    expect(b.socialSecurity).toBe(a.socialSecurity);
    expect(b.medicare).toBe(a.medicare);
  });

  it("net plus all deductions equals gross", () => {
    const t = estimateTax(90000, "married", "NY", 6);
    const sum =
      t.net + t.retirementContribution + t.federal + t.socialSecurity +
      t.medicare + t.state;
    expect(sum).toBeCloseTo(t.gross, 5);
  });

  it("handles zero income", () => {
    const t = estimateTax(0, "single", "TX", 5);
    expect(t.net).toBe(0);
    expect(t.effectiveRate).toBe(0);
  });
});

describe("runway", () => {
  it("matches the outline's job-loss example ($8,500 / $3,200 = 79 days)", () => {
    const r = runway(8500, 3200);
    expect(r.days).toBe(79); // 2.65625 months * 30 days, rounded down
    expect(r.months).toBeCloseTo(2.656, 2);
  });

  it("reports the gap to six months", () => {
    const r = runway(6400, 3200);
    expect(r.gapMonths).toBe(4);
    expect(r.gapDollars).toBe(12800);
  });

  it("never divides by zero", () => {
    expect(runway(0, 0).months).toBe(0);
  });
});

describe("monthsToEmergencyGoal", () => {
  it("returns 0 when already funded and null when not saving", () => {
    expect(monthsToEmergencyGoal(20000, 3000, 100)).toBe(0);
    expect(monthsToEmergencyGoal(0, 3000, 0)).toBeNull();
  });

  it("saving more gets there sooner", () => {
    const slow = monthsToEmergencyGoal(1000, 3000, 100)!;
    const fast = monthsToEmergencyGoal(1000, 3000, 200)!;
    expect(fast).toBeLessThan(slow);
  });
});

describe("projectRetirement", () => {
  it("retires earlier with a higher contribution rate", () => {
    const p = defaultProfile();
    const low = projectRetirement(p, 3).projectedAge!;
    const high = projectRetirement(p, 12).projectedAge!;
    expect(high).toBeLessThan(low);
  });

  it("is immediate when already past the target balance", () => {
    const p = { ...defaultProfile(), retirementBalance: 5_000_000 };
    expect(projectRetirement(p).projectedAge).toBe(p.age);
  });

  it("returns null when retirement is out of reach by 90", () => {
    const p = {
      ...defaultProfile(),
      age: 60,
      retirementBalance: 0,
      retirementPct: 0,
      employerMatchPct: 0,
    };
    expect(projectRetirement(p).projectedAge).toBeNull();
  });
});

describe("cardPayoff", () => {
  it("never pays off when the payment does not cover interest", () => {
    // $5,000 at 26% APR is about $108/mo interest
    expect(cardPayoff(5000, 26, 100).months).toBeNull();
  });

  it("pays less interest with a larger payment", () => {
    const a = cardPayoff(5000, 26, 150).totalInterest!;
    const b = cardPayoff(5000, 26, 300).totalInterest!;
    expect(b).toBeLessThan(a);
  });

  it("a debt-free card costs nothing", () => {
    expect(cardPayoff(0, 26, 100)).toEqual({ months: 0, totalInterest: 0 });
  });
});

describe("creditSummary", () => {
  it("shows current, previous, and change from the two latest entries", () => {
    const p = defaultProfile();
    p.credit.history = [
      { date: "2026-01-01", score: 700 },
      { date: "2026-06-01", score: 712 },
      { date: "2026-11-01", score: 725 },
    ];
    expect(creditSummary(p)).toEqual({ current: 725, previous: 712, change: 13 });
  });

  it("handles no history", () => {
    expect(creditSummary(defaultProfile()).current).toBeNull();
  });
});

describe("futureProofScore", () => {
  it("weights add up to 100%", () => {
    const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("stays within 0-1000", () => {
    const rich = {
      ...defaultProfile(),
      savings: 1_000_000,
      retirementBalance: 5_000_000,
    };
    rich.credit.history = [{ date: "2026-11-01", score: 850 }];
    rich.credit.utilization = 0;
    rich.expenses.debt = 0;
    const s = futureProofScore(rich).total;
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(1000);

    const broke = {
      ...defaultProfile(),
      grossIncome: 0,
      savings: 0,
      retirementBalance: 0,
    };
    expect(futureProofScore(broke).total).toBeGreaterThanOrEqual(0);
  });

  it("improves when savings grow", () => {
    const p = defaultProfile();
    const more = { ...p, savings: p.savings + 20000 };
    expect(futureProofScore(more).total).toBeGreaterThan(
      futureProofScore(p).total,
    );
  });

  it("names a strongest and weakest component", () => {
    const s = futureProofScore(defaultProfile());
    expect(s.strongest).not.toBe(s.weakest);
  });
});

describe("futureImpacts", () => {
  it("shows the retirement age moving earlier with a higher contribution", () => {
    const p = defaultProfile();
    const impacts = futureImpacts(p, {
      retirementPct: 12,
      extraMonthlySavings: 0,
      extraCardPayment: 0,
    });
    const ret = impacts.find((i) => i.title === "Retirement age")!;
    expect(ret.direction).toBe("better");
  });

  it("flags a worse outcome when contributions are removed", () => {
    const p = defaultProfile();
    const impacts = futureImpacts(p, {
      retirementPct: 0,
      extraMonthlySavings: 0,
      extraCardPayment: 0,
    });
    expect(impacts.find((i) => i.title === "Retirement age")!.direction).toBe(
      "worse",
    );
  });

  it("an extra card payment cuts the interest", () => {
    const p = defaultProfile();
    const impacts = futureImpacts(p, {
      retirementPct: p.retirementPct,
      extraMonthlySavings: 0,
      extraCardPayment: 100,
    });
    expect(
      impacts.find((i) => i.title === "Card interest to pay it off")!.direction,
    ).toBe("better");
  });
});

describe("cashFlow", () => {
  it("monthly remaining equals net minus expenses", () => {
    const c = cashFlow(defaultProfile());
    expect(c.monthlyRemaining).toBeCloseTo(c.monthlyNet - c.monthlyExpenses, 6);
  });
});

describe("blankProfile", () => {
  it("has no dollar amounts pre-filled and still scores without NaN", () => {
    const b = blankProfile();
    expect(b.grossIncome).toBe(0);
    expect(b.savings).toBe(0);
    expect(b.state).toBe("");
    const s = futureProofScore(b);
    expect(Number.isFinite(s.total)).toBe(true);
  });
});
