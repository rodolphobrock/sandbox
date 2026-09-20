# Cloudflare AI — Currículo de Aprendizado (Plano Mestre)

## Contexto

Estudo prático de toda a oferta de IA da Cloudflare — não só segurança de MCP servers, mas a pilha inteira: Workers AI, Vectorize, AI Gateway, AI Search, Agents SDK, e Access AI Controls (Secure MCP Servers + MCP Portals, já speccado em [2026-09-20-cloudflare-mcp-security-poc-design.md](2026-09-20-cloudflare-mcp-security-poc-design.md)).

## Objetivo

Aprender fazendo, módulo por módulo, para no final:

1. Ter um agente de IA no ar — com memória, busca semântica sobre dados próprios e ferramentas — exposto com segurança a clientes de IA existentes (Claude Desktop e similares) via MCP.
2. Saber, com dado real observado (não achismo de doc), o que é gratuito, quando compensa pagar, e como isso se compara com alternativas de mercado (OpenAI/Anthropic direto + Pinecone/pgvector + LangChain, AWS Bedrock, Vertex AI Search, Auth0/WorkOS para auth de agentes).

## Conta e ambiente (vale para todos os módulos)

- Conta Cloudflare `sandbox-br`, Zero Trust Free, isolada e efêmera.
- Hospedagem via `*.workers.dev` — sem domínio próprio.
- Identity provider já conectado nessa conta.

## Estrutura do currículo

Cada módulo é um sub-projeto independente com seu próprio ciclo spec → plano → implementação, mas builda em cima do anterior (exceto onde indicado):

| # | Módulo | Depende de | O que você vai conseguir fazer |
|---|--------|-----------|----------------------------------|
| 1 | Workers AI | — | Chamar um LLM/embedding no seu próprio código sem hospedar modelo nenhum |
| 2 | Vectorize | 1 | Construir busca semântica do zero ("conversar com seus documentos", manual) |
| 3 | AI Gateway | 1, 2 | Ver quanto uma feature de IA custa de verdade e colocar teto/cache nela |
| 4 | AI Search | 1, 2 (para comparação) | Ter o mesmo "conversar com documentos", mas gerenciado — comparar construir vs. comprar |
| 5 | Agents SDK | 1–4 (usa como tools) | Construir um agente com estado, agendamento e ferramentas — sair do "uma chamada de LLM" pro agente de verdade |
| 6 | Access AI Controls (Secure MCP Servers + MCP Portals) | 5 (protege o output) | Expor as ferramentas do agente a clientes de IA externos, com login corporativo e agregação num portal único |

Módulo 6 já tem spec própria escrita ([2026-09-20-cloudflare-mcp-security-poc-design.md](2026-09-20-cloudflare-mcp-security-poc-design.md)). Os módulos 1–5 serão speccados um a um, na ordem, antes de cada implementação — este documento é o mapa, não o detalhe de cada um.

## Fora de escopo (todo o currículo)

- **AI Crawl Control** — é defensivo (bloquear crawlers de IA no seu site), não "construir com IA"; fica de fora do currículo, só citado no relatório final por completude.
- Fine-tuning de modelos customizados.
- Cargas de produção ou dados sensíveis reais.
- Domínio próprio / DNS customizado.

## Registro de achados

Cada módulo, ao ser implementado, registra seus achados (tempo de setup, fricções, custo real observado, limites batidos na prática) em [docs/cloudflare-ai-curriculum-notes.md](../../cloudflare-ai-curriculum-notes.md), uma seção por módulo.

## Entregável final

Depois do módulo 6, os achados acumulados viram um relatório único de avaliação (`docs/cloudflare-ai-security-evaluation.md`) cobrindo os 6 módulos: o que cada um entrega, custo real, e comparação com stacks de mercado — para identificar onde essa oferta se aplica em ideias futuras.
