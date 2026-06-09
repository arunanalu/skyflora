# Plano: Integracao de dados politicos com Databricks

Este plano cobre a substituicao dos dados mockados da tela de politica por dados reais da tabela `skyflora.silver.deputados_qualidade_voto_socioambiental` do Databricks, redesenhando a entidade de dominio, os filtros da sidebar, a logica de cor do mapa e o modal de estado para refletir a realidade dos dados disponibilizados.

## 1. Contexto e premissas

### 1.1 O que a tabela contem

Cada linha da tabela representa o voto de um deputado em uma proposta especifica. Os campos relevantes sao:

| Campo | Tipo | Descricao |
|---|---|---|
| `id_proposta` | string | ID da proposta (ex: `4870/2024`) |
| `descricao_proposta` | string | Texto completo da proposta |
| `classificacao_pauta` | string | `positiva`, `negativa` ou `neutra` |
| `justificativa_classificacao` | string | Motivo da classificacao ambiental |
| `nome_deputado` | string | Nome do deputado |
| `partido` | string | Partido politico |
| `uf` | string | Estado de origem do deputado |
| `voto_computado` | string | `sim`, `nao` ou `não conclusivo` |
| `qualidade_voto_socioambiental` | string | Classificacao qualitativa do voto |
| `score_voto_socioambiental` | int | `1` = voto favoravel ao meio ambiente, `0` = contrario/inconclusivo |
| `periodo_referencia` | string | Periodo (ex: `2024-12`) |
| `data_processamento` | timestamp | Data de processamento |

**Importante:** o campo `uf` e o estado do deputado, nao o estado alvo da proposta. Portanto, a visao por estado representa o comportamento coletivo dos deputados daquele estado.

**Score = 1 quando:**
- Deputado votou `sim` em proposta classificada como `positiva`
- Deputado votou `nao` em proposta classificada como `negativa`

**Score = 0 quando:**
- Voto contrario ao ambiente ou voto inconclusivo

### 1.2 Modelo mental da UI

A tela de politica mostra: "como os deputados de cada estado se comportaram em pautas com impacto socioambiental em dezembro de 2024?"

Nao ha nivel municipal nesta tela — ao clicar em um estado, o modal exibe o resumo dos votos e dos deputados daquele estado.

### 1.3 Diferenca fundamental em relacao ao mock atual

O mock atual usa a entidade `PoliticalProposal` (foco em proposta individual). Os dados reais requerem uma entidade centrada no estado — `PoliticsStateData` — agregando todos os votos dos deputados daquele estado.

---

## 2. Nova entidade de dominio: `PoliticsStateData`

Arquivo: `src/domain/entities/PoliticsStateData.ts`

```ts
export interface DeputadoScore {
  nome: string;
  partido: string;
  score: number;         // soma de score_voto_socioambiental
  totalVotos: number;    // total de votos computados (excluindo inconclusivos)
  scoreRate: number;     // score / totalVotos (0 a 1)
}

export interface PoliticsStateData {
  uf: string;

  // Contagens de propostas unicas votadas por deputados do estado
  totalPropostas: number;
  propostasPositivas: number;
  propostasNegativas: number;
  propostasNeutras: number;

  // Contagem de deputados distintos do estado presentes na base
  totalDeputados: number;

  // Contagens de votos
  totalVotos: number;
  votosDecisivos: number;          // sim + nao (exclui nao conclusivos)
  votosNaoConclusivos: number;

  // Votos em propostas positivas
  simEmPositivas: number;
  naoEmPositivas: number;
  inconclusivosEmPositivas: number;

  // Votos em propostas negativas (pode ser 0 no dataset atual)
  simEmNegativas: number;
  naoEmNegativas: number;
  inconclusivosEmNegativas: number;

  // Score agregado
  scoreTotal: number;              // soma de score_voto_socioambiental
  scoreRate: number;               // scoreTotal / votosDecisivos (0 a 1); null se votosDecisivos = 0

  // Top deputados por score (os 5 melhores e 5 piores do estado)
  topDeputados: DeputadoScore[];   // ordenado por scoreRate desc
  bottomDeputados: DeputadoScore[]; // ordenado por scoreRate asc

  periodoReferencia: string;       // ex: "2024-12"
  processedAt: string | null;
}
```

