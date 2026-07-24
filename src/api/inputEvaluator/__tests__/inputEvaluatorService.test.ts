import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	inputEvaluatorCases,
	makeOutputForCase,
	makeRequest,
} from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";
import type { InputEvaluatorRepositoryContract } from "@/api/inputEvaluator/inputEvaluatorRepository";
import { InputEvaluatorService } from "@/api/inputEvaluator/inputEvaluatorService";

const mockEvaluate = vi.fn();
const fakeRepository = {
	evaluate: mockEvaluate,
} as unknown as InputEvaluatorRepositoryContract;

describe("InputEvaluatorService", () => {
	let service: InputEvaluatorService;

	beforeEach(() => {
		mockEvaluate.mockReset();
		service = new InputEvaluatorService(fakeRepository);
	});

	it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
		"wraps repository result in ServiceResponse.success for case %s",
		async (_id, testCase) => {
			const request = makeRequest(testCase);
			const expectedPayload = makeOutputForCase(testCase);
			mockEvaluate.mockResolvedValue(expectedPayload);
			const actual = await service.evaluate(request);
			expect(mockEvaluate).toHaveBeenCalledTimes(1);
			expect(mockEvaluate).toHaveBeenCalledWith(request);
			expect(actual.statusCode).toEqual(StatusCodes.OK);
			expect(actual.success).toBeTruthy();
			expect(actual.message).toEqual("Input evaluated successfully");
			expect(actual.responseObject).toEqual(expectedPayload);
		},
	);

	it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
		"does not add backend policy fields for case %s",
		async (_id, testCase) => {
			const request = makeRequest(testCase);
			mockEvaluate.mockResolvedValue(makeOutputForCase(testCase));
			const actual = await service.evaluate(request);
			const responseObject = actual.responseObject as unknown as Record<string, unknown>;
			expect(responseObject).not.toHaveProperty("riskLevel");
			expect(responseObject).not.toHaveProperty("requiresConfirmation");
			expect(responseObject).not.toHaveProperty("targetHandler");
			expect(responseObject).not.toHaveProperty("explanation");
		},
	);

	it("returns ServiceResponse.failure with 500 when repository throws", async () => {
		const request = makeRequest(inputEvaluatorCases[0]);
		mockEvaluate.mockRejectedValue(new Error("Model unavailable"));
		const actual = await service.evaluate(request);
		expect(mockEvaluate).toHaveBeenCalledTimes(1);
		expect(mockEvaluate).toHaveBeenCalledWith(request);
		expect(actual.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(actual.success).toBeFalsy();
		expect(actual.message).toEqual("An error occurred while evaluating the input.");
		expect(actual.responseObject).toBeNull();
	});
});
