"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import {
  fmtAge,
  fmtMoney,
  NEST_EGG_MULTIPLE,
  projectRetirement,
  REAL_RETURN,
  retirementSpendingPerYear,
} from "@/lib/engine";
import { Card, HowCalculated, Muted, Stat, Trend } from "./ui";

function direction(a: number | null, b: number | null): "better" | "worse" | "same" {
  if (a === b) return "same";
  if (b === null) return "worse";
  if (a === null) return "better";
  return b < a ? "better" : "worse";
}

export default function Retirement({ profile }: { profile: Profile }) {
  const [pct, setPct] = useState(profile.retirementPct);
  const base = projectRetirement(profile);
  const next = projectRetirement(profile, pct);

  const off = base.yearsOffGoal;
  const funded = Math.round(base.fundedPct * 100);
  const nextFunded = Math.round(next.fundedPct * 100);
  const onTrack = off !== null && off <= 0;
  const headline =
    base.projectedAge === null
      ? `At this pace you reach about ${funded}% of your target by age ${profile.targetRetirementAge}. Try the slider below to see what closes the gap.`
      : onTrack
        ? "You are on track to meet your goal."
        : `You are on pace to retire ${off} year${off === 1 ? "" : "s"} after your goal.`;

  const spending = retirementSpendingPerYear(profile);
  const yearlyIn = profile.grossIncome * ((profile.retirementPct + profile.employerMatchPct) / 100);

  return (
    <>
      <Card title="Is future me in trouble?">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Goal retirement age" value={String(profile.targetRetirementAge)} />
          <Stat label="Current projection" value={fmtAge(base.projectedAge)} />
        </div>
        <p className="mt-3 text-sm font-semibold" style={{ color: onTrack ? "var(--brand)" : "var(--warn)" }}>
          {onTrack ? "✓" : "▲"} {headline}
        </p>

        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span>Funded by age {profile.targetRetirementAge}</span>
            <strong>{funded}%</strong>
          </div>
          <div className="mt-1 h-3 rounded-full" style={{ background: "var(--line)" }}>
            <div className="h-3 rounded-full" style={{ width: `${funded}%`, background: "var(--brand)" }} />
          </div>
          <Muted>
            You have {fmtMoney(profile.retirementBalance)} saved today. At this pace it grows to{" "}
            {fmtMoney(base.balanceAtGoal)} by {profile.targetRetirementAge}, out of about{" "}
            {fmtMoney(base.targetBalance)} needed.
          </Muted>
        </div>

        <HowCalculated>
          <p>
            <strong>1. The target.</strong> Retirement needs about {NEST_EGG_MULTIPLE} times a year of spending (the
            &ldquo;4% rule&rdquo;: you can safely withdraw about 4% a year). Your yearly spending, not counting debt
            payments you expect to have paid off, is {fmtMoney(spending)}. So the target is {fmtMoney(spending)} ×{" "}
            {NEST_EGG_MULTIPLE} = <strong>{fmtMoney(base.targetBalance)}</strong>.
          </p>
          <p>
            <strong>2. Your savings grow.</strong> Each year your balance grows by {Math.round(REAL_RETURN * 100)}% (after
            inflation), then you add {fmtMoney(yearlyIn)} (your {profile.retirementPct}% plus your employer&apos;s{" "}
            {profile.employerMatchPct}% of {fmtMoney(profile.grossIncome)}). Starting from{" "}
            {fmtMoney(profile.retirementBalance)} at age {profile.age}, that reaches{" "}
            <strong>{fmtMoney(base.balanceAtGoal)}</strong> at age {profile.targetRetirementAge}.
          </p>
          <p>
            <strong>3. Funded %.</strong> {fmtMoney(base.balanceAtGoal)} ÷ {fmtMoney(base.targetBalance)} ={" "}
            <strong>{funded}%</strong>. This is the number that feeds your FutureProof Grade, so every dollar you save
            moves it.
          </p>
          <p>
            <strong>Projected age.</strong> The first age when your balance reaches the target (up to age 90).
          </p>
          <p style={{ color: "var(--muted)" }}>
            Assumes steady pay, today&apos;s dollars, and that Social Security is not counted. A learning tool, not
            investment advice.
          </p>
        </HowCalculated>
      </Card>

      <Card title="Retirement impact engine">
        <label className="block">
          <span className="text-sm font-medium">
            Contribution: {pct}% of pay{" "}
            {pct !== profile.retirementPct && (
              <span style={{ color: "var(--muted)" }}>(now {profile.retirementPct}%)</span>
            )}
          </span>
          <input
            type="range"
            min={0}
            max={25}
            step={1}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="mt-2 w-full"
            style={{ accentColor: "var(--brand)" }}
          />
        </label>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xl font-bold">
            Retirement age: {fmtAge(base.projectedAge)} → {fmtAge(next.projectedAge)}
          </div>
          <Trend direction={direction(base.projectedAge, next.projectedAge)} />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-xl font-bold">
            Funded by {profile.targetRetirementAge}: {funded}% → {nextFunded}%
          </div>
          <Trend direction={nextFunded > funded ? "better" : nextFunded < funded ? "worse" : "same"} />
        </div>
        <Muted>
          Assumes a {Math.round(REAL_RETURN * 100)}% yearly return after inflation, steady pay, and your employer match (
          {profile.employerMatchPct}%). Social Security is not counted. Education only, not advice.
        </Muted>
      </Card>
    </>
  );
}
