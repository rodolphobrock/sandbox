# Cloudflare AI — Notas e Achados do Currículo

Log vivo de achados práticos por módulo. Alimenta o relatório final de avaliação. Ver plano mestre em [docs/superpowers/specs/2026-09-20-cloudflare-ai-curriculum-master-plan.md](superpowers/specs/2026-09-20-cloudflare-ai-curriculum-master-plan.md).

## Módulo 1 — Workers AI

- **Tempo de setup** (do zero até a primeira resposta em `/generate`): rápido no código em si (scaffold + handlers + router com TDD, ~3 tasks encadeadas); o tempo real foi consumido por fricções de ambiente locais (ver abaixo), não pela Cloudflare.
- **Modelo de texto usado**: `@cf/google/gemma-4-26b-a4b-it` — free tier: **sim**, respondeu normalmente (200) tanto local quanto em produção.
- **Modelo de embedding usado**: `@cf/baai/bge-base-en-v1.5` — free tier: **sim**, retornou vetor de 768 dimensões (200) local e em produção.
- **Modelo pago testado**: `@cf/zai-org/glm-5.2` — resultado observado: **HTTP 403**, corpo `{"error":"5035: Model @cf/zai-org/glm-5.2 is not available on the Workers Free plan. Upgrade to access this model: ..."}` — confirmado local e em produção, exatamente como a doc previa.
- **Neurons consumidos nos testes**: ~16,5 Neurons observados só nas duas chamadas de `/generate` (12,44 local + 4,07 em produção), reportados pela própria API (`usage.neurons` na resposta) — bem abaixo da cota diária gratuita de 10.000 Neurons/dia. Chamadas de `/embed` não retornam o campo `neurons` explicitamente no corpo (só `usage.prompt_tokens`/`total_tokens`), custo desprezível pra esse volume.
- **URL pública do Worker**: <https://modulo-1-workers-ai.sandbox-br.workers.dev>
- **Fricções encontradas** (nenhuma foi da Cloudflare/Workers AI em si — todas de ambiente local Windows):
  - A conta `sandbox-br` precisou ter um subdomínio `workers.dev` registrado manualmente antes do primeiro `wrangler dev`/`deploy` — a UI de onboarding do dashboard não funcionou para o usuário; resolvido chamando a API da Cloudflare diretamente (`PUT /accounts/{id}/workers/subdomain`).
  - Instalação local do Node (via nvm4w) estava com o link da versão ativa apagado (`C:\nvm4w\nodejs`); foi relocado para `D:\.libs\nodejs`, exigindo reinício da sessão pra propagar o novo PATH.
  - **Node v24.18.0 quebra o spawn de processo filho do esbuild dentro do Wrangler no Windows** (`spawn UNKNOWN` em `ensureServiceIsRunning`), reproduzível até em `wrangler deploy --dry-run`. Trocar para **Node v26.7.0** resolveu.
  - Falhas adicionais (crash nativo do V8, `EINVAL` em `worker_threads`, "JavaScript heap out of memory") não eram bug de código nem de versão — a máquina ficou com **0,35 GB de RAM livre de 13,85 GB total**. Depois de fechar programas (~5,45 GB livres), `wrangler dev` subiu de primeira.
  - **Conclusão prática para o currículo**: reserve Node 22 LTS ou 26.x (evite 24.18.0 no Windows) e confirme RAM livre (>2-3 GB) antes de rodar `wrangler dev`/`deploy` nesta máquina.

## Módulo 2 — Vectorize

- a preencher

## Módulo 3 — AI Gateway

- a preencher

## Módulo 4 — AI Search

- a preencher

## Módulo 5 — Agents SDK

- a preencher

## Módulo 6 — Access AI Controls (Secure MCP Servers + MCP Portals)

- a preencher
