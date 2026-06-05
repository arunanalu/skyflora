import pandas as pd
from src.core.utils import safe_get

def fetch_air_quality(lat, lon, start_date: str, end_date: str = None):
    end_date = end_date or start_date
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    
    is_batch = isinstance(lat, list)
    params = {
        "latitude": ",".join(map(str, lat)) if is_batch else lat,
        "longitude": ",".join(map(str, lon)) if is_batch else lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "pm10,pm2_5,carbon_monoxide",
        "timezone": "America/Sao_Paulo"
    }
    response = safe_get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        
        def process_aq_data(loc_data, current_lat=None, current_lon=None):
            if 'hourly' in loc_data:
                df = pd.DataFrame(loc_data['hourly'])
                df['time'] = pd.to_datetime(df['time']).dt.date
                df_daily = df.groupby('time').mean(numeric_only=True).reset_index()
                df_daily['time'] = df_daily['time'].astype(str)
                if current_lat is not None:
                    df_daily['latitude'] = current_lat
                    df_daily['longitude'] = current_lon
                return df_daily
            return pd.DataFrame()

        if is_batch and isinstance(data, list):
            dfs = []
            for i, loc_data in enumerate(data):
                dfs.append(process_aq_data(loc_data, lat[i], lon[i]))
            return pd.concat(dfs, ignore_index=True) if dfs else pd.DataFrame()
        else:
            return process_aq_data(data)
    return pd.DataFrame()
