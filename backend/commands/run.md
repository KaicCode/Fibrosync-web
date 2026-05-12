# Como Rodar o Projeto (Passo a Passo)

Siga estas etapas para colocar o ambiente de desenvolvimento de pé:

1. **Configurar variáveis de ambiente:**
   Copie o `.env.example` para um novo arquivo `.env` e ajuste se necessário.
   ```bash
   cp .env.example .env
   ```

2. **Subir o Banco de Dados:**
   ```bash
   docker compose up -d
   ```

3. **Instalar Dependências:**
   ```bash
   npm install
   ```

4. **Preparar o Prisma:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Iniciar o Servidor:**
   ```bash
   npm run dev
   ```
