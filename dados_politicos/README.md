# Skyflora: Dados Políticos

Bem-vindo ao módulo **Dados Políticos** do projeto Skyflora. Enquanto o módulo principal (Dados Climáticos) foca na extração e transformação de informações meteorológicas, de qualidade do ar e de uso do solo, este módulo foi idealizado para introduzir uma nova dimensão de análise: o **comportamento político e os gastos públicos**.

O objetivo final de integrar esses dados é possibilitar futuras correlações e análises aprofundadas. Por exemplo: cruzar o posicionamento de parlamentares em votações sobre o meio ambiente com a ocorrência de anomalias ambientais (como queimadas ou desmatamento) em seus estados ou municípios de base, bem como analisar o direcionamento de gastos.

---

## 🏗️ Estrutura do Módulo

Este módulo é composto por duas frentes principais de extração, cada uma em seu respectivo submódulo:

### 1. Dados Políticos Ambientais (`dados_politicos_ambientais/`)
Focado na obtenção de dados sobre como temas relacionados ao meio ambiente estão sendo votados por cada parlamentar.
- **`src/`**: Scripts de coleta de dados das APIs da Câmara/Senado (ex: `coleta_ambiental.py`).
- **`data/`**: Arquivos CSV gerados com as votações ambientais e posicionamentos dos deputados.
- **`docs/`**: Documentação específica do processo de coleta ambiental.

### 2. Dados Políticos de Gastos (`dados_politicos_de_gastos/`)
Focado em extrair dados de transparência pública referentes aos gastos (Cota para o Exercício da Atividade Parlamentar - CEAP) por deputado.
- **`src/`**: Scripts de extração (individual e em lote) e análise exploratória dos gastos.
- **`data/`**: Arquivos CSV consolidados com gastos e rankings (por deputado e por partido).
- **`docs/`**: Documentação técnica da integração com os portais de transparência.

---

## 🚀 Integração com o Ecossistema Skyflora

Esses dados seguem a mesma premissa do módulo de clima:
- Coletados via **APIs Públicas** governamentais (ex: Dados Abertos da Câmara dos Deputados).
- Transformados para o formato tabular padrão (CSV/Parquet) na Camada Bronze.
- Preparados para cruzamento geográfico e temporal com a malha do IBGE e dados satelitais na futura pipeline analítica.
