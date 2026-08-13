import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACTS } from "@/data/contacts";

// Форма брони стола — раньше была демонстрационным паттерном (только клиентская
// валидация, никуда ничего не отправлялось — сайт статический, без бэкенда).
// По факту на реальном сайте это означало, что гость видел «заявка принята»,
// хотя заявка нигде не оказывалась. Исправлено на тот же честный механизм,
// что и в корзине предзаказа (src/lib/cart.ts): реальный WhatsApp
// click-to-chat на номер ресторана (CONTACTS.whatsapp) с готовым текстом —
// открывается автоматически, отправка — уже руками гостя в самом WhatsApp.
export default function ReserveForm() {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const nextErrors: Record<string, string> = {};
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const date = String(data.get("date") ?? "").trim();
    const guests = String(data.get("guests") ?? "").trim();
    if (!name) nextErrors.name = "Укажите имя";
    if (!phone) nextErrors.phone = "Укажите телефон";
    if (date && date < new Date().toISOString().slice(0, 10)) nextErrors.date = "Дата уже прошла";
    if (guests && (Number(guests) < 1 || !Number.isFinite(Number(guests)))) nextErrors.guests = "Укажите число гостей";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // aria-invalid на инпутах обновится только после ре-рендера React — здесь
      // ищем поле для фокуса по собранным nextErrors напрямую, а не по DOM,
      // иначе фокус попадёт на устаревшее (ещё не отрисованное) состояние.
      const fieldOrder = ["name", "phone", "date", "guests"] as const;
      const firstInvalid = fieldOrder.find((f) => nextErrors[f]);
      if (firstInvalid) form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    const lines = [
      `Здравствуйте! Хочу забронировать стол в «${CONTACTS.name}»:`,
      "",
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      date && `Дата: ${date}`,
      guests && `Гостей: ${guests}`,
    ].filter(Boolean);
    window.open(`${CONTACTS.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="border border-line bg-paper-raised p-8">
        <p className="font-display text-xl font-semibold text-ink">Открыли WhatsApp с вашей заявкой</p>
        <p className="mt-2 text-sm text-ink-soft">
          Осталось отправить сообщение — как только оно придёт, мы подтвердим бронь.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 border border-line bg-paper-raised p-6 sm:grid-cols-2 md:p-8" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-name">Ваше имя</Label>
        <Input id="r-name" name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "r-name-error" : undefined} />
        {errors.name && <p id="r-name-error" className="text-xs text-destructive">{errors.name}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-phone">Телефон</Label>
        <Input id="r-phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "r-phone-error" : undefined} />
        {errors.phone && <p id="r-phone-error" className="text-xs text-destructive">{errors.phone}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-date">Дата</Label>
        <Input id="r-date" name="date" type="date" aria-invalid={!!errors.date} aria-describedby={errors.date ? "r-date-error" : undefined} />
        {errors.date && <p id="r-date-error" className="text-xs text-destructive">{errors.date}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-guests">Число гостей</Label>
        <Input id="r-guests" name="guests" type="number" min={1} aria-invalid={!!errors.guests} aria-describedby={errors.guests ? "r-guests-error" : undefined} />
        {errors.guests && <p id="r-guests-error" className="text-xs text-destructive">{errors.guests}</p>}
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" className="plaque h-11 w-full sm:w-auto">Отправить заявку в WhatsApp</Button>
      </div>
    </form>
  );
}
