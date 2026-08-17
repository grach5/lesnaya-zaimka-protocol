// Безопасный вход в GitHub из чистого статического сайта — PKCE-флоу для
// GitHub App (НЕ OAuth App: у OAuth App обмен кода на токен требует секрет,
// который негде спрятать на статическом сайте; GitHub App с PKCE обменивает
// код на токен вообще без секрета — единственный вариант, который безопасно
// работает без своего сервера-посредника).
//
// Client ID хранится не в коде, а вводится администратором прямо в панели
// (см. AdminPanel.tsx) и лежит в localStorage только этого браузера — так
// смену/переезд GitHub App не нужно сопровождать правкой кода и деплоем.

const TOKEN_KEY = "zaimka-admin-gh-token";
const VERIFIER_KEY = "zaimka-admin-pkce-verifier";
const CLIENT_ID_KEY = "zaimka-admin-gh-client-id";

function base64url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

function randomVerifier(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export function getClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) ?? "";
}
export function setClientId(id: string): void {
  localStorage.setItem(CLIENT_ID_KEY, id.trim());
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

/** Шаг 1: увести администратора на github.com для входа и подтверждения доступа. */
export async function startLogin(): Promise<void> {
  const clientId = getClientId();
  if (!clientId) throw new Error("Сначала укажите Client ID GitHub App в настройках.");
  const verifier = randomVerifier();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const challenge = base64url(await sha256(verifier));
  const redirectUri = window.location.origin + window.location.pathname;
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  window.location.href = url.toString();
}

/** Шаг 2: если в URL есть ?code=... (вернулись из GitHub) — обменять на токен. */
export async function completeLoginIfRedirected(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return false;

  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const clientId = getClientId();
  if (!verifier || !clientId) return false;

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      code,
      code_verifier: verifier,
      redirect_uri: window.location.origin + window.location.pathname,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || "GitHub не выдал токен доступа.");

  sessionStorage.setItem(TOKEN_KEY, data.access_token);
  sessionStorage.removeItem(VERIFIER_KEY);
  // Убираем ?code=... из адресной строки, чтобы не осталось в истории браузера.
  window.history.replaceState({}, "", window.location.pathname);
  return true;
}
