export type FilingStatus = "single" | "married" | "head";

export interface CreditEntry {
  /** ISO date, e.g. 2026-11-09 */
  date: string;
  score: number;
}

export interface Profile {
  age: number;
  targetRetirementAge: number;
  householdSize: number;
  /** Two-letter US state code */
  state: string;
  filing: FilingStatus;
  /** Annual gross income */
  grossIncome: number;
  payFrequency: "weekly" | "biweekly" | "semimonthly" | "monthly";

  /** Emergency / liquid savings */
  savings: number;
  retirementBalance: number;
  /** Employee contribution, % of gross (0-100) */
  retirementPct: number;
  /** Employer match, % of gross (0-100) */
  employerMatchPct: number;

  /** Monthly expenses by bucket */
  expenses: {
    housing: number;
    transportation: number;
    utilities: number;
    /** Monthly debt payments (card minimums, loans) */
    debt: number;
    lifestyle: number;
  };

  /** Primary credit card (drives the interest projection) */
  cardBalance: number;
  cardApr: number;
  cardPayment: number;

  credit: {
    history: CreditEntry[];
    /** Credit utilization, 0-100 */
    utilization: number;
    openAccounts: number;
    hardInquiries: number;
    /** Late payments in the last 24 months */
    latePayments: number;
  };
}

export interface TaxResult {
  gross: number;
  retirementContribution: number;
  federal: number;
  socialSecurity: number;
  medicare: number;
  state: number;
  net: number;
  /** Federal tax plus FICA plus state, divided by gross */
  effectiveRate: number;
}

export type Grade = "A" | "B" | "C" | "D";

export interface ScoreResult {
  /** Internal 0-1000 value used for math and tests. Not shown to users. */
  total: number;
  /** total / 10, rounded down: the whole-percent overall result */
  percent: number;
  /** The letter users see */
  grade: Grade;
  /** Plain-words name for the grade ("Fair", "Good", ...) */
  label: string;
  components: Record<ComponentKey, number>;
  strongest: ComponentKey;
  weakest: ComponentKey;
}

export type ComponentKey =
  | "cashFlow"
  | "emergencyFund"
  | "retirement"
  | "debtLoad"
  | "creditHealth";
