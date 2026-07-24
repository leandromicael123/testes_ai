import { StatusCodes } from "http-status-codes";
import { describe, expect, it, vi } from "vitest";

import type { InputEvaluatorRepositoryContract } from "@/api/inputEvaluator/inputEvaluatorRepository";
import { InputEvaluatorService } from "@/api/inputEvaluator/inputEvaluatorService";
import { inputEvaluatorCases, makeOutput, makeRequest } from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";

describe("InputEvaluatorService", () => {
	it.each(inputEvaluatorCases.slice(0, 8).map((testCase) => [testCase.id, testCase] as const))(
		"returns structured evaluations for dynamic case %s",
		async (_id, testCase) => {
			const output = makeOutput({
				status: testCase.expected.statuses[0],
				intent: { name: testCase.expected.intents[0], confidence: 0.95 },
				reason_code: testCase.expected.reason_codes[0],
				suspected_prompt_injection: testCase.expected.injection,
			});
			const repository: InputEvaluatorRepositoryContract = {
				evaluate: vi.fn().mockResolvedValue(output),
			};
			const service = new InputEvaluatorService(repository);
			const response = await service.evaluate(makeRequest(testCase));
			expect(response.success).toBe(true);
			expect(response.responseObject).toEqual(output);
		},
	);

	it("returns 500 when the model or parser fails", async () => {
		const repository: InputEvaluatorRepositoryContract = {
			evaluate: vi.fn().mockRejectedValue(new Error("Model unavailable")),
		};
		const service = new InputEvaluatorService(repository);
		const response = await service.evaluate(makeRequest(inputEvaluatorCases[0]));
		expect(response.success).toBe(false);
		expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(response.responseObject).toBeNull();
	});
});
