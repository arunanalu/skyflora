import pandas as pd
import os
import io
from datetime import datetime, timedelta
from src.core.utils import safe_get

def fetch_fire_spots(lat: float, lon: float, date: str):
    """
    Implementação REAL usando NASA FIRMS (Fire Information for Resource Management System).
    Requer uma MAP_KEY gratuita que pode ser obtida em: https://firms.modaps.eosdis.nasa.gov/api/
    """
    api_key = os.environ.get("FIRMS_API_KEY")
    
    if api_key:
        bbox = f"{lon-0.2},{lat-0.2},{lon+0.2},{lat+0.2}"
        
        # Dinâmica de Fonte de Dados (NRT vs SP)
        target_date = datetime.strptime(date, "%Y-%m-%d")
        days_diff = (datetime.now() - target_date).days
        source = "VIIRS_SNPP_NRT" if days_diff <= 60 else "VIIRS_SNPP_SP"
        
        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{api_key}/{source}/{bbox}/1/{date}"
        try:
            response = safe_get(url)
            if response.status_code == 200:
                df = pd.read_csv(io.StringIO(response.text))
                focos = len(df)
                return pd.DataFrame([{'time': date, 'focos_queimadas_reais': focos}])
            return pd.DataFrame([{'time': date, 'focos_queimadas_reais': None}])
        except Exception as e:
            print(f"Erro na API NASA FIRMS: {e}")
            return pd.DataFrame([{'time': date, 'focos_queimadas_reais': None}])
    else:
        print("Aviso: Variável FIRMS_API_KEY não definida. Retornando valores nulos para queimadas.")
        return pd.DataFrame([{'time': date, 'focos_queimadas_reais': None}])

def fetch_fire_spots_brazil(start_date: str, end_date: str):
    """
    Extrai todos os focos de incêndio do Brasil num intervalo de datas, agrupados em blocos de 10 dias.
    """
    api_key = os.environ.get("FIRMS_API_KEY")
    if not api_key:
        print("Aviso: Variável FIRMS_API_KEY não definida. Retornando dataframe vazio para fires no Brasil.")
        return pd.DataFrame()
        
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    current = start
    dfs = []
    
    while current <= end:
        days_left = (end - current).days + 1
        chunk_days = min(days_left, 10)
        
        date_str = current.strftime("%Y-%m-%d")
        
        # Dinâmica de Fonte de Dados (NRT vs SP)
        days_diff = (datetime.now() - current).days
        source = "VIIRS_SNPP_NRT" if days_diff <= 60 else "VIIRS_SNPP_SP"
        
        url = f"https://firms.modaps.eosdis.nasa.gov/api/country/csv/{api_key}/{source}/BRA/{chunk_days}/{date_str}"
        
        try:
            response = safe_get(url)
            if response.status_code == 200:
                df = pd.read_csv(io.StringIO(response.text))
                dfs.append(df)
        except Exception as e:
            print(f"Erro na API NASA FIRMS (Country): {e}")
            
        current += timedelta(days=chunk_days)
        
    if dfs:
        return pd.concat(dfs, ignore_index=True)
    return pd.DataFrame()
