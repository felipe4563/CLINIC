import type { Tratamiento } from '../tipos';

const CHOOSEPT_VISITA = {
  sitio: 'APTA (ChoosePT)',
  titulo: 'Preparing for Your Visit with a Physical Therapist',
  url: 'https://www.choosept.com/why-physical-therapy/prepare',
};
const NHS_FISIOTERAPIA = {
  sitio: 'NHS',
  titulo: 'Physiotherapy',
  url: 'https://www.nhs.uk/conditions/physiotherapy/',
};
const CLEVELAND_MASAJE = {
  sitio: 'Cleveland Clinic',
  titulo: 'Massage Therapy',
  url: 'https://my.clevelandclinic.org/departments/wellness/integrative/treatments-services/massage-therapy',
};
const NCCIH_MASAJE = {
  sitio: 'NCCIH (NIH)',
  titulo: 'Massage Therapy: What You Need To Know',
  url: 'https://www.nccih.nih.gov/health/massage-therapy-what-you-need-to-know',
};
const CLEVELAND_MIOFASCIAL = {
  sitio: 'Cleveland Clinic',
  titulo: 'Myofascial Pain Syndrome: What It Is, Symptoms & Treatment',
  url: 'https://my.clevelandclinic.org/health/diseases/12054-myofascial-pain-syndrome',
};
const MEDLINE_REHABILITACION = {
  sitio: 'MedlinePlus',
  titulo: 'Physical medicine and rehabilitation',
  url: 'https://medlineplus.gov/ency/article/007448.htm',
};
const NHS_TENS = {
  sitio: 'NHS',
  titulo: 'Transcutaneous electrical nerve stimulation (TENS)',
  url: 'https://www.nhs.uk/conditions/transcutaneous-electrical-nerve-stimulation-tens/',
};
const PMC_ULTRASONIDO = {
  sitio: 'PubMed Central (AIUM)',
  titulo: 'Overview of therapeutic ultrasound applications and safety considerations',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3810427/',
};

const PRECAUCIONES_MASAJE = [
  'Si tomas anticoagulantes (pueden aparecer moretones), si tienes coágulos en una pierna, tumores o un embarazo de alto riesgo, consulta antes con tu médico (Cleveland Clinic).',
  'Si tienes osteoporosis o un trastorno de la columna (riesgo de fractura), o un dispositivo médico implantado o adherido al cuerpo, consúltalo con tu médico antes de recibir un masaje (Cleveland Clinic).',
  'Si tuviste una lesión aguda o una cirugía en las últimas 48 horas, Cleveland Clinic indica hablarlo antes con tu médico.',
];

