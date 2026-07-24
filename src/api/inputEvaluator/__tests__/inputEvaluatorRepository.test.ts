import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	inputEvaluatorCases,
	makeOutputForCase,
	makeRequest,
} from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";
import { intentCatalog } from "@/api/inputEvaluator/inputEvaluatorCatalog";
import { InputEvaluatorRepository } from "@/api/inputEvaluator/inputEvaluatorRepository";

const mockInvoke = vi.fn();
const fakeModel = {
	invoke: mockInvoke,
};

describe("InputEvaluatorRepository", () => {
	let repository: InputEvaluatorRepository;

	beforeEach(() => {
		mockInvoke.mockReset();
		repository = new InputEvaluatorRepository(fakeModel as any);
	});

	it.each(inputEvaluatorCases.map((testCase) => [testCase.id, testCase] as const))(
		"parses a strict JSON result for case %s",
		async (_id, testCase) => {
			const request = makeRequest(testCase);
			const expectedPayload = makeOutputForCase(testCase);
			mockInvoke.mockResolvedValue({ content: JSON.stringify(expectedPayload) });
			const actual = await repository.evaluate(request);
			expect(mockInvoke).toHaveBeenCalledTimes(1);
			expect(actual).toEqual(expectedPayload);
		},
	);

	it("injects the server-side catalog into the model payload", async () => {
		const testCase = inputEvaluatorCases[0];
		mockInvoke.mockResolvedValue({ content: JSON.stringify(makeOutputForCase(testCase)) });
		await repository.evaluate(makeRequest(testCase));
		const messages = mockInvoke.mock.calls[0][0];
		const humanMessage = messages[1];
		const content = String(humanMessage.content);
		expect(content).toContain(`"catalog_version": "${intentCatalog.catalog_version}"`);
		for (const intent of intentCatalog.intents) {
			expect(content).toContain(`"name": "${intent.name}"`);
		}
	});

	it("rejects a response with a different catalog version", async () => {
		const testCase = inputEvaluatorCases[0];
		mockInvoke.mockResolvedValue({
			content: JSON.stringify({
				...makeOutputForCase(testCase),
				catalog_version: "outdated",
			}),
		});
		await expect(repository.evaluate(makeRequest(testCase))).rejects.toThrow(/catalog version/i);
	});

	it.each([
		["riskLevel", "MEDIUM"],
		["requiresConfirmation", true],
		["targetHandler", "documentCreate"],
		["explanation", "O utilizador pediu uma ação."],
	])("rejects backend-only property %s returned by the model", async (property, value) => {
		const testCase = inputEvaluatorCases[0];
		mockInvoke.mockResolvedValue({
			content: JSON.stringify({
				...makeOutputForCase(testCase),
				[property]: value,
			}),
		});
		await expect(repository.evaluate(makeRequest(testCase))).rejects.toThrow();
	});

	it("rejects non-JSON model output", async () => {
		mockInvoke.mockResolvedValue({ content: "I think this is a search." });
		await expect(repository.evaluate(makeRequest(inputEvaluatorCases[0]))).rejects.toThrow();
	});
});
