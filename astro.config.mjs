// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://grach5.github.io',
  base: '/lesnaya-zaimka-protocol',
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en', 'zh', 'ko'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      // Локализованные /en|zh|ko/404/ — обычные статические маршруты (не
      // распознаются как спец-страница ошибки, в отличие от корневого
      // 404.astro, который @astrojs/sitemap и так не индексирует) —
      // исключаем вручную, чтобы не индексировать страницу "не найдено".
      filter: (page) => !page.endsWith('/404/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});