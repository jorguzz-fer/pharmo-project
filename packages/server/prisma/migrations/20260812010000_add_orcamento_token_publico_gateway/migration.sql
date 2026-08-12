-- Token da página pública do tutor (acesso sem login) e rastreio do gateway.
ALTER TABLE "orcamentos"
  ADD COLUMN "token_publico" TEXT,
  ADD COLUMN "gateway" TEXT,
  ADD COLUMN "gateway_ref" TEXT;

CREATE UNIQUE INDEX "orcamentos_token_publico_key" ON "orcamentos"("token_publico");

-- Orçamentos existentes recebem token para que seus links públicos funcionem.
UPDATE "orcamentos" SET "token_publico" = replace(gen_random_uuid()::text, '-', '')
WHERE "token_publico" IS NULL;
