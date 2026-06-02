import geobr
import geopandas as gpd
import pandas as pd
import os

def baixar_malha_municipal(ano: int = 2020) -> gpd.GeoDataFrame:
    """
    Baixa a malha de todos os municípios do Brasil via geobr.
    """
    # Retorna um GeoDataFrame com colunas: code_muni, name_muni, abbrev_state, geometry
    gdf = geobr.read_municipality(code_muni="all", year=ano)
    return gdf

def padronizar_crs(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Garante que as geometrias estejam em EPSG:4326.
    """
    if gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")
    return gdf

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

def salvar_dimensao(df: pd.DataFrame, filepath: str = "dim_localidade.parquet"):
    """
    Salva o DataFrame em formato Parquet para ser lido pela Fase 2.
    """
    # Opcional: para databricks seria df_spark.write.format("delta").saveAsTable(...)
    df.to_parquet(filepath, index=False)
    print(f"Malha municipal salva com sucesso em: {filepath}")

if __name__ == "__main__":
    print("Iniciando Fase 1: Setup Geoespacial...")
    gdf_bruto = baixar_malha_municipal(ano=2020)
    gdf_4326 = padronizar_crs(gdf_bruto)
    gdf_coord = calcular_coordenadas_ancora(gdf_4326)
    df_final = preparar_tabela_dimensao(gdf_coord)
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = os.path.join(BASE_DIR, "data")
    os.makedirs(DATA_DIR, exist_ok=True)
    caminho_parquet = os.path.join(DATA_DIR, "dim_localidade.parquet")
    
    salvar_dimensao(df_final, caminho_parquet)
    print("Fase 1 concluída. O arquivo dim_localidade.parquet está pronto para a Fase 2.")
