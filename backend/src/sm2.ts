// Estado do algoritmo SM-2 para um cartão
export interface EstadoSM2 {
  fatorFacilidade: number; // E-Factor, inicia em 2.5
  intervalo: number;       // em dias
  repeticoes: number;      // acertos consecutivos
}

/**
 * Aplica o algoritmo SM-2 a um cartão, dada a qualidade da resposta (0 a 5).
 * Retorna o novo estado do cartão. Função pura: não acessa banco.
 * Baseado em Woźniak (1990).
 */
export function calcularSM2(estado: EstadoSM2, qualidade: number): EstadoSM2 {
  let { fatorFacilidade, intervalo, repeticoes } = estado;

  if (qualidade < 3) {
    // Falha: reinicia o ciclo, mantém o fator de facilidade
    repeticoes = 0;
    intervalo = 1;
  } else {
    // Acerto: avança o intervalo pela função de intervalos crescentes
    if (repeticoes === 0) {
      intervalo = 1;
    } else if (repeticoes === 1) {
      intervalo = 6;
    } else {
      intervalo = Math.round(intervalo * fatorFacilidade);
    }
    repeticoes += 1;

    // Recalcula o fator de facilidade
    fatorFacilidade =
      fatorFacilidade + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02));

    // Piso de 1,3
    if (fatorFacilidade < 1.3) {
      fatorFacilidade = 1.3;
    }
  }

  return { fatorFacilidade, intervalo, repeticoes };
}
