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

## 📁 Estrutura do Projeto

```
retail-saas-monorepo/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # Angular App
├── libs/
│   └── shared/           # Código compartilhado
├── docker/               # Docker configs
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

# Iniciar desenvolvimento
npm run dev
```

### URLs
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api/v1
- **API Docs**: http://localhost:3000/api/docs

## 📝 Scripts Disponíveis

```bash
npm run dev              # Inicia backend e frontend
npm run dev:backend      # Apenas backend
npm run dev:frontend     # Apenas frontend
npm run build            # Build de produção
npm run migrate          # Rodar migrations
npm run seed             # Popular database
npm run docker:up        # Subir containers
npm run docker:down      # Parar containers
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

## 📦 Deployment

O projeto está configurado para deploy via Docker:

```bash
# Build das imagens
docker-compose build

# Subir em produção
docker-compose -f docker-compose.prod.yml up -d
```

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
