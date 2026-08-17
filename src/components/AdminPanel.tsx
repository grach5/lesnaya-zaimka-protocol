import { useState, type ReactNode, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ДЕМО-ВЕРСИЯ панели администратора — показывает, как будет выглядеть и
// ощущаться управление сайтом на реальном домене (lesnaya-zaimka-vl.ru),
// ДО переезда на хостинг с PHP. По прямой договорённости: защищённость сейчас
// не имеет значения (пароль проверяется в браузере, обойти может любой, кто
// откроет исходный код страницы), важно только показать клиенту рабочий вид
// и поведение. Реальное сохранение на сервер появится вместе с PHP-версией
// после переезда — здесь «Сохранить» держит правки только в памяти вкладки
// и предлагает скачать JSON как доказательство, что форма реально работает.
const DEMO_PASSWORD = "zaimka2026";

type MenuItem = { name: string; price: number };
type MenuCategory = { name: string; items: MenuItem[] };
type MenuData = { categories: MenuCategory[] };
type Contacts = {
  name: string; address: string; phoneTable: string; phoneEvents: string;
  hours: string; hotelName: string; hotelUrl: string; lat: number; lon: number;
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

interface Props {
  initialMenu: MenuData;
  initialContacts: Contacts;
  initialHalls: HallsData;
  initialHistory: HistoryData;
  initialReviews: ReviewsData;
  initialCarwash: CarwashData;
  initialEvents: EventsBoardData;
}

const SECTIONS = [
  { id: "menu", label: "Меню", icon: "🍽" },
  { id: "contacts", label: "Контакты", icon: "☎" },
  { id: "halls", label: "Залы", icon: "🏛" },
  { id: "history", label: "История", icon: "📜" },
  { id: "reviews", label: "Отзывы", icon: "★" },
  { id: "carwash", label: "Автомойка", icon: "🚗" },
  { id: "events", label: "Афиша", icon: "📣" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

export default function AdminPanel({
  initialMenu, initialContacts, initialHalls, initialHistory, initialReviews, initialCarwash, initialEvents,
}: Props) {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const [section, setSection] = useState<SectionId>("menu");
  const [toast, setToast] = useState<string | null>(null);

  const [menu, setMenu] = useState<MenuData>(() => structuredClone(initialMenu));
  const [contacts, setContacts] = useState<Contacts>(() => structuredClone(initialContacts));
  const [halls, setHalls] = useState<HallsData>(() => structuredClone(initialHalls));
  const [history, setHistory] = useState<HistoryData>(() => structuredClone(initialHistory));
  const [reviews, setReviews] = useState<ReviewsData>(() => structuredClone(initialReviews));
  const [carwash, setCarwash] = useState<CarwashData>(() => structuredClone(initialCarwash));
  const [events, setEvents] = useState<EventsBoardData>(() => structuredClone(initialEvents));

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }

  function download(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (pwInput === DEMO_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
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
          <p className="mt-5 text-center text-xs text-white/30">Демо-версия для показа клиенту · реальная защита появится после переезда на боевой хостинг</p>
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
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                section === s.id ? "bg-[#d9a15b]/15 text-[#e8b876]" : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="w-4 text-center">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => { setAuthed(false); setPwInput(""); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
          >
            <span className="w-4 text-center">↩</span> Выйти
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-[#dadfe6] bg-[#f8f9fb]/95 px-8 py-3.5 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-[#838b9b]">Демо-режим</span>
            <span className="text-xs text-[#838b9b]">Правки хранятся только в этой вкладке</span>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-8 py-8">
          {section === "menu" && <MenuSection data={menu} setData={setMenu} onSave={() => { showToast("Меню сохранено (демо)"); }} onDownload={() => download("menu.json", menu)} />}
          {section === "contacts" && <ContactsSection data={contacts} setData={setContacts} onSave={() => showToast("Контакты сохранены (демо)")} onDownload={() => download("contacts.json", contacts)} />}
          {section === "halls" && <HallsSection data={halls} setData={setHalls} onSave={() => showToast("Залы сохранены (демо)")} onDownload={() => download("halls.json", halls)} />}
          {section === "history" && <HistorySection data={history} setData={setHistory} onSave={() => showToast("История сохранена (демо)")} onDownload={() => download("history.json", history)} />}
          {section === "reviews" && <ReviewsSection data={reviews} setData={setReviews} onSave={() => showToast("Отзывы сохранены (демо)")} onDownload={() => download("reviews.json", reviews)} />}
          {section === "carwash" && <CarwashSection data={carwash} setData={setCarwash} onSave={() => showToast("Автомойка сохранена (демо)")} onDownload={() => download("carwash.json", carwash)} />}
          {section === "events" && <EventsSection data={events} setData={setEvents} onSave={() => showToast("Афиша сохранена (демо)")} onDownload={() => download("events-board.json", events)} />}
        </div>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[#1a7f37] px-4 py-3 text-sm text-white shadow-xl">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

/* ============== общие UI-кусочки ============== */

function SectionHeader({ title, hint, onSave, onDownload }: { title: string; hint: string; onSave: () => void; onDownload: () => void }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-[#4b5262]">{hint}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" onClick={onDownload}>Скачать JSON</Button>
        <Button type="button" onClick={onSave}>Сохранить</Button>
      </div>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-[#dadfe6] bg-white p-5 shadow-sm">{children}</div>;
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Удалить" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#838b9b] hover:bg-red-50 hover:text-red-600">
      ✕
    </button>
  );
}

/* ============== Меню ============== */
function MenuSection({ data, setData, onSave, onDownload }: { data: MenuData; setData: (d: MenuData) => void; onSave: () => void; onDownload: () => void }) {
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
  function renameCategory(ci: number, name: string) {
    const next = structuredClone(data);
    next.categories[ci].name = name;
    setData(next);
  }

  return (
    <div>
      <SectionHeader title="Меню ресторана" hint={`${data.categories.length} разделов, ${data.categories.reduce((s, c) => s + c.items.length, 0)} блюд`} onSave={onSave} onDownload={onDownload} />
      <div className="flex flex-col gap-4">
        {data.categories.map((cat, ci) => (
          <details key={ci} open={ci === 0} className="rounded-xl border border-[#dadfe6] bg-white shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-sm font-semibold">
              <input
                value={cat.name}
                onChange={(e) => renameCategory(ci, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xs rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold outline-none hover:border-[#dadfe6] focus:border-[#d9a15b]"
              />
              <span className="shrink-0 font-mono text-xs font-normal text-[#838b9b]">{cat.items.length} блюд</span>
            </summary>
            <div className="border-t border-[#eef0f3] p-4">
              <div className="flex flex-col gap-2">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2">
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
        ))}
      </div>
    </div>
  );
}

/* ============== Контакты ============== */
function ContactsSection({ data, setData, onSave, onDownload }: { data: Contacts; setData: (d: Contacts) => void; onSave: () => void; onDownload: () => void }) {
  const set = (k: keyof Contacts, v: string | number) => setData({ ...data, [k]: v });
  return (
    <div>
      <SectionHeader title="Контакты" hint="Адрес, телефоны, часы работы" onSave={onSave} onDownload={onDownload} />
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Название"><Input value={data.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Адрес"><Input value={data.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Телефон (бронь стола)"><Input value={data.phoneTable} onChange={(e) => set("phoneTable", e.target.value)} /></Field>
          <Field label="Телефон (банкетный отдел)"><Input value={data.phoneEvents} onChange={(e) => set("phoneEvents", e.target.value)} /></Field>
          <Field label="Часы работы"><Input value={data.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
          <Field label="Отель-партнёр"><Input value={data.hotelName} onChange={(e) => set("hotelName", e.target.value)} /></Field>
          <Field label="Сайт отеля"><Input value={data.hotelUrl} onChange={(e) => set("hotelUrl", e.target.value)} /></Field>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-[#838b9b]">{label}</span>
      {children}
    </label>
  );
}

/* ============== Залы ============== */
function HallsSection({ data, setData, onSave, onDownload }: { data: HallsData; setData: (d: HallsData) => void; onSave: () => void; onDownload: () => void }) {
  function updateHall(i: number, patch: Partial<Hall>) {
    const next = structuredClone(data);
    next.halls[i] = { ...next.halls[i], ...patch };
    setData(next);
  }
  return (
    <div>
      <SectionHeader title="Банкетные залы" hint={`${data.halls.length} залов`} onSave={onSave} onDownload={onDownload} />
      <div className="flex flex-col gap-4">
        {data.halls.map((h, i) => (
          <Card key={h.slug}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Название"><Input value={h.name} onChange={(e) => updateHall(i, { name: e.target.value })} /></Field>
              <Field label="Вместимость"><Input value={h.capacity} onChange={(e) => updateHall(i, { capacity: e.target.value })} /></Field>
              <Field label="Площадь"><Input value={h.area} onChange={(e) => updateHall(i, { area: e.target.value })} placeholder="например, 400 м²" /></Field>
              <Field label="Фото в галерее"><span className="flex h-11 items-center text-sm text-[#838b9b]">{h.photoCount} шт. — управляется отдельно</span></Field>
              <div className="sm:col-span-2">
                <Field label="Описание"><Textarea value={h.description} onChange={(e) => updateHall(i, { description: e.target.value })} rows={2} /></Field>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============== История ============== */
function HistorySection({ data, setData, onSave, onDownload }: { data: HistoryData; setData: (d: HistoryData) => void; onSave: () => void; onDownload: () => void }) {
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
  function updateGuestQuote(i: number, patch: Partial<Quote>) {
    const next = structuredClone(data);
    next.guestQuotes[i] = { ...next.guestQuotes[i], ...patch };
    setData(next);
  }

  return (
    <div>
      <SectionHeader title="История" hint="Хронология, цитата владельца, цитаты почётных гостей" onSave={onSave} onDownload={onDownload} />

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#838b9b]">Хронология</p>
      <div className="flex flex-col gap-3">
        {data.entries.map((e, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <Input value={e.year} onChange={(ev) => updateEntry(i, { year: ev.target.value })} className="w-24 shrink-0" />
              <div className="flex-1">
                <Input value={e.title} onChange={(ev) => updateEntry(i, { title: ev.target.value })} className="mb-2 font-semibold" />
                <Textarea value={e.body} onChange={(ev) => updateEntry(i, { body: ev.target.value })} rows={2} />
              </div>
              <RemoveBtn onClick={() => removeEntry(i)} />
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
            <Textarea value={q.text} onChange={(e) => updateGuestQuote(i, { text: e.target.value })} rows={2} className="mb-3" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Автор"><Input value={q.author} onChange={(e) => updateGuestQuote(i, { author: e.target.value })} /></Field>
              <Field label="Роль"><Input value={q.role} onChange={(e) => updateGuestQuote(i, { role: e.target.value })} /></Field>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============== Отзывы ============== */
function ReviewsSection({ data, setData, onSave, onDownload }: { data: ReviewsData; setData: (d: ReviewsData) => void; onSave: () => void; onDownload: () => void }) {
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
  return (
    <div>
      <SectionHeader title="Отзывы гостей" hint={`${data.reviews.length} отзывов`} onSave={onSave} onDownload={onDownload} />
      <div className="flex flex-col gap-3">
        {data.reviews.map((r, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Input value={r.author} onChange={(e) => update(i, { author: e.target.value })} className="mb-2 max-w-xs font-semibold" />
                <Textarea value={r.text} onChange={(e) => update(i, { text: e.target.value })} rows={2} />
              </div>
              <RemoveBtn onClick={() => remove(i)} />
            </div>
          </Card>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить отзыв</button>
    </div>
  );
}

/* ============== Автомойка ============== */
function CarwashSection({ data, setData, onSave, onDownload }: { data: CarwashData; setData: (d: CarwashData) => void; onSave: () => void; onDownload: () => void }) {
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
  return (
    <div>
      <SectionHeader title="Автомойка — категории услуг" hint={`${data.categories.length} категорий`} onSave={onSave} onDownload={onDownload} />
      <Card>
        <div className="flex flex-col gap-2">
          {data.categories.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
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
function EventsSection({ data, setData, onSave, onDownload }: { data: EventsBoardData; setData: (d: EventsBoardData) => void; onSave: () => void; onDownload: () => void }) {
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
  return (
    <div>
      <SectionHeader title="Афиша событий" hint={data.events.length ? `${data.events.length} событий` : "Пока пусто — добавьте первое событие"} onSave={onSave} onDownload={onDownload} />
      <div className="flex flex-col gap-3">
        {data.events.map((ev, i) => (
          <Card key={i}>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Название"><Input value={ev.title} onChange={(e) => update(i, { title: e.target.value })} /></Field>
                <Field label="Дата"><Input type="date" value={ev.date} onChange={(e) => update(i, { date: e.target.value })} /></Field>
                <div className="sm:col-span-2">
                  <Field label="Описание"><Textarea value={ev.description ?? ""} onChange={(e) => update(i, { description: e.target.value })} rows={2} /></Field>
                </div>
              </div>
              <RemoveBtn onClick={() => remove(i)} />
            </div>
          </Card>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 text-sm font-medium text-[#b5651d] hover:underline">+ Добавить событие</button>
      {!data.events.length && <p className="mt-4 text-sm text-[#838b9b]">На публичном сайте вместо афиши сейчас показывается честная заглушка «событий пока нет» — как только добавите здесь хотя бы одно, на сайте появится реальная афиша.</p>}
    </div>
  );
}
