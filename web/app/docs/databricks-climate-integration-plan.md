# Plano: Integracao granular de clima com Databricks

Este plano cobre a primeira troca real dos dados mockados da tela de clima por dados estaduais vindos do Databricks, mantendo o BFF do Next.js como fronteira entre UI e banco.

Escopo desta etapa:
- Validar conexao do BFF com o Databricks.
- Ler a base estadual consolidada de clima, inicialmente no recorte `Dezembro 2024`.
- Mapear os dados brutos para o contrato consumido pelos componentes de clima.
- Substituir apenas a tela de clima, preservando politica e CO2 como mocks por enquanto.

Fora do escopo desta etapa:
- Integracao municipal/drill-down real.
- Integracao de dados politicos.
- Integracao de CO2.
- Deploy em producao.

## 1. Premissas e seguranca

- O backend atual e o BFF do Next.js em `web/app/src/app/api`.
- O projeto roda em Node/Next.js, entao a conexao deve usar o pacote SQL oficial do Databricks para Node, reaproveitando os mesmos valores presentes na string JDBC.
- Nenhum token, senha ou string JDBC completa deve ser salvo em arquivo versionado.
- Credenciais devem ficar apenas em `.env.local`.
- O repositorio deve ter um `.env.example` ou documentacao sem segredos, contendo somente os nomes das variaveis.
- Caso o nome completo da tabela Databricks ainda nao esteja confirmado, a primeira execucao deve incluir uma task de descoberta via `SHOW CATALOGS`, `SHOW SCHEMAS`, `SHOW TABLES` ou consulta em `information_schema.tables`.

## 2. Variaveis de ambiente propostas

Adicionar em `.env.local` localmente:

```env
DATABRICKS_SERVER_HOSTNAME=
DATABRICKS_HTTP_PATH=
DATABRICKS_TOKEN=
DATABRICKS_CATALOG=
DATABRICKS_SCHEMA=
DATABRICKS_CLIMATE_STATE_TABLE=
CLIMATE_DATA_SOURCE=databricks
```

Adicionar em arquivo versionavel, sem valores reais:

```env
DATABRICKS_SERVER_HOSTNAME=
DATABRICKS_HTTP_PATH=
DATABRICKS_TOKEN=
DATABRICKS_CATALOG=
DATABRICKS_SCHEMA=
DATABRICKS_CLIMATE_STATE_TABLE=
CLIMATE_DATA_SOURCE=mock
```

## 3. Contrato de dados observado no CSV anexo

Arquivo de referencia local:

`C:/Users/phoen/Downloads/skyflora_silver_climbrasil_estado_dez2024.csv`

Colunas relevantes para a primeira integracao:

- Identificacao: `uf`, `estado`, `periodo_referencia`, `data_processamento`, `timestamp_processamento`
- Cobertura: `quantidade_municipios`, `quantidade_registros_origem`
- Temperatura: `temperatura_media_c`, `temperatura_minima_c`, `temperatura_maxima_c`, `temperatura_desvio_padrao_c`
- Chuva: `precipitacao_total_mm`, `precipitacao_media_mm`, `precipitacao_maxima_mm`, `precipitacao_minima_mm`
- Solo/vegetacao: `perda_agua_solo_vegetacao_media`, `perda_agua_solo_vegetacao_maxima`, `perda_agua_solo_vegetacao_minima`, `estresse_hidrico_vegetacao_medio`, `indice_cobertura_vegetal_medio`
- Atmosfera/poluicao: `poluicao_particulas_inalaveis_media`, `poluicao_particulas_finas_media`, `poluicao_monoxido_carbono_media`, `percentual_nuvens_medio`
- Queimadas: `focos_queimadas_nasa_total`, `focos_queimadas_nasa_medio`, `focos_queimadas_nasa_maximo`

## 4. Mapeamento inicial para a UI

O contrato atual de `ClimateData` contem:

```ts
{
  stateId: string;
  temperature: number;
  atmosphereQuality: number;
  soilMoisture: number;
  month: number;
  year: number;
}
```

Para reduzir risco, a primeira troca deve preservar estes campos e adicionar campos detalhados opcionais.

Mapeamento minimo:

- `stateId` <- `uf`
- `stateName` <- `estado`
- `temperature` <- `temperatura_media_c`
- `temperatureMin` <- `temperatura_minima_c`
- `temperatureMax` <- `temperatura_maxima_c`
- `temperatureStdDev` <- `temperatura_desvio_padrao_c`
- `atmosphereQuality` <- indice normalizado derivado dos poluentes, para manter compatibilidade visual temporaria
- `pm10Mean` <- `poluicao_particulas_inalaveis_media`
- `pm25Mean` <- `poluicao_particulas_finas_media`
- `carbonMonoxideMean` <- `poluicao_monoxido_carbono_media`
- `soilMoisture` <- indice normalizado derivado de `perda_agua_solo_vegetacao_media` e `estresse_hidrico_vegetacao_medio`, para manter compatibilidade visual temporaria
- `vegetationWaterLossMean` <- `perda_agua_solo_vegetacao_media`
- `vegetationWaterStressMean` <- `estresse_hidrico_vegetacao_medio`
- `vegetationCoverIndexMean` <- `indice_cobertura_vegetal_medio`
- `precipitationTotalMm` <- `precipitacao_total_mm`
- `fireSpotsTotal` <- `focos_queimadas_nasa_total`
- `month` e `year` <- parametros da rota ou parsing de `periodo_referencia`
- `referencePeriod` <- `periodo_referencia`
- `processedAt` <- `timestamp_processamento`

