import numpy as np
import pandas as pd
from wtss import WTSS
import time

from pipeline.config import WTSS_ENDPOINT

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
    try:
        ts = coverage.ts(
            attributes=("NDVI", mask_attr),
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=end_date,
        )
    except Exception as e:
        return pd.DataFrame()

    if len(ts.timeline) == 0:
        return pd.DataFrame()

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

    # Tratamento de rate limit (opcional/preventivo para iterar muitos)
    time.sleep(0.5)

    return df.reset_index()

def calcular_delta_desmatamento(df: pd.DataFrame, ano_ref: int, ano_comp: int) -> float:
    """
    Compara NDVI médio de dois anos para o mesmo período.
    Retorna a diferença (negativo = perda de vegetação).
    """
    ndvi_ref = df[df.index.year == ano_ref]["indice_vegetacao_ndvi"].mean()
    ndvi_comp = df[df.index.year == ano_comp]["indice_vegetacao_ndvi"].mean()
    return ndvi_ref - ndvi_comp  # negativo = desmatamento
