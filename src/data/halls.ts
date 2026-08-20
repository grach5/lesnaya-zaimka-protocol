// Реальные данные залов — числа сверены с разделом «Аренда залов»
// lesnaya-zaimka-vl.ru. Фото — реальные кадры, присланные клиентом напрямую.
// Данные — в halls.json (редактируется через /admin/). slug намеренно скрыт
// от редактирования в панели — жёстко привязан к папке public/img/halls/<slug>/.
// photos — явный список пар thumb/full (а не число photoCount + вычисление
// путей 1..N) — так админ-панель может добавлять/удалять/переставлять
// отдельные фото без переименования соседних файлов (см. AdminPanel.tsx,
// HallsSection): новые фото получают уникальное имя по времени загрузки,
// старые остаются под исходными числовыми именами 1..N.webp.
import hallsData from "./halls.json";

export type HallPhoto = { thumb: string; full: string };

export type Hall = {
  name: string;
  slug: string;
  description: string;
  capacity: string;
  area?: string;
  photos: HallPhoto[];
};

export const HALLS: Hall[] = hallsData.halls;

/** thumb (700px) — для карточки карусели; full (1600px) — только для лайтбокса по клику. */
export function hallPhotos(hall: Hall): HallPhoto[] {
  return hall.photos;
}

export const EVENT_FORMATS = hallsData.eventFormats;
