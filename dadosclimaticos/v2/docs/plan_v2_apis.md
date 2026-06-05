# Planejamento Arquitetural: Módulo de Dados Climáticos (V2)

## 1. Visão Geral do Projeto
O módulo **Dados Climáticos** do projeto Skyflora é uma arquitetura de engenharia de dados focada em extrair, transformar e consolidar séries temporais de indicadores ambientais — como temperatura, umidade, poluição, focos de queimadas e índices de vegetação (NDVI) — cruzando-os com a malha municipal do Brasil. 

O objetivo principal é criar um pipeline de ingestão limpo, rápido e escalável que alimentará as bases analíticas. Para facilitar testes locais, a pipeline consolida os dados extraídos em arquivos `.csv`.

---

## 2. Estratégia de Extração de Dados (APIs Públicas)
A abordagem de aquisição de dados é baseada 100% no consumo de APIs públicas estruturadas (REST/JSON/CSV), evitando o tráfego e processamento custoso de imagens de satélite brutas. As fontes selecionadas são:

### A. Temperatura e Umidade (Clima Diário)
* **API Selecionada:** **Open-Meteo API** (Histórico ERA5).
* **Vantagens:** Fornece as variáveis meteorológicas de modelos europeus consolidados (ECMWF) de forma gratuita, veloz e sem necessidade de tokens de autenticação.
* **Métricas Extraídas:** `temperature_2m_max`, `temperature_2m_min`, `temperature_2m_mean`, `relative_humidity_2m_mean`, `precipitation_sum`.
* **Retorno:** JSON.

### B. Poluição do Ar (Qualidade do Ar)
* **API Selecionada:** **Open-Meteo Air Quality API**.
* **Vantagens:** Acesso gratuito e direto a índices de qualidade do ar e concentrações de particulados na mesma coordenada usada para o clima.
* **Métricas Extraídas:** `pm10`, `pm2_5` (Material Particulado), `carbon_monoxide`.
* **Retorno:** JSON.

### C. Queimadas e Focos de Calor
* **API Selecionada:** **NASA FIRMS (Fire Information for Resource Management System)**.
* **Vantagens:** Fornece dados reais e em tempo real sobre focos ativos baseados em satélites (VIIRS, MODIS). Requer uma `MAP_KEY` gratuita que pode ser providenciada facilmente e inserida via variável de ambiente. A pipeline contém fallback robusto para contornar instabilidades.
* **Métricas Extraídas:** Quantidade de focos de incêndio ativos por bounding box na coordenada especificada.
* **Retorno:** CSV / JSON.

### D. Saúde da Vegetação e Estresse Hídrico
* **API Selecionada:** **Open-Meteo API (Variáveis Ambientais Terrestres)**.
* **Vantagens:** APIs gratuitas do INPE (como WTSS) geralmente oscilam ou requerem tokens do Brazil Data Cube. A Open-Meteo provê variáveis confiáveis como Evapotranspiração e Déficit de Pressão de Vapor (VPD) globais, excelentes indicativos de estresse na vegetação e ressecamento.
* **Métricas Extraídas:** `et0_fao_evapotranspiration`, `vapour_pressure_deficit_max`.
* **Retorno:** JSON.

---

## 3. Ciclo de Vida e Arquitetura de Dados

1. **Camada Setup (Dimensão Espacial):** 
   * A execução inicia gerando as coordenadas (latitude, longitude) do município alvo via `geopy` (Nominatim).

2. **Camada Bronze (Raw -> CSV):** 
   * Motores de extração iteram sobre o município e data especificados, realizando requisições HTTP para as APIs selecionadas.
   * Os dados obtidos são relacionados e consolidados em arquivos `.csv` na pasta `data/bronze/` para fácil leitura e execução local.

---

## 4. Estrutura de Diretórios do Código
O repositório V2 possui a seguinte estrutura:

```text
dadosclimaticos/v2/
├── docs/
│   └── plan_v2_apis.md          # Este plano mestre de arquitetura
├── src/
│   ├── extractors/              # Conectores de APIs
│   │   ├── open_meteo.py
│   │   ├── open_meteo_aq.py
│   │   ├── nasa_firms.py
│   │   └── open_meteo_veg.py
│   ├── setup/                   # Configuração de geolocalização
│   │   └── geo_setup.py
│   ├── core/                    # Configurações gerais (URLs, caminhos)
│   │   └── config.py
│   └── main.py                  # Orquestrador da execução local
└── data/                        
    ├── dim/                     
    └── bronze/                  # Arquivos .csv consolidados
```

## 5. Próximos Passos
1. **Configuração Opcional:** Definir a variável de ambiente `FIRMS_API_KEY` com a chave do NASA FIRMS.
2. **Execução Local:** Rodar `python src/main.py --municipio "Nome" --data "YYYY-MM-DD"` para gerar os dados na camada Bronze (CSV).
