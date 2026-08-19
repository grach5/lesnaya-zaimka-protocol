// Интерактивная Яндекс.Карта поверх надёжного статичного фолбэка (см. map.ts).
// Ключ JS API — публичный идентификатор (не секрет, задуман для встраивания
// прямо в браузер, как Google Maps API key; безопасность обеспечивается
// привязкой к домену на стороне Яндекса), настраивается в админке. Если ключ
// не задан, скрипт заблокирован, или сеть недоступна — на странице молча
// остаётся статичная картинка (data-map-fallback), ничего не ломается: тот
// самый урок из «у клиента карта не открылась» с прежним iframe-виджетом.

interface YmapsGlobal {
  ready(cb: () => void): void;
  Map: new (el: HTMLElement, state: object, options?: object) => YmapsMap;
  Placemark: new (coords: [number, number], properties: object, options: object) => YmapsPlacemark;
  templateLayoutFactory: { createClass(template: string): unknown };
}
interface YmapsMap {
  behaviors: { enable(name: string): void };
  geoObjects: { add(obj: YmapsPlacemark): void };
}
interface YmapsPlacemark {
  events: { add(name: string, cb: () => void): void };
}
declare global {
  interface Window {
    ymaps?: YmapsGlobal;
  }
}

let ymapsLoading: Promise<void> | null = null;

function loadYmaps(apiKey: string): Promise<void> {
  if (window.ymaps) return Promise.resolve();
  if (ymapsLoading) return ymapsLoading;
  ymapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Yandex Maps script failed to load"));
    document.head.appendChild(script);
  });
  return ymapsLoading;
}

function mountMap(container: HTMLElement): void {
  const ymaps = window.ymaps;
  if (!ymaps) return;

  const lat = Number(container.dataset.lat);
  const lon = Number(container.dataset.lon);
  const zoom = Number(container.dataset.zoom || "16");
  const logoUrl = container.dataset.logo || "";
  const routeUrl = container.dataset.route || "#";

  const mapEl = document.createElement("div");
  mapEl.className = "absolute inset-0";
  container.appendChild(mapEl);

  const map = new ymaps.Map(mapEl, { center: [lat, lon], zoom, controls: ["zoomControl"] });
  map.behaviors.enable("scrollZoom");

  // Свой маркер (логотип + указатель) вместо стандартной метки Яндекса — тот
  // же визуал, что и у статичного фолбэка (см. contacts.astro), только здесь
  // это HTML-слой самого ymaps, а не CSS-оверлей поверх картинки.
  const MarkerLayout = ymaps.templateLayoutFactory.createClass(
    `<div style="position:absolute;left:0;top:0;width:130px;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;cursor:pointer;">
       <img src="${logoUrl}" alt="" style="width:100%;height:auto;filter:drop-shadow(0 2px 6px rgba(0,0,0,.55));" />
       <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:11px solid var(--color-burgundy);filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));"></div>
     </div>`,
  );
  const placemark = new ymaps.Placemark(
    [lat, lon],
    {},
    { iconLayout: MarkerLayout, iconShape: { type: "rectangle", coordinates: [[-65, -150], [65, 4]] } },
  );
  placemark.events.add("click", () => window.open(routeUrl, "_blank", "noopener"));
  map.geoObjects.add(placemark);

  const fallback = container.querySelector<HTMLElement>("[data-map-fallback]");
  if (fallback) fallback.style.display = "none";
}

/** Ищет все блоки [data-yandex-map] на странице и поднимает на них интерактивную карту. */
export function initInteractiveMaps(): void {
  const containers = document.querySelectorAll<HTMLElement>("[data-yandex-map]");
  containers.forEach((container) => {
    const apiKey = container.dataset.apiKey;
    if (!apiKey) return; // ключ не настроен в админке — остаёмся на статичной картинке
    loadYmaps(apiKey)
      .then(() => window.ymaps!.ready(() => mountMap(container)))
      .catch(() => {
        // статичный фолбэк уже на месте — намеренно ничего не делаем
      });
  });
}
