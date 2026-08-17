// Реальные отзывы гостей — собраны с раздела «Отзывы» lesnaya-zaimka-vl.ru/ru/reviews/.
// Данные — в reviews.json (редактируется через /admin/, см. public/admin/config.yml).
import reviewsData from "./reviews.json";

export type Review = { author: string; text: string; highlight?: string };

export const REVIEWS: Review[] = reviewsData.reviews;
