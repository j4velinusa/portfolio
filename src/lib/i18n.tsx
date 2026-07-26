"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "tr";
export type Bi<T = string> = { en: T; tr: T };

type Ctx = { lang: Lang; setLang: (l: Lang) => void };

const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "tr" || saved === "en") {
      setLangState(saved);
    } else if (navigator.language?.toLowerCase().startsWith("tr")) {
      setLangState("tr");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* ignore */
    }
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
