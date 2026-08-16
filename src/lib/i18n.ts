import { withBase } from "./url";
import type { SiteContent, Locale } from "@/i18n/types";
import { LOCALES, DEFAULT_LOCALE, LOCALE_LABELS } from "@/i18n/types";
import { content as ruContent } from "@/i18n/content.ru";
import { content as enContent } from "@/i18n/content.en";
import { content as zhContent } from "@/i18n/content.zh";
import { content as koContent } from "@/i18n/content.ko";

const CONTENT_BY_LOCALE: Partial<Record<Locale, SiteContent>> = {
  ru: ruContent,
  en: enContent,
  zh: zhContent,
  ko: koContent,
};

export function getContent(locale: Locale): SiteContent {
  const c = CONTENT_BY_LOCALE[locale];
  if (!c) throw new Error(`No content registered for locale "${locale}"`);
  return c;
}

export function hasLocale(locale: string): locale is Locale {
  return (LOCALES as readonly string[]).includes(locale) && locale in CONTENT_BY_LOCALE;
}

/** path — без базового префикса, начинается с "/", например "/menu/". */
export function localizedHref(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return withBase(path);
  return withBase(`/${locale}${path}`);
}

export { LOCALES, DEFAULT_LOCALE, LOCALE_LABELS };
export type { Locale, SiteContent };
