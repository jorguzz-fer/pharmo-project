-- AlterTable
ALTER TABLE "clinicas" ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expires" TIMESTAMP(3),
ADD COLUMN     "senha_hash" TEXT;
