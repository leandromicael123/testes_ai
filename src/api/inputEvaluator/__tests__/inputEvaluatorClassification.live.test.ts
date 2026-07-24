import { describe, expect, it } from "vitest";

import { InputEvaluatorRepository } from "@/api/inputEvaluator/inputEvaluatorRepository";
import { inputEvaluatorCases, makeRequest } from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";

const liveDescribe = process.env.RUN_LIVE_INPUT_EVALUATOR_TESTS === "true" ? describe : describe.skip;

liveDescribe("InputEvaluator live semantic benchmark", () => {
	it(
		"classifies the dynamic benchmark with the configured routing model",
		async () => {
			const repository = new InputEvaluatorRepository();
			const filter = process.env.INPUT_EVALUATOR_CASE_FILTER?.trim().toLowerCase();
			const configuredMax = Number(process.env.INPUT_EVALUATOR_MAX_CASES ?? inputEvaluatorCases.length);
			const threshold = Number(process.env.INPUT_EVALUATOR_MIN_ACCURACY ?? 0.85);

			const selectedCases = inputEvaluatorCases
				.filter((testCase) => !filter || testCase.id.toLowerCase().includes(filter))
				.slice(0, Number.isFinite(configuredMax) ? configuredMax : inputEvaluatorCases.length);

			if (selectedCases.length === 0) throw new Error("No benchmark cases matched the selected filter");

			const results = [] as Array<{
				id: string;
				expected: string;
				received: string;
				status: string;
				confidence: number;
				intentCorrect: boolean;
				statusCorrect: boolean;
				reasonCorrect: boolean;
				injectionCorrect: boolean;
				critical: boolean;
			}>;

			for (const testCase of selectedCases) {
				const result = await repository.evaluate(makeRequest(testCase));
				results.push({
					id: testCase.id,
					expected: testCase.expected.intents.join(" | "),
					received: result.intent.name,
					status: result.status,
					confidence: result.intent.confidence,
					intentCorrect: testCase.expected.intents.includes(result.intent.name),
					statusCorrect: testCase.expected.statuses.includes(result.status),
					reasonCorrect: testCase.expected.reason_codes.includes(result.reason_code),
					injectionCorrect: testCase.expected.injection === result.suspected_prompt_injection,
					critical: testCase.critical,
				});
			}

			console.table(results);

			const fullyCorrect = results.filter(
				(result) => result.intentCorrect && result.statusCorrect && result.injectionCorrect,
			);
			const accuracy = fullyCorrect.length / results.length;
			const criticalFailures = results.filter(
				(result) => result.critical && (!result.intentCorrect || !result.statusCorrect || !result.injectionCorrect),
			);

			const confusion = results.reduce<Record<string, Record<string, number>>>((matrix, result) => {
				matrix[result.expected] ??= {};
				matrix[result.expected][result.received] = (matrix[result.expected][result.received] ?? 0) + 1;
				return matrix;
			}, {});

			console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}% (${fullyCorrect.length}/${results.length})`);
			console.log("Confusion matrix:", JSON.stringify(confusion, null, 2));

			expect(criticalFailures).toEqual([]);
			expect(accuracy).toBeGreaterThanOrEqual(threshold);
		},
		300_000,
	);
});
