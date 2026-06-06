# Dicionário de Dados: Votações Ambientais

Este documento descreve a estrutura do arquivo `tabela_votacoes_ambientais.csv`, que contém os dados cruzados entre proposições legislativas relacionadas ao meio ambiente e o posicionamento (voto) de cada deputado federal.

| Nome da Coluna | Tipo de Dado | Descrição |
| :--- | :--- | :--- |
| **`Nome do Deputado`** | String | Nome parlamentar adotado pelo deputado federal. |
| **`Partido`** | String | Sigla do partido político ao qual o parlamentar está filiado no momento do registro. |
| **`UF`** | String | Sigla da Unidade da Federação (Estado) que o deputado representa. |
| **`Tipo da proposição`** | String | Sigla que identifica a espécie legislativa (Ex: `PL` = Projeto de Lei, `PEC` = Proposta de Emenda à Constituição). |
| **`Número/Ano`** | String | O número de identificação da proposição e o ano em que ela foi apresentada na Câmara. |
| **`Ementa`** | String | Texto oficial que resume a ementa, o objetivo ou o conteúdo central do projeto de lei. |
| **`Tema ambiental identificado`** | String | Conjunto de palavras-chave da API ou termos de busca que enquadraram a proposição na categoria de Meio Ambiente / Clima. |
| **`Data de apresentação`** | Date (YYYY-MM-DD) | A data oficial em que o projeto de lei foi protocolado ou apresentado na casa legislativa. |
| **`Situação atual`** | String | O status em que o projeto se encontra atualmente na sua tramitação (Ex: Arquivada, Aguardando Parecer, Pronta para Pauta). |
| **`Resultado da votação`** | String | O veredito geral da sessão plenária sobre a proposição (Ex: Aprovada, Rejeitada, Sem votação registrada). |
| **`Voto do deputado`** | String | O posicionamento individual do parlamentar na votação. **Atenção:** Votações nominais retornam `Sim`, `Não`, `Abstenção` ou `Obstrução`. Votações simbólicas ou pautas ainda não votadas retornam `N/A`. |
| **`Link oficial da proposição`** | URL | Endereço web para acompanhar toda a tramitação e histórico da proposição no Portal da Câmara dos Deputados. |
| **`Link do inteiro teor`** | URL | Endereço direto (geralmente em PDF) para a leitura do documento com o texto completo da proposta. Essencial para análises via LLM. |
