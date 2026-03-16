-- CreateTable
CREATE TABLE "bulario_magistral" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "linha_terapeutica" TEXT NOT NULL,
    "forma_farmaceutica" TEXT NOT NULL,
    "indicacao" TEXT NOT NULL,
    "diferencial" TEXT,
    "formula" TEXT NOT NULL,
    "modo_uso" TEXT NOT NULL,
    "especie" TEXT[],
    "observacoes" TEXT,
    "controlado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulario_magistral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bulario_magistral_codigo_key" ON "bulario_magistral"("codigo");

-- Create full-text search index for better performance
CREATE INDEX "bulario_magistral_search_idx" ON "bulario_magistral"
    USING GIN (to_tsvector('portuguese', nome || ' ' || indicacao || ' ' || COALESCE(observacoes, '') || ' ' || linha_terapeutica));
