# edoclink Intent Router v2

Implementação do `inputEvaluator` baseada no prompt de produção, JSON Schema e catálogo de intenções fornecidos.

Principais alterações:

- `CREATE_DOCUMENT_DRAFT` e `CREATE_FOLDER_DRAFT` substituem ações de criação imediata.
- O output do modelo não contém risco, confirmação nem executor.
- `available_intents` é injetado pelo backend a partir do catálogo, não pelo cliente.
- Os objetos Zod usam `.strict()` para aplicar `additionalProperties: false`.
- O router suporta contexto selecionado, ação pendente, clarificação e deteção de prompt injection.
- Os testes semânticos são orientados por `inputEvaluatorCases.json`; novos casos são adicionados sem alterar o código do benchmark.
- O benchmark live calcula accuracy, falhas críticas e matriz de confusão.

## Branch

`feature/edoclink-intent-router`

## Estrutura dos testes

A estrutura segue o padrão existente no ZIP do `edoclink-ai`: todos os testes e respetivos auxiliares estão diretamente em `src/api/inputEvaluator/__tests__/`.

```text
src/api/inputEvaluator/__tests__/
├── inputEvaluatorCases.json
├── inputEvaluatorCases.test.ts
├── inputEvaluatorCatalog.test.ts
├── inputEvaluatorClassification.live.test.ts
├── inputEvaluatorController.test.ts
├── inputEvaluatorEndpoint.e2e.test.ts
├── inputEvaluatorModel.test.ts
├── inputEvaluatorPromptContract.test.ts
├── inputEvaluatorRepository.test.ts
├── inputEvaluatorService.test.ts
└── inputEvaluatorTestUtils.ts
```

## Testes determinísticos

```powershell
yarn vitest run src/api/inputEvaluator/__tests__ --exclude "**/*.live.test.ts"
```

## Benchmark com modelo real

```powershell
$env:RUN_LIVE_INPUT_EVALUATOR_TESTS="true"
$env:INPUT_EVALUATOR_MIN_ACCURACY="0.85"
yarn vitest run src/api/inputEvaluator/__tests__/inputEvaluatorClassification.live.test.ts
```

É possível filtrar casos ou limitar chamadas:

```powershell
$env:INPUT_EVALUATOR_CASE_FILTER="search"
$env:INPUT_EVALUATOR_MAX_CASES="5"
```

Consultar `INTEGRATION_CHANGES.md` e `TEST_ANALYSIS.md`.
