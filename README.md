# 🌍 Skyflora

**Skyflora** é um projeto acadêmico (de faculdade) focado na extração, cruzamento e análise de dados provenientes de fontes e APIs públicas. O objetivo central é criar uma arquitetura de dados capaz de investigar associações e correlações entre eventos climáticos/ambientais e o comportamento político no Brasil com fins acadêmicos.

Ao disponibilizar este repositório de forma aberta, nossa intenção é que os scripts de extração, transformação e documentação possam ser livremente reaproveitados por pesquisadores, estudantes ou qualquer pessoa interessada em engenharia de dados, ciência de dados, meio ambiente e transparência governamental.

---

## 🎯 Objetivos do Projeto

- **Coleta de Dados Climáticos e Ambientais:** Extrair informações sobre temperatura, qualidade do ar, saúde da vegetação e focos de queimadas (utilizando APIs como Open-Meteo e NASA FIRMS).
- **Coleta de Dados Políticos:** Consumir Dados Abertos Governamentais (Câmara/Senado) para rastrear gastos dos parlamentares (CEAP) e o posicionamento (votos) de cada deputado em pautas relacionadas ao meio ambiente.
- **Correlação:** Construir uma base de dados que permita cruzar esses universos. Exemplo: relacionar anomalias ambientais nos municípios ou estados de um político com seus gastos públicos e suas decisões em votações ecológicas.

---

## 📂 Módulos do Repositório

O projeto é dividido em frentes independentes de extração de dados:

- 🌦️ [**`dados_climaticos/`**](./dados_climaticos): Scripts para varredura de dados meteorológicos e espaciais. Mais detalhes no [README específico do módulo](./dados_climaticos/v2/README.md).
- 🏛️ [**`dados_politicos/`**](./dados_politicos): Scripts para obtenção de votações ambientais e gastos de deputados. Mais detalhes no [README específico do módulo](./dados_politicos/README.md).

*(Nota: Para evitar sobrecarga, os arquivos gerados de dados brutos como `.csv` ou `.parquet` são ignorados no repositório remoto via `.gitignore`, devendo ser gerados localmente pela execução dos scripts).*

---

## 🚀 Como Utilizar (Reaproveitamento)

Você é livre para reaproveitar nossa lógica de extração! Cada módulo tem suas particularidades e instruções próprias. De forma geral:
1. Clone o repositório em sua máquina:
   ```bash
   git clone https://github.com/arunanalu/skyflora.git
   ```
2. Acesse a pasta do módulo desejado e instale as dependências (via `requirements.txt`).
3. Siga as instruções do README de cada módulo para rodar os scripts da pasta `src/`.

---

## 🤝 Colaboradores

Este projeto é desenvolvido com a dedicação dos seguintes colaboradores:

- **[Pedro Bataglia](https://github.com/Pedro-Bataglia)**

*(Se você faz parte do projeto, adicione seu nome aqui!)*
