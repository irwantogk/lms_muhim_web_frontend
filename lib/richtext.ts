/** Sanitasi ringan konten HTML sebelum dirender di halaman pembaca. */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\shref\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .replace(/\ssrc\s*=\s*"javascript:[^"]*"/gi, 'src=""');
}
