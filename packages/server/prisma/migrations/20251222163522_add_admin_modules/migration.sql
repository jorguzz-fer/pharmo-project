-- AlterTable
ALTER TABLE "bulario" ADD COLUMN     "controlado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "realizado" BOOLEAN NOT NULL DEFAULT false,
    "data_contato" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
