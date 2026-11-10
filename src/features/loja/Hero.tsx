import { Link } from "react-router-dom";
import { LayoutDashboard, LogIn, MapPin, Truck, Wallet } from "lucide-react";
import type { Loja } from "@/types";
import { iniciais, proximaAbertura, statusLoja } from "@/lib/loja";
import { formatCurrency } from "@/lib/format";
import { IconeWhatsApp } from "./pecas";
import { useAgora } from "./useAgora";

function textoStatus(loja: Loja, agora: Date) {
  const s = statusLoja(loja, agora);
  if (s.aberta) return { aberta: true, texto: `Aberto agora · ${s.texto.toLowerCase()}` };
  if (loja.pausada) return { aberta: false, texto: "Pausada · sem pedidos no momento" };
  const abre = proximaAbertura(loja, agora);
  return { aberta: false, texto: abre ? `Fechado · abre ${abre}` : "Fechado" };
}

export function Hero({
  loja,
  pedidoMinimo,
  linkWhats,
  logado,
}: {
  loja: Loja;
  pedidoMinimo: number;
  linkWhats: string | null;
  logado: boolean;
}) {
  const agora = useAgora();
  const status = textoStatus(loja, agora);
  const [primeira, ...resto] = loja.nome.split(" ");

  return (
    <header className="hero">
      <div className="sun" aria-hidden="true" />
      <div className="moon" aria-hidden="true" />
      <div className="wrap">
        <div className="topbar">
          <a className="brand" href="#cardapio">
            {loja.logo_url ? (
              <img src={loja.logo_url} alt={`Logo ${loja.nome}`} />
            ) : (
              <span className="sem-logo" aria-hidden>
                {iniciais(loja.nome)}
              </span>
            )}
            <b>
              {primeira}
              {resto.length > 0 && (
                <>
                  <br />
                  {resto.join(" ")}
                </>
              )}
            </b>
          </a>
          <div className="top-acoes">
            <span className={status.aberta ? "status" : "status closed"}>
              <i />
              <span>{status.texto}</span>
            </span>
            {logado ? (
              <Link className="entrar" to="/gestao-pedidos">
                <LayoutDashboard aria-hidden /> Ir para o painel
              </Link>
            ) : (
              <Link className="entrar" to="/login" title="Acesso da equipe da loja">
                <LogIn aria-hidden /> Entrar
              </Link>
            )}
          </div>
        </div>

        <div className="hero-copy">
          <div className="eyebrow">
            Frios · Queijos · Doces{loja.cidade ? ` · ${loja.cidade}${loja.uf ? `-${loja.uf}` : ""}` : ""}
          </div>
          <h1>
            Sabores do <em>Agreste</em> e de Minas
          </h1>
          <p>
            Queijo coalho de Caicó, canastra da Serra, doce de leite de tacho, café, mel e o pão de queijo da roça. Escolha
            aqui e finalize o pedido direto no nosso WhatsApp.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-light" href="#cardapio">
              Ver o cardápio
            </a>
            {linkWhats && (
              <a className="btn btn-ghost" href={linkWhats} target="_blank" rel="noopener noreferrer">
                <IconeWhatsApp />
                <span>
                  <span className="wa-l">Falar no </span>WhatsApp
                </span>
              </a>
            )}
          </div>
        </div>

        <div className="facts">
          {loja.endereco && (
            <span>
              <MapPin aria-hidden />
              {loja.endereco}
              {loja.bairro ? ` · ${loja.bairro}` : ""}
            </span>
          )}
          <span>
            <Truck aria-hidden />
            Entrega e retirada
          </span>
          {pedidoMinimo > 0 && (
            <span className="num">
              <Wallet aria-hidden />
              Pedido mínimo {formatCurrency(pedidoMinimo)}
            </span>
          )}
        </div>
      </div>
      <svg className="horizon" viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 150V96c90-18 170-30 260-22 70 6 120 26 200 22 110-6 170-40 290-44 120-4 190 34 300 36 120 2 200-30 300-34 40-2 70 2 90 6V150z" />
        <path d="M168 98V40a9 9 0 0 1 18 0v58zM186 70h12V54a7 7 0 0 1 14 0v26h-26zM168 78h-12a7 7 0 0 1-7-7V58a6 6 0 0 1 12 0v10h7z" />
      </svg>
    </header>
  );
}
