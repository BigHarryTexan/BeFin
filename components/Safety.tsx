"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { cashFlow, fmtMoney, runway } from "@/lib/engine";
import { Button, Card, HowCalculated, Muted, Stat } from "./ui";

export default function Safety({ profile }: { profile: Profile }) {
  const [simulating, setSimulating] = useState(false);
  const cf = cashFlow(profile);
  const rw = runway(profile.savings, cf.monthlyExpenses);
  const finite = Number.isFinite(rw.months);
  const progress = finite ? Math.min(1, rw.months / rw.recommendedMonths) : 1;
  const onTrack = rw.gapMonths === 0;
  const e = profile.expenses;

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

        <HowCalculated>
          <p>
            <strong>Monthly spending</strong> = housing {fmtMoney(e.housing)} + transportation {fmtMoney(e.transportation)}{" "}
            + utilities {fmtMoney(e.utilities)} + debt payments {fmtMoney(e.debt)} + everything else{" "}
            {fmtMoney(e.lifestyle)} = <strong>{fmtMoney(cf.monthlyExpenses)}</strong>.
          </p>
          <p>
            <strong>Months covered</strong> = savings ÷ monthly spending = {fmtMoney(profile.savings)} ÷{" "}
            {fmtMoney(cf.monthlyExpenses)} = <strong>{finite ? rw.months.toFixed(1) : "—"}</strong>.
          </p>
          <p>
            <strong>Days</strong> = months × 30. <strong>Target</strong> = {rw.recommendedMonths} months of spending ={" "}
            {fmtMoney(rw.recommendedMonths * cf.monthlyExpenses)}. <strong>Gap</strong> = target − savings ={" "}
            {fmtMoney(rw.gapDollars)}.
          </p>
          <p style={{ color: "var(--muted)" }}>
            Six months is a common rule of thumb. Some people aim for 3 if their job is very stable, or more if their
            income varies.
          </p>
        </HowCalculated>
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
            <HowCalculated>
              <p>
                Same math as above: savings ÷ monthly spending, then × 30 days. {fmtMoney(profile.savings)} ÷{" "}
                {fmtMoney(cf.monthlyExpenses)} = {finite ? rw.months.toFixed(2) : "—"} months ={" "}
                <strong>{finite ? rw.days : "—"} days</strong>.
              </p>
              <p>
                It assumes every bill keeps coming and no money comes in. In real life you could cut spending or collect
                unemployment, so treat it as a worst case.
              </p>
            </HowCalculated>
            <Button variant="ghost" onClick={() => setSimulating(false)}>
              Close
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
