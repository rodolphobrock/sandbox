export const TEXT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
export const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
export const PAID_ONLY_MODEL = "@cf/zai-org/glm-5.2";

export interface GenerateRequest {
	prompt: string;
}

export interface EmbedRequest {
	text: string;
}

const MAX_INPUT_LENGTH = 2000;

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

export function parseGenerateRequest(body: unknown): GenerateRequest {
	const prompt = (body as Record<string, unknown> | null)?.prompt;
	if (!isNonEmptyString(prompt)) {
		throw new Error("Campo 'prompt' (string não vazia) é obrigatório");
	}
	if (prompt.length > MAX_INPUT_LENGTH) {
		throw new Error(`Campo 'prompt' excede o limite de ${MAX_INPUT_LENGTH} caracteres`);
	}
	return { prompt };
}

export function parseEmbedRequest(body: unknown): EmbedRequest {
	const text = (body as Record<string, unknown> | null)?.text;
	if (!isNonEmptyString(text)) {
		throw new Error("Campo 'text' (string não vazia) é obrigatório");
	}
	if (text.length > MAX_INPUT_LENGTH) {
		throw new Error(`Campo 'text' excede o limite de ${MAX_INPUT_LENGTH} caracteres`);
	}
	return { text };
}

function chatMessages(prompt: string) {
	return {
		messages: [
			{ role: "system" as const, content: "You are a helpful assistant." },
			{ role: "user" as const, content: prompt },
		],
	};
}

export async function runGenerate(ai: Ai, prompt: string) {
	return ai.run(TEXT_MODEL, chatMessages(prompt));
}

export async function runGeneratePaidExample(ai: Ai, prompt: string) {
	return ai.run(PAID_ONLY_MODEL, chatMessages(prompt));
}

export async function runEmbed(ai: Ai, text: string) {
	return ai.run(EMBEDDING_MODEL, { text: [text] });
}
