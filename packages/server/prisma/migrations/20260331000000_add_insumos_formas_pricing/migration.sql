-- =============================================
-- Phase 1: Insumos Farmacêuticos (princípios ativos com precificação)
-- =============================================
CREATE TABLE "insumos_farmaceuticos" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "codigo_interno" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor_custo" DECIMAL(10,5) NOT NULL,
    "custo_referencia" DECIMAL(10,5) NOT NULL,
    "markup" DECIMAL(10,2) NOT NULL,
    "un_manipulacao" TEXT NOT NULL,
    "estoque" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "calculo_tipo" TEXT NOT NULL DEFAULT 'Cápsula',
    "controlado" BOOLEAN NOT NULL DEFAULT false,
    "lista_controle" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "insumos_farmaceuticos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "insumos_farmaceuticos_codigo_interno_key" ON "insumos_farmaceuticos"("codigo_interno");

-- =============================================
-- Phase 2: Formas Farmacêuticas
-- =============================================
CREATE TABLE "formas_farmaceuticas" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "formas_farmaceuticas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "formas_farmaceuticas_nome_key" ON "formas_farmaceuticas"("nome");

-- =============================================
-- Regras de Exceção (insumo × forma)
-- =============================================
CREATE TABLE "regras_excecao" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "insumo_farmaceutico_id" TEXT NOT NULL,
    "forma_farmaceutica_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "regras_excecao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "regras_excecao_insumo_farmaceutico_id_fkey" FOREIGN KEY ("insumo_farmaceutico_id") REFERENCES "insumos_farmaceuticos"("id") ON DELETE CASCADE,
    CONSTRAINT "regras_excecao_forma_farmaceutica_id_fkey" FOREIGN KEY ("forma_farmaceutica_id") REFERENCES "formas_farmaceuticas"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "regras_excecao_insumo_farmaceutico_id_forma_farmaceutica_id_key"
    ON "regras_excecao"("insumo_farmaceutico_id", "forma_farmaceutica_id");

-- =============================================
-- Phase 4: Campos comerciais na Clínica
-- =============================================
ALTER TABLE "clinicas"
    ADD COLUMN IF NOT EXISTS "taxa_manipulacao"   DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "custo_embalagens"   DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "desconto_parceiro"  DECIMAL(5,4),
    ADD COLUMN IF NOT EXISTS "adicional_entrega"  DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS "adicional_biscoito" DECIMAL(10,2);
