"""Собирает public/img/map-location.webp — статичную картинку карты для
contacts.astro / ReviewsWidgets.astro, без API-ключа Яндекса.

Зачем свой скрипт, а не просто грузить одну картинку с static-maps.yandex.ru:
бесплатный (без ключа) Static Maps API отдаёт максимум 650x450px — при показе
на всю ширину секции (~1150px+) это растягивается почти в 2 раза и выглядит
размыто. Здесь запрашивается несколько соседних тайлов на зум глубже и они
сшиваются в одну большую чёткую картинку через Web Mercator-математику (та же
проекция, что использует сам Яндекс, поэтому дороги и подписи на стыках тайлов
совпадают день в день). Специально сдвигаем часть тайлов при запросе, чтобы
после обрезки нижней плашки-водяного знака Яндекса («© Яндекс Яндекс Карты»,
всегда рисуется внизу каждого тайла) не осталось шва — только один настоящий
водяной знак остаётся в правом нижнем углу итоговой картинки.

На этом зуме Яндекс сам подписывает организацию прямо на тайле («Лесная
Заимка» + иконка вилки-ножа) — ровно в точке, где сайт потом рисует свой
логотип-маркер поверх картинки. Маркер её не перекрывает целиком (подпись
шире и смещена левее центра), получается каша из двух наложенных текстов.
Поэтому после сшивки скрипт вырезает эту область и заменяет куском того же
места, снятым на зум мельче (там Яндекс подпись ещё не рисует), увеличенным
до нужного размера — то есть настоящей текстурой карты, а не заливкой цветом.

Запускать: uv run --with pillow --with requests python scripts/generate-map-image.py
Перезапускать при смене адреса/координат ресторана (см. src/data/contacts.json).
"""

import io
import math

import requests
from PIL import Image

LAT, LON = 43.265668, 132.072916  # см. src/data/contacts.json -> lat/lon
ZOOM = 17
DONOR_ZOOM = 16  # зум, на котором Яндекс ещё не рисует подпись организации
TILE_W, TILE_H = 650, 450
WATERMARK_H = 35  # высота плашки "© Яндекс..." внизу каждого тайла, замерено вручную
COLS, ROWS = 4, 2
# Область с фирменными подписями Яндекса поверх точки маркера, в координатах
# готового холста (2600x830, центр точки — 1300,415) — подобрано вручную.
# Захватывает и «Лесная Заимка», и соседнюю «Villa ArtE» целиком (обе подписи
# стоят почти впритык друг к другу) — более узкий бокс однажды обрезал вторую
# подпись на середине слова, получалась нечитаемая каша из половинок букв.
LABEL_PATCH_BOX = (1205, 395, 1435, 460)
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


def fetch_tile(lon: float, lat: float) -> Image.Image:
    return fetch(lon, lat, ZOOM, TILE_W, TILE_H)


def patch_org_label(canvas: Image.Image, cx: float, cy: float) -> None:
    """Заменяет фирменную подпись Яндекса под маркером куском той же местности,
    снятым на зум мельче (см. объяснение в шапке файла)."""
    px1, py1, px2, py2 = LABEL_PATCH_BOX

    def canvas_to_world(cxp: float, cyp: float) -> tuple[float, float]:
        return cx + (cxp - COLS * TILE_W / 2), cy + (cyp - (canvas.height / 2))

    wx1, wy1 = canvas_to_world(px1, py1)
    wx2, wy2 = canvas_to_world(px2, py2)
    # zoom на 1 уровень мельче -> ровно вдвое меньше мировых пикселей на ту же точку
    wx1_d, wy1_d, wx2_d, wy2_d = wx1 / 2, wy1 / 2, wx2 / 2, wy2 / 2
    donor_cx_px, donor_cy_px = (wx1_d + wx2_d) / 2, (wy1_d + wy2_d) / 2
    donor_lon, donor_lat = px_to_lonlat(donor_cx_px, donor_cy_px, DONOR_ZOOM)

    fetch_w, fetch_h = 300, 200
    donor_tile = fetch(donor_lon, donor_lat, DONOR_ZOOM, fetch_w, fetch_h)
    tile_cx, tile_cy = lonlat_to_px(donor_lon, donor_lat, DONOR_ZOOM)

    def world_to_donor_px(wx: float, wy: float) -> tuple[float, float]:
        return wx - tile_cx + fetch_w / 2, wy - tile_cy + fetch_h / 2

    tx1, ty1 = world_to_donor_px(wx1_d, wy1_d)
    tx2, ty2 = world_to_donor_px(wx2_d, wy2_d)
    donor_crop = donor_tile.crop((round(tx1), round(ty1), round(tx2), round(ty2)))
    donor_scaled = donor_crop.resize((px2 - px1, py2 - py1), Image.LANCZOS)
    canvas.paste(donor_scaled, (px1, py1))


def main() -> None:
    cx, cy = lonlat_to_px(LON, LAT, ZOOM)
    row_h = TILE_H - WATERMARK_H
    canvas = Image.new("RGB", (COLS * TILE_W, ROWS * row_h))

    for ri in range(ROWS):
        # Сдвигаем точку запроса вниз на высоту плашки — после обрезки её
        # снизу оставшийся кусок карты стыкуется с соседней строкой без шва.
        py = cy + (ri - (ROWS - 1) / 2.0) * TILE_H + WATERMARK_H
        for ci in range(COLS):
            px = cx + (ci - (COLS - 1) / 2.0) * TILE_W
            lon, lat = px_to_lonlat(px, py, ZOOM)
            tile = fetch_tile(lon, lat)
            canvas.paste(tile.crop((0, 0, TILE_W, row_h)), (ci * TILE_W, ri * row_h))

    # Один настоящий водяной знак Яндекса — переносим из отдельного запроса
    # без сдвига (та самая нижняя плашка) в правый нижний угол итоговой картинки.
    py_last = cy + (ROWS - 1 - (ROWS - 1) / 2.0) * TILE_H
    px_last = cx + (COLS - 1 - (COLS - 1) / 2.0) * TILE_W
    lon, lat = px_to_lonlat(px_last, py_last, ZOOM)
    br_tile = fetch_tile(lon, lat)
    watermark = br_tile.crop((0, TILE_H - WATERMARK_H, TILE_W, TILE_H))
    canvas.paste(watermark, ((COLS - 1) * TILE_W, canvas.height - WATERMARK_H))

    patch_org_label(canvas, cx, cy)

    canvas.save(OUT_PATH, "WEBP", quality=84, method=6)
    print(f"saved {OUT_PATH}: {canvas.size[0]}x{canvas.size[1]}")


if __name__ == "__main__":
    main()
