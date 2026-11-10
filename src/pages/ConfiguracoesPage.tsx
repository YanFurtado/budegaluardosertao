import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellOff, Database, RotateCcw, Trash2, Volume2 } from "lucide-react";
import type { Configuracoes } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader } from "@/components/shared/CardHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FORMAS_PAGAMENTO } from "@/data/catalogo";
import { enableSound } from "@/lib/sound";
import { useAppStore } from "@/store/useAppStore";
import { useUiStore } from "@/store/useUiStore";
import { NumeroSetting, SettingRow } from "@/features/config/SettingRow";

type PermissaoNotificacao = NotificationPermission | "indisponivel";

const lerPermissao = (): PermissaoNotificacao => ("Notification" in window ? Notification.permission : "indisponivel");

export default function ConfiguracoesPage() {
  const config = useAppStore((s) => s.config);
  const nomeLoja = useAppStore((s) => s.loja.nome);
  const atualizarConfig = useAppStore((s) => s.atualizarConfig);
  const restaurarDadosExemplo = useAppStore((s) => s.restaurarDadosExemplo);
  const limparDados = useAppStore((s) => s.limparDados);
  const somAtivo = useUiStore((s) => s.somAtivo);
  const setSomAtivo = useUiStore((s) => s.setSomAtivo);

  const [permissao, setPermissao] = useState<PermissaoNotificacao>(lerPermissao);
  const [confirmarRestaurar, setConfirmarRestaurar] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);

  // A permissão pode mudar pelo cadeado do navegador; relê ao voltar para a aba.
  useEffect(() => {
    const atualizar = () => setPermissao(lerPermissao());
    window.addEventListener("focus", atualizar);
    return () => window.removeEventListener("focus", atualizar);
  }, []);

  const salvar = (parcial: Partial<Configuracoes>) => {
    atualizarConfig(parcial);
    toast.success("Configuração salva");
  };

  const testarSom = async () => {
    const ok = await enableSound();
    if (ok) {
      setSomAtivo(true);
      toast.success("Som ativado");
    } else toast.error("O navegador não permitiu tocar o som.");
  };

  const alternarNotificacoes = async (ligar: boolean) => {
    if (!ligar) return salvar({ notificacoes_navegador: false });
    if (!("Notification" in window)) {
      toast.error("Este navegador não tem notificações.");
      return;
    }
    const resultado = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setPermissao(resultado);
    if (resultado === "granted") salvar({ notificacoes_navegador: true });
    else toast.error("Notificações bloqueadas pelo navegador.");
  };

  const alternarForma = (forma: string) => {
    const atual = config.formas_pagamento;
    if (atual.includes(forma)) {
      if (atual.length === 1) {
        toast.error("Mantenha pelo menos uma forma de pagamento.");
        return;
      }
      salvar({ formas_pagamento: atual.filter((f) => f !== forma) });
    } else {
      // Mantém a ordem oficial da lista
      salvar({ formas_pagamento: FORMAS_PAGAMENTO.filter((f) => f === forma || atual.includes(f)) });
    }
  };

  const bloqueado = permissao === "denied";

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pedidos */}
        <section className="card p-4 sm:p-5">
          <CardHeader title="Pedidos" subtitle="Como os pedidos novos entram no quadro." />
          <div className="divide-y divide-line">
            <SettingRow
              titulo="Aceitar pedidos automaticamente"
              descricao="Pedidos do cardápio digital vão direto para Em preparo, sem passar por Em análise."
            >
              <Switch
                checked={config.aceitar_automaticamente}
                onCheckedChange={(v) => salvar({ aceitar_automaticamente: v })}
                aria-label="Aceitar pedidos automaticamente"
              />
            </SettingRow>
            <SettingRow titulo="Tempo de preparo padrão" descricao="Mostrado ao cliente como previsão.">
              <NumeroSetting
                valor={config.tempo_preparo_padrao}
                min={5}
                max={180}
                sufixo="min"
                rotulo="Tempo de preparo padrão em minutos"
                onSalvar={(v) => salvar({ tempo_preparo_padrao: v })}
              />
            </SettingRow>
            <SettingRow titulo="Alerta de atraso" descricao="Pedido em andamento há mais tempo que isso fica destacado.">
              <NumeroSetting
                valor={config.alerta_atraso_min}
                min={10}
                max={240}
                sufixo="min"
                rotulo="Alerta de atraso em minutos"
                onSalvar={(v) => salvar({ alerta_atraso_min: v })}
              />
            </SettingRow>
          </div>
        </section>

        {/* Impressão */}
        <section className="card p-4 sm:p-5">
          <CardHeader title="Impressão" subtitle="Comanda impressa para a cozinha." />
          <div className="divide-y divide-line">
            <SettingRow titulo="Imprimir automaticamente" descricao="Imprime a comanda assim que o pedido é aceito.">
              <Switch
                checked={config.impressao_automatica}
                onCheckedChange={(v) => salvar({ impressao_automatica: v })}
                aria-label="Imprimir automaticamente"
              />
            </SettingRow>
            <SettingRow titulo="Vias por pedido" descricao="Ex.: uma para a cozinha e outra para o entregador.">
              <Select value={String(config.vias_impressao)} onValueChange={(v) => salvar({ vias_impressao: Number(v) })}>
                <SelectTrigger className="w-28" aria-label="Vias por pedido">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "via" : "vias"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </div>
        </section>

        {/* Som e notificações */}
        <section className="card p-4 sm:p-5">
          <CardHeader title="Som e notificações" subtitle="Avisos quando chega um pedido novo." />
          <div className="divide-y divide-line">
            <SettingRow
              titulo="Som de novo pedido"
              descricao={
                somAtivo
                  ? "Som liberado nesta aba."
                  : "O navegador só libera o som depois de um clique: use Testar som a cada vez que abrir o painel."
              }
            >
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={testarSom} disabled={!config.som_novo_pedido}>
                  <Volume2 /> Testar som
                </Button>
                <Switch
                  checked={config.som_novo_pedido}
                  onCheckedChange={(v) => salvar({ som_novo_pedido: v })}
                  aria-label="Som de novo pedido"
                />
              </div>
            </SettingRow>
            <SettingRow
              titulo="Notificações do navegador"
              descricao={
                permissao === "indisponivel"
                  ? "Este navegador não tem notificações."
                  : bloqueado
                    ? "Bloqueadas pelo navegador. Libere em Permissões do site (cadeado ao lado do endereço) e volte aqui."
                    : "Aparecem mesmo com o painel em outra aba."
              }
            >
              <div className="flex items-center gap-3">
                {bloqueado && (
                  <Badge tom="red">
                    <BellOff className="size-3" /> Bloqueadas
                  </Badge>
                )}
                <Switch
                  checked={config.notificacoes_navegador && permissao === "granted"}
                  onCheckedChange={alternarNotificacoes}
                  disabled={bloqueado || permissao === "indisponivel"}
                  aria-label="Notificações do navegador"
                />
              </div>
            </SettingRow>
          </div>
        </section>

        {/* Formas de pagamento */}
        <section className="card p-4 sm:p-5">
          <CardHeader title="Formas de pagamento aceitas" subtitle="Disponíveis ao lançar e receber pedidos. Pelo menos uma." />
          <div className="grid gap-1 sm:grid-cols-2">
            {FORMAS_PAGAMENTO.map((forma) => (
              <label key={forma} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="size-4 accent-[#2F7DBF]"
                  checked={config.formas_pagamento.includes(forma)}
                  onChange={() => alternarForma(forma)}
                />
                <span>
                  {forma}
                  {forma === "Fiado" && <span className="block text-[12px] text-ink-muted">Só para clientes com limite de fiado</span>}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Demonstração */}
      <section className="card p-4 sm:p-5">
        <CardHeader
          title="Modo demonstração"
          subtitle="Este painel funciona sem servidor: os dados ficam salvos neste navegador."
          actions={<Badge tom="orange">Demonstração</Badge>}
        />
        <div className="divide-y divide-line">
          <SettingRow
            titulo="Simular pedidos recebidos"
            descricao="Chega um pedido novo a cada 1–2 minutos, como se viesse do cardápio digital (não chega com a loja pausada)."
          >
            <Switch
              checked={config.simular_pedidos}
              onCheckedChange={(v) => salvar({ simular_pedidos: v })}
              aria-label="Simular pedidos recebidos"
            />
          </SettingRow>
          <SettingRow titulo="Restaurar dados de exemplo" descricao="Volta pedidos, clientes, catálogo (preços, fotos e produtos) e dados da loja ao estado inicial.">
            <Button variant="outline" onClick={() => setConfirmarRestaurar(true)}>
              <RotateCcw /> Restaurar
            </Button>
          </SettingRow>
          <SettingRow
            titulo="Apagar movimentação"
            descricao="Remove pedidos, clientes, cupons, avaliações, fiado e caixa. Mantém loja, equipe, catálogo e ajustes."
          >
            <Button variant="outline" className="border-negative/40 text-negative hover:bg-negative-soft" onClick={() => setConfirmarApagar(true)}>
              <Trash2 /> Apagar
            </Button>
          </SettingRow>
        </div>
      </section>

      {/* Sobre */}
      <section className="card flex items-center gap-3 p-4 sm:p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-ink-muted" aria-hidden>
          <Database className="size-5" />
        </span>
        <div>
          <p className="font-semibold">Sistema da {nomeLoja} · versão 0.1.0</p>
          <p className="text-[12px] text-ink-muted">Os dados ficam salvos neste navegador. Limpar os dados do site apaga tudo.</p>
        </div>
      </section>

      <ConfirmDialog
        open={confirmarRestaurar}
        onOpenChange={setConfirmarRestaurar}
        title="Restaurar dados de exemplo?"
        description="Tudo o que foi criado ou alterado (pedidos, clientes, catálogo com preços e fotos, dados da loja, equipe, ajustes) volta ao original. A página da loja também volta ao catálogo original."
        confirmLabel="Restaurar"
        destructive
        onConfirm={() => {
          restaurarDadosExemplo();
          toast.success("Dados de exemplo restaurados");
        }}
      />
      <ConfirmDialog
        open={confirmarApagar}
        onOpenChange={setConfirmarApagar}
        title="Apagar toda a movimentação?"
        description="Pedidos, clientes, cupons, avaliações, fiado e caixa serão apagados deste navegador. Não dá para desfazer."
        confirmLabel="Apagar"
        destructive
        onConfirm={() => {
          limparDados();
          toast.success("Movimentação apagada");
        }}
      />
    </div>
  );
}
