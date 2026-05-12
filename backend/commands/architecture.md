# Estrutura Modular do Projeto

O projeto segue uma arquitetura modular por funcionalidades. Em vez de agrupar por tipo (todos os controllers juntos), agrupamos por domínio (tudo de usuário junto).

### Estrutura de Pastas
Cada módulo em `src/modules/` segue este padrão:

```text
modulo/
├── controllers/    # Lógica de entrada/saída (HTTP)
├── services/       # Lógica de negócio e acesso a dados
├── routes/         # Definição das rotas do módulo
├── dtos/           # Data Transfer Objects (validação)
└── interfaces/     # Tipagens específicas do módulo
```

### Por que usar?
1. **Escalabilidade**: Fácil adicionar novas funcionalidades sem poluir pastas globais.
2. **Organização**: Tudo relacionado a uma feature está no mesmo lugar.
3. **Manutenibilidade**: Menor risco de efeitos colaterais ao alterar um módulo.

### Como criar um novo módulo
1. Crie a pasta em `src/modules/<nome>`.
2. Crie as subpastas necessárias.
3. Registre as rotas do novo módulo em `src/modules/modules.routes.ts`.
