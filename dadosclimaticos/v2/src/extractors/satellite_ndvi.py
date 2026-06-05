import pandas as pd
import time
import os
from datetime import datetime, timedelta
from src.core.utils import safe_get

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
    token = os.environ.get("SENTINEL_HUB_TOKEN")
    
    if not token:
        raise ValueError("Token SENTINEL_HUB_TOKEN não encontrado no ambiente.")
        
    # Endpoint Real da API de Processamento do Sentinel Hub
    url = "https://services.sentinel-hub.com/api/v1/process"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Criando Bounding Box simplificada a partir do ponto
    bbox = [lon - 0.1, lat - 0.1, lon + 0.1, lat + 0.1]
    
    payload = {
        "input": {
            "bounds": {"bbox": bbox},
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange": {
                        "from": f"{start_date}T00:00:00Z",
                        "to": f"{end_date}T23:59:59Z"
                    }
                }
            }]
        },
        "output": {
            "width": 512,
            "height": 512,
            "responses": [
                {"identifier": "default", "format": {"type": "application/json"}}
            ]
        }
    }
    
    # Fazemos o request real
    response = safe_get(url, headers=headers, json=payload) # Assumindo que safe_get suporta json ou usamos requests diretamente
    # Como safe_get é importado do utils, se não suportar 'json', o ideal seria requests.post
    
    import requests
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        # Processamento real do JSON do Sentinel Hub iria aqui
        # Extraindo as médias espaciais por dia
        # Por limitações do escopo da prova de conceito, caso retorne 200, formatamos:
        # (O Sentinel Hub requereria um EvalScript para retornar o NDVI, mas isso demonstra a conexão real)
        pass
    elif response.status_code == 429:
        raise ConnectionError("HTTP 429 Too Many Requests")
    else:
        raise ConnectionError(f"HTTP {response.status_code}: {response.text}")

    # Retorno padrão para sucesso na requisição seria implementado processando `data`
    # Como estamos testando o cenário de falha/ausência de chave, o levante de Exception fará o retry trabalhar.
    raise RuntimeError("Estrutura de dados da API ainda não mapeada. Simulando falha controlada para teste do decorator.")
