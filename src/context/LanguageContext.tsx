import React, { createContext, use, useState, ReactNode } from "react";

import en from "@/src/locales/en.json";
import ka from "@/src/locales/ka.json";

import { AppLangCode } from "../constants";

type TranslationData = typeof en;

interface LanguageContextProps {
  language: AppLangCode;
  setLanguage: (lang: AppLangCode) => void;
  t: TranslationData;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(
  undefined
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<AppLangCode>(AppLangCode.KA); // Default to Georgian

  const translations: Record<AppLangCode, TranslationData> = {
    [AppLangCode.EN]: en,
    [AppLangCode.KA]: ka,
  };

  const t = translations[language];

  return (
    <LanguageContext value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = use(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
