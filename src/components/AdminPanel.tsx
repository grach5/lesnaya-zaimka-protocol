import { useState, useEffect, useCallback, type ReactNode, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startLogin, completeLoginIfRedirected, getToken, clearToken, getClientId, setClientId } from "@/lib/githubAuth";
import { saveJsonFile, uploadBinaryFile, rawContentUrl, fetchViewer } from "@/lib/githubContent";
import { resizeToWebpBase64 } from "@/lib/imageUpload";

// Панель администратора. Два независимых уровня доступа:
// 1. Пароль (DEMO_PASSWORD) — просто открывает интерфейс панели в этом
//    браузере, проверяется в браузере, не является настоящей защитой.
// 2. Подключение GitHub (Настройки → Client ID → «Войти через GitHub») —
//    вот это уже НАСТОЯЩАЯ авторизация: PKCE-вход в GitHub App
//    (см. src/lib/githubAuth.ts), после которого «Сохранить» реально
//    пишет коммит в репозиторий сайта через Contents API
//    (src/lib/githubContent.ts) — сайт пересобирается тем же пайплайном,
//    что и при обычном git push. Без подключения «Сохранить» держит
//    правки только в localStorage этого браузера (переживает обновление
//    страницы, но не является реальной публикацией).
const DEMO_PASSWORD = "zaimka2026";

const FILE_PATHS = {
  menu: "src/data/menu.json",
  contacts: "src/data/contacts.json",
  halls: "src/data/halls.json",
  history: "src/data/history.json",
  reviews: "src/data/reviews.json",
  carwash: "src/data/carwash.json",
  events: "src/data/events-board.json",
  gallery: "src/data/gallery.json",
  theme: "src/data/theme.json",
} as const;

type MenuItem = { name: string; price: number };
type MenuCategory = { name: string; items: MenuItem[] };
type MenuData = { categories: MenuCategory[] };
type Contacts = {
  name: string; address: string; phoneTable: string; phoneEvents: string;
  hours: string; hotelName: string; hotelUrl: string; telegram: string; lat: number; lon: number;
};
type Hall = { name: string; slug: string; description: string; capacity: string; area: string; photoCount: number };
type HallsData = { halls: Hall[]; eventFormats: string[] };
type HistoryEntry = { year: string; title: string; body: string };
type Quote = { text: string; author: string; role: string };
type HistoryData = { entries: HistoryEntry[]; ownerQuote: Quote; guestQuotes: Quote[] };
type Review = { author: string; text: string; highlight?: string };
type ReviewsData = { reviews: Review[] };
type CarwashData = { categories: string[] };
type BoardEvent = { title: string; date: string; description?: string; image?: string };
type EventsBoardData = { events: BoardEvent[] };
type GalleryImage = { full: string; thumb: string; source: string };
type GallerySection = { name: string; images: GalleryImage[] };
type GalleryData = { sections: GallerySection[] };
type ThemeData = { paper: string; paperRaised: string; paperSunk: string; ink: string; burgundy: string; gold: string; brass: string; velvet: string };

interface Props {
  initialMenu: MenuData;
  initialContacts: Contacts;
  initialHalls: HallsData;
  initialHistory: HistoryData;
  initialReviews: ReviewsData;
  initialCarwash: CarwashData;
  initialEvents: EventsBoardData;
  initialGallery: GalleryData;
  initialTheme: ThemeData;
}

const SECTIONS = [
  { id: "menu", label: "Меню", icon: "🍽" },
  { id: "contacts", label: "Контакты", icon: "☎" },
  { id: "halls", label: "Залы", icon: "🏛" },
  { id: "history", label: "История", icon: "📜" },
  { id: "reviews", label: "Отзывы", icon: "★" },
  { id: "gallery", label: "Галерея", icon: "🖼" },
  { id: "carwash", label: "Автомойка", icon: "🚗" },
  { id: "events", label: "Афиша", icon: "📣" },
  { id: "theme", label: "Оформление", icon: "🎨" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

/** localStorage-черновик + отслеживание несохранённых изменений + откат к исходнику. */
function useDraft<T>(key: string, initial: T) {
  const [data, setData] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`zaimka-admin-draft-${key}`);
      return raw ? (JSON.parse(raw) as T) : structuredClone(initial);
    } catch {
      return structuredClone(initial);
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`zaimka-admin-draft-${key}`, JSON.stringify(data));
    } catch {
      // localStorage недоступен (приватный режим) — черновик просто не переживёт обновление
    }
  }, [key, data]);
  const dirty = JSON.stringify(data) !== JSON.stringify(initial);
  const revert = useCallback(() => setData(structuredClone(initial)), [initial]);
  return { data, setData, dirty, revert };
}

type ToastKind = "success" | "error" | "info";

