import { toast } from "sonner";

/** Copia para a área de transferência (com alternativa para navegadores sem a API). */
export async function copiarTexto(texto: string, mensagem = "Copiado") {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(mensagem);
    return;
  } catch {
    /* tenta o método antigo abaixo */
  }
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    if (ok) toast.success(mensagem);
    else throw new Error("copy");
  } catch {
    toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
  }
}
