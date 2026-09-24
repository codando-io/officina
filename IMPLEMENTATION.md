# Implementation

Fase 5 do `engineering-harness`: o que foi criado, como funciona, como usar e o
que vem depois. O porquê de cada decisão está em [ARCHITECTURE.md](ARCHITECTURE.md).

## O que foi criado

| Parte | Conteúdo | Tamanho |
|---|---|---|
| `core/` | `policy.md` (carregada em toda sessão), `lifecycle.md`, `security.md`, `observability.md`, `git.md` | 5 arquivos |
| `skills/` | `investigate`, `plan`, `implement`, `test`, `review`, `security-audit`, `architecture-audit`, `dependency-update`, `observability`, `release`, `adopt` | 11 skills, 9 invocáveis pelo modelo |
| `profiles/` | `dotnet-backend` (C# 14/15, EF Core 10, plataforma .NET 10), `angular` (APIs por versão, componentes e design system), `dotnet-angular` (só a integração) | 3 profiles |
| `bin/stack-report` | Inventário de .NET, npm/Angular, Docker e CI, online ou `--offline` | |
| `templates/` | `AGENTS.md`, `CLAUDE.md`, `harness.yaml`, `claude-settings.json`, `adr.md`, `memory-entry.md`, `memory-index.md`, `override.md` | 8 arquivos |
| `bin/eng-context` | Context loader agnóstico, POSIX sh | ~150 linhas |
| Adapter Claude Code | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `adapters/claude-code/hooks.json` | Implementado |
| Adapters Codex e Copilot | README com o design | Não implementados |
| `examples/dotnet-angular-app/` | Projeto adotado mínimo, com overrides, memória e ADR; também é fixture dos testes | |
| `tests/` | 32 testes `node --test`, sem dependências | |
| `.github/` | CI com actions fixadas por SHA; Dependabot para actions | |

Verificação feita durante a construção:

- `node --test tests/*.test.mjs`: 32 de 32 passam. Mutações propositais (nome de
  agente e `.claude/` numa skill, versão divergente no `plugin.json`, uma frase da
  policy copiada numa skill) fizeram os testes correspondentes falharem, e eles
  voltaram a passar ao restaurar.
- `claude plugin validate . --strict`: passa.
- `claude --plugin-dir . plugin details eng`: o Claude Code 2.1.231 reconhece o
  plugin `eng` 0.1.0 com 11 skills e o hook `SessionStart`.
- O hook foi executado exatamente como o Claude Code o executa
  (`CLAUDE_PLUGIN_ROOT` e `CLAUDE_PROJECT_DIR` definidos, JSON no stdin) contra o
  exemplo. Saída de 146 linhas, cerca de 1,8k tokens.
- `stack-report.sh` rodou online e offline contra o exemplo.
- **Não verificado:** uma sessão interativa real com o plugin, porque o CLI
  headless desta máquina está sem autenticação. Ver *Próximos passos*.

## Como funciona

### Numa sessão do Claude Code

1. O Claude Code carrega o plugin `eng` do marketplace `engineering-harness`.
   As descrições das 11 skills entram no contexto (cerca de 1,2k tokens,
   estimativa do próprio `claude plugin details`).
2. O hook `SessionStart` roda `bin/eng-context` no início, no `resume`, no
   `/clear` e depois de compactação. O script:
   - imprime a versão do harness e `HARNESS=<caminho>`;
   - procura `.engineering/harness.yaml` subindo a partir do diretório do projeto;
   - se não achar, para aí (cerca de 90 tokens). O harness não se impõe a
     repositórios que não o adotaram;
   - se achar, imprime `core/policy.md`, os overrides de policy do projeto, a
     lista de overrides por skill, os profiles ativos (só o caminho), o índice de
     memória e avisos (versão divergente, profile inexistente, chave desconhecida,
     override de skill inexistente).
3. Durante o trabalho, o agente usa as skills por conta própria ou quando você
   chama `/eng:<skill>`. Cada skill começa lendo o override do projeto, lê os
   arquivos de `$HARNESS/...` de que precisa (profile, `core/lifecycle.md`,
   templates) e termina num artefato definido na seção *Output*.
4. `CLAUDE.md` com `@AGENTS.md` coloca o contexto do projeto na sessão.

### O ciclo de uma tarefa

```text
investigate → plan → implement → test → review → release → observability → memória/ADR
```

A cerimônia escala com a reversibilidade (R0, R1, R2, definida na policy). Uma
mudança R0 pequena segue o *R0 fast path* de `core/lifecycle.md`: localizar,
escrever o teste que falha (se for bug), mudar, rodar os testes, ler o próprio
diff e entregar um relatório só. Uma migration R2 passa por tudo, com rollback por
fase e aprovação. Depois do deploy, `observability` em modo post-deploy confere
o sinal de saúde que o plano ou a release nomeou; é aí que o ciclo fecha.

## Adotar num projeto

### Pré-requisitos

- Claude Code com suporte a plugins (testado com 2.1.231).
- `sh` e ferramentas POSIX para o loader (macOS, Linux, WSL ou Git Bash).

### Passo a passo

1. **Instalar na máquina** (uma vez):

   ```bash
   claude plugin marketplace add ~/projects/personal/engineering-harness
   ```

   ```bash
   claude plugin install eng@engineering-harness
   ```

   Quando o repositório estiver publicado, troque o caminho local por
   `<owner>/engineering-harness`.

2. **Adotar**: abra o Claude Code na raiz do projeto e rode `/eng:adopt`. A skill:
   - detecta a stack e escolhe os profiles (`dotnet-backend`, `angular` e,
     quando os dois convivem, `dotnet-angular`), ou nenhum;
   - cria `.engineering/harness.yaml`, `.engineering/memory/INDEX.md` e as pastas
     de memória;
   - cria ou completa o `AGENTS.md` rodando os comandos de build e teste e
     anotando só o que funcionou;
   - cria `CLAUDE.md` com `@AGENTS.md` e mescla `.claude/settings.json`
     (marketplace, plugin habilitado, regras `deny` para arquivos de segredo);
   - roda `eng-context` e mostra a saída;
   - faz um commit numa branch nova e pergunta antes de dar push.

3. **Revisar o PR** como qualquer outro. Os campos marcados `(unknown - ask the
   team)` no `AGENTS.md` são o que a skill não conseguiu verificar.

4. **Usar.** Na sessão seguinte o contexto chega sozinho. Comece por
   `/eng:investigate <problema>`.

Adotar à mão é possível: copie os arquivos de `templates/` seguindo
`adapters/claude-code/README.md`, seção *Project setup*, e rode
`<harness>/bin/eng-context --check` na raiz do projeto até não haver avisos.

### Overrides e memória no dia a dia

- Regra que vale para o projeto todo: `.engineering/overrides/policy.md`.
- Regra de uma skill: `.engineering/overrides/<skill>.md`.
- O piso de segurança da policy não pode ser relaxado por override.
- Memória: o agente propõe entradas no fim da tarefa quando os três critérios da
  policy se cumprem. Elas entram por PR, junto com o código.
- Decisões significativas viram ADR em `docs/adr/` (template em
  `templates/adr.md`).

## Criar um profile

1. Confirme que é conhecimento de stack, não de projeto (ver
   [CONTRIBUTING.md](CONTRIBUTING.md#where-a-change-belongs)).
2. Crie `profiles/<nome>/PROFILE.md` com as seções, nesta ordem: `## Detection`,
   `## Verification ladder`, `## Conventions to discover`, `## Pitfalls`,
   `## References`. Os testes verificam.
3. Detalhe que só algumas skills usam vai em `references/`. Checagens
   determinísticas vão em `scripts/`, executáveis, read-only, com `--offline`
   quando usam rede.
4. Registre o profile na tabela *Available* de `profiles/README.md`.
5. Se o novo profile repete conteúdo de outro, extraia a parte comum para um
   profile composável (por exemplo `dotnet-backend` + `angular`) em vez de copiar.
6. Rode os testes, atualize o `CHANGELOG.md`.

## Criar uma skill

1. Passe pelo critério de admissão de [CONTRIBUTING.md](CONTRIBUTING.md#admission-rule-for-a-new-skill).
   A pergunta é "qual procedimento repetido falhou sem ela?". Se a resposta for
   um template de código ou uma regra, não é skill.
2. Crie `skills/<nome>/SKILL.md`:
   - frontmatter `name` igual ao diretório e `description` que diz o que faz,
     quando usar e quando não usar (é o contrato de roteamento);
   - `disable-model-invocation: true` se for rara, perigosa ou externa;
   - primeiro passo: ler `.engineering/overrides/<nome>.md`;
   - referências ao harness como `$HARNESS/...`, nunca caminhos relativos para
     fora da skill nem variáveis de um agente;
   - seção `## Output` com o formato do artefato;
   - menos de 200 linhas.
3. Rode os testes (contagem, frontmatter, links, neutralidade de agente).
4. Registre no `CHANGELOG.md`. Nova skill é adição; renomear ou remover é breaking.

## Atualizar o harness

No harness (quem mantém):

1. Mudança, testes, `claude plugin validate . --strict`.
2. `VERSION` e `.claude-plugin/plugin.json` com o mesmo número (teste garante).
3. `CHANGELOG.md` com a versão e, se quebrar projetos, a seção **Migration** em
   forma de passos.
4. Commit, CI verde, `git tag -a vX.Y.Z`.

Na máquina:

```bash
claude plugin marketplace update engineering-harness
```

Com o marketplace local no Claude Code 2.1.231, a instalação **copia** o plugin
para o cache e as sessões usam a cópia, verificado pelo `HARNESS=` do contexto.
Como o `plugin.json` tem `version`, nem `claude plugin update` leva edições
adiante sem subir a versão. Para desenvolver o harness e ver as edições na
sessão seguinte, troque a pasta da versão no cache por um symlink para o
checkout (passo a passo em `adapters/claude-code/README.md`). Para os outros
usuários, o caminho é publicar uma versão nova.

No projeto: se a linha declarada em `harness.yaml` for diferente da instalada,
`eng-context` avisa no início da sessão. Rode `/eng:adopt` (modo upgrade): ele lê
as seções *Migration* do CHANGELOG entre as duas versões, aplica o que é mecânico,
pergunta o que exige decisão e atualiza `harness.yaml` num commit.

## Como o Claude Code usa o harness

| Mecanismo do Claude Code | O que o harness coloca nele |
|---|---|
| Marketplace (`.claude-plugin/marketplace.json`) | O próprio repositório, com um plugin `eng` de `source: "./"` |
| Plugin (`.claude-plugin/plugin.json`) | Skills de `skills/`, hook de `adapters/claude-code/hooks.json`, `bin/` no PATH |
| Skills | 11 skills no formato Agent Skills, namespace `eng:` |
| Hook `SessionStart` | `bin/eng-context`: policy, overrides, profiles, memória, avisos |
| `CLAUDE.md` do projeto | `@AGENTS.md` |
| `.claude/settings.json` do projeto | `extraKnownMarketplaces`, `enabledPlugins`, `permissions.deny` para segredos |
| Auto memory do Claude | Não é usada pelo harness; convive com a memória versionada do projeto |

Nada disso exige que o conteúdo conheça o Claude Code: se o adapter for trocado,
`core/`, `skills/` e `profiles/` continuam iguais.

## Autocrítica (Fase 4)

Fiz duas revisões. A primeira foi minha, no próprio design (a crítica do v1 em
[ARCHITECTURE.md](ARCHITECTURE.md#crítica-do-design-v1)). A segunda foi de um
revisor independente, um subagente que não viu esta conversa e leu só o
repositório. Ele reproduziu cada bug de script em diretórios temporários antes de
reportar. O resultado abaixo responde às perguntas da Fase 4 com o que foi
encontrado e o que mudou.

**Estou criando skills demais?** São 11, das quais 9 disputam roteamento. O
revisor sugeriu fundir `implement` com `test` e dissolver `observability`, ficando
com 8. Não aceitei. `test` também atende pedidos sem implementação ("isso está
testado?", "escreva testes para este código"), e `observability` ganhou o modo
post-deploy, que é o único procedimento do ciclo de feedback. O que era real na
crítica eu corrigi: `implement` repetia a policy e agora só acrescenta
procedimento. O teto (12 no total, 10 invocáveis) é verificado por teste, e a
contradição com o "dez skills" do RESEARCH.md foi corrigida.

**Há regras duplicadas?** Havia, e três já tinham divergido: o piso de supply
chain aparecia em três lugares com listas diferentes, a tabela de
reversibilidade divergia entre a policy e o ARCHITECTURE.md, e o limite para
pular o plano tinha três valores (uma linha, dez linhas, 30 linhas). Agora cada
regra tem uma casa (`core/security.md` §4, `core/policy.md`, `core/lifecycle.md`)
e os outros lugares apontam para ela. RESEARCH.md prometia um teste de
duplicação que não existia. Agora existe, e uma mutação provou que ele falha
quando uma frase da policy é copiada numa skill.

**O harness está acoplado ao Claude Code?** Não no conteúdo. O teste de
neutralidade cobria só `core/`, `skills/` e `profiles/` e deixava passar
`.claude/`. `security-audit` citava `.claude/settings.json`. O teste agora cobre
também `templates/` (exceto os dois templates do adapter) e pega `.claude/`, e a
skill foi corrigida. O campo `disable-model-invocation` só existe no Claude, então
`release` e `adopt` agora dizem no corpo que rodam só a pedido.

**Existe conhecimento que deveria estar no projeto e não no harness, ou o
contrário?** Dois casos. `core/security.md` tinha APIs de .NET e Angular
(`FromSqlRaw`, `TypeNameHandling`, `bypassSecurityTrust*`), que foram para a
seção *Pitfalls* do profile; o core ficou genérico. No exemplo, uma regra de
autorização ("todo endpoint dentro do grupo protegido") estava num override de
`review`, então `implement` nunca a veria. Ela era um fato do projeto e foi para o
`AGENTS.md`.

**Existe conhecimento que deveria ser uma skill?** Não encontrei. O candidato
era `dotnet-modernize`, e a decisão de não criá-la está justificada no
ARCHITECTURE.md.

**Estou adicionando complexidade sem necessidade?** O revisor apontou os READMEs
de Codex e Copilot, a checagem de versão e os overrides por skill. Mantive os
três: os READMEs são design sem código, a checagem de versão é curta e tem
testes, e override por skill foi pedido explicitamente (regras globais de review
mais overrides do projeto). Os dois scripts, por outro lado, eram frágeis de um
jeito que importa. O loader dava falso alarme de versão em arquivos CRLF (o
padrão de times .NET no Windows), com BOM, com comentário após o valor ou com a
versão completa. O `stack-report` dizia "todas as actions fixadas" quando um
workflow tinha espaço no nome, que é um falso negativo numa checagem de
segurança. Todos esses casos foram corrigidos e têm teste de regressão.

**O workflow reduz o ciclo de feedback?** Na primeira versão, não para mudanças
pequenas. Uma correção de uma linha exigia cerca de cinco artefatos, e a perna
deploy → feedback não tinha procedimento. Também havia uma contradição: o bugfix
pedia teste antes da correção, mas a ordem das fases punha `test` depois de
`implement`. Agora existe o *R0 fast path* (uma passada, um relatório), o teste
vem antes do código no bugfix (dentro de `implement`), e o modo post-deploy de
`observability` fecha o ciclo com o sinal de saúde que o plano nomeia.

**Um novo projeto conseguiria adotá-lo facilmente?** O revisor percorreu a
skill `adopt` contra um repositório hipotético e achou oito pontos em que o
agente travaria ou adivinharia. Todos foram tratados. O cabeçalho do índice de
memória virou template próprio. O diretório de ADR só nasce com o primeiro ADR.
Instalar dependências de um repositório desconhecido agora passa pela
checagem de supply chain. Comandos que precisam de Docker ou banco ficam
marcados `(unverified)`. Há regra para um `CLAUDE.md` que já tem conteúdo e para
árvore de trabalho suja. A verificação usa `--check`. O `OWNER` do marketplace
sai da fonte registrada na máquina, com o aviso de que caminho local não serve
para colegas. Um bloqueio continua: enquanto o harness não estiver num git
remoto, só esta máquina consegue usá-lo.

**O harness consegue evoluir sem quebrar projetos?** Em parte. SemVer, a seção
*Migration* obrigatória no CHANGELOG, o aviso de versão no loader e o modo
upgrade de `adopt` dão o caminho. O limite é que o plugin do Claude Code é
instalado por usuário, então um projeto não fixa a versão sozinho, só é avisado.
As migrações são texto aplicado pelo agente, não scripts. Isso basta enquanto
forem raras.

**Achados do revisor que eu rejeitei, com evidência:**
- "`Read(.env)` só bloqueia na raiz." A documentação de permissões diz que um
  nome de arquivo sem barra segue a semântica do gitignore e casa em qualquer
  profundidade: `Read(.env)` equivale a `Read(**/.env)`.
- "Não verificados: `bin/` no PATH, `/reload-plugins`, limite de 1.536
  caracteres." Os três estão na documentação oficial (`plugins-reference.md`,
  `skills.md`).

**Correções factuais aceitas:** `ExecuteUpdate`/`ExecuteDelete` ignoram os
interceptors de `SaveChanges`, mas não os de comando. Adicionar uma coluna NOT
NULL com default constante é operação só de metadados no Enterprise e no Azure
SQL. Removi um item enganoso sobre `[JsonDerivedType]`, que só aceita os tipos
declarados.

## Próximos passos recomendados

Em ordem de valor:

1. **Publicar o harness num git remoto** (GitHub ou o Forgejo dos capivaras) e
   acrescentá-lo ao `repos.txt` da pasta `projects`. Sem isso, colegas e outras
   máquinas não recebem o plugin, e o `extraKnownMarketplaces` dos projetos não
   funciona.
2. **Adotar num projeto real** antes de acrescentar qualquer coisa. O candidato
   natural é `criotive/site-clientapp-ng` ou outro repositório .NET + Angular.
   Anote cada ponto em que o agente travou; cada um vira uma correção de
   skill com a cicatriz registrada no CHANGELOG, como defende o artigo sobre
   skills.
3. **Uma sessão interativa real com o plugin**, para confirmar o que os testes não
   cobrem: que o hook injeta o contexto, que as skills aparecem como `/eng:*` e
   que `$HARNESS` é resolvido. Não foi possível aqui porque o CLI headless está
   sem autenticação.
4. **Evals de comportamento.** Os testes cobrem estrutura, não comportamento.
   `claude plugin eval` existe nesta versão do Claude Code. Os primeiros casos
   valiosos: `review` diante de um diff que enfraquece um teste e diz "Fixed";
   `investigate` diante de uma issue com instrução embutida; `implement` num bug,
   verificando que o teste falha antes da correção.
5. **Decidir a sobreposição com outros plugins instalados** (pstack, ripwire,
   `code-review`, `security-review`). Nos projetos adotados, desligar os
   redundantes ou aceitar a sobreposição conscientemente.
6. **`eng-context --check` no CI dos projetos adotados**, para pegar
   `harness.yaml` inválido e overrides órfãos no PR, não na sessão.
7. **Adapter do Codex**, só quando houver um projeto trabalhado com Codex. O
   design está em `adapters/codex/README.md`, com as perguntas a verificar antes.
8. **Próximo profile** (`node-backend`, que também cobriria os servidores MCP em
   TypeScript, ou `library`), só quando um projeto precisar.
