"use client";

import type { ComponentKey, Profile, TaxResult } from "@/lib/types";
import {
  COMPONENT_LABELS,
  cashFlow,
  estimateTax,
  fmtMoney,
  futureProofScore,
} from "@/lib/engine";
import { Card, Muted } from "./ui";

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
      </Card>
    </>
  );
}
