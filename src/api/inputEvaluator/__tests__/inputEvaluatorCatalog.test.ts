import { describe, expect, it } from "vitest";

import definitions from "@/api/inputEvaluator/config/intent_definitions_edoclink.json";
import schema from "@/api/inputEvaluator/config/intent_schema_edoclink.json";
import { buildAvailableIntents, getIntentPolicy, intentCatalog } from "@/api/inputEvaluator/inputEvaluatorCatalog";
import { IntentNameSchema } from "@/api/inputEvaluator/inputEvaluatorModel";

describe("Intent catalog consistency", () => {
	it("contains unique intent names", () => {
		const names = intentCatalog.intents.map((intent) => intent.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it.each(intentCatalog.intents.map((intent) => [intent.name, intent] as const))(
		"catalog intent %s is accepted by the runtime schema",
		(_name, intent) => {
			expect(IntentNameSchema.parse(intent.name)).toBe(intent.name);
			expect(getIntentPolicy(intent.name)).toEqual(intent);
		},
	);

	it("keeps JSON Schema enum aligned with the runtime catalog", () => {
		const schemaIntentNames = new Set(
			(schema as any).properties.intent.properties.name.enum as string[],
		);
		const catalogIntentNames = new Set(intentCatalog.intents.map((intent) => intent.name));
		expect(schemaIntentNames).toEqual(catalogIntentNames);
	});

	it("has routing definitions for every catalog intent", () => {
		const definitionNames = new Set(Object.keys(definitions));
		for (const intent of intentCatalog.intents) {
			expect(definitionNames.has(intent.name)).toBe(true);
		}
	});

	it("builds available_intents dynamically from the catalog", () => {
		const available = buildAvailableIntents();
		expect(available).toHaveLength(intentCatalog.intents.length);
		expect(available.map((intent) => intent.name)).toEqual(intentCatalog.intents.map((intent) => intent.name));
	});

	it.each(intentCatalog.intents.map((intent) => [intent.name, intent.executor] as const))(
		"intent %s has a valid deterministic executor contract",
		(name, executor) => {
			if (name === "NO_ACTION" || name === "OUT_OF_SCOPE") {
				expect(executor).toBeNull();
			} else {
				expect(executor).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/);
			}
		},
	);
});
