import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HALLS } from "@/data/halls";
import { CONTACTS } from "@/data/contacts";

// Форма заявки на мероприятие — единственный React-остров на странице /events/
// (client:load), остальная страница остаётся статичным HTML/CSS без гидратации.
// Раньше форма только валидировала на клиенте и показывала демонстрационное
// подтверждение, ничего никуда не отправляя (сайт статический, без бэкенда) —
// исправлено на реальный WhatsApp click-to-chat на номер банкетного отдела
// (CONTACTS.whatsapp), тот же честный механизм, что и в ReserveForm/корзине.
const EVENT_TYPES = ["Свадьба", "Корпоратив", "Банкет", "Фуршет", "Другое"];

export default function BookingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nextErrors: Record<string, string> = {};

    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const date = String(data.get("date") ?? "").trim();
    const guestsRaw = String(data.get("guests") ?? "").trim();
    const guests = Number(guestsRaw);
    const type = String(data.get("type") ?? "").trim();
    const hall = String(data.get("hall") ?? "").trim();
    const comment = String(data.get("comment") ?? "").trim();

    if (!name) nextErrors.name = "Укажите имя";
    if (!phone) nextErrors.phone = "Укажите телефон";
    if (!date) nextErrors.date = "Укажите дату мероприятия";
    if (!guests || guests < 1) nextErrors.guests = "Укажите число гостей";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const fieldOrder = ["name", "phone", "date", "guests"] as const;
      const firstInvalid = fieldOrder.find((f) => nextErrors[f]);
      if (firstInvalid) e.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    const lines = [
      `Здравствуйте! Хочу оставить заявку на мероприятие в «${CONTACTS.name}»:`,
      "",
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Дата: ${date}`,
      `Гостей: ${guestsRaw}`,
      type && `Тип мероприятия: ${type}`,
      hall && `Зал: ${hall}`,
      comment && `Комментарий: ${comment}`,
    ].filter(Boolean);
    window.open(`${CONTACTS.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="border border-line bg-paper-raised p-8">
        <p className="font-display text-xl font-semibold text-ink">Открыли WhatsApp с вашей заявкой</p>
        <p className="mt-2 text-sm text-ink-soft">
          Осталось отправить сообщение — банкетный отдел свяжется с вами в течение рабочего дня.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 border border-line bg-paper-raised p-6 md:grid-cols-2 md:p-8" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-name">Ваше имя</Label>
        <Input id="ev-name" name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "ev-name-error" : undefined} />
        {errors.name && <p id="ev-name-error" className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-phone">Телефон</Label>
        <Input id="ev-phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "ev-phone-error" : undefined} />
        {errors.phone && <p id="ev-phone-error" className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-type">Тип мероприятия</Label>
        <select
          id="ev-type"
          name="type"
          className="h-11 border border-line bg-paper px-3 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-hall">Зал (если уже определились)</Label>
        <select
          id="ev-hall"
          name="hall"
          className="h-11 border border-line bg-paper px-3 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Подскажите вы</option>
          {HALLS.map((h) => (
            <option key={h.name} value={h.name}>{h.name} — {h.capacity}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-date">Дата</Label>
        <Input id="ev-date" name="date" type="date" aria-invalid={!!errors.date} aria-describedby={errors.date ? "ev-date-error" : undefined} />
        {errors.date && <p id="ev-date-error" className="text-xs text-destructive">{errors.date}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-guests">Число гостей</Label>
        <Input id="ev-guests" name="guests" type="number" min={1} aria-invalid={!!errors.guests} aria-describedby={errors.guests ? "ev-guests-error" : undefined} />
        {errors.guests && <p id="ev-guests-error" className="text-xs text-destructive">{errors.guests}</p>}
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="ev-comment">Комментарий</Label>
        <Textarea id="ev-comment" name="comment" rows={3} placeholder="Формат, пожелания по меню, музыка и т.д." />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" className="plaque h-11 w-full md:w-auto">Отправить заявку в WhatsApp</Button>
      </div>
    </form>
  );
}
