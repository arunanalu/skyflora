# Plano Técnico: Ingestão e Processamento de Dados Satelitais e Ambientais no Databricks

Este documento detalha o plano de desenvolvimento em Python para a criação de uma arquitetura de extração, ingestão (histórica e diária) e modelagem de dados do Brazil Data Cube e do satélite GOES. O objetivo final é criar uma tabela consolidada cruzando localidades, datas e índices vitais (calor, desmatamento, umidade, temperatura e poluição) no Databricks.

---

## 1. Visão Arquitetural

* **Linguagem Principal:** Python 3.9+ (Substituindo qualquer script original de R por `geopandas` e `pyspark`).
* **Fontes (Sources):** 
    * INPE / Brazil Data Cube (APIs STAC e WTSS).
    * Malha Geográfica (IBGE) via pacote `geobr`.
    * Bancos de dados externos/API de Emissões de Carbono e Poluição.
* **Processamento:** Apache Spark (PySpark) dentro do ambiente Databricks.
* **Armazenamento:** Delta Lake (padrão Medallion: Bronze -> Silver -> Gold).

---

## 2. Fases de Desenvolvimento

### Fase 1: Preparação Geoespacial e Ambiente (Setup)
*Objetivo: Estabelecer as coordenadas espaciais que servirão de âncora para todas as buscas de dados. A saída desta fase é o input rigoroso da Fase 2.*

* **Passo 1.1 - Malha Municipal:** Criar um script Python utilizando a biblioteca `geobr` para baixar um DataFrame contendo todos os municípios do Brasil, seus códigos IBGE, Estados e a Geometria (polígonos).
* **Passo 1.2 - Cálculo de Centroides/Bounding Boxes:** Com o `geopandas`, converter o CRS para EPSG:4326 e extrair:
    * **Centroides (`centroid_lat`, `centroid_lon`)**: Âncoras para as chamadas da API WTSS (Módulo A).
    * **Bounding Boxes (`bbox_west`, `bbox_south`, `bbox_east`, `bbox_north`)**: Caixas delimitadoras para as chamadas do STAC (Módulos B e C).
* **Passo 1.3 - Contrato de Dados (Output):** Exportar este DataFrame padronizado como o arquivo `dim_localidade.parquet`. Este arquivo será a fronteira rígida e o input oficial para que a Fase 2 saiba exatamente as coordenadas de cada município (`cod_ibge`) sem precisar recalcular nenhuma geometria.

### Fase 2: Desenvolvimento dos Extratores (Ingestion Engine)
*Objetivo: Construir módulos Python orientados a objetos ou funções estruturadas para consumir os dados, lendo as coordenadas geradas pela Fase 1.*

* **Input da Fase 2:** O processo começa lendo o arquivo `dim_localidade.parquet` e iterando sobre os municípios.

* **Módulo A: Vegetação e Desmatamento (NDVI)**
    * **Ferramenta:** `wtss` (Séries Temporais) e `pystac-client`.
    * **Lógica:** Implementar chamadas à API WTSS passando as coordenadas dos municípios para buscar o índice `NDVI` (Sentinel-2 ou CBERS-4). 
    * **Tratamento:** Usar interpolação (`pandas.interpolate()`, como exemplificado no repositório) para preencher falhas causadas por nuvens nas séries temporais.
* **Módulo B: Temperatura e Focos de Calor**
    * **Ferramenta:** `pystac-client` + Satélite GOES-16.
    * **Lógica:** Procurar imagens da banda infravermelha. Adotar as funções de processamento (ex: detecção de fogo) adaptadas para Python/PySpark, aplicando o limiar (*threshold*) térmico para quantificar o número de **Focos de Calor** diários por Bounding Box municipal.
    * Integrar com os produtos de temperatura pronta (como SAMeT) para inferir a temperatura média diária.
* **Módulo C: Umidade do Ar**
    * **Lógica:** Assim como o calor, utilizar as bandas de Vapor D'água do satélite GOES via STAC para extrair a matriz da área municipal, calculando a média para gerar o índice representativo de umidade atmosférica.

### Fase 3: Orquestração de Ingestão no Databricks (Bronze / Raw)
*Objetivo: Executar os módulos gerados da Fase 2 de forma escalável dentro da nuvem.*

* **Carga Histórica (Backfill):** Construir um Databricks Notebook iterando (através de PySpark UDFs ou computação distribuída) pelos últimos 5-10 anos de dados. Como os dados são massivos, dividir por Estado ou por blocos temporais (ex: ano a ano). Salvar os DataFrames "crus" em formato Parquet/Delta Lake.
* **Carga Incremental (Diária):** Criar um Databricks Workflow agendado (*Job cron*). O job executa verificando as datas (`D-1` ou `D-2`), invoca o catálogo STAC, baixa e extrai os metadados do dia, anexando os resultados diários às tabelas da camada Bronze.

### Fase 4: Limpeza, Harmonização e Cruzamento (Silver -> Gold)
*Objetivo: Cruzar todas as fontes em uma tabela analítica, limpa e padronizada.*

* **Passo 4.1 - Camada Silver (Enriquecimento Ambiental):** Agrupar e limpar os dados lidos dos extratores. Uniformizar as colunas de "Data" para o formato `YYYY-MM-DD`. Garantir que todas as medidas têm o `cod_ibge` do município correspondente.
* **Passo 4.2 - Ingestão de Dados Externos de Poluição/Carbono:** Desenvolver pipelines de carga simples para puxar as tabelas de emissões (arquivos CSV, chamadas de API de terceiros ou relatórios estaduais), e armazená-los na camada Silver.
* **Passo 4.3 - Modelagem Relacional / Join Final (Camada Gold):**
    * Escrever uma query em **PySpark SQL** cruzando os dados ambientais com os de carbono usando as seguintes chaves de junção compostas: `Localidade (cod_ibge)` + `Data`.
    * Lidar com granularidades diferentes (ex: caso os dados de carbono sejam mensais e os de satélite diários, deve-se gerar agregações mensais via `.groupBy()` ou `.window()`).

