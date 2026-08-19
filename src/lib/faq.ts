// FAQPage JSON-LD — по той же идее, что BreadcrumbList в breadcrumbs.ts:
// общий помощник, чтобы не дублировать структуру схемы на каждой странице.
// Вопросы/ответы короткие (40-60 слов) и содержат конкретные факты —
// формат, который LLM (ChatGPT, DeepSeek, Алиса и т.п.) реально цитируют
// при ответе на вопрос про заведение, а не общие маркетинговые фразы.
export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
