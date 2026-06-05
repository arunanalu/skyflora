import pandas as pd
import geopandas as gpd
import logging
import time
import concurrent.futures
from tqdm import tqdm

from pipeline.modulo_a_vegetacao import extrair_ndvi_municipio
from pipeline.modulo_b_temperatura import extrair_focos_calor_municipio, extrair_temperatura_municipio
from pipeline.modulo_c_umidade import extrair_umidade_municipio

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

    for _, row in tqdm(municipios_gdf.iterrows(), total=len(municipios_gdf), desc="Processando Municípios"):
        cod_ibge = row["cod_ibge"]
        centroid = row.geometry.centroid
        bbox = tuple(row.geometry.bounds)  # (minx, miny, maxx, maxy)

        logging.info(f"Processando município {cod_ibge} - {row.get('nome_municipio', '')}")

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

        # Rate limiting preventivo entre municípios
        time.sleep(1.0)

    return {
        "ndvi": pd.concat(all_ndvi, ignore_index=True) if all_ndvi else pd.DataFrame(),
        "focos_calor": pd.concat(all_focos, ignore_index=True) if all_focos else pd.DataFrame(),
        "temperatura": pd.concat(all_temp, ignore_index=True) if all_temp else pd.DataFrame(),
        "umidade": pd.concat(all_umidade, ignore_index=True) if all_umidade else pd.DataFrame(),
    }
