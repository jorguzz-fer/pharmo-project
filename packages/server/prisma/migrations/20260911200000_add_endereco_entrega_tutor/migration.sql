-- Endereço de entrega do tutor (reunião PharmoPet 11/09):
-- o pedido pode ser entregue na clínica parceira ou no endereço do cliente.
ALTER TABLE "tutores" ADD COLUMN "entrega_na_clinica" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tutores" ADD COLUMN "endereco_entrega" TEXT;
