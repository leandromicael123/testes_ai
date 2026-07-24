import { describe, expect, it, vi } from "vitest";

import { intentCatalog } from "@/api/inputEvaluator/inputEvaluatorCatalog";
import { InputEvaluatorRepository } from "@/api/inputEvaluator/inputEvaluatorRepository";
import { inputEvaluatorCases, makeOutput, makeRequest } from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";

describe("InputEvaluatorRepository", () => {
	it("injects the server-side catalog and parses a strict JSON response", async () => {
		const output = makeOutput();
		const model = {
			invoke: vi.fn().mockResolvedValue({ content: JSON.stringify(output) }),
		};
		const repository = new InputEvaluatorRepository(model as any);
		const result = await repository.evaluate(makeRequest(inputEvaluatorCases[0]));
		expect(result).toEqual(output);

		const messages = model.invoke.mock.calls[0][0];
		const humanMessage = messages[1];
		const content = String(humanMessage.content);
		expect(content).toContain(`"catalog_version": "${intentCatalog.catalog_version}"`);
		for (const intent of intentCatalog.intents) {
			expect(content).toContain(`"name": "${intent.name}"`);
		}
	});

	it("rejects a response with a different catalog version", async () => {
		const model = {
			invoke: vi.fn().mockResolvedValue({
				content: JSON.stringify(makeOutput({ catalog_version: "outdated" })),
			}),
		};
		const repository = new InputEvaluatorRepository(model as any);
		await expect(repository.evaluate(makeRequest(inputEvaluatorCases[0]))).rejects.toThrow(/catalog version/i);
	});

	it("rejects extra policy and executor properties returned by the model", async () => {
		const model = {
			invoke: vi.fn().mockResolvedValue({
				content: JSON.stringify({
					...makeOutput(),
					risk: "C",
					confirmation: "visual_required",
					executor: "edoc.documents.prepareCreate",
				}),
			}),
		};
		const repository = new InputEvaluatorRepository(model as any);
		await expect(repository.evaluate(makeRequest(inputEvaluatorCases[0]))).rejects.toThrow();
	});

	it("rejects non-JSON model output", async () => {
		const model = { invoke: vi.fn().mockResolvedValue({ content: "I think this is a search." }) };
		const repository = new InputEvaluatorRepository(model as any);
		await expect(repository.evaluate(makeRequest(inputEvaluatorCases[0]))).rejects.toThrow();
	});
});