export const fisioterapia: Tratamiento[] = [
  {
    slug: 'masajes-relajantes',
    nombre: 'Masajes relajantes',
    resumen: 'Masaje de tejidos blandos para aliviar la tensión y favorecer el bienestar; la evidencia para condiciones específicas es limitada.',
    queEs: [
      'El masaje terapéutico es la manipulación de los tejidos blandos del cuerpo para ayudar a manejar una condición de salud o favorecer el bienestar. El masaje sueco o clásico es la forma más común en los países occidentales, según el NCCIH, la agencia de los Institutos Nacionales de Salud de EE. UU.',
      'Las fuentes consultadas tienen matices. Cleveland Clinic menciona beneficios como menos dolor, menos ansiedad y menos tensión muscular, mientras que el NCCIH señala que, para varias condiciones concretas, la evidencia es débil o los beneficios pueden ser de corta duración. Por eso conviene verlo como un apoyo para el bienestar y no como un sustituto de tu tratamiento médico.',
    ],
    beneficios: [
      'Puede reducir la tensión y el dolor muscular, según Cleveland Clinic.',
      'Puede ayudar a disminuir la ansiedad y favorecer la relajación (Cleveland Clinic).',
      'Puede mejorar la flexibilidad y el rango de movimiento (Cleveland Clinic).',
      'El NCCIH aclara que la evidencia es limitada para muchas condiciones y que, por ejemplo, en el dolor de cuello y hombros los beneficios pueden durar poco.',
    ],
    antes: [
      'Antes de empezar, comenta con el terapeuta las técnicas que se usarán y cómo deberían sentirse; Cleveland Clinic recomienda hablarlo antes del tratamiento.',
      'Cuéntale si tomas anticoagulantes, si tienes osteoporosis, coágulos, tumores, un dispositivo médico o una lesión o cirugía reciente (ver la sección de precauciones).',
      'Usa ropa con la que te sientas bien; durante la sesión te cubren con sábanas o mantas.',
      'Las sesiones suelen durar unos 50 minutos, según Cleveland Clinic.',
    ],
    despues: [
      'Las fuentes consultadas no fijan pautas generales para después de una sesión; pregunta a tu terapeuta si te recomienda algo según la técnica usada.',
      'Las complicaciones graves son raras (coágulos, lesión de un nervio, fractura, según el NCCIH); si después de un masaje tienes un síntoma que no esperabas, consúltalo con un profesional de salud.',
      'El NCCIH recomienda no usar el masaje para posponer la consulta con un profesional de salud ante un problema médico.',
    ],
    contraindicaciones: [
      PRECAUCIONES_MASAJE[0],
      PRECAUCIONES_MASAJE[1],
      PRECAUCIONES_MASAJE[2],
      'En el embarazo, Cleveland Clinic recomienda consultar siempre antes con tu ginecólogo u obstetra, y más aún si es de alto riesgo.',
      'Las personas mayores y quienes tienen cáncer pueden necesitar adaptaciones (menos presión en zonas sensibles), según el NCCIH.',
      'Si la presión te resulta incómoda o dolorosa, avísale de inmediato al terapeuta (Cleveland Clinic).',
    ],
    preguntas: [
      {
        pregunta: '¿Cuánto dura una sesión?',
        respuesta: 'Cleveland Clinic indica que una sesión de masaje terapéutico dura generalmente unos 50 minutos.',
      },
      {
        pregunta: '¿Es seguro?',
        respuesta: 'El NCCIH indica que el riesgo de daño parece bajo. Se han descrito casos raros de coágulos, lesión de un nervio o fractura, casi siempre con técnicas vigorosas o en personas con mayor riesgo de lesión, como los adultos mayores.',
      },
      {
        pregunta: '¿Puede un masaje reemplazar mi tratamiento médico?',
        respuesta: 'No. El NCCIH aconseja no usar el masaje para posponer la consulta con un profesional de salud por un problema médico.',
      },
    ],
    fuentes: [CLEVELAND_MASAJE, NCCIH_MASAJE],
  },
  {
    slug: 'masajes-descontracturantes',
    nombre: 'Masajes descontracturantes',
    resumen: 'Masaje terapéutico más profundo para zonas tensas o contracturadas; puede dejar sensibilidad y tiene precauciones que conviene conocer.',
    queEs: [
      'Un masaje descontracturante es un masaje terapéutico orientado a aliviar zonas de tensión muscular. Cleveland Clinic explica que el masaje terapéutico puede sentirse más profundo que uno de relajación y dejar cierta sensibilidad, y lo menciona entre las opciones usadas en casos de dolor de espalda, hombro congelado, dolores de cabeza, latigazo cervical, distensiones musculares, trastornos de la articulación temporomandibular y tendinitis.',
      'Cleveland Clinic también lista el masaje entre los remedios para los puntos gatillo, esos nudos dolorosos del músculo, que suelen tratarse junto con fisioterapia. La evidencia depende de la condición: el NCCIH describe pruebas débiles o de corto plazo para varias de ellas.',
    ],
    beneficios: [
      'Puede reducir la tensión, la rigidez y el dolor muscular, según Cleveland Clinic.',
      'Puede aumentar el rango de movimiento y la flexibilidad (Cleveland Clinic).',
      'Puede ayudar con el dolor, la hinchazón y la inflamación, y con el tejido cicatricial, según Cleveland Clinic.',
      'Es una de las opciones para los puntos gatillo o nudos musculares, junto con fisioterapia, estiramientos y fortalecimiento (Cleveland Clinic).',
    ],
    antes: [
      'Comenta con el terapeuta las técnicas que se usarán y cómo deberían sentirse, y dile en qué zona notas el dolor o los nudos.',
      'Cuéntale si tomas anticoagulantes, si tienes osteoporosis, coágulos, tumores, un dispositivo médico o una lesión o cirugía reciente.',
      'Si el dolor en una zona no se va, consulta con un profesional de salud: Cleveland Clinic señala que atender los puntos gatillo pronto suele dar mejores resultados.',
    ],
    despues: [
      'Un masaje terapéutico puede sentirse más profundo y dejar cierta sensibilidad; si la presión te resulta incómoda o dolorosa, díselo al terapeuta durante la sesión.',
      'Para el cuidado en casa de los puntos gatillo, Cleveland Clinic menciona compresas frías o calientes, estiramientos, ejercicio y baños de agua tibia. Pregunta al terapeuta o a tu médico qué te conviene.',
      'Las complicaciones graves son raras (coágulos, lesión de un nervio, fractura); si después de un masaje tienes un síntoma que no esperabas, consúltalo con un profesional de salud.',
    ],
    contraindicaciones: [
      PRECAUCIONES_MASAJE[0],
      PRECAUCIONES_MASAJE[1],
      PRECAUCIONES_MASAJE[2],
      'El NCCIH señala que los efectos graves raros (coágulos, lesión de un nervio, fractura) se han asociado con técnicas vigorosas, como el masaje de tejido profundo, o con personas de mayor riesgo, como los adultos mayores.',
      'Si hay cáncer, el terapeuta puede necesitar usar menos presión en zonas sensibles (NCCIH).',
      'En el embarazo, consulta siempre antes con tu ginecólogo u obstetra (Cleveland Clinic).',
    ],
    preguntas: [
      {
        pregunta: '¿Duele un masaje descontracturante?',
        respuesta: 'Puede sentirse más profundo que un masaje de relajación y dejar cierta sensibilidad, según Cleveland Clinic. Si la presión es incómoda o dolorosa, avisa al terapeuta de inmediato.',
      },
      {
        pregunta: '¿Qué es un nudo o punto gatillo?',
        respuesta: 'Cleveland Clinic lo describe como un punto pequeño y sensible en el músculo, a veces un bulto o nudo, que duele al tocarlo y a veces sin tocarlo.',
      },
      {
        pregunta: '¿Cuándo debería consultar a un médico en lugar de solo recibir masajes?',
        respuesta: 'Si el dolor en una zona no desaparece, Cleveland Clinic recomienda consultar con un profesional de salud, y el NCCIH aconseja no usar el masaje para posponer esa consulta.',
      },
    ],
    fuentes: [CLEVELAND_MASAJE, CLEVELAND_MIOFASCIAL, NCCIH_MASAJE],
  },
  {
    slug: 'rehabilitacion',
    nombre: 'Rehabilitación',
    resumen: 'Programa de fisioterapia para recuperar movimiento y funciones perdidas tras una lesión o enfermedad, con objetivos definidos contigo.',
    queEs: [
      'La rehabilitación busca ayudar a recuperar funciones del cuerpo que se perdieron o disminuyeron por una enfermedad o una lesión, como el movimiento. MedlinePlus la describe como una especialidad médica en la que, según el caso, participan médicos y distintos terapeutas, entre ellos fisioterapeutas.',
      'En fisioterapia suele comenzar con una evaluación: el fisioterapeuta pregunta por tus síntomas y tu historia de salud, te examina y, junto contigo, fija objetivos y un plan de tratamiento. Ese plan se revisa a lo largo del proceso.',
    ],
    beneficios: [
      'El objetivo principal es que puedas valerte lo más posible por ti en las actividades cotidianas; en algunos casos, el objetivo es recuperar toda la función de una parte del cuerpo (MedlinePlus).',
      'El tratamiento se centra en mejorar o mantener tus actividades diarias, trabajando el dolor, la hinchazón, la debilidad y la limitación del movimiento (APTA).',
      'Puede incluir ejercicios, técnicas manuales y consejos para manejar los síntomas, según el NHS.',
      'El fisioterapeuta puede enseñarte ejercicios para casa y valorar si necesitas algún apoyo, como calzado, férulas o muletas (APTA).',
    ],
    antes: [
      'Lleva informes, estudios de imagen y resultados de laboratorio de otros profesionales, y la lista de tus médicos.',
      'Anota tus síntomas, desde cuándo los tienes y si cambian con movimientos, posiciones, horarios, reposo o actividades.',
      'Lleva la lista de medicamentos, vitaminas y suplementos que tomas, y tus antecedentes de lesiones o enfermedades.',
      'Considera ir con un familiar o amigo que te ayude a recordar los detalles, y lleva tus lentes o audífonos si los usas.',
    ],
    despues: [
      'Es posible que te den ejercicios para hacer en casa entre sesiones; el NHS insiste en practicarlos con regularidad.',
      'El fisioterapeuta revisa cómo respondes y ajusta el plan; el avance se vuelve a valorar durante toda la atención y se planifica el alta cuando estés listo (APTA).',
      'Tu fisioterapeuta, a petición tuya, puede compartir información con tus médicos (APTA).',
    ],
    contraindicaciones: [
      'Cuando la causa es una condición grave (por ejemplo, un ictus, una lesión de la médula espinal o una cirugía mayor de huesos o articulaciones), MedlinePlus describe que la rehabilitación suele requerir un equipo de varios profesionales y, a veces, comenzar en el hospital; tu médico indicará dónde y cómo.',
      'Un reposo prolongado en cama (más de uno o dos días) puede empeorar el dolor y causar otras complicaciones, según la APTA; el fisioterapeuta te ayuda a definir un nivel de actividad seguro.',
      'Si un ejercicio te causa dolor o te preocupa, díselo al fisioterapeuta: revisa tu respuesta y ajusta el tratamiento (APTA).',
    ],
    preguntas: [
      {
        pregunta: '¿Qué diferencia hay entre fisioterapia y rehabilitación?',
        respuesta: 'MedlinePlus define la rehabilitación como una especialidad médica que busca recuperar funciones perdidas, con un equipo que puede incluir a fisioterapeutas. La fisioterapia es una de las herramientas con las que se trabaja.',
      },
      {
        pregunta: '¿Cuántas sesiones necesitaré?',
        respuesta: 'Depende de tu caso. El NHS indica que el fisioterapeuta te orientará sobre cuántas sesiones podrías necesitar tras la primera valoración.',
      },
      {
        pregunta: '¿Qué debo llevar a la primera consulta?',
        respuesta: 'La APTA sugiere llevar informes, estudios de imagen y resultados de laboratorio de otros profesionales, la lista de tus médicos y de tus medicamentos, y anotar tus síntomas y preguntas.',
      },
    ],
    fuentes: [MEDLINE_REHABILITACION, CHOOSEPT_VISITA, NHS_FISIOTERAPIA],
  },
  {
    slug: 'aparatologia',
    nombre: 'Aparatología',
    resumen: 'Equipos usados en fisioterapia, como TENS o ultrasonido terapéutico, para aliviar el dolor; los beneficios varían y no son para todos.',
    queEs: [
      'La aparatología reúne equipos que se usan como parte de la fisioterapia. El NHS menciona entre los tratamientos de la fisioterapia la TENS (estimulación nerviosa eléctrica transcutánea), que envía una corriente eléctrica débil a los nervios a través de parches sobre la piel, y el ultrasonido terapéutico.',
      'La evidencia es matizada. El NHS indica que la TENS no funciona para todos, y una revisión del Instituto Estadounidense de Ultrasonido en Medicina señala que el beneficio clínico del ultrasonido en fisioterapia es incierto, aunque el riesgo de daños como quemaduras se considera bajo cuando se aplica correctamente.',
    ],
    beneficios: [
      'La TENS se usa para aliviar el dolor de forma temporal, según el NHS.',
      'Se piensa que la TENS ayuda a liberar endorfinas y a bloquear las señales de dolor hacia el cerebro (NHS); no funciona para todos.',
      'El ultrasonido terapéutico usado en fisioterapia produce calor en tendones y músculos; su beneficio clínico es incierto (revisión del AIUM).',
      'El NHS los incluye entre los tratamientos de la fisioterapia, junto con el ejercicio, la terapia manual y los consejos para manejar los síntomas.',
    ],
    antes: [
      'Avisa si tienes epilepsia o un marcapasos: el NHS indica que la TENS no debe usarse en esos casos. Si estás en embarazo, solo se usa si lo indica un médico o una partera.',
      'Avisa si tienes la piel irritada, lastimada, infectada o con pérdida de sensibilidad en la zona.',
      'Si no sabes qué causa tu dolor, consulta con un profesional de salud antes de usar TENS (NHS).',
    ],
    despues: [
      'Durante la TENS deberías sentir un hormigueo, pero no dolor; si te duele, avísale al fisioterapeuta (NHS).',
      'Si la piel se pone con picazón, irritada o enrojecida, se debe apagar el equipo y retirar los parches (NHS); coméntalo con el fisioterapeuta.',
      'Un profesional puede orientarte sobre dónde colocar los parches y qué alternativas hay si tu piel reacciona (NHS).',
    ],
    contraindicaciones: [
      'La TENS no debe usarse en personas con epilepsia ni con marcapasos, y en el embarazo solo si lo indica un médico o una partera (NHS).',
      'Se evita colocarla sobre piel irritada, lastimada, infectada o sin sensibilidad (NHS).',
      'Tampoco se coloca en el cuello, la boca o los ojos, ni en el pecho y la espalda al mismo tiempo (NHS).',
      'La TENS no ayuda a todas las personas (NHS) y el ultrasonido terapéutico tiene un beneficio incierto; el fisioterapeuta valora si estos equipos son adecuados para ti.',
    ],
    preguntas: [
      {
        pregunta: '¿La TENS duele?',
        respuesta: 'No debería. Según el NHS, se sube la intensidad lentamente hasta sentir un hormigueo, y no debe doler.',
      },
      {
        pregunta: '¿Sirve para todos?',
        respuesta: 'No. El NHS señala que la TENS no funciona para todas las personas, y la revisión sobre ultrasonido terapéutico indica que su beneficio clínico es incierto.',
      },
      {
        pregunta: '¿Es seguro el ultrasonido terapéutico?',
        respuesta: 'La revisión del AIUM indica que el daño, como quemaduras, se considera bajo cuando se aplica correctamente. También recuerda que los pacientes deben ser informados de los riesgos y de los beneficios esperados.',
      },
    ],
    fuentes: [NHS_TENS, PMC_ULTRASONIDO, NHS_FISIOTERAPIA],
  },
];
