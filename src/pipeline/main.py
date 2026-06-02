"""
Documentação de Uso: main.py

Este script serve como o Ponto de Entrada (Entry Point) e um Exemplo de Execução
para o pipeline de extração de dados ambientais (Fase 2) do projeto Skyflora.

Sua utilidade principal é:
1. Validação Local: Permite testar o orquestrador (Módulos A, B e C) localmente 
   no terminal antes de fazer o deploy desse código para a nuvem (Databricks).
2. Verificação das APIs: Valida se a conexão com as APIs do Brazil Data Cube 
   (STAC e WTSS) e as bibliotecas geográficas (rasterio, netCDF4) estão funcionando.
3. Compreensão de Dados: Demonstra exatamente como chamar o orquestrador e como 
   interpretar os 4 DataFrames de retorno (NDVI, calor, temperatura, umidade).

Nota: O script está configurado como um teste rápido (short range e poucos 
municípios) para não consumir toda a memória RAM ou bloquear seu IP nas APIs.
"""

import geopandas as gpd
import pandas as pd
from shapely import wkt
import os
from pipeline.orquestrador import executar_extracao_completa

def main():
    # 1. Carregar as coordenadas geográficas criadas na Fase 1
    # Apontando para o dim_localidade.parquet na pasta data do projeto
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    caminho_parquet = os.path.join(BASE_DIR, "data", "dim_localidade.parquet")
    
    if not os.path.exists(caminho_parquet):
        print(f"Erro: O arquivo {caminho_parquet} não foi encontrado.")
        return

    print("Carregando dim_localidade.parquet...")
    # O arquivo fornecido não é um GeoParquet nativo, mas sim um Pandas normal.
    # Ele contém a geometria em formato de texto (geometria_wkt). 
    # Por isso lemos com pandas e depois convertemos!
    df = pd.read_parquet(caminho_parquet)
    df['geometry'] = df['geometria_wkt'].apply(wkt.loads)
    gdf = gpd.GeoDataFrame(df, geometry='geometry', crs="EPSG:4326")
    
    # DICA: Vamos pegar apenas o 1º município para teste.
    # Processar o Brasil todo demoraria dias/horas nesta execução local.
    gdf_teste = gdf.head(1) 
    
    # 2. Definir o range de datas! 
    # Sim, é obrigatório para as APIs (WTSS/STAC) saberem qual período extrair.
    # Vamos usar um período curto (1 dia) para acelerar o processo local.
    data_inicio = "2023-08-01"
    data_fim = "2023-08-01"

    print(f"Iniciando extração para {len(gdf_teste)} município(s) entre {data_inicio} e {data_fim}...")
    
    # 3. Executar o orquestrador
    resultados = executar_extracao_completa(gdf_teste, data_inicio, data_fim)
    
    # 4. Imprimir os resultados no terminal para visualização
    print("\n" + "="*50)
    print("--- Resultados de NDVI (Vegetação) ---")
    print("="*50)
    if not resultados["ndvi"].empty:
        print(resultados["ndvi"].head())
    else:
        print("Nenhum dado encontrado para o período/local.")
    
    print("\n" + "="*50)
    print("--- Resultados de Focos de Calor ---")
    print("="*50)
    if not resultados["focos_calor"].empty:
        print(resultados["focos_calor"].head())
    else:
        print("Nenhum dado encontrado para o período/local.")
    
    print("\n" + "="*50)
    print("--- Resultados de Temperatura (SAMeT) ---")
    print("="*50)
    if not resultados["temperatura"].empty:
        print(resultados["temperatura"].head())
    else:
        print("Nenhum dado encontrado para o período/local.")
    
    print("\n" + "="*50)
    print("--- Resultados de Umidade ---")
    print("="*50)
    if not resultados["umidade"].empty:
        print(resultados["umidade"].head())
    else:
        print("Nenhum dado encontrado para o período/local.")

if __name__ == "__main__":
    # Configura os logs do orquestrador para exibir no terminal
    import logging
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    
    main()
