# 🎫 Support Ticket API

API REST para sistema de gerenciamento de tickets de suporte, desenvolvida com NestJS, TypeScript e PostgreSQL.

## 📋 Sobre o Projeto

Sistema completo de gerenciamento de tickets de suporte com autenticação JWT, autorização baseada em roles (RBAC) e funcionalidades específicas para diferentes tipos de usuários.

### Funcionalidades Principais

- ✅ **Autenticação JWT** com cookies HTTP-only
- 👥 **3 tipos de usuários**: Customer, Agent, Admin
- 🎫 **Gestão completa de tickets** (criar, listar, atribuir, filtrar)
- 🔐 **Autorização baseada em roles** (RBAC)
- 🏷️ **Tags e status de tickets** (Bug, Feature, Question, Improvement)
- 📊 **Health check** da aplicação
- 🔒 **Segurança**: bcrypt para senhas, validação de dados, proteção contra ataques

### Roles e Permissões

| Role     | Permissões                                                  |
| -------- | ----------------------------------------------------------- |
| CUSTOMER | Criar tickets, visualizar seus próprios tickets             |
| AGENT    | Visualizar tickets atribuídos, atualizar status             |
| ADMIN    | Todas as permissões + atribuir tickets + gerenciar usuários |

## 🚀 Tecnologias

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[TypeScript](https://www.typescriptlang.org/)** - Linguagem tipada
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[Passport JWT](https://www.passportjs.org/)** - Autenticação
- **[node-pg-migrate](https://salsita.github.io/node-pg-migrate/)** - Migrations
- **[Jest](https://jestjs.io/)** - Testes E2E
- **[Docker Compose](https://docs.docker.com/compose/)** - Containerização

## 📁 Estrutura do Projeto

```
api-support-ticket/
├── src/
│   ├── admin/                   # Módulo de administração
│   ├── auth/                    # Autenticação e autorização
│   ├── infra/                   # Infraestrutura
│   │   ├── crypto/              # Hashing de senhas
│   │   ├── database/            # Database service e migrations
│   │   └── scripts/             # Scripts utilitários
│   ├── status/                  # Health check
│   ├── tickets/                 # Gestão de tickets
│   ├── users/                   # Gestão de usuários
│   ├── app.module.ts
│   └── main.ts
├── tests/
│   ├── api/v1/                  # Testes E2E por endpoint
│   └── utils/                   # Helpers de teste
├── compose.yaml                 # Docker Compose config
└── package.json
```

## 🛠️ Instalação

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn

### Setup

1. **Clone o repositório**

```bash
git clone <repository-url>
cd api-support-ticket
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=local_user
POSTGRES_DB=local_db
POSTGRES_PASSWORD=local_password
DATABASE_URL=postgres://local_user:local_password@localhost:5432/local_db

JWT_SECRET=jwt_secret_key

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

4. **Inicie os serviços (PostgreSQL)**

```bash
npm run services:up
```

5. **Execute as migrations**

```bash
npm run migrations:up
```

6. **Seed do usuário admin (opcional)**

```bash
npm run db:seed:admin
```

## 🏃 Executando a Aplicação

### Desenvolvimento

```bash
npm run start:dev
```

A aplicação estará disponível em `http://localhost:3000`

### Produção

```bash
npm run build
npm run start
```

## 🧪 Testes

### Executar todos os testes E2E

```bash
npm test
```

### Modo watch (desenvolvimento)

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:cov
```

## 📡 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Autenticação

| Método | Endpoint      | Descrição        | Auth Required |
| ------ | ------------- | ---------------- | ------------- |
| POST   | `/auth/login` | Login de usuário | ❌            |

### Usuários

| Método | Endpoint | Descrição          | Auth Required | Roles |
| ------ | -------- | ------------------ | ------------- | ----- |
| POST   | `/users` | Criar novo usuário | ❌            | -     |

### Tickets

| Método | Endpoint       | Descrição            | Auth Required | Roles |
| ------ | -------------- | -------------------- | ------------- | ----- |
| GET    | `/tickets`     | Listar tickets       | ✅            | All   |
| POST   | `/tickets`     | Criar ticket         | ✅            | All   |
| GET    | `/tickets/:id` | Buscar ticket por ID | ✅            | All   |

### Admin

| Método | Endpoint                    | Descrição                 | Auth Required | Roles |
| ------ | --------------------------- | ------------------------- | ------------- | ----- |
| PATCH  | `/admin/tickets/:id/assign` | Atribuir ticket a agente  | ✅            | ADMIN |
| PATCH  | `/admin/users/:id/role`     | Atualizar role de usuário | ✅            | ADMIN |

### Status

| Método | Endpoint  | Descrição    | Auth Required |
| ------ | --------- | ------------ | ------------- |
| GET    | `/status` | Health check | ❌            |

## 🗄️ Database Scripts

### Criar nova migration

```bash
npm run migrations:create <nome-da-migration>
```

### Executar migrations

```bash
npm run migrations:up
```

### Gerenciar serviços Docker

```bash
# Iniciar PostgreSQL
npm run services:up

# Parar serviços
npm run services:stop

# Remover containers
npm run services:down
```

## 🔧 Scripts Disponíveis

| Script                  | Descrição                          |
| ----------------------- | ---------------------------------- |
| `npm run start:dev`     | Inicia app em modo desenvolvimento |
| `npm run build`         | Build da aplicação                 |
| `npm test`              | Executa testes E2E                 |
| `npm run test:watch`    | Executa testes em modo watch       |
| `npm run format`        | Formata código com Prettier        |
| `npm run lint`          | Lint e correção com ESLint         |
| `npm run db:seed:admin` | Cria usuário admin no banco        |

## 🏗️ Arquitetura

### Padrões Utilizados

- **Modular Architecture** - Separação por features/domínios
- **Repository Pattern** - Abstração da camada de dados
- **DTO Pattern** - Validação e transformação de dados
- **Guard Pattern** - Autenticação e autorização
- **Mapper Pattern** - Conversão entre tipos de dados

### Validação e Segurança

- ✅ **class-validator** - Validação de DTOs
- ✅ **class-transformer** - Transformação de dados
- ✅ **bcryptjs** - Hash seguro de senhas
- ✅ **Passport JWT** - Tokens seguros
- ✅ **Cookie HTTP-only** - Proteção contra XSS
- ✅ **Global Error Handler** - Tratamento centralizado de erros

## 📝 Exemplos de Uso

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Criar Ticket

```bash
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=<seu-token>" \
  -d '{
    "title": "Bug no sistema",
    "description": "Descrição detalhada do problema",
    "tag": "BUG"
  }'
```

### Listar Tickets com Filtros

```bash
curl "http://localhost:3000/api/v1/tickets?status=OPEN&tag=BUG&page=1&perPage=10" \
  -H "Cookie: access_token=<seu-token>"
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença UNLICENSED - veja o arquivo LICENSE para detalhes.

## 👤 Autor

Desenvolvido com ❤️ por [Seu Nome]

---

⭐ Se este projeto foi útil, considere dar uma estrela!
