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
| `pm10` | **poluicao_particulas_inalaveis** | Float | **O que é:** Concentração de Partículas Inaláveis grossas - PM10 (em **Microgramas por metro cúbico - μg/m³**). São partículas de até 10 micrômetros, geradas por poeira, pólen e atividades de construção.<br>**Como ler os dados:**<br>- **`0 a 20 μg/m³`:** Qualidade Boa (Ar limpo e seguro).<br>- **`20 a 50 μg/m³`:** Qualidade Moderada.<br>- **`Acima de 50 μg/m³`:** Ar de Qualidade Ruim (Viola as diretrizes da OMS), causando irritação respiratória, muito comum em secas prolongadas. |
| `pm2_5` | **poluicao_particulas_finas** | Float | **O que é:** Concentração de Partículas Finas - PM2.5 (em **Microgramas por metro cúbico - μg/m³**). São partículas microscópicas (2.5 micrômetros) altamente tóxicas, emitidas por **queimadas**, motores e fábricas. Penetram fundo nos pulmões e entram na corrente sanguínea.<br>**Como ler os dados:**<br>- **`0 a 15 μg/m³`:** Nível Saudável (Diretriz OMS).<br>- **`15 a 35 μg/m³`:** Ar Moderadamente Poluído.<br>- **`Acima de 35 μg/m³`:** Ar Muito Prejudicial à saúde. Na ocorrência de focos de incêndio próximos, os valores costumam disparar exponencialmente para além de `100 μg/m³`, indicando uma densa nuvem de fumaça. |
| `carbon_monoxide` | **poluicao_monoxido_carbono** | Float | **O que é:** Concentração de Monóxido de Carbono (em **Microgramas por metro cúbico - μg/m³**). Gás tóxico liberado massivamente na queima incompleta (como incêndios florestais e queima de combustíveis).<br>**Como ler os dados:**<br>- **`Até ~4.000 μg/m³`:** Níveis normais da atmosfera sem poluição excessiva.<br>- **`Acima de 10.000 μg/m³`:** Níveis altamente perigosos, o que seria um indicador fortíssimo de que um foco de incêndio intenso está ocorrendo nas proximidades imediatas, ou a cidade está sob severa inversão térmica no inverno com muita queima de combustíveis fósseis. |

## Estresse Vegetal e Risco Hídrico
Variáveis que medem o quanto a vegetação daquele município está perdendo água e seu risco de entrar em estresse profundo (secas intensas).
| Coluna original | Nome Consolidado | Tipo | Descrição e Interpretação |
| :--- | :--- | :--- | :--- |
| `et0_fao_evapotranspiration` | **perda_agua_solo_vegetacao** | Float | **O que é:** Evapotranspiração de referência (em **Milímetros por dia - mm/dia**). Mede o volume de água perdido por evaporação do solo e transpiração das plantas.<br>**Como ler os dados:** Um valor de `5.0 mm` indica que a atmosfera está demandando muita água (dia quente/ensolarado), secando a região rapidamente. Valores baixos como `1.0 mm` indicam pouca perda de água (dias nublados, frios ou úmidos). |
| `vapour_pressure_deficit_max` | **estresse_hidrico_vegetacao** | Float | **O que é:** Máximo Déficit de Pressão de Vapor (em **Kilopascals - kPa**). Representa o "poder secante" do ar (a diferença entre a umidade máxima que o ar pode reter e o que ele tem agora).<br>**Como ler os dados:** <br>- **`~0.5 kPa`:** Baixo estresse (ar úmido e confortável para a planta).<br>- **`0.86 kPa`:** Nível moderado e comum durante a tarde.<br>- **`1.07 kPa a 1.5+ kPa`:** Alto estresse hídrico. O ar está tão seco que "suga" a água das plantas. Para não secarem, elas fecham seus estômatos e param de crescer/fotossintetizar. Valores consistentemente altos apontam risco severo de seca e propagação de incêndios. |
| `ndvi_mean` | **indice_cobertura_vegetal** | Float | **O que é:** NDVI (*Normalized Difference Vegetation Index*). É um valor adimensional que varia de **-1.0 a 1.0**.<br>**Como ler os dados:** <br>- **`0.7 a 1.0`:** Vegetação extremamente densa, saudável e verde (Florestas robustas, matas fechadas).<br>- **`0.4 a 0.6`:** Vegetação moderada (arbustos, pastos, agricultura).<br>- **`0.1 a 0.3`:** Vegetação muito rala, solo exposto, áreas recém-desmatadas ou em forte seca.<br>- **`Abaixo de 0.1`:** Cidades, solo nu, pedras, ou água.<br>**Por que varia em poucos dias?** Se uma cidade for de 0.65 para 0.43 em 3 dias, a floresta não sumiu e voltou. Essa variação de curto prazo ocorre devido a **interferências ópticas do satélite**, como: (1) Sombras de nuvens escuras passando sobre a floresta, (2) Partículas de neblina e fumaça que ofuscam a lente (dispersão atmosférica), ou (3) Alteração rápida na umidade das folhas pós-chuva, que altera a forma como refletem a luz infravermelha. A degradação real (desmatamento) é vista por uma queda brusca (`0.7` para `0.2`) que **se mantém** nas semanas seguintes. |
| `cloud_cover_percent` | **percentual_nuvens** | Float | Percentual de nuvens presentes na região no dia da medição. Dias com alta cobertura de nuvens geralmente inviabilizam a captação óptica da vegetação pelo satélite, gerando valores nulos para o índice vegetal. |

## Ocorrência de Fogo
| Coluna original | Nome Consolidado | Tipo | Descrição e Interpretação |
| :--- | :--- | :--- | :--- |
| `focos_queimadas_reais` | **focos_queimadas_nasa** | Inteiro | Número de focos ativos de calor (incêndios) detectados por satélites no perímetro geográfico (Bounding Box) do município durante as 24 horas. Se a API falhar ou não estiver configurada, o valor será nulo (Vazio/NaN). |
