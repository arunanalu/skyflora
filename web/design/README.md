# Design do Módulo Web (Skyflora)

Este documento descreve as diretrizes de design e arquitetura para a construção do módulo front/back (monólito Next.js com BFF, preparado para web e possivelmente mobile). O objetivo desta aplicação é consumir os dados tratados no Databricks (originados dos scripts em `dados_climaticos` e `dados_politicos`) e apresentá-los de forma interativa e visual.

## Estrutura Geral da Interface

### 1. Menu Lateral Esquerdo (Filtros)
- **Função:** Permitir a filtragem detalhada dos dados exibidos na tela principal. **Importante:** As categorias deste menu mudarão dinamicamente de acordo com a "página" (seção do scroll) atual. Cada visualização terá seus próprios filtros específicos.
- **Categorias por Página:**
  - **Dados Climáticos:**
    - **Temperatura:** O mapa mostra as temperaturas máxima, média e mínima de cada estado (detalhes ao clicar no estado).
    - **Atmosfera:** O mapa exibe a poluição de partículas inaláveis, partículas finas, CO2 e a cobertura de nuvens por estado (detalhes ao clicar no estado).
    - **Solo:** O mapa apresenta a perda de água do solo, estresse hídrico, cobertura vegetal e focos de queimadas de cada estado (detalhes ao clicar no estado).
  - **Política:**
    - **Propostas:** Permite visualizar a quantidade de propostas benéficas e maléficas ao meio ambiente em cada estado (ao clicar no estado).
    - **Propostas Aprovadas:** Semelhante à categoria anterior, mas exibe o status (quantidade de propostas que foram aprovadas e as que não foram).
  - **Dados de CO2:**
    - **Média de emissão por estado:** Permite visualizar a média de emissão anual de CO2 de cada estado.
    - **Principais poluidores por estado:** Exibe os maiores emissores de CO2 em cada estado.
    - *Nota:* Esta página é visualizada **por ano** (diferente das demais que são por mês) e **não possui drill-down por município**, oferecendo exclusivamente a visão consolidada em nível estadual.

### 2. Menu Inferior (Controle Temporal)
- **Localização:** Canto inferior da página, com um design simples e discreto.
- **Função:** Alterar o mês (e possivelmente o ano) da visualização dos dados globais na tela, permitindo analisar a evolução temporal dos índices.

### 3. Visualização Principal (Mapa e Tabela)
- **Visão Padrão:** Um mapa interativo do Brasil.
- **Alternância de Visão:** Permitir a mudança da visualização entre o mapa interativo e uma **visualização de tabela**.
- **Comportamento na Visão de Mapa:**
  - Ao selecionar uma categoria no menu lateral e clicar em um estado no mapa, um **pop-up** (ou modal) se abre exibindo os dados específicos daquele estado referentes à categoria escolhida (ex: temperaturas, poluição, quantidade de propostas, além de métricas gerais como índice de insalubridade).
- **Comportamento na Visão de Tabela:**
  - Diferente do mapa, na visão tabular **não é necessário clicar em um estado** para ver os comparativos. Todos os estados e seus respectivos dados (filtrados pela categoria selecionada no menu) ficam dispostos de imediato em uma tabela única e *scrollável*.
- **Detalhes por Município (Drill-down):**
  - **Exceção - Página de CO2:** Esta página **não possui** drill-down por município, restringindo-se puramente à visualização em nível estadual.
  - Nas demais páginas (Clima, Política), **em ambas as visualizações (Mapa e Tabela)**, ao clicar em um estado (seja no mapa ou na linha/card da tabela), deve haver uma opção ou botão para expandir/aprofundar a visualização e acessar os dados completos desmembrados **por município** daquele estado.
  - **Nota Especial - Página de Política:** Ao detalhar os dados por município nesta página, a interface deve exibir uma lista dos deputados daquele local e suas respectivas propostas votadas, indicando claramente se o impacto foi classificado como benéfico ou maléfico ao meio ambiente.

---

## Dinâmica de Navegação (Scroll Storytelling)

A aplicação será construída com a percepção de uma página única guiada por scroll (storytelling). O usuário navegará pelas informações simplesmente rolando a tela para baixo, ativando animações dinâmicas e transições fluidas que mudam o contexto apresentado.

### Seção 1: Tela de Apresentação (Hero Section)
- **Visual:** Interface com forte apelo visual, focada em gerar curiosidade.
- **Conteúdo:** Apresentação do projeto **Skyflora** (logo, objetivo principal).
- **Ação:** O usuário é convidado a "scrollar" para baixo para acessar a primeira apresentação de dados.

### Seção 2: Página de Dados Climáticos
- **Foco:** Dados meteorológicos e ambientais agregados.
- **Apresentação:**
  - Visão similar à página de políticos, mostrando a quantidade de poluentes classificados por tipo a nível de estado.
  - **Mapa de Calor (Heatmap):** Visualização térmica do Brasil baseada na variação climática (ex: calor por estado).
  - **Ranking de Insalubridade:** Listagem destacando os piores estados, calculada pela junção dos fatores totais (índice de insalubridade).

### Seção 3: Página de Propostas Ambientais (Política)
- **Foco:** Dados de atividades e proposições parlamentares relacionadas ao meio ambiente.
- **Apresentação:**
  - Visualização da quantidade de propostas discutidas por estado, classificadas pelo seu impacto (benéficas ou maléficas ao meio ambiente).
  - **Representação no Mapa:** O mapa do Brasil, dividido por estados, exibe cores específicas e um número indicativo das propostas.
  - **Apoio Tabular:** Uma tabela agrupada por estado. Se o usuário quiser "saber mais", ele pode clicar e consultar os dados detalhados na "tabela geralzona".

### Seção 4: Página de Emissão de CO2
- **Foco:** Dados de emissões de CO2 em perspectiva anual.
- **Apresentação:**
  - Diferente das demais seções, a análise temporal desta aba ocorre **por ano** (não por mês).
  - A visualização é operada estritamente em **nível estadual**, desabilitando o comportamento de detalhamento por municípios.
  - Exibe a média de emissões e evidencia os principais poluidores por estado, fechando o storytelling ao ligar consequências (clima), ações (política) e causadores (emissores de CO2).

---

## Arquitetura de Consumo de Dados (Integração Front/BFF)

Para auxiliar no futuro plano de construção e otimizar a performance, a lógica de consumo de dados (Databricks) seguirá o seguinte fluxo:

1. **Carga Inicial (Nível Estadual):** Para cada página do scroll, haverá uma query específica que consultará tabelas do banco com dados já previamente "mastigados". Esses dados chegarão ao front-end já resumidos e ordenados por estado. Isso garante rapidez ao montar o mapa interativo e a tabela nacional geral.
2. **Carregamento sob Demanda (Nível Municipal):** Para poupar recursos, os dados granulares não são trazidos na carga inicial. Somente quando o usuário solicitar os "dados completos" de um estado específico, o sistema fará uma **nova query** em uma tabela diferente, buscando apenas as informações detalhadas dos municípios daquele respectivo estado e mês.

---

## Requisitos Técnicos e Visuais
- **Stack Tecnológico:** Next.js (abrigando tanto as rotas de API do BFF quanto os componentes React do Front-end).
- **Estética:** Design moderno, focado na interatividade. As transições de tela via scroll devem ser suaves (ex: usando bibliotecas como Framer Motion ou GSAP).
- **Responsividade:** O sistema deve adaptar a experiência do mapa interativo e das tabelas para diferentes tamanhos de tela (desktop e mobile).
