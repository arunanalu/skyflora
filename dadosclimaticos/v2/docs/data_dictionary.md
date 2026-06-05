# Dicionário de Dados: Camada Bronze (Clima & Meio Ambiente)

Este dicionário mapeia o significado de todas as colunas que compõem os datasets de saída consolidados na camada bronze da arquitetura Skyflora, fornecendo clareza semântica para analistas e cientistas de dados.

## Metadados e Localização
| Coluna original (APIs) | Nome Consolidado | Tipo | Descrição e Interpretação |
| :--- | :--- | :--- | :--- |
| `time` | **data_medicao** | Data | A data na qual a medição ou previsão foi registrada (formato AAAA-MM-DD). |
| `municipio` | **nome_municipio** | Texto | Nome do município alvo da extração. |
| `cod_ibge` | **cod_ibge** | Numérico | Código único de 7 dígitos do município no IBGE (apenas para extrações massivas). |
| `latitude` | **latitude** | Float | Latitude central do município. |
| `longitude` | **longitude** | Float | Longitude central do município. |

## Variáveis Climáticas (Meteo)
| Coluna original | Nome Consolidado | Tipo | Descrição e Interpretação |
| :--- | :--- | :--- | :--- |
| `temperature_2m_max` | **temperatura_maxima_c** | Float | Temperatura máxima diária a 2 metros do solo (em Graus Celsius). |
| `temperature_2m_min` | **temperatura_minima_c** | Float | Temperatura mínima diária a 2 metros do solo (em Graus Celsius). |
| `temperature_2m_mean` | **temperatura_media_c** | Float | Média da temperatura durante o dia (em Graus Celsius). |
| `precipitation_sum` | **precipitacao_total_mm** | Float | Soma de todas as precipitações e chuvas no dia (em Milímetros). |

## Qualidade do Ar (Poluentes)
As variáveis a seguir medem o grau de poluição na atmosfera.
| Coluna original | Nome Consolidado | Tipo | Descrição e Interpretação |
| :--- | :--- | :--- | :--- |
| `pm10` | **poluicao_particulas_inalaveis** | Float | Concentração de Partículas Inaláveis - PM10 (em μg/m³). Partículas relativamente grossas, como poeira de vias e construção civil. |
| `pm2_5` | **poluicao_particulas_finas** | Float | Concentração de Partículas Finas - PM2.5 (em μg/m³). Partículas microscópicas emitidas principalmente por queimadas, veículos e fábricas. Penetra fundo nos pulmões. |
| `carbon_monoxide` | **poluicao_monoxido_carbono** | Float | Concentração de Monóxido de Carbono (em μg/m³). Gás tóxico liberado na queima incompleta (ex: incêndios florestais e escapamentos). |

## Estresse Vegetal e Risco Hídrico
Variáveis que medem o quanto a vegetação daquele município está perdendo água e seu risco de entrar em estresse profundo (secas intensas).
| Coluna original | Nome Consolidado | Tipo | Descrição e Interpretação |
| :--- | :--- | :--- | :--- |
| `et0_fao_evapotranspiration` | **perda_agua_solo_vegetacao** | Float | Evapotranspiração de referência (em Milímetros). Mede o volume de água perdido do solo e da transpiração da cobertura vegetal. |
| `vapour_pressure_deficit_max` | **estresse_hidrico_vegetacao** | Float | Máximo Déficit de Pressão de Vapor (em kPa). Mede "quão seco" está o ar. Quanto maior este valor, mais os poros (estômatos) das plantas se fecham para evitar perda de água, entrando em forte estresse hídrico. |
| `ndvi_mean` | **indice_cobertura_vegetal** | Float | Índice de Vigor da Cobertura Vegetal. Mede a densidade e o vigor da folhagem, sendo crucial para acompanhar a degradação, secas e desmatamento ao longo dos dias. |
| `cloud_cover_percent` | **percentual_nuvens** | Float | Percentual de nuvens presentes na região no dia da medição. Dias com 100% de cobertura de nuvens geralmente inviabilizam a captação óptica da vegetação pelo satélite, gerando valores nulos para o índice vegetal. |

## Ocorrência de Fogo
| Coluna original | Nome Consolidado | Tipo | Descrição e Interpretação |
| :--- | :--- | :--- | :--- |
| `focos_queimadas_reais` | **focos_queimadas_nasa** | Inteiro | Número de focos ativos de calor (incêndios) detectados por satélites no perímetro geográfico (Bounding Box) do município durante as 24 horas. Se a API falhar ou não estiver configurada, o valor será nulo (Vazio/NaN). |
