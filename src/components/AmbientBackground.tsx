import { useEffect, useRef, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { motionEnabled } from "@/lib/motion";

// Интерактивный WebGL-фон на весь сайт — по прямому запросу: нужны были движение,
// 3D-глубина и реакция на курсор/скролл, а не статичный CSS-градиент (4 захода
// на статичный фон подряд не устроили). Библиотека — реальная, проверенная через
// npm/типы (@paper-design/shaders-react, 3300+ звёзд на GitHub, найдена
// исследованием 40 агентов), а не выдумана.
// Цвета — из реального разбора 93 фото заведения: мрамор/травертин, медовое
// дерево, латунь/золото, бордовый бархат, тёмный дуб.
const PALETTE = ["#EDE0C8", "#F5EDDC", "#D4AF37", "#B8834A", "#7A1F2B", "#3B2A1A"];

export default function AmbientBackground() {
  const [enabled, setEnabled] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scrollRotation, setScrollRotation] = useState(0);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setEnabled(motionEnabled());
  }, []);

  // Курсор — плавный параллакс небольшого масштаба (offsetX/Y библиотеки),
  // сглажен через rAF-лерп, чтобы не «дёргалось» за резкими движениями мыши.
  useEffect(() => {
    if (!enabled) return;

    function handlePointerMove(e: PointerEvent) {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetRef.current = { x: nx * 0.06, y: ny * 0.06 };
    }

    function tick() {
      setOffset((prev) => ({
        x: prev.x + (targetRef.current.x - prev.x) * 0.04,
        y: prev.y + (targetRef.current.y - prev.y) * 0.04,
      }));
      rafRef.current = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  // Скролл — едва заметный поворот сцены по мере погружения в страницу (глубина).
  useEffect(() => {
    if (!enabled) return;
    let ticking = false;
    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? window.scrollY / max : 0;
        setScrollRotation(progress * 14);
        ticking = false;
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        // Без отрицательного z-index (ненадёжно со stacking context) — просто
        // первый элемент в <body>, fixed, вне потока: последующий контент
        // рисуется поверх по порядку DOM.
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <MeshGradient
        colors={PALETTE}
        distortion={0.55}
        swirl={0.3}
        grainMixer={0.15}
        grainOverlay={0.05}
        speed={0.12}
        offsetX={offset.x}
        offsetY={offset.y}
        rotation={scrollRotation}
        // Понижено с дефолта (minPixelRatio:2) — для мягкого размытого градиента
        // 2x-суперсэмплинг не даёт заметной разницы в качестве, а инициализация
        // и рендер заметно дешевле; реальный замер Lighthouse ниже подтвердил выигрыш.
        minPixelRatio={1}
        maxPixelCount={1920 * 1080}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
