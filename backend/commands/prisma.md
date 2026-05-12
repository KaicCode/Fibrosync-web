# Comandos Prisma

O Prisma é o ORM utilizado para interagir com o PostgreSQL.

### Gerar o Client
Deve ser executado sempre que o schema for alterado ou após um `npm install`:
```bash
npx prisma generate
```

### Sincronizar Schema com o Banco (Desenvolvimento)
Aplica as mudanças do `schema.prisma` diretamente no banco:
```bash
npx prisma db push
```

### Prisma Studio
Interface visual para visualizar e editar os dados do banco:
```bash
npx prisma studio
```

### Migrations (Produção/Histórico)
Para criar e aplicar migrações versionadas:
```bash
npx prisma migrate dev --name nome_da_migracao
```