Observacao: os indices normalizados de `atmosphereQuality` e `soilMoisture` devem ser documentados no mapper e tratados como uma compatibilidade temporaria da UI. Em uma etapa posterior, os componentes devem exibir diretamente metricas reais como PM2.5, PM10, CO, perda de agua e estresse hidrico.

## 5. Tasks granulares

### Task 1: Preparar configuracao segura

- [ ] Criar ou atualizar `.env.example` em `web/app` com variaveis Databricks sem valores reais.
- [ ] Garantir que `.env.local` esteja ignorado pelo Git.
- [ ] Adicionar leitura centralizada de variaveis em um modulo server-only, por exemplo `src/infrastructure/config/env.ts`.
- [ ] Validar mensagens de erro claras quando uma variavel obrigatoria estiver ausente.

Resultado esperado: o app sabe se deve usar `mock` ou `databricks` sem expor segredos.

### Task 2: Adicionar dependencia do conector Databricks

- [ ] Adicionar `@databricks/sql` ao `package.json`.
- [ ] Confirmar compatibilidade com Next.js server runtime.
- [ ] Garantir que o codigo Databricks nunca seja importado por componentes client.

Resultado esperado: dependencia instalada e disponivel somente no BFF/server.

### Task 3: Criar cliente Databricks server-side

- [ ] Criar `src/infrastructure/databricks/DatabricksSqlClient.ts`.
- [ ] Configurar conexao usando `server_hostname`, `http_path` e token vindos de env.
- [ ] Implementar helper `withDatabricksSession<T>()` para abrir sessao, executar callback e fechar recursos.
- [ ] Adicionar tratamento de erro sem vazar token ou string de conexao.

Resultado esperado: um ponto unico e testavel para acesso SQL.

### Task 4: Criar endpoint interno de healthcheck

- [ ] Criar `GET /api/health/databricks`.
- [ ] Executar uma consulta minima, como `SELECT 1 AS ok`.
- [ ] Retornar `{ ok: true }` em sucesso.
- [ ] Retornar status `503` com erro sanitizado em falha.
- [ ] Marcar rota como dinamica para nao cachear healthcheck.

Resultado esperado: conexao validavel pelo BFF antes de trocar a UI.

### Task 5: Descobrir e confirmar a tabela climatica

- [ ] Se `DATABRICKS_CLIMATE_STATE_TABLE` estiver preenchida, validar `SELECT COUNT(*)`.
- [ ] Se nao estiver preenchida, executar descoberta por catalog/schema/tables procurando nomes relacionados a `skyflora`, `climbrasil`, `clima`, `estado` e `dez2024`.
- [ ] Confirmar que a tabela contem as colunas observadas no CSV anexo.
- [ ] Registrar no plano de execucao qual nome totalmente qualificado sera usado: `catalog.schema.table`.

Resultado esperado: tabela real identificada e validada.

### Task 6: Definir DTO Databricks

- [ ] Criar `src/data/dtos/DatabricksClimateStateDTO.ts`.
- [ ] Tipar todas as colunas usadas na primeira tela.
- [ ] Permitir `null` para campos que podem vir como `NaN`/nulo, como `indice_cobertura_vegetal_medio`.
- [ ] Criar fixtures de teste com linhas reais anonimizadas do CSV.

Resultado esperado: formato bruto do Databricks isolado da UI.

### Task 7: Expandir entidade de dominio de clima

- [ ] Atualizar `src/domain/entities/ClimateData.ts`.
- [ ] Preservar campos atuais para nao quebrar `InteractiveMap`, `NationalTable` e `StateDetailsModal`.
- [ ] Adicionar campos opcionais detalhados para temperatura, atmosfera, solo, chuva, queimadas e metadados.
- [ ] Evitar `any` no contrato publico.

Resultado esperado: UI atual continua funcionando e passa a poder exibir metricas reais.

### Task 8: Criar mapper Databricks -> ClimateData

- [ ] Criar `src/data/mappers/mapDatabricksClimateStateToClimateData.ts`.
- [ ] Converter nomes snake_case do Databricks para camelCase.
- [ ] Converter `NaN`, strings vazias e nulos para `null` ou valores fallback controlados.
- [ ] Implementar normalizacao temporaria de atmosfera e solo.
- [ ] Testar mapeamento com amostra do CSV.

Resultado esperado: conversao previsivel, testada e independente do endpoint.

### Task 9: Criar DatabricksClimateRepository

