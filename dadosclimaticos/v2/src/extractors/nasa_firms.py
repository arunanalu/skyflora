import requests
import pandas as pd
import os

def fetch_fire_spots(lat: float, lon: float, date: str):
    """
    Implementação REAL usando NASA FIRMS (Fire Information for Resource Management System).
    Requer uma MAP_KEY gratuita que pode ser obtida em: https://firms.modaps.eosdis.nasa.gov/api/
    """
    # MAP_KEY pode ser setada como variável de ambiente (export FIRMS_API_KEY="sua_chave")
    # Caso não exista, usamos o mock (para que o pipeline continue rodando sem erros)
    api_key = os.environ.get("FIRMS_API_KEY")
    
    if api_key:
        # Bounding box aproximado (1 grau = ~111km)
        bbox = f"{lon-0.2},{lat-0.2},{lon+0.2},{lat+0.2}"
        
        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{api_key}/VIIRS_SNPP_NRT/{bbox}/1/{date}"
        try:
            df = pd.read_csv(url)
            focos = len(df)
            return pd.DataFrame([{'time': date, 'focos_queimadas_reais': focos}])
        except Exception as e:
            print(f"Erro na API NASA FIRMS: {e}")
            return pd.DataFrame()
    else:
        print("Aviso: Variável FIRMS_API_KEY não definida. Usando dados estáticos de queimadas de fallback.")
        return pd.DataFrame([{'time': date, 'focos_queimadas_fallback': 0}])
