"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {
        /* offline support is a bonus; ignore registration failures */
      });
    }
  }, []);
  return null;
}
