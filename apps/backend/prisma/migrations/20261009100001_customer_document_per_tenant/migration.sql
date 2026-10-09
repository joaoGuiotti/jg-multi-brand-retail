-- =============================================================================
-- Fase 1.1 — Customer.document: unicidade POR TENANT e documento opcional
--
-- Problema: `document` era UNIQUE global e NOT NULL DEFAULT '' => o mesmo CPF/CNPJ
-- não podia existir em dois tenants e só UM cliente podia ficar sem documento.
--
-- Estratégia (não destrutiva):
--   1. remover o unique global antigo e o DEFAULT/NOT NULL;
--   2. converter '' em NULL e normalizar (apenas dígitos) — o valor original só é
--      perdido quando era vazio ou continha máscara (a máscara não é informação);
--   3. DIAGNÓSTICO: se a normalização gerar duplicidade dentro do mesmo tenant, a
--      migration ABORTA com o relatório (nada é apagado/alterado automaticamente);
--   4. criar UNIQUE (tenant_id, document). NULLs são distintos => vários clientes
--      sem documento por tenant.
-- =============================================================================

-- 1. Remove unicidade global e relaxa a coluna
DROP INDEX IF EXISTS "customers_document_key";
ALTER TABLE "customers" ALTER COLUMN "document" DROP DEFAULT;
ALTER TABLE "customers" ALTER COLUMN "document" DROP NOT NULL;

-- 2. '' => NULL e normalização para somente dígitos
UPDATE "customers" SET "document" = NULL WHERE "document" = '';
UPDATE "customers"
   SET "document" = NULLIF(regexp_replace("document", '\D', '', 'g'), '')
 WHERE "document" IS NOT NULL AND "document" ~ '\D';

-- 3. Diagnóstico de duplicidade intra-tenant (aborta com relatório; não apaga nada)
DO $$
DECLARE
  dup RECORD;
  report TEXT := '';
BEGIN
  FOR dup IN
    SELECT tenant_id, document, count(*) AS qty, string_agg(id, ', ') AS ids
      FROM "customers"
     WHERE "document" IS NOT NULL
     GROUP BY tenant_id, document
    HAVING count(*) > 1
  LOOP
    report := report || format(E'\n  tenant=%s document=%s qty=%s ids=[%s]',
                               dup.tenant_id, dup.document, dup.qty, dup.ids);
  END LOOP;

  IF report <> '' THEN
    RAISE EXCEPTION 'customers.document: duplicidade dentro do mesmo tenant. Resolva manualmente e reaplique:%', report;
  END IF;
END $$;

-- 4. Unicidade por tenant
CREATE UNIQUE INDEX "customers_tenant_id_document_key" ON "customers"("tenant_id", "document");
