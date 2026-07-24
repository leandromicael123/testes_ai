import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { inputEvaluatorController } from "@/api/inputEvaluator/inputEvaluatorController";
import {
	InputEvaluatorRequestSchema,
	IntentRouterOutputSchema,
} from "@/api/inputEvaluator/inputEvaluatorModel";
import { validateRequest } from "@/common/utils/httpHandlers";

export const inputEvaluatorRegistry = new OpenAPIRegistry();
export const inputEvaluatorRouter: Router = express.Router();

inputEvaluatorRegistry.register("InputEvaluatorRequest", InputEvaluatorRequestSchema);
inputEvaluatorRegistry.register("IntentRouterOutput", IntentRouterOutputSchema);

inputEvaluatorRegistry.registerPath({
	method: "post",
	path: "/input-evaluator",
	tags: ["Input Evaluator"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: InputEvaluatorRequestSchema,
				},
			},
		},
	},
	responses: createApiResponse(IntentRouterOutputSchema, "Intent routing result"),
});

inputEvaluatorRouter.post("/", validateRequest(InputEvaluatorRequestSchema), inputEvaluatorController.evaluate);
