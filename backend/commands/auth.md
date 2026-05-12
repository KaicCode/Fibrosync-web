# Autenticação JWT

O sistema utiliza **JSON Web Tokens (JWT)** para autenticação e proteção de rotas.

### Fluxo de Autenticação
1. **Registro**: O usuário envia email, senha e nome para `/api/auth/register`. A senha é criptografada com **bcrypt** antes de ser salva.
2. **Login**: O usuário envia credenciais para `/api/auth/login`. Se válidas, a API retorna um token JWT.
3. **Acesso**: O token deve ser enviado no header de todas as requisições protegidas:
   `Authorization: Bearer <seu_token>`

### Middleware de Proteção
Para proteger uma rota, utilize o `authMiddleware`:

```typescript
import { authMiddleware } from '@middlewares/auth.middleware';

router.get('/rota-privada', authMiddleware, controller.metodo);
```

### Acesso ao Usuário Logado
O middleware adiciona os dados do usuário ao objeto `req`:
```typescript
const userId = req.user.id;
```

### Configuração
Certifique-se de definir a variável `JWT_SECRET` no seu arquivo `.env`. Se não definida, o sistema usará um valor padrão (não recomendado para produção).
