# Padrão de Respostas da API

Para manter a consistência entre o Frontend e o Backend, todas as respostas da API seguem um formato padrão.

### Estrutura de Sucesso
```json
{
  "success": true,
  "message": "Mensagem descritiva",
  "data": { ... },
  "statusCode": 200
}
```

### Estrutura de Erro
```json
{
  "success": false,
  "message": "Mensagem de erro",
  "errors": null,
  "statusCode": 400
}
```

### Como usar no Controller
Utilize a classe `ApiResponse` localizada em `@utils/api-response`:

```typescript
import { ApiResponse } from '@utils/api-response';

// Sucesso
return res.json(ApiResponse.success(data, 'Operação realizada'));

// Erro manual (ou use o next(error))
return res.status(400).json(ApiResponse.error('Dados inválidos', 400));
```

### Tratamento de Erros Global
Sempre que um erro ocorrer em um Controller, use o `next(error)`. O middleware global em `src/middlewares/error-handler.middleware.ts` irá capturar e formatar a resposta automaticamente.

Para lançar erros personalizados:
```typescript
import { AppError } from '@middlewares/error-handler.middleware';

throw new AppError('Usuário não encontrado', 404);
```
