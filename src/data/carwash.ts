// Автомойка — реальный раздел комплекса по прямому запросу клиента.
// Данные — в carwash.json (редактируется через /admin/, см. public/admin/config.yml).
import carwashData from "./carwash.json";

export const CARWASH_CATEGORIES: string[] = carwashData.categories;