### Fase 5: Validação e Estrutura Final da Tabela Ouro
O pipeline resultará na tabela de negócio unificada para Business Intelligence e Data Science.

**Esquema Proposto para a Delta Table Consolidada (`gold_monitoramento_ambiental`):**
| Coluna | Tipo | Descrição | Fonte |
| :--- | :--- | :--- | :--- |
| `data_referencia` | DATE | Data exata ou o 1º dia do mês (se agregado) | Chave |
| `cod_ibge` | INT | Código IBGE (7 dígitos) | Chave |
| `estado_uf` | STRING | Sigla do Estado (Ex: SP, AM) | Dimensão |
| `municipio_nome` | STRING | Nome do Município | Dimensão |
| `indice_vegetacao_ndvi` | FLOAT | Média do vigor vegetativo do município | WTSS / Sentinel |
| `delta_desmatamento` | FLOAT | Estimativa de perda na série temporal de NDVI | WTSS / Sentinel |
| `contagem_focos_calor` | INT | Soma de anomalias térmicas (fogo) registradas no dia/mês | STAC / GOES |
| `temperatura_superficie` | FLOAT | Temperatura média consolidada | STAC / SAMeT |
| `umidade_atmosferica` | FLOAT | Média derivada do vapor d'água no período | STAC / GOES |
| `emissoes_carbono_ton` | FLOAT | Volume estimado de carbono emitido/medido | Fonte Externa |
| `pm25_poluicao` | FLOAT | Concentração de material particulado | Fonte Externa |

**Otimização no Databricks:**
* Ao criar a tabela final, usar o comando de otimização estrutural do Delta Lake:
  `OPTIMIZE gold_monitoramento_ambiental ZORDER BY (estado_uf, data_referencia)`
  Isso acelerará consideravelmente as pesquisas e a carga em dashboards posteriores.

---

## 3. Contexto do Projeto e Decisões Tomadas (Memória da Sessão)

> **Nota para futuras LLMs:** Esta seção serve como "memória" do que foi descoberto, discutido e decidido durante a sessão de planejamento original. Leia isto antes de iniciar a codificação para entender o "porquê" das coisas.

### 3.1 Origem e Objetivo
O usuário solicitou a análise do repositório `brazil-data-cube/code-gallery` para entender como extrair dados de satélite e sensoriamento remoto (calor, vegetação, temperatura, umidade). O objetivo é ingerir esses dados em uma plataforma Databricks e cruzá-los com dados externos de poluição/carbono para gerar insights analíticos.

### 3.2 Descobertas Técnicas (Pesquisa nos Notebooks Originais)
Durante o planejamento, agentes de pesquisa varreram os notebooks originais do repositório (arquivos STAC, WTSS e GOES). As principais descobertas que moldaram o plano foram:
* **APIs do Brazil Data Cube:** As APIs `STAC` e `WTSS` são públicas e não exigem token de autenticação.
* **Dados GOES-16 (Calor e Umidade):** 
  * Os dados estão em formato **NetCDF**. Para acessá-los via HTTP, é obrigatório anexar `#mode=bytes` à URL. A variável interna de dados chama-se `CMI`.
  * **Focos de Calor:** Usa-se a banda `B07` (Shortwave IR). O limiar (threshold) de detecção de fogo extraído dos scripts oficiais é de **323.15 K (50°C)**.
  * **Umidade:** Usa-se a banda `B10` (Vapor d'água na troposfera inferior) como proxy inverso (menor temperatura de brilho = maior umidade).
* **Dados SAMeT (Temperatura Média):** Usa-se a coleção `samet_daily-1` (assets `tmax` e `tmin`). Os valores já estão em graus Celsius, não precisando de conversão.
* **Dados de Vegetação (NDVI):** Usa-se a API WTSS para extrair séries temporais de `S2-16D-2`. Os dados originais vêm escalados por 10.000 (precisam ser divididos por 10000.0). É crucial aplicar máscaras de nuvem usando o asset `SCL` (mantendo apenas valores 4, 5, 6).

### 3.3 Decisões de Engenharia
* **Migração R -> Python:** Originalmente havia scripts em R no repositório, mas foi decidido unificar toda a arquitetura em Python (usando `geopandas`, `rasterio` e `PySpark`) para alinhamento com as melhores práticas do Databricks.
* **Fronteira Rígida (Fase 1 -> Fase 2):** Para garantir que futuras LLMs possam codificar as Fases 1 e 2 independentemente e de uma vez só, travou-se um "Contrato de Dados". A Fase 1 gera exclusivamente o arquivo `dim_localidade.parquet` com os `cod_ibge`, os **centroides** (para o WTSS) e as **bounding boxes** (para o STAC). A Fase 2 lê esse arquivo como input.

### 3.4 Arquivos Gerados nesta Sessão
Se você for implementar o código, **leia os seguintes arquivos** que detalham exatamente a nível de código o que deve ser feito:
1. `plan.md`: (Este arquivo) Visão arquitetural geral e resumo das fases.
2. `plan_fase1_detalhado.md`: Código detalhado para o setup geoespacial usando a biblioteca `geobr`, gerando o `dim_localidade.parquet`.
3. `plan_fase2_detalhado.md`: Mais de 800 linhas de documentação técnica profunda com os scripts e funções exatas para os extratores (NDVI, Focos de Calor, Umidade, Temperatura), contendo a tabela de constantes prontas para uso.
