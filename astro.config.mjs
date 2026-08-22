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
      // /admin/ — демо-панель администратора (своя noindex-разметка, см.
      // src/pages/admin/index.astro), но @astrojs/sitemap не читает meta
      // robots из HTML, так что без явного фильтра она молча попадала
      // в открытый sitemap.xml — нашли аудитом, закрываем тут и в robots.txt.
      // /choose-font/ — временная страница для показа клиенту вариантов
      // шрифта (см. src/pages/choose-font.astro), удалить фильтр вместе
      // со страницей после того, как решение будет принято.
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/admin/') && !page.endsWith('/choose-font/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});