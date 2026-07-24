# edoclink Intent Router v2

Implementação do `inputEvaluator` baseada no prompt de produção, no schema Zod e no catálogo de intenções fornecidos.

Principais alterações:

- `CREATE_DOCUMENT_DRAFT` e `CREATE_FOLDER_DRAFT` substituem ações de criação imediata.
- O output do modelo não contém risco, confirmação nem executor.
- `available_intents` é injetado pelo backend a partir do catálogo, não pelo cliente.
- Os objetos Zod usam `.strict()` para aplicar `additionalProperties: false`.
- O router suporta contexto selecionado, ação pendente, clarificação e deteção de prompt injection.
- O catálogo e as definições estão em `inputEvaluatorCatalog.ts`, sem uma pasta `config` própria.
- O prompt está em `inputEvaluatorPrompt.ts` e o contrato de dados em `inputEvaluatorModel.ts`.
- Os testes semânticos são orientados por `inputEvaluatorCases.json`; novos casos são adicionados sem alterar o código do benchmark.
- O benchmark live calcula accuracy, falhas críticas e matriz de confusão.

## Branch

`feature/edoclink-intent-router`

## Estrutura do módulo

A estrutura segue o padrão existente no ZIP do `edoclink-ai`:

```text
src/api/inputEvaluator/
├── inputEvaluatorCatalog.ts
├── inputEvaluatorController.ts
├── inputEvaluatorModel.ts
├── inputEvaluatorPrompt.ts
├── inputEvaluatorRepository.ts
├── inputEvaluatorRouter.ts
├── inputEvaluatorService.ts
└── __tests__/
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
