import type { Tratamiento } from '../tipos';

const PLASMA_PARPADO_PILOTO = {
  sitio: 'PubMed',
  titulo: 'Clinical and Confocal Microscopy Study of Plasma Exeresis for Nonsurgical Blepharoplasty of the Upper Eyelid: A Pilot Study',
  url: 'https://pubmed.ncbi.nlm.nih.gov/28930794/',
};
const PLASMA_PERIORBITAL = {
  sitio: 'PubMed',
  titulo: 'Evaluation of the efficacy and safety of plasma exeresis in periorbital rejuvenation using the Reviscometer',
  url: 'https://pubmed.ncbi.nlm.nih.gov/34520602/',
};
const PLASMA_PEN_TIKTOK = {
  sitio: 'PubMed',
  titulo: 'Analysis of fibroblast pen usage amongst TikTok social media users',
  url: 'https://pubmed.ncbi.nlm.nih.gov/35500136/',
};
const MINIREVISION_PARPADO = {
  sitio: 'PubMed',
  titulo: 'Modern blepharoplasty: From bench to bedside',
  url: 'https://pubmed.ncbi.nlm.nih.gov/36969996/',
};

export const plasma: Tratamiento[] = [
  {
    slug: 'blefaroplastia-sin-cirugia',
    nombre: 'Blefaroplastia sin cirugía',
    resumen: 'Plasma (plasma pen) aplicado en el párpado para tensar la piel sobrante sin cirugía; los estudios son pequeños y de seguimiento corto.',
    queEs: [
      'La blefaroplastia sin cirugía con plasma, conocida en la literatura como exéresis con plasma, aplica pequeños puntos de energía de plasma sobre la piel del párpado para contraer el exceso de piel (dermatocalasia) y mejorar el aspecto de un párpado caído, sin cortar ni suturar. A los dispositivos de uso comercial se les llama también plasma pen o fibroblast pen.',
      'La evidencia es limitada: los estudios publicados son pequeños, con pocos participantes. En un estudio piloto con diez personas, que recibieron tres sesiones, se observó una mejoría clínica y cambios en el colágeno del párpado sin efectos adversos graves; en otro ensayo con 56 mujeres, también con tres sesiones, hubo mejoría significativa sin efectos adversos permanentes. En ambos casos los autores piden estudios más grandes. Las revisiones señalan que la cirugía sigue siendo la primera opción cuando se busca un resultado permanente.',
    ],
    beneficios: [
      'No requiere incisiones ni suturas.',
      'En los estudios, mejoró la apariencia de la piel sobrante del párpado superior.',
      'En los estudios pequeños realizados no se reportaron efectos adversos graves ni permanentes.',
      'Puede ser una opción en casos seleccionados, según la valoración médica.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora evaluará tus párpados y si el plasma es adecuado en tu caso.',
      'Habla de tus expectativas; el procedimiento no sustituye a la cirugía cuando hay mucho exceso de piel.',
      'Cuéntale tu historial de salud, alergias y medicamentos.',
      'Pregunta con qué equipo se realizará: muchos dispositivos que se venden comercialmente no están regulados por la FDA.',
    ],
    despues: [
      'Sigue las indicaciones de cuidado que te dé la doctora para la zona tratada.',
      'Los estudios describen varias sesiones separadas por semanas, así que probablemente te citen a controles; la doctora definirá el esquema para ti.',
      'Avisa a la doctora si notas dolor, cambios de color de la piel o signos de infección en la zona.',
      'Con los dispositivos de plasma se describen riesgos de cambios de pigmentación, cicatrices y quemaduras mecánicas.',
    ],
    contraindicaciones: [
      'Si buscas un resultado permanente o tienes un exceso importante de piel, la cirugía sigue siendo la primera opción según las revisiones.',
      'La doctora valorará si el riesgo de cambios de pigmentación, cicatrices o quemaduras es aceptable en tu caso.',
      'Conviene evitar los dispositivos de procedencia incierta o no regulados.',
    ],
    preguntas: [
      {
        pregunta: '¿Es lo mismo que una blefaroplastia quirúrgica?',
        respuesta: 'No. No hay cortes ni suturas, y el efecto se basa en contraer la piel. Las revisiones señalan que la cirugía sigue siendo la primera opción para lograr resultados permanentes.',
      },
      {
        pregunta: '¿Cuántas sesiones se necesitan?',
        respuesta: 'En los dos estudios consultados se aplicaron tres sesiones; en uno de ellos, con un mes de diferencia entre sesiones. En tu caso lo definirá la doctora.',
      },
      {
        pregunta: '¿Qué tan sólida es la evidencia?',
        respuesta: 'Limitada. Los estudios disponibles son pequeños y los propios autores piden investigaciones más amplias.',
      },
      {
        pregunta: '¿Qué riesgos tiene?',
        respuesta: 'En los estudios no se reportaron efectos graves ni permanentes cuando el procedimiento se realizó correctamente y en la persona adecuada. En general, los dispositivos de plasma se asocian a riesgo de cambios de pigmentación, cicatrices y quemaduras si no se usan bien.',
      },
    ],
    fuentes: [PLASMA_PARPADO_PILOTO, PLASMA_PERIORBITAL, MINIREVISION_PARPADO, PLASMA_PEN_TIKTOK],
  },
  {
    slug: 'eliminacion-de-acrocordones',
    nombre: 'Eliminación de acrocordones',
    resumen: 'Retiro de acrocordones (pequeños crecimientos de piel) con plasma pen; suelen ser inofensivos y no siempre necesitan quitarse.',
    queEs: [
      'Los acrocordones son crecimientos inofensivos de la piel, del color de la piel, más oscuros o rosados, que cuelgan de un pequeño tallo o están adheridos. Aparecen donde la piel roza con piel, joyas o ropa, como el cuello, los párpados o las axilas.',
      'Por lo general no necesitan retirarse; se recomienda cuando se irritan, sangran, duelen o, en el párpado, afectan la visión. Retirarlos solo por estética es un procedimiento cosmético. La AAD describe como métodos profesionales la congelación, la electrodesecación y el corte con instrumentos estériles; no menciona el plasma. En las fuentes consultadas no hay datos clínicos sobre el plasma pen para acrocordones, por lo que la doctora valorará si es adecuado en tu caso. Si tienes dudas sobre qué es una lesión (si es un acrocordón, una verruga u otra cosa), hay que evaluarla antes de retirarla.',
    ],
    beneficios: [
      'Alivia la molestia por roce o la irritación causada por el acrocordón.',
      'Permite retirar lesiones que no te gustan por estética.',
      'Hacerlo en consulta evita recurrir a retirarlo en casa con hilos o productos no aprobados, algo que no es adecuado.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora confirmará que se trata de un acrocordón. Si una lesión ha cambiado de color, forma o tamaño, o te genera dudas, debe ser evaluada por un médico antes de retirarla.',
      'No intentes quitarlo en casa: la FDA no ha aprobado productos para retirar acrocordones en casa y advierte que pueden causar daño. Los productos para verrugas tampoco son adecuados, porque pueden dañar la piel blanda.',
      'Si tienes muchos acrocordones que aparecieron de golpe, consulta, porque la AAD indica que puede ser señal de un problema interno.',
    ],
    despues: [
      'Sigue las instrucciones de cuidado que te dé la doctora sobre limpieza y curación de la zona: un buen cuidado ayuda a prevenir infecciones.',
      'Avisa si hay enrojecimiento que aumenta, dolor, secreción o sangrado.',
      'Con los dispositivos de plasma se describen riesgos de cambios de pigmentación, cicatrices y quemaduras mecánicas.',
    ],
    contraindicaciones: [
      'Una lesión de la que dudes que sea un acrocordón, o que haya cambiado de color, forma o tamaño, debe ser evaluada por un médico antes de retirarla.',
      'No es adecuado retirarlos en casa con hilos ni productos no aprobados.',
      'La doctora valorará si el riesgo de cicatrices o cambios de pigmentación es aceptable en tu caso.',
    ],
    preguntas: [
      {
        pregunta: '¿Hay que quitarlos?',
        respuesta: 'Normalmente no. Se recomienda retirarlos si se irritan, sangran, duelen o, en el párpado, afectan la visión. Retirarlos solo por estética es una decisión personal.',
      },
      {
        pregunta: '¿Por qué aparecen?',
        respuesta: 'Suelen formarse donde la piel roza. Se asocian al exceso de peso, el embarazo, la piel laxa, la diabetes y los antecedentes familiares.',
      },
      {
        pregunta: '¿Por qué conviene que me los revise un médico antes?',
        respuesta: 'Porque no siempre es fácil distinguir un acrocordón de una verruga o de otra lesión más seria. La AAD recomienda consultar si tienes dudas sobre qué es.',
      },
      {
        pregunta: '¿Puedo quitarlo en casa?',
        respuesta: 'No es recomendable. La FDA no ha aprobado productos para quitar acrocordones en casa y advierte que pueden causar daño; además, podrías confundirlo con otra lesión que necesita evaluación.',
      },
    ],
    fuentes: [
      { sitio: 'American Academy of Dermatology', titulo: 'Skin tags: Why they develop, and how to remove them', url: 'https://www.aad.org/public/diseases/a-z/skin-tags' },
      PLASMA_PEN_TIKTOK,
    ],
  },
  {
    slug: 'eliminacion-de-verrugas',
    nombre: 'Eliminación de verrugas',
    resumen: 'Retiro de verrugas con plasma pen tras una evaluación médica; muchas desaparecen solas, y las de cara o genitales deben ser vistas por un médico.',
    queEs: [
      'Las verrugas son crecimientos de la piel causados por un virus. La mayoría son inofensivas y muchas desaparecen solas, aunque esto puede tardar de meses a años. Un dermatólogo suele reconocerlas con solo mirarlas; si una verruga crece rápido, parece una llaga abierta o no responde al tratamiento, puede ser necesaria una biopsia.',
      'La AAD describe como opciones médicas el ácido salicílico, la congelación, la electrocirugía, el láser y otras; no menciona el plasma pen. En las fuentes consultadas no hay datos clínicos sobre su uso en verrugas, por lo que la doctora valorará si es adecuado en tu caso.',
    ],
    beneficios: [
      'Permite tratar una verruga que molesta, duele o no se va con los tratamientos de farmacia.',
      'Existen varias opciones médicas (como el ácido salicílico, la congelación, la electrocirugía o el láser), de modo que el tratamiento puede adaptarse a tu salud, tu edad y el tipo de verruga.',
      'Cuando una verruga te incomoda por su aspecto, retirarla es una opción.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora confirmará el diagnóstico. Si una lesión ha cambiado de color, forma o tamaño, o tienes dudas sobre si es una verruga, debe evaluarse antes de retirarla.',
      'Consulta a un médico, y no uses productos caseros, si la verruga está en la cara o en los genitales, si cambia, duele, pica, arde o sangra, si tienes muchas, o si el tratamiento casero no funcionó.',
      'Avisa si tienes diabetes o un sistema inmunitario debilitado: en esos casos se recomienda consultar con un dermatólogo.',
    ],
    despues: [
      'Sigue las indicaciones de cuidado que te dé la doctora: un buen cuidado en casa ayuda a prevenir cicatrices, queloides y manchas oscuras o claras.',
      'Avisa si hay dolor que aumenta, enrojecimiento, secreción o sangrado.',
      'Con los dispositivos de plasma se describen riesgos de cambios de pigmentación, cicatrices y quemaduras mecánicas.',
    ],
    contraindicaciones: [
      'Una lesión que cambia, crece rápido, parece una llaga o tienes dudas sobre qué es, debe evaluarse por un médico antes de retirarla.',
      'Las verrugas en la cara o genitales, o en personas con diabetes o con las defensas bajas, requieren valoración médica.',
      'La doctora valorará si el riesgo de cicatrices o cambios de pigmentación es aceptable en tu caso.',
    ],
    preguntas: [
      {
        pregunta: '¿Es necesario quitarlas?',
        respuesta: 'No siempre. Muchas verrugas son inofensivas y desaparecen solas, aunque puede llevar meses o años. Se consulta si molestan, duelen, cambian o no se van.',
      },
      {
        pregunta: '¿Qué otros tratamientos existen?',
        respuesta: 'La AAD menciona el ácido salicílico, la congelación, la electrocirugía, el láser y otras opciones. La doctora te orientará sobre cuál es la adecuada para ti.',
      },
      {
        pregunta: '¿Puede dejar cicatriz?',
        respuesta: 'Algunos métodos pueden dejar cicatrices o cambios de color en la piel. Seguir los cuidados que te indique la doctora ayuda a prevenirlos.',
      },
      {
        pregunta: '¿Por qué debo consultar antes de retirar una verruga?',
        respuesta: 'Porque a veces una lesión que parece una verruga es otra cosa. Si crece rápido, parece una llaga o no responde al tratamiento, puede hacer falta una biopsia.',
      },
    ],
    fuentes: [
      { sitio: 'American Academy of Dermatology', titulo: 'Warts: Diagnosis and treatment', url: 'https://www.aad.org/public/diseases/a-z/warts-treatment' },
      PLASMA_PEN_TIKTOK,
    ],
  },
];
