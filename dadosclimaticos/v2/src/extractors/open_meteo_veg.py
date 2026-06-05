import requests
import pandas as pd
import os

def fetch_vegetation_health(lat: float, lon: float, date: str):
    """
    Substitui o WTSS por uma fonte pública estável (Open-Meteo).
    Retorna a Evapotranspiração (ET0) e o déficit de pressão de vapor (VPD),
    que são indicadores diretos da saúde da vegetação e estresse hídrico.
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": date,
        "end_date": date,
        "daily": "et0_fao_evapotranspiration,vapour_pressure_deficit_max",
        "timezone": "America/Sao_Paulo"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        if 'daily' in data:
            return pd.DataFrame(data['daily'])
    return pd.DataFrame()
