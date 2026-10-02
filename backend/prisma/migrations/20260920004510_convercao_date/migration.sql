-- AlterTable
ALTER TABLE "Cartao" ALTER COLUMN "proximaRevisao" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "Revisao" ALTER COLUMN "data" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "dataUltimaRevisao" SET DATA TYPE DATE;
