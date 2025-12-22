-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'FINANCIAL');

-- CreateEnum
CREATE TYPE "VetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "PrescricaoStatus" AS ENUM ('DRAFT', 'SIGNED', 'SENT');

-- CreateEnum
CREATE TYPE "PagamentoStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PedidoStatus" AS ENUM ('AGUARDANDO_PAGAMENTO', 'PAGAMENTO_CONFIRMADO', 'EM_PRODUCAO', 'PRONTO_ENTREGA', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD');

-- CreateTable
CREATE TABLE "veterinarios" (
    "id" TEXT NOT NULL,
    "crv" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "especialidade" TEXT,
    "status" "VetStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veterinarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animais" (
    "id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "raca" TEXT,
    "peso" DOUBLE PRECISION,
    "data_nascimento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulario" (
    "id" TEXT NOT NULL,
    "doenca" TEXT NOT NULL,
    "principio_ativo" TEXT NOT NULL,
    "concentracao" TEXT NOT NULL,
    "posologia" TEXT NOT NULL,
    "contraindicacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescricoes" (
    "id" TEXT NOT NULL,
    "veterinario_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "doenca" TEXT,
    "medicamento" TEXT NOT NULL,
    "dosagem" TEXT NOT NULL,
    "forma_farmaceutica" TEXT NOT NULL,
    "quantidade" TEXT NOT NULL,
    "observacoes" TEXT,
    "status" "PrescricaoStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" TEXT NOT NULL,
    "prescricao_id" TEXT NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "status_pagamento" "PagamentoStatus" NOT NULL DEFAULT 'PENDING',
    "link_pagamento" TEXT,
    "data_pagamento" TIMESTAMP(3),
    "metodo_pagamento" "MetodoPagamento",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversas_ia" (
    "id" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "tipo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversas_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "orcamento_id" TEXT NOT NULL,
    "status_producao" "PedidoStatus" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "data_producao" TIMESTAMP(3),
    "data_entrega" TIMESTAMP(3),
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_admin" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "veterinarios_crv_key" ON "veterinarios"("crv");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarios_email_key" ON "veterinarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tutores_cpf_key" ON "tutores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_prescricao_id_key" ON "orcamentos"("prescricao_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_orcamento_id_key" ON "pedidos"("orcamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_admin_email_key" ON "usuarios_admin"("email");

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "veterinarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_prescricao_id_fkey" FOREIGN KEY ("prescricao_id") REFERENCES "prescricoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

