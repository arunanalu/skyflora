# Planejamento: Extração de Dados de Cobertura Vegetal (NDVI)

## 1. Visão Geral
Este documento descreve o planejamento para adicionar o indicador de **Cobertura Vegetal** à arquitetura do Skyflora (V2). O objetivo é coletar dados que permitam a comparação temporal (dia a dia ou semana a semana) para identificar aumento ou diminuição da cobertura vegetal nos municípios brasileiros. Essa métrica é crucial para inferir impactos diretos de **desmatamento e queimadas**.

O indicador padrão adotado para esta finalidade é o **NDVI (Normalized Difference Vegetation Index)** ou o **LAI (Leaf Area Index)**, que medem o "vigor" e a densidade da vegetação verde.

---

## 2. Seleção da Fonte de Dados (API)

Diferente do Clima (Open-Meteo), APIs REST simples para NDVI diário são escassas e frequentemente exigem o consumo direto de serviços de satélite. A estratégia de adoção seguirá a seguinte prioridade de fontes públicas gratuitas:

1. **Copernicus Data Space Ecosystem (CDSE) / Sentinel Hub API:**
   * **Satelite:** Sentinel-2 (Alta resolução, revisitas a cada 5 dias).
   * **Vantagem:** Acesso moderno via REST API (OData/WCS) com suporte a agregação espacial.
   * **Métrica:** NDVI ou True Color/FAPAR.
   
2. **NASA AppEEARS API (Earthdata):**
   * **Satelite:** MODIS / VIIRS.
   * **Vantagem:** Possui recortes temporais e espaciais via API, entregando séries temporais de NDVI (geralmente em compostos de 8 ou 16 dias).

3. **INPE TerraBrasilis (WFS API):**
   * **Foco:** Caso a necessidade mude de "índice contínuo" para "alertas", a API WFS do DETER fornece polígonos de degradação diária.

---

## 3. Viabilidade e Estratégia de Extração em Lote (Nacional)

Extrair a média de cobertura vegetal para **5.570 municípios** durante **30 dias** impõe desafios severos de Rate Limit e processamento geoespacial. 

### A. Estratégia de Agrupamento (Chunking e Bounding Box)
Diferente das APIs de clima que aceitam arrays de coordenadas pontuais, APIs de satélite calculam a vegetação baseada em áreas (Polígonos ou Bounding Boxes - BBOX).
* **Solução:** Utilizaremos o arquivo `dim_localidade.parquet` que já contém a `bbox` de cada município.
* **Batching:** As requisições serão enviadas em blocos. A API será consultada iterando sobre grupos de municípios (ex: 50 a 100 por vez, dependendo do limite de requisição simultânea da API de satélite).
* **Agregação:** A API deverá retornar a **média do NDVI** dentro daquela BBOX para o dia consultado, convertendo um dado matricial (raster) em um dado tabular/numérico para nosso CSV.

### B. Janela Temporal
Como satélites ópticos (Sentinel/MODIS) sofrem interferência de nuvens, o dado "diário" contínuo é impossível na Amazônia, por exemplo. A extração puxará a janela de 30 dias, mas os dados úteis estarão presentes nos dias de "passagem do satélite" sem nuvens. O processo tabulará esses valores e os dias sem dado receberão preenchimento nulo (NaN) ou interpolação na camada analítica (Silver).

---

## 4. Resiliência de Rede: Retry e Exponential Backoff

Consumir APIs de satélite para o Brasil inteiro em uma tacada gerará invariavelmente bloqueios temporários (HTTP 429 Too Many Requests) ou falhas de Gateway (HTTP 502/504).

* **Retry com Exponential Backoff:** Será implementado um *decorator* ou *adapter* nas requisições HTTP (ex: pacote `requests` ou `httpx`).
  1. Se a API responder `429`, o sistema lerá o *header* `Retry-After` (se existir) ou aplicará um recuo exponencial padrão (ex: pausa de 2s, 4s, 8s, 16s, 32s).
  2. Número máximo de retentativas: 5.
  3. Falha persistente: O processo salva o progresso (checkpoint do lote no CSV parcial), gera um erro de log e encerra de forma controlada, permitindo continuação posterior sem recomeçar do zero.

---

## 5. Integração com a Camada Bronze

1. **Novo Extrator:** Criação de `src/extractors/satellite_ndvi.py`.
2. **Inputs:** `start_date`, `end_date`, lista de Bounding Boxes.
3. **Outputs (Bronze):** A pipeline unificará a resposta da API em colunas no arquivo `.csv` final, adicionando as colunas `ndvi_mean` e `cloud_cover_percent` ao lado dos dados do Open-Meteo e da NASA FIRMS.
4. **Armazenamento:** O processamento em lote alimentará os arquivos fragmentados progressivamente, com posterior concatenação.

---

## 6. Checklist de Implementação
- [ ] Definir a conta/autenticação necessária para a API escolhida (ex: Token do Copernicus Data Space).
- [ ] Desenvolver `satellite_ndvi.py` com a lógica de requisição REST da área de interesse.
- [ ] Aplicar o *decorator* de Resiliência (Exponential Backoff).
- [ ] Integrar a chamada do novo módulo ao orquestrador `batch_extract.py`.
- [ ] Validar a coerência dos dados comparando duas datas distintas para um município afetado por queimadas recentes (ex: Pantanal ou Amazônia).
