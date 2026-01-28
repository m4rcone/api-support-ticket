# 🎫 Support Ticket API

API REST para gerenciamento de tickets de suporte, com autenticação, controle de acesso por papel, comentários, histórico de status e regras de negócio realistas.

Projeto desenvolvido com foco em **boas práticas de backend**, **arquitetura modular**, **testes E2E completos** e **segurança**.

---

## 📌 Visão Geral

Esta API permite que usuários criem tickets de suporte, acompanhem seu andamento, adicionem comentários e que administradores façam a gestão completa dos tickets e dos papéis de usuários.

O sistema implementa **RBAC (Role-Based Access Control)** com três papéis:

- **CUSTOMER** – cria e acompanha seus próprios tickets
- **AGENT** – atua nos tickets atribuídos a ele
- **ADMIN** – possui acesso total ao sistema

---

## 🧱 Arquitetura

- **Framework:** NestJS
- **Banco de dados:** PostgreSQL
- **Migrations:** node-pg-migrate
- **Autenticação:** JWT via **cookie HttpOnly**
- **Documentação:** OpenAPI (Swagger)
- **Testes:** Jest + Supertest (E2E)

Arquitetura modular, com separação clara entre:

- Controllers (camada HTTP)
- Services (regras de negócio)
- Repositories (acesso a dados)
- DTOs / Mappers
- Infra (database, crypto, errors)
- Error handling centralizado

---

## 🔐 Autenticação e Segurança

- Login via `POST /api/v1/auth/login`
- JWT armazenado em **cookie HttpOnly**
- Nenhum token é exposto ao frontend via JavaScript
- Proteção contra acesso não autorizado

---

## 👥 Usuários e Papéis

### Criação de usuários

- Endpoint público
- Validações completas (email, senha, duplicidade, etc.)

### Administração de papéis

- Apenas **ADMIN** pode alterar papéis
- Regra crítica:
  - ❌ não é permitido remover o papel do **último ADMIN** do sistema

---

## 🎟️ Tickets

### Criação

- Usuários autenticados criam tickets
- Campos obrigatórios validados

### Listagem

`GET /tickets`

Comportamento por papel:

- **CUSTOMER** → apenas tickets criados por ele
- **AGENT** → apenas tickets atribuídos a ele
- **ADMIN** → todos os tickets

Suporte a:

- filtros (`status`, `tag`)
- paginação (`limit`, `offset`)

### Consulta por ID

- Restrições de acesso baseadas no papel e relacionamento com o ticket

---

## 🔄 Status do Ticket

Estados possíveis:

- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`

### Regras de transição

- **CUSTOMER:** pode fechar e reabrir seus próprios tickets (OPEN → CLOSED, RESOLVED → OPEN)
- **AGENT:** pode avançar o fluxo de tickets atribuídos (OPEN → IN_PROGRESS → RESOLVED)
- **ADMIN:** pode alterar qualquer ticket

Transições inválidas são bloqueadas com erro.

---

## 🕒 Histórico de Status

- Toda mudança de status gera um registro em `ticket_status_history`
- Endpoint:
  - `GET /tickets/:id/status-history`
- Controle de acesso igual ao ticket
- Permite auditoria completa do ciclo de vida do ticket

---

## 💬 Comentários

### Adicionar comentário

`POST /tickets/:id/comments`

Regras de acesso:

- **CUSTOMER** → apenas no próprio ticket
- **AGENT** → apenas em ticket atribuído
- **ADMIN** → qualquer ticket

### Listar comentários

`GET /tickets/:id/comments`

- Ordenados por data de criação
- Retorna lista vazia quando não houver comentários
- Ticket inexistente retorna **404**

---

## 🧪 Testes

O projeto possui **cobertura E2E completa**, validando:

- Autenticação
- Controle de acesso por papel
- Regras de negócio
- Casos de erro
- Fluxos reais de uso

Exemplos de testes implementados:

- Criação de usuários com validações
- Login com validações
- Criação e listagem de tickets
- Atribuição de tickets
- Atualização de status com regras
- Histórico de status
- Comentários (criação e listagem)
- Proteções contra acesso indevido

São `82` testes E2E no total.

Todos os testes passam isoladamente com banco limpo a cada execução.

Possui um `orchestrator` para gerenciar o banco de dados e facilitar a escrita dos testes.

---

## 📖 Documentação da API (Swagger)

A API é documentada via OpenAPI.

Após subir o projeto, acesse: `http://localhost:3000/`

É possível:

- Fazer login pelo Swagger
- Testar endpoints protegidos (cookie é reutilizado automaticamente)
- Visualizar contratos de request/response

**Importante:** rodar o script `db:seed:admin` para criar um usuário **ADMIN** inicial e conseguir acessar os endpoints protegidos.

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- Node.js
- Docker + Docker Compose

### Subir o projeto

```bash
git clone https://github.com/m4rcone/api-support-ticket.git
cd api-support-ticket

cp .env.example .env # ajuste as variáveis de ambiente conforme necessário

npm install
npm run start:dev
```

O script `start:dev` irá subir o serviço `Postgres`, aplicar migrations e rodar o servidor em modo `--watch`.

### Testes E2E

```bash
npm run test:watch
npm run test
```

Recomendo rodar em modo `--watch` para obter detalhe dos testes.

O script `test` está preparado para rodar em CI/CD.

## 🧠 Objetivo do Projeto

Este projeto foi desenvolvido com foco em:

- Demonstrar domínio de backend moderno
- Aplicar boas práticas de mercado
- Servir como projeto de portfólio
- Simular um sistema de suporte funcional e auditável
