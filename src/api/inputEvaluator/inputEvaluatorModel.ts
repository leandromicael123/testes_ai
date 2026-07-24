import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const SupportedLanguageSchema = z.enum(["pt-PT", "pt", "en", "es", "fr", "de", "ar", "unknown"]);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

export const IntentStatusSchema = z.enum(["READY", "NEEDS_CLARIFICATION", "OUT_OF_SCOPE", "NO_ACTION"]);
export type IntentStatus = z.infer<typeof IntentStatusSchema>;

export const IntentNameSchema = z.enum([
	"NO_ACTION",
	"HELP",
	"CANCEL_CURRENT_OPERATION",
	"CONFIRM_PENDING_ACTION",
	"REJECT_PENDING_ACTION",
	"OPEN_DOCUMENT",
	"OPEN_FOLDER",
	"OPEN_FLOW",
	"OPEN_TASK",
	"SEARCH_GLOBAL",
	"SEARCH_DOCUMENTS",
	"SEARCH_FOLDERS",
	"SEARCH_FLOWS",
	"SEARCH_TASKS",
	"LIST_ATTACHMENTS",
	"VIEW_HISTORY",
	"VIEW_VERSIONS",
	"VIEW_RELATED_OBJECTS",
	"READ_VISIBLE_CONTENT",
	"CONTROL_READING",
	"SUMMARIZE_DOCUMENT",
	"ASK_DOCUMENT",
	"CREATE_DOCUMENT_DRAFT",
	"CREATE_FOLDER_DRAFT",
	"SET_FIELD_VALUE",
	"CLASSIFY_OBJECT",
	"SAVE_DRAFT",
	"RESUME_DRAFT",
	"PREPARE_FLOW_ACTION",
	"OUT_OF_SCOPE",
]);
export type IntentName = z.infer<typeof IntentNameSchema>;

export const ObjectTypeSchema = z.enum([
	"document",
	"folder",
	"flow",
	"task",
	"file",
	"draft",
	"current_view",
	"none",
]);
export type ObjectType = z.infer<typeof ObjectTypeSchema>;

export const EntityTypeSchema = z.enum([
	"document_reference",
	"folder_reference",
	"flow_reference",
	"task_reference",
	"title",
	"document_type",
	"classification",
	"entity",
	"date",
	"date_range",
	"status",
	"owner",
	"stage",
	"field_name",
	"field_value",
	"flow_action",
	"reading_control",
	"sort",
	"limit",
	"free_text",
]);

export const EntitySourceSchema = z.enum(["utterance", "selected_context", "pending_action_context"]);

export const FilterOperatorSchema = z.enum([
	"eq",
	"neq",
	"contains",
	"starts_with",
	"before",
	"after",
	"between",
	"in",
]);

export const ReasonCodeSchema = z.enum([
	"EXPLICIT_COMMAND",
	"CONTEXTUAL_COMMAND",
	"AMBIGUOUS_INTENT",
	"MISSING_REQUIRED_SLOT",
	"MULTIPLE_INDEPENDENT_ACTIONS",
	"UNSUPPORTED_OPERATION",
	"CONVERSATIONAL_ONLY",
	"PENDING_CONFIRMATION",
	"PENDING_CANCELLATION",
	"POSSIBLE_INSTRUCTION_INJECTION",
]);
export type ReasonCode = z.infer<typeof ReasonCodeSchema>;

export const IntentTargetSchema = z
	.object({
		object_type: ObjectTypeSchema,
		reference: z.string().max(200).nullable(),
		name: z.string().max(300).nullable(),
	})
	.strict();

export const IntentEntitySchema = z
	.object({
		type: EntityTypeSchema,
		raw_value: z.string().max(1_000),
		normalized_value: z.union([z.string().max(1_000), z.number(), z.boolean(), z.null()]),
		source: EntitySourceSchema,
		confidence: z.number().min(0).max(1),
	})
	.strict();

export const IntentFilterSchema = z
	.object({
		field: z.string().max(100),
		operator: FilterOperatorSchema,
		value: z.union([
			z.string().max(1_000),
			z.number(),
			z.boolean(),
			z.array(z.union([z.string(), z.number(), z.boolean()])).max(50),
		]),
	})
	.strict();

