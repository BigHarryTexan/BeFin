"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { fmtAge, fmtMoney, projectRetirement, REAL_RETURN } from "@/lib/engine";
import { Card, Muted, Stat, Trend } from "./ui";

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
  const headline =
    base.projectedAge === null
      ? "At this pace you will not reach your target before 90."
      : off === null || off <= 0
        ? "You are on track to meet your goal."
        : `You are on pace to retire ${off} year${off === 1 ? "" : "s"} after your goal.`;

  return (
    <>
      <Card title="Is future me in trouble?">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Goal retirement age" value={String(profile.targetRetirementAge)} />
          <Stat label="Current projection" value={fmtAge(base.projectedAge)} />
        </div>
        <p
          className="mt-3 text-sm font-semibold"
          style={{ color: off !== null && off <= 0 ? "var(--brand)" : "var(--warn)" }}
        >
          {off !== null && off <= 0 ? "✓" : "▲"} {headline}
        </p>
        <Muted>
          Target nest egg: {fmtMoney(base.targetBalance)} (25 times a year of spending, with debt paid off).
        </Muted>
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
        <Muted>
          Assumes a {Math.round(REAL_RETURN * 100)}% yearly return after inflation, steady pay, and your employer match
          ({profile.employerMatchPct}%). Social Security is not counted. Education only, not advice.
        </Muted>
      </Card>
    </>
  );
}
