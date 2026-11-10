"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { defaultProfile } from "@/lib/engine";
import Setup from "./Setup";
import Overview from "./Overview";
import Safety from "./Safety";
import Retirement from "./Retirement";
import Credit from "./Credit";
import WhatIfPanel from "./WhatIfPanel";
import { Button } from "./ui";

const STORAGE_KEY = "befin.profile.v1";

type Tab = "overview" | "safety" | "retirement" | "credit" | "whatif";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◎" },
  { id: "safety", label: "Safety", icon: "⛨" },
  { id: "retirement", label: "Retire", icon: "☼" },
  { id: "credit", label: "Credit", icon: "▤" },
  { id: "whatif", label: "What If", icon: "⇄" },
];

function load(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Profile>;
    const d = defaultProfile();
    // Merge so profiles saved by older versions keep working.
    return {
      ...d,
      ...saved,
      expenses: { ...d.expenses, ...saved.expenses },
      credit: { ...d.credit, ...saved.credit },
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    // Read once on mount; localStorage does not exist during static export.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(load());
    setReady(true);
  }, []);

  function save(p: Profile) {
    setProfile(p);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      /* private mode or full storage: keep working in memory */
    }
  }

  function reset() {
    if (!confirm("Erase everything BeFin has saved on this device?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setProfile(null);
    setEditing(false);
  }

  if (!ready) return null;

  if (!profile || editing) {
    return (
      <main className="mx-auto max-w-xl p-4 pb-12">
        <Setup
          initial={profile ?? defaultProfile()}
          isFirstTime={!profile}
          onSave={(p) => {
            save(p);
            setEditing(false);
            setTab("overview");
          }}
          onCancel={profile ? () => setEditing(false) : undefined}
        />
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <header className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-xl font-bold">BeFin</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Show how today&apos;s choices shape tomorrow&apos;s options.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Edit my info
          </Button>
        </div>
      </header>

      <main className="space-y-4 px-4 pb-28">
        {tab === "overview" && <Overview profile={profile} />}
        {tab === "safety" && <Safety profile={profile} />}
        {tab === "retirement" && <Retirement profile={profile} />}
        {tab === "credit" && <Credit profile={profile} onChange={save} />}
        {tab === "whatif" && <WhatIfPanel profile={profile} />}

        <p className="pt-4 text-center text-xs" style={{ color: "var(--muted)" }}>
          Your data stays on this device. BeFin gives estimates for learning, not
          tax or investment advice.{" "}
          <button className="underline" onClick={reset}>
            Erase my data
          </button>
        </p>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 border-t"
        style={{ background: "var(--card)", borderColor: "var(--line)" }}
      >
        <ul className="mx-auto flex max-w-xl">
          {TABS.map((t) => (
            <li key={t.id} className="flex-1">
              <button
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className="flex w-full flex-col items-center py-2 text-xs"
                style={{
                  color: tab === t.id ? "var(--brand)" : "var(--muted)",
                  fontWeight: tab === t.id ? 700 : 500,
                }}
              >
                <span className="text-lg" aria-hidden>
                  {t.icon}
                </span>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
