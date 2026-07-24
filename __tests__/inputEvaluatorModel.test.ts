import { InputEvaluationResultSchema, InputEvaluatorRequestSchema } from "@/api/inputEvaluator/inputEvaluatorModel";

describe("InputEvaluator schemas", () => {
	it("accepts a valid request", () => {
		const result = InputEvaluatorRequestSchema.parse({
			input: "Cria um documento do tipo Fatura",
			context: { currentPage: "documents" },
		});

		expect(result.input).toBe("Cria um documento do tipo Fatura");
		expect(result.context?.language).toBe("pt-PT");
	});

	it("rejects an empty input", () => {
		expect(() => InputEvaluatorRequestSchema.parse({ input: "   " })).toThrow();
	});

	it("accepts a valid evaluation result", () => {
		const result = InputEvaluationResultSchema.parse({
			intent: "SEARCH",
			confidence: 0.95,
			entities: { query: "contrato de 2026", metadata: {} },
			missingFields: [],
			riskLevel: "LOW",
			requiresConfirmation: false,
			clarificationQuestion: null,
			targetHandler: "search",
			explanation: "O utilizador pretende localizar um documento.",
		});

		expect(result.intent).toBe("SEARCH");
		expect(result.targetHandler).toBe("search");
	});
});
