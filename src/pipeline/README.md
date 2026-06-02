# Skyflora - Documentação de Execução Local

Este documento descreve a utilidade e a forma de uso do script `main.py`, que atua como o ponto de entrada (entry point) para testes locais do pipeline de extração de dados ambientais do projeto Skyflora.

## 1. O que é o `main.py`?

O arquivo **`main.py`** é um script de demonstração e validação local (Mock) focado em executar a arquitetura construída na **Fase 2**. Diferente da implantação final na nuvem (que usará Databricks e PySpark processando de forma distribuída para todo o Brasil), o `main.py` foi desenhado para ser executado diretamente no seu terminal ou IDE.

## 2. Qual a sua Utilidade?

A sua utilidade se baseia em três pilares principais essenciais para a engenharia e ciência de dados do projeto:

### A. Validação Local (Ambiente de Testes)
Antes de subir o código para a nuvem (Fase 3), o `main.py` permite garantir que todo o pacote `pipeline` (Módulos A, B, C e Orquestrador) está sem erros de sintaxe, importações ou lógica. Atua como um ambiente isolado para homologação do código base.

### B. Verificação de Redes, Dependências e APIs
O pipeline geoespacial depende das APIs do Brazil Data Cube (STAC e WTSS). Ao rodar o `main.py`, o desenvolvedor confirma que:
* As bibliotecas complexas (ex: `rasterio`, `netCDF4`, `geopandas`) foram instaladas corretamente no ambiente atual e funcionam sem conflito de binários.
* A rede/IP não está sofrendo de bloqueios de firewall que impeçam a comunicação com os endpoints abertos do INPE.

### C. Compreensão Prática de Dados
Para cientistas de dados que irão manipular esses indicadores para gerar a "Tabela Ouro" (Fase 4), o script apresenta como interagir com o orquestrador. Ele exibe em tela (via `print`) a "cabeça" (`.head()`) dos DataFrames retornados. Isso revela com clareza a estrutura física final dos dados (tipos numéricos, nomes exatos de colunas e organização de datas), o que serve de "contrato vivo" de dados antes do cruzamento final.

## 3. Como funciona a Execução?

De forma proativa, o script está configurado com limites de segurança rígidos:
1. **Restrição Geográfica:** Carrega a malha geográfica no arquivo `dim_localidade.parquet` e limita o escopo filtrando **apenas 2 municípios**.
2. **Restrição Temporal:** Define um range estreito e imutável de apenas **5 dias** de extração.

**Por que essas restrições?**
Processar anos de histórico para milhares de municípios sobrecarregaria as APIs satelitais do INPE, exigiria uma quantidade massiva de memória RAM da máquina local e a execução demoraria horas ou dias. O limite garante testes com *feedback* quase imediato.

## 4. Como Executar

Garanta que seu ambiente virtual Python esteja ativado e todas as dependências estejam instaladas (conforme definido no setup da Fase 2).

Navegue pelo seu terminal até a pasta do projeto:
```bash
cd /caminho/para/o/projeto/skyflora
```

Execute o arquivo:
```bash
python main.py
```

Você verá na tela do console, em blocos organizados, os dados diários representativos dos **Focos de Calor**, **NDVI (Vegetação)**, **Temperatura** e **Umidade** referentes ao intervalo de teste.
