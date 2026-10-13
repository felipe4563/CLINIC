import type { Tratamiento } from '../tipos';

const MEDLINE_ABDOMINAL = {
  sitio: 'MedlinePlus',
  titulo: 'Ecografía abdominal',
  url: 'https://medlineplus.gov/spanish/ency/article/003777.htm',
};
const NHS_ECOGRAFIA = {
  sitio: 'NHS',
  titulo: 'Ultrasound scan',
  url: 'https://www.nhs.uk/conditions/ultrasound-scan/',
};
const MEDLINE_TRANSVAGINAL = {
  sitio: 'MedlinePlus',
  titulo: 'Ecografía trasvaginal',
  url: 'https://medlineplus.gov/spanish/ency/article/003779.htm',
};
const MEDLINE_PELVICA = {
  sitio: 'MedlinePlus',
  titulo: 'Ecografía pélvica abdominal',
  url: 'https://medlineplus.gov/spanish/ency/article/007667.htm',
};
const ACOG_ECOGRAFIA = {
  sitio: 'ACOG',
  titulo: 'Ultrasound Exams',
  url: 'https://www.acog.org/womens-health/faqs/ultrasound-exams',
};
const PMC_BULTOS = {
  sitio: 'PubMed Central',
  titulo: 'A bump: what to do next? Ultrasound imaging of superficial soft-tissue palpable lesions',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7441113/',
};
const NHS_MUSCULOESQUELETICA = {
  sitio: 'Newcastle Hospitals NHS Foundation Trust',
  titulo: 'Ultrasound musculoskeletal scan',
  url: 'https://www.newcastle-hospitals.nhs.uk/services/radiology/ultrasound/ultrasound-musculoskeletal-scan/',
};
const PMC_MUSCULOESQUELETICA = {
  sitio: 'PubMed Central',
  titulo: 'Role of diagnostic ultrasound in the assessment of musculoskeletal diseases',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3458614/',
};

