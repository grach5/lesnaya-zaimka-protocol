// Корзина предзаказа — по прямому запросу («нужна корзина для предзаказа либо
// собой»). Сайт статический (GitHub Pages, без бэкенда), настоящую оплату
// онлайн подключить нельзя без реального договора ресторана с платёжным
// провайдером (эквайринг/ЮKassa и т.п.) — это решение бизнеса, не то, что можно
// сделать автономно. Поэтому «отправка» — реальный работающий механизм без
// подделки: WhatsApp click-to-chat deep-link на настоящий номер ресторана
// (CONTACTS.whatsapp), с предзаполненным текстом заказа. Никакого fake-checkout,
// который никуда не отправляется.
export type CartItem = { name: string; price: number; qty: number };

const STORAGE_KEY = "zaimka-cart";
const CHANGE_EVENT = "cart:change";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage недоступен (приватный режим) — корзина просто не переживёт перезагрузку
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function getCart(): CartItem[] {
  return read();
}

export function addToCart(name: string, price: number): void {
  const items = read();
  const existing = items.find((i) => i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    items.push({ name, price, qty: 1 });
  }
  write(items);
}

export function setQty(name: string, qty: number): void {
  const items = read();
  const existing = items.find((i) => i.name === name);
  if (!existing) return;
  if (qty <= 0) {
    write(items.filter((i) => i.name !== name));
  } else {
    existing.qty = qty;
    write(items);
  }
}

export function removeFromCart(name: string): void {
  write(read().filter((i) => i.name !== name));
}

export function clearCart(): void {
  write([]);
}

export function cartCount(items: CartItem[] = read()): number {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function cartTotal(items: CartItem[] = read()): number {
  return items.reduce((n, i) => n + i.qty * i.price, 0);
}

export function onCartChange(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
