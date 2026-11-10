import { Fragment } from "react";
import type { Loja } from "@/types";
import { DIAS_SEMANA, agoraNaLoja } from "@/lib/loja";
import { useAgora } from "./useAgora";

const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]; // segunda … domingo

export function InfoLoja({ loja, pagamentos }: { loja: Loja; pagamentos: string[] }) {
  const hoje = agoraNaLoja(useAgora()).dia;
  const cidadeUf = loja.cidade ? `${loja.cidade}${loja.uf ? ` - ${loja.uf}` : ""}` : "";
  const enderecoCompleto = [loja.endereco, loja.bairro, cidadeUf].filter(Boolean).join(", ");
  const insta = loja.instagram.replace(/^@/, "").trim();

  return (
    <section className="info" aria-label="Informações da loja">
      <div className="wrap">
        <div>
          <h2>Horários</h2>
          <dl className="hours">
            {ORDEM_DIAS.map((d) => {
              const h = loja.horarios[d];
              const cls = d === hoje ? "today" : undefined;
              return (
                <Fragment key={d}>
                  <dt className={cls}>{DIAS_SEMANA[d]}</dt>
                  <dd className={cls}>{h?.aberto ? `${h.abre} – ${h.fecha}` : "Fechado"}</dd>
                </Fragment>
              );
            })}
          </dl>
        </div>
        <div>
          <h2>Onde estamos</h2>
          {loja.endereco && (
            <address>
              {loja.endereco}
              {loja.bairro ? ` — ${loja.bairro}` : ""}
              {cidadeUf && (
                <>
                  <br />
                  {cidadeUf}
                </>
              )}
            </address>
          )}
          {enderecoCompleto && (
            <p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir no mapa
              </a>
            </p>
          )}
          {(loja.whatsapp || insta) && (
            <p>
              {loja.whatsapp && (
                <>
                  WhatsApp: <strong className="num">{loja.whatsapp}</strong>
                  {insta && <br />}
                </>
              )}
              {insta && (
                <>
                  Instagram:{" "}
                  <a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener noreferrer">
                    @{insta}
                  </a>
                </>
              )}
            </p>
          )}
        </div>
        <div>
          <h2>Formas de pagamento</h2>
          <ul className="pay">
            {pagamentos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="note" style={{ marginTop: 12 }}>
            A taxa de entrega depende do bairro e é confirmada pelo WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
