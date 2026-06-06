FROM python:3.10-slim

WORKDIR /app

# Instala as bibliotecas de sistema necessárias para libs geoespaciais e processamento de dados
RUN apt-get update && apt-get install -y \
    build-essential \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Configura variáveis de ambiente necessárias para o GDAL
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código e arquivos
COPY . .

# Comando padrão
ENV PYTHONPATH=/app/src
CMD ["python", "src/pipeline/main.py"]
