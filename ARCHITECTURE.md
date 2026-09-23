# Architecture

Fase 2 do `engineering-harness`. O documento tem três partes:

1. [Fatos verificados](#fatos-verificados-sobre-os-agentes) sobre os agentes, que
   restringem o design.
2. [Design v1](#design-v1-proposta-inicial), a proposta inicial, e a
   [crítica](#crítica-do-design-v1) dela.
3. [Design v2](#design-v2-o-que-foi-implementado), o design corrigido, que é o
   implementado.

Premissa de leitura: [RESEARCH.md](RESEARCH.md) explica de onde vêm os princípios.

---

## Fatos verificados sobre os agentes

Verificados na documentação oficial em 2026-09-23 com Claude Code 2.1.231
instalado. Onde não consegui verificar, está marcado.

**Claude Code** (<https://code.claude.com/docs/en/>)

| Fato | Fonte | Consequência para o design |
|---|---|---|
| Skills seguem o formato Agent Skills: diretório com `SKILL.md`, frontmatter `name`/`description`, arquivos de apoio. Só a descrição entra no contexto até a skill ser invocada. | `skills.md` | O núcleo pode ser escrito no padrão aberto e servir a vários agentes. |
| `description` + `when_to_use` limitados a 1.536 caracteres; corpo recomendado abaixo de 500 linhas. | `skills.md` | Teste automatizado de tamanho. |
| `disable-model-invocation: true` impede invocação automática; a skill só roda com `/nome`. | `skills.md` | Skills perigosas ou raras (`release`, `adopt`) não disputam roteamento. |
| Substituições: `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PROJECT_DIR}`. | `skills.md` | São específicas do Claude. Não uso no corpo das skills. |
| Plugin pode conter `skills/`, `hooks/`, `agents/`, `bin/` (vai para o `PATH`). Skills de plugin ficam com namespace `/plugin:skill`. | `plugins-reference.md` | O adapter do Claude Code é um plugin. |
| Um plugin **não pode** referenciar arquivos fora do próprio diretório (`path escapes plugin directory`). | `plugins-reference.md` | Skills, policies e profiles precisam estar dentro da raiz do plugin. |
| Uma entrada de marketplace pode ter `source: "./"`, isto é, a raiz do marketplace é o plugin. | `plugin-marketplaces.md` | O repositório inteiro do harness é, ao mesmo tempo, marketplace e plugin. Sem cópia, sem symlink. |
| `version` no `plugin.json` controla atualização: o usuário só recebe versão nova quando o campo muda. | `plugin-marketplaces.md` | `VERSION` do harness e `plugin.json` precisam andar juntos (teste). |
| `.claude/settings.json` do projeto declara `extraKnownMarketplaces` (objeto nome → `source`) e `enabledPlugins` (`"plugin@marketplace": true`). Só valem depois que a pessoa confia na pasta. | `settings-reference.md` | Adoção por projeto é uma mudança versionada no próprio projeto. |
| Hook `SessionStart` (matchers `startup`, `resume`, `clear`, `compact`): stdout vira contexto. | `hooks.md` | Mecanismo nativo para carregar policy, overrides e índice de memória, inclusive após compactação. |
| Claude lê `AGENTS.md` **só quando não existe** `CLAUDE.md` (padrão `claude-md-or-agents-md`). A documentação diz que a leitura direta exige v2.1.277+, mais nova que a 2.1.231 instalada aqui. Um `CLAUDE.md` com `@AGENTS.md` funciona nas duas. | `memory.md` | Projeto usa `AGENTS.md` como fonte e `CLAUDE.md` com uma linha de import. |
| Imports `@path` são relativos ao arquivo, até 4 níveis. Import para fora do repositório pede aprovação. | `memory.md` | Não importar arquivos do harness via `@~/...` a partir do projeto. O hook resolve isso. |
| Permissões `deny` em `.claude/settings.json` valem imediatamente. | `settings.md` | Proteção de secrets por mecanismo nativo, não por prompt. |

**Codex** (<https://developers.openai.com/codex/>): lê `AGENTS.md` global
(`~/.codex/AGENTS.md`) e do projeto; suporta skills no formato `SKILL.md` em
`~/.codex/skills`. *Não verificado*: leitura de `.agents/skills` no repositório e
sistema de plugins.

**GitHub Copilot** (<https://docs.github.com/en/copilot/>): instruções em
`.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`
(`applyTo`) e `AGENTS.md`; skills de projeto em `.github/skills/`,
`.claude/skills/` ou `.agents/skills/`. *Não verificado*: hooks de sessão e
diretório de skills pessoais.

**Agent Skills** (<https://agentskills.io>): padrão aberto para `SKILL.md`,
adotado pelos três agentes acima.

**Conclusão dos fatos.** O formato de skill já é portável. O que não é portável é
(a) como as skills chegam ao agente e (b) como o contexto "sempre presente" é
carregado. É exatamente isso que um adapter deve encapsular, e nada mais.

---

## Design v1 (proposta inicial)

A primeira versão seguia de perto a estrutura sugerida no pedido:

```text
engineering-harness/
├── skills/        investigate, plan, implement, test, review, security-audit,
│                  architecture-audit, dependency-update, observability, release
├── profiles/      dotnet-angular/ (+ placeholders dotnet-backend, node-backend,
│                  angular, library, infrastructure)
├── policies/      engineering.md, security.md, testing.md, git.md
├── workflows/     feature.md, bugfix.md, refactor.md, migration.md, release.md
├── templates/     adr.md, project.md, claude.md
├── adapters/claude-code/   script que cria symlinks em ~/.claude/skills
├── examples/
└── tests/
```

Projeto:

```yaml
# .engineering/config.yaml
harness: { version: "1" }
project: { profile: dotnet-angular }
engineering: { architecture: existing, testing: required, observability: opentelemetry }
deployment: { provider: azure }
```

```text
.engineering/memory/{decisions,discoveries,gotchas}/
```

## Crítica do design v1

Problemas encontrados, cada um com a correção aplicada no v2.

1. **Distribuição por symlink ignora o mecanismo nativo.** Symlinks em
   `~/.claude/skills` não fixam versão por projeto, não chegam a colegas nem a
   outra máquina, e não carregam policy. O Claude Code tem plugin + marketplace
   declarável no `.claude/settings.json` do projeto.
   *Correção:* o repositório do harness é marketplace e plugin (`source: "./"`).
   Symlink fica como estratégia para agentes sem sistema de plugin.

2. **Policies sem mecanismo de carga.** Nada no v1 garante que o agente leia
   `policies/`. Uma skill não pode depender de `../../policies` (o Claude rejeita
   caminho fora do plugin; outros agentes não definem o comportamento), e
   `@import` de fora do repositório pede aprovação e depende do caminho de cada
   máquina.
   *Correção:* um *context loader* agnóstico (`bin/eng-context`) imprime a policy
   central, os overrides do projeto e o índice de memória. No Claude Code ele roda
   no `SessionStart`. Outros adapters podem rodá-lo para gerar um arquivo.

3. **`workflows/release.md` duplica a skill `release`.** E `feature`, `bugfix`,
   `refactor` e `migration` são 80% o mesmo ciclo com deltas pequenos. Cinco
   arquivos para dizer "o mesmo ciclo, com estas diferenças" convidam divergência.
   *Correção:* um único `core/lifecycle.md` com o ciclo e uma tabela de deltas por
   tipo de mudança. A policy central traz o resumo.

4. **`policies/testing.md` duplica a skill `test`.** Princípio de teste é curto e
   vive na policy; procedimento vive na skill. Um terceiro lugar é duplicação.
   *Correção:* sem `testing.md`. Os princípios estão em `core/policy.md`.

5. **O YAML de configuração é prosa fingindo ser config.**
   `testing: required` e `architecture: existing` são sempre verdade no harness;
   nenhum programa lê `deployment.provider`. Campo que nenhuma máquina consome dá
   falsa sensação de enforcement e envelhece em silêncio.
   *Correção:* `.engineering/harness.yaml` só com o que um programa consome
   (versão, profiles, diretório de ADR). O resto é contexto de projeto em prosa,
   no `AGENTS.md`. Ver [Modelo de configuração](#modelo-de-configuração).

6. **`memory/decisions/` compete com ADR.** Duas casas para decisão viram duas
   verdades.
   *Correção:* decisão significativa é ADR (`docs/adr/`). A memória fica com
   `gotchas/` e `discoveries/`. O critério de ADR está na policy e no template.

7. **Profiles combinatórios.** `dotnet-angular`, `dotnet-backend` e `angular`
   repetiriam o mesmo conteúdo de .NET e de Angular.
   *Correção:* `harness.yaml` aceita **lista** de profiles, que se somam:
   `dotnet-backend` (stack), `angular` (stack) e `dotnet-angular` (só a
   integração entre os dois). A v0.1 começou com um `dotnet-angular` único; a
   separação veio quando os projetos reais mostraram repositórios só Angular e
   só .NET. `library` e `infrastructure` são outro eixo (tipo de projeto, não
   stack) e compõem com os de stack.

8. **Placeholders vazios de profile.** Diretórios vazios parecem suporte e não são.
   *Correção:* os profiles futuros estão documentados em `profiles/README.md`, sem
   diretório.

9. **Faltava o procedimento de adoção.** O critério de sucesso é "pegar um projeto
   novo e adotar". Sem procedimento, cada adoção é improviso.
   *Correção:* skill `adopt` (só invocação manual). Ela também faz o upgrade de
   versão, o que cobre o `eng update` sem CLI.

10. **Faltava uma variável que regula a régua.** Regras fixas ("sempre ADR",
    "sempre e2e") viram dogma. Os artigos apontam a variável certa: o custo de
    reverter.
    *Correção:* classificação de reversibilidade (R0, R1, R2) na policy, usada por
    `plan`, `review` e `release` para escalar a cerimônia.

11. **`telemetry.intent` colide com semconv.** O namespace `telemetry.*` é usado
    pelas convenções semânticas do OpenTelemetry (`telemetry.sdk.*`).
    *Correção:* atributos próprios usam namespace da aplicação (`app.intent`).
    Explicado em `core/observability.md`.

12. **`dotnet-modernize` como skill.** Seria o mesmo procedimento de
    `dependency-update` (plataforma e pacotes) e de `architecture-audit` (padrões
    antigos convivendo com novos), mudando só o conhecimento de stack.
    *Correção:* sem skill. Ver [Decisão: dotnet-modernize](#decisão-dotnet-modernize).

---

## Design v2 (o que foi implementado)

### Camadas

```text
GLOBAL ENGINEERING KNOWLEDGE   core/        policy, lifecycle, security, observability, git
                               profiles/    conhecimento de stack (dotnet-backend, angular,
                                            dotnet-angular)
REUSABLE PROCEDURES            skills/      11 skills no formato Agent Skills
PROJECT-SPECIFIC CONTEXT       <projeto>/AGENTS.md, .engineering/harness.yaml,
                               .engineering/overrides/
PROJECT MEMORY                 <projeto>/.engineering/memory/, docs/adr/
AGENT ADAPTERS                 bin/eng-context (agnóstico), adapters/claude-code/,
                               .claude-plugin/
```

Regra de dependência: `core` não depende de nada. `profiles` e `skills` dependem
de `core`. Adapters dependem de tudo e nada depende deles. Nenhum arquivo de
`core/`, `skills/`, `profiles/` e `templates/` menciona um agente específico,
exceto os dois templates do adapter do Claude Code (`templates/CLAUDE.md` e
`templates/claude-settings.json`). Um teste verifica.

### Estrutura de diretórios

```text
engineering-harness/
├── README.md               o que é, adoção em 3 passos
├── VERSION                 fonte da verdade da versão
├── CHANGELOG.md            mudanças + notas de migração por versão
├── CONTRIBUTING.md         critério de admissão de skill, regras de mudança
├── RESEARCH.md / ARCHITECTURE.md / IMPLEMENTATION.md
│
├── core/
│   ├── policy.md           policy central. Sempre carregada. Curta.
│   ├── lifecycle.md        ciclo de uma tarefa + deltas por tipo de mudança
│   ├── security.md         policy de segurança detalhada
│   ├── observability.md    convenções de telemetria
│   └── git.md              commits, branches, versionamento
│
├── skills/                 um diretório por skill, SKILL.md + references/
│   ├── investigate/  plan/  implement/  test/  review/
│   ├── security-audit/  architecture-audit/  dependency-update/
│   ├── observability/  release/  adopt/
│
├── profiles/
│   ├── README.md           contrato de profile + profiles planejados
│   ├── dotnet-backend/     PROFILE.md + references/ (csharp, efcore, platform,
│   │                       currency, modernization, observability)
│   ├── angular/            PROFILE.md + references/ (components, modern-angular,
│   │                       currency, modernization, observability)
│   └── dotnet-angular/     PROFILE.md: só a integração entre os dois
│
├── templates/              arquivos que `adopt` instala no projeto
│   ├── AGENTS.md  CLAUDE.md  harness.yaml  claude-settings.json
│   ├── adr.md  memory-entry.md  memory-index.md  override.md
│
├── bin/eng-context         context loader agnóstico (POSIX sh)
├── bin/stack-report        inventário determinístico de .NET, npm, Docker e CI
├── adapters/
│   ├── README.md           contrato de adapter
│   ├── claude-code/        hooks.json + README
│   ├── codex/README.md     design, não implementado
│   └── copilot/README.md   design, não implementado
├── .claude-plugin/         plugin.json + marketplace.json (entrada do Claude Code)
│
├── examples/dotnet-angular-app/   projeto adotado mínimo; também é fixture
└── tests/                  node --test, sem dependências
```

Por que `core/` e não `policies/`: o diretório contém policy **e** o ciclo de
vida, que não é policy. O nome diz "conhecimento global que tudo usa".

Por que `.claude-plugin/` na raiz: é exigência do Claude Code para que o
repositório seja marketplace e plugin ao mesmo tempo. É o único arquivo do adapter
fora de `adapters/`.

### Responsabilidades

| Diretório | Responsável por | Não é responsável por |
|---|---|---|
| `core/policy.md` | Princípios que valem em toda tarefa: evidência, escopo, reversibilidade, segurança mínima, memória, resumo do ciclo | Procedimentos, detalhes de stack |
| `core/lifecycle.md` | Sequência de fases e deltas por tipo de mudança | Como executar cada fase (isso é skill) |
| `core/security.md`, `observability.md`, `git.md` | Regras detalhadas de um domínio, consultadas sob demanda | Checklists de auditoria (ficam na skill) |
| `skills/*` | Procedimento, gates e artefato de saída | Regras transversais (referenciam a policy) |
| `profiles/*` | Comandos, convenções e armadilhas de uma stack | Fatos de um projeto |
| `templates/*` | Formato dos arquivos de projeto | Conteúdo do projeto |
| `bin/eng-context` | Montar o contexto de sessão a partir do harness e do projeto | Decidir o que fazer |
| `adapters/*` | Entregar skills e contexto a um agente | Conteúdo de engenharia |
| projeto `AGENTS.md` | Fatos do repositório: comandos, arquitetura, entrega, exemplos vivos | Regras gerais de engenharia |
| projeto `.engineering/` | Configuração do harness, overrides, memória | Documentação para humanos |

### Lifecycle de uma tarefa

```text
 Understand ──► Plan ──► Implement ──► Verify ──► Review ──► Ship ──► Observe ──► Learn
 investigate    plan     implement     test       review     release  observability  memory/ADR
      ▲                                  │           │                     │
      └───────────── evidência contradiz a hipótese ─┴─────────────────────┘
```

- **A cerimônia escala com o risco.** Uma mudança R0 pequena segue o *fast path*
  de `core/lifecycle.md`: uma passada, um relatório. Uma mudança R2 passa por
  todas as fases, com rollback escrito e aprovação humana.
- **Cada fase termina em artefato verificável:** relatório de investigação, plano
  com Definition of Done, diff, evidência de teste (comando + resultado), ledger de
  review, tag com CI verde, sinal de telemetria, entrada de memória.
- **Fluxo de volta é normal.** Se a evidência contradiz a hipótese, volta para
  `investigate`. Insistir no plano original é o erro.
- **Deltas por tipo** (em `core/lifecycle.md`): *bugfix* exige teste que falha
  antes da correção; *refactor* exige prova de comportamento inalterado e proíbe
  mudança de comportamento no mesmo diff; *migration* exige expand-contract e
  rollback por fase; *dependency* usa `dependency-update`; *feature* exige
  telemetria para o comportamento novo quando o projeto tem observabilidade.
- **Deploy é decisão humana.** O harness prepara e verifica; não dispara deploy
  de produção sozinho.

### Classificação de reversibilidade

**[Proposta]** A variável que regula a régua, derivada de A1. A definição
normativa está em `core/policy.md` (*Reversibility sets the bar*); aqui fica só o
resumo:

- **R0**: revertido com `git revert` + redeploy, sem efeito residual.
- **R1**: reversível com esforço (config, flag, migration aditiva, dependência
  nova). Exige plano de rollback escrito.
- **R2**: irreversível ou visível fora do sistema (migration destrutiva, dinheiro,
  e-mail, API ou pacote público, auth). Exige rollout em fases ou
  expand-contract, teste de cenário, aprovação humana e ADR quando for decisão.

### Modelo de configuração

Alternativas avaliadas:

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| YAML rico (proposta do pedido) | Familiar | Campos sem consumidor; exige parser | Rejeitado |
| JSON | Parse nativo em Node/jq | Sem comentários; ruim para humanos | Rejeitado |
| TOML | Legível, tipado | Exige parser; pouco usual nesta stack | Rejeitado |
| Só Markdown (`AGENTS.md`) | Um arquivo | Nenhum programa consegue ler versão e profile com segurança | Rejeitado |
| **YAML mínimo e plano + Markdown** | Máquina lê só o que precisa; humano e agente leem prosa | Dois arquivos | **Escolhido** |

```yaml
# .engineering/harness.yaml
harness: "0.1"             # linha do harness contra a qual o projeto foi validado
profiles: [dotnet-backend, angular, dotnet-angular] # somam-se na ordem
adr_dir: docs/adr          # onde ficam os ADRs deste projeto
```

Regras: chaves planas, lista inline, sem aninhamento. Essa restrição é
deliberada: o loader lê o arquivo com `awk`, sem dependência, e um teste valida o
formato. Se um dia for preciso aninhar, é sinal de que o campo é prosa e deveria
estar no `AGENTS.md`.

Onde foram parar os outros campos do pedido:

| Campo do pedido | Destino |
|---|---|
| `harness.version` | `harness:` |
| `project.profile` | `profiles:` (lista) |
| `engineering.architecture: existing` | Sempre verdade: policy "siga a arquitetura existente" |
| `engineering.testing: required` | Sempre verdade: policy de evidência |
| `engineering.observability: opentelemetry` | `AGENTS.md`, seção *Observability* (o que existe de fato) |
| `deployment.provider: azure` | `AGENTS.md`, seção *Delivery* (provedor, staging, rollback, flags) |

### Mecanismo de profiles

- Um profile é um diretório `profiles/<nome>/` com `PROFILE.md` (curto, lido
  inteiro) e `references/` (lido sob demanda por skills específicas).
- `PROFILE.md` tem seções fixas: *Detection*, *Verification ladder* (comandos do
  mais rápido ao mais lento), *Conventions to discover*, *Pitfalls*,
  *References*. As seções fixas deixam o profile verificável por teste.
- O loader não injeta o profile, só aponta para ele. Quem lê é a skill que
  precisa (`plan`, `test`, `dependency-update`, `observability`,
  `architecture-audit`). Isso mantém o contexto fixo pequeno.
- Profiles se somam na ordem declarada. Conflito entre profiles é bug do harness,
  não algo a resolver em tempo de execução.
- Scripts determinísticos moram no profile (`scripts/`). O script mede, a skill
  interpreta.

### Mecanismo de project overrides

```text
<projeto>/.engineering/overrides/
├── policy.md        somado à policy central; carregado em toda sessão
└── <skill>.md       lido pela skill <skill> no primeiro passo
```

Semântica:

1. **Complementa por padrão.** O override acrescenta regras.
2. **Substitui quando conflita.** Regra do projeto vence regra do harness no mesmo
   assunto. O agente declara qual override aplicou.
3. **Piso de segurança não é sobrescrevível.** A lista está em `core/policy.md`
   (conteúdo externo é dado, secrets, ações destrutivas com confirmação,
   não enfraquecer teste). Override que tente relaxar esses itens é ignorado e
   reportado.
4. **Sem fork.** Se um override se repete em três projetos, ele sobe para o harness
   (ou para um profile) numa versão nova.

Por que arquivo por skill e não um arquivo único: a skill só lê o que é dela, e o
diff de um override fica legível no PR.

### Mecanismo de project memory

```text
<projeto>/.engineering/memory/
├── INDEX.md               uma linha por entrada; carregado em toda sessão
├── gotchas/<slug>.md      comportamento inesperado que já custou tempo
└── discoveries/<slug>.md  conhecimento investigado (limites de API, infra, banco)
<projeto>/docs/adr/NNNN-<slug>.md   decisões arquiteturais
```

- **Critério de entrada** (os três): custou tempo descobrir; não é derivável do
  código nem do histórico do git; tende a importar de novo.
- **Formato** (`templates/memory-entry.md`): contexto, fato, evidência (arquivo,
  commit, comando), como aplicar, data da última verificação.
- **Não entra:** resumo de conversa, log de tarefa, o que já está em comentário de
  código, ADR ou `AGENTS.md`.
- **Atualizar em vez de duplicar.** Entrada contradita pela evidência é corrigida
  ou apagada.
- **Revisão como código.** A memória está no repositório; entra por PR e é
  revisada. É isso que a diferencia da auto memory do Claude Code, que é local,
  por usuário e não versionada. As duas convivem.
- **Envelhecimento.** `architecture-audit` verifica entradas com verificação antiga
  ou evidência que não existe mais.
- **Carga.** O loader imprime o `INDEX.md` (limitado a 60 linhas). As entradas são
  lidas sob demanda.

### Estratégia de versionamento

- **SemVer no harness.** `VERSION` é a fonte da verdade. `plugin.json` repete o
  número (o Claude Code usa esse campo para decidir atualizações);
  `marketplace.json` não repete. Um teste impede divergência.
- **Em 0.x, minor é breaking.** O projeto declara a linha (`harness: "0.1"`). A
  partir de 1.0, declara só o major (`harness: "1"`).
- **O que é breaking:** renomear ou remover skill, mudar o formato de
  `harness.yaml`, overrides ou memória, mudar semântica de override. Adicionar
  skill ou regra compatível é minor (a partir de 1.0) ou patch.
- **CHANGELOG com seção "Migration"** em toda versão breaking. É a entrada do
  `adopt` no modo upgrade.
- **Tags anotadas** `vX.Y.Z` com testes verdes no SHA da tag (a mesma regra que a
  skill `release` aplica aos projetos).
- **Compatibilidade verificada em tempo de sessão.** O loader compara a linha do
  projeto com a versão instalada e avisa se divergem. O plugin é instalado por
  usuário, não por projeto, então um projeto não consegue fixar a versão do plugin
  sozinho. O aviso é o mecanismo honesto.

### Estratégia de adapters

Contrato que todo adapter cumpre (`adapters/README.md`):

1. **Expor `skills/`** ao mecanismo de descoberta de skills do agente.
2. **Entregar o contexto de sessão**: a saída de `bin/eng-context` (policy
   central, overrides, versão, profiles, índice de memória).
3. **Definir `$HARNESS`**: o caminho absoluto do harness, usado pelas skills para
   citar `core/`, `profiles/` e `templates/`. O loader imprime essa linha.
4. **Mapear frontmatter opcional.** Campos que o agente não conhece são ignorados
   (o padrão Agent Skills permite).

| Adapter | Skills | Contexto | Status |
|---|---|---|---|
| Claude Code | Plugin (`source: "./"`), namespace `eng:` | `SessionStart` → `bin/eng-context` | **Implementado** |
| Codex | Symlink de `skills/*` em `~/.codex/skills/eng-*` | `eng-context` gera `.engineering/.context.md` (gitignored), citado no `AGENTS.md` | Design |
| Copilot | `.github/skills/` ou `.claude/skills/` no projeto | `.github/copilot-instructions.md` cita o contexto gerado | Design |

Por que `$HARNESS` em vez de caminhos relativos: o padrão Agent Skills só define
referências dentro do diretório da skill, e o Claude Code rejeita caminhos que
saem do plugin. Uma variável definida pelo adapter é portável. Um teste garante
que todo `$HARNESS/...` citado existe.

### Estratégia de atualização do harness

v0 (sem CLI):

1. Harness: mudança → testes → `VERSION` + `CHANGELOG` → tag.
2. Máquina: o Claude Code atualiza o marketplace
   (`claude plugin marketplace update engineering-harness` ou auto-update, se
   ligado). Como `version` está no `plugin.json`, só versões
   publicadas chegam.
3. Projeto: na sessão seguinte o loader avisa da divergência. `/eng:adopt` em modo
   upgrade lê as seções *Migration* do CHANGELOG entre as duas versões, aplica o que
   é mecânico, mostra o que exige decisão e atualiza `harness.yaml`. Isso vai num
   PR do projeto.

Futuro `eng update` (não implementado): só vale a pena quando houver pelo menos
dois adapters em uso ou migrações mecânicas frequentes. Seria um script que (1)
atualiza a instalação de cada adapter, (2) roda as migrações declaradas em
formato de máquina no CHANGELOG, (3) roda `eng-context --check` em cada projeto
listado. Até lá a skill `adopt` cobre o caso.

### Decisão: dotnet-modernize

**Não é skill.** Modernizar uma aplicação .NET/Angular decompõe em:

- plataforma e pacotes (SDK, TFM, NuGet, npm, Angular major, imagens Docker,
  actions de CI) → `dependency-update`, modo *platform*;
- padrões antigos convivendo com novos (Startup vs minimal hosting, NgModule vs
  standalone, Newtonsoft vs System.Text.Json) → `architecture-audit`, foco
  *modernization*, que produz um backlog priorizado;
- execução de cada item → ciclo normal, tipo *refactor* ou *migration*.

O conhecimento específico mora em `references/modernization.md` e
`currency.md` dos profiles `dotnet-backend` e `angular`. Se, com uso real, a modernização virar um procedimento repetido
com gates próprios que não cabem nessas skills, ela vira skill. O critério está
em `CONTRIBUTING.md`.

### Skills: inventário e justificativa

| Skill | Invocação | Artefato | Por que é skill |
|---|---|---|---|
| `investigate` | auto + manual | Relatório de investigação | Procedimento repetido antes de toda mudança não trivial |
| `plan` | auto + manual | Plano com Definition of Done | Formato verificável; conecta evidência a passos |
| `implement` | auto + manual | Diff + checagem contra o plano | Gate "diff vs plano" e disciplina de escopo |
| `test` | auto + manual | Evidência: comportamento → teste → resultado | Teste como prova, não como formalidade |
| `review` | auto + manual | Ledger de alegações + achados | Revisão do diff real, independente da narrativa |
| `security-audit` | auto + manual | Achados com severidade e evidência | Escopo de repositório, não de diff |
| `architecture-audit` | auto + manual | Backlog priorizado | Ponto cego do review por diff (A1) |
| `dependency-update` | auto + manual | Mudança em lote + relatório | Procedimento repetido com piso de supply chain |
| `observability` | auto + manual | Plano/diff de telemetria | Procedimento para instrumentar e auditar |
| `release` | **só manual** | Tag + notas + checklist de deploy | Irreversível; "nunca cortar release que ninguém pediu" (A2) |
| `adopt` | **só manual** | Arquivos de projeto + PR | Adoção e upgrade do harness num projeto |

Onze skills, nove competindo por roteamento. O teto (12 no total, 10 invocáveis
pelo modelo) está em `CONTRIBUTING.md` e é verificado por teste.

---

## Autocrítica do design v2

Riscos que permanecem e como estão tratados:

| Risco | Tratamento |
|---|---|
| O contexto fixo (policy + overrides + índice) cresce e dilui atenção | Teste limita `core/policy.md` a 150 linhas; loader corta overrides e índice em 60 linhas cada |
| `$HARNESS` depende do adapter; um agente sem adapter não resolve o caminho | As skills funcionam sem os arquivos de `$HARNESS` (degradam para o conhecimento do modelo) e dizem isso |
| Plugin instalado por usuário: dois projetos em linhas diferentes numa mesma máquina | O loader avisa; em 0.x o custo é aceitável. Se virar problema, dois marketplaces com nomes diferentes resolvem |
| Skills do harness competem com outras skills instaladas (pstack, ripwire, `code-review`) | Namespace `eng:`, descrições com "quando não usar", skills raras só manuais. Recomendação de desligar sobreposições nos projetos adotados |
| Loader em POSIX sh não roda em Windows puro | Documentado. Git Bash e WSL funcionam. Reescrever quando houver necessidade real |
| Nenhuma medição de que as skills melhoram o resultado | Testes cobrem estrutura, não comportamento. Evals estão nos próximos passos (`claude plugin eval` existe) |
