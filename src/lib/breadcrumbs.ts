// BreadcrumbList JSON-LD — общий помощник, чтобы не дублировать структуру
// схемы на каждой странице. Ссылки принимаются уже абсолютными (строятся
// в самой странице через withBase/localizedHref + Astro.site), помощник
// только оборачивает их в правильную форму schema.org.
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