export default function AdminPanel({
  initialMenu, initialContacts, initialHalls, initialHistory, initialReviews, initialCarwash, initialEvents, initialGallery, initialTheme,
}: Props) {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const [section, setSection] = useState<SectionId>("menu");
  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  const [ghUser, setGhUser] = useState<{ login: string; avatarUrl: string } | null>(null);
  const [ghConnecting, setGhConnecting] = useState(true);
  const [saving, setSaving] = useState<SectionId | null>(null);
  const [uploading, setUploading] = useState(false);

  const menu = useDraft("menu", initialMenu);
  const contacts = useDraft("contacts", initialContacts);
  const halls = useDraft("halls", initialHalls);
  const history = useDraft("history", initialHistory);
  const reviews = useDraft("reviews", initialReviews);
  const carwash = useDraft("carwash", initialCarwash);
  const events = useDraft("events", initialEvents);
  const gallery = useDraft("gallery", initialGallery);
  const theme = useDraft("theme", initialTheme);

  function showToast(kind: ToastKind, text: string) {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), kind === "error" ? 5000 : 3000);
  }

  // При загрузке: если пароль уже вводился в этой сессии (authed держим в
  // sessionStorage отдельно от самого пароля) — не просить его заново на
  // каждый reload; и обработать возврат из GitHub OAuth (?code=...).
  useEffect(() => {
    if (sessionStorage.getItem("zaimka-admin-authed") === "1") setAuthed(true);
    setClientIdInput(getClientId());

    (async () => {
      try {
        const redirected = await completeLoginIfRedirected();
        if (redirected) showToast("success", "GitHub подключён");
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Не удалось завершить вход в GitHub");
      }
      const token = getToken();
      if (token) {
        try {
          setGhUser(await fetchViewer(token));
        } catch {
          clearToken();
        }
      }
      setGhConnecting(false);
    })();
  }, []);

  function download(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveSection(id: SectionId, data: unknown, label: string) {
    const token = getToken();
    if (!token) {
      showToast("info", `${label} сохранено локально (демо) — подключите GitHub в настройках для настоящей публикации`);
      return;
    }
    setSaving(id);
    try {
      const res = await saveJsonFile(token, FILE_PATHS[id], data, `Правка из админ-панели: ${label.toLowerCase()}`);
      showToast("success", `${label} опубликовано — сайт пересобирается`);
      window.open(res.commitUrl, "_blank", "noopener");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Не удалось сохранить в GitHub");
    } finally {
      setSaving(null);
    }
  }

  /**
   * Общая загрузка фото для Галереи и Залов: сжимает в браузере (canvas → WebP)
   * и коммитит напрямую в репозиторий по указанному пути через GitHub Contents API.
   * Требует подключённого GitHub (см. saveSection) — в отличие от текстовых полей,
   * у бинарной загрузки нет осмысленного «локального demo-режима».
   */
  async function uploadFile(file: File, path: string, maxDimension: number, commitMessage: string): Promise<boolean> {
    const token = getToken();
    if (!token) {
      showToast("info", "Загрузка фото требует подключения GitHub — откройте «Настройки» и войдите");
      return false;
    }
    setUploading(true);
    try {
      const base64 = await resizeToWebpBase64(file, maxDimension);
      await uploadBinaryFile(token, path, base64, commitMessage);
      showToast("success", "Фото загружено — сайт пересобирается");
      return true;
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Не удалось загрузить фото");
      return false;
    } finally {
      setUploading(false);
    }
  }

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (pwInput === DEMO_PASSWORD) {
      setAuthed(true);
      setPwError(false);
      sessionStorage.setItem("zaimka-admin-authed", "1");
    } else {
      setPwError(true);
    }
  }

  function saveClientId() {
    setClientId(clientIdInput);
    showToast("success", "Client ID сохранён в этом браузере");
  }

  async function connectGithub() {
    try {
      await startLogin();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Не удалось начать вход");
    }
  }

  function disconnectGithub() {
    clearToken();
    setGhUser(null);
    showToast("info", "GitHub отключён — сохранение снова только локальное");
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#12151a] px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1a1e26] p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#d9a15b]/15 text-2xl">🔐</div>
            <h1 className="font-semibold text-white text-lg">Лесная Заимка</h1>
            <p className="mt-1 text-sm text-white/50">Панель администратора</p>
          </div>
          <Label htmlFor="admin-pw" className="text-white/70">Пароль</Label>
          <Input
            id="admin-pw"
            type="password"
            autoFocus
            value={pwInput}
            onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
            className="mt-1.5 border-white/15 bg-white/5 text-white placeholder:text-white/30"
            placeholder="••••••••"
          />
          {pwError && <p className="mt-2 text-sm text-red-400">Неверный пароль. Попробуйте ещё раз.</p>}
          <Button type="submit" className="mt-5 w-full bg-[#d9a15b] text-[#1a1e26] hover:bg-[#e8b876]">Войти</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f3f4f6] text-[#14171c]">
      <aside className="flex w-60 shrink-0 flex-col bg-[#1a1e26] text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-semibold">Лесная Заимка</p>
          <p className="text-xs text-white/40">Панель администратора</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {SECTIONS.map((s) => {
            const dirty = { menu, contacts, halls, history, reviews, carwash, events, gallery, theme }[s.id].dirty;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  section === s.id ? "bg-[#d9a15b]/15 text-[#e8b876]" : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-4 text-center">{s.icon}</span>
                <span className="flex-1">{s.label}</span>
                {dirty && <span className="h-1.5 w-1.5 rounded-full bg-[#e8b876]" title="Есть несохранённые изменения" />}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
          >
            <span className="w-4 text-center">⚙</span> Настройки
          </button>
          <button
            type="button"
            onClick={() => { setAuthed(false); setPwInput(""); sessionStorage.removeItem("zaimka-admin-authed"); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
          >
            <span className="w-4 text-center">↩</span> Выйти
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-[#dadfe6] bg-[#f8f9fb]/95 px-8 py-3.5 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            {ghConnecting ? (
              <span className="text-xs text-[#838b9b]">Проверка подключения…</span>
            ) : ghUser ? (
              <button type="button" onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-xs font-medium text-[#1a7f37] hover:underline">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a7f37]" /> Подключено к GitHub как {ghUser.login} — «Сохранить» публикует на сайт
              </button>
            ) : (
              <button type="button" onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-xs font-medium text-[#b5651d] hover:underline">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b5651d]" /> GitHub не подключён — «Сохранить» держит правки только в этом браузере
              </button>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-8 py-8">
          {section === "menu" && <MenuSection draft={menu} onSave={() => saveSection("menu", menu.data, "Меню")} onDownload={() => download("menu.json", menu.data)} saving={saving === "menu"} />}
          {section === "contacts" && <ContactsSection draft={contacts} onSave={() => saveSection("contacts", contacts.data, "Контакты")} onDownload={() => download("contacts.json", contacts.data)} saving={saving === "contacts"} />}
          {section === "halls" && <HallsSection draft={halls} onSave={() => saveSection("halls", halls.data, "Залы")} onDownload={() => download("halls.json", halls.data)} saving={saving === "halls"} uploadFile={uploadFile} uploading={uploading} />}
          {section === "history" && <HistorySection draft={history} onSave={() => saveSection("history", history.data, "История")} onDownload={() => download("history.json", history.data)} saving={saving === "history"} />}
          {section === "reviews" && <ReviewsSection draft={reviews} onSave={() => saveSection("reviews", reviews.data, "Отзывы")} onDownload={() => download("reviews.json", reviews.data)} saving={saving === "reviews"} />}
          {section === "carwash" && <CarwashSection draft={carwash} onSave={() => saveSection("carwash", carwash.data, "Автомойка")} onDownload={() => download("carwash.json", carwash.data)} saving={saving === "carwash"} />}
          {section === "events" && <EventsSection draft={events} onSave={() => saveSection("events", events.data, "Афиша")} onDownload={() => download("events-board.json", events.data)} saving={saving === "events"} />}
          {section === "gallery" && <GallerySection draft={gallery} onSave={() => saveSection("gallery", gallery.data, "Галерея")} onDownload={() => download("gallery.json", gallery.data)} saving={saving === "gallery"} uploadFile={uploadFile} uploading={uploading} />}
          {section === "theme" && <ThemeSection draft={theme} onSave={() => saveSection("theme", theme.data, "Оформление")} onDownload={() => download("theme.json", theme.data)} saving={saving === "theme"} />}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Подключение к GitHub</h3>
            <p className="mt-1 text-sm text-[#4b5262]">Реальное сохранение правок на сайт требует входа через GitHub App. Один раз укажите Client ID созданного приложения.</p>

            <div className="mt-4">
              <Field label="GitHub App Client ID">
                <Input value={clientIdInput} onChange={(e) => setClientIdInput(e.target.value)} placeholder="Iv1...." />
              </Field>
              <Button type="button" variant="outline" onClick={saveClientId} className="mt-2">Сохранить Client ID</Button>
            </div>

            <div className="mt-5 border-t border-[#eef0f3] pt-4">
              {ghUser ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-[#1a7f37]" /> Вошли как <strong>{ghUser.login}</strong></span>
                  <Button type="button" variant="outline" onClick={disconnectGithub}>Отключить</Button>
                </div>
              ) : (
                <Button type="button" onClick={connectGithub} className="w-full">Войти через GitHub →</Button>
              )}
            </div>
            <Button type="button" variant="ghost" onClick={() => setShowSettings(false)} className="mt-4 w-full">Закрыть</Button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-lg px-4 py-3 text-sm text-white shadow-xl ${
            toast.kind === "error" ? "bg-red-600" : toast.kind === "info" ? "bg-[#4b5262]" : "bg-[#1a7f37]"
          }`}
        >
          {toast.kind === "success" ? "✓ " : toast.kind === "error" ? "⚠ " : "ℹ "}{toast.text}
        </div>
      )}
    </div>
  );
}

/* ============== общие UI-кусочки ============== */

function SectionHeader({
  title, hint, onSave, onDownload, dirty, onRevert, saving,
}: { title: string; hint: string; onSave: () => void; onDownload: () => void; dirty: boolean; onRevert: () => void; saving: boolean }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-[#4b5262]">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {dirty && <button type="button" onClick={onRevert} className="text-xs text-[#838b9b] hover:text-[#b5651d] hover:underline">отменить правки</button>}
        <Button type="button" variant="outline" onClick={onDownload}>Скачать JSON</Button>
        <Button type="button" onClick={onSave} disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
      </div>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-[#dadfe6] bg-white p-5 shadow-sm">{children}</div>;
}

function RemoveBtn({ onClick, confirmText }: { onClick: () => void; confirmText?: string }) {
  return (
    <button
      type="button"
      onClick={() => { if (!confirmText || window.confirm(confirmText)) onClick(); }}
      aria-label="Удалить"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#838b9b] hover:bg-red-50 hover:text-red-600"
    >
      ✕
    </button>
  );
}

/** Стрелки для смещения строки/карточки вверх-вниз в списке — единый паттерн для всех разделов. */
function MoveButtons({ onUp, onDown, upDisabled, downDisabled }: { onUp: () => void; onDown: () => void; upDisabled: boolean; downDisabled: boolean }) {
  return (
    <div className="flex shrink-0 flex-col">
      <button type="button" onClick={onUp} disabled={upDisabled} aria-label="Сместить выше" className="text-xs text-[#838b9b] hover:text-[#b5651d] disabled:opacity-20">▲</button>
      <button type="button" onClick={onDown} disabled={downDisabled} aria-label="Сместить ниже" className="text-xs text-[#838b9b] hover:text-[#b5651d] disabled:opacity-20">▼</button>
    </div>
  );
}

function moveInArray<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const next = [...arr];
  const target = i + dir;
  if (target < 0 || target >= next.length) return arr;
  [next[i], next[target]] = [next[target], next[i]];
  return next;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-[#838b9b]">{label}</span>
      {children}
    </label>
  );
}

type Draft<T> = { data: T; setData: (d: T) => void; dirty: boolean; revert: () => void };
type SectionProps<T> = { draft: Draft<T>; onSave: () => void; onDownload: () => void; saving: boolean };

/* ============== Меню ============== */
function MenuSection({ draft, onSave, onDownload, saving }: SectionProps<MenuData>) {
  const { data, setData, dirty, revert } = draft;
  const [query, setQuery] = useState("");

  function updateItem(ci: number, ii: number, patch: Partial<MenuItem>) {
    const next = structuredClone(data);
    next.categories[ci].items[ii] = { ...next.categories[ci].items[ii], ...patch };
    setData(next);
  }
  function removeItem(ci: number, ii: number) {
    const next = structuredClone(data);
    next.categories[ci].items.splice(ii, 1);
    setData(next);
  }
  function addItem(ci: number) {
    const next = structuredClone(data);
    next.categories[ci].items.push({ name: "Новое блюдо", price: 0 });
    setData(next);
  }
  function moveItem(ci: number, ii: number, dir: -1 | 1) {
    const next = structuredClone(data);
    const items = next.categories[ci].items;
    const target = ii + dir;
    if (target < 0 || target >= items.length) return;
    [items[ii], items[target]] = [items[target], items[ii]];
    setData(next);
  }
  function renameCategory(ci: number, name: string) {
    const next = structuredClone(data);
    next.categories[ci].name = name;
    setData(next);
  }
  function addCategory() {
    const next = structuredClone(data);
    next.categories.push({ name: "Новый раздел", items: [] });
    setData(next);
  }
  function removeCategory(ci: number) {
    const next = structuredClone(data);
    next.categories.splice(ci, 1);
    setData(next);
  }

  const q = query.trim().toLowerCase();
  const totalItems = data.categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <div>
      <SectionHeader title="Меню ресторана" hint={`${data.categories.length} разделов, ${totalItems} блюд`} onSave={onSave} onDownload={onDownload} dirty={dirty} onRevert={revert} saving={saving} />

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти блюдо по названию…" className="mb-4" />

      <div className="flex flex-col gap-4">
        {data.categories.map((cat, ci) => {
          const filteredIdx = cat.items
            .map((item, ii) => ({ item, ii }))
            .filter(({ item }) => !q || item.name.toLowerCase().includes(q));
          if (q && filteredIdx.length === 0) return null;
          return (
            <details key={ci} open={ci === 0 || q.length > 0} className="rounded-xl border border-[#dadfe6] bg-white shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-sm font-semibold">
                <input
                  value={cat.name}
                  onChange={(e) => renameCategory(ci, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-xs rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold outline-none hover:border-[#dadfe6] focus:border-[#d9a15b]"
                />
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs font-normal text-[#838b9b]">{cat.items.length} блюд</span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <RemoveBtn onClick={() => removeCategory(ci)} confirmText={`Удалить раздел «${cat.name}» и все ${cat.items.length} блюд в нём?`} />
                  </span>
                </span>
              </summary>
              <div className="border-t border-[#eef0f3] p-4">
                <div className="flex flex-col gap-2">
                  {filteredIdx.map(({ item, ii }) => (
                    <div key={ii} className="flex items-center gap-2">
                      <div className="flex shrink-0 flex-col">
                        <button type="button" onClick={() => moveItem(ci, ii, -1)} disabled={ii === 0} className="text-xs text-[#838b9b] hover:text-[#b5651d] disabled:opacity-20">▲</button>
                        <button type="button" onClick={() => moveItem(ci, ii, 1)} disabled={ii === cat.items.length - 1} className="text-xs text-[#838b9b] hover:text-[#b5651d] disabled:opacity-20">▼</button>
                      </div>
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(ci, ii, { name: e.target.value })}
                        className="min-w-0 flex-1 rounded-md border border-[#dadfe6] px-3 py-1.5 text-sm outline-none focus:border-[#d9a15b]"
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(ci, ii, { price: Number(e.target.value) })}
                        className="w-24 shrink-0 rounded-md border border-[#dadfe6] px-3 py-1.5 text-right text-sm outline-none focus:border-[#d9a15b]"
                      />
                      <span className="shrink-0 text-xs text-[#838b9b]">₽</span>
                      <RemoveBtn onClick={() => removeItem(ci, ii)} />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addItem(ci)} className="mt-3 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить блюдо</button>
              </div>
            </details>
          );
        })}
      </div>
      <button type="button" onClick={addCategory} className="mt-4 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить раздел меню</button>
    </div>
  );
}

/* ============== Контакты ============== */
function ContactsSection({ draft, onSave, onDownload, saving }: SectionProps<Contacts>) {
  const { data, setData, dirty, revert } = draft;
  const set = (k: keyof Contacts, v: string | number) => setData({ ...data, [k]: v });
  return (
    <div>
      <SectionHeader title="Контакты" hint="Адрес, телефоны, часы работы" onSave={onSave} onDownload={onDownload} dirty={dirty} onRevert={revert} saving={saving} />
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Название"><Input value={data.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Адрес"><Input value={data.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Телефон (бронь стола)"><Input value={data.phoneTable} onChange={(e) => set("phoneTable", e.target.value)} /></Field>
          <Field label="Телефон (банкетный отдел)"><Input value={data.phoneEvents} onChange={(e) => set("phoneEvents", e.target.value)} /></Field>
          <Field label="Часы работы"><Input value={data.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
          <Field label="Гостиница-партнёр"><Input value={data.hotelName} onChange={(e) => set("hotelName", e.target.value)} /></Field>
          <Field label="Сайт отеля"><Input value={data.hotelUrl} onChange={(e) => set("hotelUrl", e.target.value)} /></Field>
          <Field label="Telegram-канал"><Input value={data.telegram} onChange={(e) => set("telegram", e.target.value)} /></Field>
        </div>
      </Card>
    </div>
  );
}

/* ============== Залы ============== */
function HallsSection({
  draft, onSave, onDownload, saving, uploadFile, uploading,
}: SectionProps<HallsData> & { uploadFile: (file: File, path: string, maxDimension: number, commitMessage: string) => Promise<boolean>; uploading: boolean }) {
  const { data, setData, dirty, revert } = draft;
  function updateHall(i: number, patch: Partial<Hall>) {
    const next = structuredClone(data);
    next.halls[i] = { ...next.halls[i], ...patch };
    setData(next);
  }
  function moveHall(i: number, dir: -1 | 1) {
    setData({ ...data, halls: moveInArray(data.halls, i, dir) });
  }
  async function addHallPhoto(i: number, file: File) {
    const h = data.halls[i];
    const nextIndex = h.photoCount + 1;
    // Тот же паттерн thumb(700px)/full(1600px), что уже используют существующие
    // фото залов (см. hallPhotos() в halls.ts) — грузим оба размера одним кликом.
    const okThumb = await uploadFile(file, `public/img/halls/${h.slug}/thumb/${nextIndex}.webp`, 700, `Фото зала «${h.name}»: добавлено превью ${nextIndex}`);
    if (!okThumb) return;
    const okFull = await uploadFile(file, `public/img/halls/${h.slug}/full/${nextIndex}.webp`, 1600, `Фото зала «${h.name}»: добавлено полное фото ${nextIndex}`);
    if (!okFull) return;
    updateHall(i, { photoCount: nextIndex });
  }
  return (
    <div>
      <SectionHeader title="Банкетные залы" hint={`${data.halls.length} залов`} onSave={onSave} onDownload={onDownload} dirty={dirty} onRevert={revert} saving={saving} />
      <div className="flex flex-col gap-4">
        {data.halls.map((h, i) => (
          <Card key={h.slug}>
            <div className="flex items-start gap-3">
              <MoveButtons onUp={() => moveHall(i, -1)} onDown={() => moveHall(i, 1)} upDisabled={i === 0} downDisabled={i === data.halls.length - 1} />
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Field label="Название"><Input value={h.name} onChange={(e) => updateHall(i, { name: e.target.value })} /></Field>
                <Field label="Вместимость"><Input value={h.capacity} onChange={(e) => updateHall(i, { capacity: e.target.value })} /></Field>
                <Field label="Площадь"><Input value={h.area} onChange={(e) => updateHall(i, { area: e.target.value })} placeholder="например, 400 м²" /></Field>
                <Field label="Фото в галерее">
                  <div className="flex h-11 items-center gap-2">
                    <span className="text-sm text-[#838b9b]">{h.photoCount} шт.</span>
                    <label className="cursor-pointer text-sm font-medium text-[#b5651d] hover:underline">
                      {uploading ? "Загрузка…" : "+ Добавить фото"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) addHallPhoto(i, f); e.target.value = ""; }}
                      />
                    </label>
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Описание"><Textarea value={h.description} onChange={(e) => updateHall(i, { description: e.target.value })} rows={2} /></Field>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============== История ============== */
function HistorySection({ draft, onSave, onDownload, saving }: SectionProps<HistoryData>) {
  const { data, setData, dirty, revert } = draft;
  function updateEntry(i: number, patch: Partial<HistoryEntry>) {
    const next = structuredClone(data);
    next.entries[i] = { ...next.entries[i], ...patch };
    setData(next);
  }
  function removeEntry(i: number) {
    const next = structuredClone(data);
    next.entries.splice(i, 1);
    setData(next);
  }
  function addEntry() {
    const next = structuredClone(data);
    next.entries.push({ year: "", title: "Новая запись", body: "" });
    setData(next);
  }
  function moveEntry(i: number, dir: -1 | 1) {
    setData({ ...data, entries: moveInArray(data.entries, i, dir) });
  }
  function moveGuestQuote(i: number, dir: -1 | 1) {
    setData({ ...data, guestQuotes: moveInArray(data.guestQuotes, i, dir) });
  }
  function updateGuestQuote(i: number, patch: Partial<Quote>) {
    const next = structuredClone(data);
    next.guestQuotes[i] = { ...next.guestQuotes[i], ...patch };
    setData(next);
  }
  function removeGuestQuote(i: number) {
    const next = structuredClone(data);
    next.guestQuotes.splice(i, 1);
    setData(next);
  }
  function addGuestQuote() {
    const next = structuredClone(data);
    next.guestQuotes.push({ text: "", author: "", role: "" });
    setData(next);
  }

  return (
    <div>
      <SectionHeader title="История" hint="Хронология, цитата владельца, цитаты почётных гостей" onSave={onSave} onDownload={onDownload} dirty={dirty} onRevert={revert} saving={saving} />

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#838b9b]">Хронология</p>
      <div className="flex flex-col gap-3">
        {data.entries.map((e, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <MoveButtons onUp={() => moveEntry(i, -1)} onDown={() => moveEntry(i, 1)} upDisabled={i === 0} downDisabled={i === data.entries.length - 1} />
              <Input value={e.year} onChange={(ev) => updateEntry(i, { year: ev.target.value })} className="w-24 shrink-0" />
              <div className="flex-1">
                <Input value={e.title} onChange={(ev) => updateEntry(i, { title: ev.target.value })} className="mb-2 font-semibold" />
                <Textarea value={e.body} onChange={(ev) => updateEntry(i, { body: ev.target.value })} rows={2} />
              </div>
              <RemoveBtn onClick={() => removeEntry(i)} confirmText="Удалить эту запись хроники?" />
            </div>
          </Card>
        ))}
      </div>
      <button type="button" onClick={addEntry} className="mt-3 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить запись</button>

      <p className="mb-2 mt-8 text-xs font-medium uppercase tracking-wide text-[#838b9b]">Цитата владельца</p>
      <Card>
        <Textarea value={data.ownerQuote.text} onChange={(e) => setData({ ...data, ownerQuote: { ...data.ownerQuote, text: e.target.value } })} rows={2} className="mb-3" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Автор"><Input value={data.ownerQuote.author} onChange={(e) => setData({ ...data, ownerQuote: { ...data.ownerQuote, author: e.target.value } })} /></Field>
          <Field label="Роль"><Input value={data.ownerQuote.role} onChange={(e) => setData({ ...data, ownerQuote: { ...data.ownerQuote, role: e.target.value } })} /></Field>
        </div>
      </Card>

      <p className="mb-2 mt-8 text-xs font-medium uppercase tracking-wide text-[#838b9b]">Цитаты почётных гостей</p>
      <div className="flex flex-col gap-3">
        {data.guestQuotes.map((q, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <MoveButtons onUp={() => moveGuestQuote(i, -1)} onDown={() => moveGuestQuote(i, 1)} upDisabled={i === 0} downDisabled={i === data.guestQuotes.length - 1} />
              <div className="flex-1">
                <Textarea value={q.text} onChange={(e) => updateGuestQuote(i, { text: e.target.value })} rows={2} className="mb-3" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Автор"><Input value={q.author} onChange={(e) => updateGuestQuote(i, { author: e.target.value })} /></Field>
                  <Field label="Роль"><Input value={q.role} onChange={(e) => updateGuestQuote(i, { role: e.target.value })} /></Field>
                </div>
              </div>
              <RemoveBtn onClick={() => removeGuestQuote(i)} confirmText="Удалить эту цитату?" />
            </div>
          </Card>
        ))}
      </div>
      <button type="button" onClick={addGuestQuote} className="mt-3 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить цитату гостя</button>
    </div>
  );
}

/* ============== Отзывы ============== */
function ReviewsSection({ draft, onSave, onDownload, saving }: SectionProps<ReviewsData>) {
  const { data, setData, dirty, revert } = draft;
  function update(i: number, patch: Partial<Review>) {
    const next = structuredClone(data);
    next.reviews[i] = { ...next.reviews[i], ...patch };
    setData(next);
  }
  function remove(i: number) {
    const next = structuredClone(data);
    next.reviews.splice(i, 1);
    setData(next);
  }
  function add() {
    const next = structuredClone(data);
    next.reviews.push({ author: "Гость", text: "" });
    setData(next);
  }
  function move(i: number, dir: -1 | 1) {
    setData({ ...data, reviews: moveInArray(data.reviews, i, dir) });
  }
  return (
    <div>
      <SectionHeader title="Отзывы гостей" hint={`${data.reviews.length} отзывов`} onSave={onSave} onDownload={onDownload} dirty={dirty} onRevert={revert} saving={saving} />
      <div className="flex flex-col gap-3">
        {data.reviews.map((r, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <MoveButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} upDisabled={i === 0} downDisabled={i === data.reviews.length - 1} />
              <div className="flex-1">
                <Input value={r.author} onChange={(e) => update(i, { author: e.target.value })} className="mb-2 max-w-xs font-semibold" />
                <Textarea value={r.text} onChange={(e) => update(i, { text: e.target.value })} rows={2} className="mb-2" />
                <Input value={r.highlight ?? ""} onChange={(e) => update(i, { highlight: e.target.value })} placeholder="Короткая пометка (необязательно)" className="max-w-xs text-xs" />
              </div>
              <RemoveBtn onClick={() => remove(i)} confirmText="Удалить этот отзыв?" />
            </div>
          </Card>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить отзыв</button>
    </div>
  );
}

/* ============== Автомойка ============== */
function CarwashSection({ draft, onSave, onDownload, saving }: SectionProps<CarwashData>) {
  const { data, setData, dirty, revert } = draft;
  function update(i: number, v: string) {
    const next = { ...data, categories: [...data.categories] };
    next.categories[i] = v;
    setData(next);
  }
  function remove(i: number) {
    setData({ ...data, categories: data.categories.filter((_, idx) => idx !== i) });
  }
  function add() {
    setData({ ...data, categories: [...data.categories, "Новая категория"] });
  }
  function move(i: number, dir: -1 | 1) {
    setData({ ...data, categories: moveInArray(data.categories, i, dir) });
  }
  return (
    <div>
      <SectionHeader title="Автомойка — категории услуг" hint={`${data.categories.length} категорий`} onSave={onSave} onDownload={onDownload} dirty={dirty} onRevert={revert} saving={saving} />
      <Card>
        <div className="flex flex-col gap-2">
          {data.categories.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <MoveButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} upDisabled={i === 0} downDisabled={i === data.categories.length - 1} />
              <Input value={c} onChange={(e) => update(i, e.target.value)} />
              <RemoveBtn onClick={() => remove(i)} />
            </div>
          ))}
        </div>
        <button type="button" onClick={add} className="mt-3 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить категорию</button>
      </Card>
    </div>
  );
}

/* ============== Афиша ============== */
function EventsSection({ draft, onSave, onDownload, saving }: SectionProps<EventsBoardData>) {
  const { data, setData, dirty, revert } = draft;
  function update(i: number, patch: Partial<BoardEvent>) {
    const next = structuredClone(data);
    next.events[i] = { ...next.events[i], ...patch };
    setData(next);
  }
  function remove(i: number) {
    const next = structuredClone(data);
    next.events.splice(i, 1);
    setData(next);
  }
  function add() {
    const next = structuredClone(data);
    next.events.push({ title: "Новое событие", date: new Date().toISOString().slice(0, 10), description: "" });
    setData(next);
  }
  function move(i: number, dir: -1 | 1) {
    setData({ ...data, events: moveInArray(data.events, i, dir) });
  }
  return (
    <div>
      <SectionHeader title="Афиша событий" hint={data.events.length ? `${data.events.length} событий` : "Пока пусто — добавьте первое событие"} onSave={onSave} onDownload={onDownload} dirty={dirty} onRevert={revert} saving={saving} />
      <div className="flex flex-col gap-3">
        {data.events.map((ev, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <MoveButtons onUp={() => move(i, -1)} onDown={() => move(i, 1)} upDisabled={i === 0} downDisabled={i === data.events.length - 1} />
              <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_auto]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Название"><Input value={ev.title} onChange={(e) => update(i, { title: e.target.value })} /></Field>
                  <Field label="Дата"><Input type="date" value={ev.date} onChange={(e) => update(i, { date: e.target.value })} /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Описание"><Textarea value={ev.description ?? ""} onChange={(e) => update(i, { description: e.target.value })} rows={2} /></Field>
                  </div>
                </div>
                <RemoveBtn onClick={() => remove(i)} confirmText="Удалить это событие?" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить событие</button>
      {!data.events.length && <p className="mt-4 text-sm text-[#838b9b]">На публичном сайте вместо афиши сейчас показывается честная заглушка «событий пока нет» — как только добавите здесь хотя бы одно, на сайте появится реальная афиша.</p>}
    </div>
  );
}

/* ============== Галерея ============== */
function GallerySection({
  draft, onSave, onDownload, saving, uploadFile, uploading,
}: SectionProps<GalleryData> & { uploadFile: (file: File, path: string, maxDimension: number, commitMessage: string) => Promise<boolean>; uploading: boolean }) {
  const { data, setData, dirty, revert } = draft;
  const totalImages = data.sections.reduce((s, sec) => s + sec.images.length, 0);

  function moveSection(i: number, dir: -1 | 1) {
    setData({ ...data, sections: moveInArray(data.sections, i, dir) });
  }
  function renameSection(i: number, name: string) {
    const next = structuredClone(data);
    next.sections[i].name = name;
    setData(next);
  }
  function addSection() {
    setData({ ...data, sections: [...data.sections, { name: "Новый раздел", images: [] }] });
  }
  function removeSection(i: number) {
    const next = structuredClone(data);
    next.sections.splice(i, 1);
    setData(next);
  }
  function moveImage(si: number, ii: number, dir: -1 | 1) {
    const next = structuredClone(data);
    next.sections[si].images = moveInArray(next.sections[si].images, ii, dir);
    setData(next);
  }
  function removeImage(si: number, ii: number) {
    const next = structuredClone(data);
    next.sections[si].images.splice(ii, 1);
    setData(next);
  }
  // Новые фото уходят в собственную подпапку с именем по времени загрузки —
  // так они никогда не перезатрут исторические файлы существующих разделов
  // (interiors/farm/kitchen/…), у которых имена файлов — просто цифры 1..N.
  async function addImage(si: number, file: File) {
    const ts = Date.now();
    const thumbPath = `public/img/gallery/uploads/${ts}-thumb.webp`;
    const fullPath = `public/img/gallery/uploads/${ts}-full.webp`;
    const label = data.sections[si].name;
    const okThumb = await uploadFile(file, thumbPath, 700, `Галерея «${label}»: новое фото`);
    if (!okThumb) return;
    const okFull = await uploadFile(file, fullPath, 1600, `Галерея «${label}»: новое фото (полный размер)`);
    if (!okFull) return;
    const next = structuredClone(data);
    next.sections[si].images.push({ thumb: `/img/gallery/uploads/${ts}-thumb.webp`, full: `/img/gallery/uploads/${ts}-full.webp`, source: "admin upload" });
    setData(next);
  }

  return (
    <div>
      <SectionHeader title="Галерея" hint={`${data.sections.length} разделов, ${totalImages} фото`} onSave={onSave} onDownload={onDownload} dirty={dirty} onRevert={revert} saving={saving} />
      <p className="mb-4 text-sm text-[#838b9b]">
        Загруженные фото сразу становятся реальным коммитом в репозиторий — превью ниже может на минуту-две отставать от факта, пока GitHub Pages пересобирает сайт. Не забудьте нажать «Сохранить» после добавления/удаления фото, чтобы список в галерее на сайте обновился.
      </p>
      <div className="flex flex-col gap-4">
        {data.sections.map((sec, si) => (
          <details key={si} open={si === 0} className="rounded-xl border border-[#dadfe6] bg-white shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-sm font-semibold">
              <span className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <MoveButtons onUp={() => moveSection(si, -1)} onDown={() => moveSection(si, 1)} upDisabled={si === 0} downDisabled={si === data.sections.length - 1} />
                <input
                  value={sec.name}
                  onChange={(e) => renameSection(si, e.target.value)}
                  className="w-full max-w-xs rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold outline-none hover:border-[#dadfe6] focus:border-[#d9a15b]"
                />
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs font-normal text-[#838b9b]">{sec.images.length} фото</span>
                <span onClick={(e) => e.stopPropagation()}>
                  <RemoveBtn onClick={() => removeSection(si)} confirmText={`Удалить раздел «${sec.name}» и все ${sec.images.length} фото в нём?`} />
                </span>
              </span>
            </summary>
            <div className="border-t border-[#eef0f3] p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {sec.images.map((img, ii) => (
                  <div key={ii} className="group relative overflow-hidden rounded-lg border border-[#dadfe6]">
                    <img src={rawContentUrl(`public${img.thumb}`)} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/40 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex">
                        <button type="button" onClick={() => moveImage(si, ii, -1)} disabled={ii === 0} className="px-1 text-xs text-white disabled:opacity-30">◀</button>
                        <button type="button" onClick={() => moveImage(si, ii, 1)} disabled={ii === sec.images.length - 1} className="px-1 text-xs text-white disabled:opacity-30">▶</button>
                      </div>
                      <button type="button" onClick={() => { if (window.confirm("Удалить это фото из галереи?")) removeImage(si, ii); }} className="px-1 text-xs text-white hover:text-red-300">✕</button>
                    </div>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#dadfe6] text-center text-xs text-[#838b9b] hover:border-[#d9a15b] hover:text-[#b5651d]">
                  <span className="text-lg">{uploading ? "…" : "+"}</span>
                  <span>{uploading ? "Загрузка" : "Добавить фото"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(si, f); e.target.value = ""; }}
                  />
                </label>
              </div>
            </div>
          </details>
        ))}
      </div>
      <button type="button" onClick={addSection} className="mt-4 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить раздел галереи</button>
    </div>
  );
}

/* ============== Оформление ============== */
const THEME_FIELDS: { key: keyof ThemeData; label: string; hint: string }[] = [
  { key: "paper", label: "Фон страницы", hint: "Основной фон под всем контентом" },
  { key: "paperRaised", label: "Фон карточек и шапки", hint: "Чуть светлее основного — карточки, хедер" },
  { key: "paperSunk", label: "Фон приглушённых секций", hint: "Тонированные блоки на фоне страницы" },
  { key: "ink", label: "Цвет текста", hint: "Основной цвет текста на светлом фоне" },
  { key: "burgundy", label: "Основной акцент", hint: "Кнопка «Бронь стола», активные элементы" },
  { key: "gold", label: "Золотой акцент", hint: "Рамки, hover-состояния, логотип" },
  { key: "brass", label: "Цвет ссылок", hint: "Текстовые ссылки на светлом фоне" },
  { key: "velvet", label: "Тёмный фон (задний план)", hint: "Футер и тёмные акцентные секции" },
];

function ThemeSection({ draft, onSave, onDownload, saving }: SectionProps<ThemeData>) {
  const { data, setData, dirty, revert } = draft;
  function set(key: keyof ThemeData, value: string) {
    setData({ ...data, [key]: value });
  }
  return (
    <div>
      <SectionHeader title="Оформление" hint="Цвета фона и акцентов по всему сайту" onSave={onSave} onDownload={onDownload} dirty={dirty} onRevert={revert} saving={saving} />
      <p className="mb-4 text-sm text-[#838b9b]">
        Правки применяются сразу на всём сайте (шапка, кнопки, фон секций) после «Сохранить» и пересборки — это дизайн-токены, а не разовая правка одного места.
      </p>
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {THEME_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <input
                type="color"
                value={data[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-11 w-11 shrink-0 cursor-pointer rounded-md border border-[#dadfe6] p-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{f.label}</p>
                <p className="truncate text-xs text-[#838b9b]">{f.hint}</p>
              </div>
              <Input value={data[f.key]} onChange={(e) => set(f.key, e.target.value)} className="w-24 shrink-0 font-mono text-xs uppercase" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
