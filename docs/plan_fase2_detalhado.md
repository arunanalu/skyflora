# Fase 2 — Plano de Desenvolvimento Técnico Detalhado: Extratores de Dados (Módulos A, B e C)

> **Objetivo deste documento:** Fornecer um plano de implementação em Python com nível de detalhe suficiente para que uma LLM (ou desenvolvedor) possa executá-lo e produzir código funcional de ponta a ponta.

---

## 0. Dependências e Configuração Global

### 0.1 Bibliotecas Necessárias

Todas as bibliotecas devem ser instaladas com:

```bash
pip install pystac-client==0.8.* rasterio numpy pandas geopandas shapely wtss==0.7.1 geobr netCDF4 xarray fsspec h5netcdf scipy
```

> **Nota:** Para o ambiente Databricks, as bibliotecas `netCDF4`, `rasterio` e `scipy` podem precisar de instalação via `%pip install` ou configuração no cluster. O `geobr` é usado apenas na Fase 1 (setup geoespacial).

### 0.2 Imports Globais Compartilhados

Todos os módulos compartilham os seguintes imports:

```python
import pystac_client
import rasterio
from rasterio.crs import CRS
from rasterio.warp import transform, Resampling, calculate_default_transform, reproject
from rasterio.windows import from_bounds
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import box, mapping
from datetime import datetime, timedelta
import logging
```

### 0.3 STAC Endpoint (Único para Todas as Fontes)

```python
STAC_ENDPOINT = "https://data.inpe.br/bdc/stac/v1/"
```

- **Autenticação:** Nenhuma. O endpoint do Brazil Data Cube é público e não requer token de acesso.

### 0.4 WTSS Endpoint

```python
WTSS_ENDPOINT = "https://data.inpe.br/bdc/wtss/v4/"
```

- **Autenticação:** Nenhuma para consultas pontuais (lat/lon). Para consultas com geometria (polígono), pode ser necessário um `access_token` — tratar como parâmetro opcional.

### 0.5 Funções Utilitárias Compartilhadas

#### Função `read()` — Leitura de Janela Raster por Bounding Box

Esta função é usada por todos os módulos que acessam dados via STAC (Módulos A via STAC, B e C). Ela lê uma janela de um raster remoto (COG — Cloud Optimized GeoTIFF) delimitada por um bounding box em EPSG:4326.

```python
def read(uri: str, bbox: tuple, masked: bool = True, crs: str = None) -> np.ma.MaskedArray:
    """
    Lê uma janela de um raster remoto (COG) delimitada por um bounding box.

    Parâmetros:
    -----------
    uri : str
        URL (href) do asset raster obtido via STAC (item.assets['BAND'].href).
    bbox : tuple
        Tupla (west, south, east, north) em EPSG:4326 (graus decimais).
        Exemplo: (-61.7, -9.5, -61.45, -9.25)
    masked : bool
        Se True, retorna numpy.ma.MaskedArray com nodata mascarado.
    crs : str ou None
        Se None, assume EPSG:4326. Caso contrário, string do CRS de origem.

    Retorno:
    --------
    numpy.ma.MaskedArray
        Matriz 2D com os valores do raster na janela delimitada.
    """
    source_crs = CRS.from_string("EPSG:4326")
    if crs:
        source_crs = CRS.from_string(crs)
    w, s, e, n = bbox
    with rasterio.open(uri) as dataset:
        transformer = transform(source_crs, dataset.crs, [w, e], [s, n])
        window = from_bounds(
            transformer[0][0], transformer[1][0],
            transformer[0][1], transformer[1][1],
            dataset.transform,
        )
        return dataset.read(1, window=window, masked=masked)
```

#### Função `remap()` — Reprojeção para Grade Regular (GOES)

Esta função é essencial para dados do GOES-16/19, que estão em projeção geoestacionária e precisam ser reprojetados para EPSG:4326.

```python
def remap(
    uri: str,
    bbox: tuple,
    resolution: float = 0.02,
    dst_crs: str = "EPSG:4326",
    resampling=Resampling.bilinear,
) -> np.ndarray:
    """
    Reprojeta um raster de projeção geoestacionária (GOES) para EPSG:4326.

    Parâmetros:
    -----------
    uri : str
        URL (href) do asset raster GOES obtido via STAC.
    bbox : tuple
        Tupla (west, south, east, north) em EPSG:4326.
    resolution : float
        Resolução em graus da grade de saída. Default: 0.02° (~2km).
    dst_crs : str
        CRS de destino. Default: EPSG:4326.
    resampling : rasterio.enums.Resampling
        Método de reamostragem. Default: bilinear.

    Retorno:
    --------
    numpy.ndarray
        Matriz 2D com valores reprojetados.
    """
    with rasterio.open(uri) as dataset:
        dst_transform, width, height = calculate_default_transform(
            dataset.crs, dst_crs, dataset.width, dataset.height,
            *dataset.bounds, resolution=(resolution, resolution),
        )
        destination = np.zeros((1, height, width), dtype=np.float32)
        reproject(
            source=rasterio.band(dataset, 1),
            destination=destination,
            src_transform=dataset.transform,
            src_crs=dataset.crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            resampling=resampling,
        )
    return destination[0]
```

