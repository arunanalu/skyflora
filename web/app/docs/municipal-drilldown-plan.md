# Plano: Painel de Detalhes Municipais (Drill-down Overlay)

Este plano cobre a implementação do painel de granularidade municipal acessado ao clicar em "Ver mais detalhes" no modal de um estado. O painel **não abre uma nova página** — é um overlay de tela cheia montado sobre a visualização atual, podendo ser fechado para retornar ao mapa. Exibe dados diários por município filtrados por estado, com busca textual e seleção de data, usando a tabela bronze do Databricks.

## 1. Contexto e premissas

### 1.1 Fonte de dados

Tabela Databricks: `skyflora.bronze.clima_brasil_dez2024`

Query de referência:
```sql
SELECT *
FROM skyflora.bronze.clima_brasil_dez2024
WHERE uf = :uf
  AND nome_municipio ILIKE :search
  AND data_medicao = :date
ORDER BY nome_municipio
LIMIT :limit
OFFSET :offset
```

Colunas disponíveis na tabela bronze:
- Identificação: `cod_ibge`, `nome_municipio`, `uf`, `data_medicao`
- Localização: `latitude`, `longitude`
- Temperatura: `temperatura_maxima_c`, `temperatura_minima_c`, `temperatura_media_c`
- Chuva: `precipitacao_total_mm`
- Atmosfera: `poluicao_particulas_inalaveis`, `poluicao_particulas_finas`, `poluicao_monoxido_carbono`, `percentual_nuvens`
- Solo/vegetação: `perda_agua_solo_vegetacao`, `estresse_hidrico_vegetacao`, `indice_cobertura_vegetal`
- Queimadas: `focos_queimadas_nasa`

> Nota: `indice_cobertura_vegetal` e `percentual_nuvens` têm cobertura esparsa — virão `null` em muitos dias por limitação do satélite. O mapper deve tratar isso com `-` em vez de `0`.

### 1.2 Variável de ambiente nova

Adicionar em `.env.local`:
```env
DATABRICKS_CLIMATE_MUNICIPAL_TABLE=skyflora.bronze.clima_brasil_dez2024
```

Adicionar em `.env.example` (sem valor real):
```env
DATABRICKS_CLIMATE_MUNICIPAL_TABLE=
```

### 1.3 Restrição temporal atual

Enquanto só existir `dez2024`, a data de pesquisa é limitada a 2024-12-01 a 2024-12-31. O DatePicker deve comunicar esse limite. Quando novos meses chegarem, bastará trocar a variável de ambiente ou adicionar lógica de resolução de tabela por período.

### 1.4 Estratégia de carga

O drill-down carrega no máximo **20 registros por requisição** (padrão). O usuário pode paginar com "Carregar mais" (`OFFSET` incremental). A busca usa `ILIKE '%termo%'` com debounce de 300 ms. Isso evita trazer todos os municípios de um estado de uma vez (ex.: SP tem 645 municípios × 31 dias = ~20.000 linhas).

---

## 2. Arquitetura

### 2.1 Rota de API

```
GET /api/climate/municipal
  ?uf=SP
  &date=2024-12-10
  &search=campinas        (opcional, default "")
  &limit=20               (opcional, default 20, max 50)
  &offset=0               (opcional, default 0)
```

Resposta: `MunicipalClimateData[]`

### 2.2 Overlay — sem rota de página nova

O drill-down é implementado como um **overlay de tela cheia** controlado pelo store Zustand existente (`useAppStore`). Não há `router.push` nem nova URL. O overlay é montado em `page.tsx` (junto ao `StateDetailsModal` e ao mapa) e fica invisível até ser ativado.

Fluxo:
1. Usuário clica em um estado no mapa → `StateDetailsModal` abre.
2. Usuário clica em "Ver mais detalhes" → store recebe `setMunicipalDrilldownState(uf)`.
3. `StateDetailsModal` fecha (`setSelectedStateId(null)`).
4. O overlay `MunicipalDrilldownOverlay` entra com animação de slide-up/fade.
5. Usuário clica em ✕ ou pressiona Esc → `setMunicipalDrilldownState(null)` → overlay sai.

### 2.3 Store — adições ao `useAppStore`

```ts
// Novo campo
municipalDrilldownUf: string | null;
setMunicipalDrilldownUf: (uf: string | null) => void;
```

### 2.4 Componentes novos

```
src/presentation/components/
  municipal/
    MunicipalDrilldownOverlay.tsx   ← wrapper do overlay (posição, z-index, Esc, animação)
    MunicipalDrilldownContent.tsx   ← Client Component com estado de busca/paginação/fetch
    MunicipalFilters.tsx            ← barra de busca + datepicker + contador
    MunicipalTable.tsx              ← tabela reutilizável de dados diários por município
```

