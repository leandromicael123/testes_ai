import cases from "@/api/inputEvaluator/__tests__/fixtures/inputEvaluatorCases.json";
import type {
	InputEvaluatorRequest,
	IntentName,
	IntentRouterOutput,
	IntentStatus,
	ObjectType,
	ReasonCode,
} from "@/api/inputEvaluator/inputEvaluatorModel";

export interface InputEvaluatorCase {
	id: string;
	utterance: string;
	selected_context?: InputEvaluatorRequest["selected_context"];
	pending_action_context?: InputEvaluatorRequest["pending_action_context"];
	expected: {
		intents: IntentName[];
		statuses: IntentStatus[];
		reason_codes: ReasonCode[];
		injection: boolean;
	};
	critical: boolean;
}

export const inputEvaluatorCases = cases as InputEvaluatorCase[];

export function makeRequest(testCase: InputEvaluatorCase): InputEvaluatorRequest {
	return {
		utterance: testCase.utterance,
		channel: "text",
		locale: "pt-PT",
		selected_context: testCase.selected_context ?? {
			page: null,
			object_type: null,
			object_reference: null,
			object_name: null,
		},
		pending_action_context: testCase.pending_action_context ?? null,
	};
}

export function makeOutput(overrides: Partial<IntentRouterOutput> = {}): IntentRouterOutput {
	return {
		schema_version: "1.0",
		catalog_version: "2026.07.1",
		language: "pt-PT",
		status: "READY",
		intent: { name: "SEARCH_DOCUMENTS", confidence: 0.95 },
		target: { object_type: "document", reference: null, name: null },
		entities: [],
		filters: [],
		missing_slots: [],
		clarification: { question: null, options: [] },
		reason_code: "EXPLICIT_COMMAND",
		suspected_prompt_injection: false,
		...overrides,
	};
}

function resolveIntentName(testCase: InputEvaluatorCase, status: IntentStatus): IntentName {
	if (status === "NO_ACTION") return "NO_ACTION";
	if (status === "OUT_OF_SCOPE") return "OUT_OF_SCOPE";
	return testCase.expected.intents[0];
}

function resolveObjectType(intentName: IntentName): ObjectType {
	if (intentName === "CREATE_DOCUMENT_DRAFT") return "document";
	if (intentName === "CREATE_FOLDER_DRAFT") return "folder";
	if (intentName === "SAVE_DRAFT" || intentName === "RESUME_DRAFT") return "draft";
	if (intentName.includes("FOLDER")) return "folder";
	if (intentName.includes("FLOW")) return "flow";
	if (intentName.includes("TASK")) return "task";
	if (intentName === "READ_VISIBLE_CONTENT" || intentName === "CONTROL_READING") return "current_view";
	if (intentName === "NO_ACTION" || intentName === "HELP" || intentName === "OUT_OF_SCOPE") return "none";
	return "document";
}

export function makeOutputForCase(testCase: InputEvaluatorCase): IntentRouterOutput {
	const status = testCase.expected.statuses[0];
	const intentName = resolveIntentName(testCase, status);
	const needsClarification = status === "NEEDS_CLARIFICATION";
	const hasMissingSlot = testCase.expected.reason_codes.includes("MISSING_REQUIRED_SLOT");

	return makeOutput({
		status,
		intent: {
			name: intentName,
			confidence: testCase.critical ? 0.95 : 0.85,
		},
		target: {
			object_type: resolveObjectType(intentName),
			reference: testCase.selected_context?.object_reference ?? null,
			name: testCase.selected_context?.object_name ?? null,
		},
		missing_slots: hasMissingSlot ? ["object_reference_or_context"] : [],
		clarification: needsClarification
			? {
					question: "Qual é a ação ou o objeto que pretende utilizar?",
					options: [],
				}
			: {
					question: null,
					options: [],
				},
		reason_code: testCase.expected.reason_codes[0],
		suspected_prompt_injection: testCase.expected.injection,
	});
}