#### Função `get_stac_client()` — Inicialização do Cliente STAC

```python
def get_stac_client() -> pystac_client.Client:
    """Retorna instância do cliente STAC do Brazil Data Cube."""
    return pystac_client.Client.open(STAC_ENDPOINT)
```

---

## Módulo A — Vegetação e Desmatamento (NDVI)

### A.1 Objetivo

Extrair séries temporais do índice NDVI (Normalized Difference Vegetation Index) para municípios brasileiros, aplicar máscara de nuvens e interpolar falhas, resultando em um DataFrame limpo por localidade e data.

### A.2 Fontes de Dados

| Fonte | Coleção STAC / Cobertura WTSS | Bandas / Atributos | Resolução Temporal | Resolução Espacial |
|---|---|---|---|---|
| Sentinel-2 (WTSS) | `S2-16D-2` | `NDVI`, `SCL` | 16 dias | 10m |
| CBERS-4 (WTSS) | `CBERS4-WFI-16D-2` | `NDVI`, `CMASK` | 16 dias | 64m |
| Sentinel-2 (STAC) | `S2-16D-2` | `NDVI`, `B04`, `B08`, `SCL` | 16 dias | 10m |

**Decisão de design:** Usar a API **WTSS** como método primário (mais simples, retorna séries temporais prontas para um ponto). Usar **STAC** como fallback ou para extração espacial (área/bounding box).

### A.3 Detalhes de Implementação — Método WTSS (Primário)

#### A.3.1 Inicialização

```python
from wtss import WTSS

wtss_service = WTSS(WTSS_ENDPOINT)
coverage = wtss_service["S2-16D-2"]
```

#### A.3.2 Parâmetros do Método `.ts()`

```python
time_series = coverage.ts(
    attributes=("NDVI", "SCL"),  # tupla de strings com nomes dos atributos
    latitude=-12.0,               # float, latitude em EPSG:4326
    longitude=-54.0,              # float, longitude em EPSG:4326
    start_date="2019-01-01",      # string no formato "YYYY-MM-DD"
    end_date="2024-12-31",        # string no formato "YYYY-MM-DD"
)
```

#### A.3.3 Estrutura do Objeto Retornado

O objeto `time_series` possui os seguintes atributos acessíveis:
- `time_series.timeline` → `list[str]` — lista de datas no formato `"YYYY-MM-DD"`.
- `time_series.NDVI` → `list[int]` — valores do NDVI (escala -10000 a 10000).
- `time_series.SCL` → `list[int]` — valores da Scene Classification Layer.
- `time_series.values("NDVI")` → acessor alternativo.

#### A.3.4 Fator de Escala do NDVI

**CRÍTICO:** O NDVI pré-computado pelo BDC é armazenado como inteiro de 16 bits na faixa **-10000 a 10000** (não -1 a 1). Após extrair os valores, normalizar com:

```python
ndvi_normalizado = np.array(time_series.NDVI) / 10000.0
```

#### A.3.5 Máscara de Nuvens — Sentinel-2 (SCL)

A banda `SCL` (Scene Classification Layer) classifica cada pixel. Valores a **manter** como observações válidas:

| Valor SCL | Significado |
|---|---|
| 4 | Vegetação |
| 5 | Não-vegetado |
| 6 | Água |

Todos os outros valores devem ser mascarados como `NaN` (nuvem, sombra, cirrus, neve, etc.).

```python
ndvi_data = np.array(time_series.NDVI, dtype=float) / 10000.0
scl_data = np.array(time_series.SCL)

# Valores válidos: vegetação (4), não-vegetado (5), água (6)
scl_valid = [4, 5, 6]
mask = np.where(np.isin(scl_data, scl_valid), 1.0, np.nan)

ndvi_masked = ndvi_data * mask
```

#### A.3.6 Máscara de Nuvens — CBERS-4 (CMASK)

Se usar a cobertura `CBERS4-WFI-16D-2`, a banda de máscara se chama `CMASK`:

| Valor CMASK | Significado |
|---|---|
| 0 | No data |
| 127 | Observação limpa (sem nuvem) |
| 255 | Nuvem |

