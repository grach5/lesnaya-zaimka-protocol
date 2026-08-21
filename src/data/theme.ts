// Цвета оформления сайта — редактируются через /admin/ (раздел «Оформление»).
// Значения переопределяют design-токены из global.css (@theme) через
// CSS-переменные в <head> (см. Layout.astro) — сами компоненты не трогаем,
// они уже все используют var(--color-...).
import themeData from "./theme.json";

export type Theme = {
  paper: string;
  paperRaised: string;
  paperSunk: string;
  ink: string;
  burgundy: string;
  gold: string;
  brass: string;
  velvet: string;
};

// Дефолты — те же значения, что в theme.json/global.css на момент запуска.
// Служат страховкой (см. sanitizeHex ниже), а не источником истины.
const FALLBACK: Theme = {
  paper: "#F6F1E4",
  paperRaised: "#FFFDF8",
  paperSunk: "#EAE0C8",
  ink: "#1E140F",
  burgundy: "#812824",
  gold: "#D4AF37",
  brass: "#725729",
  velvet: "#4A1220",
};

/**
 * Поле в админке («Оформление») — обычный текстовый Input без валидации:
 * значение из theme.json подставляется НАПРЯМУЮ, без экранирования, в
 * <style set:html> в Layout.astro (нужно для CSS custom properties — их
 * нельзя передать через обычный атрибут/пропс). Опечатка админа (лишняя
 * кавычка, `</style>`) сломала бы вёрстку всего сайта или того хуже —
 * поэтому здесь, в единственной точке, где theme.json попадает в код,
 * значения проверяются на «похоже на цвет» и иначе тихо откатываются
 * на FALLBACK, а не доверяются как есть.
 */
function sanitizeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;
}

function sanitizeTheme(data: Partial<Theme>): Theme {
  const out = {} as Theme;
  for (const key of Object.keys(FALLBACK) as (keyof Theme)[]) {
    out[key] = sanitizeHex(data[key], FALLBACK[key]);
  }
  return out;
}

export const THEME: Theme = sanitizeTheme(themeData);
