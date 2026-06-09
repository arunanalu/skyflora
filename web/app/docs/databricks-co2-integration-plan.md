# Plano: Integração de dados reais de CO₂ com Databricks

Este plano cobre a troca dos dados mockados da tela de CO₂ por dados estaduais anuais vindos do Databricks, mantendo o BFF do Next.js como fronteira entre UI e banco.

Tabela de origem:
```sql
SELECT * FROM skyflora.silver.emissoes_estado_setor_categoria_top5_2024
```

## 1. Escopo

**Dentro do escopo:**
- Validar conexão Databricks para a tabela de emissões (pode reaproveitar o cliente já criado para clima).
- Ler os top 5 categorias emissoras por estado, dados de 2024.
- Mapear os dados brutos para um contrato rico de domínio (`CO2Emission`).
- Substituir apenas a tela de CO₂; clima e política continuam intactos.
- Colorir o mapa por nível de emissão total usando escala relativa (comparativa entre estados).
- Exibir no modal de estado os top setores e categorias com contexto explicativo.
- Ajustar filtros da sidebar e comportamento da timeline para o contexto anual.

**Fora do escopo:**
- Drill-down municipal de CO₂ (não há dados nesse nível).
- Integração política real.
- Deploy em produção.

---

## 2. Estrutura dos dados de origem

### 2.1 Colunas relevantes

| Coluna | Tipo | Descrição |
|---|---|---|
| `estado` | string | Nome completo do estado |
| `uf` | string | Sigla do estado (chave de ligação com o mapa) |
| `setor_emissor` | string | Setor de origem das emissões |
| `emissao_total_setor` | float | Emissão total do setor naquele estado (tCO₂eq) |
| `categoria_emissora` | string | Subcategoria dentro do setor |
| `emissao_total_categoria` | float | Emissão da subcategoria (tCO₂eq) |
| `percentual_setor_estado` | float | % do setor em relação ao total de emissões do estado |
| `percentual_categoria_setor` | float | % da categoria em relação ao total do setor |
| `quantidade_registros` | int | Número de registros de origem que compõem o agregado |
| `data_processamento` | date | Data de processamento |
| `timestamp_processamento` | timestamp | Timestamp exato de processamento |

### 2.2 Observações críticas sobre o formato

- Cada estado pode ter até 5 linhas — uma por categoria top-emissora.
- A coluna `emissao_total_setor` repete o valor do setor em cada linha onde aquele setor aparece. **Somar essa coluna diretamente causaria dupla contagem.** O total do estado deve ser calculado somando `emissao_total_setor` de setores únicos por estado.
- O estado `Não Alocado` (uf: `NA`) não corresponde a nenhum estado do Brasil e deve ser **filtrado fora** da visualização no mapa, mas pode ser exibido em nota na tabela se relevante.
- Os valores estão em **tCO₂eq** (toneladas de CO₂ equivalente) — confirmado pelo contexto do SEEG/MCTI.

### 2.3 Setores presentes nos dados (2024)

| Setor | Estados com dominância |
|---|---|
| Mudança de Uso da Terra e Floresta | PA, AM, MT, MA, RO, RR, TO, AC, PI, BA, MG, RS |
| Agropecuária | GO, MS, MG, PR, RS, RO |
| Energia | SP, RJ, DF, SC, PR |
| Processos Industriais | ES, MG, RJ, DF, PB |
| Resíduos | Complementar em vários estados |

---

## 3. Novo contrato de domínio: `CO2Emission`

O contrato atual é esparso e insuficiente. Será substituído por um contrato rico que reflete a estrutura real dos dados.

```ts
// src/domain/entities/CO2Emission.ts

export type CO2Sector =
  | 'Mudança de Uso da Terra e Floresta'
  | 'Agropecuária'
  | 'Energia'
  | 'Processos Industriais'
  | 'Resíduos';

export interface CO2CategoryEntry {
  sector: CO2Sector;           // setor_emissor
  sectorTotalEmission: number; // emissao_total_setor
  sectorShareOfState: number;  // percentual_setor_estado
  category: string;            // categoria_emissora
  categoryEmission: number;    // emissao_total_categoria
  categoryShareOfSector: number; // percentual_categoria_setor
  recordCount: number;         // quantidade_registros
}

export interface CO2Emission {
  stateId: string;             // uf
  stateName: string;           // estado
  year: number;                // fixo: 2024
  totalEmission: number;       // soma de emissao_total_setor por setores únicos
  dominantSector: CO2Sector;   // setor com maior percentual_setor_estado
  top5: CO2CategoryEntry[];    // as até 5 linhas do estado (ordenadas por categoryEmission desc)
  processedAt: string;         // timestamp_processamento
}
```