```python
cmask_data = np.array(time_series.CMASK)
mask = np.where(cmask_data == 255, np.nan, 1.0)
ndvi_masked = ndvi_data * mask
```

#### A.3.7 Interpolação de Falhas

Após mascarar as nuvens como `NaN`, interpolar linearmente:

```python
timeline = pd.to_datetime(time_series.timeline)

df = pd.DataFrame({"ndvi": ndvi_masked}, index=timeline)
df_interpolated = df.interpolate(method="linear")

# Verificação: não deve ter NaN (exceto extremidades)
assert df_interpolated["ndvi"].isna().sum() <= 2, "Falhas não preenchidas"
```

#### A.3.8 Cálculo do Delta de Desmatamento

Para estimar perda de vegetação, comparar o NDVI médio de dois períodos equivalentes (mesmo mês, anos distintos):

```python
def calcular_delta_desmatamento(df: pd.DataFrame, ano_ref: int, ano_comp: int) -> float:
    """
    Compara NDVI médio de dois anos para o mesmo período.
    Retorna a diferença (negativo = perda de vegetação).
    """
    ndvi_ref = df[df.index.year == ano_ref]["ndvi"].mean()
    ndvi_comp = df[df.index.year == ano_comp]["ndvi"].mean()
    return ndvi_ref - ndvi_comp  # negativo = desmatamento
```

#### A.3.9 Função Completa do Módulo A

Criar a função `extrair_ndvi_municipio()` que recebe as coordenadas de um município e retorna um DataFrame pronto:

```python
def extrair_ndvi_municipio(
    latitude: float,
    longitude: float,
    cod_ibge: int,
    start_date: str,
    end_date: str,
    coverage_name: str = "S2-16D-2",
) -> pd.DataFrame:
    """
    Extrai série temporal de NDVI para um ponto (centroide de município),
    aplica máscara de nuvens e interpola falhas.

    Parâmetros:
    -----------
    latitude : float
        Latitude do centroide do município (EPSG:4326).
    longitude : float
        Longitude do centroide do município (EPSG:4326).
    cod_ibge : int
        Código IBGE do município (7 dígitos).
    start_date : str
        Data inicial no formato "YYYY-MM-DD".
    end_date : str
        Data final no formato "YYYY-MM-DD".
    coverage_name : str
        Nome da cobertura WTSS. Default: "S2-16D-2".

    Retorno:
    --------
    pd.DataFrame com colunas:
        - data_referencia (DatetimeIndex)
        - cod_ibge (int)
        - indice_vegetacao_ndvi (float, escala -1 a 1)
    """
    # 1. Conectar ao WTSS
    wtss_service = WTSS(WTSS_ENDPOINT)
    coverage = wtss_service[coverage_name]

    # 2. Determinar atributo de máscara
    mask_attr = "SCL" if "SCL" in coverage.attributes else "CMASK"

    # 3. Extrair série temporal
    ts = coverage.ts(
        attributes=("NDVI", mask_attr),
        latitude=latitude,
        longitude=longitude,
        start_date=start_date,
        end_date=end_date,
    )

    # 4. Converter para arrays numpy
    ndvi_raw = np.array(ts.NDVI, dtype=float) / 10000.0
    mask_raw = np.array(ts.values(mask_attr))

    # 5. Aplicar máscara de nuvens
    if mask_attr == "SCL":
        valid_values = [4, 5, 6]
        cloud_mask = np.where(np.isin(mask_raw, valid_values), 1.0, np.nan)
    else:  # CMASK
        cloud_mask = np.where(mask_raw == 255, np.nan, 1.0)

    ndvi_masked = ndvi_raw * cloud_mask

    # 6. Criar DataFrame e interpolar
    timeline = pd.to_datetime(ts.timeline)
    df = pd.DataFrame({"indice_vegetacao_ndvi": ndvi_masked}, index=timeline)
    df = df.interpolate(method="linear")
    df.index.name = "data_referencia"

    # 7. Adicionar código IBGE
    df["cod_ibge"] = cod_ibge

    return df.reset_index()
```

#### A.3.10 Tratamento de Erros

A função deve tratar os seguintes cenários:
- **Município fora da cobertura do satélite:** O WTSS retornará uma série vazia ou erro. Envolver em `try/except` e retornar DataFrame vazio.
- **Período sem dados:** Verificar `len(ts.timeline) > 0` antes de processar.
- **Rate limiting da API:** Implementar `time.sleep(0.5)` entre chamadas sequenciais.

---

## Módulo B — Temperatura e Focos de Calor

### B.1 Objetivo

Extrair dados diários de temperatura de superfície e quantificar focos de calor (anomalias térmicas) por município, usando dados do satélite GOES-16 e do produto MODIS LST / SAMeT.

