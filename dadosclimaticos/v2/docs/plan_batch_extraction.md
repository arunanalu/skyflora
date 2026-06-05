# Planejamento: Extração em Lote (Batch) Nacional - Camada Bronze

## 1. Visão Geral
Este documento descreve a arquitetura e estratégia para escalar a extração de dados climáticos e ambientais de forma que abranja **todos os 5.570 municípios do Brasil** em uma única execução, cobrindo um recorte temporal de **1 mês**. 

O objetivo é evitar os limites de cota das APIs gratuitas (Rate Limits), utilizando requisições em lote (Batching), junção espacial local (Spatial Join) e algoritmos de resiliência (Exponential Backoff). Ao final da esteira, os dados deverão estar harmonizados e consolidados em um ou múltiplos arquivos `.csv` na camada Bronze.

---

## 2. Parâmetros do Processo
O orquestrador em lote (`batch_extract.py`) deverá aceitar os seguintes parâmetros via linha de comando (CLI):
* `--start-date`: Data de início da janela de extração (ex: `2026-05-04`).
* `--end-date`: Data de fim da janela de extração, totalizando no máximo ~30 dias (ex: `2026-06-04`).

**Fonte Terrestre (Setup Layer):**
O script consumirá o arquivo previamente gerado `dadosclimaticos/v2/data/dim/dim_localidade.parquet`, que já mapeia as coordenadas (`centroid_lat`, `centroid_lon`) e limites (`bbox`) de todos os municípios brasileiros.

---

## 3. Estratégia de Extração Otimizada (Batching)

Dado que a arquitetura _naive_ (município por município) geraria ~16.710 requisições (estourando o limite de 10k do Open-Meteo), a nova estratégia consolida as consultas da seguinte forma:

### A. Open-Meteo (Clima, Poluição e Vegetação)
A API do Open-Meteo aceita _arrays_ de latitudes e longitudes. 
* **Lógica:** Leremos os 5.570 municípios do `.parquet` e os dividiremos em **blocos (chunks) de 100 municípios**.
* **Chamadas HTTP:** Em vez de 5.570 chamadas para o Clima, faremos apenas **56 chamadas**. A API devolverá um JSON contendo as matrizes temporais para todos os 100 locais simultaneamente para o mês inteiro.
* **Economia:** Redução de requisições em 99%, mantendo um uso baixíssimo da cota gratuita.

### B. NASA FIRMS (Focos de Queimadas)
A NASA restringe as chamadas por área e permite apenas histórico de até 10 dias de uma vez nas chamadas _Near Real-Time_ (NRT).
* **Lógica:** Em vez de enviar _bounding boxes_ por município, utilizaremos o endpoint Nacional (`/api/country/csv/{KEY}/VIIRS_SNPP_NRT/BRA/{DIAS}`).
* **Chamadas HTTP:** O script fará a quebra do intervalo do mês (30 dias) em 3 requisições de 10 dias para o Brasil inteiro. 
* **Filtro Espacial Offline:** Os 3 CSVs de focos do Brasil inteiro serão baixados para a memória local. O cruzamento espacial (identificar qual foco caiu dentro da _bounding box_ de qual município) será feito via Pandas/Geopandas diretamente na CPU local, resultando em 0 gasto de rede extra.

---

## 4. Resiliência: Retry com Exponential Backoff

Mesmo com requisições em lote otimizadas, redes falham, conexões caem e provedores cortam o acesso em caso de picos repentinos de rede.

Todos os módulos extratores deverão ser decorados com uma estratégia de **Retry + Exponential Backoff**:
1. **Tentativa 1:** Ocorre a requisição normal.
2. **Em caso de Falha (Erro 429 Too Many Requests, 502, Timeout):** O script pausa a extração e dorme (`sleep`).
3. **Backoff:** O tempo de espera aumenta exponencialmente a cada erro seguido. Exemplo: 2s ➔ 4s ➔ 8s ➔ 16s.
4. Após o número máximo de retentativas configurado (ex: 5 vezes), se persistir o erro, o erro é registrado no log e a execução é pausada preventivamente para salvar o que já foi processado.

---

## 5. Fluxo e Pipeline de Execução (Pipeline)

1. **Validação:** Valida a entrada do mês (`start_date` e `end_date`) e se o arquivo parquet de Dimensão existe.
2. **Download Nacional (NASA):** Faz as poucas requisições necessárias à NASA FIRMS, baixa todos os focos do Brasil para o mês e agrupa em um DataFrame único (`df_fires_br`).
3. **Chunking Open-Meteo:** O script varre o parquet e começa a iterar pelas fatias de 100 municípios.
4. **Extração Open-Meteo (Clima, AQ, VPD):** Submete cada pacote de 100 coordenadas para a API. Recebe as respostas, transforma de JSON para formato Tabular (linhas).
5. **Merge Híbrido:** Cruza a tabela tabular do Clima com a filtragem matemática dos focos de fogo do `df_fires_br`.
6. **Checkpoint Progressivo:** Cada fatia processada é adicionada diretamente num arquivo CSV provisório/fragmentado, para evitar estouro de RAM e garantir salvamento em caso de parada não intencional (ex: interrupção forçada por `CTRL+C`).
7. **Consolidação Final:** Quando os 5.570 municípios estiverem finalizados, um arquivo de saída consolidado é gravado. Ex: `bronze_br_completo_20260504_20260604.csv`.

---

## 6. Checklist de Implementação
- [ ] Refatorar os módulos do `open_meteo` e `open_meteo_veg` para suportar Arrays de Lats/Lons como parâmetros de entrada.
- [ ] Refatorar o módulo `nasa_firms` para a leitura do Brasil inteiro via Endpoint Nacional por intervalos dinâmicos de até 10 dias.
- [ ] Criar/Aplicar o _Decorator_ de `Exponential Backoff` nativo nas requisições do pacote `requests`.
- [ ] Escrever o `batch_extract.py` aplicando os *chunks* (divisão em blocos) e a lógica de salvamento gradativo.
- [ ] Testar a execução extraindo 1 mês (e.g. maio a junho de 2026) monitorando os logs e o processamento de memória (RAM).