**Por que esta estrutura?**
- Permite colorir o mapa por tres metricas distintas (alinhamento geral, engajamento em positivas, atividade legislativa).
- O modal pode exibir o resumo agregado + ranking de deputados.
- Nao quebra a UI ao adicionar novos campos futuramente.

---

## 3. Filtros da sidebar e logica de cor do mapa

### 3.1 Filtros propostos (substitui os atuais de politica)

| Filtro | ID | Emoji | Descricao |
|---|---|---|---|
| Alinhamento Socioambiental | `alinhamento` | 🌿 | Percentual de votos favoraveis ao meio ambiente sobre votos decisivos |
| Apoio a Pautas Positivas | `apoio_positivas` | ✅ | Percentual de votos SIM em propostas classif. como positivas |
| Atividade Legislativa | `atividade` | 📜 | Numero de propostas positivas propostas por deputados do estado |

O filtro padrao e `alinhamento`.

### 3.2 Logica de cor por filtro

**`alinhamento` — scoreRate (0 a 1):**
- `>= 0.70` → verde (`#16a34a`) — alto alinhamento
- `>= 0.40` → amarelo (`#ca8a04`) — alinhamento moderado
- `>= 0.15` → laranja (`#ea580c`) — baixo alinhamento
- `< 0.15` ou sem dados → vermelho escuro (`#991b1b`)
- sem dados → cinza (`#374151`)

**`apoio_positivas` — simEmPositivas / (simEmPositivas + naoEmPositivas):**
- Mesma escala de cor que `alinhamento`, aplicada sobre essa taxa especifica.
- Estados sem propostas positivas votadas ficam em cinza.

**`atividade` — propostasPositivas (contagem absoluta):**
- Escala de azul: mais propostas = azul mais intenso.
- Limiar sugerido: 0 = cinza; 1-5 = `#1d4ed8`; 6-15 = `#2563eb`; 16-30 = `#3b82f6`; >30 = `#60a5fa`.
- Objetivo: mostrar quais estados tem deputados mais ativos em pautas ambientais.

---

## 4. Modal de estado — conteudo por filtro

### Filtro `alinhamento`

```
┌─ [UF] ─────────────────────────────────────┐
│ Alinhamento Socioambiental                  │
│ "X% dos votos decisivos deste estado foram  │
│ favoraveis ao meio ambiente e a sociedade." │
│                                             │
│ [Score Rate %] [Votos Decisivos]            │
│ [Sim em Positivas] [Nao em Positivas]       │
│                                             │
│ Top deputados — melhor alinhamento          │
│ ▸ Nome | Partido | X/Y votos (X%)          │
│ ▸ Nome | Partido | X/Y votos (X%)          │
│                                             │
│ Deputados com menor alinhamento             │
│ ▸ Nome | Partido | X/Y votos (X%)          │
└─────────────────────────────────────────────┘
```

### Filtro `apoio_positivas`

```
┌─ [UF] ─────────────────────────────────────┐
│ Apoio a Pautas Beneficas                    │
│ "Dos X votos em propostas positivas,        │
│ Y foram favoraveis (Z%)."                   │
│                                             │
│ [Sim em Positivas] [Nao em Positivas]       │
│ [Inconclusivos em Positivas]                │
│ [Total Propostas Positivas votadas]         │
└─────────────────────────────────────────────┘
```

### Filtro `atividade`

```
┌─ [UF] ─────────────────────────────────────┐
│ Atividade Legislativa Ambiental             │
│ "Deputados deste estado apresentaram X      │
│ propostas beneficas ao meio ambiente."      │
│                                             │
│ [Propostas Positivas] [Propostas Neutras]   │
│ [Total Deputados] [Total Votos]             │
└─────────────────────────────────────────────┘
```

---

## 5. Query SQL para o BFF

A integracao usara duas queries parametrizadas por `periodo_referencia`.

### Query 1: Agregacao por estado