export const ecografia: Tratamiento[] = [
  {
    slug: 'ecografia-abdominal',
    nombre: 'Ecografía abdominal',
    resumen: 'Estudio con ondas de sonido, sin radiación, que muestra órganos del abdomen como hígado, vesícula, páncreas y riñones.',
    queEs: [
      'La ecografía abdominal es un estudio de imagen que usa ondas de sonido para obtener imágenes de los órganos del abdomen, como el hígado, la vesícula biliar, el páncreas y los riñones, y de algunos vasos sanguíneos grandes. Según MedlinePlus, no usa radiación ionizante.',
      'Una profesional mueve una sonda sobre el abdomen, con un gel a base de agua, y las imágenes aparecen en una pantalla. La interpretación de los hallazgos la hace tu médica, quien te explicará qué significan.',
    ],
    beneficios: [
      'Ayuda a buscar la causa de dolor abdominal.',
      'Permite estudiar problemas como cálculos en la vesícula o en el riñón, líquido acumulado, tumores o lesiones.',
      'Se usa también cuando hay infección renal, fiebre o análisis de sangre alterados.',
      'No usa radiación ionizante, a diferencia de los rayos X o las tomografías, y no se conocen riesgos.',
    ],
    antes: [
      'La preparación depende del problema que se estudia: lo más probable es que te pidan no comer ni beber durante varias horas antes.',
      'Pregunta por las instrucciones exactas al agendar y sigue las que te den.',
    ],
    despues: [
      'El estudio suele durar menos de 30 minutos.',
      'Durante el examen sentirás poca molestia: el gel se siente frío y húmedo, y es posible que la sonda se presione con firmeza sobre el abdomen.',
      'Puede que te pidan cambiar de posición o contener la respiración unos momentos.',
      'Los resultados los revisa tu médica, quien te explicará qué significan para tu caso.',
    ],
    contraindicaciones: [
      'Según MedlinePlus, no se conocen riesgos de este estudio y no expone a radiación ionizante.',
      'Lo que puede cambiar es la preparación: si no puedes cumplir el ayuno que te indicaron, consúltalo antes para saber cómo proceder.',
    ],
    preguntas: [
      {
        pregunta: '¿Duele la ecografía abdominal?',
        respuesta: 'Genera poca molestia. El gel se siente frío y húmedo, y la sonda puede apretar con firmeza sobre el abdomen.',
      },
      {
        pregunta: '¿Cuánto dura?',
        respuesta: 'Según MedlinePlus, la mayoría de las veces dura menos de 30 minutos.',
      },
      {
        pregunta: '¿Es segura?',
        respuesta: 'Sí. MedlinePlus indica que no se conocen riesgos y que no hay exposición a radiación ionizante. El NHS la describe como segura porque usa ondas de sonido.',
      },
    ],
    fuentes: [MEDLINE_ABDOMINAL, NHS_ECOGRAFIA],
  },
  {
    slug: 'ecografia-ginecologica',
    nombre: 'Ecografía ginecológica',
    resumen: 'Estudio con ondas de sonido que examina el útero, los ovarios y la pelvis, por vía abdominal o transvaginal, sin radiación.',
    queEs: [
      'La ecografía ginecológica, o pélvica, es un estudio de imagen que permite ver el útero, los ovarios, las trompas, el cuello uterino y la pelvis. Se puede hacer de dos maneras: con la sonda sobre el abdomen (transabdominal) o con una sonda delgada que se introduce en la vagina (transvaginal).',
      'Según ACOG, el tipo de ecografía depende de las imágenes que necesite tu ginecóloga y del motivo del estudio. Las dos son estudios sin radiación.',
    ],
    beneficios: [
      'Ayuda a evaluar masas o quistes en la pelvis, como los de ovario, y miomas.',
      'Permite buscar la causa de dolor pélvico, sangrado anormal o problemas menstruales.',
      'Sirve para estudiar algunas causas de infertilidad y para vigilar tratamientos.',
      'No se conocen efectos dañinos y no hay exposición a radiación, a diferencia de los rayos X.',
    ],
    antes: [
      'Para la ecografía abdominal pélvica suele pedirse la vejiga llena: te pueden indicar beber varios vasos de agua y no orinar hasta terminar. ACOG menciona beber durante las 2 horas previas.',
      'Para la ecografía transvaginal se recomienda vaciar la vejiga antes, o que esté parcialmente llena, según MedlinePlus.',
      'Te pedirán cambiarte con una bata o desvestirte de la cintura para abajo, según el tipo de estudio.',
      'Si tienes alergia al látex, avísalo: la sonda interna lleva una cubierta de látex.',
    ],
    despues: [
      'La ecografía abdominal no causa dolor; después puedes irte a casa y retomar tus actividades.',
      'La transvaginal suele no doler; algunas personas sienten una molestia leve por la presión de la sonda.',
      'Los resultados los revisa tu ginecóloga, quien te explicará los hallazgos y si hacen falta más estudios.',
      'Si un resultado resulta anormal, necesita evaluación por un profesional de la salud.',
    ],
    contraindicaciones: [
      'Si tienes alergia al látex, avísalo antes de una ecografía transvaginal, porque la sonda lleva una cubierta de látex (NHS).',
      'Si sientes dolor durante una ecografía interna, díselo al personal: puedes detener el estudio en cualquier momento (NHS).',
      'En el embarazo, ACOG recomienda hacer ecografías solo por razones médicas y por profesionales calificados; no hay evidencia de daño para el feto, pero podrían identificarse efectos en el futuro.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuál es la diferencia entre la abdominal y la transvaginal?',
        respuesta: 'En la abdominal la sonda se mueve sobre el abdomen y suele requerir vejiga llena. En la transvaginal una sonda delgada, con cubierta y lubricante, se introduce en la vagina y se hace con la vejiga vacía o parcialmente llena.',
      },
      {
        pregunta: '¿Duele la ecografía transvaginal?',
        respuesta: 'Según MedlinePlus, la mayoría de las personas no sienten dolor; algunas notan una molestia leve por la presión de la sonda. Si te duele, dilo.',
      },
      {
        pregunta: '¿Es segura?',
        respuesta: 'MedlinePlus indica que no se conocen efectos dañinos en humanos y que no hay exposición a radiación.',
      },
    ],
    fuentes: [MEDLINE_TRANSVAGINAL, MEDLINE_PELVICA, ACOG_ECOGRAFIA, NHS_ECOGRAFIA],
  },
  {
    slug: 'ecografia-partes-blandas',
    nombre: 'Ecografía de partes blandas',
    resumen: 'Estudio con ondas de sonido para examinar bultos o inflamaciones bajo la piel, sin radiación; suele ser el primer estudio de imagen.',
    queEs: [
      'La ecografía de partes blandas examina con ondas de sonido las capas superficiales del cuerpo: la zona bajo la piel, el tejido graso y los músculos. Se usa sobre todo cuando notas un bulto o una inflamación.',
      'Es el primer estudio de imagen que suele usarse ante un bulto palpable. Su fiabilidad depende de que la haga un profesional entrenado y de un examen completo; cuando los hallazgos no son claros, pueden hacerse otros estudios.',
    ],
    beneficios: [
      'Confirma si realmente hay una lesión en la zona y descarta otras causas.',
      'Describe su ubicación, tamaño, forma y si es sólida o contiene líquido.',
      'Ayuda a distinguir lesiones probablemente benignas de otras que necesitan más estudio.',
      'Puede guiar la toma de una muestra con aguja y servir para el seguimiento de una lesión.',
    ],
    antes: [
      'El centro te dirá si necesitas alguna preparación; muchas veces no hace falta.',
      'Te pueden pedir quitarte joyas o piercings de la zona a examinar.',
      'Quizá debas descubrir la zona del bulto; puedes pedir que haya una persona acompañante o chaperón.',
    ],
    despues: [
      'Un profesional mueve una sonda sobre la piel, con gel, y las imágenes se ven en la pantalla.',
      'Según el NHS, los resultados pueden darse en la misma cita o tardar unas semanas, y llegan al médico que pidió el estudio.',
      'Las lesiones claramente benignas pueden no necesitar más estudios; las poco claras pueden requerir seguimiento con ecografía, resonancia o una muestra para análisis.',
    ],
    contraindicaciones: [
      'Es un estudio con ondas de sonido, sin radiación, y el NHS lo considera seguro.',
      'Si la zona está dolorida, la sonda puede resultar incómoda: avísale al personal.',
      'Si los hallazgos no son concluyentes o hay sospecha de algo grave, se necesitan más estudios; la ecografía no siempre alcanza para aclararlo.',
    ],
    preguntas: [
      {
        pregunta: '¿Para qué sirve una ecografía de un bulto?',
        respuesta: 'Confirma que hay una lesión, describe su tamaño, ubicación y si es sólida o con líquido, y ayuda a distinguir lesiones probablemente benignas de otras que requieren más estudios.',
      },
      {
        pregunta: '¿Una ecografía puede descartar todo?',
        respuesta: 'No siempre. Las lesiones benignas y malignas pueden tener rasgos parecidos y la fiabilidad depende del examen y del profesional, por lo que algunos casos necesitan resonancia, punción o biopsia.',
      },
      {
        pregunta: '¿Es dolorosa?',
        respuesta: 'Según el NHS, las sondas externas rara vez causan dolor, aunque pueden molestar sobre zonas sensibles. Puedes pedir detener el estudio cuando quieras.',
      },
    ],
    fuentes: [PMC_BULTOS, NHS_ECOGRAFIA],
  },
  {
    slug: 'ecografia-musculoesqueletica',
    nombre: 'Ecografía musculoesquelética',
    resumen: 'Estudio con ondas de sonido, sin radiación, para examinar músculos, tendones y articulaciones, en reposo o con movimiento.',
    queEs: [
      'La ecografía musculoesquelética usa ondas de sonido para examinar músculos, tendones, articulaciones y tejidos cercanos. Una revisión científica la describe como la primera opción de imagen para evaluar enfermedades musculoesqueléticas, por su disponibilidad, bajo costo y seguridad.',
      'Sirve para diagnosticar, vigilar la evolución y orientar el tratamiento. Se interpreta junto con tus síntomas y tu examen físico.',
    ],
    beneficios: [
      'Permite estudiar problemas de músculos, tendones y articulaciones y dar un diagnóstico más preciso.',
      'No usa radiación (rayos X).',
      'Permite hacer seguimiento de una lesión o enfermedad y evaluar si el tratamiento funciona.',
      'Puede ser una buena oportunidad para que te expliquen tu problema mientras ves las imágenes.',
    ],
    antes: [
      'Normalmente no requiere preparación; si hiciera falta, el centro te lo indicará con la cita.',
      'Es posible que te pidan quitarte la ropa de la zona a examinar o ponerte una bata.',
      'Si tienes diabetes, según un hospital del NHS, puedes comer y beber con normalidad y tomar tu medicación habitual.',
    ],
    despues: [
      'El estudio suele durar entre 15 y 30 minutos, según un hospital del NHS.',
      'Puede resultar algo incómodo, pero no debería doler; es posible que te pidan cambiar de postura o contener la respiración un momento.',
      'Puedes volver a casa manejando y reanudar tus actividades.',
      'Los resultados se entregan al médico que pidió el estudio, quien los comenta contigo.',
    ],
    contraindicaciones: [
      'No se conocen efectos secundarios de la ecografía diagnóstica, según un hospital del NHS.',
      'Si la zona está dolorida, la sonda puede molestar: avísale a quien hace el estudio.',
      'Si te incomoda que haya personal en formación durante el estudio, díselo al personal: según el hospital, no afectará tu atención.',
    ],
    preguntas: [
      {
        pregunta: '¿Necesito ir en ayunas?',
        respuesta: 'Normalmente no requiere preparación. Si el centro necesita que hagas algo en especial, te lo indicará al darte la cita.',
      },
      {
        pregunta: '¿Hay radiación?',
        respuesta: 'No. La ecografía usa ondas de sonido, no rayos X.',
      },
      {
        pregunta: '¿Cuánto tarda en estar el resultado?',
        respuesta: 'Depende del centro. En un hospital del NHS, los resultados se entregan al médico que pidió el estudio y se comentan en la siguiente cita.',
      },
    ],
    fuentes: [NHS_MUSCULOESQUELETICA, PMC_MUSCULOESQUELETICA],
  },
];
