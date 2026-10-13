import type { Tratamiento } from '../tipos';

const ACOG_PELVICO = {
  sitio: 'ACOG',
  titulo: 'Pelvic Exams',
  url: 'https://www.acog.org/womens-health/faqs/pelvic-exams',
};
const ACOG_PRIMERA_VISITA = {
  sitio: 'ACOG',
  titulo: 'Your First Gynecologic Visit',
  url: 'https://www.acog.org/womens-health/faqs/your-first-gynecologic-visit',
};
const ACOG_PRENATAL = {
  sitio: 'ACOG',
  titulo: 'Prenatal Care',
  url: 'https://www.acog.org/womens-health/faqs/prenatal-care',
};
const ACOG_PRUEBAS_EMBARAZO = {
  sitio: 'ACOG',
  titulo: 'Routine Tests During Pregnancy',
  url: 'https://www.acog.org/womens-health/faqs/routine-tests-during-pregnancy',
};
const MEDLINE_PRENATAL = {
  sitio: 'MedlinePlus',
  titulo: 'Cuidado prenatal',
  url: 'https://medlineplus.gov/spanish/prenatalcare.html',
};
const OMS_PLANIFICACION = {
  sitio: 'Organización Mundial de la Salud',
  titulo: 'Family planning/contraception methods',
  url: 'https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception',
};
const MEDLINE_ANTICONCEPCION = {
  sitio: 'MedlinePlus',
  titulo: 'Control de la natalidad y contracepción',
  url: 'https://medlineplus.gov/spanish/birthcontrol.html',
};
const ACOG_TAMIZAJE = {
  sitio: 'ACOG',
  titulo: 'Cervical Cancer Screening',
  url: 'https://www.acog.org/womens-health/faqs/cervical-cancer-screening',
};
const MEDLINE_PAP = {
  sitio: 'MedlinePlus',
  titulo: 'Prueba de Papanicolaou',
  url: 'https://medlineplus.gov/spanish/ency/article/003911.htm',
};
const ACOG_COLPOSCOPIA = {
  sitio: 'ACOG',
  titulo: 'Colposcopy',
  url: 'https://www.acog.org/womens-health/faqs/Colposcopy',
};
const MEDLINE_COLPOSCOPIA = {
  sitio: 'MedlinePlus',
  titulo: 'Biopsia dirigida por colposcopia',
  url: 'https://medlineplus.gov/spanish/ency/article/003913.htm',
};

