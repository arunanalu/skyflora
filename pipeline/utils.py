import pystac_client
import rasterio
from rasterio.crs import CRS
from rasterio.warp import transform, Resampling, calculate_default_transform, reproject
from rasterio.windows import from_bounds
import numpy as np

from pipeline.config import STAC_ENDPOINT

def read(uri: str, bbox: tuple, masked: bool = True, crs: str = None, subdataset: str = None) -> np.ma.MaskedArray:
    """
    Lê uma janela de um raster delimitada por um bounding box.
    """
    source_crs = CRS.from_string("EPSG:4326")
    if crs:
        source_crs = CRS.from_string(crs)
    w, s, e, n = bbox
    
    open_uri = uri
    if uri.endswith(".nc") and subdataset:
        open_uri = f"netcdf:{uri}:{subdataset}"
        
    with rasterio.open(open_uri) as dataset:
        transformer = transform(source_crs, dataset.crs, [w, e], [s, n])
        window = from_bounds(
            transformer[0][0], transformer[1][0],
            transformer[0][1], transformer[1][1],
            dataset.transform,
        )
        return dataset.read(1, window=window, masked=masked)

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
    open_uri = uri
    if uri.endswith(".nc") and subdataset:
        open_uri = f"netcdf:{uri}:{subdataset}"
        
    with rasterio.open(open_uri) as dataset:
        dst_transform, width, height = calculate_default_transform(
            dataset.crs, dst_crs, dataset.width, dataset.height,
            *dataset.bounds, resolution=(resolution, resolution),
        )
        destination = np.zeros((1, height, width), dtype=np.float32)
        reproject(
            source=rasterio.band(dataset, 1),
            destination=destination,
            src_transform=dataset.transform,
            src_crs=dataset.crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            resampling=resampling,
        )
    return destination[0]

def get_stac_client() -> pystac_client.Client:
    """Retorna instância do cliente STAC do Brazil Data Cube."""
    return pystac_client.Client.open(STAC_ENDPOINT)
