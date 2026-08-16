// Клиентский хелпер: некоторые скрипты (корзина, лайтбоксы) не рендерятся
// Astro-компонентом с доступом к пропсу locale — им нужно определить текущий
// язык прямо из URL браузера, чтобы ссылки со страницы вели на страницу
// того же языка, а не всегда на русскую версию.
import { LOCALES, DEFAULT_LOCALE } from "@/i18n/types";

export function getCurrentLocale(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let path = window.location.pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);
  const seg = path.split("/").filter(Boolean)[0];
  return seg && (LOCALES as readonly string[]).includes(seg) && seg !== DEFAULT_LOCALE ? seg : DEFAULT_LOCALE;
}

/** path — без base и без языкового префикса, например "/menu/". */
export function getCurrentLocalePath(path: string): string {
  const locale = getCurrentLocale();
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}
