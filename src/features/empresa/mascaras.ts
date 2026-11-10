const digitos = (v: string) => v.replace(/\D/g, "");

/** (87) 3861-1234 ou (87) 99876-5432 */
export function mascaraTelefone(v: string) {
  const d = digitos(v).slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 12.345.678/0001-90 */
export function mascaraCnpj(v: string) {
  return digitos(v)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** 56302-000 */
export function mascaraCep(v: string) {
  const d = digitos(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** "Budega Luar do Sertão" → "budega-luar-do-sertao" */
export function slugify(v: string) {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "www.site.com.br" → "https://www.site.com.br" (vazio continua vazio). */
export function normalizarSite(v: string) {
  const t = v.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export const siteValido = (v: string) => /^https?:\/\/[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i.test(normalizarSite(v));

export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
