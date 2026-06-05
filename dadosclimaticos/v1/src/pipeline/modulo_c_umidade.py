import numpy as np
import pandas as pd
import logging

from pipeline.utils import remap, get_stac_client
from pipeline.config import WV_TEMP_MIN, WV_TEMP_MAX

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
    if np.isnan(mean_bt):
        return np.nan

    # Inversão e normalização linear
    indice = (WV_TEMP_MAX - mean_bt) / (WV_TEMP_MAX - WV_TEMP_MIN) * 100.0

    # Clamp entre 0 e 100
    return round(max(0.0, min(100.0, indice)), 2)

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
    if collection == "GOES16-L2-CMI-1" and start_date >= "2025-04-01":
        collection = "GOES19-L2-CMI-1"

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

    import concurrent.futures
    from tqdm import tqdm
    from pipeline.utils import clear_local_cache, _get_local_path

    records = []

    # Producer
    def fetch_umidade(day, item):
        uri = item.assets[band].href
        _get_local_path(uri)
        return day, uri

    # Consumer
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_umidade, day, item): (day, item) for day, item in daily_items.items()}
        for future in tqdm(concurrent.futures.as_completed(futures), total=len(daily_items), desc="Umidade", leave=False):
            uri = None
            try:
                day, uri = future.result()
                wv_image = remap(uri, bbox, resolution=0.02)
                indice = calcular_indice_umidade(wv_image)
                records.append({
                    "data_referencia": day,
                    "cod_ibge": cod_ibge,
                    "umidade_atmosferica": indice,
                })
            except Exception as e:
                logging.warning(f"Erro ao processar Umidade: {e}")
            finally:
                if uri:
                    clear_local_cache(uri)

    return pd.DataFrame(records)