```sql
SELECT
  uf,
  COUNT(DISTINCT id_proposta)                                                          AS total_propostas,
  COUNT(DISTINCT CASE WHEN classificacao_pauta = 'positiva' THEN id_proposta END)     AS propostas_positivas,
  COUNT(DISTINCT CASE WHEN classificacao_pauta = 'negativa' THEN id_proposta END)     AS propostas_negativas,
  COUNT(DISTINCT CASE WHEN classificacao_pauta = 'neutra'   THEN id_proposta END)     AS propostas_neutras,
  COUNT(DISTINCT nome_deputado)                                                        AS total_deputados,
  COUNT(*)                                                                             AS total_votos,
  COUNT(CASE WHEN voto_computado IN ('sim','não') THEN 1 END)                         AS votos_decisivos,
  COUNT(CASE WHEN voto_computado = 'não conclusivo'   THEN 1 END)                     AS votos_nao_conclusivos,
  COUNT(CASE WHEN voto_computado = 'sim' AND classificacao_pauta = 'positiva' THEN 1 END) AS sim_em_positivas,
  COUNT(CASE WHEN voto_computado = 'não' AND classificacao_pauta = 'positiva' THEN 1 END) AS nao_em_positivas,
  COUNT(CASE WHEN voto_computado = 'não conclusivo' AND classificacao_pauta = 'positiva' THEN 1 END) AS inconclusivos_em_positivas,
  COUNT(CASE WHEN voto_computado = 'sim' AND classificacao_pauta = 'negativa' THEN 1 END) AS sim_em_negativas,
  COUNT(CASE WHEN voto_computado = 'não' AND classificacao_pauta = 'negativa' THEN 1 END) AS nao_em_negativas,
  COUNT(CASE WHEN voto_computado = 'não conclusivo' AND classificacao_pauta = 'negativa' THEN 1 END) AS inconclusivos_em_negativas,
  SUM(score_voto_socioambiental)                                                       AS score_total,
  MAX(periodo_referencia)                                                              AS periodo_referencia,
  MAX(data_processamento)                                                              AS data_processamento
FROM skyflora.silver.deputados_qualidade_voto_socioambiental
WHERE periodo_referencia = :periodo
GROUP BY uf
ORDER BY uf
```

### Query 2: Ranking de deputados por estado (para o modal)

```sql
SELECT
  uf,
  nome_deputado,
  partido,
  SUM(score_voto_socioambiental) AS score,
  COUNT(CASE WHEN voto_computado IN ('sim','não') THEN 1 END) AS total_votos
FROM skyflora.silver.deputados_qualidade_voto_socioambiental
WHERE periodo_referencia = :periodo
GROUP BY uf, nome_deputado, partido
ORDER BY uf, score DESC, total_votos DESC
```

O BFF executa ambas as queries, cruza por `uf` e preenche `topDeputados` (top 5 por scoreRate) e `bottomDeputados` (bottom 5 com ao menos 1 voto decisivo).

---

## 6. Variaveis de ambiente

Adicionar em `.env.local`:

```env
DATABRICKS_POLITICS_TABLE=skyflora.silver.deputados_qualidade_voto_socioambiental
POLITICS_DATA_SOURCE=databricks
```

Adicionar em `.env.example` (sem valores):

```env
DATABRICKS_POLITICS_TABLE=
POLITICS_DATA_SOURCE=mock
```

---

## 7. Estrutura de arquivos novos e modificados

```
src/
├── domain/
│   ├── entities/
│   │   ├── PoliticsStateData.ts          [NOVO]
│   │   └── PoliticalProposal.ts          [MANTER por ora, depreciado]
│   └── repositories/
│       └── IDataRepository.ts            [MODIFICAR — adicionar getPoliticsStateData]
│
├── data/
│   ├── dtos/
│   │   └── DatabricksPoliticsStateDTO.ts [NOVO]
│   ├── mappers/
│   │   ├── mapDatabricksPoliticsStateToPoliticsStateData.ts [NOVO]
│   │   └── mapDatabricksPoliticsStateToPoliticsStateData.test.ts [NOVO]
│   └── repositories/
│       ├── DatabricksPoliticsRepository.ts [NOVO]
│       ├── MockRepository.ts               [MODIFICAR — adicionar getPoliticsStateData]
│       └── createDataRepository.ts         [MODIFICAR — factory para politics]
│
├── presentation/
│   ├── lib/
│   │   └── politicsPresentation.ts        [NOVO — cores, labels, textos explicativos]
│   ├── components/
│   │   ├── sidebar/Sidebar.tsx             [MODIFICAR — novos filtros]
│   │   ├── map/
│   │   │   ├── InteractiveMap.tsx          [MODIFICAR — logica de cor politics]
│   │   │   └── StateDetailsModal.tsx       [MODIFICAR — renderPoliticsContent]
│   │   └── tables/NationalTable.tsx        [MODIFICAR — colunas de politics]
│   └── stores/
│       └── useAppStore.ts                  [MODIFICAR — AVAILABLE_POLITICS_DATE, filtros]
│
└── app/
    ├── api/
    │   └── politics/
    │       ├── route.ts                    [MODIFICAR — usar factory + novo contrato]
    │       └── route.test.ts               [NOVO — testes da rota]
    └── page.tsx                            [MODIFICAR — fetch politics com nova entidade]
```

