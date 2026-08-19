// Реальные контакты — сверены с разделом «Контакты» lesnaya-zaimka-vl.ru.
// Данные — в contacts.json (редактируется через CMS-панель /admin/, см.
// public/admin/config.yml); tel:/wa.me-ссылки здесь выводятся АВТОМАТИЧЕСКИ
// из номеров телефона, а не хранятся отдельно — так редактор в CMS не может
// поменять видимый номер, забыв поправить ссылку (было бы реальным риском
// при ручном дублировании).
import contactsData from "./contacts.json";

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export const CONTACTS = {
  name: contactsData.name,
  address: contactsData.address,
  phoneTable: contactsData.phoneTable,
  phoneTableHref: `tel:+${digitsOnly(contactsData.phoneTable)}`,
  phoneEvents: contactsData.phoneEvents,
  phoneEventsHref: `tel:+${digitsOnly(contactsData.phoneEvents)}`,
  whatsapp: `https://wa.me/${digitsOnly(contactsData.phoneTable)}`,
  telegram: contactsData.telegram,
  hours: contactsData.hours,
  hotel: { name: contactsData.hotelName, url: contactsData.hotelUrl },
  yandexOrgId: contactsData.yandexOrgId,
  dgisUrl: contactsData.dgisUrl,
  // Ключ JS API Яндекс.Карт — публичный идентификатор (не секрет, задуман для
  // использования прямо в браузере, как Google Maps API key), домен-привязан
  // на стороне Яндекса. Пустая строка — интерактивная карта не подключается,
  // сайт остаётся на надёжной статичной картинке (см. lib/yandexMap.ts).
  yandexMapsApiKey: contactsData.yandexMapsApiKey ?? "",
  lat: contactsData.lat,
  lon: contactsData.lon,
};
