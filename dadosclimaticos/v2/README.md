# Skyflora: Dados Climáticos (V2)

Bem-vindo ao módulo de extração de dados climáticos e ambientais **Skyflora (V2)**. Este projeto é uma arquitetura de engenharia de dados robusta focada em consumir, transformar e harmonizar dados provenientes de satélites e modelos europeus/americanos, cruzando essas informações com a malha municipal do Brasil.

O pipeline atual implementa a **Camada Bronze (Raw/Ingestion)** da arquitetura Medallion.

---

## 🎯 Objetivo
Buscar diariamente (ou em grandes blocos históricos) informações essenciais de clima, poluentes, cobertura vegetal e eventos de fogo para fornecer inteligência de dados na detecção de anomalias ambientais nos municípios brasileiros.

---

## 📡 Fontes de Dados (APIs)
Em vez de lidar com gigabytes de imagens brutas de satélite, este sistema foi otimizado para extrair inteligência puramente via APIs (REST/JSON):

1. **Clima (Temperatura, Umidade, Precipitação):** 
   - *Fonte:* Open-Meteo (Histórico ERA5 ECMWF).
2. **Qualidade do Ar (Poluição):**
   - *Fonte:* Open-Meteo Air Quality (PM10, PM2.5, CO).
3. **Saúde da Vegetação (Estresse Hídrico):**
   - *Fonte:* Open-Meteo Terrestrial (Evapotranspiração e VPD).
4. **Queimadas (Focos Ativos de Calor):**
   - *Fonte:* NASA FIRMS (Satélites VIIRS/SNPP). Necessita de uma `MAP_KEY` gratuita.

---

## 🚀 Como Funciona

O projeto possui dois orquestradores de extração:

### 1. Extração Pontual (`main.py`)
Voltado para pesquisa ou análise rápida. Puxa os dados consolidados de **1 município em 1 data específica**, localizando as coordenadas automaticamente usando o _Nominatim_ (Geopy).

**Uso:**
```bash
# Exporte sua chave da NASA (opcional, possui fallback)
$env:FIRMS_API_KEY="SUA_MAP_KEY"

# Execute a extração
python src/main.py --municipio "Petrópolis" --data "2023-08-01"
```
*Saída:* `data/bronze/bronze_petrópolis_2023-08-01.csv`

### 2. Extração Massiva / Nacional (`batch_extract.py` - Em planejamento)
Orquestrador de Big Data desenhado para superar _Rate Limits_. Em vez de varrer um município por vez, ele usa a base estática do IBGE (`dim_localidade.parquet`) para agrupar as coordenadas em lotes de 100, puxando blocos de **30 dias de uma vez** para os 5.570 municípios do Brasil utilizando resiliência de rede (_Exponential Backoff_).

---

## 📁 Estrutura de Diretórios
```text
dadosclimaticos/v2/
├── docs/                        # Documentações de arquitetura e planos de desenvolvimento
├── src/
│   ├── extractors/              # Conectores individuais de APIs (NASA e Open-Meteo)
│   ├── setup/                   # Lógicas espaciais (Ex: Geolocalização de Cidades)
│   ├── core/                    # Configurações dinâmicas de diretório
│   └── main.py                  # Orquestrador Pontual (Single Municipality)
├── data/                        
│   ├── dim/                     # Tabela dimensional do IBGE (Malha geográfica, Parquet)
│   └── bronze/                  # Onde os arquivos brutos (.CSV) são guardados após o merge
├── README.md                    # Este arquivo
└── requirements.txt             # Dependências (pandas, requests, geopy)
```

## 🛠️ Configuração e Instalação

1. Garanta que você tenha o Python 3.9+ instalado (Neste projeto foi testado com `3.10.11`).
2. Instale as dependências contidas no requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Obtenha a sua [MAP_KEY do NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/map_key/) (Gratuito e instantâneo).
