// Реальные данные залов — единственный источник: раздел «Аренда залов»
// lesnaya-zaimka-vl.ru (числа сверены, расхождений с другими страницами сайта-источника нет).
// ДОПУЩЕНИЕ, нужно проверить: фото ниже — реальные фото ресторана из архива сайта,
// но привязка конкретного кадра к конкретному залу НЕ подтверждена (в архиве нет
// подписей «это именно Бордовый зал» и т.п.) — при передаче клиенту сверить визуально.
export type Hall = {
  name: string;
  description: string;
  capacity: string;
  area?: string;
  image: string;
};

export const HALLS: Hall[] = [
  {
    name: "Большой зал",
    description: "Основной зал, 1-й этаж, сцена, танцпол, проектор.",
    capacity: "200–250 чел",
    area: "400 м²",
    image: "/img/gallery/holidays/full/1.webp",
  },
  {
    name: "Летняя терраса",
    description: "Открытая терраса в два этажа — для больших торжеств и мероприятий на свежем воздухе.",
    capacity: "до 500 чел",
    image: "/img/gallery/holidays/full/2.webp",
  },
  {
    name: "Фиолетовый зал",
    description: "Нижний этаж, отдельный выход на улицу, проектор.",
    capacity: "80–100 чел",
    area: "180 м²",
    image: "/img/gallery/corporate/full/1.webp",
  },
  {
    name: "Бордовый зал",
    description: "3-й этаж, ЖК-экран — для торжеств камернее.",
    capacity: "до 40 чел",
    area: "70 м²",
    image: "/img/gallery/wedding/full/1.webp",
  },
  {
    name: "Изумрудный зал",
    description: "2-й этаж, ЖК-экран.",
    capacity: "до 35 чел",
    area: "70 м²",
    image: "/img/gallery/corporate/full/2.webp",
  },
  {
    name: "Банкетный зал",
    description: "2-й этаж, ЖК-экран — самый камерный из шести.",
    capacity: "до 30 чел",
    area: "60 м²",
    image: "/img/gallery/wedding/full/2.webp",
  },
];

export const EVENT_FORMATS = [
  "Организация банкетов и фуршетов",
  "Свадьбы",
  "Корпоративные и частные мероприятия",
  "Кейтеринг и выезд шеф-повара",
  "Служба доставки блюд",
];