---

## 4. Lógica de coloração do mapa

### 4.1 Métrica base

A cor de cada estado representa seu **total de emissões em 2024** (campo `totalEmission` da entidade). Isso permite comparação direta entre estados.

### 4.2 Escala logarítmica relativa

Os valores variam de ~1,5 milhão (Sergipe) a ~277 milhões (Pará) de tCO₂eq — uma amplitude de quase 200x. Uma escala linear tornaria a maioria dos estados visivelmente iguais. A solução é normalizar em escala **log₁₀** relativa ao máximo do dataset:

```ts
function getCO2Color(emission: number, maxEmission: number): string {
  const normalized = Math.log10(emission + 1) / Math.log10(maxEmission + 1);
  // normalized: 0 → 1
  // Paleta: verde claro → amarelo → laranja → vermelho escuro
  if (normalized < 0.25) return '#86efac'; // verde claro  — emissão baixa
  if (normalized < 0.45) return '#fde047'; // amarelo      — emissão moderada
  if (normalized < 0.65) return '#fb923c'; // laranja      — emissão alta
  if (normalized < 0.82) return '#ef4444'; // vermelho     — emissão muito alta
  return '#7f1d1d';                        // vermelho escuro — emissão extrema
}
```

**Por que log:** Pará (205 Mt) e Mato Grosso (125 Mt) são outliers severos. Sem log, estados como Sergipe ou Amapá ficariam todos no mesmo tom esverdeado, sem distinção útil.

### 4.3 Filtros da sidebar (substituem o filtro atual de CO₂)

Três filtros alternam o que o mapa exibe:

| Filtro | O que colore | Métrica |
|---|---|---|
| **Emissão total** (padrão) | Total por estado | `totalEmission` em escala log relativa |
| **Setor dominante** | Qual setor lidera | Cor fixa por setor (`#16a34a` floresta, `#b45309` agro, `#2563eb` energia, `#9333ea` industria, `#6b7280` resíduos) |
| **Desmatamento** | Estados com floresta como top setor | Intensidade proporcional ao `sectorTotalEmission` de MUTEAF |

### 4.4 Timeline

A tela de CO₂ é **anual**, não mensal. A timeline deve:
- Mostrar apenas o seletor de ano, não de mês.
- Exibir somente `2024` como opção disponível.
- Ao tentar navegar para outro ano, mostrar tooltip `"Mais anos em breve"`.
- Isso será controlado via `category === 'co2'` na lógica do componente `Timeline`.

---

## 5. Modal de estado: conteúdo e explicações

### 5.1 Cabeçalho do modal

```
[Nome do estado]
Emissão total 2024: X.XXX.XXX tCO₂eq
Setor dominante: [setor]
```

### 5.2 Seção "Top 5 fontes de emissão"

Lista ordenada das categorias (até 5), cada uma com:
- Nome da categoria
- Emissão em tCO₂eq (formatada com separador de milhar)
- % em relação ao total do estado
- Barra visual proporcional (componente CSS puro, sem libs de gráfico)
- Texto explicativo curto (hardcoded por categoria — ver dicionário abaixo)

### 5.3 Dicionário de textos explicativos por categoria