export const IntentRouterOutputSchema = z
	.object({
		schema_version: z.literal("1.0"),
		catalog_version: z.string().min(1).max(40),
		language: SupportedLanguageSchema,
		status: IntentStatusSchema,
		intent: z
			.object({
				name: IntentNameSchema,
				confidence: z.number().min(0).max(1),
			})
			.strict(),
		target: IntentTargetSchema,
		entities: z.array(IntentEntitySchema).max(30),
		filters: z.array(IntentFilterSchema).max(20),
		missing_slots: z.array(z.string().max(100)).max(10),
		clarification: z
			.object({
				question: z.string().max(500).nullable(),
				options: z.array(z.string().max(300)).max(8),
			})
			.strict(),
		reason_code: ReasonCodeSchema,
		suspected_prompt_injection: z.boolean(),
	})
	.strict()
	.superRefine((value, context) => {
		if (value.status === "NEEDS_CLARIFICATION" && !value.clarification.question?.trim()) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["clarification", "question"],
				message: "A clarification question is required when status is NEEDS_CLARIFICATION",
			});
		}
		if (value.missing_slots.length > 0 && value.status !== "NEEDS_CLARIFICATION") {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["status"],
				message: "Missing slots require NEEDS_CLARIFICATION status",
			});
		}
		if (value.status === "OUT_OF_SCOPE" && value.intent.name !== "OUT_OF_SCOPE") {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["intent", "name"],
				message: "OUT_OF_SCOPE status requires OUT_OF_SCOPE intent",
			});
		}
		if (value.status === "NO_ACTION" && value.intent.name !== "NO_ACTION") {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["intent", "name"],
				message: "NO_ACTION status requires NO_ACTION intent",
			});
		}
	});

export type IntentRouterOutput = z.infer<typeof IntentRouterOutputSchema>;

export const SelectedContextSchema = z
	.object({
		page: z.string().max(200).nullable().default(null),
		object_type: ObjectTypeSchema.nullable().default(null),
		object_reference: z.string().max(200).nullable().default(null),
		object_name: z.string().max(300).nullable().default(null),
	})
	.strict();

export const PendingActionContextSchema = z
	.object({
		action_id: z.string().min(1).max(200),
		intent_name: IntentNameSchema,
		target: IntentTargetSchema.optional(),
		state: z.enum(["PENDING_CONFIRMATION", "PENDING_INPUT", "PENDING_EXECUTION"]).default("PENDING_CONFIRMATION"),
	})
	.strict();

export const InputEvaluatorRequestSchema = z
	.object({
		utterance: z.string().trim().min(1, "Utterance is required").max(10_000),
		channel: z.enum(["text", "voice", "api", "unknown"]).default("text"),
		locale: SupportedLanguageSchema.default("pt-PT"),
		selected_context: SelectedContextSchema.default({
			page: null,
			object_type: null,
			object_reference: null,
			object_name: null,
		}),
		pending_action_context: PendingActionContextSchema.nullable().default(null),
	})
	.strict();

export type InputEvaluatorRequest = z.infer<typeof InputEvaluatorRequestSchema>;

export const CatalogIntentSchema = z
	.object({
		name: IntentNameSchema,
		risk: z.enum(["A", "B", "C", "D", "A/B", "derived", "none"]),
		confirmation: z.enum(["none", "ambiguity_only", "visual_required", "before_persist", "strong", "pending_policy"]),
		executor: z.string().min(1).nullable(),
	})
	.strict();

export const IntentCatalogSchema = z
	.object({
		catalog_version: z.string().min(1).max(40),
		intents: z.array(CatalogIntentSchema).min(1),
	})
	.strict();

export type CatalogIntent = z.infer<typeof CatalogIntentSchema>;
export type IntentCatalog = z.infer<typeof IntentCatalogSchema>;

export const AvailableIntentSchema = z
	.object({
		name: IntentNameSchema,
		required_slots: z.array(z.string().max(100)),
		examples: z.array(z.string().max(500)),
	})
	.strict();

export const RouterModelPayloadSchema = z
	.object({
		catalog_version: z.string().min(1).max(40),
		utterance: z.string().min(1).max(10_000),
		channel: z.enum(["text", "voice", "api", "unknown"]),
		locale: SupportedLanguageSchema,
		selected_context: SelectedContextSchema,
		pending_action_context: PendingActionContextSchema.nullable(),
		available_intents: z.array(AvailableIntentSchema).min(1),
	})
	.strict();

export type RouterModelPayload = z.infer<typeof RouterModelPayloadSchema>;
