import { describe, expect, it } from "vitest";

import { inputEvaluatorCases } from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";
import { IntentNameSchema, IntentStatusSchema, ReasonCodeSchema } from "@/api/inputEvaluator/inputEvaluatorModel";

describe("Dynamic benchmark dataset", () => {
	it("has unique case identifiers", () => {
		const ids = inputEvaluatorCases.map((testCase) => testCase.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
		"case %s uses only valid expected values",
		(_id, testCase) => {
			for (const intent of testCase.expected.intents) expect(() => IntentNameSchema.parse(intent)).not.toThrow();
			for (const status of testCase.expected.statuses) expect(() => IntentStatusSchema.parse(status)).not.toThrow();
			for (const reason of testCase.expected.reason_codes) expect(() => ReasonCodeSchema.parse(reason)).not.toThrow();
		},
	);

	it("contains critical, contextual, pending-action, ambiguity and injection cases", () => {
		expect(inputEvaluatorCases.some((testCase) => testCase.critical)).toBe(true);
		expect(inputEvaluatorCases.some((testCase) => testCase.selected_context)).toBe(true);
		expect(inputEvaluatorCases.some((testCase) => testCase.pending_action_context)).toBe(true);
		expect(inputEvaluatorCases.some((testCase) => testCase.expected.statuses.includes("NEEDS_CLARIFICATION"))).toBe(true);
		expect(inputEvaluatorCases.some((testCase) => testCase.expected.injection)).toBe(true);
	});
});
