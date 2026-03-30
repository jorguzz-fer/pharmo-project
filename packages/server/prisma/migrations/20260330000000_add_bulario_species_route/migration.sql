-- AlterTable: tornar concentracao opcional e adicionar novos campos ao bulario
ALTER TABLE "bulario"
  ALTER COLUMN "concentracao" DROP NOT NULL,
  ADD COLUMN "species"          TEXT,
  ADD COLUMN "route_hint"       TEXT,
  ADD COLUMN "source_record_id" INTEGER;

-- CreateIndex: unique por principio_ativo + species
CREATE UNIQUE INDEX "bulario_principio_ativo_species_key"
  ON "bulario"("principio_ativo", "species");
