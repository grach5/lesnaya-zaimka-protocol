// CRM-вебхук — выключен по умолчанию (пустая строка). Пока URL не задан,
// эта функция ничего не делает: единственный канал заявок остаётся WhatsApp,
// как и было. Чтобы подключить CRM (amoCRM, Битрикс24, Zapier/Make,
// Google Apps Script Web App и т.п.), вставьте сюда URL входящего вебхука —
// заявки начнут дублироваться в CRM ПАРАЛЛЕЛЬНО с открытием WhatsApp, ничего
// в остальном сайте менять не нужно.
//
// Требование к вебхуку: должен принимать POST с телом JSON напрямую из
// браузера (без сервера-посредника). Большинство конструкторов вебхуков
// (Zapier "Catch Hook", Make "Custom webhook", Google Apps Script Web App,
// amoCRM/Битрикс24 "Входящий вебхук") это умеют из коробки. Если у вашей CRM
// нет такого URL — понадобится небольшой прокси-сервер, это отдельная задача.
export const CRM_WEBHOOK_URL = "";

export type LeadPayload = {
  source: "reserve" | "event" | "cart";
  name?: string;
  phone?: string;
  date?: string;
  guests?: string | number;
  eventType?: string;
  hall?: string;
  comment?: string;
  items?: { name: string; price: number; qty: number }[];
  total?: number;
  locale: string;
  pageUrl: string;
};

export function sendToCrm(payload: LeadPayload): void {
  if (!CRM_WEBHOOK_URL) return;
  try {
    fetch(CRM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, sentAt: new Date().toISOString() }),
      keepalive: true,
    }).catch(() => {
      // Молча игнорируем сбой вебхука — WhatsApp уже открыт и остаётся
      // надёжным основным каналом независимо от доступности CRM.
    });
  } catch {
    // SSR/окружение без fetch — не критично, тот же принцип: не мешать основному потоку.
  }
}
