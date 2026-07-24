import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const InputIntentSchema = z.enum([
	"SEARCH",
	"CREATE_DOCUMENT",
	"ANALYZE_DOCUMENT",
	"OPEN_DOCUMENT",
	"UPDATE_DOCUMENT",
	"DELETE_DOCUMENT",
	"CREATE_FOLDER",
	"MOVE_DOCUMENT",
	"CREATE_FLOW",
	"NAVIGATE",
	"GENERAL_QUESTION",
	"UNKNOWN",
]);

export type InputIntent = z.infer<typeof InputIntentSchema>;

export const RiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const TargetHandlerSchema = z.enum([
	"search",
	"documentCreate",
	"documentAnalysis",
	"documentRead",
	"documentUpdate",
	"documentDelete",
	"folderCreate",
	"documentMove",
	"flowCreate",
	"navigate",
	"chat",
	"none",
]);

export type TargetHandler = z.infer<typeof TargetHandlerSchema>;

export const InputEvaluatorContextSchema = z.object({
	currentPage: z.string().trim().min(1).optional(),
	currentDocumentId: z.string().trim().min(1).nullable().optional(),
	currentFolderId: z
		.union([z.string().trim().min(1), z.number().int()])
		.nullable()
		.optional(),
	selectedDocumentIds: z.array(z.string().trim().min(1)).default([]),
	language: z.string().trim().min(2).default("pt-PT"),
	availableIntents: z.array(InputIntentSchema).optional(),
	metadata: z.record(z.any()).default({}),
});

export type InputEvaluatorContext = z.infer<typeof InputEvaluatorContextSchema>;

export const InputEvaluatorRequestSchema = z.object({
	input: z.string().trim().min(1, "Input is required").max(10_000),
	context: InputEvaluatorContextSchema.optional(),
});

export type InputEvaluatorRequest = z.infer<typeof InputEvaluatorRequestSchema>;

export const InputEntitiesSchema = z.object({
	query: z.string().optional(),
	documentId: z.string().optional(),
	documentType: z.string().optional(),
	subject: z.string().optional(),
	folderId: z.union([z.string(), z.number()]).optional(),
	destinationFolderId: z.union([z.string(), z.number()]).optional(),
	fileName: z.string().optional(),
	fileIds: z.array(z.string()).optional(),
	flowId: z.string().optional(),
	stageId: z.string().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	metadata: z.record(z.any()).default({}),
});

export type InputEntities = z.infer<typeof InputEntitiesSchema>;

export const InputEvaluationResultSchema = z.object({
	intent: InputIntentSchema,
	confidence: z.number().min(0).max(1),
	entities: InputEntitiesSchema.default({ metadata: {} }),
	missingFields: z.array(z.string()).default([]),
	riskLevel: RiskLevelSchema,
	requiresConfirmation: z.boolean(),
	clarificationQuestion: z.string().nullable().default(null),
	targetHandler: TargetHandlerSchema,
	explanation: z.string().trim().min(1).max(500),
});

export type InputEvaluationResult = z.infer<typeof InputEvaluationResultSchema>;