### B.2 Fontes de Dados

| Fonte | Coleção STAC | Bandas / Assets | Resolução Temporal | Uso |
|---|---|---|---|---|
| GOES-16 | `GOES16-L2-CMI-1` | `B07` (3.9µm, fogo) | ~10 min | Focos de calor |
| GOES-16 | `GOES16-L2-CMI-1` | `B13` (10.3µm, IR limpo) | ~10 min | Temperatura de brilho |
| GOES-19 | `GOES19-L2-CMI-1` | Mesmas bandas | ~10 min | Fallback (a partir de Abr/2025) |
| MODIS LST | `mod11a2-6.1` | `LST_Day_1km`, `QC_Day` | 8 dias | Temperatura de superfície |
| SAMeT | `samet_daily-1` | `tmax`, `tmin` | Diário | Temperatura máx/mín (°C) |

> **Importante — Formato dos dados GOES:** Os dados GOES são armazenados em **NetCDF** (não GeoTIFF). O acesso remoto requer adicionar `'#mode=bytes'` à URL para leitura via `netCDF4`. A variável de pixel se chama `CMI` (Cloud and Moisture Imagery). Cada item STAC do GOES contém 16 assets (`B01`–`B16`).

**Tabela completa de bandas GOES ABI (Advanced Baseline Imager):**

| Banda | λ (µm) | Tipo | Resolução | Uso Principal |
|---|---|---|---|---|
| `B07` | 3.9 | IR (Kelvin) | 2 km | **Detecção de fogo** |
| `B08` | 6.2 | IR (Kelvin) | 2 km | Vapor d'água (troposfera superior) |
| `B09` | 7.3 | IR (Kelvin) | 2 km | Vapor d'água (troposfera média) |
| `B10` | 7.6 | IR (Kelvin) | 2 km | Vapor d'água (troposfera inferior) |
| `B13` | 10.3 | IR (Kelvin) | 2 km | **Temperatura de topo de nuvem** |
| `B14` | 11.2 | IR (Kelvin) | 2 km | Temperatura de superfície |

### B.3 Sub-módulo B1: Detecção de Focos de Calor (GOES-16 / Banda B07)

#### B.3.1 Lógica de Detecção de Fogo

A banda `B07` (Shortwave Infrared, 3.9 µm) é a mais sensível a fontes de calor de alta temperatura. Pixels com Brightness Temperature acima de um limiar são classificados como fogo.

**Limiar (threshold) de fogo: 323.15 K** (= 50°C). Este é o valor principal usado nos notebooks de queimadas do repositório. Um valor alternativo de 330 K (~57°C) também aparece em notebooks mais simples.

> **Nota sobre acesso GOES via NetCDF:** Os dados GOES são servidos em formato NetCDF. Para acessá-los remotamente, use `netCDF4.Dataset(url + '#mode=bytes')`. A variável de pixel é `CMI`. A projeção geoestacionária é armazenada em `goes_imager_projection` dentro do arquivo.

```python
from scipy import ndimage

def detect_fire(image: np.ndarray, temperature: float = 323.15, min_area: int = None) -> np.ndarray:
    """
    Detecta focos de calor baseado em limiar de Brightness Temperature.

    Parâmetros:
    -----------
    image : np.ndarray
        Matriz 2D de Brightness Temperature em Kelvin (da banda B07 do GOES).
    temperature : float
        Limiar de temperatura em Kelvin. Default: 323.15 K (50°C).
    min_area : int ou None
        Área mínima em pixels para filtrar ruído.

    Retorno:
    --------
    np.ndarray
        Matriz binária: 1 = foco de calor, 0 = normal.
    int
        Número de agrupamentos (objetos) detectados.
    """
    pixels = np.copy(image)
    pixels[pixels < temperature] = 0
    pixels[pixels >= temperature] = 1

    # Opcional: rotulagem de componentes conectados para contar focos distintos
    labeled, n_objects = ndimage.label(pixels)

    if min_area is not None:
        # Filtrar objetos menores que min_area pixels
        for i in range(1, n_objects + 1):
            if np.sum(labeled == i) < min_area:
                pixels[labeled == i] = 0

    return pixels, n_objects
```

#### B.3.2 Pipeline de Extração de Focos de Calor por Município