| Categoria | Texto (exibido no modal) |
|---|---|
| Alterações de uso da terra | "Desmatamento e conversão de florestas e cerrado para outros usos. É o maior emissor do Brasil e libera CO₂ armazenado por décadas na vegetação." |
| Fermentação entérica | "Metano produzido pela digestão de bovinos e outros ruminantes. O CH₄ tem poder de aquecimento 28× maior que o CO₂." |
| Solos manejados | "Óxido nitroso liberado pelo uso de fertilizantes nitrogenados e dejetos em pastagens e lavouras. N₂O aquece 273× mais que CO₂." |
| Resíduos florestais | "Biomassa deixada após o desmatamento que apodrece ou queima, liberando carbono que estava estocado na floresta." |
| Transportes | "Queima de combustíveis fósseis por veículos leves, caminhões e aviação. Contribui diretamente com CO₂ e NOx." |
| Disposição final | "Decomposição de resíduos orgânicos em aterros sanitários que gera metano — um dos destinos urbanos mais emissivos." |
| Produção de metais | "Processos siderúrgicos e metalúrgicos que usam carvão como redutor, emitindo CO₂ no refino de minério de ferro e aço." |
| Carbono orgânico no solo | "Perda de carbono armazenado no solo quando ele é revolvido, drenado ou exposto, especialmente em solos anteriormente preservados." |
| Cultivo de arroz | "Arroz inundado cria condições anaeróbicas que produzem metano, significativo especialmente no Rio Grande do Sul." |
| Manejo de dejetos animais | "Armazenamento e tratamento de esterco em condições que geram metano e N₂O — relevante em estados com suinocultura intensa como SC." |
| Geração de eletricidade (serviço público) | "Emissões de usinas termelétricas que queimam gás, óleo ou carvão para gerar energia na rede pública." |
| Produção de combustíveis | "Emissões fugitivas e de combustão no processamento de petróleo e gás natural, especialmente relevante no RJ." |
| Industrial | "Queima de combustíveis em caldeiras, fornos e processos industriais gerais, excluindo geração de eletricidade." |
| Produção e uso de HFCs | "Gases refrigerantes com potencial de aquecimento milhares de vezes maior que o CO₂, usados em ar-condicionado e refrigeração." |
| Efluentes domésticos | "Tratamento de esgoto sem infraestrutura adequada, que produz metano durante a decomposição da matéria orgânica." |
| Produtos minerais | "Calcário e dolomita aquecidos na produção de cimento e cal liberam CO₂ quimicamente — não apenas por combustão." |

### 5.4 Nota de rodapé no modal

```
Fonte: SEEG / MCTI · Ano-base: 2024 · Unidade: tCO₂eq
Valores representam os 5 maiores emissores por estado.
```

---

## 6. Variáveis de ambiente

Reaproveitar as variáveis já existentes em `.env.local`. Adicionar apenas:

```env
DATABRICKS_CO2_STATE_TABLE=skyflora.silver.emissoes_estado_setor_categoria_top5_2024
CO2_DATA_SOURCE=databricks   # ou: mock
```

Adicionar as mesmas chaves (sem valores) ao `.env.example`.

---

## 7. Tasks granulares

### Task 1: Atualizar entidade de domínio `CO2Emission`

- [ ] Substituir o conteúdo de `src/domain/entities/CO2Emission.ts` pelo contrato rico descrito na seção 3.
- [ ] Adicionar o tipo `CO2Sector` e a interface `CO2CategoryEntry`.
- [ ] Verificar se `IDataRepository` precisa ajustar a assinatura de `getCO2Emissions` para retornar `CO2Emission[]`.
- [ ] Atualizar a interface em `src/domain/repositories/IDataRepository.ts` se necessário.

**Resultado esperado:** contrato de domínio rico e tipado, sem quebrar compilação.

---

### Task 2: Criar DTO Databricks de CO₂

- [ ] Criar `src/data/dtos/DatabricksCO2StateDTO.ts` com todas as colunas da tabela de origem tipadas.
- [ ] Permitir `null` para campos que podem vir nulos (ex.: `quantidade_registros`).
- [ ] Criar fixtures de teste com 5 linhas reais do CSV (ex.: Pará completo).

**Resultado esperado:** DTO isolado da UI, com fixtures para testes do mapper.

---

### Task 3: Criar mapper `DatabricksCO2StateDTO → CO2Emission`

- [ ] Criar `src/data/mappers/mapDatabricksCO2StateToCO2Emission.ts`.
- [ ] Agrupar as linhas por `uf` (cada estado pode ter até 5 linhas).
- [ ] Calcular `totalEmission` somando `emissao_total_setor` de **setores únicos** por estado para evitar dupla contagem.
- [ ] Determinar `dominantSector` pelo maior `percentual_setor_estado`.
- [ ] Ordenar `top5` por `emissao_total_categoria` descendente.
- [ ] Excluir o estado `NA` (Não Alocado) do array de retorno.
- [ ] Testar com fixtures: estado com 5 categorias, estado com 3, e presença de `NA`.

**Resultado esperado:** conversão correta e testada; dupla contagem impossível.

---

### Task 4: Criar `DatabricksCO2Repository`

