import type { InputEvaluationResult } from "@/api/inputEvaluator/inputEvaluatorModel";
import type { InputEvaluatorRepositoryContract } from "@/api/inputEvaluator/inputEvaluatorRepository";
import { InputEvaluatorService } from "@/api/inputEvaluator/inputEvaluatorService";
import { StatusCodes } from "http-status-codes";

const validEvaluation: InputEvaluationResult = {
	intent: "CREATE_DOCUMENT",
	confidence: 0.80, // 80 min, but greater is accepted
	entities: {
		documentType: "Fatura", // Validava se tem o documentype
		subject: "Proposta de viajem", //not mandatory
		metadata: {},
	},
	missingFields: ["fileName"], //Remove after
	riskLevel: "MEDIUM",
	requiresConfirmation: true,
	clarificationQuestion: null,
	targetHandler: "documentCreate",
	explanation: "O utilizador pediu a criação de um documento.",
};

describe("InputEvaluatorService", () => {
	it("returns the structured evaluation", async () => {
		const repository: InputEvaluatorRepositoryContract = {
			evaluate: vi.fn().mockResolvedValue(validEvaluation),
		};
		const service = new InputEvaluatorService(repository);

		const response = await service.evaluate({ input: "Cria uma fatura com o assunto Proposta de viajem" });

		expect(response.success).toBe(true);
		expect(response.responseObject).toEqual(validEvaluation);
	});

	it("returns an internal error when the model fails", async () => {
		const repository: InputEvaluatorRepositoryContract = {
			evaluate: vi.fn().mockRejectedValue(new Error("Model unavailable")),
		};
		const service = new InputEvaluatorService(repository);

		const response = await service.evaluate({ input: "Procura o contrato" });

		expect(response.success).toBe(false);
		expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(response.responseObject).toBeNull();
	});
});
