# Plano de Otimização: Paralelização (Multithreading) e Barra de Progresso

## 1. Visão Geral do Problema
Atualmente, o pipeline de extração da Fase 2 opera de maneira **sequencial**. Como a leitura dos arquivos de satélite (NetCDF e Cloud Optimized GeoTIFF) diretamente das APIs do INPE (Brazil Data Cube) depende da latência de rede (tarefa *I/O-Bound*), a CPU passa a maior parte do tempo "esperando" os dados chegarem. Para sanar isso, vamos modernizar a arquitetura local introduzindo processamento paralelo e transparência visual.

---

## 2. Feature 1: Transparência com Barras de Progresso (`tqdm`)

### Objetivo
Fornecer um feedback visual no terminal mostrando:
- Quantos itens já foram processados.
- Tempo decorrido.
- Tempo estimado para conclusão (ETA).
- Taxa de transferência (iterações por segundo).

### Como Implementar
Instalar a biblioteca `tqdm` (`pip install tqdm`) e injetá-la nos loops mais pesados.

**1. No Orquestrador (Loop de Municípios):**
```python
from tqdm import tqdm

def executar_extracao_completa(municipios_gdf, start_date, end_date):
    # ...
    # Envolver o iterrows com tqdm
    for _, row in tqdm(municipios_gdf.iterrows(), total=len(municipios_gdf), desc="Processando Municípios"):
        # Execução dos módulos
```

**2. Nos Módulos B e C (Loop de Dias/Imagens STAC):**
Onde hoje o código faz um `for item in items:`, substituiremos por um `tqdm` interno focado naquele município.

---

## 3. Feature 2: Paralelização Multithread (`concurrent.futures`)

### Objetivo
Fazer múltiplas requisições HTTP e downloads de matrizes simultaneamente. Como as bibliotecas GDAL/rasterio rodam por baixo dos panos (em C/C++), elas liberam o GIL (Global Interpreter Lock) do Python, o que torna as *Threads* a solução ideal em vez de *Multiprocessing*.

### Estratégia de Arquitetura Proposta

Recomendamos paralelizar as requisições **no nível dos Módulos (Nível Macro)** dentro do `orquestrador.py`. Isso significa que, para um dado município, faremos as requisições de NDVI, Temperatura, Focos de Calor e Umidade **ao mesmo tempo**, acelerando a execução de um município em até 4x.

**Exemplo de Implementação no `orquestrador.py`:**

```python
import concurrent.futures

def processar_municipio_concorrente(row, start_date, end_date):
    cod_ibge = row["cod_ibge"]
    centroid = row.geometry.centroid
    bbox = tuple(row.geometry.bounds)
    
    resultados = {}
    
    # Pool de threads para executar os 4 extratores simultaneamente
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        # Agenda as tarefas
        futuro_ndvi = executor.submit(extrair_ndvi_municipio, centroid.y, centroid.x, cod_ibge, start_date, end_date)
        futuro_focos = executor.submit(extrair_focos_calor_municipio, bbox, cod_ibge, start_date, end_date)
        futuro_temp = executor.submit(extrair_temperatura_municipio, bbox, cod_ibge, start_date, end_date)
        futuro_umidade = executor.submit(extrair_umidade_municipio, bbox, cod_ibge, start_date, end_date)
        
        # Coleta os resultados à medida que terminam
        resultados['ndvi'] = futuro_ndvi.result()
        resultados['focos'] = futuro_focos.result()
        resultados['temp'] = futuro_temp.result()
        resultados['umidade'] = futuro_umidade.result()
        
    return resultados
```

### Cuidados de Segurança (Rate Limiting)
A principal vulnerabilidade ao usar multithreading é disparar um bloqueio de IP pelas APIs governamentais por excesso de requisições (comportamento análogo a um ataque DDoS).
- **Contramedida:** Travar o `max_workers` entre `4` e `8` (no máximo).
- **Contramedida 2:** Nos extratores do STAC (que geram muitos downloads do GOES no mesmo dia), se resolvermos paralelizar os *dias internamente*, devemos embutir um retry nativo com *backoff exponencial* caso a API retorne um erro `HTTP 429 Too Many Requests`.

---

## 4. Próximos Passos (Ação Requerida)

1. Aprovar a adição da biblioteca `tqdm` aos requisitos do projeto (Fase 2).
2. Refatorar o arquivo `src/pipeline/orquestrador.py` para injetar o `ThreadPoolExecutor` como desenhado acima.
3. Se a carga diária for muito massiva (> 30 dias de STAC de uma vez), podemos aplicar um segundo nível de paralelismo isolado dentro do arquivo `modulo_b_temperatura.py`.
