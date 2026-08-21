/* Реальные данные меню, собранные с lesnaya-zaimka-vl.ru/ru/menu/ (все 13 разделов).
   Сами данные — в menu.json (это позволяет редактировать меню через
   панель /admin/, см. src/components/AdminPanel.tsx), этот файл только типизирует
   и реэкспортирует их, ничего в остальном коде менять не нужно. */
import menuData from "./menu.json";

export type MenuCategory = { name: string; items: { name: string; price: number }[] };
export type MenuData = { categories: MenuCategory[] };

export const ZAIMKA_MENU: MenuData = menuData;
