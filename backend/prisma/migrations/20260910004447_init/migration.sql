-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "streakAtual" INTEGER NOT NULL DEFAULT 0,
    "dataUltimaRevisao" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Baralho" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Baralho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cartao" (
    "id" SERIAL NOT NULL,
    "frente" TEXT NOT NULL,
    "verso" TEXT NOT NULL,
    "fatorFacilidade" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalo" INTEGER NOT NULL DEFAULT 0,
    "repeticoes" INTEGER NOT NULL DEFAULT 0,
    "proximaRevisao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origem" TEXT NOT NULL DEFAULT 'manual',
    "baralhoId" INTEGER NOT NULL,

    CONSTRAINT "Cartao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revisao" (
    "id" SERIAL NOT NULL,
    "qualidade" INTEGER NOT NULL,
    "fatorApos" DOUBLE PRECISION NOT NULL,
    "intervaloApos" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cartaoId" INTEGER NOT NULL,

    CONSTRAINT "Revisao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Baralho" ADD CONSTRAINT "Baralho_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartao" ADD CONSTRAINT "Cartao_baralhoId_fkey" FOREIGN KEY ("baralhoId") REFERENCES "Baralho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revisao" ADD CONSTRAINT "Revisao_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
