export const soDigitos = (v: string) => v.replace(/\D/g, "");

/** Máscara "(87) 99999-9999" (ou "(87) 3861-1234" para fixo). */
export function mascaraTelefone(v: string) {
  const d = soDigitos(v).slice(0, 11);
  if (!d.length) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const telefoneValido = (v: string) => {
  const n = soDigitos(v).length;
  return n === 10 || n === 11;
};

/** Link do WhatsApp (wa.me) com DDI 55 e mensagem opcional. */
export function linkWhatsApp(telefone: string, mensagem?: string) {
  const d = soDigitos(telefone);
  const numero = d.startsWith("55") && d.length > 11 ? d : `55${d}`;
  return `https://wa.me/${numero}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
}
