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
