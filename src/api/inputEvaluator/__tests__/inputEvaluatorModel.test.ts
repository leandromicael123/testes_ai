import { describe, expect, it } from "vitest";

import {
	inputEvaluatorCases,
	makeOutputForCase,
	makeRequest,
} from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";
import {
	InputEvaluatorRequestSchema,
	IntentNameSchema,
	IntentRouterOutputSchema,
} from "@/api/inputEvaluator/inputEvaluatorModel";

describe("InputEvaluator schemas", () => {
	describe("InputEvaluatorRequestSchema", () => {
		it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
			"accepts dynamic request case %s",
			(_id, testCase) => {
				// Arrange
				const inputBody = makeRequest(testCase);

				// Act
				const actual = InputEvaluatorRequestSchema.safeParse(inputBody);

				// Assert
				expect(actual.success).toBe(true);
			},
		);

		it.each([
			["empty utterance", { utterance: "" }],
			["blank utterance", { utterance: "   " }],
			["unknown property", { utterance: "Pesquisa", hidden: true }],
			["unsupported channel", { utterance: "Pesquisa", channel: "phone" }],
		])("rejects %s", (_description, inputBody) => {
			// Act
			const actual = InputEvaluatorRequestSchema.safeParse(inputBody);

			// Assert
			expect(actual.success).toBe(false);
		});
	});

	describe("IntentRouterOutputSchema", () => {
		it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
			"accepts dynamic router output case %s",
			(_id, testCase) => {
				// Arrange
				const output = makeOutputForCase(testCase);

				// Act
				const actual = IntentRouterOutputSchema.safeParse(output);

				// Assert
				expect(actual.success).toBe(true);
			},
		);

		it.each([
			["riskLevel", "MEDIUM"],
			["requiresConfirmation", true],
			["targetHandler", "documentCreate"],
			["explanation", "O utilizador pediu uma ação."],
			["missingFields", ["fileName"]],
		])("rejects backend-only property %s", (property, value) => {
			// Arrange
			const output = {
				...makeOutputForCase(inputEvaluatorCases[0]),
				[property]: value,
			};

			// Act
			const actual = IntentRouterOutputSchema.safeParse(output);

			// Assert
			expect(actual.success).toBe(false);
		});

		it("rejects an intent not present in the schema", () => {
			// Act
			const actual = IntentNameSchema.safeParse("CREATE_DOCUMENT");

			// Assert
			expect(actual.success).toBe(false);
		});

		it.each([-0.01, 1.01])("rejects confidence outside [0, 1]: %s", (confidence) => {
			// Arrange
			const output = makeOutputForCase(inputEvaluatorCases[0]);
			output.intent.confidence = confidence;

			// Act
			const actual = IntentRouterOutputSchema.safeParse(output);

			// Assert
			expect(actual.success).toBe(false);
		});

		it("requires a clarification question when status is NEEDS_CLARIFICATION", () => {
			// Arrange
			const output = makeOutputForCase(
				inputEvaluatorCases.find((testCase) =>
					testCase.expected.statuses.includes("NEEDS_CLARIFICATION"),
				) ?? inputEvaluatorCases[0],
			);
			output.status = "NEEDS_CLARIFICATION";
			output.clarification.question = null;

			// Act
			const actual = IntentRouterOutputSchema.safeParse(output);

			// Assert
			expect(actual.success).toBe(false);
		});

		it("requires NEEDS_CLARIFICATION when missing slots are present", () => {
			// Arrange
			const output = makeOutputForCase(inputEvaluatorCases[0]);
			output.missing_slots = ["document_type"];

			// Act
			const actual = IntentRouterOutputSchema.safeParse(output);

			// Assert
			expect(actual.success).toBe(false);
		});
	});
});