- [ ] Criar `src/data/repositories/DatabricksCO2Repository.ts`.
- [ ] Implementar `getCO2Emissions(year: number): Promise<CO2Emission[]>`.
- [ ] SQL: `SELECT * FROM [tabela] WHERE YEAR(data_processamento) = ?` — ou variação segura usando whitelist de anos válidos.
- [ ] Chamar o mapper e retornar `CO2Emission[]`.
- [ ] Tratar tabela vazia retornando `[]`.
- [ ] Reaproveitar `withDatabricksSession` já existente.

**Resultado esperado:** repositório real com a mesma interface do mock.

---

### Task 5: Atualizar `MockRepository` para o novo contrato

- [ ] Atualizar o mock de `getCO2Emissions` em `MockRepository.ts` para retornar `CO2Emission[]` no novo formato (com `top5`, `totalEmission`, `dominantSector`).
- [ ] Usar dados verossímeis: pelo menos SP, PA, GO, RJ e AC com setores distintos.

**Resultado esperado:** mock válido para testes locais sem Databricks.

---

### Task 6: Atualizar factory de repositório e rota `/api/co2`

- [ ] Adicionar suporte a `CO2_DATA_SOURCE=mock|databricks` na factory de repositório (`createDataRepository` ou equivalente).
- [ ] Atualizar `src/app/api/co2/route.ts`:
  - Usar a factory para instanciar o repositório correto.
  - Validar o parâmetro `year` (aceitar apenas números inteiros; retornar `400` para valor inválido).
  - Enquanto só 2024 está disponível, forçar `year=2024` se outro valor for passado, ou retornar `400`.
- [ ] Adicionar variáveis ao `.env.example`.

**Resultado esperado:** endpoint flexível, controlável por variável de ambiente.

---

### Task 7: Adicionar lógica de cor de CO₂ no `InteractiveMap`

- [ ] Criar `src/presentation/lib/co2Presentation.ts` com:
  - `getCO2Color(emission: number, maxEmission: number): string` — escala log relativa com 5 faixas (seção 4.2).
  - `getCO2SectorColor(sector: CO2Sector): string` — cor fixa por setor (seção 4.3).
  - `getCO2DeforestationColor(emission: number, maxDeforestation: number): string` — para o filtro de desmatamento.
- [ ] Em `InteractiveMap.tsx`, substituir a lógica atual de CO₂ (switch por `topPolluter`) pelo uso das funções acima.
- [ ] Calcular `maxEmission` e `maxDeforestation` via `useMemo` a partir do array de dados antes de passar ao `getStateColor`.
- [ ] Garantir que o `useCallback` de `getStateColor` inclua `maxEmission` nas dependências para evitar cor desatualizada.

**Resultado esperado:** mapa exibe gradiente de emissão coerente com os dados reais.

---

### Task 8: Atualizar sidebar de CO₂

- [ ] Substituir os filtros atuais de CO₂ na `Sidebar.tsx` pelos três filtros definidos na seção 4.3:
  - `emissao_total` (padrão)
  - `setor_dominante`
  - `desmatamento`
- [ ] Atualizar o tipo de `co2Filter` no store Zustand para aceitar esses três valores.
- [ ] Garantir que o `co2Filter` seja resetado para `emissao_total` quando a seção de CO₂ é ativada.

**Resultado esperado:** sidebar com filtros semânticos e funcionais para CO₂.

---

### Task 9: Atualizar `StateDetailsModal` para CO₂

- [ ] No branch de CO₂ do modal (`renderCO2Content`), exibir:
  - Cabeçalho: nome do estado, emissão total formatada, setor dominante.
  - Lista das top 5 categorias com barra visual proporcional, valor em tCO₂eq, % do total do estado e texto explicativo (usar dicionário da seção 5.3 via função `getCO2CategoryExplanation(category: string): string`).
  - Nota de rodapé com fonte e unidade.
- [ ] Criar `src/presentation/lib/co2Explanations.ts` com o dicionário de textos da seção 5.3.
- [ ] Ajustar o tipo `DetailRow` do modal para incluir os campos novos de `CO2Emission` (`totalEmission`, `dominantSector`, `top5`, `stateName`).
- [ ] Garantir que o modal não exiba o botão de drill-down municipal quando `category === 'co2'` (já deve estar implementado, verificar).

