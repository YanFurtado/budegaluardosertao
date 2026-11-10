/** Maior arquivo aceito antes de reduzir (a imagem salva fica bem menor). */
export const LIMITE_ARQUIVO_IMAGEM = 15 * 1024 * 1024;

function carregar(url: string) {
  return new Promise<HTMLImageElement>((ok, falha) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => falha(new Error("Não foi possível ler a imagem."));
    img.src = url;
  });
}

/**
 * Reduz a imagem (lado maior = `max` px) e devolve como data URL WebP — ou JPEG com fundo branco,
 * nos navegadores que não geram WebP. Mantém o armazenamento do navegador pequeno.
 */
export async function comprimirImagem(arquivo: File, max = 480, qualidade = 0.8): Promise<string> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Envie um arquivo de imagem (PNG, JPG, WebP ou SVG).");
  if (arquivo.size > LIMITE_ARQUIVO_IMAGEM) throw new Error("A imagem é grande demais (máximo de 15 MB).");

  const url = URL.createObjectURL(arquivo);
  try {
    const img = await carregar(url);
    const largura = img.naturalWidth || max;
    const altura = img.naturalHeight || max;
    const escala = Math.min(1, max / Math.max(largura, altura));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(largura * escala));
    canvas.height = Math.max(1, Math.round(altura * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível processar a imagem neste navegador.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const webp = canvas.toDataURL("image/webp", qualidade);
    if (webp.startsWith("data:image/webp")) return webp;

    // Sem WebP: JPEG não tem transparência, então pinta o fundo de branco antes.
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", qualidade);
  } finally {
    URL.revokeObjectURL(url);
  }
}
