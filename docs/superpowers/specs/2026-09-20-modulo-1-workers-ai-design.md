# Módulo 1 — Workers AI (POC)

Parte do currículo definido em [2026-09-20-cloudflare-ai-curriculum-master-plan.md](2026-09-20-cloudflare-ai-curriculum-master-plan.md).

## Objetivo

Primeiro contato hands-on com Workers AI: rodar inferência (texto e embedding) direto de um Worker, sem gerenciar GPU, e entender na prática o modelo de custo em Neurons e o que cabe no free tier.

## Escopo

- Um único Worker (`ai-curriculum/modulo-1-workers-ai/`), com binding `env.AI` para Workers AI.
- Dois tipos de chamada, para cobrir os dois usos que os módulos seguintes vão precisar:
  1. **Geração de texto (LLM)**: um endpoint que recebe um prompt e retorna a resposta de um modelo de chat/instruct.
  2. **Embedding**: um endpoint que recebe um texto e retorna o vetor gerado por um modelo de embedding (isso prepara terreno pro Módulo 2 — Vectorize).
- Deploy em `*.workers.dev` via Wrangler.
- Validação manual via `curl`/navegador nos dois endpoints.
- Checagem do consumo de Neurons no dashboard (`Zero Trust` não se aplica aqui — é o dashboard normal de conta, `AI > Workers AI`).

## Fora de escopo

- Vectorize, AI Gateway, Access — cada um entra no seu próprio módulo depois.
- Streaming de resposta, function calling, ou qualquer feature avançada do binding — só a chamada básica.
- Escolha "definitiva" de modelo — a POC serve para descobrir na prática quais modelos rodam de graça no plano Free da conta `sandbox-br`.

## Passos

1. `npm create cloudflare@latest` — projeto Worker only, TypeScript, sem deploy automático.
2. Adicionar o binding `AI` no `wrangler.toml`/`wrangler.jsonc`.
3. Consultar o catálogo atual de modelos (`/workers-ai/models/` ou dashboard) e escolher: um modelo de texto que conste como disponível no plano Free (ex.: família `@cf/google/gemma-*` ou `@cf/meta/llama-*` — confirmar nome exato no catálogo no momento da implementação, pois muda com frequência) e um modelo de embedding (ex.: família `@cf/baai/bge-*` — idem, confirmar nome atual).
4. Implementar rota `/generate` chamando `env.AI.run(<modelo-texto>, { prompt })`.
5. Implementar rota `/embed` chamando `env.AI.run(<modelo-embedding>, { text })`.
6. `wrangler deploy` para `*.workers.dev`.
7. Testar as duas rotas com `curl`.
8. Abrir o dashboard (`AI > Workers AI` na conta `sandbox-br`) e confirmar que o uso apareceu como Neurons consumidos, e comparar com a cota gratuita diária (10.000 Neurons/dia).
9. Tentar deliberadamente um modelo "pesado" (da lista que exige Workers Paid, ex. `@cf/moonshotai/kimi-*` ou `@cf/zai-org/glm-5.*`) e confirmar que retorna erro `403`/pedido de upgrade — para documentar a fronteira real do free tier.

## Critério de sucesso

- `/generate` e `/embed` respondem corretamente com um modelo do plano Free, sem custo.
- Uso de Neurons visível e rastreável no dashboard.
- Fronteira do free tier confirmada na prática (qual modelo funciona grátis, qual exige upgrade).

## Achados a registrar (em `docs/cloudflare-ai-curriculum-notes.md`)

- Tempo de setup do zero até primeira resposta.
- Nome exato dos modelos usados (texto e embedding) e se estavam no free tier.
- Consumo de Neurons observado para os testes feitos.
- Qualquer fricção (erro de binding, limite de taxa, modelo indisponível na região, etc.).
