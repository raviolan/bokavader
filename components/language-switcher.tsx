"use client";

import Link from "next/link";
import { useEffect } from "react";

import {
  buildLocalizedHref,
  getCopy,
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_STORAGE_KEY,
  type SiteLanguage,
} from "@/lib/i18n";

type LanguageSwitcherProps = {
  currentLanguage: SiteLanguage;
  date: string;
  month: string;
};

function persistLanguage(language: SiteLanguage) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LanguageSwitcher({ currentLanguage, date, month }: LanguageSwitcherProps) {
  const strings = getCopy(currentLanguage);

  useEffect(() => {
    persistLanguage(currentLanguage);
  }, [currentLanguage]);

  return (
    <div className="language-switcher" aria-label={strings.languageLabel}>
      <Link
        className={`language-button ${currentLanguage === "sv" ? "active" : ""}`}
        href={buildLocalizedHref("sv", { date, month, lang: "sv" })}
        onClick={() => persistLanguage("sv")}
        prefetch={false}
        scroll={false}
      >
        SV
      </Link>
      <Link
        className={`language-button ${currentLanguage === "en" ? "active" : ""}`}
        href={buildLocalizedHref("en", { date, month, lang: "en" })}
        onClick={() => persistLanguage("en")}
        prefetch={false}
        scroll={false}
      >
        EN
      </Link>
    </div>
  );
}

