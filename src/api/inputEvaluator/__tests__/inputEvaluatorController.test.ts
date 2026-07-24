import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEvaluate } = vi.hoisted(() => ({ mockEvaluate: vi.fn() }));

vi.mock("@/api/inputEvaluator/inputEvaluatorService", () => ({
	inputEvaluatorService: { evaluate: mockEvaluate },
}));

import { inputEvaluatorController } from "@/api/inputEvaluator/inputEvaluatorController";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { inputEvaluatorCases, makeOutput, makeRequest } from "@/api/inputEvaluator/__tests__/inputEvaluatorTestUtils";

describe("InputEvaluatorController", () => {
	beforeEach(() => mockEvaluate.mockReset());

	function makeReqRes() {
		const req = { body: makeRequest(inputEvaluatorCases[0]) } as any;
		const res = {
			status: vi.fn().mockReturnThis(),
			send: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		} as any;
		return { req, res };
	}

	it("returns the router result on success", async () => {
		const output = makeOutput();
		mockEvaluate.mockResolvedValue(ServiceResponse.success("ok", output));
		const { req, res } = makeReqRes();
		await inputEvaluatorController.evaluate(req, res, vi.fn());
		expect(mockEvaluate).toHaveBeenCalledWith(req.body);
		expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
		expect(res.send).toHaveBeenCalledWith(output);
	});

	it("returns the service error without fabricating a classification", async () => {
		mockEvaluate.mockResolvedValue(
			ServiceResponse.failure("failed", null, StatusCodes.INTERNAL_SERVER_ERROR),
		);
		const { req, res } = makeReqRes();
		await inputEvaluatorController.evaluate(req, res, vi.fn());
		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(res.json).toHaveBeenCalledWith({ success: false, message: "failed", details: undefined });
	});
});
