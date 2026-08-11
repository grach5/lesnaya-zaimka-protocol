import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Форма брони стола — тот же демонстрационный паттерн, что и в BookingForm.tsx
// на /events/ (см. комментарий там): реального адресата заявки пока нет.
export default function ReserveForm() {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nextErrors: Record<string, string> = {};
    if (!String(data.get("name") ?? "").trim()) nextErrors.name = "Укажите имя";
    if (!String(data.get("phone") ?? "").trim()) nextErrors.phone = "Укажите телефон";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="border border-line bg-paper-raised p-8">
        <p className="font-display text-xl font-semibold text-ink">Заявка принята</p>
        <p className="mt-2 text-sm text-ink-soft">Мы перезвоним в течение 15 минут, чтобы подтвердить бронь.</p>
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
        <Button type="submit" className="w-full sm:w-auto">Отправить заявку</Button>
      </div>
    </form>
  );
}
