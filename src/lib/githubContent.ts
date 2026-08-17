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
 * Прямая ссылка на файл в репозитории (raw.githubusercontent.com) — используется
 * для мгновенного превью только что загруженного фото в панели, пока сайт ещё
 * не пересобрался (правки, сохранённые через Contents API, это уже реальный
 * коммит в master, просто GitHub Pages публикует его не мгновенно).
 */
export function rawContentUrl(path: string): string {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;
}

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

/**
 * Загружает бинарный файл (фото) в репозиторий одним коммитом. content —
 * base64 БЕЗ префикса "data:...;base64," (см. src/lib/imageUpload.ts).
 * В отличие от saveJsonFile путь может ещё не существовать — тогда SHA
 * текущей версии просто не запрашиваем (создаём новый файл).
 */
export async function uploadBinaryFile(token: string, path: string, base64Content: string, commitMessage: string): Promise<SaveResult> {
  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  const currentRes = await fetch(`${apiUrl}?ref=${BRANCH}`, { headers });
  let sha: string | undefined;
  if (currentRes.ok) {
    sha = (await currentRes.json()).sha;
  } else if (currentRes.status !== 404) {
    const body = await currentRes.text();
    throw new Error(`Не удалось проверить путь загрузки (${currentRes.status}): ${body}`);
  }

  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ message: commitMessage, content: base64Content, sha, branch: BRANCH }),
  });
  if (!putRes.ok) {
    const body = await putRes.json().catch(() => ({}));
    throw new Error(body.message || `GitHub отклонил загрузку файла (${putRes.status})`);
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
