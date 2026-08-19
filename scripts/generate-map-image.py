"""Собирает public/img/map-location.webp — статичную картинку карты для
contacts.astro / ReviewsWidgets.astro, без API-ключа Яндекса.

Один прямой снимок Yandex Static Maps API (без ключа, бесплатно, максимум
650x450px) на зум {ZOOM} — по прямой правке клиента («сделай немного ближе»).
Раньше здесь была склейка из нескольких тайлов ради более чёткой картинки на
широкий блок, но она оказалась хрупкой — на стыках/при правках вылезали
артефакты («каша», обрезанные подписи). Проще и надёжнее: один снимок как
есть, а под маркером — единственная точечная правка ниже.

На этом зуме Яндекс сам подписывает организацию прямо на тайле («Лесная
Заимка» + иконка вилки-ножа, рядом «Villa ArtE» + иконка кровати) — в той же
точке, где сайт потом рисует свой логотип-маркер поверх картинки. Маркер их
не перекрывает целиком, получается каша из наложенных текстов. Поэтому
скрипт вырезает эту область и заменяет куском той же местности, снятым на
зум мельче (там Яндекс подписи ещё не рисует), увеличенным до нужного
размера — то есть настоящей текстурой карты, а не заливкой цветом.

Запускать: uv run --with pillow --with requests python scripts/generate-map-image.py
Перезапускать при смене адреса/координат ресторана (см. src/data/contacts.json).
"""

import io
import math

import requests
from PIL import Image

LAT, LON = 43.265668, 132.072916  # см. src/data/contacts.json -> lat/lon
ZOOM = 17  # клиент попросил отдалить с 18 — было «слишком близко»
DONOR_ZOOM = 16  # зум, на котором в области патча (см. LABEL_PATCH_BOX) ещё
# нет никаких подписей — проверять эмпирически при каждой смене ZOOM или
# LABEL_PATCH_BOX, а не считать постоянным: один и тот же зум 16 в области
# побольше (захватывавшей и "Villa ArtE") неожиданно показывал её подпись —
# похоже, зависит не только от зума, но и от конкретной точки/размера.
TILE_W, TILE_H = 650, 450
# Область с подписью "Лесная Заимка" + иконкой поверх точки маркера —
# подобрано вручную по снимку на зуме {ZOOM}. Только эта подпись (не заодно
# соседняя "Villa ArtE" — другой бизнес, трогать её незачем, а сама область
# патча размытая: чем она больше, тем это заметнее). Есть ~15px зазор перед
# "Villa ArtE" по вертикали — этого хватает не задеть её, если менять box,
# смотреть на снимке, где именно проходит граница.
LABEL_PATCH_BOX = (225, 208, 345, 238)
OUT_PATH = "public/img/map-location.webp"


def world_px(z: int) -> float:
    return 256 * (2**z)


def lonlat_to_px(lon: float, lat: float, z: int) -> tuple[float, float]:
    w = world_px(z)
    x = (lon + 180.0) / 360.0 * w
    siny = min(max(math.sin(math.radians(lat)), -0.9999), 0.9999)
    y = (0.5 - math.log((1 + siny) / (1 - siny)) / (4 * math.pi)) * w
    return x, y


def px_to_lonlat(x: float, y: float, z: int) -> tuple[float, float]:
    w = world_px(z)
    lon = x / w * 360.0 - 180.0
    n = math.pi - 2 * math.pi * y / w
    lat = math.degrees(math.atan(math.sinh(n)))
    return lon, lat


def fetch(lon: float, lat: float, zoom: int, w: int, h: int) -> Image.Image:
    url = f"https://static-maps.yandex.ru/1.x/?ll={lon},{lat}&z={zoom}&l=map&size={w},{h}"
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return Image.open(io.BytesIO(r.content)).convert("RGB")


def patch_org_labels(canvas: Image.Image) -> None:
    """Заменяет фирменные подписи Яндекса под маркером куском той же местности,
    снятым на зум мельче (см. объяснение в шапке файла)."""
    px1, py1, px2, py2 = LABEL_PATCH_BOX
    cx, cy = lonlat_to_px(LON, LAT, ZOOM)  # центр исходного снимка = (325,225)

    zoom_factor = 2 ** (ZOOM - DONOR_ZOOM)
    wx1, wy1 = (cx + (px1 - TILE_W / 2)) / zoom_factor, (cy + (py1 - TILE_H / 2)) / zoom_factor
    wx2, wy2 = (cx + (px2 - TILE_W / 2)) / zoom_factor, (cy + (py2 - TILE_H / 2)) / zoom_factor

    donor_lon, donor_lat = px_to_lonlat((wx1 + wx2) / 2, (wy1 + wy2) / 2, DONOR_ZOOM)
    fetch_w, fetch_h = 300, 200
    donor_tile = fetch(donor_lon, donor_lat, DONOR_ZOOM, fetch_w, fetch_h)
    tile_cx, tile_cy = lonlat_to_px(donor_lon, donor_lat, DONOR_ZOOM)

    tx1, ty1 = wx1 - tile_cx + fetch_w / 2, wy1 - tile_cy + fetch_h / 2
    tx2, ty2 = wx2 - tile_cx + fetch_w / 2, wy2 - tile_cy + fetch_h / 2
    donor_crop = donor_tile.crop((round(tx1), round(ty1), round(tx2), round(ty2)))
    donor_scaled = donor_crop.resize((px2 - px1, py2 - py1), Image.LANCZOS)
    canvas.paste(donor_scaled, (px1, py1))


def main() -> None:
    canvas = fetch(LON, LAT, ZOOM, TILE_W, TILE_H)
    patch_org_labels(canvas)
    canvas.save(OUT_PATH, "WEBP", quality=84, method=6)
    print(f"saved {OUT_PATH}: {canvas.size[0]}x{canvas.size[1]}")


if __name__ == "__main__":
    main()
