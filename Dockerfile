FROM python:3.10-slim

WORKDIR /app

# Instala as bibliotecas de sistema necessárias para libs geoespaciais (se necessário para builds futuros)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código e arquivos (incluindo dim_localidade.parquet)
COPY . .

# Comando padrão
ENV PYTHONPATH=/app/src
CMD ["python", "src/pipeline/main.py"]
