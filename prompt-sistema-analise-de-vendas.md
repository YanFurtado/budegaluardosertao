# PROMPT — Sistema de Gestão de Pedidos com tela "Análise das vendas"

> Cole o texto abaixo no Lovable (ou outro gerador de apps). Anexe junto os 3 prints de referência.

---

Crie um painel web (SaaS) de gestão de pedidos para restaurantes/delivery, em **React + TypeScript + Tailwind + shadcn/ui**, gráficos com **Recharts** (ou ApexCharts) e backend **Supabase**. Idioma: português do Brasil. Moeda: R$ com vírgula decimal (R$ 1.234,56). Fuso: America/Sao_Paulo.

## Identidade visual
- Fonte: **Mulish** (Google Fonts). Texto base 13px, títulos de card 15px semibold, título da página 20px medium.
- Fundo da área principal `#FAFBFC`; cards brancos, raio 6px, borda `#E5E7EB`, sombra leve.
- Textos: principal `#1F2937`, secundário `#6B7280`. Divisores `#E5E7EB`. Cabeçalho de tabela fundo `#E5E7EB`.
- Série principal dos gráficos `#6CB2EB` (azul); série de comparação `#FED7AA` (pêssego).
- Positivo `#38C172` (verde), negativo `#EF5753` (vermelho), ícones de soma `#FAAD63` (laranja).
- Visual limpo, muito espaço em branco, estilo Material.
- Use nome e logo próprios (placeholder "Meu Painel"), sem copiar marca de terceiros.

## Layout global
**Sidebar fixa à esquerda (240px, fundo branco):**
1. Logo no topo.
2. Bloco da loja: avatar redondo, nome da loja (truncado com reticências) e bairro/cidade em cinza.
3. Badge de status em verde claro: "✓ Fecha às 20h30" (calculado pelo horário de funcionamento; vermelho "Fechado" quando fora do horário).
4. Aviso dispensável: "🔔 Ativar notificações de pedidos" com X.
5. Menu com ícones (itens com cadeado ficam cinza claro e com ícone 🔒 = módulo não contratado):
   Gestão de pedidos · Mesas/Comandas 🔒 · Caixa · Desempenho · Histórico de pedidos · Minha empresa · Catálogo · App Store (badge verde "Novo") · Financeiro 🔒 · Estoque 🔒 · Delivery · Cupons e descontos · Fidelidade 🔒 · Clientes · Avaliações · Fiado · Administrativo · Configurações
6. Rodapé fixo da sidebar: "Ver meus links".

**Topbar:** título da página à esquerda; à direita ícones: apps (grid), imprimir (verde), notificações (sino), menu do usuário.

**Toast fixo no rodapé central:** "🔇 O som não está ativo" + botão outline "ATIVAR SOM" (habilita som de novo pedido).

Responsivo: no mobile a sidebar vira drawer.

## Página: "Análise das vendas" (rota /analise-vendas)
Cards empilhados verticalmente, nesta ordem:

### 1. Barra de filtros
- Select do tipo de data: "Filtrar por data de criação" (padrão) | "Filtrar por data de fechamento" | "Filtrar por data de agendamento".
- Seletor de intervalo de data e hora no formato `04/11/2026 00:00 ~ 04/11/2026 23:59` com ícone de calendário. Padrão: hoje inteiro. Atalhos: Hoje, Ontem, Últimos 7 dias, Últimos 30 dias, Este mês, Mês passado.
- Botão "+ Filtro" que abre menu para adicionar filtros extras como chips removíveis: Tipo de pedido · Momento da entrega · Canal de venda · Origem do pedido · Responsável pela entrega · Valor do pedido (faixa) · Taxa de entrega (faixa) · Horário de criação (faixa).
- Todos os filtros afetam todos os blocos da página.

