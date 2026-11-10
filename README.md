# Budega Luar do Sertão — sistema de gestão

Página da loja e sistema de gestão de pedidos de uso exclusivo da Budega Luar do Sertão (uma empresa só; somente front-end).

- **`/` — página da loja** (clientes e equipe): produtos com foto, busca, sacola e pedido enviado pelo WhatsApp.
  O botão **Entrar** no topo leva a equipe ao login e ao sistema.
- **Sistema de gestão** (`/gestao-pedidos` e demais páginas): só para quem entrou.

React + TypeScript + Vite + Tailwind + componentes no estilo shadcn/ui (Radix) + Recharts + Zustand.
**Não há banco de dados ainda:** os dados ficam salvos no navegador (localStorage). Loja, catálogo (161 produtos) e fotos são os reais;
pedidos, clientes e caixa são de exemplo. Até ligar ao Supabase, mudanças feitas no sistema só aparecem na página da loja no mesmo navegador.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # checagem de tipos + build de produção
```

Login de demonstração: e-mail de qualquer pessoa da equipe (ex.: `ana@budegaluardosertao.com.br`) e qualquer senha.
Cada cargo vê só as áreas liberadas em **Administrativo → Equipe**.

## Publicar no Easypanel (Docker)

O projeto já tem `Dockerfile`, `nginx.conf` e `.dockerignore`. A imagem compila o site e o serve com nginx na porta **80**.

1. No Easypanel: **Create Service → App**.
2. **Source → GitHub**: escolha o repositório `YanFurtado/budegaluardosertao` e o ramo `main`.
3. **Build → Dockerfile** (caminho `Dockerfile`, na raiz).
4. **Domains & Proxy**: informe o domínio e a porta **80**.
5. **Deploy**. A cada novo envio para a `main` dá para refazer o deploy (ou ligar o deploy automático).

Teste local (precisa do Docker instalado):

```bash
docker build -t budega .
docker run --rm -p 8080:80 budega   # http://localhost:8080
```

Observações:
- Endereços como `/login` e `/gestao-pedidos` funcionam ao recarregar a página (o nginx devolve o `index.html`).
- O teste de saúde está em `/healthz`.
- Quando o Supabase for ligado, as chaves `VITE_*` entram na **compilação**: no Easypanel, cadastre-as como *Build Args*.

## Módulos

| Página / menu | O que faz |
| --- | --- |
| Página da loja (`/`) | Vitrine para o cliente: categorias, busca, sacola e envio do pedido pelo WhatsApp |
| Gestão de pedidos | Quadro de pedidos em andamento, novo pedido (PDV), detalhes e impressão da comanda |
| Caixa | Abertura, sangria/suprimento, fechamento com conferência e histórico |
| Desempenho | Análise das vendas: KPIs, gráfico comparativo, composição do faturamento, segmentos |
| Histórico de pedidos | Busca e filtros de todos os pedidos, exportação CSV |
| Minha empresa | Dados da loja, endereço, identidade visual, horários, pausar loja |
| Catálogo | Categorias e produtos (foto, preço, promoção, destaque, disponibilidade) — é o que aparece na página da loja |
| Delivery | Áreas de entrega e taxas, entregadores, regras (pedido mínimo, frete grátis) |
| Cupons e descontos | Cupons percentuais, valor fixo e frete grátis, com validade e limite de usos |
| Clientes | Cadastro, histórico e estatísticas por cliente |
| Avaliações | Notas dos clientes e respostas |
| Fiado | Contas a prazo: extrato, limite, pagamentos e cobrança por WhatsApp |
| Administrativo | Equipe, cargos e permissões; registro de atividades |
| Configurações | Pedidos, impressão, som/notificações, formas de pagamento, modo demonstração |
| Meus links | WhatsApp, Instagram e site da loja, com QR Code para imprimir |

## Modo demonstração

- Com **Configurações → Simular pedidos recebidos** ligado, chega um pedido novo a cada 1–2 minutos (com som, se ativado).
- Ao abrir o painel em outro dia, as datas dos dados são avançadas para que "Hoje" continue com movimento.
- **Configurações → Restaurar dados de exemplo** volta tudo ao estado inicial.

## Onde mexer

- `src/types.ts` — modelo de dados (espelha as futuras tabelas).
- `src/store/useAppStore.ts` — todos os dados e ações (criar pedido, mudar status, caixa, fiado…).
  Para ligar a uma API/banco, as ações do store são o ponto de troca.
- `src/data/seed.ts` — gerador dos dados iniciais; loja e catálogo vêm de `src/data/lojaReal.json`.
- `scripts/extrair-vitrine.mjs` — extraiu (uma vez) produtos, fotos (`public/produtos/`) e logo da página antiga
  (`docs/legado/budega-luar-do-sertao.html`).
- `src/services/vitrine.ts` — único ponto de onde a página da loja lê os dados (troca para o Supabase).
- `src/pages/LojaPage.tsx` e `src/features/loja/` — página da loja (CSS todo dentro de `.vitrine`).
- `src/lib/pedidos.ts` — regras de pedido: status, cálculo de totais, validação de cupom.
- `src/features/<área>/` — componentes de cada módulo; `src/pages/` — páginas.
- `src/navigation.ts` — itens do menu e permissões.
