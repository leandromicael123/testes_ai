import cases from "@/api/inputEvaluator/__tests__/fixtures/inputEvaluatorCases.json";
import type {
	InputEvaluatorRequest,
	IntentName,
	IntentRouterOutput,
	IntentStatus,
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
