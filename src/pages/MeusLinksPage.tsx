import { Link } from "react-router-dom";
import { Copy, ExternalLink, Globe, MessageCircle, Camera, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/shared/CardHeader";
import { useAppStore } from "@/store/useAppStore";
import { copiarTexto } from "@/features/links/copiar";
import { QrCodeCard, type OpcaoQr } from "@/features/links/QrCodeCard";
import { slugify } from "@/features/empresa/mascaras";
import { linkWhatsApp } from "@/features/clientes/telefone";

interface LinkInfo {
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  cor: string;
  url: string | null;
  vazio: string;
}

function LinkCard({ link }: { link: LinkInfo }) {
  const Icon = link.icon;
  return (
    <section className="card flex min-w-0 flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: link.cor }} aria-hidden>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="card-title">{link.titulo}</h2>
          <p className="card-subtitle">{link.descricao}</p>
        </div>
      </div>

      {link.url ? (
        <>
          <p className="truncate rounded-md border border-line bg-gray-50 px-3 py-2 font-mono text-[12px]" title={link.url}>
            {link.url}
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copiarTexto(link.url!, "Link copiado")}>
              <Copy /> Copiar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.open(link.url!, "_blank", "noopener,noreferrer")}>
              <ExternalLink /> Abrir
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-auto rounded-md border border-dashed border-line px-3 py-2 text-[12px] text-ink-muted">
          {link.vazio}{" "}
          <Link to="/minha-empresa" className="font-semibold text-primary hover:underline">
            Cadastrar em Minha empresa
          </Link>
        </p>
      )}
    </section>
  );
}

export default function MeusLinksPage() {
  const loja = useAppStore((s) => s.loja);

  const urlSite = loja.site.trim() || null;
  const whatsDigitos = loja.whatsapp.replace(/\D/g, "");
  const urlWhats = whatsDigitos.length >= 10 ? linkWhatsApp(whatsDigitos) : null;
  const insta = loja.instagram.replace(/^@/, "").trim();
  const urlInsta = insta ? `https://instagram.com/${insta}` : null;

  const links: LinkInfo[] = [
    {
      titulo: "WhatsApp",
      descricao: "Abre uma conversa com a loja para o cliente fazer o pedido.",
      icon: MessageCircle,
      cor: "#1F8A4C",
      url: urlWhats,
      vazio: "Nenhum WhatsApp cadastrado.",
    },
    {
      titulo: "Instagram",
      descricao: "Perfil da loja no Instagram.",
      icon: Camera,
      cor: "#B4417A",
      url: urlInsta,
      vazio: "Nenhum Instagram cadastrado.",
    },
    {
      titulo: "Site",
      descricao: "Site ou cardápio online da própria loja.",
      icon: Globe,
      cor: "#2F7DBF",
      url: urlSite,
      vazio: "Nenhum site cadastrado.",
    },
  ];

  const opcoesQr: OpcaoQr[] = [
    urlWhats && { id: "whatsapp", label: "WhatsApp", url: urlWhats },
    urlSite && { id: "site", label: "Site", url: urlSite },
    urlInsta && { id: "instagram", label: "Instagram", url: urlInsta },
  ].filter(Boolean) as OpcaoQr[];

  // Onde o cliente faz o pedido: WhatsApp, ou o site quando não houver WhatsApp.
  const ondePedir = urlWhats
    ? `pelo WhatsApp: ${urlWhats}${urlSite ? ` ou pelo site ${urlSite}` : ""}`
    : urlSite
      ? `pelo site: ${urlSite}`
      : `pelo telefone ${loja.telefone}`;

  const textos = [
    {
      titulo: "Mensagem para clientes",
      texto: `Oi! Já pediu na ${loja.nome}? É só mandar seu pedido ${ondePedir}`,
    },
    {
      titulo: "Bio do Instagram",
      texto: `${loja.descricao ? `${loja.descricao} ` : ""}Faça seu pedido 👉 ${urlWhats ?? urlSite ?? loja.telefone}`,
    },
    {
      titulo: "Status do WhatsApp",
      texto: `Bateu a fome? A ${loja.nome} está esperando seu pedido ${ondePedir}${
        loja.endereco ? ` · Retirada: ${loja.endereco}, ${loja.bairro}` : ""
      }`,
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <div className="grid gap-4 md:grid-cols-3">
        {links.map((l) => (
          <LinkCard key={l.titulo} link={l} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <QrCodeCard opcoes={opcoesQr} corMarca={loja.cor_marca} nomeArquivo={slugify(loja.nome) || "loja"} />

        <section className="card min-w-0 p-4 sm:p-5">
          <CardHeader title="Textos para divulgação" subtitle="Prontos para copiar e colar nas redes e no WhatsApp." />
          <div className="flex flex-col gap-3">
            {textos.map((t) => (
              <div key={t.titulo} className="rounded-md border border-line p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="font-semibold">{t.titulo}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => copiarTexto(t.texto, "Texto copiado")}
                    aria-label={`Copiar texto: ${t.titulo}`}
                  >
                    <Copy /> Copiar
                  </Button>
                </div>
                <p className="break-words text-ink-muted">{t.texto}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
