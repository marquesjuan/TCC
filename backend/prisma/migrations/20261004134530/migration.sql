/*
  Warnings:

  - You are about to drop the column `dataUltimaRevisao` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `senhaHash` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `streakAtual` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "dataUltimaRevisao",
DROP COLUMN "senhaHash",
DROP COLUMN "streakAtual";
