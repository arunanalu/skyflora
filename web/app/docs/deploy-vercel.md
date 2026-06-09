# Deploy na Vercel

Para a integracao com Databricks funcionar online do mesmo jeito que localmente, basta configurar as variaveis de ambiente do projeto na Vercel e fazer o deploy da app `web/app`.

## Variaveis obrigatorias

Configure em **Project Settings > Environment Variables**:

```env
DATABRICKS_SERVER_HOSTNAME=dbc-04286ca6-02ee.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/f81d1bc903b87d84
DATABRICKS_TOKEN=<token-databricks>
DATABRICKS_CLIMATE_STATE_TABLE=skyflora.silver.clima_brasil_estado_dez2024
CLIMATE_DATA_SOURCE=databricks
```

Use os mesmos valores em Production, Preview e Development se todos os ambientes puderem consultar o mesmo warehouse.

## Observacoes importantes

- `DATABRICKS_TOKEN` deve ser marcado como secret e nunca deve ser versionado.
- `CLIMATE_DATA_SOURCE=databricks` liga a rota `/api/climate` no Databricks.
- `CLIMATE_DATA_SOURCE=mock` mantem a rota em dados mockados, util para previews sem credencial.
- As rotas Databricks rodam com `runtime = 'nodejs'`, nao Edge Runtime.
- O pacote `@databricks/sql` esta em `serverExternalPackages` no `next.config.ts`, entao fica restrito ao lado servidor.

## Validacao pos-deploy

Apos o deploy, valide:

```bash
curl https://<seu-dominio>/api/health/databricks
curl "https://<seu-dominio>/api/climate?month=12&year=2024"
```

Resultado esperado:

- `/api/health/databricks` retorna `{"ok":true}`.
- `/api/climate?month=12&year=2024` retorna um array com 27 UFs.

Se a healthcheck retornar `503`, revise principalmente `DATABRICKS_TOKEN`, `DATABRICKS_SERVER_HOSTNAME` e `DATABRICKS_HTTP_PATH`.
