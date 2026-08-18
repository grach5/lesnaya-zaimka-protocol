// Ресайз/сжатие фото прямо в браузере перед загрузкой в репозиторий — исходники
// с телефона весят по 3-8 МБ, а сайт отдаёт готовые WebP на 700/1600px (см.
// паттерн thumb/full в gallery.ts и halls.ts). Загружать оригиналы как есть
// раздуло бы репозиторий и замедлило сайт, поэтому админка всегда пересобирает
// файл через canvas перед отправкой в GitHub Contents API.

/**
 * Возвращает base64 (без префикса data:) уменьшенного изображения.
 * format по умолчанию WebP с потерями (quality) — годится для фото. Для
 * логотипа (тонкие линии герба, текст) вызывающий код передаёт "image/png" —
 * без потерь, иначе штриховка размывается на резких краях при сжатии 80-90%.
 */
export function resizeToWebpBase64(
  file: File,
  maxDimension: number,
  quality = 0.82,
  format: "image/webp" | "image/png" = "image/webp",
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas недоступен в этом браузере"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Не удалось сжать изображение"));
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
          };
          reader.onerror = () => reject(new Error("Не удалось прочитать сжатое изображение"));
          reader.readAsDataURL(blob);
        },
        format,
        format === "image/png" ? undefined : quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не удалось открыть файл как изображение"));
    };
    img.src = objectUrl;
  });
}

/** Файл как есть, без пересжатия — для PDF и прочего не-изображения, которое канвас не откроет. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}