### 2.5 Posicionamento do overlay

O overlay usa `position: fixed; inset: 0; z-index: 300` (acima do `StateDetailsModal` em z-200, abaixo da `Topbar` apenas em z-order visual). O fundo é `bg-[#0a1120]/96 backdrop-blur-md`. A área de conteúdo tem scroll próprio (`overflow-y: auto`) sem afetar o mapa ou a timeline abaixo.

Layout interno:
```
┌─────────────────────────────────────────┐  ← fixed inset-0 z-[300]
│  Topbar (mantido acima, z-[400])         │
├──────────┬──────────────────────────────┤
│  Cabeçalho: "Estado — SP · São Paulo"   │  ← com botão ✕
├──────────┴──────────────────────────────┤
│  MunicipalFilters (busca + datepicker)   │
├─────────────────────────────────────────┤
│  MunicipalTable (scroll interno)         │
│  ...                                     │
│  [Carregar mais]                         │
└─────────────────────────────────────────┘
```

### 2.6 Camada de dados

```
src/data/dtos/
  DatabricksClimateMunicipalDTO.ts

src/data/mappers/
  mapDatabricksClimateMunicipalToMunicipalData.ts

src/data/repositories/
  DatabricksClimateMunicipalRepository.ts

src/domain/entities/
  MunicipalClimateData.ts
```

---

## 3. Contrato da entidade `MunicipalClimateData`

```ts
export interface MunicipalClimateData {
  ibgeCode: string;
  municipalityName: string;
  uf: string;
  date: string;               // ISO: "2024-12-10"
  latitude: number | null;
  longitude: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  temperatureMean: number | null;
  precipitationMm: number | null;
  pm10: number | null;
  pm25: number | null;
  carbonMonoxide: number | null;
  cloudCoverage: number | null;   // null frequente — satélite bloqueado por nuvens
  waterLoss: number | null;
  waterStress: number | null;
  vegetationIndex: number | null; // null frequente — idem
  fireSpots: number | null;
}
```

---

## 4. Tarefas granulares

### Task 1 — Variável de ambiente e config

- [ ] Adicionar `DATABRICKS_CLIMATE_MUNICIPAL_TABLE` ao `.env.local` (valor real) e ao `.env.example` (vazio).
- [ ] Adicionar campo `climateMunicipalTable` em `getDatabricksConfig()` em `src/infrastructure/config/env.ts`.
- [ ] Validar que erro claro é lançado se a variável estiver ausente quando `CLIMATE_DATA_SOURCE=databricks`.

**Resultado esperado:** app inicia sem erro quando variável está presente; erro legível quando ausente.

---

### Task 2 — DTO e entidade de domínio municipal

- [ ] Criar `src/data/dtos/DatabricksClimateMunicipalDTO.ts` com todas as colunas da tabela bronze.
- [ ] Criar `src/domain/entities/MunicipalClimateData.ts` com o contrato da seção 3.
- [ ] Nenhum `any` nos contratos públicos; campos sabidamente esparsos tipados como `number | null`.

**Resultado esperado:** tipos isolados, sem acoplamento ao Databricks na camada de domínio.

---

### Task 3 — Mapper municipal

- [ ] Criar `src/data/mappers/mapDatabricksClimateMunicipalToMunicipalData.ts`.
- [ ] Extrair `toNumber` / `roundedNumber` para utilitário compartilhado `src/data/mappers/mapperUtils.ts` e atualizar o mapper de estados para importar dali.
- [ ] Tratar `null`, `NaN` e string vazia explicitamente — especialmente em `indice_cobertura_vegetal` e `percentual_nuvens`.
- [ ] Testar o mapper com 3 fixtures extraídas do CSV de exemplo: dia com dados completos, dia com campos esparsos nulos, dia sem vegetação nem nuvens.

**Resultado esperado:** conversão previsível; nenhum `NaN` vaza para a UI.

---

### Task 4 — Repositório municipal

- [ ] Criar `src/data/repositories/DatabricksClimateMunicipalRepository.ts`.
- [ ] Implementar `getMunicipalClimateData({ uf, date, search, limit, offset })`.
- [ ] Validar entradas via whitelist: `uf` (regex `^[A-Z]{2}$`), `date` (regex `^\d{4}-\d{2}-\d{2}$`), `limit` (clamp 1–50), `offset` (>= 0); sanitizar `search` (remover `%`, `_`, `'` soltos ou escapar corretamente para ILIKE).
- [ ] Retornar `MunicipalClimateData[]` via mapper; array vazio quando sem resultados.