---

## 8. Tasks granulares

### Task 1: Criar entidade `PoliticsStateData` e atualizar interface do repositorio

- [ ] Criar `src/domain/entities/PoliticsStateData.ts` com as interfaces `DeputadoScore` e `PoliticsStateData` conforme secao 2.
- [ ] Adicionar `getPoliticsStateData(periodoReferencia: string): Promise<PoliticsStateData[]>` em `IDataRepository`.
- [ ] Manter `getPoliticalProposals` na interface por ora para nao quebrar o build; ele sera removido na Task 13.

**Resultado esperado:** contrato de dominio definido, sem quebra do build.

---

### Task 2: Criar DTO Databricks para politica

- [ ] Criar `src/data/dtos/DatabricksPoliticsStateDTO.ts` tipando exatamente as colunas retornadas pelas duas queries SQL da secao 5.
- [ ] Incluir interface `DatabricksPoliticsStateRow` (query 1) e `DatabricksDeputadoScoreRow` (query 2).
- [ ] Todas as colunas numericas como `number | null` — o Databricks pode retornar nulo em agregacoes vazias.

**Resultado esperado:** tipos que representam o formato bruto do banco, isolados da UI.

---

### Task 3: Criar mapper `DatabricksPoliticsStateToPoliticsStateData`

- [ ] Criar `src/data/mappers/mapDatabricksPoliticsStateToPoliticsStateData.ts`.
- [ ] Fazer o join entre as rows da query 1 e os scores de deputados da query 2 por `uf`.
- [ ] Calcular `scoreRate = scoreTotal / votosDecisivos`, com fallback `0` quando `votosDecisivos === 0`.
- [ ] Calcular `topDeputados`: top 5 do estado ordenados por `scoreRate` desc (minimo 1 voto decisivo).
- [ ] Calcular `bottomDeputados`: bottom 5 com ao menos 1 voto decisivo, ordenados por `scoreRate` asc.
- [ ] Criar `src/data/mappers/mapDatabricksPoliticsStateToPoliticsStateData.test.ts` com fixtures realistas (copiar 2-3 rows do CSV de exemplo).
- [ ] Testar caso extremo: estado sem votos decisivos (scoreRate = 0).
- [ ] Testar caso extremo: sem propostas negativas (zerado).

**Resultado esperado:** conversao testada e isolada.

---

### Task 4: Criar `DatabricksPoliticsRepository`

- [ ] Criar `src/data/repositories/DatabricksPoliticsRepository.ts`.
- [ ] Implementar `getPoliticsStateData(periodoReferencia: string)`.
- [ ] Executar query 1 (agregacao por estado) e query 2 (ranking de deputados) usando `withDatabricksSession`.
- [ ] Parametrizar `periodo_referencia` usando o mecanismo ja adotado no `DatabricksClimateRepository` (whitelist ou bind parameter).
- [ ] Acionar o mapper com o resultado das duas queries.
- [ ] Retornar array vazio sem lancar excecao quando a tabela nao tiver dados para o periodo.

**Resultado esperado:** repositorio real com a mesma assinatura do mock.

---

### Task 5: Atualizar `MockRepository` para `getPoliticsStateData`

- [ ] Adicionar `getPoliticsStateData(periodoReferencia: string): Promise<PoliticsStateData[]>` ao `MockRepository`.
- [ ] Criar dados mockados para pelo menos 5 estados (AM, SP, MT, RS, MG) com valores variados de `scoreRate` para cobrir todas as faixas de cor do mapa.
- [ ] Incluir `topDeputados` e `bottomDeputados` com 2-3 deputados ficticicios por estado.
- [ ] Manter `getPoliticalProposals` retornando array vazio por ora.

**Resultado esperado:** desenvolvimento da UI pode continuar sem conexao Databricks.

---

### Task 6: Atualizar factory `createDataRepository`

