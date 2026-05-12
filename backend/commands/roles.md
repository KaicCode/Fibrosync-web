# Controle de Acesso (Roles & Permissions)

O sistema utiliza **RBAC (Role-Based Access Control)** para gerenciar permissões de acesso aos recursos da API.

### Roles Disponíveis
- `USER`: Usuário padrão do sistema. Pode acessar seus próprios dados.
- `ADMIN`: Administrador. Possui acesso total ao sistema, incluindo a listagem de todos os usuários.

### Como funciona
1. **Enum no Banco**: O Prisma gerencia as roles através de um `enum Role` no arquivo `schema.prisma`.
2. **Token JWT**: A role do usuário é incluída no payload do token JWT no momento do login.
3. **Middleware**: Utilizamos o `rolesMiddleware` para validar se o usuário tem a permissão necessária.

### Como proteger uma rota por Role
Sempre use o `authMiddleware` antes do `rolesMiddleware`:

```typescript
import { authMiddleware } from '@middlewares/auth.middleware';
import { rolesMiddleware } from '@middlewares/roles.middleware';

// Apenas administradores podem acessar
router.get('/admin-only', authMiddleware, rolesMiddleware(['ADMIN']), controller.metodo);

// Usuários e admins podem acessar
router.get('/shared', authMiddleware, rolesMiddleware(['USER', 'ADMIN']), controller.metodo);
```

### Alterando a Role de um Usuário
Por padrão, todo novo usuário recebe a role `USER`. Para promover um usuário a `ADMIN`, é necessário alterar o campo `role` diretamente no banco de dados (via Prisma Studio ou SQL).
