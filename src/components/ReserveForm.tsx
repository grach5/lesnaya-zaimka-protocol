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
    const data = new FormData(e.currentTarget);
    const nextErrors: Record<string, string> = {};
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const date = String(data.get("date") ?? "").trim();
    const guests = String(data.get("guests") ?? "").trim();
    if (!name) nextErrors.name = "Укажите имя";
    if (!phone) nextErrors.phone = "Укажите телефон";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-name">Ваше имя</Label>
        <Input id="r-name" name="name" autoComplete="name" aria-invalid={!!errors.name} />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-phone">Телефон</Label>
        <Input id="r-phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-date">Дата</Label>
        <Input id="r-date" name="date" type="date" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="r-guests">Число гостей</Label>
        <Input id="r-guests" name="guests" type="number" min={1} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" className="h-11 w-full sm:w-auto">Отправить заявку в WhatsApp</Button>
      </div>
    </form>
  );
}