```python
def extrair_focos_calor_municipio(
    bbox: tuple,
    cod_ibge: int,
    start_date: str,
    end_date: str,
    fire_threshold: float = 323.15,
    collection: str = "GOES16-L2-CMI-1",
) -> pd.DataFrame:
    """
    Conta focos de calor diários dentro do bounding box de um município
    usando imagens GOES-16 Banda B07.

    Parâmetros:
    -----------
    bbox : tuple
        (west, south, east, north) em EPSG:4326 do município.
    cod_ibge : int
        Código IBGE do município.
    start_date : str
        Data inicial no formato "YYYY-MM-DD".
    end_date : str
        Data final no formato "YYYY-MM-DD".
    fire_threshold : float
        Limiar de temperatura em Kelvin. Default: 330 K.
    collection : str
        Coleção STAC do GOES. Default: "GOES16-L2-CMI-1".

    Retorno:
    --------
    pd.DataFrame com colunas:
        - data_referencia (date)
        - cod_ibge (int)
        - contagem_focos_calor (int)
    """
    client = get_stac_client()

    # 1. Buscar itens STAC
    # GOES tem resolução temporal sub-horária; agrupar por dia
    item_search = client.search(
        collections=[collection],
        bbox=bbox,
        datetime=f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
    )
    items = list(item_search.items())

    # 2. Processar cada item
    daily_fires = {}
    for item in items:
        dt_str = item.properties["datetime"]       # ISO 8601 string
        dt = pd.to_datetime(dt_str)
        day = dt.date()

        # Ler e reprojetar banda B07
        try:
            b07 = remap(item.assets["B07"].href, bbox, resolution=0.02)
        except Exception as e:
            logging.warning(f"Erro ao ler B07 para {dt_str}: {e}")
            continue

        # Detectar focos
        hot_spots, n_objects = detect_fire(b07, temperature=fire_threshold)
        count = int(np.nansum(hot_spots))

        # Acumular por dia (soma de todos os horários do dia)
        daily_fires[day] = daily_fires.get(day, 0) + count

    # 3. Montar DataFrame
    df = pd.DataFrame(
        [{"data_referencia": day, "cod_ibge": cod_ibge, "contagem_focos_calor": count}
         for day, count in daily_fires.items()]
    )
    return df
```

#### B.3.3 Nota sobre Volume de Dados GOES

O GOES-16 gera imagens a cada ~10-15 minutos. Para um dia completo, são ~96-144 itens. Para carga histórica de anos, **limitar a 1 imagem por dia** (horário fixo, ex: 18:00 UTC que corresponde ao pico de calor diurno na América do Sul):

```python
# Filtrar apenas imagens do horário 18:00 UTC (±1h)
filtered_items = [
    item for item in items
    if 17 <= pd.to_datetime(item.properties["datetime"]).hour <= 19
]
```

### B.4 Sub-módulo B2: Temperatura de Superfície (SAMeT)

#### B.4.1 Vantagem do SAMeT

O produto SAMeT (South American Mapping of Temperature) do CPTEC/INPE combina dados de reanálise ERA5 com observações e já fornece **valores em graus Celsius** (sem necessidade de conversão). Disponível para toda a América do Sul.

#### B.4.2 Coleções e Assets

| Coleção | Asset | Unidade |
|---|---|---|
| `samet_daily-1` | `tmax` | °C (direto) |
| `samet_daily-1` | `tmin` | °C (direto) |

> **Nota:** A coleção SAMeT no catálogo STAC do BDC é `samet_daily-1` (tudo minúsculo). Os assets são `tmax` e `tmin`. Para obter a temperatura média, calcular `(tmax + tmin) / 2`. Os dados são em formato NetCDF e podem ser lidos com `xarray` ou `netCDF4`. Os valores já estão em Celsius.

#### B.4.3 Função de Extração de Temperatura

```python
def extrair_temperatura_municipio(
    bbox: tuple,
    cod_ibge: int,
    start_date: str,
    end_date: str,
    collection: str = "samet_daily-1",
    asset_tmax: str = "tmax",
    asset_tmin: str = "tmin",
) -> pd.DataFrame:
    """
    Extrai temperatura média de superfície para o bounding box de um município
    usando o produto SAMeT.

    Parâmetros:
    -----------
    bbox : tuple
        (west, south, east, north) em EPSG:4326 do município.
    cod_ibge : int
        Código IBGE do município.
    start_date : str
        Data inicial no formato "YYYY-MM-DD".
    end_date : str
        Data final no formato "YYYY-MM-DD".
    collection : str
        Coleção STAC. Default: "samet_daily-1".
    asset_tmax : str
        Nome do asset de temperatura máxima. Default: "tmax".
    asset_tmin : str
        Nome do asset de temperatura mínima. Default: "tmin".

    Retorno:
    --------
    pd.DataFrame com colunas:
        - data_referencia (date)
        - cod_ibge (int)
        - temperatura_superficie (float, °C)
    """
    client = get_stac_client()

    item_search = client.search(
        collections=[collection],
        bbox=bbox,
        datetime=f"{start_date}/{end_date}",
    )
    items = list(item_search.items())

    records = []
    for item in items:
        dt = pd.to_datetime(item.properties["datetime"]).date()
        try:
            tmax_array = read(item.assets[asset_tmax].href, bbox=bbox)
            tmin_array = read(item.assets[asset_tmin].href, bbox=bbox)
            # SAMeT já entrega °C; calcular média espacial de (tmax+tmin)/2
            tmean_array = (tmax_array + tmin_array) / 2.0
            mean_temp = float(np.nanmean(tmean_array))
            max_temp = float(np.nanmean(tmax_array))
            min_temp = float(np.nanmean(tmin_array))
            records.append({
                "data_referencia": dt,
                "cod_ibge": cod_ibge,
                "temperatura_superficie": round(mean_temp, 2),
                "temperatura_maxima": round(max_temp, 2),
                "temperatura_minima": round(min_temp, 2),
            })
        except Exception as e:
            logging.warning(f"Erro ao ler SAMeT para {dt}: {e}")
            continue

    return pd.DataFrame(records)
```

