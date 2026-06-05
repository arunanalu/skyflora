import requests
import pandas as pd

def fetch_air_quality(lat: float, lon: float, date: str):
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": date,
        "end_date": date,
        "hourly": "pm10,pm2_5,carbon_monoxide",
        "timezone": "America/Sao_Paulo"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        if 'hourly' in data:
            # Aggregate hourly to daily means
            df = pd.DataFrame(data['hourly'])
            df['time'] = pd.to_datetime(df['time']).dt.date
            df_daily = df.groupby('time').mean().reset_index()
            df_daily['time'] = df_daily['time'].astype(str)
            return df_daily
    return pd.DataFrame()
