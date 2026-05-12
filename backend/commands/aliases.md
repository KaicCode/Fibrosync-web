# TypeScript Path Aliases

Para evitar imports relativos longos (ex: `../../../utils/file`), utilizamos Aliases (apelidos).

### Como usar
Sempre que for importar algo das pastas principais, use o prefixo `@`:

```typescript
// Em vez de:
import { someUtil } from '../../utils/helper';

// Use:
import { someUtil } from '@utils/helper';
```

### Aliases Disponíveis
- `@/*`: Mapeia para `src/*`
- `@config/*`: Mapeia para `src/config/*`
- `@controllers/*`: Mapeia para `src/controllers/*`
- `@middlewares/*`: Mapeia para `src/middlewares/*`
- `@models/*`: Mapeia para `src/models/*`
- `@routes/*`: Mapeia para `src/routes/*`
- `@services/*`: Mapeia para `src/services/*`
- `@utils/*`: Mapeia para `src/utils/*`
- `@generated/*`: Mapeia para `src/generated/*`

---
**Nota Técnica:** 
- Em desenvolvimento, o `ts-node-dev` usa o `tsconfig-paths` para resolver esses caminhos.
- Em produção, o `module-alias` resolve os caminhos dentro da pasta `dist`.
