import { describe, it, expect, vi } from "vitest";
import {
	parseGenerateRequest,
	parseEmbedRequest,
	runGenerate,
	runEmbed,
	runGeneratePaidExample,
	TEXT_MODEL,
	EMBEDDING_MODEL,
	PAID_ONLY_MODEL,
} from "../src/handlers";

describe("parseGenerateRequest", () => {
	it("aceita um body valido", () => {
		expect(parseGenerateRequest({ prompt: "oi" })).toEqual({ prompt: "oi" });
	});

	it("rejeita body sem prompt", () => {
		expect(() => parseGenerateRequest({})).toThrow("Campo 'prompt'");
	});

	it("rejeita prompt vazio", () => {
		expect(() => parseGenerateRequest({ prompt: "   " })).toThrow("Campo 'prompt'");
	});

	it("rejeita prompt maior que 2000 caracteres", () => {
		const longPrompt = "a".repeat(2001);
		expect(() => parseGenerateRequest({ prompt: longPrompt })).toThrow("2000 caracteres");
	});
});

describe("parseEmbedRequest", () => {
	it("aceita um body valido", () => {
		expect(parseEmbedRequest({ text: "oi" })).toEqual({ text: "oi" });
	});

	it("rejeita body sem text", () => {
		expect(() => parseEmbedRequest({})).toThrow("Campo 'text'");
	});

	it("rejeita text maior que 2000 caracteres", () => {
		const longText = "a".repeat(2001);
		expect(() => parseEmbedRequest({ text: longText })).toThrow("2000 caracteres");
	});
});

describe("runGenerate", () => {
	it("chama ai.run com o modelo de texto e a mensagem do usuario", async () => {
		const fakeAi = { run: vi.fn().mockResolvedValue({ response: "ola" }) };
		const result = await runGenerate(fakeAi as unknown as Ai, "diga oi");
		expect(fakeAi.run).toHaveBeenCalledWith(TEXT_MODEL, {
			messages: [
				{ role: "system", content: "You are a helpful assistant." },
				{ role: "user", content: "diga oi" },
			],
		});
		expect(result).toEqual({ response: "ola" });
	});
});

describe("runEmbed", () => {
	it("chama ai.run com o modelo de embedding e o texto encapsulado em array", async () => {
		const fakeAi = { run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2]] }) };
		const result = await runEmbed(fakeAi as unknown as Ai, "algum texto");
		expect(fakeAi.run).toHaveBeenCalledWith(EMBEDDING_MODEL, { text: ["algum texto"] });
		expect(result).toEqual({ data: [[0.1, 0.2]] });
	});
});

describe("runGeneratePaidExample", () => {
	it("chama ai.run com o modelo que exige plano pago", async () => {
		const fakeAi = { run: vi.fn().mockResolvedValue({ response: "nunca deveria chegar aqui no free tier" }) };
		const result = await runGeneratePaidExample(fakeAi as unknown as Ai, "oi");
		expect(fakeAi.run).toHaveBeenCalledWith(PAID_ONLY_MODEL, {
			messages: [
				{ role: "system", content: "You are a helpful assistant." },
				{ role: "user", content: "oi" },
			],
		});
		expect(result).toEqual({ response: "nunca deveria chegar aqui no free tier" });
	});
});
