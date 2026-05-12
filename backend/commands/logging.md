# Sistema de Logs (Winston)

O projeto utiliza o **Winston** para gerenciar logs de forma profissional, permitindo o rastreamento de requisições, erros e eventos do sistema.

### Configuração
O logger está configurado em `@utils/logger` e possui diferentes níveis:
- `error`: Erros críticos do sistema.
- `warn`: Avisos importantes.
- `info`: Informações gerais (ex: servidor rodando).
- `http`: Log de todas as requisições recebidas.
- `debug`: Informações detalhadas para desenvolvimento.

### Armazenamento
Os logs são exibidos no console e também salvos em arquivos na pasta `/logs`:
- `logs/error.log`: Apenas logs de erro.
- `logs/all.log`: Todos os logs gerados pela aplicação.

### Como usar
Importe o Logger em qualquer lugar do projeto:

```typescript
import Logger from '@utils/logger';

Logger.info('Iniciando processo X...');
Logger.error('Falha ao conectar com serviço Y');
Logger.debug('Valor da variável Z:', valor);
```

### Middleware de Requisição
Todas as requisições HTTP são logadas automaticamente pelo `request-logger.middleware.ts`, mostrando o método, URL, status code e tempo de resposta.
