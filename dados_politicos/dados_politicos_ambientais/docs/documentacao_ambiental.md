# Documentação do Módulo Ambiental (SkyFlora Ambiental)

Este módulo automatiza a coleta de propostas legislativas de temática ambiental elaboradas por Deputados Federais na Câmara dos Deputados e cruza esses dados com o histórico de votações desses parlamentares.

---

## Estrutura da Pasta

A pasta `SkyFlora Ambiental` contém os seguintes arquivos:

* **[coleta_ambiental.py](file:///C:/Users/Victor%20Guida/Documents/Python/SkyFlora/SkyFlora%20Ambiental/coleta_ambiental.py)**: Script em Python responsável pela extração, filtragem, paralelização e processamento dos dados diretamente da API oficial de Dados Abertos da Câmara.
* **[tabela_votacoes_ambientais.csv](file:///C:/Users/Victor%20Guida/Documents/Python/SkyFlora/SkyFlora%20Ambiental/tabela_votacoes_ambientais.csv)**: Tabela consolidada contendo todos os dados ambientais e o histórico de votações mapeado.

---

## Funcionamento do Script (`coleta_ambiental.py`)

### 1. Parâmetros de Entrada e Filtros
A coleta é configurada a partir de `2024-01-01` e utiliza dois fluxos de busca na API para obter proposições:
* **Filtro por Tema**: Busca de proposições sob a classificação oficial de **Meio Ambiente e Desenvolvimento Sustentável** (`codTema=48`).
* **Busca Textual**: Consultas sequenciais via parâmetro `keywords` para 18 termos ambientais chaves:
  * *meio ambiente, ambiental, biodiversidade, Amazônia, floresta, desmatamento, mudanças climáticas, clima, sustentabilidade, licenciamento ambiental, fauna, flora, queimadas, conservação ambiental, preservação ambiental, recursos hídricos, energia renovável, resíduos sólidos.*

### 2. Otimização e Controle de Rate Limit (429)
* **Pré-filtragem por Ementa**: Para evitar chamadas de detalhamento desnecessárias em milhares de projetos do tema geral, o script realiza um casamento de padrão textual preliminar diretamente no resumo retornado pela busca inicial.
* **Multithreading**: Execução em paralelo com `ThreadPoolExecutor` (limite padrão de 10 threads) para detalhar proposições e votos em alta velocidade.
* **Mapeamento de Erros e Retries**: Implementação de *Exponential Backoff* nas requisições GET para lidar de forma transparente com as limitações de taxa (erros 429) impostas pela API.

### 3. Resolução de Autoria e Histórico de Votação
* **Cache de Parlamentares**: Identifica os autores de cada proposta e resolve suas informações de partido e UF. Caso o autor seja um deputado inativo da legislatura anterior, busca automaticamente seus dados históricos da API e armazena em cache para otimização.
* **Votações Nominais vs. Simbólicas**: Identifica as sessões de votação associadas à proposta legislativa. Se a votação for nominal, recupera o voto exato do autor (Sim, Não, Obstrução, etc.). Se for simbólica, registra como tal.

---

## Estrutura da Tabela de Saída (`tabela_votacoes_ambientais.csv`)

O arquivo CSV gerado utiliza a codificação `UTF-8 com BOM` (para compatibilidade nativa com Microsoft Excel) e contém as seguintes colunas obrigatórias:

| Campo | Descrição | Origem (API) |
| :--- | :--- | :--- |
| **Nome do Deputado** | Nome parlamentar do deputado autor da proposta. | `/proposicoes/{id}/autores` |
| **Partido** | Partido político do deputado autor. | `/deputados/{id}` / Cache |
| **UF** | Unidade Federativa de representação do deputado autor. | `/deputados/{id}` / Cache |
| **Tipo da proposição** | Sigla do tipo do documento legislativo (ex: PL, RIC, INC, PEC). | `/proposicoes/{id}` |
| **Número/Ano** | Número identificador e ano de apresentação do projeto (ex: 454/2024). | `/proposicoes/{id}` |
| **Ementa** | Resumo explicativo do teor da proposição. | `/proposicoes/{id}` |
| **Tema ambiental identificado** | Termos ambientais correspondentes localizados nos campos textuais. | Filtragem local |
| **Data de apresentação** | Data em que a proposta foi formalmente protocolada (AAAA-MM-DD). | `/proposicoes/{id}` |
| **Situação atual** | Descrição do status de tramitação ou situação do projeto. | `/proposicoes/{id}` (statusProposicao) |
| **Resultado da votação** | Descrição e resultado da votação e o ID da sessão de votação. | `/proposicoes/{id}/votacoes` |
| **Voto do deputado** | Voto registrado pelo autor da proposição na sessão em questão (Sim, Não, etc.). | `/votacoes/{id}/votos` |
| **Link oficial da proposição** | URL da ficha de tramitação oficial da Câmara dos Deputados. | Estruturação de URL fixa por ID |
| **Link do inteiro teor** | URL direta para o documento textual/PDF na íntegra. | `/proposicoes/{id}` |

---

## Como Executar o Script

Para atualizar os dados e gerar um novo CSV consolidado:

1. Certifique-se de possuir Python 3.x instalado.
2. Abra o terminal na pasta do projeto e execute:
   ```bash
   python "SkyFlora Ambiental/coleta_ambiental.py"
   ```
3. O progresso será exibido no terminal e o arquivo `tabela_votacoes_ambientais.csv` será atualizado na mesma pasta.
