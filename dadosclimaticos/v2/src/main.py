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
from src.extractors.nasa_firms import fetch_fire_spots
from src.extractors.open_meteo_veg import fetch_vegetation_health

def run_pipeline(municipio: str, date: str):
    print(f"Iniciando extração para {municipio} na data {date}...")
    
    lat, lon = get_coordinates(municipio)
    if lat is None or lon is None:
        print(f"Erro: Não foi possível encontrar as coordenadas para {municipio}.")
        return

    print(f"Coordenadas obtidas: Lat {lat}, Lon {lon}")
    
    print("Buscando dados de Clima...")
    df_weather = fetch_weather(lat, lon, date)
    
    print("Buscando dados de Qualidade do Ar...")
    df_aq = fetch_air_quality(lat, lon, date)
    
    print("Buscando dados de Queimadas (NASA FIRMS)...")
    df_fires = fetch_fire_spots(lat, lon, date)
    
    print("Buscando dados de Saúde da Vegetação (Open-Meteo Evapotranspiração/VPD)...")
    df_veg = fetch_vegetation_health(lat, lon, date)
    
    # Consolidação
    print("Consolidando os dados...")
    df_final = pd.DataFrame({'time': [date], 'municipio': [municipio], 'latitude': [lat], 'longitude': [lon]})
    
    if not df_weather.empty:
        df_final = df_final.merge(df_weather, on='time', how='left')
    
    if not df_aq.empty:
        df_final = df_final.merge(df_aq, on='time', how='left')
        
    if not df_fires.empty:
        df_final = df_final.merge(df_fires, on='time', how='left')
        
    if not df_veg.empty:
        df_final = df_final.merge(df_veg, on='time', how='left')
        
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
        'focos_queimadas_fallback': 'focos_queimadas_mock',
        'et0_fao_evapotranspiration': 'perda_agua_solo_vegetacao',
        'vapour_pressure_deficit_max': 'estresse_hidrico_vegetacao'
    }
    
    df_final.rename(columns=colunas_descritivas, inplace=True)
    
    # Save to Bronze
    filename = f"bronze_{municipio.replace(' ', '_').lower()}_{date}.csv"
    filepath = BRONZE_DIR / filename
    df_final.to_csv(filepath, index=False)
    
    print(f"\nPipeline finalizado com sucesso!")
    print(f"Dados consolidados salvos em: {filepath}")
    print("\nVisualização dos dados consolidados:")
    print(df_final.head())

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline Bronze - Skyflora Dados Climáticos")
    parser.add_argument("--municipio", type=str, required=True, help="Nome do Município (ex: Petrópolis)")
    parser.add_argument("--data", type=str, required=True, help="Data da extração no formato YYYY-MM-DD")
    
    args = parser.parse_args()
    run_pipeline(args.municipio, args.data)
