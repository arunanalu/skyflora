import pystac_client
import rasterio
from rasterio.crs import CRS
from rasterio.warp import transform, Resampling, calculate_default_transform, reproject
from rasterio.windows import from_bounds
import numpy as np

from pipeline.config import STAC_ENDPOINT

import os
import urllib.request

def _get_local_path(uri: str) -> str:
    """
    Baixa o arquivo para um cache local se for HTTP, contornando o erro de vsicurl/userfaultfd no Docker Windows.
    No Databricks (Linux nativo), o `/vsicurl/` funciona perfeitamente, então podemos pular o cache.
    """
    if not uri.startswith("http"):
        return uri
        
    use_cache = os.environ.get("USE_LOCAL_CACHE", "false").lower() == "true"
    
    if not use_cache:
        return f"/vsicurl/{uri}"
    
    cache_dir = "/tmp/skyflora_cache"
    os.makedirs(cache_dir, exist_ok=True)
    
    filename = uri.split("/")[-1]
    local_path = os.path.join(cache_dir, filename)
    
    if not os.path.exists(local_path):
        #print(f"INFO: Baixando {uri} para {local_path}...")
        urllib.request.urlretrieve(uri, local_path)
        
    return local_path

def read(uri: str, bbox: tuple, masked: bool = True, crs: str = None, subdataset: str = None) -> np.ma.MaskedArray:
    """
    Lê uma janela de um raster delimitada por um bounding box.
    """
    source_crs = CRS.from_string("EPSG:4326")
    if crs:
        source_crs = CRS.from_string(crs)
    w, s, e, n = bbox
    
    local_uri = _get_local_path(uri)
    open_uri = local_uri
        
    if local_uri.endswith(".nc") and subdataset:
        open_uri = f"netcdf:{local_uri}:{subdataset}"
        
    with rasterio.open(open_uri) as dataset:
        dataset_crs = dataset.crs
        if dataset_crs is None:
            dataset_crs = CRS.from_string("EPSG:4326")
            
        transformer = transform(source_crs, dataset_crs, [w, e], [s, n])
        window = from_bounds(
            transformer[0][0], transformer[1][0],
            transformer[0][1], transformer[1][1],
            dataset.transform,
        )
        data = dataset.read(1, window=window, masked=masked)
        if masked and np.ma.is_masked(data):
            data = data.filled(np.nan)
            
        scale = dataset.scales[0] if dataset.scales else 1.0
        offset = dataset.offsets[0] if dataset.offsets else 0.0
        if scale != 1.0 or offset != 0.0:
            data = data * scale + offset
            
        return data

def remap(
    uri: str,
    bbox: tuple,
    resolution: float = 0.02,
    dst_crs: str = "EPSG:4326",
    resampling=Resampling.bilinear,
    subdataset: str = "CMI"
) -> np.ndarray:
    """
    Reprojeta um raster de projeção geoestacionária para EPSG:4326.
    """
    local_uri = _get_local_path(uri)
    open_uri = local_uri
        
    if local_uri.endswith(".nc") and subdataset:
        open_uri = f"netcdf:{local_uri}:{subdataset}"
        
    with rasterio.open(open_uri) as dataset:
        w, s, e, n = bbox
        width = int(np.ceil((e - w) / resolution))
        height = int(np.ceil((n - s) / resolution))
        
        dst_transform = rasterio.transform.from_bounds(w, s, e, n, width, height)
        destination = np.full((1, height, width), np.nan, dtype=np.float32)
        
        dataset_crs = dataset.crs
        if dataset_crs is None:
            dataset_crs = CRS.from_string("EPSG:4326")
            
        reproject(
            source=rasterio.band(dataset, 1),
            destination=destination,
            src_transform=dataset.transform,
            src_crs=dataset_crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            dst_nodata=np.nan,
            resampling=resampling,
        )
        
        scale = dataset.scales[0] if dataset.scales else 1.0
        offset = dataset.offsets[0] if dataset.offsets else 0.0
        if scale != 1.0 or offset != 0.0:
            destination = destination * scale + offset
            
    return destination[0]

def get_stac_client() -> pystac_client.Client:
    """Retorna instância do cliente STAC do Brazil Data Cube."""
    return pystac_client.Client.open(STAC_ENDPOINT)
