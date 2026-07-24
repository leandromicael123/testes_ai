# Análise dos testes e estratégia adotada

Foram analisados os padrões dos testes existentes do `edoclink-ai`:

- testes de serviços com dependências injetadas e `vi.fn()`;
- testes de controllers com `vi.hoisted()` e `vi.mock()`;
- testes HTTP com Express e Supertest;
- testes de schemas Zod;
- testes E2E separados de testes unitários;
- problemas globais conhecidos associados à configuração do Copilot e ao fixture `test/data/05-versions-space.pdf`.

O módulo inclui:

1. `inputEvaluatorModel.test.ts` — pedidos, output estrito, limites de confiança e regras de clarificação;
2. `inputEvaluatorCatalog.test.ts` — sincronização entre o catálogo TypeScript, as definições e o schema Zod;
3. `inputEvaluatorPromptContract.test.ts` — regras essenciais do prompt de produção;
4. `inputEvaluatorRepository.test.ts` — catálogo injetado pelo servidor, parsing estrito e rejeição de campos de política gerados pelo modelo;
5. `inputEvaluatorService.test.ts` — sucesso e falha do serviço;
6. `inputEvaluatorController.test.ts` — respostas HTTP do controller;
7. `inputEvaluatorEndpoint.e2e.test.ts` — validação do endpoint com Express e Supertest;
8. `inputEvaluatorCases.test.ts` — qualidade e cobertura do dataset;
9. `inputEvaluatorClassification.live.test.ts` — benchmark real, orientado por JSON, com accuracy, falhas críticas e matriz de confusão.

Os casos semânticos ficam em `src/api/inputEvaluator/__tests__/inputEvaluatorCases.json`. Para adicionar um teste, basta acrescentar um objeto JSON; não é necessário alterar o código do benchmark.

O catálogo e as definições ficam em `inputEvaluatorCatalog.ts`, o prompt em `inputEvaluatorPrompt.ts` e os schemas em `inputEvaluatorModel.ts`. Não existe uma pasta `config` no módulo.

O benchmark live é configurável por variáveis de ambiente:

- `RUN_LIVE_INPUT_EVALUATOR_TESTS=true` ativa chamadas ao modelo real;
- `INPUT_EVALUATOR_MIN_ACCURACY` define a precisão mínima;
- `INPUT_EVALUATOR_CASE_FILTER` filtra por ID;
- `INPUT_EVALUATOR_MAX_CASES` limita o número de casos e o custo.

Os testes completos devem ser executados no ambiente local do projeto, com as dependências e o `.env` válidos.
