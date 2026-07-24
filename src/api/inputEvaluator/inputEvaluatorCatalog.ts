import {
	AvailableIntentSchema,
	IntentCatalogSchema,
	IntentNameSchema,
	type CatalogIntent,
	type IntentCatalog,
	type IntentName,
} from "@/api/inputEvaluator/inputEvaluatorModel";

interface IntentDefinition {
	required_slots: string[];
	examples: string[];
}

export const intentCatalog: IntentCatalog = IntentCatalogSchema.parse({
	catalog_version: "2026.07.1",
	intents: [
		{ name: "HELP", risk: "A", confirmation: "none", executor: "ui.help" },
		{
			name: "CANCEL_CURRENT_OPERATION",
			risk: "A",
			confirmation: "none",
			executor: "orchestrator.cancel",
		},
		{
			name: "CONFIRM_PENDING_ACTION",
			risk: "derived",
			confirmation: "pending_policy",
			executor: "orchestrator.confirm",
		},
		{
			name: "REJECT_PENDING_ACTION",
			risk: "A",
			confirmation: "none",
			executor: "orchestrator.reject",
		},
		{ name: "OPEN_DOCUMENT", risk: "B", confirmation: "ambiguity_only", executor: "edoc.documents.open" },
		{ name: "OPEN_FOLDER", risk: "B", confirmation: "ambiguity_only", executor: "edoc.folders.open" },
		{ name: "OPEN_FLOW", risk: "B", confirmation: "ambiguity_only", executor: "edoc.flows.open" },
		{ name: "OPEN_TASK", risk: "B", confirmation: "ambiguity_only", executor: "edoc.tasks.open" },
		{ name: "SEARCH_GLOBAL", risk: "B", confirmation: "none", executor: "edoc.search.global" },
		{ name: "SEARCH_DOCUMENTS", risk: "B", confirmation: "none", executor: "edoc.search.documents" },
		{ name: "SEARCH_FOLDERS", risk: "B", confirmation: "none", executor: "edoc.search.folders" },
		{ name: "SEARCH_FLOWS", risk: "B", confirmation: "none", executor: "edoc.search.flows" },
		{ name: "SEARCH_TASKS", risk: "B", confirmation: "none", executor: "edoc.search.tasks" },
		{ name: "LIST_ATTACHMENTS", risk: "B", confirmation: "none", executor: "edoc.attachments.list" },
		{ name: "VIEW_HISTORY", risk: "B", confirmation: "none", executor: "edoc.history.view" },
		{ name: "VIEW_VERSIONS", risk: "B", confirmation: "none", executor: "edoc.versions.view" },
		{ name: "VIEW_RELATED_OBJECTS", risk: "B", confirmation: "none", executor: "edoc.relations.view" },
		{ name: "READ_VISIBLE_CONTENT", risk: "A", confirmation: "none", executor: "voice.read" },
		{ name: "CONTROL_READING", risk: "A", confirmation: "none", executor: "voice.control" },
		{ name: "SUMMARIZE_DOCUMENT", risk: "A/B", confirmation: "none", executor: "rag.summarize" },
		{ name: "ASK_DOCUMENT", risk: "A/B", confirmation: "none", executor: "rag.answer" },
		{
			name: "CREATE_DOCUMENT_DRAFT",
			risk: "C",
			confirmation: "visual_required",
			executor: "edoc.documents.prepareCreate",
		},
		{
			name: "CREATE_FOLDER_DRAFT",
			risk: "C",
			confirmation: "visual_required",
			executor: "edoc.folders.prepareCreate",
		},
		{
			name: "SET_FIELD_VALUE",
			risk: "C",
			confirmation: "before_persist",
			executor: "orchestrator.updateDraft",
		},
		{
			name: "CLASSIFY_OBJECT",
			risk: "C",
			confirmation: "before_persist",
			executor: "orchestrator.classifyDraft",
		},
		{ name: "SAVE_DRAFT", risk: "C", confirmation: "visual_required", executor: "edoc.drafts.save" },
		{ name: "RESUME_DRAFT", risk: "B", confirmation: "ambiguity_only", executor: "edoc.drafts.open" },
		{
			name: "PREPARE_FLOW_ACTION",
			risk: "D",
			confirmation: "strong",
			executor: "edoc.flows.prepareAction",
		},
		{ name: "OUT_OF_SCOPE", risk: "none", confirmation: "none", executor: null },
		{ name: "NO_ACTION", risk: "none", confirmation: "none", executor: null },
	],
});

