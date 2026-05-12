# Comandos Node.js

### Instalação Inicial
Instala todas as dependências listadas no `package.json`:
```bash
npm install
```

### Adicionar novas dependências
```bash
# Dependência de produção
npm install <nome-do-pacote>

# Dependência de desenvolvimento
npm install <nome-do-pacote> --save-dev
```

### Scripts Principais
```bash
# Rodar em modo de desenvolvimento (com auto-reload)
npm run dev

# Fazer o build do projeto (TypeScript para JavaScript)
npm run build

# Rodar a versão de produção
npm start
```