export const ginecologia: Tratamiento[] = [
  {
    slug: 'consulta-ginecologica',
    nombre: 'Consulta ginecológica',
    resumen: 'Visita con la ginecóloga para cuidar tu salud sexual y reproductiva: conversación, revisión y, si hace falta, examen pélvico.',
    queEs: [
      'La consulta ginecológica es una visita con una profesional especializada en la salud de la mujer. Sirve para hablar de tu salud sexual y reproductiva, resolver dudas y, cuando corresponde, hacer una revisión física.',
      'Según ACOG, el Colegio Estadounidense de Obstetras y Ginecólogos, conviene acudir al menos una vez al año a una consulta de control, aunque en ella no se haga examen pélvico. El examen pélvico se recomienda cuando hay síntomas o antecedentes que lo justifican, y en los demás casos se decide en conjunto con tu ginecóloga.',
    ],
    beneficios: [
      'Es un espacio para hablar de la regla, la sexualidad, los anticonceptivos o la planificación de un embarazo.',
      'Si tienes síntomas como sangrado anormal, flujo anormal, dolor pélvico o dolor en las relaciones sexuales, el examen puede ayudar a identificar la causa.',
      'El examen pélvico puede detectar de forma temprana condiciones tratables, como infecciones.',
      'Te permite conocer mejor tu cuerpo y recibir tranquilidad sobre tu salud sexual y reproductiva.',
    ],
    antes: [
      'Prepárate para responder preguntas sobre tu salud, tus antecedentes familiares y tu vida sexual; responder con sinceridad es clave para recibir una buena atención.',
      'Si te preocupa la confidencialidad, coméntalo antes de responder.',
      'Si algo del examen te inquieta o si has vivido situaciones que lo hagan difícil, díselo a la doctora: puede explicarte cada paso y ajustar el ritmo.',
      'Puedes pedir que haya una persona acompañante durante el examen, o ir con alguien de tu confianza.',
    ],
    despues: [
      'El examen pélvico suele durar pocos minutos.',
      'La doctora debería explicarte lo que encontró y, si hace falta, indicarte estudios o seguimiento.',
      'Si se tomó una muestra, como la de un Papanicolau, los resultados se conocen después y se te comunican.',
    ],
    contraindicaciones: [
      'No hace falta un examen pélvico para detectar infecciones de transmisión sexual, según ACOG.',
      'Tampoco hace falta para obtener anticonceptivos; la excepción es el DIU, para el que sí se hace.',
      'En la primera visita de adolescentes normalmente no se hace examen pélvico, salvo que haya problemas como sangrado anormal o dolor.',
      'Si sientes dolor durante el examen, avísale a la doctora de inmediato: puede hacerlo más cómodo, y puedes pedir que se detenga en cualquier momento.',
    ],
    preguntas: [
      {
        pregunta: '¿Duele el examen pélvico?',
        respuesta: 'Puede sentirse extraño, sobre todo si es la primera vez, y puede haber una molestia leve, pero no debería doler. Si duele, dilo en el momento: relajar el cuerpo y avisar a la doctora ayuda a que sea más cómodo.',
      },
      {
        pregunta: '¿Necesito un examen pélvico cada año?',
        respuesta: 'ACOG recomienda el examen pélvico cuando hay síntomas o antecedentes que lo requieren, y en los demás casos se decide en conjunto con tu ginecóloga. Lo que sí se aconseja es una consulta de control al menos una vez al año.',
      },
      {
        pregunta: '¿A qué edad conviene la primera visita?',
        respuesta: 'ACOG sugiere que la primera visita con un ginecólogo sea entre los 13 y los 15 años. Puede ser solo una conversación, sin examen pélvico.',
      },
    ],
    fuentes: [ACOG_PELVICO, ACOG_PRIMERA_VISITA],
  },
  {
    slug: 'obstetricia',
    nombre: 'Obstetricia',
    resumen: 'Atención médica durante el embarazo, el parto y el posparto, con un seguimiento adaptado a tu salud y al riesgo de tu embarazo.',
    queEs: [
      'La obstetricia es la rama de la medicina que cuida la salud de la mujer durante el embarazo, el parto y el periodo posterior al nacimiento. La atención la brindan obstetras-ginecólogos y, en embarazos de riesgo promedio, también otros profesionales como parteras o médicos de familia.',
      'Según ACOG, empezar el control temprano y mantenerlo con regularidad puede aumentar las probabilidades de tener un bebé sano, porque permite encontrar y manejar los problemas antes. Si tu embarazo es de mayor riesgo, puede ser necesario un seguimiento más frecuente o la valoración de un especialista en medicina materno-fetal.',
    ],
    beneficios: [
      'Acompañamiento médico durante el embarazo, con un plan pensado para ti.',
      'Posibilidad de encontrar y manejar los problemas de forma más temprana.',
      'Un espacio para resolver dudas sobre el embarazo, la salud del bebé y el parto.',
      'Pruebas de rutina que ayudan a encontrar condiciones que podrían aumentar el riesgo de complicaciones; muchas de ellas pueden tratarse durante el embarazo.',
    ],
    antes: [
      'Anota la fecha del primer día de tu última regla, porque ayuda a establecer la fecha probable de parto.',
      'Lleva una lista de los medicamentos, vitaminas y suplementos que tomas, y la información de tus enfermedades, cirugías y embarazos anteriores.',
      'Si necesitas ayuda con alimentación, transporte o apoyo para llegar a las citas, díselo a la doctora para planificar tu atención.',
    ],
    despues: [
      'La doctora debería indicarte cuándo es tu próxima visita; el calendario puede ajustarse según tu salud y el riesgo de tu embarazo.',
      'Los resultados de los análisis de sangre u orina se conocen después y se te comunican.',
      'Habla con tu equipo de salud antes de empezar o suspender cualquier medicamento durante el embarazo.',
    ],
    contraindicaciones: [
      'Si tienes una enfermedad previa o aparece una durante el embarazo, puedes necesitar visitas más frecuentes.',
      'Los embarazos de mayor riesgo pueden requerir derivación a un especialista en medicina materno-fetal.',
      'Si no estás protegida contra la rubéola, la vacuna triple viral no se recomienda durante el embarazo, porque contiene un virus vivo; la doctora te orientará.',
      'Tener 35 años o más también puede implicar visitas adicionales.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuándo conviene empezar el control del embarazo?',
        respuesta: 'Según ACOG, lo mejor es empezar en el primer trimestre; antes de las 10 semanas desde la última regla es lo ideal, aunque el momento real depende de cuándo te enteres del embarazo.',
      },
      {
        pregunta: '¿Qué profesional puede atenderme?',
        respuesta: 'Los obstetras-ginecólogos atienden la mayoría de los embarazos. En embarazos de riesgo promedio también pueden atender parteras o médicos de familia, y los de mayor riesgo pueden requerir a un especialista en medicina materno-fetal.',
      },
      {
        pregunta: '¿Qué análisis se hacen al inicio del embarazo?',
        respuesta: 'ACOG menciona análisis de sangre y orina de rutina, como hemograma, grupo sanguíneo y factor Rh, y pruebas para ciertas infecciones. Sirven para encontrar condiciones que podrían afectar el embarazo.',
      },
    ],
    fuentes: [ACOG_PRENATAL, ACOG_PRUEBAS_EMBARAZO],
  },
  {
    slug: 'planificacion-familiar',
    nombre: 'Planificación familiar',
    resumen: 'Orientación para elegir el método anticonceptivo que mejor se adapte a tu salud y a tus planes, con la guía de una profesional.',
    queEs: [
      'La planificación familiar te permite decidir si quieres tener hijos, cuándo y cuántos. Incluye la orientación sobre los distintos métodos anticonceptivos: medicamentos, dispositivos o cirugía que previenen el embarazo.',
      'Hay métodos reversibles y otros permanentes. Según la Organización Mundial de la Salud, los implantes, los DIU y la esterilización son muy eficaces y de larga duración; las píldoras, las inyecciones, los parches y los anillos funcionan bien si se usan correctamente. La mejor opción depende de tu salud, tus preferencias y tus necesidades.',
    ],
    beneficios: [
      'Te ayuda a decidir si quieres un embarazo y cuándo.',
      'Evitar embarazos no planificados reduce los riesgos de salud ligados al embarazo, según la OMS.',
      'Puedes conocer las opciones disponibles y elegir con información.',
      'Una profesional puede orientarte según tu salud y tus preferencias.',
    ],
    antes: [
      'Piensa si quieres tener hijos algún día y qué tan pronto.',
      'Anota tus afecciones de salud, porque influyen en la elección del método.',
      'Si necesitas también protección contra infecciones de transmisión sexual, coméntalo, porque no todos los métodos la ofrecen.',
      'Piensa si podrías usar el método correctamente cada vez; es uno de los factores a considerar.',
    ],
    despues: [
      'Los implantes los inserta un profesional de la salud en consulta, bajo la piel del brazo.',
      'La píldora se toma todos los días; el parche se cambia cada semana; la inyección se recibe cada tres meses en el consultorio.',
      'Algunos métodos son temporales y reversibles; la esterilización, en cambio, es permanente.',
    ],
    contraindicaciones: [
      'Ningún método sirve para todas las personas; la elección depende de tu salud y la doctora valorará cuáles son adecuados para ti.',
      'Solo los condones protegen además contra infecciones de transmisión sexual, incluido el VIH.',
      'La esterilización es permanente, por lo que no es adecuada si podrías querer tener hijos más adelante.',
      'Los métodos basados en el conocimiento de la fertilidad y el retiro tienen tasas de embarazo más altas que otros métodos.',
    ],
    preguntas: [
      {
        pregunta: '¿Los anticonceptivos causan infertilidad?',
        respuesta: 'Según la OMS, los métodos anticonceptivos modernos no causan infertilidad.',
      },
      {
        pregunta: '¿Qué hago si tuve una relación sin protección?',
        respuesta: 'Existe la anticoncepción de emergencia, que no es un método de uso regular. MedlinePlus menciona el DIU de cobre colocado por un profesional dentro de las 120 horas posteriores, o píldoras de emergencia tomadas lo antes posible. Consulta con un profesional de salud.',
      },
      {
        pregunta: '¿Qué método es el mejor?',
        respuesta: 'No hay uno mejor para todas las personas. MedlinePlus sugiere pensar si quieres tener hijos, tu estado de salud, la frecuencia de tus relaciones, la necesidad de protección contra infecciones y qué tan bien podrás usar el método cada vez.',
      },
    ],
    fuentes: [OMS_PLANIFICACION, MEDLINE_ANTICONCEPCION],
  },
  {
    slug: 'control-prenatal',
    nombre: 'Control prenatal',
    resumen: 'Visitas periódicas durante el embarazo para vigilar tu salud y el crecimiento de tu bebé y encontrar a tiempo posibles problemas.',
    queEs: [
      'El control prenatal es la atención de salud que recibes durante el embarazo: consultas de control, pruebas y la posibilidad de resolver tus dudas. Lo realiza un obstetra o una partera.',
      'Según MedlinePlus, el cuidado regular ayuda a que tú y tu bebé se mantengan sanos hasta el nacimiento y permite encontrar problemas pronto, cuando el tratamiento a menudo puede resolverlos o prevenir complicaciones. ACOG añade que el plan puede adaptarse a tu riesgo de complicaciones.',
    ],
    beneficios: [
      'Permite encontrar problemas de salud de forma temprana.',
      'Se controlan periódicamente tu presión arterial, tu peso, el crecimiento del bebé y su latido.',
      'Puede aumentar las probabilidades de tener un bebé sano, según ACOG.',
      'Es una oportunidad para preguntar sobre alimentación, vitaminas prenatales, medicamentos y el parto.',
    ],
    antes: [
      'Anota la fecha del primer día de tu última regla, para ayudar a establecer la fecha probable de parto.',
      'Lleva la lista de medicamentos, vitaminas y suplementos que tomas, y tus antecedentes de salud, cirugías y embarazos anteriores.',
      'Responde con sinceridad a las preguntas; si te preocupa la confidencialidad, coméntalo antes.',
      'Si necesitas ayuda con alimentación, transporte o apoyo para acudir a las citas, dilo: influye en tu salud durante el embarazo.',
    ],
    despues: [
      'Agenda la siguiente cita según lo que te indique la doctora; la frecuencia depende de tu salud y de la etapa del embarazo.',
      'Los resultados de análisis de sangre u orina se conocen después y, si hace falta, se piden más pruebas.',
      'Consulta con tu profesional antes de empezar o suspender cualquier medicamento: algunos pueden dañar al bebé.',
      'Evitar tabaco, alcohol y drogas protege tu salud y la de tu bebé, según MedlinePlus.',
    ],
    contraindicaciones: [
      'Si tienes una condición previa como diabetes o presión alta, o si tienes 35 años o más, puedes necesitar más visitas.',
      'Si aparece una complicación o tu embarazo es de mayor riesgo, puede ser necesario atenderte con un obstetra o un especialista en medicina materno-fetal.',
      'La vacuna triple viral no se recomienda durante el embarazo, porque contiene un virus vivo; la doctora valorará tu caso si no eres inmune a la rubéola.',
    ],
    preguntas: [
      {
        pregunta: '¿Cada cuánto son las visitas?',
        respuesta: 'MedlinePlus describe un esquema habitual de visitas mensuales hasta la semana 28, cada dos semanas de la 28 a la 36, y semanales después, con más visitas si hay mayor riesgo. ACOG indica que hoy el calendario puede adaptarse a cada persona, así que la doctora te dirá el tuyo.',
      },
      {
        pregunta: '¿Qué pasa en la primera visita?',
        respuesta: 'Suele ser la más larga: se revisan tus antecedentes, se hace un examen físico, que puede incluir examen pélvico y Papanicolau, se miden presión, peso y talla, y se revisan los análisis.',
      },
      {
        pregunta: '¿Cuándo debo empezar?',
        respuesta: 'Según ACOG, lo mejor es comenzar en el primer trimestre; antes de las 10 semanas desde la última regla es lo ideal.',
      },
    ],
    fuentes: [MEDLINE_PRENATAL, ACOG_PRENATAL],
  },
  {
    slug: 'papanicolau',
    nombre: 'Papanicolau',
    resumen: 'Prueba rápida que toma células del cuello del útero para detectar cambios que podrían derivar en cáncer cervical.',
    queEs: [
      'El Papanicolau (Pap) es una prueba que busca cambios en las células del cuello del útero que podrían convertirse en cáncer cervical. Con un cepillo pequeño se toma una muestra de células, que se envía al laboratorio.',
      'La mayoría de los casos de cáncer cervical los causa el virus del papiloma humano (VPH). Según ACOG, los cambios de alto grado suelen tardar entre 3 y 7 años en convertirse en cáncer, por lo que el tamizaje permite encontrarlos antes y tratarlos. Un resultado anormal no significa que tengas cáncer.',
    ],
    beneficios: [
      'Permite encontrar cambios celulares antes de que se conviertan en cáncer.',
      'Es una prueba sencilla y rápida.',
      'Si los cambios son leves, se puede hacer seguimiento; si son de alto grado, se pueden tratar.',
      'La mayoría de los cánceres de cuello uterino pueden prevenirse con tamizaje regular, según MedlinePlus.',
    ],
    antes: [
      'Evita durante los 2 días previos las duchas vaginales y los medicamentos o productos vaginales, que pueden alterar la muestra.',
      'MedlinePlus indica evitar además tampones y relaciones sexuales durante las 24 horas previas.',
      'Lo mejor es programarla fuera de tu regla; puede hacerse durante ella, pero se prefiere otra fecha. Si tienes sangrado inesperado, consulta: la doctora decidirá si se puede hacer.',
      'Avisa si ya tuviste un resultado anormal o una prueba de VPH positiva, o si estás o podrías estar embarazada.',
    ],
    despues: [
      'Puedes sentir una molestia leve, parecida a un cólico, y algo de presión; después puede haber sangrado ligero.',
      'Los resultados llegan después, desde el laboratorio.',
      'Si el resultado es normal, se recomienda repetir la prueba según el intervalo que te indique la doctora: no es 100 % exacta y el cáncer cervical se desarrolla lentamente.',
      'Un resultado anormal suele requerir otras pruebas, como repetir el Pap, una prueba de VPH o una colposcopía.',
    ],
    contraindicaciones: [
      'ACOG no recomienda el tamizaje antes de los 21 años: en ese grupo no reduce el cáncer cervical y puede llevar a tratamientos innecesarios.',
      'Entre los 21 y los 29 años, ACOG recomienda un Pap cada 3 años; entre los 30 y los 65, una prueba de VPH cada 5 años o una prueba conjunta (Pap y VPH) cada 5 años.',
      'Después de los 65 años puede suspenderse solo si hubo tamizaje regular con resultados normales y no hay antecedente de cambios moderados o graves ni de cáncer; la doctora lo valorará.',
      'Tras una histerectomía, el tamizaje puede seguir siendo necesario si se conservó el cuello uterino o si antes hubo cambios de alto grado o cáncer.',
      'Si estás con la regla, se prefiere reprogramarla para otra fecha.',
    ],
    preguntas: [
      {
        pregunta: '¿Duele?',
        respuesta: 'La mayoría de las personas sienten una molestia leve, similar a un cólico, y algo de presión. Después puede haber un sangrado ligero.',
      },
      {
        pregunta: '¿Un resultado anormal significa cáncer?',
        respuesta: 'No. ACOG explica que es común tener resultados anormales y que los cambios celulares a menudo vuelven a la normalidad solos. Se necesitan más pruebas para saber si hay cambios de alto grado.',
      },
      {
        pregunta: '¿Si me vacuné contra el VPH, igual necesito la prueba?',
        respuesta: 'Sí. La vacuna protege contra los tipos de VPH más comunes que causan cáncer, pero no contra todos, así que se mantienen las recomendaciones de tamizaje para tu edad.',
      },
    ],
    fuentes: [ACOG_TAMIZAJE, MEDLINE_PAP],
  },
  {
    slug: 'colposcopia',
    nombre: 'Colposcopía',
    resumen: 'Examen del cuello del útero con una lente de aumento para estudiar con más detalle un resultado anormal, con biopsia si hace falta.',
    queEs: [
      'La colposcopía es un examen en el que la ginecóloga observa el cuello del útero, la vagina y la vulva con un instrumento que aumenta la imagen, llamado colposcopio. Permite ver problemas que no se notan a simple vista.',
      'Se hace cuando un examen de tamizaje, como el Papanicolau o la prueba de VPH, muestra cambios anormales. Si se ven zonas anormales, la doctora puede tomar una pequeña muestra de tejido (biopsia) para estudiarla en el laboratorio.',
    ],
    beneficios: [
      'Ofrece más información sobre las células anormales detectadas en un examen de tamizaje.',
      'Permite tomar una biopsia dirigida de las zonas que se ven anormales.',
      'También sirve para estudiar otros problemas, como cambios en la vulva, inflamación del cuello uterino o crecimientos benignos.',
      'Puede usarse para comprobar el resultado de un tratamiento.',
    ],
    antes: [
      'Lo ideal es hacerla cuando no tienes la regla; si tienes sangrado anormal, o es el inicio o el final de la regla, puede mantenerse la cita.',
      'Durante las 24 horas previas no uses duchas vaginales, no coloques nada en la vagina ni tengas relaciones sexuales.',
      'Avisa si estás o podrías estar embarazada.',
      'Vaciar la vejiga y el intestino antes ayuda a sentirte más cómoda; pregunta a la doctora si puedes tomar un analgésico antes y cuál.',
    ],
    despues: [
      'Si no hubo biopsia, normalmente te sientes bien enseguida y puede haber un poco de manchado vaginal unos días.',
      'Si hubo biopsia, puede haber dolor leve uno o dos días, y sangrado y flujo oscuro durante unos días; puedes usar una toalla sanitaria.',
      'No pongas nada en la vagina (tampones, duchas, cremas) ni tengas relaciones sexuales durante el tiempo que te indique la doctora; MedlinePlus menciona alrededor de una semana.',
      'Llama de inmediato a la doctora si tienes sangrado abundante, dolor intenso en la parte baja del abdomen, fiebre, mal olor o secreción inusual, o sangrado de más de 2 semanas.',
    ],
    contraindicaciones: [
      'Se prefiere evitar la regla abundante; en ese caso conviene reprogramar la cita, salvo que tengas sangrado anormal.',
      'Si estás o podrías estar embarazada, avísalo antes del examen: la doctora lo tendrá en cuenta.',
    ],
    preguntas: [
      {
        pregunta: '¿Duele?',
        respuesta: 'Puede resultar incómoda: la colocación del espéculo, la solución que se aplica puede arder levemente y cada toma de biopsia puede sentirse como un pellizco o un cólico. Respirar lenta y profundamente ayuda a relajarse, y puedes ir acompañada de alguien.',
      },
      {
        pregunta: '¿Afecta mi fertilidad o un futuro embarazo?',
        respuesta: 'Según MedlinePlus, el procedimiento no dificulta quedar embarazada ni causa complicaciones en el embarazo.',
      },
      {
        pregunta: '¿Un resultado anormal es cáncer?',
        respuesta: 'No necesariamente. La colposcopía sirve para estudiar con más detalle un resultado de tamizaje anormal; si se toma una biopsia, el laboratorio la analiza y la doctora te explicará los siguientes pasos.',
      },
    ],
    fuentes: [ACOG_COLPOSCOPIA, MEDLINE_COLPOSCOPIA],
  },
];
