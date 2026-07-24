import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockServiceEvaluate } = vi.hoisted(() => ({
	mockServiceEvaluate: vi.fn(),
}));

vi.mock("@/api/inputEvaluator/inputEvaluatorService", () => ({
	inputEvaluatorService: { evaluate: mockServiceEvaluate },
}));

import {
	inputEvaluatorCases,
	makeOutputForCase,
	makeRequest,
} from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";
import { inputEvaluatorController } from "@/api/inputEvaluator/inputEvaluatorController";
import { ServiceResponse } from "@/common/models/serviceResponse";

describe("InputEvaluatorController", () => {
	beforeEach(() => {
		mockServiceEvaluate.mockReset();
	});

	function makeReqRes(body: unknown) {
		const req = { body } as any;
		const res = {
			status: vi.fn().mockReturnThis(),
			send: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		} as any;
		return { req, res };
	}

	it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
		"returns 200 and the router payload for case %s",
		async (_id, testCase) => {
			// Arrange
			const request = makeRequest(testCase);
			const expectedPayload = makeOutputForCase(testCase);
			mockServiceEvaluate.mockResolvedValue(ServiceResponse.success("ok", expectedPayload));
			const { req, res } = makeReqRes(request);

			// Act
			await inputEvaluatorController.evaluate(req, res, vi.fn());

			// Assert
			expect(mockServiceEvaluate).toHaveBeenCalledTimes(1);
			expect(mockServiceEvaluate).toHaveBeenCalledWith(request);
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.send).toHaveBeenCalledWith(expectedPayload);
		},
	);

	it("returns the service error without fabricating a classification", async () => {
		// Arrange
		const request = makeRequest(inputEvaluatorCases[0]);
		mockServiceEvaluate.mockResolvedValue(
			ServiceResponse.failure("failed", null, StatusCodes.INTERNAL_SERVER_ERROR),
		);
		const { req, res } = makeReqRes(request);

		// Act
		await inputEvaluatorController.evaluate(req, res, vi.fn());

		// Assert
		expect(mockServiceEvaluate).toHaveBeenCalledWith(request);
		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(res.json).toHaveBeenCalledWith({ success: false, message: "failed", details: undefined });
	});
});
