import pandas as pd
import time
import os
from datetime import datetime, timedelta
from src.core.utils import safe_get
import requests
from src.core.utils import safe_get

def _get_cdse_token():
    client_id = os.environ.get("CDSE_CLIENT_ID")
    client_secret = os.environ.get("CDSE_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise ValueError("Variáveis CDSE_CLIENT_ID ou CDSE_CLIENT_SECRET não encontradas no ambiente.")
        
    token_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret
    }
    
    response = requests.post(token_url, data=data)
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        raise ConnectionError(f"Falha ao obter token CDSE: {response.status_code} - {response.text}")

def with_exponential_backoff(max_retries=5, base_delay=1):
    """
    Decorator para implementar Retry com Exponential Backoff.
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    wait_time = base_delay * (2 ** retries)
                    print(f"[NDVI API] Falha na requisição: {e}. Retentando em {wait_time}s... (Tentativa {retries + 1}/{max_retries})")
                    time.sleep(wait_time)
                    retries += 1
            print(f"[NDVI API] Falha persistente após {max_retries} tentativas. Retornando nulos.")
            
            # Quando falha totalmente, garante que retorna a estrutura com dados nulos
            # para não perder a integridade estrutural das colunas na camada Bronze
            start_date = kwargs.get('start_date') or args[2]
            end_date = kwargs.get('end_date') or (args[3] if len(args) > 3 else None)
            end_date = end_date or start_date
            
            date_range = pd.date_range(start=start_date, end=end_date).strftime("%Y-%m-%d").tolist()
            return pd.DataFrame({
                'time': date_range,
                'ndvi_mean': [None] * len(date_range),
                'cloud_cover_percent': [None] * len(date_range)
            })
        return wrapper
    return decorator

@with_exponential_backoff(max_retries=3, base_delay=1)
def fetch_vegetation_cover(lat: float, lon: float, start_date: str, end_date: str = None):
    """
    Extrai a cobertura vegetal (NDVI/LAI) consumindo o Sentinel Hub API (Copernicus CDSE).
    Necessita da variável de ambiente SENTINEL_HUB_TOKEN para autenticação Bearer.
    Caso não exista ou falhe, o fallback gerará nulos respeitando a arquitetura real.
    """
    end_date = end_date or start_date
    
    # 1. Gera o token dinamicamente
    token = _get_cdse_token()
    
    # Endpoint Real da API de Estatísticas do Sentinel Hub
    url = "https://sh.dataspace.copernicus.eu/api/v1/statistics"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Criando Bounding Box simplificada a partir do ponto
    bbox = [lon - 0.1, lat - 0.1, lon + 0.1, lat + 0.1]
    
    evalscript = """
    //VERSION=3
    function setup() {
        return {
            input: [{ bands: ["B04", "B08", "CLM", "dataMask"] }],
            output: [
                { id: "ndvi", bands: 1 },
                { id: "cloud", bands: 1 },
                { id: "dataMask", bands: 1 }
            ]
        };
    }
    function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        return {
            ndvi: [ndvi],
            cloud: [sample.CLM],
            dataMask: [sample.dataMask]
        };
    }
    """
    
    payload = {
        "input": {
            "bounds": {"bbox": bbox},
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {}
            }]
        },
        "aggregation": {
            "timeRange": {
                "from": f"{start_date}T00:00:00Z",
                "to": f"{end_date}T23:59:59Z"
            },
            "aggregationInterval": {
                "of": "P1D"
            },
            "evalscript": evalscript,
            "resx": 0.001,
            "resy": 0.001
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        records = []
        for item in data.get("data", []):
            time_str = item["interval"]["from"][:10]
            try:
                mean_ndvi = item["outputs"]["ndvi"]["bands"]["B0"]["stats"]["mean"]
            except KeyError:
                mean_ndvi = None
                
            try:
                mean_cloud = item["outputs"]["cloud"]["bands"]["B0"]["stats"]["mean"]
                cloud_percent = mean_cloud * 100.0 if mean_cloud is not None else None
            except KeyError:
                cloud_percent = None
                
            records.append({
                "time": time_str,
                "ndvi_mean": mean_ndvi,
                "cloud_cover_percent": cloud_percent
            })
        return pd.DataFrame(records)
    elif response.status_code == 429:
        raise ConnectionError("HTTP 429 Too Many Requests")
    else:
        raise ConnectionError(f"HTTP {response.status_code}: {response.text}")
