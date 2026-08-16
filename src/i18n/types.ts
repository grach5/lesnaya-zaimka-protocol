// Единая форма переводимого контента — одна и та же схема для en/zh/ko.
// РУССКИЙ текст остаётся жёстко прописан в *.astro страницах (без изменений,
// без риска для действующего сайта); эта схема используется только для
// не-русских версий и для локализуемых общих компонентов (Header/Footer/...).
export type MenuCategoryContent = { name: string; items: string[] };

export type HallContent = { name: string; description: string; capacity: string; area?: string };

export type HistoryEntryContent = { year: string; title: string; body: string };

export type SiteContent = {
  ui: {
    nav: {
      restaurantGroup: string;
      history: string;
      mainMenu: string;
      kidsMenuPdf: string;
      barMenuPdf: string;
      interior: string;
      hotelGroup: string;
      bookRoom: string;
      sauna: string;
      hotelServices: string;
      banquetGroup: string;
      hallRental: string;
      banquetMenuPdf: string;
      eventsCatering: string;
      carwash: string;
      reviews: string;
      gallery: string;
      contacts: string;
      home: string;
      openMenuAria: string;
      closeMenuAria: string;
    };
    common: {
      eventRequestBtn: string;
      bookTableBtn: string;
      openPreorderAria: string;
      writeWhatsapp: string;
      sendToWhatsapp: string;
      openedWhatsapp: string;
      eventFormThanks: string;
      reserveFormThanks: string;
      yourName: string;
      phone: string;
      date: string;
      guests: string;
      eventType: string;
      hallIfKnown: string;
      hallSuggestPlaceholder: string;
      comment: string;
      commentPlaceholder: string;
      errName: string;
      errPhone: string;
      errDate: string;
      errDatePast: string;
      errGuests: string;
      errConsent: string;
      consentLabel: string;
      privacyPolicyLink: string;
      eventTypes: string[];
      prevPhotoAria: string;
      nextPhotoAria: string;
      closeAria: string;
    };
    footer: {
      tagline: string;
      carwashGroup: string;
      carwashAbout: string;
      moreGroup: string;
      contactsGroup: string;
      bookTablePhoneNote: string;
      banquetDeptNote: string;
      nearbyGroup: string;
      hotelAndSauna: string;
      copyright: string;
      privacyPolicy: string;
      animationsOn: string;
      animationsOff: string;
      animationsLabel: string;
    };
    cart: {
      title: string;
      closeAria: string;
      empty: string;
      openMenu: string;
      formatLabel: string;
      formatHall: string;
      formatTakeaway: string;
      formatDelivery: string;
      total: string;
      submit: string;
      notPaymentNote: string;
      decreaseAria: string;
      increaseAria: string;
      whatsappGreeting: string;
      totalLine: string;
    };
  };
  pages: {
    index: {
      title: string; description: string; kicker: string; h1: string; lead: string;
      shootingBadge: string; statFoundedYear: string; statVisits: string; statHalls: string; statCuisines: string;
      filmAriaLabel: string; muteOnAria: string; muteOffAria: string;
      eventsBoardEyebrow: string; eventsBoardH2: string; eventsEmptyText: string;
      reviewsEyebrow: string; reviewsH2: string; reviewsDgisLabel: string; reviewsDgisTitle: string;
      reviewsDgisNote: string; reviewsDgisOpen: string;
    };
    menu: {
      title: string; description: string; eyebrow: string; h1: string; lead: string;
      preorderNote: string; kidsMenuBtn: string; barMenuBtn: string; addItemAria: string;
    };
    history: {
      title: string; description: string; eyebrow: string; h1: string; lead: string;
      honoredEyebrow: string; honoredH2: string; carouselTitle: string; prevAria: string; nextAria: string;
      tagDocument: string; tagChronicle: string;
    };
    events: {
      title: string; description: string; eyebrow: string; h1: string; lead: string; menuPdfBtn: string;
      hallsEyebrow: string; hallsH2: string; photosCountSuffix: string;
      formEyebrow: string; formH2: string; formLead: string; deptLabel: string; formNote: string;
      capacityLabel: string; areaLabel: string; hallPhotoAria: string;
    };
    gallery: { title: string; description: string; eyebrow: string; h1: string; lead: string; allPhotos: string };
    contacts: {
      title: string; description: string; eyebrow: string; h1: string; lead: string;
      addressLabel: string; tableBookingLabel: string; eventsLabel: string; whatsappLabel: string;
      hoursLabel: string; nearbyLabel: string; hotelAndSauna: string; routeBtn: string;
      bookTitle: string; bookLead: string;
    };
    reviews: { title: string; description: string; eyebrow: string; h1: string; lead: string; honoredEyebrow: string; shareLead: string };
    carwash: { title: string; description: string; eyebrow: string; h1: string; lead: string; servicesEyebrow: string; note: string };
    privacy: {
      title: string; description: string; docLabel: string; h1: string; effective: string;
      s1h: string; s1b: string; s2h: string; s2b: string; s3h: string; s3b: string;
      s4h: string; s4b: string; s5h: string; s5b: string; s6h: string;
      phoneLabel: string; whatsappLabel: string; whatsappLinkText: string;
    };
    notFound: { title: string; description: string; errorLabel: string; h1: string; lead: string; home: string; menu: string; events: string; contacts: string };
  };
  data: {
    menuCategories: MenuCategoryContent[];
    halls: HallContent[];
    eventFormats: string[];
    history: HistoryEntryContent[];
    ownerQuote: { text: string; author: string; role: string };
    guestQuotes: { text: string; author: string; role: string }[];
    reviews: { author: string; text: string }[];
    carwashCategories: string[];
    gallerySections: string[];
  };
};

export const LOCALES = ["ru", "en", "zh", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_LABELS: Record<Locale, string> = { ru: "RU", en: "EN", zh: "中文", ko: "한국어" };
