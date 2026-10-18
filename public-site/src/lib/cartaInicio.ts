import { CATEGORIAS, TRATAMIENTOS } from './tratamientos';
import { armarCarta } from './carta';

export const CARTA = armarCarta(CATEGORIAS, TRATAMIENTOS);
export const TOTAL_TRATAMIENTOS = CARTA.reduce((n, e) => n + e.total, 0);

// Servicio "Consulta" de la base: la evaluación con la que conviene empezar.
export const CONSULTA = 'Consulta';
