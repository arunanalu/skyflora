import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / 'data'
BRONZE_DIR = DATA_DIR / 'bronze'

# Ensure directories exist
BRONZE_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / 'dim').mkdir(parents=True, exist_ok=True)
