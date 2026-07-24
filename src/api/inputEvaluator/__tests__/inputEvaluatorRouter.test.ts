import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEvaluate } = vi.hoisted(() => ({ mockEvaluate: vi.fn() }));

vi.mock("@/api/inputEvaluator/inputEvaluatorService", () => ({
	inputEvaluatorService: { evaluate: mockEvaluate },
}));

import { inputEvaluatorRouter } from "@/api/inputEvaluator/inputEvaluatorRouter";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { inputEvaluatorCases, makeOutput, makeRequest } from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";

describe("POST /input-evaluator", () => {
	const app = express();
	app.use(express.json());
	app.use("/input-evaluator", inputEvaluatorRouter);

	beforeEach(() => mockEvaluate.mockReset());

	it("returns 200 for a valid request", async () => {
		mockEvaluate.mockResolvedValue(ServiceResponse.success("ok", makeOutput()));
		const response = await request(app)
			.post("/input-evaluator")
			.send(makeRequest(inputEvaluatorCases[0]));
		expect(response.status).toBe(200);
		expect(response.body.intent.name).toBe("SEARCH_DOCUMENTS");
	});

	it.each([
		["empty body", {}],
		["blank utterance", { utterance: "   " }],
		["unknown property", { utterance: "Pesquisa", hidden: true }],
	])("returns 400 for %s", async (_name, body) => {
		const response = await request(app).post("/input-evaluator").send(body);
		expect(response.status).toBe(400);
		expect(mockEvaluate).not.toHaveBeenCalled();
	});
});
