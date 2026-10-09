# Retail SaaS - Multi-Brand Platform

Sistema ERP leve para varejo multi-lojas (multi-brand) com isolamento total de dados por tenant.

## 🚀 Stack Tecnológico

### Frontend
- **Angular 17+** com Standalone Components
- **Tailwind CSS** para estilização
- **Angular Signals** para state management

### Backend
- **NestJS** com TypeScript
- **Prisma ORM** + PostgreSQL
- **JWT** + Refresh Token para autenticação
- **Redis** para cache
- **BullMQ** para background jobs

### DevOps
- **Docker** + Docker Compose
- **GitHub Actions** para CI/CD

## 📁 Estrutura do Projeto (Nx Monorepo)

```
retail-saas-monorepo/
├── apps/
│   ├── backend/          # NestJS API (project.json)
│   └── frontend/         # Angular App (project.json)
├── libs/
│   └── ui/               # Biblioteca compartilhada de UI Angular (project.json)
├── .github/workflows/    # Pipelines de CI/CD com Nx cache
├── nx.json               # Configuração global do workspace Nx
├── tsconfig.base.json    # TypeScript paths (@shared/ui)
├── docker-compose.prod.yml
├── docker-compose.yml
└── package.json
```

## 🏃 Quick Start

### Pré-requisitos
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker e Docker Compose (opcional)

### Setup com Docker

```bash
# Instalar dependências
npm install

# Subir serviços (PostgreSQL + Redis)
npm run docker:up

# Rodar migrations
npm run migrate

# Seed database (dados de teste)
npm run seed

# Iniciar desenvolvimento unificado
npm start
```

### URLs
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api/v1
- **API Docs**: http://localhost:3000/api/docs

## 📝 Scripts & Comandos Nx Disponíveis

```bash
# Desenvolvimento
npm start                    # Inicia backend e frontend simultaneamente
npm run dev:backend          # Inicia apenas o backend (nx serve backend)
npm run dev:frontend         # Inicia apenas o frontend (nx serve frontend)

# Build & Testes Unificados via Nx
npm run build                # Compila todos os projetos (nx run-many -t build)
npm run test                 # Roda testes em todos os projetos (nx run-many -t test)
npm run lint                 # Executa linter em todos os projetos (nx run-many -t lint)
npm run graph                # Abre o visualizador do grafo de dependências do Nx

# Execução por Projeto
npx nx build backend         # Compila apenas o backend
npx nx build frontend        # Compila apenas o frontend
npx nx test backend          # Roda testes do backend
npx nx test frontend         # Roda testes do frontend

# Banco de Dados & Infraestrutura
npm run migrate              # Aplica migrations do Prisma
npm run seed                 # Popula o banco com seed idempotente
npm run docker:up            # Sobe containers de infraestrutura local
npm run docker:down          # Para containers
```

## 🗄️ Database

O projeto usa PostgreSQL com Prisma ORM. Schema em `apps/backend/prisma/schema.prisma`.

### Migrations

```bash
# Criar nova migration
cd apps/backend
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations
npm run migrate

# Reset database (CUIDADO!)
cd apps/backend
npx prisma migrate reset
```

## 🔐 Autenticação

O sistema utiliza JWT + Refresh Token com três níveis de acesso:

- **SUPER_ADMIN**: Gerencia todos os tenants (cross-tenant)
- **ADMIN**: Administrador de uma loja específica
- **USER**: Usuário operador (vendedor)

## 🏢 Multi-Tenancy

Cada tenant (loja/marca) possui isolamento completo de dados via:
- `tenant_id` em todas as tabelas
- Row Level Security (RLS) no PostgreSQL
- Middleware de validação de tenant

## 📚 Documentação

- [Especificação Técnica Completa](../brain/c9ab1f8e-9910-4e97-83f7-4a362a1502b5/README.md)
- [Arquitetura](../brain/c9ab1f8e-9910-4e97-83f7-4a362a1502b5/01_architecture.md)
- [Database Schema](../brain/c9ab1f8e-9910-4e97-83f7-4a362a1502b5/02_database_schema.md)
- [API Endpoints](../brain/c9ab1f8e-9910-4e97-83f7-4a362a1502b5/05_api_endpoints.md)

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📦 Deployment & Infraestrutura de Produção

O projeto está configurado para deploy via Docker com isolamento estrito de redes (*tier isolation*), separação de privilégios de banco e backup automatizado:

### 1. Configuração de Variáveis de Ambiente
Copie o template de produção e configure as credenciais:
```bash
cp .env.prod.example .env.prod
```
* **Aplicação (`DB_USER=retail_app`)**: conecta com privilégios restritos (DML apenas) e sem `BYPASSRLS`, forçando isolamento multi-tenant real por Row-Level Security.
* **Migrações (`MIGRATION_DB_USER=postgres`)**: papel com privilégios DDL e `BYPASSRLS` utilizado estritamente pelo container `migrate` do Prisma.

### 2. Executando o Stack de Produção
```bash
# Subir todo o stack de produção (DB, Redis, Migrate, Backend, Frontend e Backup)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```
* **Redes Isoladas**: `frontend_net` (Nginx <-> Backend) e `backend_net` (Backend <-> PostgreSQL/Redis, com `internal: true`).
* **Healthchecks**: Backend monitora `/health` e PostgreSQL via `pg_isready`.
* **Resource Limits**: Limites de CPU e memória configurados em todos os serviços.

### 3. Estratégia de Backup & Restore Criptografado (AES-256)
Os scripts em `scripts/backup/` executam dumps consistentes, criptografia OpenSSL e retenção:

```bash
# Executar backup manual
./scripts/backup/backup.sh

# Validar integridade do dump criptografado sem alterar dados (dry-run)
./scripts/backup/restore.sh --file ./backups/retail_retail_saas_YYYYMMDD_HHMMSS.dump.enc --dry-run

# Restaurar banco a partir de um backup criptografado
./scripts/backup/restore.sh --file ./backups/retail_retail_saas_YYYYMMDD_HHMMSS.dump.enc --target-db retail_saas
```
* No compose de produção, o container `backup` executa diariamente às 03:00 UTC via crontab com rotação de retenção configurável (`BACKUP_RETENTION_DAYS=7`).

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Proprietary - Todos os direitos reservados

## 👥 Time

Desenvolvido por João Guiotti
