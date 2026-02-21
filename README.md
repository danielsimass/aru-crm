# ARU CRM – Backend

<div align="center">
  <img src="assets/logo.png" alt="ARU CRM" width="280">
</div>

Backend da aplicação **ARU CRM**, voltada para um projeto de **basquete** e iniciativas **sociais** — gestão de atletas, usuários, autenticação e comunicação (e-mails, fila de jobs). Este repositório contém a API REST que serve o frontend e integra com banco de dados e serviços externos.

**Stack:** NestJS, TypeORM, PostgreSQL.

## Stack

- **Node.js**
- **NestJS** (Express)
- **TypeORM**
- **PostgreSQL**

Segurança: **Helmet** (headers), **Throttler** (rate limit), **CORS** restrito à origem do front.

## Arquitetura

- Módulos por feature (Users, Auth, Athletes, Dashboard, Mail, Jobs, Admin, etc.).
- **Controller → Service → Repository**; controllers finos, lógica nos services.
- TypeORM com repositórios; injeção de dependência via NestJS.
- Documentação em `/docs` (architecture, api-guidelines, security, testing, etc.).

## Setup

1. **Dependências:** `pnpm install`
2. **Variáveis de ambiente:** crie `.env` (veja seção abaixo).
3. **Migrações:** `pnpm run build && pnpm migration:run`
4. **Subir a API:** `pnpm start:dev` (ou `pnpm start` em produção).

### Variáveis de ambiente

| Variável           | Obrigatória | Descrição |
|--------------------|-------------|-----------|
| `DB_HOST`          | Não         | Host do Postgres (default: `localhost`) |
| `DB_PORT`          | Não         | Porta (default: `5432`) |
| `DB_DATABASE`       | Não         | Nome do banco (default: `aru_crm`) |
| `DB_USERNAME`      | Não         | Usuário (default: `aru`) |
| `DB_PASSWORD`      | Não         | Senha (default: `aru_secret`) |
| `DB_SSL`           | Não         | `true` para SSL |
| `DB_SYNCHRONIZE`   | Não         | `true` só em dev (não usar em produção) |
| `JWT_SECRET`       | **Sim**     | Segredo para assinatura dos JWTs |
| `FRONTEND_URL`     | **Sim** (prod) | URL do front (CORS e links em e-mails) |
| `NODE_ENV`         | Não         | `production` em produção |
| `PORT`             | Não         | Porta da API (default: `3000`) |

Para **e-mail** (SendGrid) e **jobs em background**, veja `docs/jobs-and-mail.md` (ex.: `SENDGRID_API_KEY`, `MAIL_DEFAULT_FROM`, `JOBS_WORKER_ENABLED`).

## Docker

- **Postgres + app:** `docker compose up --build`
- Env para Compose: use `.env`; opcionais com defaults: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `APP_PORT`, `POSTGRES_PORT`.
- Com `synchronize: false`, rode as migrações antes do primeiro uso (ex.: `pnpm run build && pnpm migration:run`).

## API e documentação

- **Docs interativos:** após subir a API, acesse `http://localhost:3000/docs` (Scalar).
- **Prefixo:** rotas sob `/v1` (ex.: `/v1/auth/login`, `/v1/users`).

## Auth e usuários

- **Login:** `POST /v1/auth/login` com `{ "email", "password" }` (público). JWT é enviado em cookie HttpOnly.
- **Logout:** `POST /v1/auth/logout` (limpa o cookie).
- **Usuários:** `GET/POST/PATCH/DELETE /v1/users` e `GET /v1/users/:id` exigem role ADMIN (JWT no cookie).

Rotas protegidas por padrão; use o decorator `@Public()` para rotas públicas.

## Segurança

- **Rate limit:** 20 requisições por minuto por IP (Throttler).
- **Headers:** Helmet aplicado globalmente.
- **CORS:** origem controlada por `FRONTEND_URL` (sem wildcard `*`).

## Jobs (fila) e e-mail

- Fila de jobs em Postgres (sem Redis); worker opcional.
- E-mail via SendGrid; templates Handlebars em `src/modules/mail/templates/`.
- Para habilitar o worker: `JOBS_WORKER_ENABLED=true` ou rodar com `--worker` (ex.: `node dist/main --worker`).

Detalhes em **`docs/jobs-and-mail.md`**.

## Banco de dados

- **DatabaseModule** configura TypeORM (global).
- Módulos que usam banco importam `DatabaseModule` e registram entidades com `TypeOrmModule.forFeature([Entity])`.
- Acesso via repositórios (`@InjectRepository(Entity)`).

## Regras de código

- Nenhuma lógica de negócio em controllers.
- Usar repositórios TypeORM via `@InjectRepository`.
- Importar `DatabaseModule` nos módulos que precisam de banco.
- Seguir convenções em `/docs` (api-guidelines, security-guidelines, nest-conventions, testing-guidelines, coding-standards).
