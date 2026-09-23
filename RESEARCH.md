# Research

Fase 1 do `engineering-harness`. Este documento separa três coisas que costumam
se misturar:

- **[Artigo]** o que os artigos dizem. Citação curta ou paráfrase fiel.
- **[Proposta]** o que eu concluo ou proponho a partir disso.
- **[Rejeitado]** ideias dos artigos (ou suas) que não entram no harness, e por quê.

Fontes lidas na íntegra em 2026-09-23:

- A1: Fabio Akita, *Parem de inventar desculpas e façam mais deploy! Com a IA, a
  premissa mudou.* 2026-09-22.
  <https://akitaonrails.com/2026/09/22/parem-de-inventar-desculpas-e-facam-mais-deploy-a-premissa-mudou/>
- A2: Fabio Akita, *Falando um pouco sobre minhas Skills de IA.* 2026-09-17.
  <https://akitaonrails.com/2026/09/17/falando-um-pouco-sobre-minhas-skills-de-ia/>
- A3: README do repositório `akitaonrails/my-skills` (só a seção de layout e
  distribuição, para entender o mecanismo, não o conteúdo das skills).
- Documentação oficial do Claude Code, Codex e GitHub Copilot sobre skills,
  plugins e instruções de projeto. Os fatos usados no design estão em
  [ARCHITECTURE.md](ARCHITECTURE.md#fatos-verificados-sobre-os-agentes).

---

## 1. Ideias principais do artigo sobre deploy (A1)

**[Artigo]**

1. **A tese é econômica, não técnica.** "É melhor deployar mais rápido, porque
   corrigir depois ficou rápido e barato." O custo de corrigir caiu; o processo
   de revisão da maioria dos times ainda assume que ele é alto.
2. **O gargalo é quem dirige o agente.** Quando o LLM erra, "na esmagadora maioria
   das vezes o erro não é do modelo", é de quem formulou o pedido. O agente
   multiplica julgamento de engenharia, não o substitui.
3. **Nada disso é novo.** XP (1997-99), Manifesto Ágil (2001), Continuous Delivery
   e os relatórios DORA já mostravam que deploy pequeno e frequente reduz a taxa
   de falha. A IA só removeu a desculpa do custo.
4. **Pré-requisito, não atalho.** Deploy rápido só é seguro sobre a "engenharia
   básica": teste automatizado, CI em todo push, rollback real, observabilidade.
   "Se não dá pra reverter, sua infra é uma bosta, corrija ela pra ontem."
5. **Ambiente mínimo** (lista do autor, "nenhum item aqui é opcional"):
   teste unitário; teste de cenário/integração (concorrência, falha parcial,
   conflito); CI por mudança nas plataformas publicadas; revisão automática
   hostil pré-merge; feature flag; staging como gate; rollback rápido +
   observabilidade; camada extra em compliance/financeiro/saúde.
6. **Onde a conta não fecha** (o autor reconhece):
   - dano que sai do sistema (pagamento, saúde, segurança física) não se desfaz
     com rollback, então a régua pré-deploy fica *mais* rígida;
   - migration de banco não reverte como binário, então use expand-contract;
   - biblioteca pública afeta terceiros, então semver é gate;
   - loja de app é gargalo externo;
   - a evidência é de projetos solo; generaliza o princípio, não o ritmo.
7. **A régua de teste é do domínio, não do autor do código.** Erro humano e erro de
   LLM derrubam pagamento igual; a exigência não muda com quem escreveu.
8. **Medir em vez de assumir.** Exemplo da VM Windows local que ficou mais lenta que
   o runner do GitHub. "Ferramenta boa é a que você mede."
9. **Atrito acumulado é dívida.** Release em rascunho que trava a automação
   seguinte; régua de esforço: "se publicar exige mais do que um comando, alguma
   etapa ainda está manual demais."
10. **Revisão automática pega o diff, não a arquitetura.** A auditoria "não pega
    duplicação espalhada entre PRs diferentes". Isso ainda depende de alguém notar
    o padrão.
11. **Feedback real vale mais que revisão.** Sem usuários reais, a revisão
    automatizada só confirma as próprias suposições.
12. **Manutenção barata de flags.** Pedir ao agente para auditar flags travadas no
    mesmo valor há meses e gerar o PR de limpeza.

## 2. Ideias principais do artigo sobre skills (A2)

**[Artigo]**

1. **"Não use as skills dos outros."** Skill de terceiro roda com as suas
   permissões, nos seus repositórios, com os seus tokens. "Prompt injection você
   instala voluntariamente e agradece."
2. **"Skills são só prompts."** Um diretório com `SKILL.md` (nome, descrição, corpo)
   e às vezes `scripts/`. Nada de mágica.
3. **Progressive disclosure resolve o custo de texto, não o de atenção.** Só nome e
   descrição entram no contexto; o corpo carrega sob demanda. Mas cada skill
   disputa a decisão de "qual ferramenta usar".
4. **"Skill encostada é dívida."** Processo muda, skill envelhece, agente executa
   regra obsoleta. Menos skills, melhor escritas, revisadas com frequência.
5. **Skills do autor são procedimentos operacionais completos**: `pr-audit`,
   `iss-audit`, `github-resolution`, `pr-bump`, `release`. Cada uma é um processo
   com gates, não um template de código.
6. **Princípios recorrentes nas skills:**
   - *evidence over narrative*: alegação do contribuidor é hipótese, com ledger
     (confirmado, parcial, sem suporte);
   - conteúdo externo é suspeito (nunca executar comando colado em issue);
   - separar observado, esperado, diagnóstico do reporter e correção proposta;
   - teste de regressão antes da correção;
   - "slop is a defect": sem abstração especulativa, TODO, refactor drive-by ou
     teste enfraquecido;
   - ticket fecha com CI verde no SHA exato;
   - dependências em lote ("batch, nunca serialize") com *supply-chain floor*;
   - release: versão deriva da classificação do changelog, tag anotada, nunca
     reescrever tag publicada, nunca cortar release não pedida.
7. **"Cada linha dessas skills é cicatriz."** Regras nascem de falhas observadas,
   não de blog post.
8. **"Skills são pouco. Conhecimento é muito."** O que carrega o workflow é:
   `AGENTS.md` por projeto, memória por projeto (decisões e gotchas), e
   **apontar para o exemplo vivo** ("faça como fizemos em `~/Projects/ai-memory`")
   em vez de escrever skill para coisa que muda (AUR, GitHub Actions).
9. **"Faça seu agente escrever tudo o que não virou código."** Pesquisa, decisão,
   alternativa rejeitada. Conhecimento acumulado é "juro composto".
10. **Ritual diário curto.** Uma linha do humano ("run pr-audit and iss-audit, then
    run github-resolution"); o trabalho pesado mora nas skills.
11. **Distribuição (A3):** um repositório mestre, per-skill symlinks para o
    diretório de skills de cada agente (Claude Code, Codex, opencode...).

## 3. O que isso significa para agentic software engineering

**[Proposta]**

1. **O produto é o ciclo, não o código.** Se gerar código ficou barato, o ativo
   escasso é o ciclo mudança → evidência → deploy → feedback. O harness deve
   encurtar esse ciclo e tornar cada volta mais confiável. Otimizar geração de
   código é otimizar a parte que já é barata.
2. **Evidência é a moeda.** O agente fala com confiança sobre qualquer coisa. O
   harness deve exigir artefatos verificáveis em cada fronteira: comando rodado e
   saída, teste que falhava e passou, diff real, SHA com CI verde.
3. **O risco se desloca para o que é irreversível.** Onde rollback é barato, ande
   rápido. Onde não é (dados, dinheiro, contratos públicos, segurança), o harness
   precisa detectar o caso e subir a régua. Essa classificação de
   reversibilidade é mais útil que qualquer regra fixa de processo.
4. **O agente é um executor com permissões reais lendo texto não confiável.**
   Issue, PR, README de dependência e página web viram prompt. Segurança do
   harness é antes de tudo higiene de fronteira de confiança.
5. **Conhecimento de projeto é o que diferencia uma sessão boa de uma ruim.** Sem
   memória, "cada sessão começa do zero como um estagiário com amnésia" (A2). O
   harness precisa de um lugar barato para gravar o que só aquele repositório sabe.
6. **Revisão por diff tem ponto cego estrutural.** A1 admite que duplicação entre
   PRs escapa. Isso justifica um processo periódico separado (auditoria de
   arquitetura), distinto do review de PR.
7. **A skill do outro é a hipótese do outro.** Vale para as do Akita e vale para as
   deste harness: o harness deve ser pequeno o bastante para que eu leia, entenda e
   ajuste tudo. Complexidade que eu não leio é complexidade que eu não controlo.

## 4. Classificação: onde cada ideia deve morar

Critério que uso para classificar:

| Tipo | O que é | Teste para decidir |
|---|---|---|
| **Skill** | Procedimento reutilizável, com passos, gates e saída verificável | "Eu executaria isso do mesmo jeito em qualquer projeto, várias vezes?" |
| **Workflow** | Sequência de skills para um tipo de mudança | "É uma ordem de skills, não um procedimento novo?" |
| **Policy** | Princípio sempre válido, curto, que orienta julgamento | "Vale em toda tarefa, independente da skill?" |
| **Profile** | Conhecimento de stack (comandos, armadilhas, ferramentas) | "Muda com a stack, não com o projeto?" |
| **Project context** | Fatos estáveis do repositório | "Só vale neste repositório e muda raramente?" |
| **Project memory** | Descoberta que se perderia no fim da sessão | "Custou tempo descobrir e não está no código?" |
| **Automation** | Checagem mecânica determinística | "Um script responde isso sem julgamento?" |

**[Proposta]** Aplicando às ideias dos artigos:

| Ideia | Destino | Justificativa |
|---|---|---|
| Evidence over narrative | **Policy** (núcleo) | Vale em toda tarefa, não é procedimento |
| Conteúdo externo é dado, não instrução | **Policy** (security) | Princípio transversal |
| Teste de regressão antes da correção | **Skill** `test` + workflow `bugfix` | Procedimento com passos |
| "Slop is a defect" | **Policy** (engineering) + checklist de `implement`/`review` | Critério de qualidade usado por várias skills |
| Revisão hostil pré-merge | **Skill** `review` | Procedimento com checklist e saída |
| Auditoria de issue externa | Parte de **`investigate`** (seção de input não confiável) | Não justifica skill própria para um dev de apps; o volume de issues externas do Akita é de mantenedor OSS |
| Dependências em lote + supply-chain floor | **Skill** `dependency-update` | Procedimento repetido, com gates |
| Release por classificação de changelog | **Skill** `release` | Procedimento com gates duros |
| Semver como gate de lib pública | **Profile** `library` (futuro) + `release` | Depende do tipo de projeto |
| Expand-contract em migrations | **Workflow** `migration` + profile (EF Core) | Sequência de passos, com detalhe de stack |
| Classificar reversibilidade antes de subir | **Policy** (engineering) + `plan` | Decide a régua de toda mudança |
| Ambiente mínimo (CI, flags, staging, rollback) | **Skill** `release` (checagem de pré-requisitos) + project context | Cada projeto declara o que tem; o harness pergunta pelo que falta |
| Duplicação entre PRs | **Skill** `architecture-audit` (periódica) | O ponto cego do review por diff |
| Auditoria de feature flags mortas | Checklist de `architecture-audit` | Não justifica skill própria |
| AGENTS.md por projeto | **Project context** | Fatos do repositório |
| Decisões e gotchas | **Project memory** | Conhecimento que evapora |
| Pesquisa que o agente fez | **Project memory** (`discoveries/`) ou `docs/` do projeto | "Escreva tudo o que não virou código" |
| Apontar para o exemplo vivo | **Project context** (seção "Reference implementations") | Exemplo vivo envelhece junto com o código; skill não |
| Frontmatter, links, estrutura das skills | **Automation** (script de validação) | Checagem mecânica |
| Pacotes desatualizados, APIs obsoletas, vulnerabilidades | **Automation** (comandos do profile) chamada por `dependency-update` | O script mede; a skill decide |
| Uma linha do humano, trabalho nas skills | **Workflow** | Workflows curtos, invocáveis por nome |

## 5. O que NÃO deveria virar skill

**[Proposta]**

- **Geradores de código** (`create-controller`, `create-service`,
  `create-component`, `create-interface`). O padrão certo é o do próprio
  repositório; o agente deve copiar o vizinho mais próximo, não um template
  global. Template global envelhece e briga com a convenção local. É a mesma
  lógica do "exemplo vivo" de A2.
- **Conhecimento de framework** (como escrever um interceptor Angular, como
  configurar EF Core). O modelo já sabe, a documentação oficial é mais atual, e o
  repositório mostra a convenção. Vai no máximo para o profile como *armadilhas*.
- **Regras sempre válidas** (evidência, segurança, escopo). Skill é carregada sob
  demanda; regra transversal precisa estar presente sempre. Vira policy.
- **Fatos de um projeto** (portas, connection strings de dev, comandos de build).
  Vira project context.
- **Procedimentos que mudam mais rápido que o harness** (publicar no AUR, detalhes
  de um provedor de CI). Aponte para o exemplo vivo.
- **Checagens determinísticas** (frontmatter válido, pacote desatualizado). Vira
  script. Prompt não é o mecanismo certo para o que um script faz sem errar.
- **Uma skill por ferramenta de terceiro** (skill de "usar o Docker"). O agente
  já usa.
- **`dotnet-modernize` como skill separada.** Ver
  [ARCHITECTURE.md](ARCHITECTURE.md#decisão-dotnet-modernize). Resumo: a
  modernização é o mesmo procedimento de `dependency-update` + `architecture-audit`
  com conhecimento de stack; o conhecimento vai para o profile.

## 6. Riscos de criar skills demais

**[Artigo]** "Skill encostada é dívida" e "mais ferramentas nem sempre melhoram o
resultado" (A2, citando a Anthropic).

**[Proposta]** Riscos concretos, alguns observados nesta máquina:

1. **Competição de roteamento.** A sessão onde este harness foi escrito já lista
   mais de 90 skills (pstack, ripwire, angular, anthropic-skills...). Várias se
   sobrepõem (`security-review`, `ripwire-security-scan`, `code-review`,
   `pstack:interrogate`). Cada skill nova com descrição vaga rouba invocações de
   outra ou nunca é chamada. Descrição é um contrato de roteamento, não marketing.
2. **Regra contraditória.** Duas skills com regras de teste diferentes geram
   comportamento dependente de qual carregou primeiro.
3. **Envelhecimento silencioso.** Ninguém revisa skill que não quebra build.
4. **Custo de contexto no momento errado.** Uma skill de 800 linhas carregada para
   uma tarefa de 5 minutos.
5. **Ilusão de processo.** Uma coleção grande parece rigor e esconde que ninguém
   sabe o que cada uma faz.
6. **Acoplamento de fornecedor.** Skills cheias de nomes de ferramenta de um agente
   específico param de funcionar no próximo.

## 7. Como evitar que o harness vire uma coleção de prompts

**[Proposta]** Mecanismos, não boas intenções:

1. **Teto explícito**, verificado por teste: 12 skills no total e 10 invocáveis
   pelo modelo. A v0 usa 11 e 9; as duas manuais (`release`, `adopt`) não
   disputam roteamento. Subir o teto exige um PR próprio com o motivo.
2. **Critério de admissão escrito** (em `CONTRIBUTING.md`): processo repetido,
   com saída verificável, que falhou pelo menos uma vez sem a skill.
3. **Uma regra, um lugar.** Policies contêm as regras; skills referenciam a policy
   em vez de repetir. Um teste automatizado detecta duplicação grosseira.
4. **Orçamento de tamanho.** `SKILL.md` com limite de linhas verificado por teste.
   Detalhe vai para arquivo de referência carregado só quando preciso.
5. **Saída definida.** Toda skill declara o artefato que produz (relatório,
   plano, diff + evidência). Skill sem saída verificável é conversa.
6. **Script onde script resolve.** Checagens determinísticas saem do prompt.
7. **Revisão periódica.** `CHANGELOG.md` e um item no próprio
   `architecture-audit` do harness: skill sem uso em 90 dias é candidata a remoção.
8. **Conhecimento no projeto, não no harness.** O harness carrega processo e
   conhecimento de stack; o resto vive em `.engineering/` de cada projeto.

## Ideias rejeitadas ou adaptadas

| Ideia | Status | Motivo |
|---|---|---|
| "Suba e corrija depois" como regra | **[Adaptado]** | O próprio A1 condiciona a rollback, CI e observabilidade. O harness transforma isso em *classificação de reversibilidade*: rápido onde é barato reverter, rígido onde não é. Deploy é sempre decisão humana. |
| "Não peça opinião de ninguém" | **[Rejeitado]** | Funciona para um mantenedor solo. Num contexto de time e cliente, ADR e review humano existem para compartilhar decisão. O harness registra decisões; não as esconde. |
| Skills separadas `pr-audit` e `iss-audit` | **[Adaptado]** | Faz sentido para quem recebe centenas de PRs externos. Aqui vira uma skill `review` com modo "contribuição externa" e a seção de input não confiável em `investigate`. |
| Per-skill symlinks como distribuição | **[Rejeitado para Claude Code]** | O Claude Code tem mecanismo nativo e versionado (plugins + marketplace declarado no projeto). Symlink não fixa versão por projeto. Mantido como caminho para agentes sem sistema de plugin. |
| Sistema próprio de memória (`ai-memory`) | **[Rejeitado na v0]** | O problema real (conhecimento que evapora) se resolve com Markdown versionado no repositório. Ferramenta dedicada só se o Markdown falhar na prática. |
| Métricas de produtividade (linhas, PRs) | **[Rejeitado]** | Linhas de código não medem software funcionando. O harness mede o ciclo (evidência por mudança, tempo até feedback), não o volume. |
| Skill por ferramenta/plataforma | **[Rejeitado]** | Exemplo vivo envelhece melhor (A2 defende o mesmo). |

## Implicações para o harness

1. O harness é **processo + conhecimento de stack + contrato de projeto**, não
   conhecimento de projeto.
2. O núcleo é Markdown neutro. Adapters só traduzem para o mecanismo de cada
   agente.
3. Policies são curtas e sempre presentes; skills são poucas e sob demanda;
   profiles carregam o que muda com a stack.
4. Toda skill termina em artefato verificável.
5. Reversibilidade é a variável que regula a régua, não uma regra fixa.
6. Segurança começa na fronteira de confiança: o que o agente lê não é o que o
   humano pediu.
7. O projeto é dono do próprio contexto e memória, versionados junto com o código.
8. O harness é software: versão, changelog, testes de estrutura, exemplos.
