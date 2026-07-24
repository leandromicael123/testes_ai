import rawCatalog from "@/api/inputEvaluator/config/intent_catalog_edoclink.json";
import rawDefinitions from "@/api/inputEvaluator/config/intent_definitions_edoclink.json";
import {
	AvailableIntentSchema,
	IntentCatalogSchema,
	IntentNameSchema,
	type CatalogIntent,
	type IntentCatalog,
	type IntentName,
} from "@/api/inputEvaluator/inputEvaluatorModel";

export const intentCatalog: IntentCatalog = IntentCatalogSchema.parse(rawCatalog);

const intentDefinitions = rawDefinitions as Record<
	IntentName,
	{ required_slots: string[]; examples: string[] }
>;

const catalogIndex = new Map<IntentName, CatalogIntent>(
	intentCatalog.intents.map((intent) => [intent.name, intent]),
);

export function getIntentPolicy(intentName: IntentName): CatalogIntent {
	const policy = catalogIndex.get(intentName);
	if (!policy) {
		throw new Error(`Intent ${intentName} is not present in catalog ${intentCatalog.catalog_version}`);
	}
	return policy;
}

export function buildAvailableIntents() {
	return intentCatalog.intents.map((intent) => {
		const definition = intentDefinitions[intent.name] ?? { required_slots: [], examples: [] };
		return AvailableIntentSchema.parse({
			name: IntentNameSchema.parse(intent.name),
			required_slots: definition.required_slots,
			examples: definition.examples,
		});
	});
}