### B.5 Sub-módulo B3: Temperatura de Superfície via MODIS LST (Alternativa)

Caso o SAMeT não tenha cobertura para o período desejado, usar MODIS como fallback.

#### B.5.1 Detalhes

| Coleção | Asset | Fator de Escala | Unidade Após Escala |
|---|---|---|---|
| `MOD11A2-6.1` | `LST_Day_1km` | `raw * 0.02` | Kelvin |

```python
def extrair_lst_modis(bbox, cod_ibge, start_date, end_date):
    client = get_stac_client()
    items = list(client.search(
        collections=["mod11a2-6.1"], bbox=bbox,
        datetime=f"{start_date}/{end_date}",
    ).items())

    records = []
    for item in items:
        dt = pd.to_datetime(item.properties["datetime"]).date()
        try:
            lst_raw = read(item.assets["LST_Day_1km"].href, bbox=bbox)
            lst_kelvin = lst_raw * 0.02         # Fator de escala MODIS
            lst_celsius = lst_kelvin - 273.15   # Kelvin → Celsius
            mean_temp = float(np.nanmean(lst_celsius))
            records.append({
                "data_referencia": dt,
                "cod_ibge": cod_ibge,
                "temperatura_superficie": round(mean_temp, 2),
            })
        except Exception:
            continue

    return pd.DataFrame(records)
```

---

## Módulo C — Umidade Atmosférica

### C.1 Objetivo

Extrair um índice de umidade atmosférica derivado das bandas de vapor d'água do satélite GOES-16, calculando a média espacial para cada município por dia.

### C.2 Fontes de Dados

| Fonte | Coleção STAC | Bandas | Comprimento de Onda | Nível Atmosférico |
|---|---|---|---|---|
| GOES-16 | `GOES16-L2-CMI-1` | `B08` | 6.2 µm | Troposfera superior |
| GOES-16 | `GOES16-L2-CMI-1` | `B09` | 6.9 µm | Troposfera média |
| GOES-16 | `GOES16-L2-CMI-1` | `B10` | 7.3 µm | Troposfera inferior |

**Decisão de design:** Usar a banda `B10` (7.3 µm, troposfera inferior) como indicador primário de umidade, pois reflete melhor as condições atmosféricas próximas à superfície. Os valores de Brightness Temperature são **inversamente relacionados** ao vapor d'água — temperaturas de brilho mais baixas indicam mais umidade.

### C.3 Lógica de Cálculo do Índice de Umidade

A Brightness Temperature da banda de vapor d'água funciona como proxy inverso da umidade:
- **Temperatura de brilho alta** → atmosfera seca (menos vapor)
- **Temperatura de brilho baixa** → atmosfera úmida (mais vapor)

Para criar um índice normalizado (0–100, onde 100 = máxima umidade):

```python
# Constantes empíricas para normalização da banda B10 (troposfera inferior)
# Estes valores devem ser calibrados/ajustados conforme a região
WV_TEMP_MIN = 200.0   # K — observação mais fria típica (muita umidade)
WV_TEMP_MAX = 260.0   # K — observação mais quente típica (pouca umidade)

def calcular_indice_umidade(brightness_temp: np.ndarray) -> float:
    """
    Converte Brightness Temperature da banda de vapor d'água
    em índice de umidade normalizado (0-100).

    Parâmetros:
    -----------
    brightness_temp : np.ndarray
        Matriz 2D com Brightness Temperature em Kelvin (banda B10 do GOES).

    Retorno:
    --------
    float: Índice de umidade médio (0 = muito seco, 100 = muito úmido).
    """
    mean_bt = float(np.nanmean(brightness_temp))

    # Inversão e normalização linear
    indice = (WV_TEMP_MAX - mean_bt) / (WV_TEMP_MAX - WV_TEMP_MIN) * 100.0

    # Clamp entre 0 e 100
    return round(max(0.0, min(100.0, indice)), 2)
```

