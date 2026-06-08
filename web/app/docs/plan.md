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
