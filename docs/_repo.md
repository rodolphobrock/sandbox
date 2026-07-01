# sandbox — doc canônica do repositório

## Propósito

Espaço de experimentação e prototipagem rápida. Não destinado a uso em produção. Conteúdo pode ser incompleto, instável ou removido a qualquer momento.

## Estrutura de diretórios

```
sandbox/
├── .ghia/          # Configuração do ciclo GHIA (config.json)
├── docs/           # Documentação canônica (arquivos _*.md)
├── LICENSE
└── README.md
```

## Convenções de commit

Conventional Commits com escopo opcional. Formato:

```
type(scope): summary — descrição
```

Separador entre summary e descrição: ` — ` (em dash). Types em uso: `chore`, `docs`, `ci`, `feat`, `fix`.