SQL de referência:
```sql
SELECT *
FROM {climateMunicipalTable}
WHERE uf = '{uf}'
  AND data_medicao = '{date}'
  AND nome_municipio ILIKE '%{search}%'
ORDER BY nome_municipio
LIMIT {limit}
OFFSET {offset}
```

**Resultado esperado:** repositório funcional com validação de entrada, sem SQL injection.

---

### Task 5 — Rota de API `/api/climate/municipal`

- [ ] Criar `src/app/api/climate/municipal/route.ts`.
- [ ] Validar e sanitizar parâmetros: `uf` (2 letras maiúsculas), `date` (YYYY-MM-DD, dentro de 2024-12-01 a 2024-12-31), `limit` (1–50), `offset` (>= 0), `search` (max 100 chars).
- [ ] Retornar `400` para parâmetros inválidos com mensagem descritiva.
- [ ] Usar `DatabricksClimateMunicipalRepository` quando `CLIMATE_DATA_SOURCE=databricks`; usar mock quando `mock`.
- [ ] Sem cache nesta rota (dados variam por busca interativa do usuário).

**Resultado esperado:** `GET /api/climate/municipal?uf=SP&date=2024-12-10` retorna `MunicipalClimateData[]`.

---

### Task 6 — Mock de dados municipais

- [ ] Criar subset estático com ~30 linhas de municípios variados (pelo menos 3 UFs, dias distintos), baseado no CSV `skyflora_bronze_clima_brasil_dez2024.csv`.
- [ ] Implementar filtragem em memória por `uf`, `date` e `search` (case-insensitive) no `MockRepository`.

**Resultado esperado:** overlay funciona completamente com `CLIMATE_DATA_SOURCE=mock`, sem Databricks.

---

### Task 7 — Store: campo `municipalDrilldownUf`

- [ ] Adicionar `municipalDrilldownUf: string | null` e `setMunicipalDrilldownUf` ao `useAppStore`.
- [ ] Atualizar testes do store para cobrir o novo campo.

**Resultado esperado:** store controla o ciclo de vida do overlay sem prop drilling.

---

### Task 8 — Componente `MunicipalFilters`

- [ ] Criar `src/presentation/components/municipal/MunicipalFilters.tsx`.
- [ ] Input de busca com debounce de 300 ms.
- [ ] `<input type="date">` estilizado com Tailwind, atributos `min="2024-12-01"` e `max="2024-12-31"`.
- [ ] Contador: `"Exibindo {count} município(s)"` / spinner durante loading.
- [ ] Botão ✕ para limpar busca (visível somente quando `search` não é vazio).
- [ ] Props: `uf`, `date`, `search`, `onDateChange`, `onSearchChange`, `loading`, `resultCount`.

**Resultado esperado:** filtros funcionam sem travar a UI.

---

### Task 9 — Componente `MunicipalTable`

- [ ] Criar `src/presentation/components/municipal/MunicipalTable.tsx`.
- [ ] Colunas: Município | Temp. Máx | Temp. Média | Temp. Mín | Chuva (mm) | PM2.5 | PM10 | CO | Perda Água | Est. Hídr. | Focos
- [ ] Campos esparsos (`vegetationIndex`, `cloudCoverage`) exibidos com `-` quando `null`.
- [ ] Status dot colorido por linha (mesma lógica de `getTemperatureStatus` da NationalTable).
- [ ] Skeleton de loading: 8 linhas em `animate-pulse` enquanto `loading=true` e `data` vazio.
- [ ] Mensagem "Nenhum município encontrado para os filtros aplicados." quando array vazio e não loading.
- [ ] Props: `data: MunicipalClimateData[]`, `loading: boolean`.
- [ ] Scroll horizontal interno (`overflow-x-auto`) para não quebrar em telas menores.

**Resultado esperado:** tabela renderiza corretamente nos três estados: loading, vazio, com dados.

---

### Task 10 — Componente `MunicipalDrilldownContent`

- [ ] Criar `src/presentation/components/municipal/MunicipalDrilldownContent.tsx` (Client Component).
- [ ] Estado interno: `search`, `date`, `offset`, `rows`, `loading`, `hasMore`.
- [ ] Data padrão: `2024-12-31`.
- [ ] `useEffect` dispara fetch quando `uf`, `date` ou `search` muda; reseta `offset=0` e `rows=[]` antes de buscar.
- [ ] Botão "Carregar mais" incrementa `offset` e concatena resultados — não substitui.
- [ ] Botão oculto quando `rows.length % limit !== 0` (indica última página).
- [ ] Renderiza `MunicipalFilters` + `MunicipalTable` + botão "Carregar mais".

**Resultado esperado:** busca, paginação e troca de data funcionam sem reload de página.

---

### Task 11 — Componente `MunicipalDrilldownOverlay`

