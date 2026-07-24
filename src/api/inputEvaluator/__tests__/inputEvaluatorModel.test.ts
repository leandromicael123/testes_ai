import { describe, expect, it } from "vitest";

import {
	InputEvaluatorRequestSchema,
	IntentNameSchema,
	IntentRouterOutputSchema,
} from "@/api/inputEvaluator/inputEvaluatorModel";
import { inputEvaluatorCases, makeOutput, makeRequest } from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";

describe("InputEvaluator schemas", () => {
	it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
		"accepts dynamic request case %s",
		(_id, testCase) => {
			expect(() => InputEvaluatorRequestSchema.parse(makeRequest(testCase))).not.toThrow();
		},
	);

	it("rejects empty utterances", () => {
		expect(() => InputEvaluatorRequestSchema.parse({ utterance: "   " })).toThrow();
	});

	it("rejects unknown request properties", () => {
		expect(() => InputEvaluatorRequestSchema.parse({ utterance: "Pesquisa", hidden: true })).toThrow();
	});

	it("accepts a valid router output", () => {
		expect(() => IntentRouterOutputSchema.parse(makeOutput())).not.toThrow();
	});

	it("rejects backend policy properties in the model output", () => {
		expect(() =>
			IntentRouterOutputSchema.parse({
				...makeOutput(),
				riskLevel: "MEDIUM",
				requiresConfirmation: true,
				targetHandler: "documentCreate",
			}),
		).toThrow();
	});

	it("rejects an intent not present in the schema", () => {
		expect(() => IntentNameSchema.parse("CREATE_DOCUMENT")).toThrow();
	});

	it("rejects confidence outside [0, 1]", () => {
		expect(() =>
			IntentRouterOutputSchema.parse(
				makeOutput({ intent: { name: "SEARCH_DOCUMENTS", confidence: 1.1 } }),
			),
		).toThrow();
	});

	it("requires a clarification question when status is NEEDS_CLARIFICATION", () => {
		expect(() =>
			IntentRouterOutputSchema.parse(
				makeOutput({
					status: "NEEDS_CLARIFICATION",
					intent: { name: "NO_ACTION", confidence: 0.55 },
					reason_code: "AMBIGUOUS_INTENT",
				}),
			),
		).toThrow(/clarification question/i);
	});

	it("requires NEEDS_CLARIFICATION when missing slots are present", () => {
		expect(() =>
			IntentRouterOutputSchema.parse(makeOutput({ missing_slots: ["document_type"] })),
		).toThrow(/Missing slots require/i);
	});
});
