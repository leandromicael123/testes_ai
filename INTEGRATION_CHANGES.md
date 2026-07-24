# Alterações de integração

## 1. Copiar o módulo

Copiar `src/api/inputEvaluator` para o projeto `edoclink-ai`, mantendo exatamente o nome camelCase `inputEvaluator`.

O módulo segue uma estrutura plana. Não é necessário criar uma pasta `config`:

- catálogo e definições: `inputEvaluatorCatalog.ts`;
- prompt de produção: `inputEvaluatorPrompt.ts`;
- schemas Zod e tipos: `inputEvaluatorModel.ts`;
- casos de teste: `__tests__/inputEvaluatorCases.json`.

## 2. Registar a rota

Em `src/server.ts`:

```ts
import { inputEvaluatorRouter } from "@/api/inputEvaluator/inputEvaluatorRouter";
```

Adicionar nas rotas:

```ts
app.use("/input-evaluator", inputEvaluatorRouter);
```

## 3. Registar o OpenAPI

Em `src/api-docs/openAPIDocumentGenerator.ts`:

```ts
import { inputEvaluatorRegistry } from "@/api/inputEvaluator/inputEvaluatorRouter";
```

Adicionar `inputEvaluatorRegistry` ao `new OpenAPIRegistry([...])`.

## 4. Responsabilidades

O modelo devolve apenas a classificação linguística definida no schema:

- intenção;
- confiança linguística;
- alvo;
- entidades;
- filtros;
- slots em falta;
- clarificação;
- reason code;
- indicação de possível prompt injection.

O backend consulta `intentCatalog` em `inputEvaluatorCatalog.ts` para obter:

- risco;
- política de confirmação;
- executor.

Esses campos não podem ser produzidos pelo LLM.

## 5. Testes

Testes isolados e determinísticos:

```powershell
yarn vitest run src/api/inputEvaluator/__tests__ --exclude "**/*.live.test.ts"
```

Benchmark com o modelo real:

```powershell
$env:RUN_LIVE_INPUT_EVALUATOR_TESTS="true"
$env:INPUT_EVALUATOR_MIN_ACCURACY="0.85"
yarn vitest run src/api/inputEvaluator/__tests__/inputEvaluatorClassification.live.test.ts
```

Filtrar casos ou reduzir custos:

```powershell
$env:INPUT_EVALUATOR_CASE_FILTER="search"
$env:INPUT_EVALUATOR_MAX_CASES="5"
```