**Resultado esperado:** modal de CO₂ informativo, explicativo e visualmente coerente.

---

### Task 10: Travar timeline para CO₂ em 2024

- [ ] Em `Timeline.tsx`, detectar quando `category === 'co2'`.
- [ ] Quando CO₂ estiver ativo:
  - Exibir apenas o seletor de ano (ocultar seletor de mês).
  - Exibir `2024` como única opção disponível, desabilitando navegação anterior/posterior.
  - Ao tentar navegar, exibir tooltip ou texto inline: `"Mais anos em breve"`.
- [ ] Garantir que ao sair da seção CO₂ o comportamento da timeline retorne ao normal para clima.

**Resultado esperado:** timeline semanticamente correta para dados anuais.

---

### Task 11: Integrar dados reais na página principal

- [ ] Em `page.tsx`, o fetch de CO₂ deve usar `year=2024` fixo enquanto só esse ano existe.
- [ ] Adicionar estado de loading e erro simples para CO₂ (semelhante ao de clima).
- [ ] Passar o array real de `CO2Emission[]` para `InteractiveMap` e `StateDetailsModal` quando a categoria ativa for CO₂.
- [ ] Confirmar que `NationalTable` exibe dados de CO₂ com colunas adequadas (estado, emissão total, setor dominante) ao alternar para a visão de tabela.

**Resultado esperado:** tela de CO₂ consome dados reais e os exibe no mapa, tabela e modal.

---

### Task 12: Atualizar `NationalTable` para CO₂

- [ ] Quando `category === 'co2'`, a tabela deve exibir colunas:
  - Estado (nome completo)
  - Emissão total 2024 (tCO₂eq, formatada)
  - Setor dominante
  - % do setor dominante no total do estado
- [ ] Ordenar por emissão total descendente por padrão.
- [ ] Garantir que o scroll dentro da tabela não acione navegação entre seções (já resolvido para clima — verificar se CO₂ herda o mesmo comportamento).

**Resultado esperado:** tabela de CO₂ útil e ordenada.

---

### Task 13: Teste manual de conexão e verificação visual

- [ ] Com `.env.local` configurado e `CO2_DATA_SOURCE=databricks`:
  - Acessar `/api/co2?year=2024`.
  - Confirmar retorno com 27 estados (excluindo `NA`).
  - Verificar PA: `totalEmission` deve ser próximo a 277 Mt (205 Mt MUTEAF + 55 Mt Agro + ~12 Mt Energia).
  - Verificar SE: menor emissão total (~10 Mt).
- [ ] Abrir o browser, navegar até a seção CO₂.
- [ ] Verificar que o mapa exibe gradiente de cores coerente (PA, AM, MT com cor mais escura).
- [ ] Clicar em Pará — confirmar modal com top 5, barras proporcionais e textos explicativos.
- [ ] Alternar os 3 filtros e confirmar que o mapa muda de cor.
- [ ] Rodar `npm run lint` e testes.

**Resultado esperado:** CO₂ real integrado, visual coerente, sem regressão em clima e política.

---

## 8. Ordem de execução recomendada

1. Tasks 1–2: contrato e DTO (sem tocar em UI).
2. Task 3: mapper com testes — validar antes de avançar.
3. Tasks 4–5: repositório Databricks e mock atualizado.
4. Task 6: factory e rota — testar `/api/co2` via curl.
5. Tasks 7–10: UI (mapa, sidebar, modal, timeline) — podem ser feitas em paralelo após Task 6.
6. Tasks 11–12: integração final na página.
7. Task 13: verificação.

---

## 9. Critérios de aceite

- `/api/co2?year=2024` retorna `CO2Emission[]` com 27 estados e `top5` preenchido.
- O mapa exibe gradiente log-escala coerente: PA/AM/MT notavelmente mais escuros que SE/AP/RR.
- Clicar em qualquer estado abre modal com top 5 categorias, barras, valores e texto explicativo.
- Alternar filtros na sidebar muda a cor do mapa sem recarregar a página.
- A timeline exibe apenas 2024 para CO₂ e bloqueia navegação para outros anos.
- O botão de drill-down municipal não aparece na seção CO₂.
- `CLIMATE_DATA_SOURCE=mock` e `CO2_DATA_SOURCE=mock` continuam funcionando independentemente.
- Nenhum segredo salvo em arquivo versionado.
- `npm run lint` e testes passam sem erros.