### C.4 Função Completa do Módulo C

```python
def extrair_umidade_municipio(
    bbox: tuple,
    cod_ibge: int,
    start_date: str,
    end_date: str,
    collection: str = "GOES16-L2-CMI-1",
    band: str = "B10",
    target_hour_utc: int = 18,
) -> pd.DataFrame:
    """
    Extrai índice de umidade atmosférica diário para o bounding box
    de um município usando a banda de vapor d'água do GOES-16.

    Parâmetros:
    -----------
    bbox : tuple
        (west, south, east, north) em EPSG:4326 do município.
    cod_ibge : int
        Código IBGE do município.
    start_date : str
        Data inicial no formato "YYYY-MM-DD".
    end_date : str
        Data final no formato "YYYY-MM-DD".
    collection : str
        Coleção STAC. Default: "GOES16-L2-CMI-1".
    band : str
        Banda de vapor d'água. Default: "B10" (troposfera inferior).
    target_hour_utc : int
        Hora UTC para filtrar (1 imagem/dia). Default: 18 (15h Brasília).

    Retorno:
    --------
    pd.DataFrame com colunas:
        - data_referencia (date)
        - cod_ibge (int)
        - umidade_atmosferica (float, escala 0-100)
    """
    client = get_stac_client()

    item_search = client.search(
        collections=[collection],
        bbox=bbox,
        datetime=f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
    )
    items = list(item_search.items())

    # Filtrar 1 imagem por dia (horário mais próximo do target)
    daily_items = {}
    for item in items:
        dt = pd.to_datetime(item.properties["datetime"])
        day = dt.date()
        if day not in daily_items:
            daily_items[day] = item
        else:
            # Manter o item com hora mais próxima do target
            existing_dt = pd.to_datetime(daily_items[day].properties["datetime"])
            if abs(dt.hour - target_hour_utc) < abs(existing_dt.hour - target_hour_utc):
                daily_items[day] = item

    records = []
    for day, item in daily_items.items():
        try:
            wv_image = remap(item.assets[band].href, bbox, resolution=0.02)
            indice = calcular_indice_umidade(wv_image)
            records.append({
                "data_referencia": day,
                "cod_ibge": cod_ibge,
                "umidade_atmosferica": indice,
            })
        except Exception as e:
            logging.warning(f"Erro ao ler vapor d'água para {day}: {e}")
            continue

    return pd.DataFrame(records)
```

---

## Orquestrador Geral — Execução para Múltiplos Municípios

### Função Principal

```python
def executar_extracao_completa(
    municipios_gdf: gpd.GeoDataFrame,
    start_date: str,
    end_date: str,
) -> dict[str, pd.DataFrame]:
    """
    Executa os 3 módulos (A, B, C) para todos os municípios do GeoDataFrame.

    Parâmetros:
    -----------
    municipios_gdf : gpd.GeoDataFrame
        DataFrame com colunas: cod_ibge, nome_municipio, estado_uf, geometry.
        A coluna geometry deve conter os polígonos dos municípios.
    start_date : str
        Data inicial no formato "YYYY-MM-DD".
    end_date : str
        Data final no formato "YYYY-MM-DD".

    Retorno:
    --------
    dict com DataFrames: {"ndvi": df, "focos_calor": df, "temperatura": df, "umidade": df}
    """
    all_ndvi = []
    all_focos = []
    all_temp = []
    all_umidade = []

    for _, row in municipios_gdf.iterrows():
        cod_ibge = row["cod_ibge"]
        centroid = row.geometry.centroid
        bbox = tuple(row.geometry.bounds)  # (minx, miny, maxx, maxy)

        logging.info(f"Processando município {cod_ibge} - {row.get('nome_municipio', '')}")

        # Módulo A: NDVI
        try:
            df_ndvi = extrair_ndvi_municipio(
                latitude=centroid.y,
                longitude=centroid.x,
                cod_ibge=cod_ibge,
                start_date=start_date,
                end_date=end_date,
            )
            all_ndvi.append(df_ndvi)
        except Exception as e:
            logging.error(f"Módulo A falhou para {cod_ibge}: {e}")

        # Módulo B: Focos de Calor
        try:
            df_focos = extrair_focos_calor_municipio(
                bbox=bbox,
                cod_ibge=cod_ibge,
                start_date=start_date,
                end_date=end_date,
            )
            all_focos.append(df_focos)
        except Exception as e:
            logging.error(f"Módulo B (focos) falhou para {cod_ibge}: {e}")

        # Módulo B: Temperatura SAMeT
        try:
            df_temp = extrair_temperatura_municipio(
                bbox=bbox,
                cod_ibge=cod_ibge,
                start_date=start_date,
                end_date=end_date,
            )
            all_temp.append(df_temp)
        except Exception as e:
            logging.error(f"Módulo B (temp) falhou para {cod_ibge}: {e}")

        # Módulo C: Umidade
        try:
            df_umidade = extrair_umidade_municipio(
                bbox=bbox,
                cod_ibge=cod_ibge,
                start_date=start_date,
                end_date=end_date,
            )
            all_umidade.append(df_umidade)
        except Exception as e:
            logging.error(f"Módulo C falhou para {cod_ibge}: {e}")

        # Rate limiting entre municípios
        import time
        time.sleep(1.0)

    return {
        "ndvi": pd.concat(all_ndvi, ignore_index=True) if all_ndvi else pd.DataFrame(),
        "focos_calor": pd.concat(all_focos, ignore_index=True) if all_focos else pd.DataFrame(),
        "temperatura": pd.concat(all_temp, ignore_index=True) if all_temp else pd.DataFrame(),
        "umidade": pd.concat(all_umidade, ignore_index=True) if all_umidade else pd.DataFrame(),
    }
```