### 2. KPIs + gráfico de evolução
- Três KPIs lado a lado em formato de abas (a ativa fica branca, as outras cinza claro): **Faturamento**, **Pedidos**, **Ticket médio**. Cada uma mostra o valor e a variação % contra o período anterior de mesmo tamanho, com seta ↑ verde ou ↓ vermelha (ex.: "R$ 325,20 ↓ 43%").
- Clicar numa aba troca a métrica do gráfico.
- Select à direita: Agrupar por hora | por dia | por dia da semana | por semana | por mês.
- Gráfico de linhas com duas séries: período atual (azul) e período de comparação (pêssego), marcadores em bolinha, eixo Y em R$ (ou quantidade), eixo X conforme o agrupamento (00h a 23h quando por hora). Legenda abaixo: "Faturamento por hora (04/11 a 04/11)" e "Faturamento por hora (03/11 a 03/11)". Tooltip com os dois valores.

### 3. Detalhes do faturamento
- Subtítulo: "Clique no valor para adicioná-lo ou removê-lo do cálculo do faturamento".
- Grade de 4 colunas (2 no mobile). Cada item = ícone circular colorido + rótulo + valor:
  - Total dos produtos (ícone azul)
  - "+" Taxas de entrega
  - "+" Taxas de serviço
  - "+" Taxas adicionais
  - "+" Taxas da maquineta
  - "−" Total de descontos (vermelho)
  - "=" **Faturamento** (verde)
- Cada parcela é um toggle: clicada, fica esmaecida e sai do cálculo; o Faturamento final e os KPIs recalculam na hora.
- Fórmula: Faturamento = produtos + entrega + serviço + adicionais + maquineta − descontos (só itens ativos).

### 4. "Análise dos pedidos por [select]"
- Select dentro do título: forma de pagamento (padrão) | tipo de pedido | momento da entrega | canal de vendas | origem do pedido | responsável pela entrega.
- Subtítulo: "Escolha um grupo de segmentação acima e analise seus pedidos com base nos segmentos do grupo".
- Esquerda: gráfico donut com % em cada fatia.
- Direita: tabela com colunas [nome do segmento] · Faturamento (ordenável, padrão decrescente) · Pedidos · Ticket médio. Cada linha tem uma bolinha na cor da fatia.

### 5. "Pedidos por funcionário (Delivery/Retirada/No local)"
- Subtítulo: "O valor do faturamento inclui todas as taxas e descontos. O pedido é atribuído ao funcionário que fez ou aceitou ele."
- Tabela: Funcionário · Faturamento (ordenável) · Pedidos.

### 6. "Pedidos por bairro (Delivery)"
- Subtítulo: "O valor do faturamento inclui todas as taxas e descontos".
- Tabela: Bairro · Faturamento (ordenável) · Pedidos · Ticket médio · Total em taxas · Taxa média. Só pedidos de delivery.

**Estados de todas as tabelas e gráficos:** skeleton cinza animado ao carregar; "Nada encontrado" quando vazio.

## Banco de dados (Supabase)
- `lojas`: id, nome, bairro, cidade, logo_url, horario_abertura, horario_fechamento
- `funcionarios`: id, loja_id, nome
- `pedidos`: id, loja_id, criado_em, fechado_em, agendado_para, status, tipo_pedido (delivery | retirada | no_local), momento_entrega (imediato | agendado), canal_venda, origem, forma_pagamento, funcionario_id, responsavel_entrega, bairro, total_produtos, taxa_entrega, taxa_servico, taxas_adicionais, taxa_maquineta, desconto, total
- Ative RLS por loja (cada usuário só vê os dados da própria loja).
- Faça as agregações via views ou funções RPC no Postgres (agrupamento por hora/dia/dia da semana/semana/mês e por segmento), recebendo intervalo de datas, tipo de data e filtros. O período de comparação é calculado automaticamente: mesmo tamanho, imediatamente anterior.

## Dados de exemplo
Popule ~200 pedidos dos últimos 60 dias, com picos no almoço (11h–14h) e noite (18h–21h), formas de pagamento variadas (Cartão de crédito, Débito, Pix, Dinheiro), 3 funcionários e bairros como Centro, Jardim Florida, Vila Eduardo, Areia Branca.

## Entrega
Construa primeiro o layout global (sidebar + topbar) e a página Análise das vendas completa e funcional. As demais páginas do menu podem ficar como placeholders "Em breve" por enquanto.
