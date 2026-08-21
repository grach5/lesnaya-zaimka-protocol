import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HALLS } from "@/data/halls";
import { CONTACTS } from "@/data/contacts";
import { withBase } from "@/lib/url";
import { getContent, type Locale } from "@/lib/i18n";
import { sendToCrm } from "@/lib/crm";

// Форма заявки на мероприятие — единственный React-остров на странице /events/
// (client:load), остальная страница остаётся статичным HTML/CSS без гидратации.
// Раньше форма только валидировала на клиенте и показывала демонстрационное
// подтверждение, ничего никуда не отправляя (сайт статический, без бэкенда) —
// исправлено на реальный WhatsApp click-to-chat на номер банкетного отдела
// (CONTACTS.whatsapp), тот же честный механизм, что и в ReserveForm/корзине.
interface Props {
  locale?: Locale;
}

export default function BookingForm({ locale = "ru" }: Props) {
  const t = getContent(locale);
  // Значения (то, что уходит в сообщение банкетному отделу) — всегда по-русски,
  // независимо от языка гостя: сообщение читают сотрудники ресторана.
  // Видимый гостю текст в <option> — переведён.
  const ruT = getContent("ru");
  const EVENT_TYPE_VALUES = ruT.ui.common.eventTypes;
  const EVENT_TYPE_LABELS = t.ui.common.eventTypes;
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

    const consent = data.get("consent") === "on";

    if (!name) nextErrors.name = t.ui.common.errName;
    if (!phone) nextErrors.phone = t.ui.common.errPhone;
    if (!date) nextErrors.date = t.ui.common.errDate;
    if (!guests || guests < 1) nextErrors.guests = t.ui.common.errGuests;
    if (!consent) nextErrors.consent = t.ui.common.errConsent;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const fieldOrder = ["name", "phone", "date", "guests", "consent"] as const;
      const firstInvalid = fieldOrder.find((f) => nextErrors[f]);
      if (firstInvalid) e.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    // Текст сообщения всегда по-русски — его читают сотрудники банкетного
    // отдела, независимо от языка, на котором гость заполнял форму на сайте.
    // Пометка языка гостя в конце — чтобы менеджер знал, на каком языке отвечать.
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
      locale !== "ru" && `(Заявка с ${locale.toUpperCase()}-версии сайта)`,
    ].filter(Boolean);
    window.open(`${CONTACTS.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    sendToCrm({ source: "event", name, phone, date, guests: guestsRaw, eventType: type, hall, comment, locale, pageUrl: window.location.href });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="border border-line bg-paper-raised p-8">
        <p className="font-display text-xl font-semibold text-ink">{t.ui.common.openedWhatsapp}</p>
        <p className="mt-2 text-sm text-ink-soft">
          {t.ui.common.eventFormThanks}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 border border-line bg-paper-raised p-6 md:grid-cols-2 md:p-8" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-name">{t.ui.common.yourName}</Label>
        <Input id="ev-name" name="name" autoComplete="name" aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? "ev-name-error" : undefined} />
        {errors.name && <p id="ev-name-error" role="alert" className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-phone">{t.ui.common.phone}</Label>
        <Input id="ev-phone" name="phone" type="tel" autoComplete="tel" aria-required="true" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "ev-phone-error" : undefined} />
        {errors.phone && <p id="ev-phone-error" role="alert" className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-type">{t.ui.common.eventType}</Label>
        <select
          id="ev-type"
          name="type"
          className="h-11 border border-line bg-paper px-3 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {EVENT_TYPE_VALUES.map((value, i) => (
            <option key={value} value={value}>{EVENT_TYPE_LABELS[i]}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-hall">{t.ui.common.hallIfKnown}</Label>
        <select
          id="ev-hall"
          name="hall"
          className="h-11 border border-line bg-paper px-3 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">{t.ui.common.hallSuggestPlaceholder}</option>
          {HALLS.map((h, i) => (
            <option key={h.name} value={h.name}>{t.data.halls[i]?.name ?? h.name} — {t.data.halls[i]?.capacity ?? h.capacity}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-date">{t.ui.common.date}</Label>
        <Input id="ev-date" name="date" type="date" aria-required="true" aria-invalid={!!errors.date} aria-describedby={errors.date ? "ev-date-error" : undefined} />
        {errors.date && <p id="ev-date-error" role="alert" className="text-xs text-destructive">{errors.date}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-guests">{t.ui.common.guests}</Label>
        <Input id="ev-guests" name="guests" type="number" min={1} aria-required="true" aria-invalid={!!errors.guests} aria-describedby={errors.guests ? "ev-guests-error" : undefined} />
        {errors.guests && <p id="ev-guests-error" role="alert" className="text-xs text-destructive">{errors.guests}</p>}
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="ev-comment">{t.ui.common.comment}</Label>
        <Textarea id="ev-comment" name="comment" rows={3} placeholder={t.ui.common.commentPlaceholder} />
      </div>

      <div className="flex items-start gap-2.5 md:col-span-2">
        <input
          id="ev-consent"
          name="consent"
          type="checkbox"
          aria-required="true"
          aria-invalid={!!errors.consent}
          aria-describedby={errors.consent ? "ev-consent-error" : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-burgundy)]"
        />
        <label htmlFor="ev-consent" className="text-xs text-ink-soft">
          {t.ui.common.consentLabel}{" "}
          <a href={withBase(locale === "ru" ? "/privacy/" : `/${locale}/privacy/`)} target="_blank" rel="noopener" className="text-brass underline underline-offset-2">
            {t.ui.common.privacyPolicyLink}
          </a>
        </label>
      </div>
      {errors.consent && <p id="ev-consent-error" role="alert" className="md:col-span-2 -mt-3 text-xs text-destructive">{errors.consent}</p>}

      <div className="md:col-span-2">
        <Button type="submit" className="plaque h-11 w-full md:w-auto">{t.ui.common.sendToWhatsapp}</Button>
      </div>
    </form>
  );
}
