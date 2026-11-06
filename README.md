# engineering-harness

Um sistema de engenharia reutilizável para desenvolvimento assistido por agentes
de IA. Otimiza para **software funcionando em produção**, não para geração de
código: evidência antes de suposição, mudanças pequenas e reversíveis, testes
como prova, observabilidade, segurança e aprendizado do projeto.

É um plugin do Claude Code: conhecimento, procedimentos e configuração. Não há
servidor, banco de dados nem CLI.

```text
engineering-harness                       seu projeto
├── core/        policy e ciclo de vida   ├── AGENTS.md            contexto do projeto
├── skills/      12 procedimentos         ├── CLAUDE.md            @AGENTS.md
├── profiles/    conhecimento de stack    ├── .claude/settings.json  habilita o plugin
├── templates/   arquivos de projeto      ├── docs/adr/            decisões
├── bin/         context loader           └── .engineering/
└── hooks/       SessionStart do Claude       ├── harness.yaml     versão + profiles
                                              ├── overrides/       regras próprias
                                              └── memory/          gotchas, descobertas
```

## Skills

| Skill | Para quê |
|---|---|
| `investigate` | Entender o problema e juntar evidência antes de mexer no código (read-only) |
| `design` | System design com números, opções e trade-offs, publicado como página de discussão com diagrama (draw.io ou Mermaid) |
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
as dez primeiras sozinho pela descrição.

## Adotar num projeto (Claude Code)

1. Uma vez por máquina. O marketplace é o próprio repositório, público no
   GitHub:

   ```bash
   claude plugin marketplace add codando-io/officina
   claude plugin install eng@engineering-harness
   ```

   Num projeto que já adotou o harness, o `.claude/settings.json` declara o
   marketplace e habilita o plugin para quem confia na pasta.

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

## Licença

Apache-2.0. Veja [LICENSE](LICENSE) e [NOTICE](NOTICE). Copyright 2026 Codando Software.
