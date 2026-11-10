"use client";

import type { ComponentKey, Profile, TaxResult } from "@/lib/types";
import {
  COMPONENT_LABELS,
  DEFAULT_STATE_RATE,
  MEDICARE_RATE,
  NO_INCOME_TAX_STATES,
  SCORE_WEIGHTS,
  SS_RATE,
  SS_WAGE_BASE,
  STANDARD_DEDUCTION,
  cashFlow,
  estimateTax,
  fmtMoney,
  futureProofScore,
  projectRetirement,
} from "@/lib/engine";
import { Card, HowCalculated, Muted } from "./ui";

const totalTax = (t: TaxResult) => t.federal + t.socialSecurity + t.medicare + t.state;

function Ring({ value }: { value: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, Math.max(0, value / 1000));
  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label={`FutureProof Score ${value} out of 1000`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${c * frac} ${c}`}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="78" textAnchor="middle" fontSize="34" fontWeight="700" fill="var(--ink)">
        {value}
      </text>
    </svg>
  );
}

function FlowRow({
  label,
  amount,
  gross,
  sign,
  strong,
}: {
  label: string;
  amount: number;
  gross: number;
  sign?: "-" | "";
  strong?: boolean;
}) {
  const pct = gross > 0 ? Math.min(100, Math.max(0, (Math.abs(amount) / gross) * 100)) : 0;
  const negative = amount < 0;
  return (
    <div className="py-1.5">
      <div className="flex justify-between text-sm" style={{ fontWeight: strong ? 700 : 400 }}>
        <span>{label}</span>
        <span style={{ color: negative ? "var(--warn)" : undefined }}>
          {sign === "-" ? "− " : ""}
          {fmtMoney(Math.abs(amount))}
          {negative ? " short" : ""}
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full" style={{ background: "var(--line)" }}>
        <div
          className="h-2 rounded-full"
          style={{ width: `${pct}%`, background: negative ? "var(--warn)" : "var(--brand)", opacity: strong ? 1 : 0.55 }}
        />
      </div>
    </div>
  );
}

export default function Overview({ profile }: { profile: Profile }) {
  const score = futureProofScore(profile);
  const cf = cashFlow(profile);
  const t = cf.tax;
  const grossM = t.gross / 12;
  const e = profile.expenses;

  const more = estimateTax(profile.grossIncome, profile.filing, profile.state, profile.retirementPct + 2);
  const extraContribution = more.retirementContribution - t.retirementContribution;
  const taxSaved = totalTax(t) - totalTax(more);
  const takeHomeCost = t.net - more.net;

  const keys = Object.keys(score.components) as ComponentKey[];

  // Numbers quoted in the "How is this calculated?" notes
  const ret = projectRetirement(profile);
  const pctOf = (x: number) => `${Math.round(x)}%`;
  const savingRate = cf.monthlyNet > 0 ? (cf.monthlyRemaining / cf.monthlyNet) * 100 : 0;
  const debtShare = cf.monthlyNet > 0 ? (profile.expenses.debt / cf.monthlyNet) * 100 : 0;
  const std = STANDARD_DEDUCTION[profile.filing];
  const taxable = Math.max(0, t.gross - t.retirementContribution - std);
  const noStateTax = NO_INCOME_TAX_STATES.has(profile.state.toUpperCase());

  return (
    <>
      <Card>
        <div className="flex items-center gap-4">
          <Ring value={score.total} />
          <div>
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              FutureProof Score
            </div>
            <div className="text-2xl font-bold">{score.label}</div>
            <p className="mt-2 text-sm">
              <strong>Strength:</strong> {COMPONENT_LABELS[score.strongest]}
            </p>
            <p className="text-sm">
              <strong>Needs work:</strong> {COMPONENT_LABELS[score.weakest]}
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {keys.map((k) => (
            <li key={k}>
              <div className="flex justify-between text-sm">
                <span>{COMPONENT_LABELS[k]}</span>
                <span>{Math.round(score.components[k] * 100)}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full" style={{ background: "var(--line)" }}>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${Math.round(score.components[k] * 100)}%`, background: "var(--brand)" }}
                />
              </div>
            </li>
          ))}
        </ul>
        <HowCalculated>
          <p>
            Your score is five parts. Each part is graded from 0% to 100%, multiplied by its weight, and the results add
            up to a number out of 1000.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Cash Flow (25%):</strong> money left each month ÷ take-home pay. Saving 20% or more earns 100%. You
              keep {pctOf(savingRate)}.
            </li>
            <li>
              <strong>Emergency Savings (25%):</strong> months of spending you have saved ÷ 6. Six months earns 100%.
            </li>
            <li>
              <strong>Retirement Readiness (20%):</strong> how funded you will be at your goal age (
              {pctOf(ret.fundedPct * 100)}). See the Retire tab.
            </li>
            <li>
              <strong>Debt Load (15%):</strong> monthly debt payments ÷ take-home pay. No debt earns 100%, and 36% or
              more earns 0%. Yours is {pctOf(debtShare)}.
            </li>
            <li>
              <strong>Credit Health (15%):</strong> 60% your FICO score (300 = 0%, 850 = 100%) and 40% your credit usage
              (10% or less = full credit, 50% or more = none). Each late payment in the last 2 years takes off 10
              points, up to 30. With no score entered, only credit usage counts.
            </li>
          </ul>
          <table className="w-full text-left">
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <th className="font-medium">Part</th>
                <th className="font-medium">Grade</th>
                <th className="font-medium">Weight</th>
                <th className="text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k}>
                  <td>{COMPONENT_LABELS[k]}</td>
                  <td>{pctOf(score.components[k] * 100)}</td>
                  <td>{pctOf(SCORE_WEIGHTS[k] * 100)}</td>
                  <td className="text-right">{(score.components[k] * SCORE_WEIGHTS[k] * 1000).toFixed(0)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={3}>Total (out of 1000)</td>
                <td className="text-right">{score.total}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ color: "var(--muted)" }}>
            This is BeFin&apos;s own score for learning. It is not a credit score and no lender sees it.
          </p>
        </HowCalculated>
      </Card>

      <Card title="Where your money goes (per month)">
        <FlowRow label="Gross income" amount={grossM} gross={grossM} strong />
        <FlowRow label="Taxes" amount={totalTax(t) / 12} gross={grossM} sign="-" />
        <FlowRow label="Retirement" amount={t.retirementContribution / 12} gross={grossM} sign="-" />
        <FlowRow label="Housing" amount={e.housing} gross={grossM} sign="-" />
        <FlowRow label="Transportation" amount={e.transportation} gross={grossM} sign="-" />
        <FlowRow label="Utilities" amount={e.utilities} gross={grossM} sign="-" />
        <FlowRow label="Debt" amount={e.debt} gross={grossM} sign="-" />
        <FlowRow label="Lifestyle" amount={e.lifestyle} gross={grossM} sign="-" />
        <FlowRow label="Left over" amount={cf.monthlyRemaining} gross={grossM} strong />
        <Muted>
          {cf.monthlyRemaining >= 0
            ? "This is what is left each month. BeFin assumes it goes into savings."
            : "You are spending more than you take home. Fixing this comes before anything else."}
        </Muted>
        <HowCalculated>
          <p>
            <strong>Gross income</strong> = yearly income ÷ 12 = {fmtMoney(t.gross)} ÷ 12 = {fmtMoney(grossM)}.
          </p>
          <p>
            <strong>Taxes</strong> = federal + Social Security + Medicare + state, added up for the year, ÷ 12 ={" "}
            {fmtMoney(totalTax(t))} ÷ 12 = {fmtMoney(totalTax(t) / 12)}. The next card shows each piece.
          </p>
          <p>
            <strong>Retirement</strong> = {profile.retirementPct}% of your income, ÷ 12 ={" "}
            {fmtMoney(t.retirementContribution / 12)}.
          </p>
          <p>
            <strong>Housing, transportation, utilities, debt, lifestyle</strong> are the amounts you entered.
          </p>
          <p>
            <strong>Left over</strong> = gross − taxes − retirement − your spending = {fmtMoney(cf.monthlyRemaining)}.
            Equivalent: take-home ({fmtMoney(cf.monthlyNet)}) − spending ({fmtMoney(cf.monthlyExpenses)}).
          </p>
        </HowCalculated>
      </Card>

      <Card title="What you really bring home">
        <dl className="space-y-1 text-sm">
          {(
            [
              ["Gross income", t.gross],
              ["Federal income tax", -t.federal],
              ["Social Security", -t.socialSecurity],
              ["Medicare", -t.medicare],
              [`State tax (${profile.state})`, -t.state],
              ["Retirement contribution", -t.retirementContribution],
            ] as [string, number][]
          ).map(([label, v]) => (
            <div key={label} className="flex justify-between">
              <dt>{label}</dt>
              <dd>{v < 0 ? `− ${fmtMoney(-v)}` : fmtMoney(Math.abs(v))}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 font-bold" style={{ borderColor: "var(--line)" }}>
            <dt>Take-home per year</dt>
            <dd>{fmtMoney(t.net)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm">
          Putting 2% more ({fmtMoney(extraContribution)} a year) into retirement could lower your taxes by about{" "}
          <strong>{fmtMoney(taxSaved)}</strong>, so it only trims your take-home by about{" "}
          <strong>{fmtMoney(takeHomeCost)}</strong>.
        </p>
        <Muted>
          Estimates only. Uses 2025 federal brackets and a rough flat state rate. Not tax advice.
        </Muted>
        <HowCalculated>
          <p>
            <strong>1. Retirement comes out first.</strong> {profile.retirementPct}% × {fmtMoney(t.gross)} ={" "}
            {fmtMoney(t.retirementContribution)}. This money is &ldquo;pre-tax,&rdquo; so it lowers your income tax. It
            does not lower Social Security or Medicare.
          </p>
          <p>
            <strong>2. Federal income tax.</strong> The first {fmtMoney(std)} of income is not taxed (the standard
            deduction for your filing status). So the taxed amount is {fmtMoney(t.gross)} −{" "}
            {fmtMoney(t.retirementContribution)} − {fmtMoney(std)} = {fmtMoney(taxable)}. That amount is taxed in layers:
            the first slice at 10%, the next at 12%, and so on. Your federal tax is <strong>{fmtMoney(t.federal)}</strong>.
          </p>
          <p>
            <strong>3. Social Security</strong> = {(SS_RATE * 100).toFixed(1)}% of your income (up to{" "}
            {fmtMoney(SS_WAGE_BASE)}) = {fmtMoney(t.socialSecurity)}. <strong>Medicare</strong> ={" "}
            {(MEDICARE_RATE * 100).toFixed(2)}% of your income = {fmtMoney(t.medicare)}.
          </p>
          <p>
            <strong>4. State tax.</strong>{" "}
            {noStateTax
              ? `${profile.state} has no state income tax on wages, so this is $0.`
              : `${profile.state} taxes wages. BeFin uses a rough flat ${(DEFAULT_STATE_RATE * 100).toFixed(1)}% of income after retirement contributions = ${fmtMoney(t.state)}. Real state rules differ, so treat this as a ballpark.`}
          </p>
          <p>
            <strong>5. Take-home</strong> = income − retirement − all the taxes above = {fmtMoney(t.net)} a year.
          </p>
          <p>
            <strong>The 2% tip:</strong> BeFin re-runs steps 1–5 with your retirement percentage 2 points higher and
            compares the two take-home numbers.
          </p>
        </HowCalculated>
      </Card>
    </>
  );
}
