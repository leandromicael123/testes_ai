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
				const inputBody = makeRequest(testCase);
				const actual = InputEvaluatorRequestSchema.safeParse(inputBody);
				expect(actual.success).toBe(true);
			},
		);

		it.each([
			["empty utterance", { utterance: "" }],
			["blank utterance", { utterance: "   " }],
			["unknown property", { utterance: "Pesquisa", hidden: true }],
			["unsupported channel", { utterance: "Pesquisa", channel: "phone" }],
		])("rejects %s", (_description, inputBody) => {
			const actual = InputEvaluatorRequestSchema.safeParse(inputBody);
			expect(actual.success).toBe(false);
		});
	});

	describe("IntentRouterOutputSchema", () => {
		it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
			"accepts dynamic router output case %s",
			(_id, testCase) => {
				const output = makeOutputForCase(testCase);
				const actual = IntentRouterOutputSchema.safeParse(output);
				expect(actual.success).toBe(true);
			},
		);

		it.each([
			["riskLevel", "MEDIUM"],
			["requiresConfirmation", true],
			["targetHandler", "documentCreate"],
			["explanation", "O utilizador pediu uma ação."],
		])("rejects backend-only property %s", (property, value) => {
			const output = {
				...makeOutputForCase(inputEvaluatorCases[0]),
				[property]: value,
			};
			const actual = IntentRouterOutputSchema.safeParse(output);
			expect(actual.success).toBe(false);
		});

		it("rejects an intent not present in the schema", () => {
			const actual = IntentNameSchema.safeParse("CREATE_DOCUMENT");
			expect(actual.success).toBe(false);
		});

		it.each([-0.01, 1.01])("rejects confidence outside [0, 1]: %s", (confidence) => {
			const output = makeOutputForCase(inputEvaluatorCases[0]);
			output.intent.confidence = confidence;
			const actual = IntentRouterOutputSchema.safeParse(output);
			expect(actual.success).toBe(false);
		});

		it("requires a clarification question when status is NEEDS_CLARIFICATION", () => {
			const output = makeOutputForCase(
				inputEvaluatorCases.find((testCase) =>
					testCase.expected.statuses.includes("NEEDS_CLARIFICATION"),
				) ?? inputEvaluatorCases[0],
			);
			output.status = "NEEDS_CLARIFICATION";
			output.clarification.question = null;
			const actual = IntentRouterOutputSchema.safeParse(output);
			expect(actual.success).toBe(false);
		});
	});
});
