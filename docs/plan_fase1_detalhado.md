# Fase 1 — Plano de Desenvolvimento Técnico Detalhado: Preparação Geoespacial e Ambiente

> **Objetivo deste documento:** Fornecer um plano de implementação em Python detalhado para a Fase 1 (Setup Geoespacial). O objetivo desta fase é criar a malha de ancoragem que servirá como entrada fundamental (input) para os extratores da Fase 2.

---

## 1. Visão Geral e Fronteira com a Fase 2

A **Fase 1** é responsável por extrair, transformar e armazenar os dados geoespaciais de todos os municípios do Brasil. Como a maioria das APIs de satélite (STAC e WTSS) necessita de coordenadas espaciais para buscar os dados, a Fase 1 atua como o **motor de coordenadas** do projeto.

### 1.1 O Contrato de Dados (Interface Fase 1 -> Fase 2)
Para que uma LLM possa programar a Fase 1 e a Fase 2 simultaneamente e garantir que elas funcionem de ponta a ponta, o output da Fase 1 deve respeitar rigorosamente o seguinte esquema.

**Formato de Saída (Output da Fase 1):**
Um arquivo (ex: `dim_localidade.parquet`) ou tabela Delta contendo as seguintes colunas obrigatórias:
1. `cod_ibge` (int): Identificador único do município (7 dígitos).
2. `nome_municipio` (str): Nome do município.
3. `uf` (str): Sigla do Estado.
4. `bbox_west`, `bbox_south`, `bbox_east`, `bbox_north` (float): Coordenadas extremas (Bounding Box) em EPSG:4326. **(Usado pelo Módulo B e C no STAC)**.
5. `centroid_lat`, `centroid_lon` (float): Coordenadas do ponto central do município em EPSG:4326. **(Usado pelo Módulo A no WTSS)**.
6. `geometria_wkt` (str): Polígono exato do município em formato WKT (Well-Known Text) para possíveis cruzamentos espaciais avançados.

A Fase 2 importará essa tabela e iterará sobre essas linhas para buscar os dados de satélite.

---

## 2. Bibliotecas Necessárias

```bash
pip install geobr geopandas shapely pandas pyarrow
```
* `geobr`: Biblioteca oficial mantida pelo IPEA para download das malhas do IBGE.
* `geopandas`: Para manipulação de dados espaciais, projeções e cálculos geométricos.
* `shapely`: Para manipulação de geometrias subjacentes.

---

## 3. Plano de Implementação (Passo a Passo)

### 3.1 Download da Malha Municipal
Utilizar o pacote `geobr` para baixar a malha municipal completa do Brasil.

```python
import geobr
import geopandas as gpd

def baixar_malha_municipal(ano: int = 2020) -> gpd.GeoDataFrame:
    """
    Baixa a malha de todos os municípios do Brasil via geobr.
    """
    # Retorna um GeoDataFrame com colunas: code_muni, name_muni, abbrev_state, geometry
    gdf = geobr.read_municipality(code_muni="all", year=ano)
    return gdf
```

### 3.2 Padronização do Sistema de Coordenadas (CRS)
As APIs STAC e WTSS exigem que as coordenadas sejam fornecidas em latitude/longitude geográficas no datum WGS84 (EPSG:4326).

```python
def padronizar_crs(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Garante que as geometrias estejam em EPSG:4326.
    """
    if gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")
    return gdf
```

### 3.3 Extração de Bounding Boxes e Centroides
As APIs na Fase 2 operam de duas formas diferentes:
- **WTSS (Módulo A)**: Pede `latitude` e `longitude` (usaremos o **centroide**).
- **STAC (Módulos B e C)**: Pede um `bbox` formatado como `(west, south, east, north)` (usaremos os **bounds**).

```python
def calcular_coordenadas_ancora(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Calcula centroides e bounding boxes para cada município.
    """
    # 1. Centroides
    # O aviso de UserWarning do geopandas ao calcular centroides em CRS geográfico
    # pode aparecer. Para maior precisão, pode-se projetar para um CRS métrico,
    # calcular o centroide e voltar para 4326, mas para WTSS o centroide direto serve.
    gdf['centroid'] = gdf.geometry.centroid
    gdf['centroid_lon'] = gdf['centroid'].x
    gdf['centroid_lat'] = gdf['centroid'].y

    # 2. Bounding Boxes
    # gdf.bounds retorna colunas: minx (west), miny (south), maxx (east), maxy (north)
    bounds = gdf.bounds
    gdf['bbox_west'] = bounds['minx']
    gdf['bbox_south'] = bounds['miny']
    gdf['bbox_east'] = bounds['maxx']
    gdf['bbox_north'] = bounds['maxy']

    return gdf
```

### 3.4 Conversão e Limpeza para o Formato Final
Transformar o GeoDataFrame em um DataFrame do Pandas comum para exportação em Parquet, garantindo a tipagem correta.

```python
import pandas as pd

def preparar_tabela_dimensao(gdf: gpd.GeoDataFrame) -> pd.DataFrame:
    """
    Renomeia colunas, filtra as necessárias e prepara para exportação.
    """
    # Extrair WKT da geometria
    gdf['geometria_wkt'] = gdf.geometry.to_wkt()
    
    # Renomear e selecionar colunas conforme o Contrato da Fase 1
    df = pd.DataFrame(gdf)
    df = df.rename(columns={
        "code_muni": "cod_ibge",
        "name_muni": "nome_municipio",
        "abbrev_state": "uf"
    })
    
    colunas_finais = [
        "cod_ibge", "nome_municipio", "uf",
        "bbox_west", "bbox_south", "bbox_east", "bbox_north",
        "centroid_lat", "centroid_lon", "geometria_wkt"
    ]
    
    # Certificar que cod_ibge é numérico
    df["cod_ibge"] = pd.to_numeric(df["cod_ibge"], errors="coerce").astype("Int64")
    
    return df[colunas_finais]
```

### 3.5 Persistência dos Dados (Output)

```python
def salvar_dimensao(df: pd.DataFrame, filepath: str = "dim_localidade.parquet"):
    """
    Salva o DataFrame em formato Parquet para ser lido pela Fase 2.
    """
    # Opcional: para databricks seria df_spark.write.format("delta").saveAsTable(...)
    df.to_parquet(filepath, index=False)
    print(f"Malha municipal salva com sucesso em: {filepath}")
```

---

## 4. Estrutura do Arquivo de Implementação

Ao passar este plano para a LLM implementar o código, o script deverá ser unificado em um arquivo chamado `pipeline/fase1_setup_geoespacial.py` com o seguinte ponto de entrada:

```python
if __name__ == "__main__":
    print("Iniciando Fase 1: Setup Geoespacial...")
    gdf_bruto = baixar_malha_municipal(ano=2020)
    gdf_4326 = padronizar_crs(gdf_bruto)
    gdf_coord = calcular_coordenadas_ancora(gdf_4326)
    df_final = preparar_tabela_dimensao(gdf_coord)
    salvar_dimensao(df_final, "dim_localidade.parquet")
    print("Fase 1 concluída. O arquivo dim_localidade.parquet está pronto para a Fase 2.")
```

Com este arquivo detalhado, a fronteira de dados fica explicitamente travada, garantindo que a **Fase 2** receberá como input um `.parquet` exato contendo `cod_ibge`, os bounds isolados e as latitudes/longitudes, permitindo construir a ingestão sem conflito de integração.
