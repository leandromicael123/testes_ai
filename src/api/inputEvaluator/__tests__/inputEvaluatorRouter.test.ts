import express from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
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
import { inputEvaluatorRouter } from "@/api/inputEvaluator/inputEvaluatorRouter";
import { ServiceResponse } from "@/common/models/serviceResponse";

describe("Input Evaluator API endpoints", () => {
	const app = express();
	app.use(express.json());
	app.use("/input-evaluator", inputEvaluatorRouter);

	beforeEach(() => {
		mockServiceEvaluate.mockReset();
	});

	describe("POST /input-evaluator", () => {
		it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
			"returns a valid router result for case %s",
			async (_id, testCase) => {
				// Arrange
				const requestBody = makeRequest(testCase);
				const expectedPayload = makeOutputForCase(testCase);
				mockServiceEvaluate.mockResolvedValue(ServiceResponse.success("ok", expectedPayload));

				// Act
				const response = await request(app).post("/input-evaluator").send(requestBody);

				// Assert
				expect(response.statusCode).toEqual(StatusCodes.OK);
				expect(response.body).toEqual(expectedPayload);
				expect(mockServiceEvaluate).toHaveBeenCalledTimes(1);
				expect(mockServiceEvaluate).toHaveBeenCalledWith(requestBody);
			},
		);

		it.each([
			["empty body", {}],
			["blank utterance", { utterance: "   " }],
			["unknown property", { utterance: "Pesquisa", hidden: true }],
			["unsupported channel", { utterance: "Pesquisa", channel: "phone" }],
		])("returns 400 for %s", async (_description, requestBody) => {
			// Act
			const response = await request(app).post("/input-evaluator").send(requestBody);

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
			expect(mockServiceEvaluate).not.toHaveBeenCalled();
		});

		it("returns 500 when the service fails", async () => {
			// Arrange
			const requestBody = makeRequest(inputEvaluatorCases[0]);
			mockServiceEvaluate.mockResolvedValue(
				ServiceResponse.failure("failed", null, StatusCodes.INTERNAL_SERVER_ERROR),
			);

			// Act
			const response = await request(app).post("/input-evaluator").send(requestBody);

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
			expect(response.body.success).toBeFalsy();
			expect(response.body.message).toEqual("failed");
		});
	});
});
