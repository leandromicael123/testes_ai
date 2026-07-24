import type { Request, RequestHandler, Response } from "express";

import { inputEvaluatorService } from "@/api/inputEvaluator/inputEvaluatorService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

export class InputEvaluatorController {
	public evaluate: RequestHandler = async (req: Request, res: Response): Promise<void> => {
		const serviceResponse = await inputEvaluatorService.evaluate(req.body);
		handleServiceResponse(serviceResponse, res);
	};
}

export const inputEvaluatorController = new InputEvaluatorController();
