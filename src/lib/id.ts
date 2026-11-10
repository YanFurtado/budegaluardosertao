/** Gera um id único local (ex.: "cli-lq3k9x2a7f"). */
export function novoId(prefixo: string) {
  return `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
