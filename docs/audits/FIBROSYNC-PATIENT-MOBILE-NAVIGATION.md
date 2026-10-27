# Tarefa 1 — Estrutura mobile da navegação do paciente

Data: 26/10/2026.

## Escopo e baseline

A branch inicial era `main`, acompanhando `origin/main`, sem alterações no Git. Não foram encontrados arquivos `AGENTS.md` aplicáveis. A referência funcional foi a auditoria anterior, confrontada com os arquivos atuais de rotas, navegação, layout, componentes, estilos e configuração PWA.

A apresentação nova é condicionada a `variant === 'patient'` e ao breakpoint existente `xl` (1280 px). Administradores continuam podendo acessar o contexto de paciente, com a regra anterior que omite Profissionais nesse contexto. Os guards de autorização e a restauração de sessão não foram modificados.

## Implementação e arquivos

| Arquivo | Mudança e motivo |
| --- | --- |
| `frontend/src/layouts/workspace-layout.tsx` | Identificação acessível do menu; composição mobile do paciente; ações no diálogo; retorno de foco; fechamento ao atingir desktop ou navegar no histórico; retorno ao início do conteúdo ao trocar de página no paciente mobile. A parte de autenticação/autorização permaneceu igual. |
| `frontend/src/components/workspace-topbar.tsx` | Cabeçalho do paciente com logotipo existente, contexto da página e busca disponível abaixo de `xl`; envio por botão/Enter; rascunho de busca vinculado à entrada do histórico; ações existentes extraídas para composição compartilhada, mantendo o mesmo hook de logout. |
| `frontend/src/components/workspace-sidebar.tsx` | Classe de escopo do paciente e nome acessível da navegação. Mantém a lista, textos, ícones, destinos e filtro de permissões existentes. |
| `frontend/src/index.css` | Estilos específicos do paciente para áreas seguras, altura dinâmica do diálogo, controles de navegação de pelo menos 44 px, cabeçalho sticky e movimento reduzido. Não altera tokens ou paleta. |
| `docs/audits/FIBROSYNC-PATIENT-MOBILE-NAVIGATION.md` | Registro do escopo, baseline, validação e limitações desta tarefa. |

Nenhuma dependência foi instalada. Não houve mudança de backend, schema, migrations, contratos, serviços de domínio, regras clínicas, autenticação, política de cache ou lógica offline. Não foram realizados commit, push ou deploy.

## Antes e depois

Antes, a busca desaparecia abaixo de `md`; IA, saída e instalação disputavam a linha do cabeçalho com o botão de menu. O diálogo não tinha identificação acessível explícita ou ajuste às áreas seguras/viewport dinâmica.

Agora, abaixo de `xl`, o paciente vê marca/contexto e uma busca de largura completa. O diálogo reutiliza a sidebar e seus nove destinos, com IA, saída e instalação em uma área separada das opções roláveis. O foco fica contido no diálogo e retorna ao acionador ao fechar. Escape, botão de fechar, toque fora, seleção de destino e transição para desktop foram verificados.

Em desktop, a sidebar e os controles anteriores continuam na mesma apresentação. Nas áreas médica e administrativa, o ajuste compartilhado é mínimo: semântica do menu e reutilização das ações, sem nova composição visual.

## Verificações de código

Comandos executados em `frontend/`, antes e depois das alterações:

| Verificação | Baseline | Resultado final |
| --- | --- | --- |
| `npm run lint` | Passou | Passou |
| `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false` | Falhou com TS2307 em `src/App.tsx(7,49)` | Mesma falha, sem diagnóstico adicional |
| `node node_modules/typescript/bin/tsc -p tsconfig.node.json --noEmit --incremental false` | Passou | Passou |
| `npm run build` | Falhou na etapa TypeScript | Mesma falha na etapa TypeScript; Vite build não executado |
| `git diff --check` | Sem alterações | Passou |

Falha preexistente: `Cannot find module '@vercel/analytics/react' or its corresponding type declarations.` A dependência consta do manifesto e lock, mas não está disponível no ambiente instalado. A integração, os manifests e os locks não foram alterados para contornar isso.

A comparação do diff também confirmou que `ProtectedWorkspaceLayout`, os wrappers de papéis, as rotas, os serviços, o backend e a configuração PWA permaneceram sem alterações funcionais.

## Validação em navegador

Navegador: Chrome headless `151.0.7922.173`, usando um driver Playwright Core já disponível no ambiente, sem adicioná-lo ao projeto.

