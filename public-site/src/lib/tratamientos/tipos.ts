export type Fuente = { sitio: string; titulo: string; url: string };
export type Pregunta = { pregunta: string; respuesta: string };

export type Tratamiento = {
  slug: string; // único, minúsculas, sin acentos: 'prp-facial'
  nombre: string; // igual al nombre del servicio en la base: 'PRP facial'
  resumen: string; // una frase, ≤ 160 caracteres (encabezado y meta description)
  queEs: string[]; // 1–3 párrafos
  beneficios: string[]; // 3–6
  antes: string[]; // cuidados previos, 2–6
  despues: string[]; // cuidados posteriores, 2–6
  contraindicaciones: string[]; // 2–8
  preguntas: Pregunta[]; // 3–5
  fuentes: Fuente[]; // 1–4
};

export type Credito = { autor: string; sitio: string; url: string; licencia: string; licenciaUrl?: string };

export type Item = { nombre: string; slug?: string };
export type Columna = { titulo: string; items: Item[] };
export type Grupo = { titulo: string; descripcion: string; slug?: string; columnas?: Columna[] };
export type Icono = 'pulso' | 'onda' | 'movimiento' | 'cruz';
export type Categoria = {
  numero: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  grupos: Grupo[];
  icono?: Icono;
  respaldo?: string;
};
export type Enlace = { slug: string; nombre: string };
