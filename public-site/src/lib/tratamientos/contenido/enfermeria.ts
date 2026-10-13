import type { Tratamiento } from '../tipos';

const MEDLINE_HERIDAS = {
  sitio: 'MedlinePlus',
  titulo: 'How wounds heal',
  url: 'https://medlineplus.gov/ency/patientinstructions/000741.htm',
};
const NHS_HERIDAS = {
  sitio: 'NHS',
  titulo: 'Cuts and grazes',
  url: 'https://www.nhs.uk/conditions/cuts-and-grazes/',
};
const MEDLINE_PRESION_PRUEBA = {
  sitio: 'MedlinePlus',
  titulo: 'Measuring Blood Pressure',
  url: 'https://medlineplus.gov/lab-tests/measuring-blood-pressure',
};
const MEDLINE_PRESION_ENCICLOPEDIA = {
  sitio: 'MedlinePlus',
  titulo: 'Blood pressure measurement',
  url: 'https://medlineplus.gov/ency/article/007490.htm',
};
const NHS_PRESION = {
  sitio: 'NHS',
  titulo: 'High blood pressure (hypertension)',
  url: 'https://www.nhs.uk/conditions/high-blood-pressure-hypertension/',
};
const MEDLINE_IMC = {
  sitio: 'MedlinePlus',
  titulo: 'Body mass index',
  url: 'https://medlineplus.gov/ency/article/007196.htm',
};
const CDC_IMC = {
  sitio: 'CDC',
  titulo: 'About Body Mass Index (BMI)',
  url: 'https://www.cdc.gov/bmi/about/index.html',
};
const MEDLINE_GLUCOSA = {
  sitio: 'MedlinePlus',
  titulo: 'Blood Glucose Test',
  url: 'https://medlineplus.gov/lab-tests/blood-glucose-test/',
};
const NHS_HIPOGLUCEMIA = {
  sitio: 'NHS',
  titulo: 'Low blood sugar (hypoglycaemia)',
  url: 'https://www.nhs.uk/conditions/low-blood-sugar-hypoglycaemia/',
};
const NHS_HIPERGLUCEMIA = {
  sitio: 'NHS',
  titulo: 'High blood sugar (hyperglycaemia)',
  url: 'https://www.nhs.uk/conditions/high-blood-sugar-hyperglycaemia/',
};
const CDC_GLUCOSA = {
  sitio: 'CDC',
  titulo: 'Diabetes Testing',
  url: 'https://www.cdc.gov/diabetes/diabetes-testing/index.html',
};
const CLEVELAND_SUEROS = {
  sitio: 'Cleveland Clinic',
  titulo: 'IV Fluids (Intravenous Fluids): Types & Uses',
  url: 'https://my.clevelandclinic.org/health/treatments/21635-iv-fluids',
};
const CLEVELAND_VITAMINAS_IV = {
  sitio: 'Cleveland Clinic',
  titulo: 'Intravenous Vitamin Infusion Pros & Cons',
  url: 'https://health.clevelandclinic.org/iv-vitamin-therapy',
};
const MEDLINE_INTRAMUSCULAR = {
  sitio: 'MedlinePlus',
  titulo: 'Giving an IM (intramuscular) injection',
  url: 'https://medlineplus.gov/ency/patientinstructions/000935.htm',
};

