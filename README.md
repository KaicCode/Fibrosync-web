# FibroSync

O **FibroSync** é uma plataforma healthtech focada em ajudar pessoas com fibromialgia a acompanhar sintomas, identificar padrões e entender possíveis gatilhos de crises.

## 🚀 Sobre o Projeto

O sistema funciona como um assistente inteligente de monitoramento diário, onde o usuário registra informações essenciais do seu dia a dia. A plataforma vai além do simples registro, integrando dados externos para fornecer uma visão holística da saúde do usuário.

## ✨ Principais Funcionalidades

- **Monitoramento Diário:** Registro de dor, qualidade do sono, humor, energia e níveis de estresse.
- **Integração Climática:** Coleta automática de dados de temperatura, umidade e chuva para análise de correlação com os sintomas.
- **Análise Inteligente:** Geração de insights e tendências baseadas nos dados inseridos.
- **Indicador de Risco:** Sistema que ajuda na identificação de possíveis gatilhos e riscos de crises.

## 🎯 Objetivo

O FibroSync visa oferecer uma ferramenta inteligente, acessível e escalável para análise comportamental e acompanhamento contínuo. 

> **Importante:** O objetivo da plataforma não é substituir o acompanhamento médico, mas sim servir como um suporte valioso para o autocuidado e para o fornecimento de dados precisos durante consultas profissionais.

  Estrutura

    1 backend/
    2 ├── src/
    3 │   ├── config/        # Configurações de banco de dados e APIs externas
    4 │   ├── controllers/   # Lógica de recebimento de requisições e envio de respostas (C)
    5 │   ├── models/        # Definições de dados e esquemas (M)
    6 │   ├── routes/        # Definição dos endpoints da API
    7 │   ├── services/      # Lógica de negócio e integrações (ex: clima)
    8 │   ├── middlewares/   # Filtros de requisição (ex: autenticação)
    9 │   ├── utils/         # Helpers e funções utilitárias
   10 │   └── app.ts         # Inicialização do servidor Express
   11 ├── .env.example       # Exemplo de variáveis de ambiente
   12 ├── .gitignore         # Arquivos ignorados pelo Git
   13 ├── package.json       # Gerenciamento de dependências e scripts
   14 └── tsconfig.json      # Configuração do compilador TypeScript