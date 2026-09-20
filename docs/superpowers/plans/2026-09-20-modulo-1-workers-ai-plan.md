# Módulo 1 — Workers AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rodar inferência de texto e embedding via Workers AI a partir de um Worker próprio, entender o binding `env.AI`, e confirmar na prática a fronteira do free tier (10.000 Neurons/dia) na conta `sandbox-br`.

**Architecture:** Um único Cloudflare Worker (TypeScript, sem framework) com três rotas HTTP (`/generate`, `/embed`, `/generate-paid-example`), cada uma delegando para uma função pura em `src/handlers.ts` que recebe o binding `Ai` por parâmetro (facilita teste com um fake). Lógica de parsing/validação e de chamada ao binding tem testes unitários com Vitest (sem tocar a API real); a chamada real ao Workers AI só acontece nas verificações manuais (dev local e produção), que consomem Neurons de verdade.

**Tech Stack:** TypeScript, Cloudflare Workers, Wrangler CLI, Vitest, `@cloudflare/workers-types`.

**Spec:** [docs/superpowers/specs/2026-09-20-modulo-1-workers-ai-design.md](../specs/2026-09-20-modulo-1-workers-ai-design.md)

## Global Constraints

- Conta Cloudflare: `sandbox-br` (Zero Trust Free) — sem domínio próprio, hospedagem em `*.workers.dev`.
- Fora de escopo neste módulo: Vectorize, AI Gateway, Access — só Workers AI puro.
- Modelo de texto: `@cf/google/gemma-4-26b-a4b-it` (confirmado no free tier pela doc oficial).
- Modelo de embedding: `@cf/baai/bge-base-en-v1.5` (confirmado no free tier pela doc oficial).
- Modelo usado só para confirmar a fronteira do plano pago: `@cf/zai-org/glm-5.2`.
- **Usar Workers AI sempre consome a conta real, mesmo em `wrangler dev` local** — não existe modo 100% offline/grátis para a chamada de IA em si.
- Projeto vive em `ai-curriculum/modulo-1-workers-ai/` dentro deste repositório (não é um repo git separado).

---

### Task 1: Scaffold do projeto e binding do Workers AI

**Files:**
- Create: `ai-curriculum/modulo-1-workers-ai/package.json`
- Create: `ai-curriculum/modulo-1-workers-ai/tsconfig.json`
- Create: `ai-curriculum/modulo-1-workers-ai/wrangler.jsonc`
- Create: `ai-curriculum/modulo-1-workers-ai/.gitignore`

**Interfaces:**
- Produces: projeto Node com scripts `npm run dev` (`wrangler dev`), `npm run deploy` (`wrangler deploy`), `npm test` (`vitest run`); binding `AI` disponível em `env.AI` nas próximas tasks; `tsconfig.json` com `types: ["@cloudflare/workers-types"]` para o tipo global `Ai` existir.

- [ ] **Step 1: Criar `package.json`**

```json
{
	"name": "modulo-1-workers-ai",
	"private": true,
	"version": "0.0.0",
	"scripts": {
		"dev": "wrangler dev",
		"deploy": "wrangler deploy",
		"test": "vitest run"
	}
}
```

- [ ] **Step 2: Instalar as dependências de desenvolvimento**

Run (dentro de `ai-curriculum/modulo-1-workers-ai/`):

```bash
npm install -D typescript vitest wrangler @cloudflare/workers-types
```

Expected: `package.json` ganha um bloco `devDependencies` com essas 4 libs e `package-lock.json` é criado.

- [ ] **Step 3: Criar `tsconfig.json`**

