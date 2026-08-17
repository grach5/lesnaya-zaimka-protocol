// Реальная хронология, проверенная по lesnaya-zaimka-vl.ru (раздел «История»).
// Данные — в history.json (редактируется через /admin/, см. public/admin/config.yml).
import historyData from "./history.json";

export type HistoryEntry = {
  year: string;
  title: string;
  body: string;
};

export const HISTORY: HistoryEntry[] = historyData.entries;
export const OWNER_QUOTE = historyData.ownerQuote;
export const GUEST_QUOTES = historyData.guestQuotes;
