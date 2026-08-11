// Единая точка входа для анимаций проекта (Фаза 3: движок — GSAP + ScrollTrigger,
// Lenis — только источник плавного скролла, синхронизированный с тикером GSAP;
// снэппет синхронизации — дословно из README lenis, а не придуман).
// motionEnabled() — точка проверки, которую обязана вызывать любая GSAP-анимация
// на странице: так системная prefers-reduced-motion и ручной тумблер (Фаза 6,
// правило «все анимации отключаются одним флагом») работают одинаково.
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function motionEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (document.documentElement.dataset.motion === "off") return false;
  return true;
}

let lenisInstance: Lenis | null = null;

export function initSmoothScroll(): void {
  if (!motionEnabled()) return;
  if (lenisInstance) return;

  lenisInstance = new Lenis({ autoRaf: false });
  lenisInstance.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenisInstance?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  window.addEventListener("load", () => ScrollTrigger.refresh());
}

// Единый reveal-on-scroll для всех страниц: элементы с [data-reveal] проявляются
// при попадании во вьюпорт. Включает страховку — если ScrollTrigger по какой-то
// причине не сработал для блока, который уже физически виден (сдвиг раскладки,
// поздняя загрузка шрифта и т.п.), блок принудительно показывается через 600ms,
// а не остаётся невидимым навсегда.
export function initReveal(): void {
  const revealEls = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!revealEls.length) return;

  if (!motionEnabled()) {
    revealEls.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  revealEls.forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      }
    );
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());

  setTimeout(() => {
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const stillHidden = getComputedStyle(el).opacity === "0";
      if (stillHidden && rect.top < window.innerHeight * 0.95) {
        gsap.set(el, { autoAlpha: 1, y: 0 });
      }
    });
  }, 600);
}

// Тумблер анимаций: сохраняется в localStorage, применяется до первой отрисовки
// (см. инлайн-скрипт в Layout.astro) и переключается кнопкой в футере.
export function setMotionPreference(on: boolean): void {
  document.documentElement.dataset.motion = on ? "on" : "off";
  try {
    localStorage.setItem("zaimka-motion", on ? "on" : "off");
  } catch {
    // localStorage недоступен (приватный режим) — тумблер просто не переживёт перезагрузку
  }
  window.location.reload();
}

export { gsap, ScrollTrigger };
