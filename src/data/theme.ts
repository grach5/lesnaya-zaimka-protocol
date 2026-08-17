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

export const THEME: Theme = themeData;
