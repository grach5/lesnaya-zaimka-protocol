/* Локальные оптимизированные фотографии (WebP), сжаты из оригиналов lesnaya-zaimka-vl.ru — thumb для сетки, full для лайтбокса.
   Данные — в gallery.json (редактируется через /admin/), этот файл — тонкая типизированная обёртка. */
import galleryData from "./gallery.json";

export type GalleryImage = { full: string; thumb: string; source: string };
export type GallerySection = { name: string; images: GalleryImage[] };
export type GalleryData = { sections: GallerySection[] };

export const ZAIMKA_GALLERY: GalleryData = galleryData;
