"use client";

import { useState, type ReactNode } from "react";

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 shadow-sm ${className}`}
      style={{ background: "var(--card)", borderColor: "var(--line)" }}
    >
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm" style={{ color: "var(--muted)" }}>
      {children}
    </p>
  );
}

export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {note && <Muted>{note}</Muted>}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  hint?: string;
}) {
  // Keep the raw text so "0." or "0.5" can be typed; show empty (placeholder 0) when the value is 0.
  const [text, setText] = useState("");
  const shown = (Number(text) || 0) === value ? text : value === 0 ? "" : String(value);
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div
        className="mt-1 flex items-center rounded-lg border px-3"
        style={{ borderColor: "var(--line)", background: "var(--bg)" }}
      >
        {prefix && <span style={{ color: "var(--muted)" }}>{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          className="w-full bg-transparent px-2 py-2 outline-none"
          placeholder="0"
          value={shown}
          step="any"
          min={min}
          max={max}
          onChange={(e) => {
            setText(e.target.value);
            onChange(e.target.value === "" ? 0 : Number(e.target.value) || 0);
          }}
        />
        {suffix && <span style={{ color: "var(--muted)" }}>{suffix}</span>}
      </div>
      {hint && <Muted>{hint}</Muted>}
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="mt-1 w-full rounded-lg border px-3 py-2"
        style={{ borderColor: "var(--line)", background: "var(--bg)" }}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
}) {
  const primary = variant === "primary";
  return (
    <button
      type={type}
      onClick={onClick}
      className="rounded-xl px-4 py-2.5 font-semibold"
      style={
        primary
          ? { background: "var(--brand)", color: "#fff" }
          : { border: "1px solid var(--line)", color: "var(--ink)" }
      }
    >
      {children}
    </button>
  );
}

/** Status chip: always pairs a symbol and a word with the color. */
export function Trend({ direction }: { direction: "better" | "worse" | "same" }) {
  const map = {
    better: { sym: "▲", text: "Better", color: "var(--brand)" },
    worse: { sym: "▼", text: "Worse", color: "var(--warn)" },
    same: { sym: "■", text: "No change", color: "var(--muted)" },
  }[direction];
  return (
    <span className="text-sm font-semibold" style={{ color: map.color }}>
      {map.sym} {map.text}
    </span>
  );
}
