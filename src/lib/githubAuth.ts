// Хранилище токена GitHub для панели администратора.
//
// Раньше здесь был PKCE-вход через GitHub App (redirect на
// github.com/login/oauth/authorize, затем обмен кода на токен). Но обмен
// кода на токен (github.com/login/oauth/access_token) GitHub не разрешает
// делать напрямую из браузера — эндпоинт не отдаёт CORS-заголовки, запрос
// падает с "Failed to fetch". У статического GitHub Pages нет сервера,
// который мог бы сделать этот обмен вместо браузера, поэтому OAuth-вход
// в принципе не может тут работать без отдельного бэкенда.
//
// Вместо этого администратор один раз вставляет в панель личный
// fine-grained Personal Access Token (создаётся на
// github.com/settings/personal-access-tokens/new), выданный только на этот
// репозиторий с правом Contents: Read and write. Дальше все запросы к
// api.github.com идут с этим токеном в заголовке Authorization — сам REST
// API (в отличие от эндпоинта обмена OAuth-кода) CORS с браузера
// поддерживает, поэтому сохранение через Contents API (см. githubContent.ts)
// работает нормально.

const TOKEN_KEY = "zaimka-admin-gh-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
