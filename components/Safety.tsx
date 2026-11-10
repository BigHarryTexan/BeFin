"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { cashFlow, fmtMoney, runway } from "@/lib/engine";
import { Button, Card, Muted, Stat } from "./ui";

export default function Safety({ profile }: { profile: Profile }) {
  const [simulating, setSimulating] = useState(false);
  const cf = cashFlow(profile);
  const rw = runway(profile.savings, cf.monthlyExpenses);
  const finite = Number.isFinite(rw.months);
  const progress = finite ? Math.min(1, rw.months / rw.recommendedMonths) : 1;
  const onTrack = rw.gapMonths === 0;

  return (
    <>
      <Card title="Emergency fund monitor">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Days" value={finite ? String(rw.days) : "—"} />
          <Stat label="Months" value={finite ? rw.months.toFixed(1) : "—"} />
          <Stat label="Target" value={`${rw.recommendedMonths} mo`} />
        </div>

        <div className="mt-4 h-3 rounded-full" style={{ background: "var(--line)" }}>
          <div
            className="h-3 rounded-full"
            style={{ width: `${Math.round(progress * 100)}%`, background: onTrack ? "var(--brand)" : "var(--warn)" }}
          />
        </div>
        <p className="mt-3 text-sm font-semibold" style={{ color: onTrack ? "var(--brand)" : "var(--warn)" }}>
          {onTrack
            ? "✓ You have a full 6-month cushion."
            : `▲ ${rw.gapMonths.toFixed(1)} months short of your goal`}
        </p>
        {!onTrack && (
          <Muted>
            That is about {fmtMoney(rw.gapDollars)} more to save. Six months of expenses is the usual target.
          </Muted>
        )}
      </Card>

      <Card title="Job loss simulator">
        {!simulating ? (
          <Button onClick={() => setSimulating(true)}>What if I lost my job tomorrow?</Button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Savings" value={fmtMoney(profile.savings)} />
              <Stat label="Monthly costs" value={fmtMoney(cf.monthlyExpenses)} />
              <Stat label="You'd last" value={finite ? `${rw.days} days` : "—"} />
            </div>
            <p className="text-sm">
              {finite
                ? `With no paycheck, your savings would cover your bills for about ${rw.days} days (${rw.months.toFixed(1)} months).`
                : "Enter your monthly expenses to see how long your savings would last."}
            </p>
            <Muted>
              Does not count unemployment benefits, severance, or cutting back. It is a worst-case planning number.
            </Muted>
            <Button variant="ghost" onClick={() => setSimulating(false)}>
              Close
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
