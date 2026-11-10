import type { Loja } from "@/types";
import { formatHourLabel } from "./format";

export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Fuso da loja (Petrolina-PE): o status não depende do relógio/fuso do aparelho de quem vê. */
export const FUSO_LOJA = "America/Recife";

const fmtFuso = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSO_LOJA,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const SEMANA_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Dia da semana (0 = domingo) e minuto do dia no fuso da loja. */
export function agoraNaLoja(agora = new Date()) {
  const partes = fmtFuso.formatToParts(agora);
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? "0";
  return { dia: SEMANA_EN.indexOf(p("weekday")), min: (Number(p("hour")) % 24) * 60 + Number(p("minute")) };
}

export interface StatusLoja {
  aberta: boolean;
  /** "Fecha às 21h30", "Fechado", "Pausada" … */
  texto: string;
}

/** Aberta/fechada pelo horário do dia (considera expediente que passa da meia-noite) e pela pausa. */
export function statusLoja(loja: Loja, agora = new Date()): StatusLoja {
  if (loja.pausada) return { aberta: false, texto: "Pausada" };

  const { dia, min: m } = agoraNaLoja(agora);
  const hoje = loja.horarios[dia];
  const ontem = loja.horarios[(dia + 6) % 7];

  // Expediente de ontem que atravessou a meia-noite
  if (ontem?.aberto && toMin(ontem.fecha) < toMin(ontem.abre) && m < toMin(ontem.fecha)) {
    return { aberta: true, texto: `Fecha às ${formatHourLabel(ontem.fecha)}` };
  }
  if (hoje?.aberto) {
    const abre = toMin(hoje.abre);
    const fecha = toMin(hoje.fecha);
    const aberta = fecha > abre ? m >= abre && m < fecha : m >= abre;
    if (aberta) return { aberta: true, texto: `Fecha às ${formatHourLabel(hoje.fecha)}` };
  }
  return { aberta: false, texto: "Fechado" };
}

/** Próxima abertura: "hoje às 08:00", "amanhã às 08:00", "segunda às 08:00" (null se nunca abre). */
export function proximaAbertura(loja: Loja, agora = new Date()): string | null {
  const { dia, min } = agoraNaLoja(agora);
  for (let k = 0; k < 8; k++) {
    const d = (dia + k) % 7;
    const h = loja.horarios[d];
    if (!h?.aberto || (k === 0 && toMin(h.abre) <= min)) continue;
    const quando = k === 0 ? "hoje" : k === 1 ? "amanhã" : DIAS_SEMANA[d].toLowerCase();
    return `${quando} às ${h.abre}`;
  }
  return null;
}

export const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || nome.slice(0, 2).toUpperCase();