- [ ] Criar `src/presentation/components/municipal/MunicipalDrilldownOverlay.tsx`.
- [ ] Lê `municipalDrilldownUf` do store; renderiza `null` quando `null`.
- [ ] `AnimatePresence` do Framer Motion com `initial={{ opacity: 0, y: 24 }}` / `animate={{ opacity: 1, y: 0 }}` / `exit={{ opacity: 0, y: 24 }}`, duração ~280 ms.
- [ ] `position: fixed; inset: 0; z-index: 300; background: #0a1120/96; backdrop-blur`.
- [ ] Cabeçalho: sigla + nome do estado + botão ✕ (chama `setMunicipalDrilldownUf(null)`).
- [ ] Fechar ao pressionar `Esc` via `useEffect` com `keydown`.
- [ ] Área de conteúdo com `overflow-y: auto` e `padding-top` respeitando a Topbar (60px).
- [ ] Renderiza `MunicipalDrilldownContent` passando `uf`.

**Resultado esperado:** overlay abre/fecha com animação suave; Esc funciona; mapa permanece intacto abaixo.

---

### Task 12 — Integração em `page.tsx`

- [ ] Importar e renderizar `<MunicipalDrilldownOverlay />` em `src/app/page.tsx`, fora de qualquer `motion.section`, junto ao `StateDetailsModal`.
- [ ] No `StateDetailsModal`, substituir o `alert(...)` por:
  ```ts
  setMunicipalDrilldownUf(selectedStateId);
  setSelectedStateId(null);
  ```
- [ ] Garantir que o overlay não interfere com o scroll virtual (`sectionIdx`) nem com os `pointer-events` das seções.

**Resultado esperado:** clicar em "Ver mais detalhes" fecha o modal de estado e abre o overlay municipal.

---

### Task 13 — Testes

- [ ] Testar mapper municipal com 3 fixtures (Task 3).
- [ ] Testar rota `/api/climate/municipal`: parâmetros válidos, `uf` inválido, `date` fora do intervalo, busca vazia, offset além do fim.
- [ ] Testar `MunicipalTable` com RTL: skeleton, vazio, com dados.
- [ ] Testar `MunicipalFilters` com RTL: digitação → debounce, troca de data, botão limpar.
- [ ] Testar store: `setMunicipalDrilldownUf` seta e limpa corretamente.

**Resultado esperado:** suite local passa sem depender de rede ou Databricks.

---

### Task 14 — Verificação visual

- [ ] Subir dev server.
- [ ] Selecionar estado no mapa → clicar "Ver mais detalhes" → overlay abre.
- [ ] Pressionar Esc → overlay fecha, mapa visível.
- [ ] Clicar ✕ → mesmo comportamento.
- [ ] Testar busca por município com debounce.
- [ ] Testar troca de data.
- [ ] Testar "Carregar mais" — novos resultados aparecem abaixo dos anteriores.
- [ ] Verificar campos esparsos: `-` sem quebrar layout.
- [ ] Confirmar scroll horizontal na tabela em viewport estreito.
- [ ] Confirmar que mapa, timeline e topbar não ficam "presos" após fechar overlay.

**Resultado esperado:** fluxo completo funcional visualmente, sem regressões na tela principal.

---

## 5. Ordem recomendada de execução

1. **Tasks 1–3** — base de dados (env, DTO, entidade, mapper + utils compartilhados)
2. **Task 4** — repositório
3. **Tasks 5 + 6** — API e mock (desbloqueia desenvolvimento de UI sem Databricks)
4. **Task 7** — store (desbloqueia integração dos componentes)
5. **Tasks 8–11** — componentes de baixo para cima: filtros → tabela → content → overlay
6. **Task 12** — integração em `page.tsx` e `StateDetailsModal`
7. **Tasks 13–14** — testes e verificação visual

---

## 6. Critérios de aceite

- Clicar "Ver mais detalhes" abre o overlay sem navegar para nova página.
- Esc e botão ✕ fecham o overlay; mapa e timeline voltam ao estado anterior.
- A tabela exibe até 20 municípios por padrão.
- Buscar "campinas" em SP filtra corretamente com debounce.
- Trocar a data atualiza os resultados (reset da paginação).
- "Carregar mais" concatena sem duplicar.
- Campos nulos exibem `-` sem quebrar layout.
- `CLIMATE_DATA_SOURCE=mock` funciona sem Databricks.
- Nenhum segredo em arquivo versionado.
- Overlay não interfere com o scroll virtual do mapa nem com `pointer-events` das seções.

---

## 7. Fora do escopo deste plano

- Gráficos de série temporal por município.
- Integração de dados políticos ou CO2 na visão municipal.
- Mapa SVG de municípios por estado.
- Histórico de meses anteriores (aguarda novos dados no Databricks).
