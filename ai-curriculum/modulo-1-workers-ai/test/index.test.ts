import { describe, it, expect, vi } from "vitest";
import worker, { type Env } from "../src/index";

function fakeEnv(run: ReturnType<typeof vi.fn>): Env {
	return { AI: { run } as unknown as Ai };
}

const ctx = {} as ExecutionContext;

describe("fetch handler", () => {
	it("retorna 404 para rota desconhecida", async () => {
		const res = await worker.fetch(new Request("http://example.com/unknown"), fakeEnv(vi.fn()), ctx);
		expect(res.status).toBe(404);
	});

	it("retorna 400 quando falta 'prompt' em /generate", async () => {
		const res = await worker.fetch(
			new Request("http://example.com/generate", { method: "POST", body: JSON.stringify({}) }),
			fakeEnv(vi.fn()),
			ctx,
		);
		expect(res.status).toBe(400);
	});

	it("chama env.AI.run e retorna 200 em /generate valido", async () => {
		const run = vi.fn().mockResolvedValue({ response: "ola" });
		const res = await worker.fetch(
			new Request("http://example.com/generate", { method: "POST", body: JSON.stringify({ prompt: "oi" }) }),
			fakeEnv(run),
			ctx,
		);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ response: "ola" });
	});

	it("retorna 400 quando falta 'text' em /embed", async () => {
		const res = await worker.fetch(
			new Request("http://example.com/embed", { method: "POST", body: JSON.stringify({}) }),
			fakeEnv(vi.fn()),
			ctx,
		);
		expect(res.status).toBe(400);
	});

	it("chama env.AI.run e retorna 200 em /embed valido", async () => {
		const run = vi.fn().mockResolvedValue({ data: [[0.1, 0.2]] });
		const res = await worker.fetch(
			new Request("http://example.com/embed", { method: "POST", body: JSON.stringify({ text: "oi" }) }),
			fakeEnv(run),
			ctx,
		);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ data: [[0.1, 0.2]] });
	});

	it("retorna 403 quando o modelo pago falha em /generate-paid-example", async () => {
		const run = vi.fn().mockRejectedValue(new Error("Workers AI error 5035: model requires Workers Paid plan"));
		const res = await worker.fetch(
			new Request("http://example.com/generate-paid-example", {
				method: "POST",
				body: JSON.stringify({ prompt: "oi" }),
			}),
			fakeEnv(run),
			ctx,
		);
		expect(res.status).toBe(403);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("5035");
	});

	it("chama env.AI.run e retorna 200 em /generate-paid-example valido", async () => {
		const run = vi.fn().mockResolvedValue({ response: "ola" });
		const res = await worker.fetch(
			new Request("http://example.com/generate-paid-example", {
				method: "POST",
				body: JSON.stringify({ prompt: "oi" }),
			}),
			fakeEnv(run),
			ctx,
		);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ response: "ola" });
	});

	it("retorna 502 (nao 403) quando /generate-paid-example falha por um motivo nao relacionado ao plano pago", async () => {
		const run = vi.fn().mockRejectedValue(new Error("Workers AI indisponivel"));
		const res = await worker.fetch(
			new Request("http://example.com/generate-paid-example", {
				method: "POST",
				body: JSON.stringify({ prompt: "oi" }),
			}),
			fakeEnv(run),
			ctx,
		);
		expect(res.status).toBe(502);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("Workers AI indisponivel");
	});

	it("retorna 400 com mensagem clara quando o corpo nao e JSON valido em /generate", async () => {
		const res = await worker.fetch(
			new Request("http://example.com/generate", { method: "POST", body: "{isso nao e json" }),
			fakeEnv(vi.fn()),
			ctx,
		);
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("JSON válido");
	});

	it("retorna 502 quando env.AI.run falha em /generate", async () => {
		const run = vi.fn().mockRejectedValue(new Error("Workers AI indisponivel"));
		const res = await worker.fetch(
			new Request("http://example.com/generate", { method: "POST", body: JSON.stringify({ prompt: "oi" }) }),
			fakeEnv(run),
			ctx,
		);
		expect(res.status).toBe(502);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("Workers AI indisponivel");
	});

	it("retorna 502 quando env.AI.run falha em /embed", async () => {
		const run = vi.fn().mockRejectedValue(new Error("Workers AI indisponivel"));
		const res = await worker.fetch(
			new Request("http://example.com/embed", { method: "POST", body: JSON.stringify({ text: "oi" }) }),
			fakeEnv(run),
			ctx,
		);
		expect(res.status).toBe(502);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("Workers AI indisponivel");
	});
});
