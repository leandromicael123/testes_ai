import { describe, expect, it } from "vitest";

import { INPUT_EVALUATOR_SYSTEM_PROMPT } from "@/api/inputEvaluator/inputEvaluatorPrompt";

describe("Intent Router prompt contract", () => {
	it.each([
		"Não executas ações",
		"Não decides permissões",
		"available_intents",
		"selected_context",
		"pending_action_context",
		"CREATE_DOCUMENT_DRAFT",
		"PREPARE_FLOW_ACTION",
		"suspected_prompt_injection=true",
		"additionalProperties",
	])("contains mandatory production rule: %s", (fragment) => {
		expect(INPUT_EVALUATOR_SYSTEM_PROMPT).toContain(fragment);
	});

	it("separates language classification from authorization and execution", () => {
		expect(INPUT_EVALUATOR_SYSTEM_PROMPT).toContain(
			"A autorização, a resolução final de entidades, a classe de risco, a confirmação e a execução",
		);
	});

	it("requires JSON-only output", () => {
		expect(INPUT_EVALUATOR_SYSTEM_PROMPT).toContain("Responde apenas com JSON");
		expect(INPUT_EVALUATOR_SYSTEM_PROMPT).toContain("Não uses Markdown");
	});
});
