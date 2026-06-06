# Dicionário de Dados: Gastos dos Deputados

Este documento descreve a estrutura do arquivo `gastos_deputados_consolidado.csv` (e suas derivações de rankings), que armazena os dados referentes ao uso da Cota para o Exercício da Atividade Parlamentar (CEAP) pelos deputados federais.

| Nome da Coluna | Tipo de Dado | Descrição |
| :--- | :--- | :--- |
| **`deputado_id`** | Integer / String | Código numérico identificador único do parlamentar no sistema (API) da Câmara dos Deputados. |
| **`deputado_nome`** | String | Nome parlamentar utilizado pelo deputado. |
| **`deputado_partido`** | String | Sigla do partido político do deputado na época em que a despesa foi efetuada. |
| **`deputado_uf`** | String | Sigla do Estado (Unidade da Federação) base do parlamentar. |
| **`ano`** | Integer | O ano civil de competência em que o gasto foi realizado. |
| **`mes`** | Integer | O mês civil (1 a 12) de competência em que o gasto foi realizado. |
| **`data_gasto`** | Date (YYYY-MM-DD) | Data de emissão exata do documento fiscal ou recibo apresentado pelo parlamentar para reembolso. |
| **`tipo_despesa`** | String | A categoria oficial na qual a despesa foi enquadrada (Ex: Emissão Bilhete Aéreo, Combustíveis e Lubrificantes, Manutenção de Escritório). |
| **`valor_documento`** | Float | O valor total bruto (em Reais) registrado na nota fiscal ou recibo original. |
| **`valor_liquido`** | Float | O valor efetivamente pago (reembolsado) ao deputado pela Câmara, após dedução de possíveis glosas ou descontos na auditoria (em Reais). |
| **`fornecedor_nome`** | String | Razão social ou nome da pessoa física/jurídica que forneceu o serviço ou produto. |
| **`fornecedor_cnpj_cpf`** | String | Documento de identificação (CNPJ ou CPF) do fornecedor que emitiu o documento fiscal. |
