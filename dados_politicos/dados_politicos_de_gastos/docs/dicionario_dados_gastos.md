# Dicionário de Dados: Gastos Consolidados (CEAP)

Este documento fornece interpretações semânticas detalhadas para a tabela `gastos_deputados_consolidado.csv`, ajudando no entendimento analítico de como a Cota para o Exercício da Atividade Parlamentar é mapeada em conjunto com informações geográficas e de mercado.

## Identificação e Geografia
| Nome da Coluna | Tipo de Dado | Descrição e Interpretação |
| :--- | :--- | :--- |
| **`deputado_id`** | Inteiro | **O que é:** Identificador unívoco do deputado na API da Câmara.<br>**Por que usar:** Ideal para atuar como *Foreign Key* (chave estrangeira) em bancos relacionais e não se perder com deputados que possuem nomes comuns/iguais. |
| **`deputado_nome`** | String | Nome político público do parlamentar. |
| **`deputado_partido`** | String | **O que é:** Partido na data do faturamento.<br>**Análise Sugerida:** Agrupar `sum(valor_liquido)` por partido é excelente para descobrir quais frentes partidárias utilizam verba pública de maneira mais intensiva. |
| **`deputado_uf`** | String | **O que é:** Unidade de Federação do deputado.<br>**Correlação Geográfica:** Norte e Nordeste costumam ter valores estratosféricos de "Passagem Aérea" devido à distância para Brasília. Analisar a UF isoladamente pode justificar (ou denunciar) comportamentos anômalos de custos logísticos. |

## Controle de Tempo
| Nome da Coluna | Tipo de Dado | Descrição e Interpretação |
| :--- | :--- | :--- |
| **`ano`** e **`mes`** | Inteiro | O ano/mês contábil na qual o limite da cota do parlamentar foi abatido. Fundamental para fazer análises de *Time Series* e agregação mensal. |
| **`data_gasto`** | Data | **O que é:** Data (`AAAA-MM-DD`) impressa no cupom fiscal.<br>**Alerta de Qualidade:** Algumas notas demoram meses para serem auditadas. A `data_gasto` reflete o dia em que o deputado usou o serviço, não o dia em que ele foi reembolsado. Excelente para verificar "uso em finais de semana ou recessos". |

## Financeiro e Categoria
| Nome da Coluna | Tipo de Dado | Descrição e Interpretação |
| :--- | :--- | :--- |
| **`tipo_despesa`** | String | **O que é:** A gaveta contábil oficial da câmara.<br>**Valores Recorrentes e Interpretações:**<br>- **`DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR`:** Costuma liderar 80% do teto. Envolve gráficas, marqueteiros e redes sociais. Monitorar altos gastos de publicidade em anos não eleitorais versus eleitorais.<br>- **`MANUTENÇÃO DE ESCRITÓRIO`:** Aluguel, IPTU, café para o comitê no estado de origem.<br>- **`COMBUSTÍVEIS E LUBRIFICANTES`:** Categoria com alta incidência de notas suspeitas (tanques abastecidos com valores humanamente impossíveis para carros convencionais num único dia). Bom alvo para cruzamento por anomalias. |
| **`valor_documento`** | Float | **O que é:** O que o prestador de serviço preencheu na nota fiscal (Bruto). |
| **`valor_liquido`** | Float | **O que é:** O que o erário público realmente tirou do cofre para reembolsar o deputado.<br>**Como ler:** Se um deputado enviou nota de R$ 5.000,00 (`valor_documento`) mas a Câmara apontou um erro e glosou (cortou) R$ 1.000, o `valor_liquido` será R$ 4.000,00. **Utilize SEMPRE o `valor_liquido` para somatórias de dinheiro público gasto**. |

## Autoria Comercial
| Nome da Coluna | Tipo de Dado | Descrição e Interpretação |
| :--- | :--- | :--- |
| **`fornecedor_nome`** | String | Nome de quem emitiu o recibo ou nota fiscal (Pessoa Física ou Jurídica). |
| **`fornecedor_cnpj_cpf`** | String | **O que é:** Documento atrelado à nota.<br>**Uso Avançado:** Uma prática comum de auditoria cidadã (ex: *Serenata de Amor*) é usar esse CNPJ em cruzamentos com a base da Receita Federal. Você pode descobrir que um deputado gastou R$ 50 mil em uma empresa onde o dono da empresa é... parente dele mesmo. Outro uso é buscar o endereço desse CNPJ. |
