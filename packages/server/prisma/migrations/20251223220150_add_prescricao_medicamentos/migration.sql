-- CreateTable
CREATE TABLE "prescricao_medicamentos" (
    "id" TEXT NOT NULL,
    "prescricao_id" TEXT NOT NULL,
    "codigo_medicamento" TEXT,
    "medicamento" TEXT NOT NULL,
    "dosagem" TEXT NOT NULL,
    "forma_farmaceutica" TEXT NOT NULL,
    "quantidade" TEXT NOT NULL,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescricao_medicamentos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "prescricao_medicamentos" ADD CONSTRAINT "prescricao_medicamentos_prescricao_id_fkey" FOREIGN KEY ("prescricao_id") REFERENCES "prescricoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
