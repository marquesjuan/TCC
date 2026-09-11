import { calcularSM2, EstadoSM2 } from "./sm2.js";

// Estado inicial de um cartão novo
let estado: EstadoSM2 = { fatorFacilidade: 2.5, intervalo: 0, repeticoes: 0 };

// Reproduz o Quadro 5 do TCC: sequência de notas 5, 4, 3, 5
const notas = [5, 4, 3, 5];

console.log("Inicial:", estado);
for (const nota of notas) {
  estado = calcularSM2(estado, nota);
  console.log(`Nota ${nota} ->`, estado);
}
