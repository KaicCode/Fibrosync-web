# Documentação Swagger (OpenAPI)

O projeto utiliza o **Swagger** para documentar automaticamente os endpoints da API, permitindo testes interativos e uma visão clara das rotas disponíveis.

### Como acessar
Com o servidor rodando (`npm run dev`), acesse:
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Como documentar novas rotas
Utilizamos JSDoc nos arquivos de rotas para definir os endpoints. Exemplo:

```typescript
/**
 * @swagger
 * /exemplo:
 *   get:
 *     summary: Descrição curta da rota
 *     tags: [TagDoModulo]
 *     responses:
 *       200:
 *         description: Sucesso
 */
router.get('/exemplo', ...);
```

### Configuração
A configuração principal está em `src/config/swagger.ts`. Lá você pode alterar o título da API, versão e servidores disponíveis.

### Benefícios
- **Interatividade**: Teste as rotas diretamente pelo navegador.
- **Sincronização**: A documentação vive junto com o código.
- **Padronização**: Segue o padrão OpenAPI 3.0.
