# Skyflora

Skyflora é um projeto de engenharia de dados focado na extração, ingestão e modelagem de dados de sensoriamento remoto e indicadores ambientais para a criação de uma base analítica consolidada. O objetivo do projeto é utilizar dados do **Brazil Data Cube** (APIs STAC e WTSS) e do satélite **GOES** para monitorar índices vitais como calor, desmatamento, umidade, temperatura e poluição, cruzando-os de forma inteligente com a malha municipal do Brasil.

## Visão Geral da Arquitetura

O projeto é desenvolvido em **Python 3.9+**, utilizando bibliotecas geoespaciais (`geopandas`, `rasterio`) e focado no processamento distribuído com **Apache Spark (PySpark)** dentro do ambiente **Databricks**. O armazenamento segue o padrão **Medallion** (Bronze -> Silver -> Gold) no Delta Lake.

O ciclo de vida dos dados está estruturado nas seguintes fases:

1. **Fase 1: Preparação Geoespacial (Setup):** Extração das malhas municipais brasileiras (via `geobr`), calculando centroides e caixas delimitadoras (bounding boxes). Isso gera a fronteira geográfica rígida (`dim_localidade.parquet`) que âncora a busca das imagens de satélite.
2. **Fase 2: Motores de Ingestão (Extratores):** Módulos construídos para consumir as APIs do INPE iterando sobre as coordenadas geradas na Fase 1:
   - **Vegetação (NDVI):** Consumo da API WTSS para capturar séries temporais.
   - **Calor e Temperatura:** Consumo do catálogo STAC (GOES-16 e SAMeT) para detecção de anomalias térmicas e temperatura média de superfície.
   - **Umidade:** Análise da banda de vapor d'água do GOES-16 via STAC.
3. **Fase 3: Orquestração no Databricks (Camada Bronze):** Execução do pipeline em massa para carga histórica e diária dos dados.
4. **Fase 4: Harmonização (Camadas Silver e Gold):** Limpeza, padronização temporal e junção com bases de dados externas de emissões de carbono e poluição.
5. **Fase 5: Tabela Consolidada:** Geração da tabela relacional final (`gold_monitoramento_ambiental`) cruzando localidade, data e todos os indicadores para uso por equipes de Business Intelligence e Data Science.

## Estrutura do Repositório

O projeto está organizado para separar documentação, os scripts de execução e o armazenamento local de metadados:

- `docs/plan.md`: O plano de arquitetura e desenvolvimento completo, com o contexto das decisões de negócio e técnicas tomadas para o projeto. Contém as definições do esquema e tabelas finais.
- `src/pipeline/`: Código-fonte dos motores de ingestão e de execução.
- `src/pipeline/README.md`: Instruções detalhadas para rodar o pipeline em modo local (ambiente de testes restrito), útil para validar dependências e homologar dados em pequenas porções antes do envio para a nuvem.
- `data/` (se aplicável): Onde os artefatos de dados de referência (como o `dim_localidade.parquet` gerado na Fase 1) devem ser salvos.

Para a documentação completa de como a arquitetura em nuvem é estruturada e o detalhamento dos dados de entrada, consulte `docs/plan.md`. Para testar a extração localmente, consulte o README de execução local localizado dentro da pasta de código-fonte em `src/pipeline/README.md`.
