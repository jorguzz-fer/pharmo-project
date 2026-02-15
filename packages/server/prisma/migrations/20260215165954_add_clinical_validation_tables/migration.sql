-- CreateTable
CREATE TABLE "principios_ativos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nome_cientifico" TEXT,
    "classe_terapeutica" TEXT,
    "controlado" BOOLEAN NOT NULL DEFAULT false,
    "texto_palatavel" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "principios_ativos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concentracoes" (
    "id" TEXT NOT NULL,
    "principio_ativo_id" TEXT NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "unidade" TEXT NOT NULL,
    "forma_farmaceutica" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concentracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranges_terapeuticos" (
    "id" TEXT NOT NULL,
    "principio_ativo_id" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "peso_min_kg" DECIMAL(6,2),
    "peso_max_kg" DECIMAL(6,2),
    "dose_min_mg_kg" DECIMAL(10,4) NOT NULL,
    "dose_max_mg_kg" DECIMAL(10,4) NOT NULL,
    "frequencia_horas" INTEGER,
    "duracao_max_dias" INTEGER,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranges_terapeuticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocolos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "indicacao" TEXT,
    "especie" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocolos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocolo_itens" (
    "id" TEXT NOT NULL,
    "protocolo_id" TEXT NOT NULL,
    "principio_ativo_id" TEXT NOT NULL,
    "dosagem_mg_kg" DECIMAL(10,4) NOT NULL,
    "frequencia_horas" INTEGER NOT NULL,
    "duracao_dias" INTEGER NOT NULL,
    "forma_farmaceutica" TEXT,
    "observacoes" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "protocolo_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_ciencia" (
    "id" TEXT NOT NULL,
    "prescricao_id" TEXT NOT NULL,
    "veterinario_id" TEXT NOT NULL,
    "principio_ativo_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "dosagem_prescrita_mg_kg" DECIMAL(10,4) NOT NULL,
    "peso_animal_kg" DECIMAL(6,2) NOT NULL,
    "dose_total_mg" DECIMAL(10,2) NOT NULL,
    "dose_min_esperada_mg_kg" DECIMAL(10,4) NOT NULL,
    "dose_max_esperada_mg_kg" DECIMAL(10,4) NOT NULL,
    "motivo" TEXT NOT NULL,
    "aceite_veterinario" BOOLEAN NOT NULL DEFAULT true,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_ciencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "principios_ativos_nome_key" ON "principios_ativos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "concentracoes_principio_ativo_id_valor_unidade_forma_farmac_key" ON "concentracoes"("principio_ativo_id", "valor", "unidade", "forma_farmaceutica");

-- CreateIndex
CREATE INDEX "ranges_terapeuticos_principio_ativo_id_especie_idx" ON "ranges_terapeuticos"("principio_ativo_id", "especie");

-- CreateIndex
CREATE UNIQUE INDEX "protocolos_codigo_key" ON "protocolos"("codigo");

-- CreateIndex
CREATE INDEX "logs_ciencia_prescricao_id_idx" ON "logs_ciencia"("prescricao_id");

-- CreateIndex
CREATE INDEX "logs_ciencia_veterinario_id_idx" ON "logs_ciencia"("veterinario_id");

-- CreateIndex
CREATE INDEX "logs_ciencia_created_at_idx" ON "logs_ciencia"("created_at");

-- AddForeignKey
ALTER TABLE "concentracoes" ADD CONSTRAINT "concentracoes_principio_ativo_id_fkey" FOREIGN KEY ("principio_ativo_id") REFERENCES "principios_ativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranges_terapeuticos" ADD CONSTRAINT "ranges_terapeuticos_principio_ativo_id_fkey" FOREIGN KEY ("principio_ativo_id") REFERENCES "principios_ativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocolo_itens" ADD CONSTRAINT "protocolo_itens_protocolo_id_fkey" FOREIGN KEY ("protocolo_id") REFERENCES "protocolos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocolo_itens" ADD CONSTRAINT "protocolo_itens_principio_ativo_id_fkey" FOREIGN KEY ("principio_ativo_id") REFERENCES "principios_ativos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_ciencia" ADD CONSTRAINT "logs_ciencia_prescricao_id_fkey" FOREIGN KEY ("prescricao_id") REFERENCES "prescricoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_ciencia" ADD CONSTRAINT "logs_ciencia_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "veterinarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_ciencia" ADD CONSTRAINT "logs_ciencia_principio_ativo_id_fkey" FOREIGN KEY ("principio_ativo_id") REFERENCES "principios_ativos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_ciencia" ADD CONSTRAINT "logs_ciencia_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
