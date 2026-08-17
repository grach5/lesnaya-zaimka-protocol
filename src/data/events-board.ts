// Афиша / события — по прямому запросу клиента. Данные — в events-board.json
// (редактируется через /admin/, см. public/admin/config.yml), включая
// загрузку фото афиши прямо из панели.
import eventsData from "./events-board.json";

export type PosterEvent = {
  title: string;
  date: string;
  description?: string;
  image?: string;
};

export const UPCOMING_EVENTS: PosterEvent[] = eventsData.events;
