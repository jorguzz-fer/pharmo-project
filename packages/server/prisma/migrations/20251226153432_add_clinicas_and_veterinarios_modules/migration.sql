/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `veterinarios` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ClinicaStatus" AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADA', 'SUSPENSA', 'INATIVA');

-- AlterTable
ALTER TABLE "prescricoes" ADD COLUMN     "clinica_id" TEXT;

-- AlterTable
ALTER TABLE "veterinarios" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "especialidades" TEXT[],
ADD COLUMN     "numero_crmv" TEXT,
ADD COLUMN     "uf_crmv" TEXT;

-- CreateTable
CREATE TABLE "clinicas" (
    "id" TEXT NOT NULL,
    "nome_fantasia" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "inscricao_estadual" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "responsavel_legal" TEXT NOT NULL,
    "cpf_responsavel" TEXT NOT NULL,
    "status" "ClinicaStatus" NOT NULL DEFAULT 'PENDENTE',
    "observacoes_internas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,

    CONSTRAINT "clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica_documentos" (
    "id" TEXT NOT NULL,
    "clinica_id" TEXT NOT NULL,
    "tipo_documento" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "url_arquivo" TEXT NOT NULL,
    "mime_type" TEXT,
    "tamanho_bytes" INTEGER,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinica_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica_veterinario" (
    "id" TEXT NOT NULL,
    "clinica_id" TEXT NOT NULL,
    "veterinario_id" TEXT NOT NULL,
    "cargo" TEXT DEFAULT 'Veterinário',
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinica_veterinario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT,
    "template" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinicas_cnpj_key" ON "clinicas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "clinica_veterinario_clinica_id_veterinario_id_key" ON "clinica_veterinario"("clinica_id", "veterinario_id");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarios_cpf_key" ON "veterinarios"("cpf");

-- AddForeignKey
ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "clinicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_documentos" ADD CONSTRAINT "clinica_documentos_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_veterinario" ADD CONSTRAINT "clinica_veterinario_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_veterinario" ADD CONSTRAINT "clinica_veterinario_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "veterinarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
