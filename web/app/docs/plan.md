# Plano de Desenvolvimento: Interface Web Skyflora

Este documento estabelece o roteiro técnico e arquitetural para o desenvolvimento da interface web do projeto Skyflora, localizado no diretório `web/app`. As diretrizes aqui definidas baseiam-se nas instruções de design, nos exemplos visuais e no código de referência previamente gerados.

## 1. Visão Geral e Stack Tecnológico

- **Framework**: Next.js (App Router).
- **Abordagem Arquitetural**: Monólito com BFF (Backend For Frontend). O Next.js hospedará tanto a interface do usuário (Client e Server Components) quanto as rotas de API que se comunicarão com o banco de dados.
- **Preparação Multi-plataforma**: A componentização isolada e a abordagem API-first no BFF garantem que o core possa ser empacotado para PWA ou consumido por um app mobile futuramente.
- **Padrão de Código**: Clean Architecture para isolamento do domínio.

## 2. Referências de Design e Implementação

Ao longo da construção, os desenvolvedores deverão consultar:
- **[Instruções de Design Principais](file:///C:/Users/phoen/Documents/Dev/skyflora/web/design/README.md)**
- **Imagens de Referência**:
  - Hero/Apresentação: [main_page.png](file:///C:/Users/phoen/Documents/Dev/skyflora/web/design/exemple_on_images/main_page.png)
  - Visão de Mapa (Clima): [page_climate_data_map_view.png](file:///C:/Users/phoen/Documents/Dev/skyflora/web/design/exemple_on_images/page_climate_data_map_view.png)
  - Interação com Estado: [focus_on_one_state.png](file:///C:/Users/phoen/Documents/Dev/skyflora/web/design/exemple_on_images/page_climate_data_map_view_focus_on_one_state.png) e [details_per_state.png](file:///C:/Users/phoen/Documents/Dev/skyflora/web/design/exemple_on_images/page_climate_data_details_per_state.png)
  - Visão Tabular: [page_climate_data_table_view.png](file:///C:/Users/phoen/Documents/Dev/skyflora/web/design/exemple_on_images/page_climate_data_table_view.png)
  - Emissão de CO2: [page_co2_map_view.png](file:///C:/Users/phoen/Documents/Dev/skyflora/web/design/exemple_on_images/page_co2_map_view.png)
- **[Código de Referência da Lovable](file:///C:/Users/phoen/Documents/Dev/skyflora/web/design/exemple_on_code/src/)**: A estrutura Vite/React serve de base inspiracional para estilos, componentes Tailwind, lógicas de hooks e layout visual.

## 3. Clean Architecture e Estrutura de Dados

Para garantir que futuras trocas de banco de dados não afetem o Frontend, usaremos uma arquitetura em camadas.

### 3.1 Camadas
1. **Domain (Domínio)**: Contém as Entidades da regra de negócio (`ClimateData`, `PoliticalProposal`, `CO2Emission`) independentes de qualquer framework ou banco.
2. **Data (Dados)**: Contém DTOs exatos de como o dado volta do Databricks e **Mappers** que traduzem um DTO em uma Entidade de Domínio.
3. **Infrastructure/BFF**: Os repositórios (`IDataRepository`). Teremos o `MockRepository` (dados estáticos) e o `DatabricksRepository` (integração real).
4. **Presentation (Apresentação)**: Componentes React e as Next.js API Routes que agem como controladores.

### 3.2 Estrutura de Diretórios Recomendada
```text
web/app/
├── src/
│   ├── app/                      # (Presentation) Next.js App Router
│   │   ├── api/                  # BFF: Rotas de API que chamam a camada de casos de uso
│   │   │   └── climate/route.ts  # Ex: GET /api/climate?state=SP&month=04
│   │   ├── layout.tsx            # Contextos globais (Timeline, Filtros)
│   │   └── page.tsx              # Página principal (Scroll Storytelling)
│   │
│   ├── domain/                   # (Domain) Independente de dependências externas
│   │   ├── entities/             # Classes de modelo (ex: StateData.ts)
│   │   └── useCases/             # Lógica de negócio (ex: GetClimateDataUseCase.ts)
│   │
│   ├── data/                     # (Data) Repositórios e DTOs
│   │   ├── dtos/                 # Databricks DTOs
│   │   ├── mappers/              # Conversores: DatabricksDTO -> Entity
│   │   └── repositories/         # Implementação das interfaces (Mock e Databricks)
│   │
│   └── presentation/             # (Presentation) Componentes React
│       ├── components/
│       │   ├── map/              # Componentes de mapa interativo (Brasil)
│       │   ├── tables/           # Tabelas dinâmicas
│       │   ├── sidebar/          # Filtros dinâmicos laterais
│       │   └── timeline/         # Slider/Player temporal (mês/ano)
│       └── stores/               # Gerenciamento de estado global (Zustand/Context)
```

## 4. Padrão do BFF, Cache e Transição para Databricks

A comunicação entre o Front-end e o BFF deve ser **fluida e direta**, consumindo as Entidades de Domínio puras ou dados já limpos. **O trabalho de desacoplamento e tradução (lidar com os formatos brutos e DTOs externos) fica totalmente a cargo do BFF e da camada Data**.

O fluxo funcionará da seguinte forma:
1. O **BFF** (`src/app/api/...` ou Server Actions) recebe a solicitação do Front-end.
2. O **BFF** acessa os Repositórios (camada `Data`).
3. O Repositório obtém os dados no formato bruto (DTO do Databricks) e aciona os **Mappers** para traduzi-los em **Entidades de Domínio**.
4. O **BFF** entrega ao Front-end essa Entidade limpa. Sendo um monólito Next.js, o front consome os dados nativamente e de forma tipada, sem precisar de conversores na UI.
5. Inicialmente, o BFF injetará um `MockRepository` para devolver dados fictícios no formato esperado. Depois, bastará trocar para o `DatabricksRepository` de maneira 100% invisível ao Front-end.

### 4.1 Estratégia de Cache e Otimização (Next.js)
Para garantir uma experiência de usuário ultra-rápida e economizar recursos do banco de dados (Databricks), o BFF fará uso extensivo do mecanismo de **Cache Nativo do Next.js** (como _Data Cache_ e _ISR - Incremental Static Regeneration_):
- **Cargas Iniciais Cacheadas**: Os dados das telas principais e visões macro (ex: os dados estaduais que carregam junto com o mapa ao abrir o site) serão cacheados pelo servidor.
- **Respostas Instantâneas**: Quando o primeiro usuário acessar o site, o Next.js consultará o Databricks, fará a conversão via Mapper e salvará o resultado em cache. A partir do segundo usuário em diante, o site e os dados serão servidos imediatamente pelo cache do framework.
- **Revalidação**: Como os dados políticos e climáticos do projeto geralmente consolidam por mês/ano, o tempo de revalidação (_revalidate_) do cache pode ser configurado em intervalos de horas ou até mesmo dias, garantindo um balanço perfeito entre dados atualizados e performance máxima.

### 4.2 Revalidação Sob Demanda (On-Demand Revalidation)
Para forçar a atualização imediata dos dados na interface logo após a esteira de dados (ETL) inserir novidades no Databricks, o BFF utilizará os recursos de purga de cache (`revalidatePath` ou `revalidateTag`):
- O Next.js possuirá uma rota de API (ex: `/api/revalidate`) dedicada a receber o gatilho de revalidação.
- Ao final dos scripts de extração do projeto (`dados_climaticos/` ou `dados_politicos/`), um Webhook será disparado.
- **Exemplo de gatilho via cURL**:
  ```bash
  curl -X POST "https://url-do-seu-site.com.br/api/revalidate" \
       -H "Content-Type: application/json" \
       -d '{"path": "/"}'
  ```
- A recepção do sinal purgará o cache vigente. O visitante seguinte causará uma nova consulta real ao Databricks, realimentando o cache com os dados atualizados para todos os próximos acessos.

## 5. Implementação da Interface: Scroll Storytelling

A experiência de usuário é baseada em uma única página navegável por scroll:
1. **Hero Section**: Apresentação visual da Skyflora.
2. **Sessão Clima**:
   - Menu Lateral atualiza seus itens para: *Temperatura, Atmosfera, Solo*.
   - Alternância entre **Mapa Interativo** (com estados clicáveis e modais) e **Tabela Nacional**.
   - Possibilidade de "Drill-down" para nível municipal em pop-ups.
3. **Sessão Política**:
   - Menu Lateral muda para: *Propostas, Propostas Aprovadas*.
   - Exibição de proposições benéficas vs maléficas.
   - Drill-down em um município mostrará a lista de deputados locais e seus votos.
4. **Sessão Emissão de CO2**:
   - Visualização por **Ano** (a Timeline muda seu comportamento).
   - Somente visualização Estadual (o drill-down municipal é desativado).

O estado global (mês ativo, ano ativo, categoria selecionada) deve ser mantido em um gerenciador de estado (ex: Zustand ou Context API) para que a Timeline inferior e a Sidebar esquerda controlem a visualização do componente central (Mapa/Tabela).

## 6. Estratégia de Testes Unitários

A adoção da Clean Architecture facilita imensamente a testabilidade do sistema, permitindo testes isolados de lógica de negócio e interface. Sugere-se a utilização do **Vitest** (ou Jest) junto com a **Testing Library**:

1. **Testes de Domínio e Casos de Uso (`domain/`)**:
   - Garantir que as regras de negócio funcionam isoladamente (ex: cálculos de insalubridade climática, agrupamentos e classificações de propostas políticas).
   - Mockar inteiramente a camada de dados injetando instâncias falsas de `IDataRepository`.
2. **Testes de Dados e Mappers (`data/`)**:
   - Testar exaustivamente os `Mappers` (DTO para Entity). É crucial garantir que, caso o Databricks retorne um payload vazio, nulo ou formatado de maneira imprevista, o mapper lide com a exceção graciosamente sem quebrar a aplicação.
   - Testar o comportamento das implementações de Repositório (MockRepository).
3. **Testes de Componentes (`presentation/`)**:
   - Utilizar a *React Testing Library* para garantir que mapas, tabelas e filtros renderizem corretamente com base nas propriedades recebidas.
   - Testar as interações de usuário (ex: clique em um estado deve disparar a alteração do estado global para a visão municipal).

## 7. Tarefas de Execução (Granularizadas para LLM)

Para que cada etapa seja uma *task* atômica e claramente executável por uma LLM, o desenvolvimento foi fatiado na seguinte trilha estrutural:

- [ ] **Task 1: Inicialização do Next.js e Dependências**. Criar o projeto base, configurar Tailwind, dependências principais (ex: Zustand, Framer Motion) e padronização (Lint/Prettier).
- [ ] **Task 2: Setup de Testes e Clean Architecture**. Configurar Vitest/Jest com React Testing Library. Criar e documentar a estrutura de diretórios (`domain`, `data`, `presentation/components`, `app/api`).
- [ ] **Task 3: Camada de Domínio**. Definir Entidades (ex: `StateData`, `PoliticalProposal`, `CO2Emission`) e criar as interfaces do repositório (`IDataRepository`) dentro de `domain/`.
- [ ] **Task 4: Repositório Mockado**. Desenvolver o `MockRepository` em `data/repositories` que retorna estruturas de dados falsas respeitando as Entidades criadas na Task 3.
- [ ] **Task 5: Endpoints da API (BFF)**. Construir as rotas (ex: `/api/climate`, `/api/politics`) usando App Router que instanciam o MockRepository e devolvem os dados para o Front. Testar o fluxo do endpoint.
- [ ] **Task 6: Estado Global (Zustand/Context)**. Criar o Store para gerenciar Mês, Ano, Categoria Selecionada (Clima/Política/CO2) e Estado (UF) em foco. Adicionar testes ao Store.
- [ ] **Task 7: Layout Base - Sidebar (Filtros)**. Construir o componente do Menu Lateral dinâmico (comportamento muda dependendo do scroll).
- [ ] **Task 8: Layout Base - Timeline**. Construir a barra inferior de controle temporal (meses/anos).
- [ ] **Task 9: Componente - Tabela Nacional**. Desenvolver e testar o componente de tabela capaz de receber os dados brutos e listá-los (suportando a visão nacional e estadual).
- [ ] **Task 10: Componente - Mapa Interativo**. Implementar o mapa SVG do Brasil reagente a cliques (seleção de estados) e hover (com tooltip básico).
- [ ] **Task 11: Lógica de Drill-down (Municípios)**. Criar o pop-up/modal detalhado ativado ao clicar em um estado no Mapa ou na Tabela, integrando a transição de visão (Macro -> Micro).
- [ ] **Task 12: Integração e Scroll Storytelling (Page)**. Unificar Sidebar, Timeline, Mapa e Tabela na página principal (`page.tsx`) controlando a transição de contexto visual via bibliotecas de animação enquanto o usuário rola a tela.

## 8. Escopo Futuro (Próximo Plano de Desenvolvimento)

É crucial deixar explícito que a integração real com o banco de dados e a disponibilização do sistema em produção **não fazem parte do escopo deste plano atual de desenvolvimento da interface**. Os seguintes itens estão estritamente reservados para um planejamento futuro:

- **Integração Real com Databricks**: Desenvolvimento do `DatabricksRepository`, construção das interfaces exatas dos DTOs baseadas nas respostas do banco e testes rigorosos dos `Mappers`.
- **Substituição dos Mocks**: Trocar a injeção de dependência (`MockRepository` -> `DatabricksRepository`) nos endpoints do BFF de forma definitiva.
- **Gatilhos de Revalidação**: Implementação da rota `POST /api/revalidate` para uso do Webhook (descrito na subseção 4.2).
- **Deploy**: Implantação e hospedagem do monólito Next.js.


---

## 9. Implementação Concluída — Scroll Storytelling e Mapa Interativo

> Esta seção documenta as decisões técnicas tomadas durante a implementação real da interface, servindo de referência para manutenção futura e para a transição ao `DatabricksRepository`.

### 9.1 Scroll Virtual (sem `window.scroll`)

A abordagem de scroll convencional (HTML scroll + `IntersectionObserver`) foi descartada. Em vez disso, a navegação entre seções é controlada por um único **`useMotionValue(0)`** chamado `sectionIdx` (Framer Motion).

**Por quê?**
- `window.scroll` em elementos `fixed` causa conflitos com `overflow: hidden` e impede o controle fino de animações.
- O `MotionValue` permite transformar posição, opacidade e escala de cada seção de forma declarativa, sem re-renderizar o componente.

**Como funciona:**
- Valores: `0 = hero`, `1 = climate`, `2 = politics`, `3 = co2`.
- Ao receber um evento `wheel`, `goToSection(idx)` chama `animate(sectionIdx, target, springConfig)`.
- `useTransform` deriva `opacity`, `y` e `scale` de `sectionIdx` para a seção hero (única que ainda anima visualmente).
- Um lock booleano (`locked`) com `setTimeout(560ms)` impede múltiplos scrolls simultâneos.
- Navegação pelo `Topbar` usa `window.dispatchEvent(new CustomEvent('skyflora:navigate', { detail: idx }))`.

**Configuração de spring escolhida:**
```ts
{ type: 'spring', stiffness: 400, damping: 60, mass: 1 }
// Overdamped (ζ ≈ 1.5): sem overshoot, settle ~500ms, lock liberado em 560ms.
```

**Arquivo:** `src/app/page.tsx`

---

### 9.2 Mapa SVG do Brasil

O mapa é renderizado com SVG puro a partir de um GeoJSON local — sem biblioteca de mapas externa.

**GeoJSON:**
- Fonte original: `codeforamerica/click_that_hood` (Brazil states, 27 features).
- Arquivo salvo localmente em `public/brazil-states.geojson` (3.3 MB) para eliminar a dependência de rede e latência.
- `fetch('/brazil-states.geojson')` — servido pelo Next.js como arquivo estático.
- Cada feature tem `properties.sigla` com a sigla do estado (UF).

**Projeção equiretangular:**
```ts
const LON_MIN = -74.0, LON_MAX = -28.0;  // span: 46°
const LAT_MAX =   5.5, LAT_MIN = -34.0;  // span: 39.5°
const VW = 540, VH = 480;               // aspect ratio ≈ 1.125 ≈ proporção real do Brasil

function project([lon, lat]): [x, y] {
  x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * VW;
  y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VH;
}
```

A razão VW/VH = 1.125 corresponde à proporção geográfica corrigida do Brasil (lon_span × cos(lat_center) / lat_span ≈ 1.13).

**Otimizações de performance no SVG:**
- `React.memo` no componente `BrazilMap` — evita re-render durante scroll.
- `useCallback` para `getStateColor` em `InteractiveMap` — props estáveis garantem que o memo funcione.
- `style={{ willChange: 'transform' }}` no `<svg>` — promove para compositing layer GPU, evitando rasterização em cada frame.
- Removido `transition-all duration-150` dos `<path>` — essa classe CSS causava recálculo de estilo para todos os 27 estados a cada frame de animação do scroll.
- Hover e seleção usam `style={{ filter: 'brightness(1.25)' }}` direto (sem CSS transition).

**Arquivos:** `src/presentation/components/map/BrazilMap.tsx`, `src/presentation/components/map/InteractiveMap.tsx`

---

### 9.3 Arquitetura: Mapa Compartilhado (Persistent Map)

**Problema resolvido:** As três seções de dados (Clima, Política, CO₂) tinham cada uma sua instância de `InteractiveMap`. Durante o scroll entre elas, o Framer Motion animava (y + opacity + scale) o SVG inteiro — causando jank mesmo com GPU compositing.

**Solução implementada:** Um único `<InteractiveMap>` montado uma vez, posicionado como `fixed` na área de conteúdo:

```tsx
// Em page.tsx — fora de qualquer motion.section
<motion.div
  style={{ position: 'fixed', left: 308, right: 32, top: 72, bottom: 96,
           opacity: mapOpacity,   // fade-in saindo do hero
           zIndex: 10 }}
>
  <InteractiveMap data={climateData} onStateClick={setSelectedStateId} />
</motion.div>
```

**Comportamento ao scrollar entre seções de dados:**
- O mapa **não anima** — permanece fixo na tela.
- Somente o painel esquerdo (título + sidebar) anima via `AnimatePresence` com fade+slide de 180ms.
- `InteractiveMap` relê `category`, `climateFilter`, `politicsFilter`, `co2Filter` do store Zustand e recomputa `getStateColor` via `useCallback`. O `BrazilMap` (com `React.memo`) re-renderiza apenas quando as cores mudam — sem animação.

**Tabela:**
- Estado `showTable: boolean` único para todas as seções, resetado quando `category` muda.
- Quando ativo, um `motion.div` com `AnimatePresence` (`zIndex: 15`) desliza por cima do mapa com `bg-[#111827]/95 backdrop-blur-sm`.

---

### 9.4 Layout — Painel Esquerdo

O painel esquerdo (título da seção + filtros) é um elemento `fixed` separado, **fora** do stack de seções:

```tsx
<div
  className="fixed left-8 z-[200] flex flex-col justify-center gap-5"
  style={{ top: 72, bottom: 96 }}   // ancorado entre topbar (60px) e timeline
>
  <AnimatePresence mode="wait">
    <motion.div key={category} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} ...>
      {/* tag + título da seção atual */}
    </motion.div>
  </AnimatePresence>
  <Sidebar />
</div>
```

`top: 72` e `bottom: 96` garantem que o painel nunca invade o `Topbar` (60px) mesmo em viewports pequenas — ao contrário de `top-1/2 -translate-y-1/2`, que poderia ultrapassar o topo em telas com menos de ~480px de altura.

---

### 9.5 Modal de Estado (`StateDetailsModal`)

**Problema:** O botão ✕ tinha área de clique fragmentada. Causa: o card tinha `overflow: hidden` + `border-radius: 2rem` (32px). O botão em `top-6 right-6` (24px) ficava dentro do raio de curvatura — o clip CSS cortava visualmente e funcionalmente parte do botão.

**Solução:**
- Removido `overflow: hidden` do card.
- Gradiente superior usa `rounded-tl-[2rem] rounded-tr-[2rem]` explicitamente.
- Botão movido para `top-5 right-5` com `z-index: 20` e ✕ Unicode real.
- Modal com `z-[500]` posicionado **fora** do container `overflow: hidden` principal (`div.fixed.inset-0`) para garantir que `position: fixed` e `z-index` funcionem sem interferência de contextos de empilhamento internos.
- Fechar ao clicar fora: `onClick={close}` no backdrop + `onClick={e => e.stopPropagation()}` no card.

---

### 9.6 Pointer Events e `inert`

Para evitar que seções empilhadas (`absolute inset-0`) bloqueiem cliques na seção ativa:

- `motion.section` de cada seção recebe `pointerEvents: category === 'X' ? 'auto' : 'none'` via inline style.
- O atributo `inert={true}` (React 19, tipo `boolean`) é aplicado ao div de conteúdo de seções inativas — bloqueia toda a subárvore (foco, pointer events, acessibilidade).
- `setCategory` é chamado **imediatamente** em `goToSection` (não via `useMotionValueEvent`) para evitar 60 atualizações de estado por segundo durante a animação spring.

---

### 9.7 Stacks e Versões

| Dependência | Versão | Uso principal |
|---|---|---|
| Next.js | 16.2.7 | App Router, BFF, ISR |
| React | 19 | `inert` como boolean nativo |
| Framer Motion | 12 | `useMotionValue`, `useTransform`, `AnimatePresence`, `animate()` |
| Zustand | — | Store global (`category`, `selectedStateId`, filtros, datas) |
| Tailwind CSS | 4 | Estilização utility-first |