- [ ] Adicionar leitura de `POLITICS_DATA_SOURCE` (valores: `mock` | `databricks`) em `src/infrastructure/config/env.ts`.
- [ ] Atualizar `createDataRepository.ts` para injetar `DatabricksPoliticsRepository` quando `POLITICS_DATA_SOURCE=databricks`.
- [ ] Manter CO2 e clima nas suas logicas separadas.

**Resultado esperado:** chave granular para ativar dados reais de politica sem afetar clima/CO2.

---

### Task 7: Atualizar rota `/api/politics`

- [ ] Trocar `MockRepository` direta pela factory em `src/app/api/politics/route.ts`.
- [ ] Aceitar parametro `periodo` na query string (padrao: `2024-12`).
- [ ] Validar formato do periodo (regex `^\d{4}-\d{2}$`), retornar `400` em caso invalido.
- [ ] Retornar `PoliticsStateData[]`.
- [ ] Criar `src/app/api/politics/route.test.ts` com testes de parametros validos, invalidos e erro do repositorio.

**Resultado esperado:** endpoint pronto para mock ou Databricks, com contrato `PoliticsStateData[]`.

---

### Task 8: Criar `politicsPresentation.ts`

- [ ] Criar `src/presentation/lib/politicsPresentation.ts`.
- [ ] Exportar `getPoliticsStateColor(state: PoliticsStateData, filter: string): string` — logica de cor conforme secao 3.2.
- [ ] Exportar `getPoliticsSummary(state: PoliticsStateData, filter: string): { title: string; description: string }` — textos explicativos por filtro para o modal (secao 4).
- [ ] Exportar `formatPoliticsRate(rate: number): string` — ex: `72%`.
- [ ] Exportar `POLITICS_FILTERS` — array de `{ id, label, emoji }` para a sidebar.

**Resultado esperado:** logica de apresentacao isolada, sem acoplamento com componentes React.

---

### Task 9: Atualizar `InteractiveMap` — logica de cor para politica

- [ ] Em `InteractiveMap.tsx`, dentro do `useCallback` de `getStateColor`, adicionar o caso `category === 'politics'`.
- [ ] Usar `getPoliticsStateColor` de `politicsPresentation.ts`.
- [ ] O mapa de politica recebe `PoliticsStateData[]` via prop `data` (tipagem generica ja existente ou via union type).
- [ ] Garantir que o `React.memo` no `BrazilMap` continue funcionando — verificar que as props sao estaveis.

**Resultado esperado:** mapa colore estados por alinhamento/apoio/atividade de acordo com o filtro ativo.

---

### Task 10: Atualizar `Sidebar` — filtros de politica

- [ ] Substituir os filtros atuais (`prop_beneficas`, `prop_maleficas`, `prop_aprovadas`) pelos tres novos filtros da secao 3.1.
- [ ] Usar `POLITICS_FILTERS` de `politicsPresentation.ts` para renderizar os botoes de forma data-driven.
- [ ] Atualizar o valor inicial de `politicsFilter` no store para `alinhamento`.
- [ ] Adicionar uma legenda de cores embaixo dos filtros (similar a legenda de `setor_dominante` no CO2) mostrando a escala verde/amarelo/laranja/vermelho.

**Resultado esperado:** sidebar reflete os novos filtros e a legenda ajuda o usuario a interpretar o mapa.

---

### Task 11: Atualizar `StateDetailsModal` — conteudo de politica

- [ ] Remover o `renderPoliticsContent` atual (que lista propostas individuais).
- [ ] Implementar novo `renderPoliticsContent` que recebe o `PoliticsStateData` do estado selecionado e renderiza o conteudo conforme secao 4, variando por `politicsFilter`.
- [ ] Usar `getPoliticsSummary` para o titulo e descricao do painel.
- [ ] Reutilizar o componente `MetricCard` existente para as metricas numericas.
- [ ] Adicionar uma lista de `topDeputados` e `bottomDeputados` abaixo das metricas, com nome, partido, score e taxa.
- [ ] Nao exibir botao de drill-down municipal (politica nao tem nivel municipal).

**Resultado esperado:** modal de politica exibe dados reais e contextualiza o significado do indicador.

---

### Task 12: Atualizar `NationalTable` — colunas de politica

