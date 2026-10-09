-- =============================================================================
-- Fase 1.4 — Autenticação: estruturas de dados
--   * tabela refresh_tokens (token opaco guardado apenas como hash SHA-256)
--   * users: failed_login_attempts, locked_until, last_login_at, two_fa_enabled,
--            two_fa_backup_codes (somente hashes)
--
-- Migração de dados do two_fa_secret: a cifra AES-256-GCM exige a chave da aplicação
-- (env TWO_FA_ENCRYPTION_KEY), que NÃO é conhecida pelo banco. Por isso a cifragem
-- dos valores já existentes é feita por script idempotente da aplicação:
--   apps/backend/prisma/scripts/encrypt-two-fa-secrets.ts
-- (executado pelo serviço `migrate` logo após `prisma migrate deploy`; valores já
-- cifrados têm o prefixo `v1:` e são ignorados).
-- =============================================================================

-- users ------------------------------------------------------------------------
ALTER TABLE "users"
  ADD COLUMN "two_fa_enabled"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "two_fa_backup_codes"   TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until"          TIMESTAMPTZ(3),
  ADD COLUMN "last_login_at"         TIMESTAMPTZ(3);

-- refresh_tokens ---------------------------------------------------------------
CREATE TABLE "refresh_tokens" (
    "id"                   TEXT NOT NULL,
    "tenant_id"            TEXT NOT NULL,
    "user_id"              TEXT NOT NULL,
    "token_hash"           TEXT NOT NULL,
    "family_id"            TEXT NOT NULL,
    "expires_at"           TIMESTAMPTZ(3) NOT NULL,
    "revoked_at"           TIMESTAMPTZ(3),
    "replaced_by_token_id" TEXT,
    "user_agent"           TEXT,
    "ip"                   TEXT,
    "created_at"           TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_tenant_id_idx" ON "refresh_tokens"("tenant_id");
CREATE INDEX "refresh_tokens_user_id_idx"   ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- FK composta: o token só pode apontar para um usuário DO MESMO tenant.
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_tenant_id_user_id_fkey"
  FOREIGN KEY ("tenant_id", "user_id") REFERENCES "users"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