Como a entrada completa importa a dependência Analytics ausente, a inspeção utilizou uma entrada temporária em `/tmp/fibrosync-mobile-review/`. Ela monta o `AppRouter` real, os layouts, guards e páginas reais, com os estilos/fontes do frontend. A sessão inicial e as respostas HTTP são fictícias; requisições externas foram bloqueadas. Não foram usados dados, credenciais, banco ou backend reais. Essa entrada não substitui nem altera a entrada da aplicação e não constitui homologação integral de produção.

| Cenário executado | Resultado |
| --- | --- |
| 320, 360, 390 e 768 px de largura, 844 px de altura | Passou |
| Nove destinos por toque no menu em cada largura | Passou: 36 navegações |
| Acesso direto aos nove destinos em cada largura | Passou: 36 acessos |
| Fechar por Escape e por toque fora | Passou |
| Estado `aria-expanded` e associação entre acionador/diálogo | Passou |
| Tab e Shift+Tab contidos no diálogo; abertura por Enter e fechamento explícito | Passou |
| Retorno do foco ao botão do menu | Passou |
| Controles e links do menu com dimensões mínimas de 44 px | Passou |
| Voltar/avançar, inclusive com menu aberto | Passou com sessão fictícia preservada |
| Busca por botão, nova busca por Enter e query na URL | Passou |
| Acionamento de instalação com `beforeinstallprompt` simulado | Passou; não é instalação real |
| Acesso à prévia de IA pelo menu | Passou |
| Menu aberto ao redimensionar para desktop | Fecha; não reaparece ao retornar ao mobile |
| Cabeçalho alcançável durante rolagem | Passou |
| Geometria do cabeçalho/diálogo, início do conteúdo e largura global | Sem overflow/encobrimento detectado na estrutura verificada |
| Altura reduzida 390×360 e paisagem 844×390 | Último destino do menu alcançável e funcional |
| Preferência de movimento reduzido | Animação e transição dos links verificadas como desativadas |
| Desktop 1280, 1366, 1440 e 1920 px | Sidebar visível, menu mobile oculto e cabeçalho sem overflow |
| Área médica: perfil em 390 e 1440 px | Renderização e menu verificados |
| Área administrativa: relatórios em 390 e 1440 px | Renderização e menu verificados |
| Administrador no contexto de paciente | Oito destinos, sem Profissionais, como antes |
| Paciente tentando acessar rotas médica/administrativa | Redirecionamento existente preservado |

Nos quatro tamanhos mobile principais, não foram capturados erros JavaScript de página durante a matriz de navegação.

Foram comparadas capturas antes/depois, com o mesmo navegador, fontes, dados fictícios e viewport. As imagens foram idênticas pixel a pixel no paciente desktop (1440 px), perfil médico (390/1440 px) e relatórios administrativos (390/1440 px).

Capturas e scripts temporários ficaram em `/tmp/fibrosync-mobile-review/`; não foram adicionados como infraestrutura ou dependência do projeto.

## Limitações e riscos remanescentes

- O build completo continua bloqueado pela dependência ausente preexistente. Não se afirma que o bundle de produção passou.
- A verificação foi em Chrome com viewports e toque emulados. Safari/iOS, dispositivos físicos, teclado virtual real e instalação/reabertura real do PWA ainda precisam de homologação.
- As regras de áreas seguras foram inspecionadas no CSS. A tentativa de emular insets por CDP não foi suportada pelo protocolo disponível; recortes físicos não foram reproduzidos.
- A entrada temporária não executa `App.tsx`, Analytics ou o ciclo global do service worker. Cache/offline foram preservados por ausência de alterações nesses arquivos, sem alegação de teste de instalação, atualização ou offline real.
- A sessão fictícia permite verificar navegação e guards locais; não comprova renovação de cookie, expiração ou logout contra a API real.
- A inspeção das áreas médica e administrativa foi limitada aos cenários acima; não cobre todos os seus fluxos.
- A matriz valida estrutura e navegação. Dashboard, registro, calendário, gráficos e relatórios mantêm seus layouts e limitações internas anteriores. Comunidade continua abrindo a prévia já configurada.
- Foram observados avisos de dimensão inicial do Recharts durante a montagem de gráficos, também presentes na captura de baseline. Não foram tratados nesta tarefa de navegação.
- Os principais pontos de regressão a observar são retorno de foco após navegação, troca de breakpoint, busca em entradas do histórico e altura disponível no menu com instalação habilitada.

## Próxima tarefa recomendada

Adaptar a apresentação mobile do registro de dor, começando por separar estado/validação da composição visual e validar mapa corporal, etapas e teclado. Essa tarefa não foi iniciada. A recuperação do ambiente de dependências deve ser tratada separadamente para liberar o build completo.
