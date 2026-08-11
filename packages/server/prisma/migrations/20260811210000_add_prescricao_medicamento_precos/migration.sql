-- Preço praticado no momento da prescrição, por medicamento.
-- Permite que o Orçamento seja a soma auditável dos itens em vez de um valor solto.
ALTER TABLE "prescricao_medicamentos"
  ADD COLUMN "preco_sugestao" DECIMAL(10,2),
  ADD COLUMN "preco_tabela" DECIMAL(10,2),
  ADD COLUMN "is_magistral" BOOLEAN NOT NULL DEFAULT false;
