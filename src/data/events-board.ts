// Афиша / события — по прямому запросу клиента («плашка «События/Новости/
// Афиша» куда будут добавляться афиши»). Реальных предстоящих событий клиент
// пока не присылал — массив стартует пустым, а не выдуманными датами/названиями.
// Чтобы добавить событие, допишите объект в массив ниже:
// { title: "Название", date: "2026-08-20", description: "Короткое описание", image: "/img/events/....webp" }
export type PosterEvent = {
  title: string;
  date: string;
  description?: string;
  image?: string;
};

export const UPCOMING_EVENTS: PosterEvent[] = [];
