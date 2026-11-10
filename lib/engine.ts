import type {
  ComponentKey,
  FilingStatus,
  Profile,
  ScoreResult,
  TaxResult,
} from "./types";

/* ------------------------------------------------------------------ */
/* Tax estimate                                                        */
/* These are rough estimates for a "what do I really bring home?"      */
/* view, not tax advice. Update the constants each tax year.           */
/* ------------------------------------------------------------------ */

export const TAX_YEAR = 2025;

type Bracket = [upTo: number, rate: number];

const BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    [11925, 0.1],
    [48475, 0.12],
    [103350, 0.22],
    [197300, 0.24],
    [250525, 0.32],
    [626350, 0.35],
    [Infinity, 0.37],
  ],
  married: [
    [23850, 0.1],
    [96950, 0.12],
    [206700, 0.22],
    [394600, 0.24],
    [501050, 0.32],
    [751600, 0.35],
    [Infinity, 0.37],
  ],
  head: [
    [17000, 0.1],
    [64850, 0.12],
    [103350, 0.22],
    [197300, 0.24],
    [250500, 0.32],
    [626350, 0.35],
    [Infinity, 0.37],
  ],
};

export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15750,
  married: 31500,
  head: 23625,
};

export const SS_RATE = 0.062;
export const SS_WAGE_BASE = 176100;
export const MEDICARE_RATE = 0.0145;

export const NO_INCOME_TAX_STATES = new Set([
  "AK", "FL", "NV", "NH", "SD", "TN", "TX", "WA", "WY",
]);
/** Very rough effective state income-tax rate used when a state taxes wages. */
export const DEFAULT_STATE_RATE = 0.045;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

export function progressiveTax(taxable: number, brackets: Bracket[]): number {
  let tax = 0;
  let lower = 0;
  for (const [upTo, rate] of brackets) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, upTo) - lower) * rate;
    lower = upTo;
  }
  return tax;
}