- [ ] Criar `src/data/repositories/DatabricksClimateRepository.ts`.
- [ ] Implementar `getClimateData(month, year)`.
- [ ] Montar SQL parametrizado ou sanitizado por whitelist para periodo.
- [ ] Ordenar resultado por `uf`.
- [ ] Retornar `ClimateData[]` via mapper.
- [ ] Tratar tabela vazia retornando array vazio.

Resultado esperado: repositorio real com o mesmo metodo usado pelo mock.

### Task 10: Criar factory de repositorio do BFF

- [ ] Criar `src/data/repositories/createDataRepository.ts` ou equivalente.
- [ ] Usar `CLIMATE_DATA_SOURCE=mock|databricks`.
- [ ] Manter politica e CO2 no `MockRepository`.
- [ ] Trocar apenas a origem de `getClimateData` quando a flag estiver em `databricks`.

Resultado esperado: troca granular sem afetar outras secoes.

### Task 11: Atualizar rota `/api/climate`

- [ ] Substituir instancia direta de `MockRepository` pela factory.
- [ ] Validar `month` e `year`.
- [ ] Retornar `400` para parametros invalidos.
- [ ] Adicionar cache/revalidate apenas apos a conexao real estar validada.
- [ ] Manter resposta no formato `ClimateData[]`.

Resultado esperado: endpoint de clima pronto para mock ou Databricks por configuracao.

### Task 12: Atualizar testes do BFF

- [ ] Ajustar teste atual que assume mock fixo.
- [ ] Testar parametros validos e invalidos.
- [ ] Testar erro sanitizado do repositorio.
- [ ] Testar mapper com fixtures reais.
- [ ] Evitar testes unitarios que dependam de conexao Databricks real.

Resultado esperado: suite local confiavel sem depender de rede.

### Task 13: Criar teste manual de conexao real

- [ ] Com `.env.local` configurado, subir o app local.
- [ ] Acessar `/api/health/databricks`.
- [ ] Acessar `/api/climate?month=12&year=2024`.
- [ ] Confirmar retorno com 27 UFs.
- [ ] Conferir uma UF conhecida contra o CSV anexo, por exemplo `AC`, `BA` ou `DF`.

Resultado esperado: conexao Databricks validada via backend.

### Task 14: Integrar dados reais na tela de clima

- [ ] Remover `month=12&year=2024` hardcoded em `page.tsx` e usar `climateDate` do store.
- [ ] Atualizar fetch quando `climateDate` mudar.
- [ ] Adicionar estado de loading/erro simples para clima.
- [ ] Garantir que mapa e tabela recebam o array real completo.
- [ ] Garantir que politica e CO2 ainda nao dependam dos dados de clima.

Resultado esperado: tela de clima consome dados reais por periodo.

### Task 15: Ajustar componentes de visualizacao de clima

- [ ] Atualizar `NationalTable` para usar `stateName` quando disponivel.
- [ ] Atualizar labels:
  - `temperatura`: temperatura media em graus Celsius.
  - `atmosfera`: metrica atmosferica principal e/ou indice temporario.
  - `solo`: metrica de solo/vegetacao principal e/ou indice temporario.
- [ ] Atualizar `StateDetailsModal` para exibir min/media/max de temperatura reais.
- [ ] Exibir PM2.5, PM10 e CO na aba de atmosfera quando disponiveis.
- [ ] Exibir perda de agua, estresse hidrico, cobertura vegetal e precipitacao na aba de solo quando disponiveis.

Resultado esperado: componentes deixam de inferir valores falsos como `temperature + 5`.

### Task 16: Verificacao visual

- [ ] Rodar `npm run lint`.
- [ ] Rodar testes do projeto.
- [ ] Subir o dev server.
- [ ] Abrir a tela no browser.
- [ ] Validar mapa, tabela e modal nos filtros `temperatura`, `atmosfera` e `solo`.
- [ ] Conferir que textos nao estouram em desktop e mobile.

Resultado esperado: tela funcional, com dados reais e sem regressao visual evidente.

## 6. Ordem recomendada de execucao

1. Tasks 1 a 4 para validar conexao.
2. Task 5 para confirmar tabela.
3. Tasks 6 a 12 para construir a camada de dados com testes.
4. Task 13 para prova real via BFF.
5. Tasks 14 a 16 para ligar a UI e verificar visualmente.

## 7. Criterios de aceite

- `/api/health/databricks` retorna sucesso com credenciais locais validas.
- `/api/climate?month=12&year=2024` retorna dados estaduais reais vindos do Databricks.
- O retorno de `/api/climate` segue `ClimateData[]` e inclui todos os estados disponiveis na tabela.
- A tela de clima mostra temperatura por estado com valores reais.
- A tela de clima mostra atmosfera por estado com dados derivados dos campos reais de poluicao/atmosfera.
- A tela de clima mostra solo por estado com dados derivados dos campos reais de solo/vegetacao.
- Dados mockados continuam disponiveis via `CLIMATE_DATA_SOURCE=mock`.
- Nenhum segredo fica salvo em arquivo versionado.
