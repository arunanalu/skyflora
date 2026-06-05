import argparse
import pandas as pd
import os
import sys

# Ensure local imports work correctly by adding src to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.config import BRONZE_DIR
from src.setup.geo_setup import get_coordinates
from src.extractors.open_meteo import fetch_weather
from src.extractors.open_meteo_aq import fetch_air_quality
from src.extractors.nasa_firms import fetch_fire_spots, fetch_fire_spots_brazil
from src.extractors.open_meteo_veg import fetch_vegetation_health
from src.extractors.satellite_ndvi import fetch_vegetation_cover

def run_pipeline(municipio: str, start_date: str, end_date: str = None):
    end_date = end_date or start_date
    print(f"Iniciando extração para {municipio} no período {start_date} a {end_date}...")
    
    lat, lon = get_coordinates(municipio)
    if lat is None or lon is None:
        print(f"Erro: Não foi possível encontrar as coordenadas para {municipio}.")
        return

    print(f"Coordenadas obtidas: Lat {lat}, Lon {lon}")
    
    print("Buscando dados de Clima...")
    df_weather = fetch_weather(lat, lon, start_date, end_date)
    
    print("Buscando dados de Qualidade do Ar...")
    df_aq = fetch_air_quality(lat, lon, start_date, end_date)
    
    print("Buscando dados de Queimadas (NASA FIRMS)...")
    # Para múltiplos dias de um único município, simulamos chamando em loop ou adaptamos a fetch_fire_spots
    # Como fetch_fire_spots_brazil é para o país todo, vamos iterar fetch_fire_spots para o range
    start_dt = pd.to_datetime(start_date)
    end_dt = pd.to_datetime(end_date)
    fire_dfs = []
    current_dt = start_dt
    while current_dt <= end_dt:
        fire_dfs.append(fetch_fire_spots(lat, lon, current_dt.strftime("%Y-%m-%d")))
        current_dt += pd.Timedelta(days=1)
    df_fires = pd.concat(fire_dfs, ignore_index=True) if fire_dfs else pd.DataFrame()
    
    print("Buscando dados de Saúde da Vegetação (Open-Meteo Evapotranspiração/VPD)...")
    df_veg = fetch_vegetation_health(lat, lon, start_date, end_date)
    
    print("Buscando dados de Cobertura Vegetal (NDVI/Copernicus/MODIS)...")
    df_ndvi = fetch_vegetation_cover(lat, lon, start_date, end_date)
    
    # Consolidação
    print("Consolidando os dados...")
    # Cria a base de tempo do período
    date_range = pd.date_range(start=start_date, end=end_date).strftime("%Y-%m-%d").tolist()
    df_final = pd.DataFrame({'time': date_range, 'municipio': municipio, 'latitude': lat, 'longitude': lon})
    
    if not df_weather.empty:
        df_final = df_final.merge(df_weather, on='time', how='left')
    
    if not df_aq.empty:
        df_final = df_final.merge(df_aq, on='time', how='left')
        
    if not df_fires.empty:
        df_final = df_final.merge(df_fires, on='time', how='left')
        
    if not df_veg.empty:
        df_final = df_final.merge(df_veg, on='time', how='left')

    if not df_ndvi.empty:
        df_final = df_final.merge(df_ndvi, on='time', how='left')
        
    # Renomeando as colunas para deixá-las mais descritivas
    colunas_descritivas = {
        'time': 'data_medicao',
        'municipio': 'nome_municipio',
        'temperature_2m_max': 'temperatura_maxima_c',
        'temperature_2m_min': 'temperatura_minima_c',
        'temperature_2m_mean': 'temperatura_media_c',
        'precipitation_sum': 'precipitacao_total_mm',
        'pm10': 'poluicao_particulas_inalaveis',
        'pm2_5': 'poluicao_particulas_finas',
        'carbon_monoxide': 'poluicao_monoxido_carbono',
        'focos_queimadas_reais': 'focos_queimadas_nasa',
        'et0_fao_evapotranspiration': 'perda_agua_solo_vegetacao',
        'vapour_pressure_deficit_max': 'estresse_hidrico_vegetacao',
        'ndvi_mean': 'indice_cobertura_vegetal',
        'cloud_cover_percent': 'percentual_nuvens'
    }
    
    df_final.rename(columns=colunas_descritivas, inplace=True)
    
    # Save to Bronze
    period_str = f"{start_date}_to_{end_date}" if start_date != end_date else start_date
    filename = f"bronze_{municipio.replace(' ', '_').lower()}_{period_str}.csv"
    filepath = BRONZE_DIR / filename
    df_final.to_csv(filepath, index=False)
    
    print(f"\nPipeline finalizado com sucesso!")
    print(f"Dados consolidados salvos em: {filepath}")
    print("\nVisualização dos dados consolidados (Head):")
    print(df_final.head())
    print("\nVisualização dos dados consolidados (Tail):")
    print(df_final.tail())

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline Bronze - Skyflora Dados Climáticos")
    parser.add_argument("--municipio", type=str, required=True, help="Nome do Município (ex: Petrópolis)")
    parser.add_argument("--data", type=str, required=True, help="Data de início da extração no formato YYYY-MM-DD")
    parser.add_argument("--data_fim", type=str, required=False, help="Data de fim da extração no formato YYYY-MM-DD")
    
    args = parser.parse_args()
    run_pipeline(args.municipio, args.data, args.data_fim)
