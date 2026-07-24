# testes_ai

Implementação e testes do `inputEvaluator` para classificação de intenções no edoclink.

## Estrutura

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

O catálogo e os exemplos das intenções estão em `inputEvaluatorCatalog.ts`. O prompt está em `inputEvaluatorPrompt.ts` e os schemas Zod em `inputEvaluatorModel.ts`.

Os casos partilhados pelos testes estão definidos diretamente em `inputEvaluatorTestUtils.ts`; não existe um fixture JSON separado.

## Testes determinísticos

```powershell
yarn vitest run src/api/inputEvaluator/__tests__ --exclude "**/*.live.test.ts"
```

## Benchmark com o modelo real

```powershell
$env:RUN_LIVE_INPUT_EVALUATOR_TESTS="true"
$env:INPUT_EVALUATOR_MIN_ACCURACY="0.85"
yarn vitest run src/api/inputEvaluator/__tests__/inputEvaluatorClassification.live.test.ts
```
