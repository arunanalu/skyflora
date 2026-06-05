import pandas as pd
import os
from src.core.utils import safe_get

def fetch_vegetation_health(lat, lon, start_date: str, end_date: str = None):
    """
    Substitui o WTSS por uma fonte pública estável (Open-Meteo).
    Retorna a Evapotranspiração (ET0) e o déficit de pressão de vapor (VPD),
    que são indicadores diretos da saúde da vegetação e estresse hídrico.
    """
    end_date = end_date or start_date
    url = "https://archive-api.open-meteo.com/v1/archive"
    
    is_batch = isinstance(lat, list)
    params = {
        "latitude": ",".join(map(str, lat)) if is_batch else lat,
        "longitude": ",".join(map(str, lon)) if is_batch else lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "et0_fao_evapotranspiration,vapour_pressure_deficit_max",
        "timezone": "America/Sao_Paulo"
    }
    response = safe_get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        
        if is_batch and isinstance(data, list):
            dfs = []
            for i, loc_data in enumerate(data):
                if 'daily' in loc_data:
                    df = pd.DataFrame(loc_data['daily'])
                    df['latitude'] = lat[i]
                    df['longitude'] = lon[i]
                    dfs.append(df)
            return pd.concat(dfs, ignore_index=True) if dfs else pd.DataFrame()
        else:
            if 'daily' in data:
                return pd.DataFrame(data['daily'])
    return pd.DataFrame()
