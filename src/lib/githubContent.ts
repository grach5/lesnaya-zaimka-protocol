// Чтение/запись файлов данных сайта напрямую через GitHub Contents API —
// именно так реальное «Сохранить» в панели превращается в настоящий коммит
// в репозиторий (который дальше сам пересобирает сайт — тот же пайплайн,
// что при обычном git push).
const OWNER = "grach5";
const REPO = "lesnaya-zaimka-protocol";
const BRANCH = "master";

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export type SaveResult = { commitUrl: string };

/**
 * Сохраняет JSON-объект в файл src/data/<name>.json репозитория одним коммитом.
 * path — например "src/data/menu.json".
 */
export async function saveJsonFile(token: string, path: string, data: unknown, commitMessage: string): Promise<SaveResult> {
  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  // GitHub требует SHA текущей версии файла, чтобы не перезаписать чужие
  // параллельные правки вслепую — сначала читаем актуальный SHA.
  const currentRes = await fetch(`${apiUrl}?ref=${BRANCH}`, { headers });
  if (!currentRes.ok) {
    const body = await currentRes.text();
    throw new Error(`Не удалось прочитать текущий файл (${currentRes.status}): ${body}`);
  }
  const current = await currentRes.json();

  const content = utf8ToBase64(JSON.stringify(data, null, 2) + "\n");
  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: commitMessage,
      content,
      sha: current.sha,
      branch: BRANCH,
    }),
  });
  if (!putRes.ok) {
    const body = await putRes.json().catch(() => ({}));
    throw new Error(body.message || `GitHub отклонил сохранение (${putRes.status})`);
  }
  const result = await putRes.json();
  return { commitUrl: result.commit?.html_url ?? `https://github.com/${OWNER}/${REPO}/commits/${BRANCH}` };
}

/** Проверка токена: реальное имя вошедшего пользователя, чтобы показать в шапке панели. */
export async function fetchViewer(token: string): Promise<{ login: string; avatarUrl: string }> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error("Токен недействителен или истёк.");
  const data = await res.json();
  return { login: data.login, avatarUrl: data.avatar_url };
}
