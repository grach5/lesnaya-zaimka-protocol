// Структура навигации — по прямому запросу клиента («структурированное меню
// с разделами, по типу сайта кедрового дома»): комплекс объединяет несколько
// бизнесов (ресторан, отель-партнёр Villa ArtE, банкетный комплекс, автомойка),
// и в шапке это должно быть видно как явные разделы, а не плоский список.
// Ссылки на отель — реальные страницы villa-arte.ru (внешний партнёр, тот же
// комплекс), не выдуманы: услуга «Сауна» подтверждена на villa-arte.ru/finskaya-sauna/.
export type NavLink = { label: string; href: string; external?: boolean };
export type NavGroup = { label: string; items: NavLink[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Ресторан",
    items: [
      { label: "История", href: "/history/" },
      { label: "Основное меню", href: "/menu/" },
      { label: "Детское меню (PDF)", href: "/pdf/detskoe-menu.pdf" },
      { label: "Барное меню (PDF)", href: "/pdf/bar-menu.pdf" },
      { label: "Интерьер", href: "/gallery/" },
    ],
  },
  {
    label: "Отель Villa ArtE",
    items: [
      { label: "Забронировать номер", href: "https://villa-arte.ru/", external: true },
      { label: "Сауна", href: "https://villa-arte.ru/finskaya-sauna/", external: true },
      { label: "Услуги отеля", href: "https://villa-arte.ru/", external: true },
    ],
  },
  {
    label: "Банкетный комплекс",
    items: [
      { label: "Аренда залов", href: "/events/" },
      { label: "Банкетное меню (PDF)", href: "/pdf/banketnoe-menu.pdf" },
      { label: "Мероприятия и кейтеринг", href: "/events/#form" },
    ],
  },
];

export const NAV_SINGLE: NavLink[] = [
  { label: "Автомойка", href: "/carwash/" },
  { label: "Отзывы", href: "/reviews/" },
  { label: "Галерея", href: "/gallery/" },
  { label: "Контакты", href: "/contacts/" },
];