```json
{
	"compilerOptions": {
		"target": "ES2021",
		"lib": ["ES2021"],
		"module": "ES2022",
		"moduleResolution": "Bundler",
		"types": ["@cloudflare/workers-types"],
		"strict": true,
		"skipLibCheck": true,
		"resolveJsonModule": true,
		"esModuleInterop": true,
		"isolatedModules": true,
		"noEmit": true
	},
	"include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 4: Criar `wrangler.jsonc` com o binding do Workers AI**

```jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "modulo-1-workers-ai",
	"main": "src/index.ts",
	"compatibility_date": "2026-09-20",
	"ai": {
		"binding": "AI"
	}
}
```

- [ ] **Step 5: Criar `.gitignore`**

```
node_modules
.wrangler
.dev.vars
```

- [ ] **Step 6: Commit**

```bash
git add ai-curriculum/modulo-1-workers-ai/package.json ai-curriculum/modulo-1-workers-ai/package-lock.json ai-curriculum/modulo-1-workers-ai/tsconfig.json ai-curriculum/modulo-1-workers-ai/wrangler.jsonc ai-curriculum/modulo-1-workers-ai/.gitignore
git commit -m "feat(modulo-1-workers-ai): scaffold do projeto com binding Workers AI"
```

---

### Task 2: Handlers de geração de texto e embedding (TDD)

**Files:**
- Create: `ai-curriculum/modulo-1-workers-ai/src/handlers.ts`
- Test: `ai-curriculum/modulo-1-workers-ai/test/handlers.test.ts`

**Interfaces:**
- Consumes: nada de tasks anteriores além do projeto scaffolded (Task 1).
- Produces: `TEXT_MODEL: string`, `EMBEDDING_MODEL: string`, `PAID_ONLY_MODEL: string`; `parseGenerateRequest(body: unknown): { prompt: string }` (lança `Error` se inválido); `parseEmbedRequest(body: unknown): { text: string }` (lança `Error` se inválido); `runGenerate(ai: Ai, prompt: string): Promise<unknown>`; `runEmbed(ai: Ai, text: string): Promise<unknown>`; `runGeneratePaidExample(ai: Ai, prompt: string): Promise<unknown>`. Task 3 (router) importa todas essas.

- [ ] **Step 1: Escrever os testes (vão falhar — `handlers.ts` ainda não existe)**

Criar `test/handlers.test.ts`:

```ts
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
});

