# Cloudflare MCP Security (Access + Portals) — POC/MVP/V1

## Contexto

Estudo prático da oferta da Cloudflare para proteger MCP servers:

- [Secure MCP Servers](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/secure-mcp-servers/) — Cloudflare Access na frente de um MCP server (modelo *customer-managed*, o server mantém seu próprio OAuth; ou modelo *SaaS-managed*, Access vira o IdP OIDC do server).
- [MCP Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/) — camada de agregação: vários MCP servers atrás de um único endpoint, com tool aliasing, DLP/logging via Gateway, service tokens para M2M, Code Mode.

## Objetivo

Não é construir um sistema para produção. É **aprender fazendo** — sentir setup, fricções e limites reais dessas duas features — e produzir uma **avaliação comparativa** (custo, facilidade, agilidade, lock-in) contra alternativas de mercado, para identificar onde isso se aplicaria em ideias futuras do usuário.

## Fora de escopo

- Qualquer integração com um MCP server "real" de produção.
- Domínio próprio / DNS customizado (usa-se `*.workers.dev`).
- Hardening de segurança além do necessário para o aprendizado (ex.: rotação de secrets, monitoramento contínuo).
- Automação via Terraform/API — tudo é feito manualmente pelo dashboard Zero Trust para maximizar aprendizado das telas e fluxos.

## Conta e pré-requisitos

- Conta Cloudflare `sandbox-br`, plano **Zero Trust Free**, isolada e efêmera — dedicada só a esta POC.
- Identity provider já conectado nessa conta (confirmado pelo dashboard).
- Hospedagem via `*.workers.dev` (sem custo, sem domínio próprio) — suportado tanto por Secure MCP Servers quanto por MCP Portals.
- Requer Node.js/npm + Wrangler CLI localmente para deploy dos Workers.
- **Ponto de atenção a validar durante a POC**: a documentação não deixa explícito se AI Controls (Secure MCP Servers / MCP Portals) exige plano pago. Primeiro passo prático é confirmar no dashboard `sandbox-br` (Zero Trust Free) se o menu "Access controls > AI controls" está disponível e sem paywall. Se estiver bloqueado, o achado em si já é dado relevante para o relatório final de custo.

## Fase 1 — POC

**Objetivo**: primeiro fluxo completo, ponta a ponta, de um MCP server protegido por Cloudflare Access.

1. Construir um MCP server mínimo em Cloudflare Workers usando `McpAgent` (padrão da skill `cloudflare:build-mcp`), com 1–2 tools triviais (ex.: `get_time`, `echo`).
2. Deploy em `*.workers.dev` via Wrangler.
3. Proteger via modelo **SaaS-managed**: criar aplicação SaaS (OIDC) no Zero Trust, Access como IdP, configurar client ID/secret/endpoints e `COOKIE_ENCRYPTION_KEY` como secrets do Worker.
4. Configurar política de Access (quem pode autenticar) usando o IdP já conectado na conta.
5. Validar o fluxo de login + chamada de tool autenticada usando MCP Inspector (ou Workers AI Playground).

**Critério de sucesso**: uma chamada de tool não autenticada é bloqueada/redirecionada para login; após autenticar via IdP, a chamada funciona e o token/identidade chega ao Worker.

**Nota sobre o modelo customer-managed**: não será implementado na POC — ele pressupõe um MCP server de terceiro que já tem seu próprio OAuth, o que não se aplica a um server construído do zero. Fica registrado só como conhecimento (documentado no relatório final).

## Fase 2 — MVP

**Objetivo**: cobrir superfície suficiente de features para avaliar custo/agilidade com realismo.

1. Construir um segundo MCP server (caso de uso levemente mais "real" — ex.: notas/tarefas com Workers KV), também em `*.workers.dev`.
2. Criar um **MCP Portal** agregando os dois servers (o da POC + este novo).
3. Configurar tool aliasing (renomear/descrever tools) para observar o efeito de otimização de contexto.
4. Configurar um **service token** para acesso M2M (sem fluxo de browser) e testar chamando o portal programaticamente.
5. Ativar roteamento via **Gateway** (logging HTTP e, se disponível no plano, DLP) e observar os logs gerados.
6. Testar limites documentados: transporte SSE não suportado via Gateway (validar que Streamable HTTP funciona), sincronização manual de tools/prompts do OAuth inicial.

**Critério de sucesso**: um único endpoint (portal) expõe tools dos dois servers, com pelo menos um caminho de autenticação humana (browser/IdP) e um caminho M2M (service token) funcionando.

## Fase 3 — V1 (entregável)

**Não é código** — é um documento (`docs/cloudflare-mcp-security-evaluation.md`) contendo:

1. Recapitulação da arquitetura (Secure MCP Servers + Portals) com os dois modelos de auth.
2. Achados práticos da POC/MVP: tempo de setup, fricções encontradas, limitações reais batidas (das listadas na doc oficial + as descobertas na prática).
3. Modelo de custo: o que é Free vs. o que exige plano pago (Zero Trust plans), inferido a partir do que foi observado na conta `sandbox-br`.
4. Matriz comparativa vs. alternativas de mercado — candidatos a pesquisar: auth "roll-your-own" (JWT/OAuth no próprio server), WorkOS AuthKit / Descope / Auth0 (soluções de auth com suporte a MCP), API Gateway genérico (Kong, AWS API Gateway + Cognito), gateways especializados em MCP (Arcade.dev, Composio, Klavis, Portkey). Dimensões: custo, facilidade de setup, agilidade/time-to-value, lock-in, profundidade de features (DLP, agregação multi-server, M2M).
5. Recomendação: em quais tipos de ideias/projetos do usuário isso se encaixaria, e critérios de decisão para escolher Cloudflare vs. alternativa.

## Riscos / limitações conhecidas (da documentação, a confirmar na prática)

- Plano Free pode não expor AI Controls — validar cedo (Fase 1, passo 0).
- MCP Portal: só servers HTTP remotos (sem stdio); limite de 80 servers/portal (irrelevante na escala desta POC).
- Sync de tools/prompts capturado só na primeira autorização OAuth — não atualiza sozinho em background.
- Tokens de admin expiram silenciosamente (sem notificação) — checar status periodicamente durante os testes.
- MFA/purpose-justification/auth temporária não são aplicados a servers autorizados via portal.
- Gateway: SSE não suportado, só Streamable HTTP.

## Estrutura de arquivos no repo

```
sandbox/
├── mcp-servers/
│   ├── poc-toy-server/       # Fase 1 — Worker com McpAgent
│   └── mvp-notes-server/     # Fase 2 — segundo Worker
├── docs/
│   ├── superpowers/specs/2026-09-20-cloudflare-mcp-security-poc-design.md   # este documento
│   └── cloudflare-mcp-security-evaluation.md   # entregável da Fase 3 (V1)
```
