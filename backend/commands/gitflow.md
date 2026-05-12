# Padrão de Versionamento (Git Flow)

O projeto adota o modelo **Git Flow** para o gerenciamento de branches e versionamento do código. Esse modelo garante que o histórico do projeto permaneça organizado e que novas funcionalidades ou correções sejam desenvolvidas de forma isolada.

## 1. Branches Principais

Existem duas branches que têm vida infinita no repositório:
- **`main`**: Contém apenas código em nível de produção (estável). Cada commit nesta branch deve ser uma nova versão lançada. NUNCA comite diretamente na `main`.
- **`develop`**: É a branch de integração para novas funcionalidades. Contém o código que será incluído no próximo lançamento. Todas as branches de `feature` devem partir dela e retornar para ela.

## 2. Branches de Suporte

Estas branches têm vida útil limitada e são removidas após serem mescladas.

### 2.1 Feature Branches (`feature/*`)
Utilizadas para desenvolver novas funcionalidades.
- **Deve partir de:** `develop`
- **Deve ser mesclada em:** `develop`
- **Nomenclatura:** `feature/nome-da-funcionalidade` (ex: `feature/login-jwt`)

**Como usar:**
```bash
git checkout -b feature/minha-nova-funcionalidade develop
# Faça os commits...
# Ao finalizar, abra um Pull Request (PR) para a branch develop
```

### 2.2 Bugfix Branches (`bugfix/*`)
Utilizadas para corrigir bugs encontrados no ambiente de desenvolvimento ou testes (antes de ir para produção).
- **Deve partir de:** `develop`
- **Deve ser mesclada em:** `develop`
- **Nomenclatura:** `bugfix/nome-do-bug` (ex: `bugfix/erro-validacao-email`)

**Como usar:**
```bash
git checkout -b bugfix/erro-banco develop
# Corrija o bug...
# Abra um PR para a branch develop
```

### 2.3 Hotfix Branches (`hotfix/*`)
Utilizadas para correções críticas e urgentes em **produção**.
- **Deve partir de:** `main`
- **Deve ser mesclada em:** `main` E `develop`
- **Nomenclatura:** `hotfix/nome-da-correcao` (ex: `hotfix/falha-pagamento`)

**Como usar:**
```bash
git checkout -b hotfix/falha-critica main
# Corrija o bug...
# Abra PR para main e depois garanta que o código também vá para develop
```

### 2.4 Release Branches (`release/*`)
Utilizadas para preparar um novo lançamento (ajustes finos de versão, documentação).
- **Deve partir de:** `develop`
- **Deve ser mesclada em:** `main` E `develop`
- **Nomenclatura:** `release/vX.Y.Z` (ex: `release/v1.2.0`)

## 3. Padrão de Commits (Conventional Commits)

Os commits devem seguir o padrão Conventional Commits para facilitar o rastreamento e a geração de changelogs.

**Estrutura:** `<tipo>(<escopo opcional>): <descrição curta>`

**Tipos permitidos:**
- `feat`: Uma nova funcionalidade
- `fix`: Correção de um bug
- `docs`: Alterações apenas na documentação
- `style`: Alterações de formatação (espaços, formatação de código, etc)
- `refactor`: Refatoração de código (não adiciona feature nem corrige bug)
- `perf`: Mudança que melhora o desempenho
- `test`: Adição ou correção de testes
- `chore`: Atualizações de tarefas de build, configurações de pacotes, etc.

**Exemplos:**
- `feat(auth): adiciona endpoint de registro de usuário`
- `fix(user): corrige erro na validação de email`
- `docs: atualiza readme com instruções de setup`

## 4. Fluxo de Trabalho (Resumo)

1. Crie uma branch a partir da `develop` (ex: `feature/nova-tela`).
2. Trabalhe na sua funcionalidade, fazendo commits descritivos.
3. Envie a branch para o repositório remoto (`git push origin feature/nova-tela`).
4. Abra um Pull Request (PR) no GitHub/GitLab apontando para a `develop`.
5. Solicite revisão de código de pelo menos outro desenvolvedor.
6. Após aprovado, o PR é mesclado (Merge) e a branch de feature pode ser apagada.
