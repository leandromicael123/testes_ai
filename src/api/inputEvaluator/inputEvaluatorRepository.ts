import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

import { buildAvailableIntents, getIntentPolicy, intentCatalog } from "@/api/inputEvaluator/inputEvaluatorCatalog";
import {
	IntentRouterOutputSchema,
	RouterModelPayloadSchema,
	type InputEvaluatorRequest,
	type IntentRouterOutput,
} from "@/api/inputEvaluator/inputEvaluatorModel";
import { INPUT_EVALUATOR_SYSTEM_PROMPT } from "@/api/inputEvaluator/inputEvaluatorPrompt";
import { ModelFactory } from "@/common/factories/modelFactory";
import { createLogger } from "@/common/utils/logger";

const logger = createLogger("input-evaluator-repository");

type IntentRouterModel = Pick<BaseChatModel, "invoke">;

export interface InputEvaluatorRepositoryContract {
	evaluate(request: InputEvaluatorRequest): Promise<IntentRouterOutput>;
}

export class InputEvaluatorRepository implements InputEvaluatorRepositoryContract {
	private readonly model: IntentRouterModel;

	constructor(model?: IntentRouterModel) {
		this.model =
			model ??
			ModelFactory.createRoutingModel({
				temperature: 0,
				maxTokens: 1_800,
			});
	}

	public async evaluate(request: InputEvaluatorRequest): Promise<IntentRouterOutput> {
		const parser = StructuredOutputParser.fromZodSchema(IntentRouterOutputSchema as any);
		const payload = RouterModelPayloadSchema.parse({
			catalog_version: intentCatalog.catalog_version,
			utterance: request.utterance,
			channel: request.channel,
			locale: request.locale,
			selected_context: request.selected_context,
			pending_action_context: request.pending_action_context,
			available_intents: buildAvailableIntents(),
		});

		const response = await this.model.invoke([
			new SystemMessage(INPUT_EVALUATOR_SYSTEM_PROMPT),
			new HumanMessage(`${JSON.stringify(payload, null, 2)}\n\n${parser.getFormatInstructions()}`),
		]);

		const responseText = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
		const parsed = IntentRouterOutputSchema.parse(await parser.parse(responseText));

		if (parsed.catalog_version !== intentCatalog.catalog_version) {
			throw new Error(
				`Router returned catalog version ${parsed.catalog_version}; expected ${intentCatalog.catalog_version}`,
			);
		}

		getIntentPolicy(parsed.intent.name);

		logger.info(
			{
				intent: parsed.intent.name,
				confidence: parsed.intent.confidence,
				status: parsed.status,
				reasonCode: parsed.reason_code,
				promptInjection: parsed.suspected_prompt_injection,
			},
			"Input evaluated",
		);

		return parsed;
	}
}
