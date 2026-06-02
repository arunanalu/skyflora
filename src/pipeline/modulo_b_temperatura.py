import numpy as np
import pandas as pd
import logging
from scipy import ndimage

from pipeline.utils import read, remap, get_stac_client
from pipeline.config import FIRE_THRESHOLD_K

def detect_fire(image: np.ndarray, temperature: float = FIRE_THRESHOLD_K, min_area: int = None) -> tuple[np.ndarray, int]:
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
    # Mask out NaNs
    pixels[np.isnan(pixels)] = 0
    
    # Apply threshold
    hot_mask = pixels >= temperature
    pixels[hot_mask] = 1
    pixels[~hot_mask] = 0

    # Opcional: rotulagem de componentes conectados para contar focos distintos
    labeled, n_objects = ndimage.label(pixels)

    if min_area is not None:
        # Filtrar objetos menores que min_area pixels
        for i in range(1, n_objects + 1):
            if np.sum(labeled == i) < min_area:
                pixels[labeled == i] = 0

    return pixels, n_objects

def extrair_focos_calor_municipio(
    bbox: tuple,
    cod_ibge: int,
    start_date: str,
    end_date: str,
    fire_threshold: float = FIRE_THRESHOLD_K,
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
        Limiar de temperatura em Kelvin. Default: 323.15 K.
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

    # Filtrar apenas imagens do horário 18:00 UTC (±1h) para limite de volume
    filtered_items = [
        item for item in items
        if 17 <= pd.to_datetime(item.properties["datetime"]).hour <= 19
    ]

    # 2. Processar cada item
    daily_fires = {}
    for item in filtered_items:
        dt_str = item.properties["datetime"]       # ISO 8601 string
        dt = pd.to_datetime(dt_str)
        day = dt.date()

        # Ler e reprojetar banda B07
        try:
            b07 = remap(item.assets["B07"].href, bbox, resolution=0.02)
        except Exception as e:
            import traceback
            logging.warning(f"Erro ao ler B07 para {dt_str}: {e}")
            logging.warning(traceback.format_exc())
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
        - temperatura_maxima (float, °C)
        - temperatura_minima (float, °C)
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
            tmax_array = read(item.assets[asset_tmax].href, bbox=bbox, subdataset=asset_tmax)
            tmin_array = read(item.assets[asset_tmin].href, bbox=bbox, subdataset=asset_tmin)
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

def extrair_lst_modis(bbox, cod_ibge, start_date, end_date):
    """
    Extrai LST do MODIS como fallback para o SAMeT.
    """
    client = get_stac_client()
    items = list(client.search(
        collections=["mod11a2-6.1"], bbox=bbox,
        datetime=f"{start_date}/{end_date}",
    ).items())

    records = []
    for item in items:
        dt = pd.to_datetime(item.properties["datetime"]).date()
        try:
            lst_kelvin = read(item.assets["LST_Day_1km"].href, bbox=bbox)
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
