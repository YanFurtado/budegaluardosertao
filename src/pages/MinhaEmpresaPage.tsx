import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pause, Play, Save, Undo2 } from "lucide-react";
import type { Loja } from "@/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CardHeader } from "@/components/shared/CardHeader";
import { statusLoja } from "@/lib/loja";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { HorariosCard } from "@/features/empresa/HorariosCard";
import { IdentidadeCard } from "@/features/empresa/IdentidadeCard";
import {
  emailValido,
  mascaraCep,
  mascaraCnpj,
  mascaraTelefone,
  normalizarSite,
  siteValido,
} from "@/features/empresa/mascaras";

type Erros = Partial<Record<Exclude<keyof Loja, "horarios">, string>> & { horarios?: Record<number, string> };

function validar(l: Loja): Erros {
  const e: Erros = {};
  if (!l.nome.trim()) e.nome = "Informe o nome da loja.";
  if (l.site.trim() && !siteValido(l.site)) e.site = "Endereço inválido. Ex.: https://www.suaempresa.com.br";
  if (l.email.trim() && !emailValido(l.email)) e.email = "E-mail inválido.";
  if (l.cnpj && l.cnpj.replace(/\D/g, "").length !== 14) e.cnpj = "O CNPJ tem 14 dígitos.";
  if (l.cep && l.cep.replace(/\D/g, "").length !== 8) e.cep = "O CEP tem 8 dígitos.";
  if (l.uf && !/^[A-Z]{2}$/.test(l.uf)) e.uf = "Use a sigla com 2 letras.";
  const horarios: Record<number, string> = {};
  l.horarios.forEach((h, i) => {
    if (!h.aberto) return;
    if (!h.abre || !h.fecha) horarios[i] = "Preencha os dois horários.";
    else if (h.abre === h.fecha) horarios[i] = "Abertura e fechamento não podem ser iguais.";
  });
  if (Object.keys(horarios).length) e.horarios = horarios;
  return e;
}

