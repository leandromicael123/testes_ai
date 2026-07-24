import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

import type {
	InputEvaluationResult,
	InputEvaluatorRequest,
	InputIntent,
	RiskLevel,
	TargetHandler,
} from "@/api/inputEvaluator/inputEvaluatorModel";
import { InputEvaluationResultSchema } from "@/api/inputEvaluator/inputEvaluatorModel";
import { INPUT_EVALUATOR_SYSTEM_PROMPT } from "@/api/inputEvaluator/inputEvaluatorPrompt";
import { ModelFactory } from "@/common/factories/modelFactory";
import { createLogger } from "@/common/utils/logger";

const logger = createLogger("input-evaluator-repository");

const MINIMUM_CONFIDENCE = 0.6;

const INTENT_POLICY: Record<
	InputIntent,
	{ riskLevel: RiskLevel; requiresConfirmation: boolean; targetHandler: TargetHandler }
> = {
	SEARCH: { riskLevel: "LOW", requiresConfirmation: false, targetHandler: "search" },
	CREATE_DOCUMENT: { riskLevel: "MEDIUM", requiresConfirmation: true, targetHandler: "documentCreation" },
	ANALYZE_DOCUMENT: { riskLevel: "LOW", requiresConfirmation: false, targetHandler: "documentAnalysis" },
	OPEN_DOCUMENT: { riskLevel: "LOW", requiresConfirmation: false, targetHandler: "documentRead" },
	UPDATE_DOCUMENT: { riskLevel: "HIGH", requiresConfirmation: true, targetHandler: "documentUpdate" },
	DELETE_DOCUMENT: { riskLevel: "CRITICAL", requiresConfirmation: true, targetHandler: "documentDelete" },
	CREATE_FOLDER: { riskLevel: "MEDIUM", requiresConfirmation: true, targetHandler: "folderCreation" },
	MOVE_DOCUMENT: { riskLevel: "HIGH", requiresConfirmation: true, targetHandler: "documentMove" },
	CREATE_FLOW: { riskLevel: "HIGH", requiresConfirmation: true, targetHandler: "flowCreation" },
	START_FLOW: { riskLevel: "HIGH", requiresConfirmation: true, targetHandler: "flowExecution" },
	NAVIGATE: { riskLevel: "LOW", requiresConfirmation: false, targetHandler: "navigation" },
	GENERAL_QUESTION: { riskLevel: "LOW", requiresConfirmation: false, targetHandler: "chat" },
	UNKNOWN: { riskLevel: "LOW", requiresConfirmation: false, targetHandler: "none" },
};

export interface InputEvaluatorRepositoryContract {
	evaluate(request: InputEvaluatorRequest): Promise<InputEvaluationResult>;
}

export class InputEvaluatorRepository implements InputEvaluatorRepositoryContract {
	private readonly model: BaseChatModel;

	constructor(model?: BaseChatModel) {
		this.model =
			model ??
			ModelFactory.createRoutingModel({
				temperature: 0,
				maxTokens: 1_000,
			});
	}

	public async evaluate(request: InputEvaluatorRequest): Promise<InputEvaluationResult> {
		const parser = StructuredOutputParser.fromZodSchema(InputEvaluationResultSchema);
		const payload = JSON.stringify(
			{
				input: request.input,
				context: request.context ?? {
					language: "pt-PT",
					selectedDocumentIds: [],
					metadata: {},
				},
			},
			null,
			2,
		);

		const response = await this.model.invoke([
			new SystemMessage(INPUT_EVALUATOR_SYSTEM_PROMPT),
			new HumanMessage(`Avalia o seguinte pedido:\n${payload}\n\n${parser.getFormatInstructions()}`),
		]);

		const parsedResult = await parser.parse(response.content.toString());
		const normalizedResult = this.normalizeResult(parsedResult);

		logger.info(
			{
				intent: normalizedResult.intent,
				confidence: normalizedResult.confidence,
				riskLevel: normalizedResult.riskLevel,
				targetHandler: normalizedResult.targetHandler,
			},
			"Input evaluated",
		);

		return normalizedResult;
	}

	private normalizeResult(result: InputEvaluationResult): InputEvaluationResult {
		const confidence = Math.max(0, Math.min(1, result.confidence));
		const mustClarify = confidence < MINIMUM_CONFIDENCE;
		const intent: InputIntent = mustClarify ? "UNKNOWN" : result.intent;
		const policy = INTENT_POLICY[intent];

		return InputEvaluationResultSchema.parse({
			...result,
			intent,
			confidence,
			riskLevel: policy.riskLevel,
			requiresConfirmation: policy.requiresConfirmation,
			targetHandler: policy.targetHandler,
			clarificationQuestion:
				mustClarify && !result.clarificationQuestion
					? "Pode reformular o pedido e indicar a ação que pretende executar?"
					: result.clarificationQuestion,
		});
	}
}
