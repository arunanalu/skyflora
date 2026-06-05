import requests
import pandas as pd

def fetch_weather(lat: float, lon: float, date: str):
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": date,
        "end_date": date,
        "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum",
        "timezone": "America/Sao_Paulo"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        if 'daily' in data:
            return pd.DataFrame(data['daily'])
    return pd.DataFrame()