export default function MinhaEmpresaPage() {
  const loja = useAppStore((s) => s.loja);
  const atualizarLoja = useAppStore((s) => s.atualizarLoja);
  const registrarAtividade = useAppStore((s) => s.registrarAtividade);
  const somAtivo = useUiStore((s) => s.somAtivo);
  const somConfigurado = useAppStore((s) => s.config.som_novo_pedido);
  // O aviso "O som não está ativo" fica no rodapé; a barra de salvar sobe para não ficar por baixo dele.
  const toastSomVisivel = !somAtivo && somConfigurado;

  const [draft, setDraft] = useState<Loja>(loja);
  const [erros, setErros] = useState<Erros>({});
  const [agora, setAgora] = useState(() => new Date());

  const sujo = useMemo(() => JSON.stringify(draft) !== JSON.stringify(loja), [draft, loja]);

  // Mudanças externas (ex.: loja pausada) entram no rascunho quando não há edição pendente.
  useEffect(() => {
    if (!sujo) setDraft(loja);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loja]);

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Aviso do navegador ao sair com alterações não salvas.
  useEffect(() => {
    if (!sujo) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [sujo]);

  const set = <K extends keyof Loja>(campo: K, valor: Loja[K]) => {
    setDraft((d) => ({ ...d, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const descartar = () => {
    setDraft(loja);
    setErros({});
  };

  const salvar = () => {
    const limpo: Loja = { ...draft, nome: draft.nome.trim(), site: normalizarSite(draft.site), uf: draft.uf.trim().toUpperCase() };
    const e = validar(limpo);
    setErros(e);
    if (Object.keys(e).length) {
      toast.error("Revise os campos destacados.");
      return;
    }
    atualizarLoja(limpo);
    setDraft(limpo);
    registrarAtividade("Atualizou os dados da empresa");
    toast.success("Dados da empresa salvos");
  };

  const alternarPausa = (pausada: boolean) => {
    atualizarLoja({ pausada });
    setDraft((d) => ({ ...d, pausada }));
    registrarAtividade(pausada ? "Pausou o recebimento de pedidos" : "Retomou o recebimento de pedidos");
    toast.success(pausada ? "Loja pausada: novos pedidos não serão recebidos" : "Loja recebendo pedidos novamente");
  };

  const status = statusLoja(loja, agora);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      {/* Recebimento de pedidos */}
      <section className="card p-4 sm:p-5">
        <CardHeader
          title="Recebimento de pedidos"
          subtitle="Pausar a loja interrompe o recebimento de novos pedidos na hora, sem mudar o horário de funcionamento."
          actions={<Badge tom={status.aberta ? "green" : "red"}>{status.aberta ? `Aberta · ${status.texto}` : status.texto}</Badge>}
        />
        <label
          className={cn(
            "flex items-center gap-3 rounded-md border p-3 transition-colors",
            loja.pausada ? "border-negative/40 bg-negative-soft" : "border-line",
          )}
        >
          <Switch checked={loja.pausada} onCheckedChange={alternarPausa} aria-label="Pausar a loja" />
          <span className="flex-1">
            <span className="flex items-center gap-1.5 font-semibold">
              {loja.pausada ? <Pause className="size-4" /> : <Play className="size-4" />}
              {loja.pausada ? "Loja pausada" : "Pausar a loja"}
            </span>
            <span className="block text-[12px] text-ink-muted">
              {loja.pausada
                ? "Clientes veem a loja como fechada. Desligue para voltar a receber pedidos."
                : "Use quando a cozinha estiver sobrecarregada ou faltar algo importante. Aplicado na hora."}
            </span>
          </span>
        </label>
      </section>

      {/* Dados da loja */}
      <section className="card p-4 sm:p-5">
        <CardHeader title="Dados da loja" subtitle="Aparecem no sistema, nas comandas e nos links da loja." />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome da loja *" htmlFor="nome" error={erros.nome}>
            <Input id="nome" value={draft.nome} onChange={(e) => set("nome", e.target.value)} maxLength={60} />
          </Field>
          <Field
            label="Site ou cardápio online"
            htmlFor="site"
            error={erros.site}
            hint="Opcional. Endereço próprio da loja, se tiver."
          >
            <Input
              id="site"
              type="url"
              inputMode="url"
              placeholder="https://www.suaempresa.com.br"
              value={draft.site}
              onChange={(e) => set("site", e.target.value)}
              onBlur={() => set("site", normalizarSite(draft.site))}
              maxLength={120}
            />
          </Field>
          <Field label="Descrição" htmlFor="descricao" className="md:col-span-2" hint={`${draft.descricao.length}/200`}>
            <Textarea
              id="descricao"
              value={draft.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              maxLength={200}
              rows={2}
            />
          </Field>
          <Field label="CNPJ" htmlFor="cnpj" error={erros.cnpj}>
            <Input
              id="cnpj"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              value={draft.cnpj}
              onChange={(e) => set("cnpj", mascaraCnpj(e.target.value))}
            />
          </Field>
          <Field label="E-mail" htmlFor="email" error={erros.email}>
            <Input id="email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Telefone" htmlFor="telefone">
            <Input
              id="telefone"
              inputMode="tel"
              placeholder="(00) 0000-0000"
              value={draft.telefone}
              onChange={(e) => set("telefone", mascaraTelefone(e.target.value))}
            />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp" hint="Usado no link de pedidos pelo WhatsApp.">
            <Input
              id="whatsapp"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              value={draft.whatsapp}
              onChange={(e) => set("whatsapp", mascaraTelefone(e.target.value))}
            />
          </Field>
          <Field label="Instagram" htmlFor="instagram">
            <Input
              id="instagram"
              placeholder="@sualoja"
              value={draft.instagram}
              onChange={(e) => {
                const v = e.target.value.replace(/\s/g, "");
                set("instagram", v && !v.startsWith("@") ? `@${v}` : v);
              }}
            />
          </Field>
        </div>
      </section>

      {/* Endereço */}
      <section className="card p-4 sm:p-5">
        <CardHeader title="Endereço" subtitle="Ponto de partida das entregas e endereço para retirada." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="CEP" htmlFor="cep" error={erros.cep} className="lg:col-span-2">
            <Input
              id="cep"
              inputMode="numeric"
              placeholder="00000-000"
              value={draft.cep}
              onChange={(e) => set("cep", mascaraCep(e.target.value))}
            />
          </Field>
          <Field label="Endereço" htmlFor="endereco" className="sm:col-span-2 lg:col-span-4">
            <Input
              id="endereco"
              placeholder="Rua, número e complemento"
              value={draft.endereco}
              onChange={(e) => set("endereco", e.target.value)}
            />
          </Field>
          <Field label="Bairro" htmlFor="bairro" className="lg:col-span-2">
            <Input id="bairro" value={draft.bairro} onChange={(e) => set("bairro", e.target.value)} />
          </Field>
          <Field label="Cidade" htmlFor="cidade" className="lg:col-span-3">
            <Input id="cidade" value={draft.cidade} onChange={(e) => set("cidade", e.target.value)} />
          </Field>
          <Field label="UF" htmlFor="uf" error={erros.uf} className="lg:col-span-1">
            <Input
              id="uf"
              maxLength={2}
              value={draft.uf}
              onChange={(e) => set("uf", e.target.value.replace(/[^a-z]/gi, "").toUpperCase())}
            />
          </Field>
        </div>
      </section>

      <IdentidadeCard
        nome={draft.nome}
        cor={draft.cor_marca}
        logo={draft.logo_url}
        onCor={(c) => set("cor_marca", c)}
        onLogo={(l) => set("logo_url", l)}
      />

      <HorariosCard
        horarios={draft.horarios}
        onChange={(h) => {
          set("horarios", h);
          if (erros.horarios) setErros((e) => ({ ...e, horarios: undefined }));
        }}
        erros={erros.horarios ?? {}}
      />

      {/* Barra de salvar */}
      {sujo && (
        <div
          className={cn(
            "sticky z-20 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white px-4 py-3 shadow-lg",
            toastSomVisivel ? "bottom-[84px]" : "bottom-4",
          )}
          role="region"
          aria-label="Alterações não salvas"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <span className="size-2 rounded-full bg-accent" aria-hidden /> Alterações não salvas
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={descartar}>
              <Undo2 /> Descartar
            </Button>
            <Button onClick={salvar}>
              <Save /> Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