export const intentDefinitions: Record<IntentName, IntentDefinition> = {
	NO_ACTION: { required_slots: [], examples: ["Olá", "Obrigado"] },
	HELP: {
		required_slots: [],
		examples: ["O que posso fazer com o assistente?", "Ajuda-me a usar o edoclink"],
	},
	CANCEL_CURRENT_OPERATION: { required_slots: [], examples: ["Cancela a operação atual"] },
	CONFIRM_PENDING_ACTION: { required_slots: [], examples: ["Sim", "Confirmo", "Avança"] },
	REJECT_PENDING_ACTION: { required_slots: [], examples: ["Não", "Rejeita", "Não avances"] },
	OPEN_DOCUMENT: {
		required_slots: ["document_reference_or_context"],
		examples: ["Abre o documento 2026/123"],
	},
	OPEN_FOLDER: { required_slots: ["folder_reference_or_context"], examples: ["Abre a pasta Contratos"] },
	OPEN_FLOW: { required_slots: ["flow_reference_or_context"], examples: ["Abre o fluxo de aprovação"] },
	OPEN_TASK: { required_slots: ["task_reference_or_context"], examples: ["Abre a tarefa atual"] },
	SEARCH_GLOBAL: { required_slots: ["query"], examples: ["Pesquisa globalmente por ACME"] },
	SEARCH_DOCUMENTS: { required_slots: ["query_or_filter"], examples: ["Procura faturas da ACME"] },
	SEARCH_FOLDERS: { required_slots: ["query_or_filter"], examples: ["Procura pastas de contratos"] },
	SEARCH_FLOWS: { required_slots: ["query_or_filter"], examples: ["Procura fluxos de aprovação"] },
	SEARCH_TASKS: { required_slots: ["query_or_filter"], examples: ["Mostra as minhas tarefas pendentes"] },
	LIST_ATTACHMENTS: {
		required_slots: ["document_reference_or_context"],
		examples: ["Mostra os anexos deste documento"],
	},
	VIEW_HISTORY: {
		required_slots: ["object_reference_or_context"],
		examples: ["Mostra o histórico deste documento"],
	},
	VIEW_VERSIONS: {
		required_slots: ["document_reference_or_context"],
		examples: ["Mostra as versões do documento"],
	},
	VIEW_RELATED_OBJECTS: {
		required_slots: ["object_reference_or_context"],
		examples: ["Mostra os objetos relacionados"],
	},
	READ_VISIBLE_CONTENT: { required_slots: [], examples: ["Lê o conteúdo visível"] },
	CONTROL_READING: { required_slots: ["reading_control"], examples: ["Pausa a leitura", "Continua a ler"] },
	SUMMARIZE_DOCUMENT: {
		required_slots: ["document_reference_or_context"],
		examples: ["Resume este documento"],
	},
	ASK_DOCUMENT: {
		required_slots: ["question", "document_reference_or_context"],
		examples: ["Qual é a data de validade deste contrato?"],
	},
	CREATE_DOCUMENT_DRAFT: {
		required_slots: ["document_type"],
		examples: ["Cria um documento do tipo Fatura"],
	},
	CREATE_FOLDER_DRAFT: { required_slots: ["title"], examples: ["Cria uma pasta chamada Contratos 2026"] },
	SET_FIELD_VALUE: {
		required_slots: ["field_name", "field_value"],
		examples: ["Define o campo Estado como Aprovado"],
	},
	CLASSIFY_OBJECT: {
		required_slots: ["classification", "object_reference_or_context"],
		examples: ["Classifica este documento como Confidencial"],
	},
	SAVE_DRAFT: { required_slots: ["draft_reference_or_context"], examples: ["Guarda o rascunho"] },
	RESUME_DRAFT: {
		required_slots: ["draft_reference_or_context"],
		examples: ["Continua o rascunho anterior"],
	},
	PREPARE_FLOW_ACTION: {
		required_slots: ["flow_action", "object_reference_or_context"],
		examples: ["Prepara a aprovação desta etapa"],
	},
	OUT_OF_SCOPE: { required_slots: [], examples: ["Qual é a previsão meteorológica?"] },
};

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
		const definition = intentDefinitions[intent.name];
		return AvailableIntentSchema.parse({
			name: IntentNameSchema.parse(intent.name),
			required_slots: definition.required_slots,
			examples: definition.examples,
		});
	});
}
