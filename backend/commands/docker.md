# Comandos Docker

O projeto utiliza Docker Compose para gerenciar o PostgreSQL.

### Iniciar o Banco de Dados
Sobe o container em segundo plano:
```bash
docker compose up -d
```

### Parar o Banco de Dados
```bash
docker compose down
```

### Verificar Status
```bash
docker ps
```

### Ver Logs do Banco
```bash
docker logs fibrosync_postgres -f
```

### Limpar Volumes (CUIDADO: Apaga os dados)
```bash
docker compose down -v
```