describe("parseEmbedRequest", () => {
	it("aceita um body valido", () => {
		expect(parseEmbedRequest({ text: "oi" })).toEqual({ text: "oi" });
	});

	it("rejeita body sem text", () => {
		expect(() => parseEmbedRequest({})).toThrow("Campo 'text'");
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
		await runGeneratePaidExample(fakeAi as unknown as Ai, "oi");
		expect(fakeAi.run).toHaveBeenCalledWith(PAID_ONLY_MODEL, {
			messages: [
				{ role: "system", content: "You are a helpful assistant." },
				{ role: "user", content: "oi" },
			],
		});
	});
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/handlers'` (ou similar), porque `src/handlers.ts` não existe ainda.

- [ ] **Step 3: Implementar `src/handlers.ts`**

```ts
export const TEXT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
export const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
export const PAID_ONLY_MODEL = "@cf/zai-org/glm-5.2";

export interface GenerateRequest {
	prompt: string;
}

export interface EmbedRequest {
	text: string;
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

export function parseGenerateRequest(body: unknown): GenerateRequest {
	const prompt = (body as Record<string, unknown> | null)?.prompt;
	if (!isNonEmptyString(prompt)) {
		throw new Error("Campo 'prompt' (string não vazia) é obrigatório");
	}
	return { prompt };
}

export function parseEmbedRequest(body: unknown): EmbedRequest {
	const text = (body as Record<string, unknown> | null)?.text;
	if (!isNonEmptyString(text)) {
		throw new Error("Campo 'text' (string não vazia) é obrigatório");
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
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS — 8 testes passando (3 de `parseGenerateRequest`, 2 de `parseEmbedRequest`, 1 de `runGenerate`, 1 de `runEmbed`, 1 de `runGeneratePaidExample`).

- [ ] **Step 5: Commit**

```bash
git add ai-curriculum/modulo-1-workers-ai/src/handlers.ts ai-curriculum/modulo-1-workers-ai/test/handlers.test.ts
git commit -m "feat(modulo-1-workers-ai): handlers de generate/embed com testes unitarios"
```

---

### Task 3: Router HTTP do Worker (TDD)

**Files:**
- Create: `ai-curriculum/modulo-1-workers-ai/src/index.ts`
- Modify: `ai-curriculum/modulo-1-workers-ai/test/handlers.test.ts` → renomear/duplicar não é necessário; criar novo arquivo de teste dedicado ao router.
- Test: `ai-curriculum/modulo-1-workers-ai/test/index.test.ts`

**Interfaces:**
- Consumes: tudo de `src/handlers.ts` (Task 2): `parseGenerateRequest`, `parseEmbedRequest`, `runGenerate`, `runEmbed`, `runGeneratePaidExample`.
- Produces: `export interface Env { AI: Ai }`; `export default` um `ExportedHandler<Env>` com `fetch(request, env, ctx)`; rotas `POST /generate`, `POST /embed`, `POST /generate-paid-example`, qualquer outra rota → 404. Usado nas verificações manuais das Tasks 4 e 5.

- [ ] **Step 1: Escrever os testes do router (vão falhar — `index.ts` ainda não existe)**

Criar `test/index.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/index'`.

- [ ] **Step 3: Implementar `src/index.ts`**

```ts
import { parseGenerateRequest, parseEmbedRequest, runGenerate, runEmbed, runGeneratePaidExample } from "./handlers";

export interface Env {
	AI: Ai;
}

async function jsonBody(request: Request): Promise<unknown> {
	try {
		return await request.json();
	} catch {
		return null;
	}
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/generate" && request.method === "POST") {
			try {
				const { prompt } = parseGenerateRequest(await jsonBody(request));
				const result = await runGenerate(env.AI, prompt);
				return Response.json(result);
			} catch (err) {
				return Response.json({ error: (err as Error).message }, { status: 400 });
			}
		}

		if (url.pathname === "/embed" && request.method === "POST") {
			try {
				const { text } = parseEmbedRequest(await jsonBody(request));
				const result = await runEmbed(env.AI, text);
				return Response.json(result);
			} catch (err) {
				return Response.json({ error: (err as Error).message }, { status: 400 });
			}
		}

		if (url.pathname === "/generate-paid-example" && request.method === "POST") {
			let prompt: string;
			try {
				({ prompt } = parseGenerateRequest(await jsonBody(request)));
			} catch (err) {
				return Response.json({ error: (err as Error).message }, { status: 400 });
			}
			try {
				const result = await runGeneratePaidExample(env.AI, prompt);
				return Response.json(result);
			} catch (err) {
				return Response.json({ error: (err as Error).message }, { status: 403 });
			}
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS — todos os testes de `test/handlers.test.ts` e `test/index.test.ts` passando (14 no total).

- [ ] **Step 5: Commit**

```bash
git add ai-curriculum/modulo-1-workers-ai/src/index.ts ai-curriculum/modulo-1-workers-ai/test/index.test.ts
git commit -m "feat(modulo-1-workers-ai): router HTTP com rotas generate/embed/generate-paid-example"
```

---

### Task 4: Autenticar na conta `sandbox-br` e testar localmente

**Files:**
- Modify: `ai-curriculum/modulo-1-workers-ai/wrangler.jsonc` (adicionar `account_id`)

**Interfaces:**
- Consumes: `src/index.ts` e `src/handlers.ts` (Tasks 2 e 3), rodando via `wrangler dev`.
- Produces: confirmação manual (fora de teste automatizado) de que as 3 rotas funcionam contra o Workers AI real.

Nota: esta task é interativa — os passos de login e checagem de resposta são feitos por você, não são verificáveis por um assert automatizado.

- [ ] **Step 1: Login no Wrangler**

Run: `npx wrangler login`
Expected: abre o navegador, você autoriza o acesso à sua conta Cloudflare (a que contém `sandbox-br`).

- [ ] **Step 2: Identificar o Account ID da conta `sandbox-br`**

Run: `npx wrangler whoami`
Expected: uma tabela com as contas acessíveis. Localize a linha cujo nome é `sandbox-br` e copie o valor da coluna Account ID.

- [ ] **Step 3: Fixar a conta no `wrangler.jsonc`**

Adicionar a chave `account_id` (usando o valor copiado no Step 2) ao `wrangler.jsonc` criado na Task 1:

```jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "modulo-1-workers-ai",
	"main": "src/index.ts",
	"compatibility_date": "2026-09-20",
	"account_id": "<account-id-copiado-no-step-2>",
	"ai": {
		"binding": "AI"
	}
}
```

- [ ] **Step 4: Subir o dev server**

Run: `npm run dev`
Expected: Wrangler imprime uma URL local (ex. `http://localhost:8787`). Deixe rodando num terminal.

Atenção: isso consome Neurons reais da conta, mesmo local.

- [ ] **Step 5: Testar `/generate` manualmente**

Run (em outro terminal):

```bash
curl -s -X POST http://localhost:8787/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explique em uma frase o que é Cloudflare Workers"}'
```

Expected: JSON com um campo de resposta do modelo (ex. `{"response": "..."}`), HTTP 200.

- [ ] **Step 6: Testar `/embed` manualmente**

Run:

```bash
curl -s -X POST http://localhost:8787/embed \
  -H "Content-Type: application/json" \
  -d '{"text":"Cloudflare Workers roda codigo na borda da rede"}'
```

Expected: JSON com um vetor de números (`data`), HTTP 200.

- [ ] **Step 7: Confirmar a fronteira do free tier via `/generate-paid-example`**

Run:

```bash
curl -s -i -X POST http://localhost:8787/generate-paid-example \
  -H "Content-Type: application/json" \
  -d '{"prompt":"oi"}'
```

Expected: HTTP 403 (ou outro erro claro indicando exigência de plano pago) — isso confirma na prática que `@cf/zai-org/glm-5.2` não está disponível no free tier da conta `sandbox-br`. Se em vez disso vier 200, registre esse achado (o modelo pode ter mudado de tier) e ajuste `PAID_ONLY_MODEL` para outro modelo listado como "requires Workers Paid" na doc atual do catálogo.

- [ ] **Step 8: Parar o dev server e commitar o `account_id`**

```bash
git add ai-curriculum/modulo-1-workers-ai/wrangler.jsonc
git commit -m "chore(modulo-1-workers-ai): fixa account_id da conta sandbox-br"
```

---

### Task 5: Deploy em `workers.dev` e verificação final

**Files:** nenhum arquivo novo — só deploy e verificação manual.

**Interfaces:**
- Consumes: tudo das Tasks 1–4.
- Produces: URL pública `https://modulo-1-workers-ai.<seu-subdominio>.workers.dev` usada no registro de achados (Task 6).

- [ ] **Step 1: Deploy**

Run: `npm run deploy`
Expected: Wrangler imprime a URL pública em `*.workers.dev`. Anote essa URL.

- [ ] **Step 2: Repetir os 3 testes manuais da Task 4 (Steps 5–7) contra a URL pública**

Substitua `http://localhost:8787` pela URL anotada no Step 1 e rode os mesmos três `curl`. Confirme os mesmos resultados (200, 200, 403).

- [ ] **Step 3: Checar o consumo de Neurons no dashboard**

No dashboard Cloudflare da conta `sandbox-br`, ir em **AI > Workers AI** e anotar o total de Neurons consumidos pelos testes desta task e da Task 4.

---

### Task 6: Registrar achados e commit final

**Files:**
- Modify: `docs/cloudflare-ai-curriculum-notes.md` (seção "Módulo 1 — Workers AI")

**Interfaces:** nenhuma — task de documentação.

- [ ] **Step 1: Preencher a seção "Módulo 1 — Workers AI"**

Substituir o placeholder `_(a preencher durante a implementação)_` dessa seção por:

```markdown
- **Tempo de setup** (do zero até a primeira resposta em `/generate`): <preencher>
- **Modelo de texto usado**: `@cf/google/gemma-4-26b-a4b-it` — free tier: <sim/não, conforme observado>
- **Modelo de embedding usado**: `@cf/baai/bge-base-en-v1.5` — free tier: <sim/não, conforme observado>
- **Modelo pago testado**: `@cf/zai-org/glm-5.2` — resultado observado: <HTTP 403 / outro>
- **Neurons consumidos nos testes**: <valor observado no dashboard>
- **Fricções encontradas**: <preencher — ex. binding, autenticação, catálogo de modelos, etc.>
- **URL pública do Worker**: <URL do deploy>
```

Preencha os `<preencher>` com os valores reais observados nas Tasks 4 e 5 — não deixe nenhum como está.

- [ ] **Step 2: Commit**

```bash
git add docs/cloudflare-ai-curriculum-notes.md
git commit -m "docs(cloudflare-ai-curriculum): registra achados do modulo 1 (Workers AI)"
```
