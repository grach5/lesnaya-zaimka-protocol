// GitHub Pages project-страницы отдаются из подпапки (/lesnaya-zaimka-protocol/...),
// а не из корня домена — все жёстко прописанные абсолютные пути ("/menu/", "/img/...")
// нужно проводить через этот хелпер, иначе после деплоя ссылки и картинки будут вести
// на несуществующий /menu/ вместо /lesnaya-zaimka-protocol/menu/.
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
