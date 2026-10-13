import type { Categoria, Enlace } from './tipos';

const RESPALDO_MEDICO = 'Parte del enfoque integral de ClinicNovagED, con seguimiento médico especializado.';

export const CATEGORIAS: Categoria[] = [
  {
    numero: '01',
    titulo: 'Medicina Estética',
    descripcion:
      'Tratamientos médico-estéticos avanzados orientados a la mejora visible, el rejuvenecimiento y el bienestar integral de la piel y el cuerpo.',
    imagen: '/novaged-assets/medicinaEstetica-DQhnxto0.png',
    grupos: [
      {
        titulo: 'Tratamientos Faciales',
        descripcion:
          'Tratamientos orientados a mejorar la calidad, hidratación, luminosidad y regeneración de la piel mediante medicina estética avanzada.',
        columnas: [
          {
            titulo: 'Áreas de enfoque',
            items: [{ nombre: 'Calidad de piel' }, { nombre: 'Hidratación profunda' }, { nombre: 'Despigmentación' }, { nombre: 'Regeneración celular' }],
          },
          {
            titulo: 'Tratamientos',
            items: [
              { nombre: 'Microneedling', slug: 'microneedling' },
              { nombre: 'PRP facial', slug: 'prp-facial' },
              { nombre: 'PDRN / PN', slug: 'pdrn-pn' },
              { nombre: 'Exosomas', slug: 'exosomas' },
              { nombre: 'Peelings médicos', slug: 'peelings-medicos' },
              { nombre: 'Ácido hialurónico', slug: 'acido-hialuronico-hidratacion' },
              { nombre: 'Cóctel de vitaminas', slug: 'coctel-de-vitaminas' },
              { nombre: 'DMAE + silicio orgánico', slug: 'dmae-silicio-organico' },
              { nombre: 'Cóctel de aminoácidos', slug: 'coctel-de-aminoacidos' },
            ],
          },
        ],
      },
      {
        titulo: 'Armonización Facial',
        descripcion: 'Tratamientos diseñados para equilibrar y resaltar los rasgos faciales manteniendo resultados naturales y armónicos.',
        columnas: [
          {
            titulo: 'Procedimientos',
            items: [
              { nombre: 'Ácido hialurónico (Fillers)', slug: 'acido-hialuronico-fillers' },
              { nombre: 'Toxina botulínica (Botox)', slug: 'toxina-botulinica' },
              { nombre: 'Perfilado de nariz', slug: 'perfilado-de-nariz' },
              { nombre: 'Relleno / perfilado de labios', slug: 'relleno-de-labios' },
              { nombre: 'Mentoplastia', slug: 'mentoplastia' },
              { nombre: 'Marcación mandibular', slug: 'marcacion-mandibular' },
              { nombre: 'Levantamiento de pómulos', slug: 'levantamiento-de-pomulos' },
            ],
          },
        ],
      },
      {
        titulo: 'Rejuvenecimiento · Lifting',
        descripcion: 'Protocolos regenerativos orientados a combatir flacidez y signos de envejecimiento facial.',
        columnas: [
          { titulo: 'Indicados para', items: [{ nombre: 'Flacidez facial' }, { nombre: 'Envejecimiento' }, { nombre: 'Grasa localizada' }] },
          {
            titulo: 'Tratamiento con bioestimuladores de colágeno',
            items: [
              { nombre: 'Hidroxiapatita de calcio', slug: 'hidroxiapatita-de-calcio' },
              { nombre: 'Ácido poliláctico', slug: 'acido-polilactico' },
              { nombre: 'Hilos tensores', slug: 'hilos-tensores' },
              { nombre: 'Bioestimuladores de colágeno', slug: 'bioestimuladores-de-colageno' },
              { nombre: 'Adipoestructuración', slug: 'adipoestructuracion' },
            ],
          },
        ],
      },
      {
        titulo: 'Tratamientos Corporales',
        descripcion: 'Tratamientos orientados a mejorar contorno corporal, firmeza y reducción de grasa localizada.',
        columnas: [
          {
            titulo: 'Tratamientos disponibles',
            items: [
              { nombre: 'Lipólisis química', slug: 'lipolisis-quimica' },
              { nombre: 'Enzimas recombinantes', slug: 'enzimas-recombinantes' },
              { nombre: 'Enzimas lipolíticas', slug: 'enzimas-lipoliticas' },
              { nombre: 'Ondas rusas', slug: 'ondas-rusas' },
              { nombre: 'Radiofrecuencia', slug: 'radiofrecuencia' },
              { nombre: 'Drenaje linfático', slug: 'drenaje-linfatico' },
              { nombre: 'Masajes reductores', slug: 'masajes-reductores' },
            ],
          },
        ],
      },
      {
        titulo: 'Plasma Láser',
        descripcion: 'Tecnología orientada al rejuvenecimiento y corrección de imperfecciones cutáneas.',
        columnas: [
          {
            titulo: 'Indicados para',
            items: [
              { nombre: 'Blefaroplastia sin cirugía', slug: 'blefaroplastia-sin-cirugia' },
              { nombre: 'Lifting facial sin cirugía', slug: 'lifting-facial-sin-cirugia' },
              { nombre: 'Eliminación de lunares', slug: 'eliminacion-de-lunares' },
              { nombre: 'Eliminación de acrocordones', slug: 'eliminacion-de-acrocordones' },
              { nombre: 'Eliminación de verrugas', slug: 'eliminacion-de-verrugas' },
            ],
          },
        ],
      },
    ],
  },
  {
    numero: '02',
    titulo: 'Ginecología y Obstetricia',
    descripcion: 'Atención integral femenina con enfoque preventivo, diagnóstico y seguimiento especializado.',
    imagen: '/novaged-assets/ginecologia-BjPYN0D4.png',
    icono: 'pulso',
    respaldo: RESPALDO_MEDICO,
    grupos: [
      { titulo: 'Consulta ginecológica', slug: 'consulta-ginecologica', descripcion: 'Evaluación ginecológica completa con historial clínico y examen físico.' },
      { titulo: 'Obstetricia', slug: 'obstetricia', descripcion: 'Seguimiento especializado del embarazo, parto y puerperio.' },
      { titulo: 'Planificación familiar', slug: 'planificacion-familiar', descripcion: 'Orientación y prescripción de métodos anticonceptivos adecuados.' },
      { titulo: 'Control prenatal', slug: 'control-prenatal', descripcion: 'Monitoreo periódico del desarrollo del embarazo y bienestar materno-fetal.' },
      { titulo: 'Papanicolau', slug: 'papanicolau', descripcion: 'Citología cervical para detección temprana de alteraciones celulares.' },
      { titulo: 'Colposcopía', slug: 'colposcopia', descripcion: 'Examen visual del cuello uterino para evaluación y diagnóstico especializado.' },
    ],
  },
  {
    numero: '03',
    titulo: 'Ecografía',
    descripcion: 'Servicios de diagnóstico por imagen orientados a evaluación médica precisa y especializada.',
    imagen: '/novaged-assets/ecografia-De6bdoYN.png',
    icono: 'onda',
    respaldo: RESPALDO_MEDICO,
    grupos: [
      { titulo: 'Ecografía abdominal', slug: 'ecografia-abdominal', descripcion: 'Evaluación de órganos y estructuras abdominales mediante ultrasonido.' },
      { titulo: 'Ecografía ginecológica', slug: 'ecografia-ginecologica', descripcion: 'Diagnóstico de estructuras pélvicas y reproductivas femeninas.' },
      { titulo: 'Ecografía de partes blandas', slug: 'ecografia-partes-blandas', descripcion: 'Valoración de tejidos blandos superficiales y ganglios.' },
      { titulo: 'Ecografía musculoesquelética', slug: 'ecografia-musculoesqueletica', descripcion: 'Diagnóstico de tendones, músculos, ligamentos y articulaciones.' },
    ],
  },
  {
    numero: '04',
    titulo: 'Fisioterapia',
    descripcion: 'Tratamientos terapéuticos orientados a rehabilitación, bienestar físico y recuperación funcional.',
    imagen: '/novaged-assets/fisioterapia-Dya6snx4.png',
    icono: 'movimiento',
    respaldo: RESPALDO_MEDICO,
    grupos: [
      { titulo: 'Terapia manual', slug: 'terapia-manual', descripcion: 'Técnicas manuales especializadas para alivio del dolor y recuperación funcional.' },
      { titulo: 'Masajes relajantes', slug: 'masajes-relajantes', descripcion: 'Sesiones orientadas a reducir tensión muscular y promover bienestar general.' },
      { titulo: 'Masajes descontracturantes', slug: 'masajes-descontracturantes', descripcion: 'Trabajo profundo sobre contracturas y tensiones musculares acumuladas.' },
      { titulo: 'Rehabilitación', slug: 'rehabilitacion', descripcion: 'Protocolos personalizados para recuperación funcional post-lesión o cirugía.' },
      { titulo: 'Aparatología', slug: 'aparatologia', descripcion: 'Tratamientos con equipos especializados de fisioterapia según indicación médica.' },
    ],
  },
  {
    numero: '05',
    titulo: 'Enfermería',
    descripcion: 'Servicios básicos de apoyo clínico y control médico.',
    imagen: '/novaged-assets/enfermeria-BQQNcDdH.png',
    icono: 'cruz',
    respaldo: RESPALDO_MEDICO,
    grupos: [
      { titulo: 'Curaciones', slug: 'curaciones', descripcion: 'Tratamiento y seguimiento de heridas y lesiones cutáneas.' },
      { titulo: 'Control de presión arterial', slug: 'control-presion-arterial', descripcion: 'Medición y registro de valores de tensión arterial.' },
      { titulo: 'Control de peso y talla', slug: 'control-peso-talla', descripcion: 'Evaluación antropométrica básica.' },
      { titulo: 'Glicemia capilar', slug: 'glicemia-capilar', descripcion: 'Medición de glucosa en sangre capilar con glucómetro calibrado.' },
      { titulo: 'Sueros', slug: 'sueros', descripcion: 'Administración de soluciones intravenosas según prescripción médica.' },
      { titulo: 'Inyectables', slug: 'inyectables', descripcion: 'Aplicación de medicamentos por vía intramuscular o endovenosa.' },
    ],
  },
];

// Dónde vive un tratamiento: su categoría, el título que lo agrupa (el grupo en
// Medicina Estética, la categoría en las demás) y sus vecinos para "Otros tratamientos".
export function ubicarTratamiento(slug: string): { categoria: Categoria; contexto: string; vecinos: Enlace[] } | null {
  for (const categoria of CATEGORIAS) {
    for (const grupo of categoria.grupos) {
      if (grupo.slug === slug) {
        const vecinos = categoria.grupos.flatMap((g) => (g.slug ? [{ slug: g.slug, nombre: g.titulo }] : []));
        return { categoria, contexto: categoria.titulo, vecinos };
      }
      const items = (grupo.columnas ?? []).flatMap((c) => c.items);
      if (items.some((i) => i.slug === slug)) {
        const vecinos = items.flatMap((i) => (i.slug ? [{ slug: i.slug, nombre: i.nombre }] : []));
        return { categoria, contexto: grupo.titulo, vecinos };
      }
    }
  }
  return null;
}
