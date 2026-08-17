// Статичная картинка карты вместо встроенного интерактивного iframe — по
// прямой правке клиента («разберись почему у клиента карта не открылась»):
// интерактивный виджет (yandex.ru/map-widget/v1/) — это полноценное JS-приложение
// внутри iframe за экраном согласия на cookies; в браузерах со строгой блокировкой
// сторонних cookies/трекеров (Safari ITP, Firefox strict, Brave, многие корпоративные
// сети) карта может молча не отрисоваться. Обычная картинка (Yandex Static Maps API,
// без ключа, бесплатно) не зависит ни от cookies, ни от JS — грузится как любой
// <img>, максимально надёжно, и вдобавок легче интерактивной карты.
// Максимальный размер бесплатного API — 650x450, поэтому в разметке картинка
// растягивается через object-fit: cover, а не запрашивается большего размера.
export function staticMapUrl(lat: number, lon: number, zoom = 16): string {
  return `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=${zoom}&l=map&pt=${lon},${lat},pm2rdm&size=650,450`;
}

export function mapRouteUrl(lat: number, lon: number): string {
  return `https://yandex.ru/maps/?rtext=~${lat}%2C${lon}`;
}
