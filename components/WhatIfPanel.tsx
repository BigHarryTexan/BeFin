"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { futureImpacts, type WhatIf } from "@/lib/engine";
import { Button, Card, Muted, Trend } from "./ui";

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm font-medium">
        <span>{label}</span>
        <span>{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
        style={{ accentColor: "var(--brand)" }}
      />
    </label>
  );
}

export default function WhatIfPanel({ profile }: { profile: Profile }) {
  const initial: WhatIf = { retirementPct: profile.retirementPct, extraMonthlySavings: 0, extraCardPayment: 0 };
  const [w, setW] = useState<WhatIf>(initial);
  const impacts = futureImpacts(profile, w);
  const changed =
    w.retirementPct !== initial.retirementPct || w.extraMonthlySavings > 0 || w.extraCardPayment > 0;

  return (
    <>
      <Card title="Change one thing, see your future">
        <div className="space-y-5">
          <Slider
            label="Retirement contribution"
            value={w.retirementPct}
            min={0}
            max={25}
            step={1}
            format={(n) => `${n}% of pay`}
            onChange={(n) => setW({ ...w, retirementPct: n })}
          />
          <Slider
            label="Save extra each month"
            value={w.extraMonthlySavings}
            min={0}
            max={1000}
            step={25}
            format={(n) => `$${n}`}
            onChange={(n) => setW({ ...w, extraMonthlySavings: n })}
          />
          {profile.cardBalance > 0 && (
            <Slider
              label="Pay extra on your card"
              value={w.extraCardPayment}
              min={0}
              max={1000}
              step={25}
              format={(n) => `$${n}`}
              onChange={(n) => setW({ ...w, extraCardPayment: n })}
            />
          )}
        </div>
        {changed && (
          <div className="mt-4">
            <Button variant="ghost" onClick={() => setW(initial)}>
              Reset
            </Button>
          </div>
        )}
      </Card>

      <Card title="Future impact">
        <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
          {impacts.map((i) => (
            <li key={i.title} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {i.title}
                </div>
                <div className="text-lg font-bold">
                  {i.before} → {i.after}
                </div>
              </div>
              <Trend direction={i.direction} />
            </li>
          ))}
        </ul>
        <Muted>
          Money left over after your bills is assumed to go into savings. Extra card payments come out of that same
          money. Estimates for learning, not advice.
        </Muted>
      </Card>
    </>
  );
}
