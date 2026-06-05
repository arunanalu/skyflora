import argparse
import pandas as pd
import os
import sys
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.config import BRONZE_DIR, DATA_DIR
from src.extractors.open_meteo import fetch_weather
from src.extractors.open_meteo_aq import fetch_air_quality
from src.extractors.nasa_firms import fetch_fire_spots_brazil
from src.extractors.open_meteo_veg import fetch_vegetation_health
from src.extractors.satellite_ndvi import fetch_vegetation_cover
import concurrent.futures

def run_batch_extraction(start_date: str, end_date: str):
    dim_path = DATA_DIR / 'dim' / 'dim_localidade.parquet'
    if not dim_path.exists():
        print(f"Erro: Arquivo {dim_path} não encontrado.")
        return
        
    print("Carregando dimensão de localidades...")
    df_dim = pd.read_parquet(dim_path)
    
    print(f"Baixando dados de queimadas (NASA FIRMS) para o Brasil de {start_date} a {end_date}...")
    df_fires_br = fetch_fire_spots_brazil(start_date, end_date)
    if not df_fires_br.empty:
        df_fires_br['acq_date'] = pd.to_datetime(df_fires_br['acq_date']).dt.date.astype(str)
        df_fires_br.rename(columns={'latitude': 'fire_lat', 'longitude': 'fire_lon'}, inplace=True)
    
    chunk_size = 100
    total_mun = len(df_dim)
    chunks = [df_dim[i:i+chunk_size] for i in range(0, total_mun, chunk_size)]
    
    final_output_path = BRONZE_DIR / f"bronze_br_completo_{start_date.replace('-','')}_{end_date.replace('-','')}.csv"
    checkpoint_path = BRONZE_DIR / f"checkpoint_bronze_br.csv"
    
    if checkpoint_path.exists():
        os.remove(checkpoint_path)
        
    print(f"Iniciando extração em lote para {total_mun} municípios em {len(chunks)} blocos.")
    
    for idx, chunk in enumerate(chunks):
        print(f"Processando bloco {idx+1}/{len(chunks)}...")
        lats = chunk['centroid_lat'].tolist()
        lons = chunk['centroid_lon'].tolist()
        
        df_weather = fetch_weather(lats, lons, start_date, end_date)
        df_aq = fetch_air_quality(lats, lons, start_date, end_date)
        df_veg = fetch_vegetation_health(lats, lons, start_date, end_date)
        
        # Extração de NDVI em Paralelo para o chunk atual
        print(f"Baixando NDVI (Sentinel-2) em paralelo para {len(lats)} municípios...")
        ndvi_dfs = []
        
        def _fetch_ndvi(row_data):
            try:
                df = fetch_vegetation_cover(row_data['centroid_lat'], row_data['centroid_lon'], start_date, end_date)
                df['cod_ibge'] = row_data['cod_ibge']
                return df
            except Exception as e:
                print(f"Erro NDVI {row_data['cod_ibge']}: {e}")
                return pd.DataFrame()
                
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(_fetch_ndvi, row) for _, row in chunk.iterrows()]
            for future in concurrent.futures.as_completed(futures):
                res_df = future.result()
                if not res_df.empty:
                    ndvi_dfs.append(res_df)
                    
        df_ndvi_chunk = pd.concat(ndvi_dfs, ignore_index=True) if ndvi_dfs else pd.DataFrame()
        
        if df_weather.empty:
            print(f"Aviso: Dados de clima vazios para o bloco {idx+1}. Pulando.")
            continue
            
        df_chunk = df_weather.copy()
        
        if not df_aq.empty:
            df_chunk = df_chunk.merge(df_aq, on=['time', 'latitude', 'longitude'], how='left')
            
        if not df_veg.empty:
            df_chunk = df_chunk.merge(df_veg, on=['time', 'latitude', 'longitude'], how='left')
            
        df_chunk = df_chunk.merge(chunk, left_on=['latitude', 'longitude'], right_on=['centroid_lat', 'centroid_lon'], how='left')
        
        if not df_ndvi_chunk.empty:
            df_chunk = df_chunk.merge(df_ndvi_chunk, left_on=['time', 'cod_ibge'], right_on=['time', 'cod_ibge'], how='left')
        
        fire_records = []
        dates = df_chunk['time'].unique()
        
        for _, row in chunk.iterrows():
            if not df_fires_br.empty:
                mask = (
                    (df_fires_br['fire_lat'] >= row['bbox_south']) & 
                    (df_fires_br['fire_lat'] <= row['bbox_north']) &
                    (df_fires_br['fire_lon'] >= row['bbox_west']) &
                    (df_fires_br['fire_lon'] <= row['bbox_east'])
                )
                mun_fires_df = df_fires_br[mask]
                fire_counts = mun_fires_df.groupby('acq_date').size().to_dict()
                
                for d in dates:
                    fire_records.append({
                        'time': d,
                        'cod_ibge': row['cod_ibge'],
                        'focos_queimadas_reais': fire_counts.get(d, 0)
                    })
            else:
                for d in dates:
                    fire_records.append({
                        'time': d,
                        'cod_ibge': row['cod_ibge'],
                        'focos_queimadas_reais': 0
                    })
                    
        df_fire_counts = pd.DataFrame(fire_records)
        df_chunk = df_chunk.merge(df_fire_counts, on=['time', 'cod_ibge'], how='left')
        
        cols_to_drop = ['bbox_west', 'bbox_south', 'bbox_east', 'bbox_north', 'centroid_lat', 'centroid_lon', 'geometria_wkt']
        df_chunk.drop(columns=[c for c in cols_to_drop if c in df_chunk.columns], inplace=True)
        
        colunas_descritivas = {
            'time': 'data_medicao',
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
        df_chunk.rename(columns=colunas_descritivas, inplace=True)
        
        write_header = not checkpoint_path.exists()
        df_chunk.to_csv(checkpoint_path, mode='a', index=False, header=write_header)
        
    os.rename(checkpoint_path, final_output_path)
    print(f"\nExtração em lote concluída com sucesso! Arquivo final: {final_output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch Pipeline Bronze - Skyflora")
    parser.add_argument("--start-date", type=str, required=True, help="Data de início (YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, required=True, help="Data de fim (YYYY-MM-DD)")
    
    args = parser.parse_args()
    run_batch_extraction(args.start_date, args.end_date)
