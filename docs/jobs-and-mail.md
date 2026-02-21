# Jobs (fila) e Mail

## Visão geral

- **Jobs**: fila genérica em Postgres (sem Redis/Bull). Lock seguro com `SELECT ... FOR UPDATE SKIP LOCKED`.
- **Mail**: envio de e-mails via SendGrid; templates em Handlebars (`.hbs`).
- **Primeiro job**: `EMAIL_SEND` — enfileira envio de e-mail por template (ex.: WELCOME).

## Dependências

Já incluídas no `package.json`:

- `@nestjs/config` — configuração (env)
- `@sendgrid/mail` — cliente SendGrid
- `handlebars` — renderização de templates

Instalar:

```bash
pnpm install
```

## Variáveis de ambiente

```env
# SendGrid
SENDGRID_API_KEY=SG.xxx
MAIL_DEFAULT_FROM=noreply@seudominio.com

# Frontend URL (para links nos templates de e-mail)
FRONTEND_URL=https://app.seudominio.com

# Jobs worker (opcional)
JOBS_WORKER_ENABLED=false
JOBS_WORKER_CONCURRENCY=1
JOBS_WORKER_POLL_MS=2000
JOBS_WORKER_BATCH_SIZE=10
JOBS_WORKER_LOCK_TTL_SECONDS=300
```

- **SENDGRID_API_KEY**: obrigatório para envio real. Se vazio, o provider só loga (no-op).
- **MAIL_DEFAULT_FROM**: remetente padrão (deve ser um domínio verificado no SendGrid).
- **FRONTEND_URL**: URL do frontend (ex: `https://app.seudominio.com`). Usada para construir links nos templates. Se não definida, usa `http://localhost:3001` como padrão.
- **JOBS_WORKER_ENABLED**: `true` para o processo da API também rodar o worker (útil em VM única).
- **JOBS_WORKER_CONCURRENCY**: quantos jobs processar em paralelo por ciclo.
- **JOBS_WORKER_POLL_MS**: intervalo de polling (ms).
- **JOBS_WORKER_BATCH_SIZE**: tamanho do lote por reserva.
- **JOBS_WORKER_LOCK_TTL_SECONDS**: jobs em PROCESSING há mais que isso voltam para PENDING (reaper).

## Migration

Criar a tabela `jobs`:

```bash
pnpm run migration:run
```

## Rodar a API

```bash
pnpm run start:dev
# ou
pnpm run build && pnpm run start:prod
```

A API sobe normalmente (controllers, POST /admin/test-email, etc.).

## Rodar o worker

**Opção A — mesmo processo da API**

Defina no ambiente:

```bash
JOBS_WORKER_ENABLED=true pnpm run start:dev
```

**Opção B — processo separado (recomendado em produção)**

```bash
pnpm run build
node --env-file=.env dist/main.js --worker
```

O flag `--worker` faz `JOBS_WORKER_ENABLED=true` internamente; o processo só inicia o worker (e o mínimo necessário do Nest para DI).

## Endpoint de teste

- **POST /admin/test-email** (requer auth; role ADMIN).

Body (JSON):

```json
{
  "email": "destino@example.com",
  "name": "Nome do Usuário",
  "locale": "pt-BR",
  "setPasswordUrl": "https://app.example.com/set-password?token=xxx"
}
```

Resposta:

```json
{
  "jobId": "uuid-do-job",
  "status": "PENDING"
}
```

O job será processado pelo worker (se estiver ativo) e o e-mail será enviado com o template WELCOME.

## Enfileirar EMAIL_SEND de outro módulo

Importe `JobsModule` e use `JobsService`:

```ts
// Exemplo: construir URL usando FRONTEND_URL do ConfigService
const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');
const setPasswordUrl = `${frontendUrl}/auth/set-password?token=${token}`;

await this.jobsService.enqueue(JobType.EMAIL_SEND, {
  recipient: { kind: 'USER', id: user.id, email: user.email, name: user.name },
  template: { key: 'WELCOME', locale: 'pt-BR' },
  data: { 
    name: user.name, 
    setPasswordUrl, // ou use frontendUrl diretamente no template
  },
  meta: { correlationId: '...' },
});
```

**Nota**: A variável `frontendUrl` é automaticamente injetada nos dados do template pelo `MailService`. Você pode usar `{{frontendUrl}}` diretamente nos templates Handlebars para construir URLs:

```handlebars
<a href="{{frontendUrl}}/auth/set-password?token={{token}}">Criar senha</a>
```

Com idempotência (dedupeKey):

```ts
await this.jobsService.enqueue(JobType.EMAIL_SEND, payload, {
  dedupeKey: `welcome:${user.id}`,
  maxAttempts: 5,
});
```

## Arquivos criados/alterados

- `src/modules/mail/mail.module.ts`
- `src/modules/mail/mail.service.ts`
- `src/modules/mail/mail.provider.ts`
- `src/modules/mail/templates/welcome.hbs`
- `src/modules/jobs/jobs.module.ts`
- `src/modules/jobs/jobs.entity.ts`
- `src/modules/jobs/jobs.types.ts`
- `src/modules/jobs/jobs.repository.ts`
- `src/modules/jobs/jobs.service.ts`
- `src/modules/jobs/jobs.worker.ts`
- `src/modules/jobs/jobs.config.ts`
- `src/modules/jobs/handlers/index.ts`
- `src/modules/jobs/handlers/email-send.handler.ts`
- `src/modules/admin/admin.module.ts`
- `src/modules/admin/admin.controller.ts`
- `src/modules/admin/dto/test-email.dto.ts`
- `src/modules/database/typeorm/migrations/1771362000000-CreateJobsTable.ts`
- `src/app.module.ts` (ConfigModule, MailModule, JobsModule, AdminModule)
- `src/main.ts` (flag --worker)
- `package.json` (deps: @nestjs/config, @sendgrid/mail, handlebars)