---

## Estrutura de Arquivos do Projeto

```
code-gallery/
├── pipeline/
│   ├── __init__.py
│   ├── config.py              # Constantes: endpoints, thresholds, scale factors
│   ├── utils.py               # Funções read(), remap(), get_stac_client()
│   ├── modulo_a_vegetacao.py   # extrair_ndvi_municipio()
│   ├── modulo_b_temperatura.py # extrair_focos_calor_municipio(), extrair_temperatura_municipio()
│   ├── modulo_c_umidade.py     # extrair_umidade_municipio()
│   ├── orquestrador.py         # executar_extracao_completa()
│   └── geo_setup.py            # Carrega malha municipal via geobr/shapefile
```

---

## Referência Rápida de Constantes e Parâmetros

| Constante | Valor | Origem |
|---|---|---|
| `STAC_ENDPOINT` | `https://data.inpe.br/bdc/stac/v1/` | Todos os notebooks STAC |
| `WTSS_ENDPOINT` | `https://data.inpe.br/bdc/wtss/v4/` | Todos os notebooks WTSS |
| `NDVI_SCALE_FACTOR` | `10000.0` | stac-image-processing.ipynb |
| `MODIS_LST_SCALE_FACTOR` | `0.02` | stac-introducao-oficina-big-bdc-2024.ipynb |
| `FIRE_THRESHOLD_K` | `323.15` | stac-goes-oficina-big-bdc-2024.ipynb |
| `KELVIN_TO_CELSIUS_OFFSET` | `273.15` | goes16-akara.ipynb |
| `GOES_REMAP_RESOLUTION` | `0.02` | goes16-akara.ipynb |
| `SCL_VALID_VALUES` | `[4, 5, 6]` | wtss-examples.ipynb |
| `CMASK_CLOUD_VALUE` | `255` | wtss-examples.ipynb |
| `WV_BAND` | `B10` | goes16-akara.ipynb |
| `FIRE_BAND` | `B07` | stac-goes-oficina-big-bdc-2024.ipynb |
| `IR_TEMP_BAND` | `B13` | goes16-akara.ipynb |
| `SAMET_COLLECTION` | `samet_daily-1` | HandsOn_SAMeT.ipynb |
| `SAMET_ASSET_TMAX` | `tmax` | HandsOn_SAMeT.ipynb |
| `SAMET_ASSET_TMIN` | `tmin` | HandsOn_SAMeT.ipynb |
| `SENTINEL_COLLECTION` | `S2-16D-2` | stac-introduction.ipynb |
| `CBERS_COLLECTION` | `CBERS4-WFI-16D-2` | wtss-examples.ipynb |
| `GOES16_COLLECTION` | `GOES16-L2-CMI-1` | goes16-akara.ipynb |
| `GOES19_COLLECTION` | `GOES19-L2-CMI-1` | goes19-read-subset.ipynb |
| `MODIS_LST_COLLECTION` | `mod11a2-6.1` | stac-introducao-oficina-big-bdc-2024.ipynb |
| `GOES_NETCDF_SUFFIX` | `#mode=bytes` | Todos os notebooks GOES |
| `GOES_CMI_VARIABLE` | `CMI` | Todos os notebooks GOES |
| `GOES_SAT_HEIGHT` | `35786023.0` | goes16-akara.ipynb |
| `GOES_CENTRAL_LON` | `-75.0` | goes16-akara.ipynb |
