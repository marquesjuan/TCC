// Estado do algoritmo SM-2 para um cartão
export interface EstadoSM2 {
  fatorFacilidade: number; // E-Factor, inicia em 2.5
  intervalo: number;       // em dias
  repeticoes: number;      // acertos consecutivos
}

export function calcularSM2(estado: EstadoSM2, qualidade: number): EstadoSM2 {
  let { fatorFacilidade, intervalo, repeticoes } = estado;

  if (qualidade < 3) {
    //reinicia repeticoes e intervalo, EF mantem
    repeticoes = 0;
    intervalo = 1;
  } else {
    if (repeticoes === 0) {
      intervalo = 1;
    } else if (repeticoes === 1) {
      intervalo = 6;
    } else {
      intervalo = Math.round(intervalo * fatorFacilidade);
    }
    repeticoes += 1;

   
    fatorFacilidade =
      fatorFacilidade + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02));

    
    if (fatorFacilidade < 1.3) {
      fatorFacilidade = 1.3;
    }
  }

  return { fatorFacilidade, intervalo, repeticoes };
}