- [ ] Adicionar suporte para dados do tipo `PoliticsStateData` na tabela.
- [ ] Quando `category === 'politics'`, exibir colunas: Estado | Deputados | Score (%) | Votos Decisivos | Sim em Positivas | Nao em Positivas.
- [ ] Ordenar por `scoreRate` desc por padrao.
- [ ] Exibir badge colorido na coluna Score usando a mesma escala de cor do mapa.

**Resultado esperado:** tabela nacional de politica substitui a lista de propostas genericas.

---

### Task 13: Atualizar `page.tsx` — fetch de dados politicos

- [ ] Substituir o fetch atual de `/api/politics?stateId=...` por `/api/politics?periodo=2024-12`.
- [ ] Armazenar `PoliticsStateData[]` em estado local (similar ao `climateData` e `co2Data`).
- [ ] Passar o array para `InteractiveMap` e `StateDetailsModal` quando `category === 'politics'`.
- [ ] Adicionar estado de loading/erro simples para politica.
- [ ] Bloquear navegacao temporal enquanto houver apenas `2024-12` (igual ao que foi feito para clima e CO2) — ao tentar mudar, exibir `Mais datas em breve`.

**Resultado esperado:** UI de politica consome `PoliticsStateData[]` do BFF e exibe no mapa e modal.

---

### Task 14: Atualizar `useAppStore`

- [ ] Adicionar `AVAILABLE_POLITICS_DATE = { month: 12, year: 2024 }` como constante exportada.
- [ ] Garantir que `setPoliticsDate` respeite o bloqueio (igual ao clima).
- [ ] Atualizar `politicsFilter` inicial para `alinhamento`.

**Resultado esperado:** store reflete os novos filtros e o bloqueio de data.

---

### Task 15: Verificacao manual

- [ ] Com `POLITICS_DATA_SOURCE=mock`, subir o dev server e navegar ate a secao de Politica.
- [ ] Verificar que os tres filtros da sidebar alteram as cores do mapa.
- [ ] Clicar em um estado e verificar que o modal exibe os dados corretos para cada filtro.
- [ ] Verificar que a tabela nacional exibe as colunas corretas.
- [ ] Com `POLITICS_DATA_SOURCE=databricks` e `.env.local` configurado, repetir os passos acima com dados reais.
- [ ] Conferir pelo menos 2 estados contra os valores raw do CSV.
- [ ] Rodar `npm run lint` e os testes do projeto.

**Resultado esperado:** tela funcional, sem regressao visual nas demais secoes.

---

### Task 16: Limpeza — remover entidade `PoliticalProposal` legada

- [ ] Remover `getPoliticalProposals` da interface `IDataRepository`.
- [ ] Remover implementacao do `MockRepository`.
- [ ] Deletar `src/domain/entities/PoliticalProposal.ts` se nao houver mais referencias.
- [ ] Verificar que o build passa sem erros de tipo.

**Resultado esperado:** codigo sem remanescentes do modelo antigo.

---

## 9. Ordem recomendada de execucao

1. Tasks 1 e 2 — contratos de dominio e DTO.
2. Task 3 — mapper com testes.
3. Tasks 4 e 5 — repositorios real e mock.
4. Tasks 6 e 7 — factory e rota do BFF.
5. Task 8 — logica de apresentacao.
6. Tasks 9 a 12 — atualizacao dos componentes (podem ir em paralelo).
7. Task 13 e 14 — integracao na page e store.
8. Task 15 — verificacao manual.
9. Task 16 — limpeza.

---

## 10. Criterios de aceite

- `/api/politics?periodo=2024-12` retorna `PoliticsStateData[]` com pelo menos os estados presentes na tabela Databricks.
- O mapa colore os estados de forma diferente nos tres filtros da sidebar.
- Clicar em um estado abre o modal com dados do `politicsFilter` ativo.
- Cambiar o filtro da sidebar atualiza tanto o mapa quanto o conteudo do modal sem fechar o modal.
- Nenhuma regressao nas secoes de clima e CO2.
- Nenhum segredo salvo em arquivo versionado.
- `npm run lint` e testes passam.

---

## 11. Restricao temporal

Enquanto houver apenas `periodo_referencia = 2024-12` na tabela:
- A timeline nao deve permitir navegacao para outros meses.
- Ao tentar mudar, exibir mensagem `Mais datas em breve`.
- Quando dados historicos forem adicionados, a rota `/api/politics` podera receber qualquer `periodo` valido — a query ja e parametrizada por `periodo_referencia`.