export const enfermeria: Tratamiento[] = [
  {
    slug: 'curaciones',
    nombre: 'Curaciones',
    resumen: 'Limpieza y cobertura de heridas para protegerlas mientras cicatrizan y vigilar a tiempo señales de infección.',
    queEs: [
      'Una curación es el cuidado de una herida: limpiarla y cubrirla mientras el cuerpo la repara. Para una herida menor, MedlinePlus indica limpiarla con agua y jabón suave y cubrirla con un vendaje estéril; para una herida mayor, hay que seguir las indicaciones del profesional de salud que la atiende.',
      'Las fuentes consultadas describen sobre todo heridas menores. Si tu herida es grande, profunda, o viene de una cirugía o de una enfermedad como la diabetes, el equipo de enfermería seguirá las indicaciones de tu médico.',
    ],
    beneficios: [
      'Mantener la herida limpia y cubierta ayuda a protegerla mientras cicatriza (MedlinePlus).',
      'Permite detectar a tiempo señales de infección, como enrojecimiento, más dolor o pus (MedlinePlus, NHS).',
      'Permite vigilar cómo evoluciona la cicatrización, que pasa por etapas: coagulación, inflamación, reconstrucción del tejido y formación de la cicatriz (MedlinePlus).',
      'El personal puede explicarte cómo cuidar la herida en casa y qué señales deben llevarte a consultar de nuevo.',
    ],
    antes: [
      'Cuéntale al personal si tienes diabetes, mala circulación, si fumas o si tomas medicamentos como corticoides o antiinflamatorios: MedlinePlus los menciona entre los factores que pueden hacer más lenta la cicatrización.',
      'Si la herida sangra, el NHS indica presionar con un paño o vendaje limpio y, si llega a empapar, agregar otra capa encima sin quitar la primera.',
      'Si la herida tiene tierra o cuerpos extraños dentro, no los saques: el NHS indica presionar firmemente a los lados y buscar atención.',
    ],
    despues: [
      'Mantén la herida limpia y seca, y no te rasques ni arranques la costra (MedlinePlus).',
      'No apliques nada sobre una cicatriz, como vitamina E o vaselina, sin preguntarle antes a tu médico: no está demostrado que prevengan o disminuyan las cicatrices (MedlinePlus).',
      'Vigila señales de infección: enrojecimiento, más dolor, pus amarillo o verde o líquido claro en exceso (MedlinePlus); también hinchazón y sentirte mal o tener fiebre (NHS).',
      'Busca atención de inmediato si el sangrado continúa tras 10 minutos de presión directa, si aparecen bordes negros en la herida, si tienes fiebre de 37,7 °C (100 °F) o más durante más de 4 horas, o si los puntos se sueltan o la herida se reabre (MedlinePlus).',
    ],
    contraindicaciones: [
      'No es una herida para curar en casa: sangrado que no se detiene o es a chorros, pérdida de sensibilidad o dificultad para mover la zona, herida en la cara o en la palma de la mano, herida muy grande o profunda, o un objeto clavado. El NHS indica llamar a emergencias o ir a urgencias.',
      'Pide atención médica pronto si la herida tiene tierra, pus o líquido corporal, sigue sucia tras limpiarla, está hinchada o roja, duele cada vez más, mide más de unos 5 cm, fue una mordedura de persona o de animal salvaje o callejero, o te sientes mal o con fiebre (NHS).',
      'Tras evaluar la herida, el médico puede indicar puntos, pegamento o tiras de cierre, y a veces vacuna antitetánica o antibióticos (NHS).',
    ],
    preguntas: [
      {
        pregunta: '¿Cuánto tarda en cicatrizar una herida?',
        respuesta: 'MedlinePlus describe etapas: la coagulación ocurre en minutos, la inflamación dura de unos 2 a 5 días, la reconstrucción del tejido unas 3 semanas y la cicatriz puede seguir cambiando hasta 2 años. Los tiempos varían según la herida y la persona.',
      },
      {
        pregunta: '¿Cómo sé si mi herida se infectó?',
        respuesta: 'MedlinePlus menciona enrojecimiento, más dolor, pus amarillo o verde y exceso de líquido claro; el NHS suma hinchazón, fiebre o sentirte mal. Si los notas, consulta pronto.',
      },
      {
        pregunta: '¿Puedo mojar la curación?',
        respuesta: 'El NHS indica mantener el apósito limpio y seco, usando uno impermeable o cambiándolo cuantas veces haga falta. Pregunta a la enfermera qué te conviene según tu herida.',
      },
    ],
    fuentes: [MEDLINE_HERIDAS, NHS_HERIDAS],
  },
  {
    slug: 'control-presion-arterial',
    nombre: 'Control de presión arterial',
    resumen: 'Medición rápida con un brazalete para conocer tu presión; la doctora interpreta los valores y decide si hace falta repetirla.',
    queEs: [
      'El control de presión arterial mide la fuerza con la que la sangre empuja las paredes de las arterias. Se hace con un brazalete en la parte superior del brazo que se infla y se desinfla lentamente. Se registran dos números: la presión sistólica (el primero, más alto) y la diastólica (el segundo).',
      'Un solo valor no basta para diagnosticar: según MedlinePlus, el diagnóstico de presión alta suele requerir dos o más lecturas altas en días diferentes. La doctora interpreta los resultados y decide cada cuánto controlarte.',
    ],
    beneficios: [
      'Es una prueba rápida: dura aproximadamente un minuto (MedlinePlus).',
      'Permite detectar presión alta, que habitualmente no causa síntomas (NHS).',
      'Si un valor sale alto, el NHS señala que pueden pedirte medirla en casa durante unos días, repetirla en consulta o usar un monitor portátil durante 24 horas para confirmarlo.',
    ],
    antes: [
      'Evita el ejercicio, el alcohol, el tabaco y la cafeína al menos 30 minutos antes (MedlinePlus).',
      'Ve al baño antes de la medición y descansa unos 5 minutos en posición sentada (MedlinePlus).',
      'Siéntate con la espalda apoyada, las piernas sin cruzar, los pies planos en el piso y el brazo a la altura del corazón, con la manga recogida y sin que apriete.',
      'Avisa al personal qué medicamentos tomas, porque algunos pueden influir en los resultados (MedlinePlus).',
    ],
    despues: [
      'Durante el inflado puedes sentir una ligera molestia en el brazo (MedlinePlus).',
      'Si te mides en casa, MedlinePlus sugiere tomar dos o tres lecturas con un minuto de diferencia, en posición sentada, y anotar la hora.',
      'La doctora interpreta los valores. Las guías usan cifras distintas: MedlinePlus (guía de EE. UU.) considera normal menos de 120/80 y presión alta desde 130/80, mientras que el NHS (Reino Unido) sugiere presión alta con 140/90 o más en consulta y 135/85 o más en casa. Las cifras que se aplican a ti las define la doctora.',
      'Si tomas la presión en casa, comparte las lecturas con tu médico antes de hacer cambios (MedlinePlus).',
    ],
    contraindicaciones: [
      'Si acabas de hacer ejercicio, tomar café, fumar o comer, o estás con estrés, la lectura puede salir alterada; conviene esperar y descansar antes de medirte (MedlinePlus).',
      'Busca atención de inmediato si tu presión es mayor de 180/120 mm Hg (cifra de MedlinePlus), o si tienes dolor de pecho, falta de aire, dolor de espalda, adormecimiento o debilidad, dificultad para hablar o cambios en la vista.',
      'Una presión baja (90/60 o menos, según MedlinePlus) requiere atención inmediata si viene con confusión, pulso débil y rápido o piel fría.',
      'Una mala técnica o un monitor inexacto pueden dar lecturas falsas (MedlinePlus); si dudas de tu medición, coméntalo con el personal.',
    ],
    preguntas: [
      {
        pregunta: '¿Un valor alto significa que tengo hipertensión?',
        respuesta: 'No necesariamente. MedlinePlus indica que el diagnóstico suele requerir dos o más lecturas altas en días diferentes. La doctora decidirá si hay que repetirla o seguirla en casa.',
      },
      {
        pregunta: '¿Con qué frecuencia debo controlarme?',
        respuesta: 'Según MedlinePlus, al menos una vez al año en adultos de 40 años o más y en personas con mayor riesgo. La doctora puede indicarte otra frecuencia según tu caso.',
      },
      {
        pregunta: '¿Duele?',
        respuesta: 'Según MedlinePlus, solo se siente una ligera molestia cuando el brazalete llega a su máximo de inflado.',
      },
    ],
    fuentes: [MEDLINE_PRESION_PRUEBA, MEDLINE_PRESION_ENCICLOPEDIA, NHS_PRESION],
  },
  {
    slug: 'control-peso-talla',
    nombre: 'Control de peso y talla',
    resumen: 'Medición de tu peso y tu estatura para calcular el índice de masa corporal (IMC) y seguir cambios en el tiempo.',
    queEs: [
      'El control de peso y talla consiste en medir cuánto pesas y cuánto mides. Con esos dos datos se calcula el índice de masa corporal (IMC): el peso en kilogramos dividido entre la estatura en metros al cuadrado.',
      'El IMC es una herramienta de tamizaje rápida y sencilla, pero no mide directamente la grasa corporal ni sirve como diagnóstico por sí sola, según los CDC. Se interpreta junto con tu historia de salud, el examen físico y, si hace falta, análisis de laboratorio.',
    ],
    beneficios: [
      'Es una forma rápida y de bajo costo de orientar si tu peso es adecuado para tu estatura (CDC).',
      'Seguir tu IMC en el tiempo permite notar si has ganado o perdido peso (CDC).',
      'Aporta datos para que la doctora valore, junto con otros factores, tu riesgo de enfermedades crónicas (CDC).',
      'En adultos, a veces se complementa con la medida de la cintura (MedlinePlus).',
    ],
    antes: [
      'Si ya tienes mediciones anteriores, llévalas: ver cómo cambian con el tiempo es parte de la valoración (CDC).',
      'Comenta si eres una persona muy musculosa, si tienes 65 años o más o si el control es para un niño o adolescente: el IMC puede interpretarse distinto en estos casos.',
    ],
    despues: [
      'La doctora interpreta el resultado junto con tu historia de salud, tu examen físico y tus análisis (CDC).',
      'El IMC no es un diagnóstico por sí solo. En adultos, el personal también puede usar la medida de la cintura o la relación cintura-cadera (MedlinePlus).',
      'Si la doctora lo indica, se repite la medición en el tiempo para seguir la tendencia.',
    ],
    contraindicaciones: [
      'En niños y adolescentes no se usa la calculadora de adultos: los CDC interpretan el IMC como un percentil según sexo y edad (de 2 a 19 años), y MedlinePlus indica no usar su tabla en niños.',
      'En personas muy musculosas el IMC puede salir alto sin que haya exceso de grasa, porque el músculo pesa más que la grasa (MedlinePlus).',
      'En personas de 65 años o más, los valores saludables pueden ser distintos, según MedlinePlus.',
    ],
    preguntas: [
      {
        pregunta: '¿Qué es el IMC?',
        respuesta: 'Es un número que resulta de dividir tu peso en kilogramos entre tu estatura en metros al cuadrado. Los CDC lo describen como una herramienta de tamizaje, no como un diagnóstico.',
      },
      {
        pregunta: '¿Un IMC alto significa que tengo una enfermedad?',
        respuesta: 'No por sí solo. MedlinePlus explica que no predice el riesgo de salud por sí mismo y los CDC indican que se interpreta junto con otros datos clínicos. La doctora te explicará qué significa en tu caso.',
      },
      {
        pregunta: '¿Sirve para niños?',
        respuesta: 'Se interpreta de otra forma. Los CDC lo ubican como percentil para el sexo y la edad en niños y adolescentes de 2 a 19 años, y MedlinePlus indica preguntar al médico del niño cuál es el peso adecuado para su edad.',
      },
    ],
    fuentes: [MEDLINE_IMC, CDC_IMC],
  },
  {
    slug: 'glicemia-capilar',
    nombre: 'Glicemia capilar',
    resumen: 'Medición del azúcar en sangre con una gota obtenida del dedo; la doctora interpreta el valor y decide si hacen falta más análisis.',
    queEs: [
      'La glicemia capilar mide la glucosa (azúcar) en una gota de sangre. Con una lanceta se pincha el dedo, la gota se aplica sobre una tira reactiva y se lee en un medidor electrónico pequeño (MedlinePlus).',
      'Esta medición no es una prueba diagnóstica por sí sola: la doctora interpreta tu resultado y, si hace falta, pide análisis de laboratorio. Los CDC indican que un resultado obtenido en una farmacia o feria de salud debe consultarse con un médico, que puede repetir la prueba para confirmar que es exacto.',
    ],
    beneficios: [
      'Es una prueba sencilla: solo requiere una gota de sangre del dedo (MedlinePlus).',
      'Se usa para vigilar la glucosa de personas con diabetes, cuyo médico define con qué frecuencia medirla (MedlinePlus).',
      'Ayuda a identificar la causa de síntomas de glucosa alta o baja (MedlinePlus).',
    ],
    antes: [
      'Pregunta si necesitas ayuno. Para las pruebas de laboratorio de glucosa en ayunas, MedlinePlus indica no comer ni beber nada salvo agua por al menos 8 horas; otras pruebas no lo requieren. Cada caso depende del motivo de la prueba.',
      'Si tienes diabetes o tomas medicamentos para controlar la glucosa, avísale al personal.',
      'Comenta si tienes síntomas en este momento, por ejemplo temblor, sudor, mareo, hambre intensa, sed o visión borrosa.',
    ],
    despues: [
      'La doctora interpreta el resultado y decide si necesitas repetirlo o hacerte un análisis en laboratorio (MedlinePlus, CDC).',
      'Como referencia, los CDC (EE. UU.) usan estas cifras para una prueba de sangre en laboratorio hecha tras un ayuno nocturno: normal hasta 99 mg/dL, prediabetes de 100 a 125 mg/dL y diabetes desde 126 mg/dL. No son cifras para leer en un glucómetro: tu médico interpreta los valores de tu medidor.',
      'Si estás con tratamiento para la diabetes, sigue las indicaciones de tu médico según el resultado.',
    ],
    contraindicaciones: [
      'Si tienes síntomas de azúcar baja (hambre, mareo, sudor, temblor, labios con hormigueo, visión borrosa, confusión), no esperes a la cita: avisa de inmediato al personal. El NHS indica tomar de inmediato azúcar de acción rápida y volver a medir a los 10-15 minutos; define como baja una glucosa menor de 4 mmol/L, una unidad usada en el Reino Unido.',
      'Busca ayuda de emergencia si hay pérdida de conocimiento, convulsión o si la persona no responde con normalidad: no se le debe dar nada por la boca (NHS).',
      'Si hay señales de azúcar alta con náuseas, vómitos, dolor de estómago, respiración o latidos más rápidos, somnolencia, aliento con olor a fruta o confusión, el NHS indica acudir a urgencias.',
    ],
    preguntas: [
      {
        pregunta: '¿Para qué se usa?',
        respuesta: 'MedlinePlus menciona la detección de prediabetes y diabetes, la búsqueda de la causa de síntomas de glucosa alta o baja y el seguimiento de personas con diabetes, que se miden en casa con un medidor.',
      },
      {
        pregunta: '¿Tengo que ir en ayunas?',
        respuesta: 'Depende del motivo de la prueba. MedlinePlus indica que algunas pruebas de glucosa requieren ayuno de al menos 8 horas y otras no. Consulta al personal al agendar.',
      },
      {
        pregunta: '¿Un valor alto significa que tengo diabetes?',
        respuesta: 'No necesariamente. Esta medición la interpreta la doctora, y los CDC indican que ante un resultado de farmacia o feria de salud el médico puede repetir la prueba para confirmar su exactitud.',
      },
    ],
    fuentes: [MEDLINE_GLUCOSA, CDC_GLUCOSA, NHS_HIPOGLUCEMIA, NHS_HIPERGLUCEMIA],
  },
  {
    slug: 'sueros',
    nombre: 'Sueros',
    resumen: 'Administración de líquidos por la vena, siempre con prescripción médica, para tratar deshidratación u otras indicaciones.',
    queEs: [
      'Los sueros son líquidos preparados que se administran por la vena, con prescripción médica, para prevenir o tratar la deshidratación y los desequilibrios de electrolitos. También pueden servir para administrar medicamentos o nutrición, según Cleveland Clinic.',
      'El médico elige el tipo de líquido, la cantidad y la velocidad según tu peso, tu edad y tus condiciones médicas. Sobre los sueros “vitamínicos” o de bienestar, Cleveland Clinic indica que la evidencia para uso general es limitada, que no deben verse como una cura milagrosa y que no reemplazan una buena alimentación, el sueño ni el ejercicio.',
    ],
    beneficios: [
      'Tratan la deshidratación, por ejemplo la causada por vómitos, diarrea, calor intenso o ejercicio sin suficiente líquido (Cleveland Clinic).',
      'Pueden mejorar los síntomas con rapidez cuando están indicados (Cleveland Clinic).',
      'Sirven también para administrar medicamentos o nutrición por vía intravenosa.',
      'Mientras dura la infusión, el personal vigila la línea y el ingreso de líquido.',
    ],
    antes: [
      'Trae tu receta médica: el suero se administra solo con prescripción.',
      'Cuéntale al personal si tienes enfermedad del corazón, presión alta, enfermedad de los riñones o estás en embarazo: Cleveland Clinic recomienda evitar o tener cautela con la terapia intravenosa de vitaminas en esos casos.',
      'Informa los medicamentos que tomas: la terapia intravenosa puede tener interacciones con ellos.',
      'Si tienes dudas sobre qué contiene tu suero, pregunta: Cleveland Clinic aconseja informarse sobre cómo se formula y quién lo supervisa.',
    ],
    despues: [
      'Mucha gente no necesita tiempo de recuperación ni restricciones; otras personas pueden requerir reposo o tratamiento según la causa de la deshidratación (Cleveland Clinic).',
      'Avisa si el líquido pasa demasiado rápido o lento, si hay molestia en el sitio de la vía, si la aguja se afloja, o si tienes dolor de cabeza o dificultad para respirar (Cleveland Clinic).',
      'Puede aparecer un moretón en la zona de la vía, que suele resolverse en unas semanas; en caso de infección del sitio, consulta (Cleveland Clinic).',
    ],
    contraindicaciones: [
      'No se administran sueros “vitamínicos” o de bienestar sin indicación médica: Cleveland Clinic señala que la efectividad como herramienta general de bienestar es incierta y que implican riesgos como infección o moretones en el sitio, toxicidad por exceso de vitaminas, embolia e interacciones con medicamentos.',
      'Cleveland Clinic aconseja evitar o tener cautela con la terapia intravenosa de vitaminas si hay enfermedad del corazón, presión alta, enfermedad renal o embarazo.',
      'Un exceso de líquido puede causar dolor de cabeza, presión alta y dificultad para respirar; suele resolverse al ajustar el suero, pero puede ser peligroso (Cleveland Clinic).',
    ],
    preguntas: [
      {
        pregunta: '¿Necesito receta para un suero?',
        respuesta: 'En la clínica, los sueros se administran siempre con prescripción médica. Trae tu receta al agendar o a la cita.',
      },
      {
        pregunta: '¿Un suero me da más energía o refuerza mis defensas?',
        respuesta: 'Cleveland Clinic indica que la evidencia sobre beneficios generales es limitada y que todavía faltan estudios de calidad. No debe tomarse como una cura milagrosa.',
      },
      {
        pregunta: '¿Duele ponerme un suero?',
        respuesta: 'El personal limpia la piel, coloca una aguja estéril en la vena y puedes sentir un pinchazo breve, según Cleveland Clinic.',
      },
    ],
    fuentes: [CLEVELAND_SUEROS, CLEVELAND_VITAMINAS_IV],
  },
  {
    slug: 'inyectables',
    nombre: 'Inyectables',
    resumen: 'Aplicación de medicamentos con jeringa, como la inyección en el músculo, siempre con prescripción médica y por personal capacitado.',
    queEs: [
      'Los inyectables son medicamentos que se aplican con una jeringa. Una de las vías es la intramuscular, que consiste en inyectar el medicamento en un músculo; MedlinePlus explica que algunos medicamentos deben ir al músculo para funcionar correctamente.',
      'En NovagED los inyectables se aplican siempre con prescripción médica. Qué medicamento, qué dosis y qué vía corresponden lo define quien lo receta.',
    ],
    beneficios: [
      'Permite administrar medicamentos que necesitan llegar al músculo para actuar bien (MedlinePlus).',
      'Hay varias zonas posibles para la inyección intramuscular, de modo que se puede elegir la más adecuada según tu edad y el tamaño del músculo (MedlinePlus).',
      'Si necesitas inyecciones repetidas, el sitio puede variarse para no usar siempre el mismo (MedlinePlus).',
    ],
    antes: [
      'Trae tu receta médica: los inyectables se aplican solo con prescripción.',
      'Verifica con el personal que el medicamento y la dosis coincidan con lo que te recetaron; confirmarlo es el primer paso que describe MedlinePlus.',
      'Pregunta lo que necesites sobre el medicamento o la zona donde se aplicará.',
    ],
    despues: [
      'Después de la inyección se presiona el sitio con una bolita de algodón (MedlinePlus).',
      'Contacta a tu médico si aparece fiebre o malestar después de la inyección, o si un bulto, un moretón o una hinchazón en el sitio no desaparece (MedlinePlus).',
      'Si aparecen sarpullido, picazón intensa, dificultad para respirar o hinchazón de la boca, los labios o la cara, MedlinePlus indica llamar de inmediato a emergencias.',
      'Si necesitas más dosis, el sitio de aplicación debe cambiar y no ser siempre el mismo (MedlinePlus).',
    ],
    contraindicaciones: [
      'Las contraindicaciones dependen de cada medicamento; las valora el médico que lo receta y el personal de enfermería antes de aplicarlo.',
      'El sitio se adapta a la persona: MedlinePlus indica evitar el brazo si el músculo es muy pequeño o la persona es muy delgada, y no usar la zona de los glúteos en niños menores de 3 años.',
      'Si hay reacciones alérgicas como sarpullido, picazón intensa, dificultad para respirar o hinchazón de boca, labios o cara después de una inyección, se necesita atención de emergencia (MedlinePlus).',
    ],
    preguntas: [
      {
        pregunta: '¿Necesito receta para un inyectable?',
        respuesta: 'En la clínica, los inyectables se aplican siempre con prescripción médica. Trae tu receta.',
      },
      {
        pregunta: '¿Dónde se aplica una inyección intramuscular?',
        respuesta: 'MedlinePlus menciona la parte media del muslo, la cadera, la parte superior del brazo y el cuadrante superior externo del glúteo. La elección depende de la edad y del tamaño del músculo.',
      },
      {
        pregunta: '¿Qué hago si el sitio de la inyección se hincha o aparece un bulto?',
        respuesta: 'MedlinePlus indica contactar a tu médico si un bulto, un moretón o una hinchazón en el sitio no desaparece, o si aparece fiebre o malestar.',
      },
    ],
    fuentes: [MEDLINE_INTRAMUSCULAR],
  },
];
