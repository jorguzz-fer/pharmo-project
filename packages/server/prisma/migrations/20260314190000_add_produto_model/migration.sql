-- CreateTable
CREATE TABLE IF NOT EXISTS "produtos" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco_sugestao" DECIMAL(10,2) NOT NULL,
    "preco_tabela" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "produtos_codigo_key" ON "produtos"("codigo");