export function estimateTax(
  gross: number,
  filing: FilingStatus,
  state: string,
  retirementPct: number,
): TaxResult {
  const g = Math.max(0, gross);
  const retirementContribution = g * (clamp(retirementPct, 0, 100) / 100);
  // Pre-tax retirement contributions reduce income tax but not FICA.
  const taxable = Math.max(
    0,
    g - retirementContribution - STANDARD_DEDUCTION[filing],
  );
  const federal = progressiveTax(taxable, BRACKETS[filing]);
  const socialSecurity = Math.min(g, SS_WAGE_BASE) * SS_RATE;
  const medicare = g * MEDICARE_RATE;
  const stateTax = NO_INCOME_TAX_STATES.has(state.toUpperCase())
    ? 0
    : Math.max(0, g - retirementContribution) * DEFAULT_STATE_RATE;
  const net =
    g - retirementContribution - federal - socialSecurity - medicare - stateTax;
  return {
    gross: g,
    retirementContribution,
    federal,
    socialSecurity,
    medicare,
    state: stateTax,
    net,
    effectiveRate:
      g > 0 ? (federal + socialSecurity + medicare + stateTax) / g : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Cash flow                                                           */
/* ------------------------------------------------------------------ */

export function monthlyExpenses(p: Profile): number {
  const e = p.expenses;
  return e.housing + e.transportation + e.utilities + e.debt + e.lifestyle;
}

export interface CashFlow {
  tax: TaxResult;
  monthlyNet: number;
  monthlyExpenses: number;
  /** Money left each month after taxes, retirement, and expenses */
  monthlyRemaining: number;
}

export function cashFlow(p: Profile): CashFlow {
  const tax = estimateTax(p.grossIncome, p.filing, p.state, p.retirementPct);
  const monthlyNet = tax.net / 12;
  const exp = monthlyExpenses(p);
  return {
    tax,
    monthlyNet,
    monthlyExpenses: exp,
    monthlyRemaining: monthlyNet - exp,
  };
}

/* ------------------------------------------------------------------ */
/* Emergency fund                                                      */
/* ------------------------------------------------------------------ */

export const RECOMMENDED_EMERGENCY_MONTHS = 6;
const DAYS_PER_MONTH = 30;

export interface Runway {
  months: number;
  days: number;
  recommendedMonths: number;
  gapMonths: number;
  gapDollars: number;
}

export function runway(savings: number, monthly: number): Runway {
  const months = monthly > 0 ? savings / monthly : savings > 0 ? Infinity : 0;
  const gapMonths = Math.max(0, RECOMMENDED_EMERGENCY_MONTHS - months);
  return {
    months,
    days: Number.isFinite(months) ? Math.floor(months * DAYS_PER_MONTH) : Infinity,
    recommendedMonths: RECOMMENDED_EMERGENCY_MONTHS,
    gapMonths,
    gapDollars: Math.max(0, RECOMMENDED_EMERGENCY_MONTHS * monthly - savings),
  };
}

/** Months until savings hit the 6-month target at a given monthly saving rate. */
export function monthsToEmergencyGoal(
  savings: number,
  monthlyExpensesTotal: number,
  monthlySaving: number,
): number | null {
  const gap = RECOMMENDED_EMERGENCY_MONTHS * monthlyExpensesTotal - savings;
  if (gap <= 0) return 0;
  if (monthlySaving <= 0) return null;
  return Math.ceil(gap / monthlySaving);
}

/* ------------------------------------------------------------------ */
/* Retirement                                                          */
/* ------------------------------------------------------------------ */

/** Real (after-inflation) annual return assumption. */
export const REAL_RETURN = 0.05;
/** 25x annual spending, the classic 4% rule. */
export const NEST_EGG_MULTIPLE = 25;
const MAX_PROJECTION_AGE = 90;

export interface RetirementProjection {
  /** Age at which the nest egg is projected to cover spending, or null if beyond 90 */
  projectedAge: number | null;
  targetBalance: number;
  yearsOffGoal: number | null;
  /** Projected balance on the day you reach your goal retirement age */
  balanceAtGoal: number;
  /** balanceAtGoal / targetBalance, capped at 1. Grows with every dollar saved. */
  fundedPct: number;
}

/** Retirement spending is today's spending, assuming debt payments are gone. */
export function retirementSpendingPerYear(p: Profile): number {
  return Math.max(0, monthlyExpenses(p) - p.expenses.debt) * 12;
}

export function projectRetirement(
  p: Profile,
  retirementPct: number = p.retirementPct,
): RetirementProjection {
  const target = retirementSpendingPerYear(p) * NEST_EGG_MULTIPLE;
  const annualContribution =
    p.grossIncome * ((clamp(retirementPct, 0, 100) + p.employerMatchPct) / 100);

  let balance = p.retirementBalance;
  let age = p.age;
  while (balance < target && age < MAX_PROJECTION_AGE) {
    balance = balance * (1 + REAL_RETURN) + annualContribution;
    age += 1;
  }
  const projectedAge = balance >= target ? age : null;

  // Progress measure: where will the balance stand when the goal age arrives?
  let atGoal = p.retirementBalance;
  for (let a = p.age; a < p.targetRetirementAge; a++) {
    atGoal = atGoal * (1 + REAL_RETURN) + annualContribution;
  }

  return {
    projectedAge,
    targetBalance: target,
    yearsOffGoal:
      projectedAge === null ? null : projectedAge - p.targetRetirementAge,
    balanceAtGoal: atGoal,
    fundedPct: target > 0 ? clamp(atGoal / target, 0, 1) : 1,
  };
}

/* ------------------------------------------------------------------ */
/* Debt                                                                */
/* ------------------------------------------------------------------ */

export interface DebtPayoff {
  /** null means the payment never covers the interest */
  months: number | null;
  totalInterest: number | null;
}

export function cardPayoff(
  balance: number,
  aprPct: number,
  payment: number,
): DebtPayoff {
  if (balance <= 0) return { months: 0, totalInterest: 0 };
  const monthlyRate = aprPct / 100 / 12;
  if (payment <= balance * monthlyRate) {
    return { months: null, totalInterest: null };
  }
  let months = 0;
  let interest = 0;
  let bal = balance;
  while (bal > 0 && months < 1200) {
    const i = bal * monthlyRate;
    interest += i;
    bal = bal + i - payment;
    months += 1;
  }
  return { months, totalInterest: interest };
}

/* ------------------------------------------------------------------ */
/* Credit                                                              */
/* ------------------------------------------------------------------ */

export interface CreditSummary {
  current: number | null;
  previous: number | null;
  change: number | null;
}

export function creditSummary(p: Profile): CreditSummary {
  const sorted = [...p.credit.history].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const current = sorted.at(-1)?.score ?? null;
  const previous = sorted.length > 1 ? sorted.at(-2)!.score : null;
  return {
    current,
    previous,
    change: current !== null && previous !== null ? current - previous : null,
  };
}

export function utilizationInsight(utilizationPct: number): string {
  if (utilizationPct <= 10) {
    return "Your credit usage is excellent. Keep it up.";
  }
  if (utilizationPct <= 30) {
    return "Your credit usage is in a healthy range.";
  }
  return "Your credit usage is higher than recommended. Getting it below 30% may improve your borrowing options.";
}

/* ------------------------------------------------------------------ */
/* FutureProof Score (0 - 1000)                                        */
/* ------------------------------------------------------------------ */

export const SCORE_WEIGHTS: Record<ComponentKey, number> = {
  cashFlow: 0.25,
  emergencyFund: 0.25,
  retirement: 0.2,
  debtLoad: 0.15,
  creditHealth: 0.15,
};

export const COMPONENT_LABELS: Record<ComponentKey, string> = {
  cashFlow: "Cash Flow",
  emergencyFund: "Emergency Savings",
  retirement: "Retirement Readiness",
  debtLoad: "Debt Load",
  creditHealth: "Credit Health",
};

export function scoreLabel(total: number): string {
  if (total < 500) return "Needs work";
  if (total < 700) return "Fair";
  if (total < 850) return "Good";
  return "Excellent";
}

export function futureProofScore(p: Profile): ScoreResult {
  const cf = cashFlow(p);
  const rw = runway(p.savings, cf.monthlyExpenses);
  const ret = projectRetirement(p);
  const cs = creditSummary(p);

  // Saving 20% of take-home counts as a full score.
  const savingsRate = cf.monthlyNet > 0 ? cf.monthlyRemaining / cf.monthlyNet : 0;
  const cashFlowScore = clamp(savingsRate / 0.2, 0, 1);

  const emergencyScore = clamp(rw.months / RECOMMENDED_EMERGENCY_MONTHS, 0, 1);

  // Graded on progress (how funded you'll be at your goal age), not pass/fail, so
  // someone early in their journey still sees credit for what they have saved.
  const retirementScore = ret.fundedPct;

  // Debt payments at or above 36% of take-home counts as zero.
  const dti = cf.monthlyNet > 0 ? p.expenses.debt / cf.monthlyNet : 1;
  const debtScore = clamp(1 - dti / 0.36, 0, 1);

  const utilScore = clamp((50 - p.credit.utilization) / 40, 0, 1);
  const latePenalty = Math.min(0.3, p.credit.latePayments * 0.1);
  const base =
    cs.current === null
      ? utilScore
      : 0.6 * clamp((cs.current - 300) / 550, 0, 1) + 0.4 * utilScore;
  const creditScore = clamp(base - latePenalty, 0, 1);

  const components: Record<ComponentKey, number> = {
    cashFlow: cashFlowScore,
    emergencyFund: emergencyScore,
    retirement: retirementScore,
    debtLoad: debtScore,
    creditHealth: creditScore,
  };

  const keys = Object.keys(components) as ComponentKey[];
  const total = Math.round(
    keys.reduce((sum, k) => sum + components[k] * SCORE_WEIGHTS[k], 0) * 1000,
  );
  const strongest = keys.reduce((a, b) => (components[b] > components[a] ? b : a));
  const weakest = keys.reduce((a, b) => (components[b] < components[a] ? b : a));

  return { total, label: scoreLabel(total), components, strongest, weakest };
}

/* ------------------------------------------------------------------ */
/* Future Impact Engine                                                */
/* ------------------------------------------------------------------ */

export interface WhatIf {
  retirementPct: number;
  extraMonthlySavings: number;
  extraCardPayment: number;
}

export interface Impact {
  title: string;
  before: string;
  after: string;
  /** "better", "worse", or "same", used to pick an icon and an arrow */
  direction: "better" | "worse" | "same";
}

export function applyWhatIf(p: Profile, w: WhatIf): Profile {
  return {
    ...p,
    retirementPct: w.retirementPct,
    cardPayment: p.cardPayment + w.extraCardPayment,
    expenses: {
      ...p.expenses,
      // extra card payments are real money out each month
      debt: p.expenses.debt + w.extraCardPayment,
    },
  };
}

export function futureImpacts(p: Profile, w: WhatIf): Impact[] {
  const out: Impact[] = [];
  const next = applyWhatIf(p, w);

  // Retirement age
  const a = projectRetirement(p);
  const b = projectRetirement(next);
  out.push({
    title: "Retirement age",
    before: fmtAge(a.projectedAge),
    after: fmtAge(b.projectedAge),
    direction: compareAge(a.projectedAge, b.projectedAge),
  });

  // Retirement progress (moves even when the retirement age does not)
  const fa = Math.round(a.fundedPct * 100);
  const fb = Math.round(b.fundedPct * 100);
  out.push({
    title: "Retirement funded by your goal age",
    before: `${fa}%`,
    after: `${fb}%`,
    direction: fb > fa ? "better" : fb < fa ? "worse" : "same",
  });

  // Emergency fund goal
  const cfA = cashFlow(p);
  const cfB = cashFlow(next);
  const mA = monthsToEmergencyGoal(
    p.savings,
    cfA.monthlyExpenses,
    Math.max(0, cfA.monthlyRemaining),
  );
  const mB = monthsToEmergencyGoal(
    p.savings,
    cfB.monthlyExpenses,
    Math.max(0, cfB.monthlyRemaining + w.extraMonthlySavings),
  );
  out.push({
    title: "Emergency fund goal",
    before: fmtMonths(mA),
    after: fmtMonths(mB),
    direction: compareNullable(mA, mB),
  });

  // Credit card interest
  const dA = cardPayoff(p.cardBalance, p.cardApr, p.cardPayment);
  const dB = cardPayoff(next.cardBalance, next.cardApr, next.cardPayment);
  if (p.cardBalance > 0) {
    out.push({
      title: "Card interest to pay it off",
      before: fmtMoney(dA.totalInterest),
      after: fmtMoney(dB.totalInterest),
      direction: compareNullable(dA.totalInterest, dB.totalInterest),
    });
  }

  // Overall score
  const sA = futureProofScore(p).total;
  const sB = futureProofScore(next).total;
  out.push({
    title: "FutureProof Score",
    before: String(sA),
    after: String(sB),
    direction: sB > sA ? "better" : sB < sA ? "worse" : "same",
  });

  return out;
}

/* ------------------------------------------------------------------ */
/* Formatting + helpers                                                */
/* ------------------------------------------------------------------ */

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function fmtMoney(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "Never";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function fmtAge(age: number | null): string {
  return age === null ? "Past 90" : String(age);
}

export function fmtMonths(m: number | null): string {
  if (m === null) return "Not reachable";
  if (m === 0) return "Reached";
  if (m < 24) return `${m} mo`;
  return `${(m / 12).toFixed(1)} yrs`;
}

/** Lower is better. null means "never" and is the worst outcome. */
function compareNullable(a: number | null, b: number | null): Impact["direction"] {
  if (a === b) return "same";
  if (b === null) return "worse";
  if (a === null) return "better";
  return b < a ? "better" : b > a ? "worse" : "same";
}

function compareAge(a: number | null, b: number | null): Impact["direction"] {
  return compareNullable(a, b);
}

export function defaultProfile(): Profile {
  return {
    age: 35,
    targetRetirementAge: 67,
    householdSize: 1,
    state: "TX",
    filing: "single",
    grossIncome: 60000,
    payFrequency: "biweekly",
    savings: 3000,
    retirementBalance: 15000,
    retirementPct: 5,
    employerMatchPct: 3,
    expenses: {
      housing: 1300,
      transportation: 400,
      utilities: 250,
      debt: 200,
      lifestyle: 600,
    },
    cardBalance: 4000,
    cardApr: 24,
    cardPayment: 150,
    credit: {
      history: [],
      utilization: 40,
      openAccounts: 4,
      hardInquiries: 1,
      latePayments: 0,
    },
  };
}

/**
 * First-run starting point: every dollar amount is empty so nobody gets a confident-looking
 * score built from numbers they never entered. Only neutral structural defaults are set.
 */
export function blankProfile(): Profile {
  const d = defaultProfile();
  return {
    ...d,
    age: 0,
    state: "",
    grossIncome: 0,
    savings: 0,
    retirementBalance: 0,
    retirementPct: 0,
    employerMatchPct: 0,
    expenses: { housing: 0, transportation: 0, utilities: 0, debt: 0, lifestyle: 0 },
    cardBalance: 0,
    cardApr: 0,
    cardPayment: 0,
    credit: { history: [], utilization: 0, openAccounts: 0, hardInquiries: 0, latePayments: 0 },
  };
}
