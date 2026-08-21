// Реальная хронология, проверенная по lesnaya-zaimka-vl.ru (раздел «История»).
// Данные — в history.json (редактируется через /admin/, см. src/components/AdminPanel.tsx).
import historyData from "./history.json";

export type HistoryEntry = {
  year: string;
  title: string;
  body: string;
};

export const HISTORY: HistoryEntry[] = historyData.entries;
export const OWNER_QUOTE = historyData.ownerQuote;
export const GUEST_QUOTES = historyData.guestQuotes;
