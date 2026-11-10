"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { creditSummary, utilizationInsight } from "@/lib/engine";
import { Button, Card, Muted, NumberField, Stat, Trend } from "./ui";

const LINKS = [
  { name: "Credit Karma", note: "Score monitoring and credit changes", href: "https://www.creditkarma.com" },
  { name: "Equifax", note: "Credit reports", href: "https://www.equifax.com" },
  { name: "Experian", note: "Score access and credit monitoring", href: "https://www.experian.com" },
  { name: "TransUnion", note: "Credit reports", href: "https://www.transunion.com" },
  { name: "AnnualCreditReport.com", note: "Free weekly reports from all three bureaus", href: "https://www.annualcreditreport.com" },
];

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const min = Math.min(...scores) - 10;
  const max = Math.max(...scores) + 10;
  const pts = scores
    .map((s, i) => `${(i / (scores.length - 1)) * 280 + 10},${60 - ((s - min) / (max - min)) * 50}`)
    .join(" ");
  return (
    <svg viewBox="0 0 300 70" className="mt-3 h-16 w-full" role="img" aria-label={`Score history, ${scores.join(", ")}`}>
      <polyline points={pts} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function Credit({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const cs = creditSummary(profile);
  const [score, setScore] = useState(0);
  // Local calendar date (toISOString would give the UTC date, a day ahead in the evening).
  const [date, setDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [error, setError] = useState("");

  const history = profile.credit.history
    .map((e, i) => ({ e, i }))
    .sort((a, b) => b.e.date.localeCompare(a.e.date));
  const chronological = [...profile.credit.history].sort((a, b) => a.date.localeCompare(b.date)).map((e) => e.score);

  function add() {
    if (!Number.isFinite(score) || score < 300 || score > 850) {
      setError("Enter a FICO score between 300 and 850.");
      return;
    }
    setError("");
    onChange({ ...profile, credit: { ...profile.credit, history: [...profile.credit.history, { date, score }] } });
    setScore(0);
  }

  function remove(index: number) {
    onChange({
      ...profile,
      credit: { ...profile.credit, history: profile.credit.history.filter((_, i) => i !== index) },
    });
  }

  const c = profile.credit;

  return (
    <>
      <Card title="Is my borrowing power improving?">
        {cs.current === null ? (
          <Muted>Add your FICO score below to start tracking it.</Muted>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Current" value={String(cs.current)} />
              <Stat label="Previous" value={cs.previous === null ? "—" : String(cs.previous)} />
              <Stat label="Change" value={cs.change === null ? "—" : `${cs.change > 0 ? "+" : ""}${cs.change}`} />
            </div>
            {cs.change !== null && (
              <div className="mt-2">
                <Trend direction={cs.change > 0 ? "better" : cs.change < 0 ? "worse" : "same"} />
              </div>
            )}
            <Sparkline scores={chronological} />
          </>
        )}
      </Card>

      <Card title="Log a new score">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="FICO score" value={score} onChange={setScore} min={300} max={850} />
          <label className="block">
            <span className="text-sm font-medium">Date recorded</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--line)", background: "var(--bg)" }}
            />
          </label>
        </div>
        {error && (
          <p className="mt-2 text-sm font-semibold" style={{ color: "var(--warn)" }}>
            ▲ {error}
          </p>
        )}
        <div className="mt-3">
          <Button onClick={add}>Save score</Button>
        </div>
        {history.length > 0 && (
          <ul className="mt-4 divide-y text-sm" style={{ borderColor: "var(--line)" }}>
            {history.slice(0, 8).map(({ e, i }) => (
              <li key={`${e.date}-${i}`} className="flex items-center justify-between py-1.5">
                <span>
                  {e.date} · <strong>{e.score}</strong>
                </span>
                <button className="underline" style={{ color: "var(--muted)" }} onClick={() => remove(i)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Credit health factors">
        <p className="text-sm font-semibold">{utilizationInsight(c.utilization)}</p>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Credit usage</dt>
            <dd>{c.utilization}%</dd>
          </div>
          <div className="flex justify-between">
            <dt>Open accounts</dt>
            <dd>{c.openAccounts}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Hard inquiries</dt>
            <dd>{c.hardInquiries}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Late payments (24 mo)</dt>
            <dd>{c.latePayments}</dd>
          </div>
        </dl>
        <Muted>
          {c.latePayments > 0
            ? "On-time payments are the biggest factor in your score. Keep every account current from here."
            : "No late payments. That is the biggest factor in your score, so protect it."}
        </Muted>
      </Card>

      <Card title="Credit resources">
        <ul className="space-y-2">
          {LINKS.map((l) => (
            <li key={l.name}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border p-3"
                style={{ borderColor: "var(--line)" }}
              >
                <span className="font-semibold" style={{ color: "var(--brand)" }}>
                  {l.name} ↗
                </span>
                <span className="block text-sm" style={{ color: "var(--muted)" }}>
                  {l.note}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <Muted>BeFin never asks for your bureau logins. These links open the official sites.</Muted>
      </Card>
    </>
  );
}
