import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
	InputEvaluatorRequest,
	IntentRouterOutput,
} from "@/api/inputEvaluator/inputEvaluatorModel";
import type { InputEvaluatorRepositoryContract } from "@/api/inputEvaluator/inputEvaluatorRepository";
import { InputEvaluatorService } from "@/api/inputEvaluator/inputEvaluatorService";
import {
	inputEvaluatorCases,
	makeOutput,
	makeRequest,
	type InputEvaluatorCase,
} from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";

const mockEvaluate = vi.fn();
const fakeRepository = {
	evaluate: mockEvaluate,
} as unknown as InputEvaluatorRepositoryContract;

const validRequest: InputEvaluatorRequest = {
	utterance: "Cria um documento do tipo Fatura com o título Proposta de viagem",
	channel: "text",
	locale: "pt-PT",
	selected_context: {
		page: "register-document",
		object_type: null,
		object_reference: null,
		object_name: null,
	},
	pending_action_context: null,
};

const validEvaluation: IntentRouterOutput = {
	schema_version: "1.0",
	catalog_version: "2026.07.1",
	language: "pt-PT",
	status: "READY",
	intent: {
		name: "CREATE_DOCUMENT_DRAFT",
		confidence: 0.8,
	},
	target: {
		object_type: "document",
		reference: null,
		name: "Proposta de viagem",
	},
	entities: [
		{
			type: "document_type",
			raw_value: "Fatura",
			normalized_value: "Fatura",
			source: "utterance",
			confidence: 0.99,
		},
		{
			type: "title",
			raw_value: "Proposta de viagem",
			normalized_value: "Proposta de viagem",
			source: "utterance",
			confidence: 0.98,
		},
	],
	filters: [],
	missing_slots: [],
	clarification: {
		question: null,
		options: [],
	},
	reason_code: "EXPLICIT_COMMAND",
	suspected_prompt_injection: false,
};

function makeEvaluationForCase(testCase: InputEvaluatorCase): IntentRouterOutput {
	const status = testCase.expected.statuses[0];
	const reasonCode = testCase.expected.reason_codes[0];
	let intentName = testCase.expected.intents[0];

	if (status === "NO_ACTION") {
		intentName = "NO_ACTION";
	}

	if (status === "OUT_OF_SCOPE") {
		intentName = "OUT_OF_SCOPE";
	}

	const needsClarification = status === "NEEDS_CLARIFICATION";
	const hasMissingSlot = testCase.expected.reason_codes.includes("MISSING_REQUIRED_SLOT");

	return makeOutput({
		status,
		intent: {
			name: intentName,
			confidence: testCase.critical ? 0.95 : 0.85,
		},
		missing_slots: hasMissingSlot ? ["object_reference_or_context"] : [],
		clarification: needsClarification
			? {
					question: "Qual é a ação ou o objeto que pretende utilizar?",
					options: [],
				}
			: {
					question: null,
					options: [],
				},
		reason_code: reasonCode,
		suspected_prompt_injection: testCase.expected.injection,
	});
}

describe("InputEvaluatorService", () => {
	let service: InputEvaluatorService;

	beforeEach(() => {
		mockEvaluate.mockReset();
		service = new InputEvaluatorService(fakeRepository);
	});

	describe("evaluate", () => {
		it("wraps a valid repository evaluation in ServiceResponse.success", async () => {
			// Arrange
			mockEvaluate.mockResolvedValue(validEvaluation);

			// Act
			const actual = await service.evaluate(validRequest);

			// Assert
			expect(mockEvaluate).toHaveBeenCalledTimes(1);
			expect(mockEvaluate).toHaveBeenCalledWith(validRequest);
			expect(actual.success).toBe(true);
			expect(actual.statusCode).toBe(StatusCodes.OK);
			expect(actual.message).toBe("Input evaluated successfully");
			expect(actual.responseObject).toEqual(validEvaluation);
		});

		it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
			"supports the dynamic fixture %s without changing the router output",
			async (_id, testCase) => {
				// Arrange
				const request = makeRequest(testCase);
				const expectedEvaluation = makeEvaluationForCase(testCase);
				mockEvaluate.mockResolvedValue(expectedEvaluation);

				// Act
				const actual = await service.evaluate(request);

				// Assert
				expect(mockEvaluate).toHaveBeenCalledTimes(1);
				expect(mockEvaluate).toHaveBeenCalledWith(request);
				expect(actual.statusCode).toBe(StatusCodes.OK);
				expect(actual.success).toBe(true);
				expect(actual.responseObject).toEqual(expectedEvaluation);
			},
		);

		it("does not add policy, confirmation or executor fields to the router result", async () => {
			// Arrange
			mockEvaluate.mockResolvedValue(validEvaluation);

			// Act
			const actual = await service.evaluate(validRequest);
			const responseObject = actual.responseObject as unknown as Record<string, unknown>;

			// Assert
			expect(responseObject).not.toHaveProperty("riskLevel");
			expect(responseObject).not.toHaveProperty("requiresConfirmation");
			expect(responseObject).not.toHaveProperty("targetHandler");
			expect(responseObject).not.toHaveProperty("explanation");
			expect(responseObject).not.toHaveProperty("missingFields");
		});

		it("returns ServiceResponse.failure with status 500 when the repository throws", async () => {
			// Arrange
			mockEvaluate.mockRejectedValue(new Error("Model unavailable"));

			// Act
			const actual = await service.evaluate(validRequest);

			// Assert
			expect(mockEvaluate).toHaveBeenCalledTimes(1);
			expect(mockEvaluate).toHaveBeenCalledWith(validRequest);
			expect(actual.success).toBe(false);
			expect(actual.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
			expect(actual.message).toBe("An error occurred while evaluating the input.");
			expect(actual.responseObject).toBeNull();
		});
	});
});
