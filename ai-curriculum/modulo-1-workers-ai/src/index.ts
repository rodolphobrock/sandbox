import { parseGenerateRequest, parseEmbedRequest, runGenerate, runEmbed, runGeneratePaidExample } from "./handlers";

export interface Env {
	AI: Ai;
}

async function jsonBody(request: Request): Promise<unknown> {
	try {
		return await request.json();
	} catch {
		throw new Error("Corpo da requisição não é um JSON válido");
	}
}

function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

function isPaidPlanError(err: unknown): boolean {
	return err instanceof Error && /Workers Paid plan|\b5035\b/i.test(err.message);
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/generate" && request.method === "POST") {
			let prompt: string;
			try {
				({ prompt } = parseGenerateRequest(await jsonBody(request)));
			} catch (err) {
				return Response.json({ error: errorMessage(err) }, { status: 400 });
			}
			try {
				const result = await runGenerate(env.AI, prompt);
				return Response.json(result);
			} catch (err) {
				return Response.json({ error: errorMessage(err) }, { status: 502 });
			}
		}

		if (url.pathname === "/embed" && request.method === "POST") {
			let text: string;
			try {
				({ text } = parseEmbedRequest(await jsonBody(request)));
			} catch (err) {
				return Response.json({ error: errorMessage(err) }, { status: 400 });
			}
			try {
				const result = await runEmbed(env.AI, text);
				return Response.json(result);
			} catch (err) {
				return Response.json({ error: errorMessage(err) }, { status: 502 });
			}
		}

		if (url.pathname === "/generate-paid-example" && request.method === "POST") {
			let prompt: string;
			try {
				({ prompt } = parseGenerateRequest(await jsonBody(request)));
			} catch (err) {
				return Response.json({ error: errorMessage(err) }, { status: 400 });
			}
			try {
				const result = await runGeneratePaidExample(env.AI, prompt);
				return Response.json(result);
			} catch (err) {
				return Response.json({ error: errorMessage(err) }, { status: isPaidPlanError(err) ? 403 : 502 });
			}
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
