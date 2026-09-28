# engineering-harness

Um sistema de engenharia reutilizável para desenvolvimento assistido por agentes
de IA. Otimiza para **software funcionando em produção**, não para geração de
código: evidência antes de suposição, mudanças pequenas e reversíveis, testes
como prova, observabilidade, segurança e aprendizado do projeto.

É um repositório de conhecimento, procedimentos, adapters e configuração. Não há
servidor, banco de dados nem CLI.

```text
engineering-harness                       seu projeto
├── core/        policy e ciclo de vida   ├── AGENTS.md            contexto do projeto
├── skills/      11 procedimentos         ├── CLAUDE.md            @AGENTS.md
├── profiles/    conhecimento de stack    ├── .claude/settings.json  habilita o plugin
├── templates/   arquivos de projeto      ├── docs/adr/            decisões
├── bin/         context loader           └── .engineering/
└── adapters/    Claude Code (+ design        ├── harness.yaml     versão + profiles
                 de Codex e Copilot)          ├── overrides/       regras próprias
                                              └── memory/          gotchas, descobertas
```

## Skills

| Skill | Para quê |
|---|---|
| `investigate` | Entender o problema e juntar evidência antes de mexer no código (read-only) |
| `plan` | Plano verificável: arquivos, passos, testes, rollback, Definition of Done |
| `implement` | Menor mudança coerente, seguindo os padrões existentes, conferida contra o plano |
| `test` | Teste como evidência: comportamento → teste → resultado |
| `review` | Review do diff real, com ledger de alegações |
| `security-audit` | Auditoria de segurança do repositório ou de um fluxo |
| `architecture-audit` | Problemas que nenhum PR mostra; modernização |
| `dependency-update` | Atualização em lote com piso de supply chain; upgrades de plataforma |
| `observability` | Instrumentar ou auditar OpenTelemetry |
| `release` | Cortar versão (só quando pedido) |
| `adopt` | Adotar, atualizar ou checar o harness num projeto (só quando pedido) |

No Claude Code: `/eng:investigate`, `/eng:review`, etc. O agente também escolhe
as nove primeiras sozinho pela descrição.

## Adotar num projeto (Claude Code)

1. Uma vez por máquina. O marketplace é o próprio repositório no Forgejo, e o
   `claude plugin marketplace add` não aceita URL `ssh://`, então a fonte entra
   direto no `~/.claude/settings.json`:

   ```json
   {
     "extraKnownMarketplaces": {
       "engineering-harness": {
         "source": {
           "source": "git",
           "url": "ssh://forgejo@src.capivaras.dev:2222/scriptorium/officina.git"
         }
       }
     }
   }
   ```

   Abra o Claude Code uma vez, para ele clonar o marketplace, e instale:

   ```bash
   claude plugin install eng@engineering-harness
   ```

   O repositório é privado: a máquina precisa de chave SSH autorizada no Forgejo.

2. No projeto, peça `/eng:adopt`. A skill inspeciona o repositório, escolhe o
   profile, cria `.engineering/`, preenche o `AGENTS.md` com fatos verificados,
   configura `CLAUDE.md` e `.claude/settings.json` e entrega tudo num commit numa
   branch nova.
3. Revise o PR. Na próxima sessão, o contexto do harness é carregado sozinho.

Detalhes, criação de skills e profiles, atualização: [IMPLEMENTATION.md](IMPLEMENTATION.md).

## Documentos

- [RESEARCH.md](RESEARCH.md): o que foi extraído dos artigos de referência e o que
  foi rejeitado.
- [ARCHITECTURE.md](ARCHITECTURE.md): o design, a crítica do primeiro design e as
  decisões.
- [IMPLEMENTATION.md](IMPLEMENTATION.md): como funciona e como usar.
- [CONTRIBUTING.md](CONTRIBUTING.md): onde cada mudança deve morar, critério para
  nova skill, processo de release.
- [CHANGELOG.md](CHANGELOG.md): versões e notas de migração.

## Desenvolvimento

```bash
node --test tests/*.test.mjs
```

```bash
claude plugin validate . --strict
```

Conteúdo para agentes (`core/`, `skills/`, `profiles/`, `templates/`) está em
inglês. Documentação para pessoas está em português.
