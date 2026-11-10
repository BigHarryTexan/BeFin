"use client";

import { useState } from "react";
import type { FilingStatus, Profile } from "@/lib/types";
import { defaultProfile, monthlyExpenses, US_STATES } from "@/lib/engine";
import { Button, Card, Muted, NumberField, SelectField } from "./ui";

export default function Setup({
  initial,
  isFirstTime,
  onSave,
  onCancel,
}: {
  initial: Profile;
  isFirstTime: boolean;
  onSave: (p: Profile) => void;
  onCancel?: () => void;
}) {
  const [p, setP] = useState<Profile>(initial);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));
  const setExp = (k: keyof Profile["expenses"], v: number) =>
    setP((prev) => ({ ...prev, expenses: { ...prev.expenses, [k]: v } }));
  const setCredit = <K extends keyof Profile["credit"]>(
    k: K,
    v: Profile["credit"][K],
  ) => setP((prev) => ({ ...prev, credit: { ...prev.credit, [k]: v } }));

  const valid =
    p.grossIncome > 0 &&
    monthlyExpenses(p) > 0 &&
    p.age >= 16 &&
    p.targetRetirementAge > p.age &&
    p.state !== "";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(p);
      }}
    >
      <div>
        <h1 className="text-2xl font-bold">
          {isFirstTime ? "Welcome to BeFin" : "Your info"}
        </h1>
        <Muted>
          About 5 minutes. No categories to set up and no budget wizard. Round
          numbers are fine, and you can change anything later.
        </Muted>
      </div>

      <Card title="About you">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Age" value={p.age} onChange={(n) => set("age", n)} min={16} max={100} />
          <NumberField
            label="Retire at"
            value={p.targetRetirementAge}
            onChange={(n) => set("targetRetirementAge", n)}
            min={40}
            max={90}
          />
          <NumberField
            label="People in household"
            value={p.householdSize}
            onChange={(n) => set("householdSize", n)}
            min={1}
            max={15}
          />
          <SelectField
            label="State"
            value={p.state}
            onChange={(v) => set("state", v)}
            options={[{ value: "", label: "Select…" }, ...US_STATES.map((s) => ({ value: s, label: s }))]}
          />
          <SelectField<FilingStatus>
            label="Filing status"
            value={p.filing}
            onChange={(v) => set("filing", v)}
            options={[
              { value: "single", label: "Single" },
              { value: "married", label: "Married, filing jointly" },
              { value: "head", label: "Head of household" },
            ]}
          />
        </div>
      </Card>

      <Card title="Income">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Yearly income before taxes"
            value={p.grossIncome}
            onChange={(n) => set("grossIncome", n)}
            prefix="$"
            step={1000}
          />
          <SelectField
            label="Paid"
            value={p.payFrequency}
            onChange={(v) => set("payFrequency", v)}
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "biweekly", label: "Every 2 weeks" },
              { value: "semimonthly", label: "Twice a month" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
          <NumberField
            label="You put into retirement"
            value={p.retirementPct}
            onChange={(n) => set("retirementPct", n)}
            suffix="%"
            max={100}
            step={0.5}
          />
          <NumberField
            label="Employer adds"
            value={p.employerMatchPct}
            onChange={(n) => set("employerMatchPct", n)}
            suffix="%"
            max={100}
            step={0.5}
          />
        </div>
      </Card>

      <Card title="Monthly spending">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Housing" value={p.expenses.housing} onChange={(n) => setExp("housing", n)} prefix="$" step={50} />
          <NumberField label="Transportation" value={p.expenses.transportation} onChange={(n) => setExp("transportation", n)} prefix="$" step={50} />
          <NumberField label="Utilities" value={p.expenses.utilities} onChange={(n) => setExp("utilities", n)} prefix="$" step={25} />
          <NumberField label="Debt payments" value={p.expenses.debt} onChange={(n) => setExp("debt", n)} prefix="$" step={25} hint="Cards, loans" />
          <NumberField label="Everything else" value={p.expenses.lifestyle} onChange={(n) => setExp("lifestyle", n)} prefix="$" step={50} hint="Food, fun, shopping" />
        </div>
      </Card>

      <Card title="Savings and debt">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Emergency savings" value={p.savings} onChange={(n) => set("savings", n)} prefix="$" step={100} />
          <NumberField label="Retirement accounts" value={p.retirementBalance} onChange={(n) => set("retirementBalance", n)} prefix="$" step={1000} />
          <NumberField label="Credit card balance" value={p.cardBalance} onChange={(n) => set("cardBalance", n)} prefix="$" step={100} />
          <NumberField label="Card interest rate" value={p.cardApr} onChange={(n) => set("cardApr", n)} suffix="%" step={0.5} max={100} />
          <NumberField label="Card payment each month" value={p.cardPayment} onChange={(n) => set("cardPayment", n)} prefix="$" step={25} />
        </div>
      </Card>

      <Card title="Credit">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Credit usage"
            value={p.credit.utilization}
            onChange={(n) => setCredit("utilization", n)}
            suffix="%"
            max={100}
            hint="Balances vs. limits"
          />
          <NumberField label="Open accounts" value={p.credit.openAccounts} onChange={(n) => setCredit("openAccounts", n)} />
          <NumberField label="Hard inquiries" value={p.credit.hardInquiries} onChange={(n) => setCredit("hardInquiries", n)} hint="Last 2 years" />
          <NumberField label="Late payments" value={p.credit.latePayments} onChange={(n) => setCredit("latePayments", n)} hint="Last 2 years" />
        </div>
        <Muted>You can add your credit score on the Credit tab.</Muted>
      </Card>

      {!valid && (
        <p className="text-sm font-semibold" style={{ color: "var(--warn)" }}>
          ⚠ Add your age, state, yearly income and at least some monthly spending, with a retirement age later than your current age. Without your spending, the score would be meaningless.
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit">{isFirstTime ? "Build my dashboard" : "Save"}</Button>
        {isFirstTime && (
          <Button variant="ghost" onClick={() => setP(defaultProfile())}>
            Fill with example numbers
          </Button>
        )}
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
