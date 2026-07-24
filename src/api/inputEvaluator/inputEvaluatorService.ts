import { StatusCodes } from "http-status-codes";

import type { InputEvaluatorRequest, IntentRouterOutput } from "@/api/inputEvaluator/inputEvaluatorModel";
import {
	InputEvaluatorRepository,
	type InputEvaluatorRepositoryContract,
} from "@/api/inputEvaluator/inputEvaluatorRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { createLogger } from "@/common/utils/logger";

const logger = createLogger("input-evaluator-service");

export class InputEvaluatorService {
	constructor(private readonly repository: InputEvaluatorRepositoryContract = new InputEvaluatorRepository()) {}

	public async evaluate(request: InputEvaluatorRequest): Promise<ServiceResponse<IntentRouterOutput | null>> {
		try {
			const evaluation = await this.repository.evaluate(request);
			return ServiceResponse.success("Input evaluated successfully", evaluation);
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					utteranceLength: request.utterance.length,
				},
				"Failed to evaluate input",
			);
			return ServiceResponse.failure(
				"An error occurred while evaluating the input.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const inputEvaluatorService = new InputEvaluatorService();
