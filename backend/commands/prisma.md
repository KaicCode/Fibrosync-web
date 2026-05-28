## 1. Comandos Prisma

### Gerar o Client
Executar sempre que o schema mudar ou após `npm install`:

```bash
npx prisma generate
```

### Sincronizar schema com o banco em desenvolvimento

```bash
npx prisma db push
```

### Abrir o Prisma Studio

```bash
npx prisma studio
```

### Criar migração versionada

```bash
npx prisma migrate dev --name nome_da_migracao
```