"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "registro-gastos:modo-privado";

type PrivacyContextValue = {
  hidden: boolean;
  toggle: () => void;
};

const PrivacyContext = createContext<PrivacyContextValue>({ hidden: false, toggle: () => {} });

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage puede fallar (modo privado del navegador); se ignora.
    }
  }, []);

  function toggle() {
    setHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // no hay donde guardarlo, sigue funcionando solo en memoria
      }
      return next;
    });
  }

  return <PrivacyContext.Provider value={{ hidden, toggle }}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
