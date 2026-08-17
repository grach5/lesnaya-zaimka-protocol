// Реальные данные залов — числа сверены с разделом «Аренда залов»
// lesnaya-zaimka-vl.ru. Фото — реальные кадры, присланные клиентом напрямую.
// Данные — в halls.json (редактируется через /admin/, см.
// public/admin/config.yml); slug и photoCount там намеренно скрыты от
// редактирования в CMS (widget: hidden) — они жёстко привязаны к реальным
// файлам в public/img/halls/<slug>/{thumb,full}/1..N.webp, и правка этих
// полей без одновременной загрузки/переименования файлов сломает фото.
import hallsData from "./halls.json";

export type Hall = {
  name: string;
  slug: string;
  description: string;
  capacity: string;
  area?: string;
  photoCount: number;
};

export const HALLS: Hall[] = hallsData.halls;

export type HallPhoto = { thumb: string; full: string };

// thumb (700px) — для карточки карусели; full (1600px) — только для лайтбокса
// по клику. Тот же паттерн thumb/full, что уже используется в общей галерее
// (src/data/gallery.ts).
export function hallPhotos(hall: Hall): HallPhoto[] {
  return Array.from({ length: hall.photoCount }, (_, i) => ({
    thumb: `/img/halls/${hall.slug}/thumb/${i + 1}.webp`,
    full: `/img/halls/${hall.slug}/full/${i + 1}.webp`,
  }));
}

export const EVENT_FORMATS = hallsData.eventFormats;
