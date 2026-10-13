import type { Tratamiento } from '../tipos';

const CAHA_DECADA = {
  sitio: 'PubMed Central',
  titulo: 'Calcium Hydroxylapatite: Over a Decade of Clinical Experience',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4295857/',
};
const CAHA_REVISION = {
  sitio: 'PubMed Central',
  titulo: 'The Role of Calcium Hydroxylapatite (Radiesse) as a Regenerative Aesthetic Treatment: A Narrative Review',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11025388/',
};
const PLLA_REVISION = {
  sitio: 'PubMed Central',
  titulo: 'Efficacy and Safety of Poly-l-Lactic Acid in Facial Aesthetics: A Systematic Review',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11435306/',
};

export const rejuvenecimiento: Tratamiento[] = [
  {
    slug: 'hidroxiapatita-de-calcio',
    nombre: 'Hidroxiapatita de calcio',
    resumen: 'Gel con microesferas de hidroxiapatita de calcio que da volumen al instante y estimula al cuerpo a producir su propio colágeno.',
    queEs: [
      'La hidroxiapatita de calcio es un relleno inyectable formado por pequeñas microesferas de un mineral muy parecido al de los huesos y los dientes, suspendidas en un gel. Al inyectarse, el gel aporta volumen de inmediato; con las semanas, el gel desaparece y las microesferas que quedan estimulan a las células de la piel a producir colágeno nuevo.',
      'Se usa para dar soporte y volumen en zonas como los pómulos, las sienes, el mentón o el contorno de la mandíbula. Las fuentes consultadas la describen como biodegradable: el cuerpo la va absorbiendo de forma natural, y el efecto suele mantenerse alrededor de 12 a 18 meses, en algunos casos más. Una parte importante de la literatura científica sobre este producto está financiada por el fabricante, y las revisiones disponibles son narrativas; conviene tenerlo presente al valorar las promesas de resultados.',
    ],
    beneficios: [
      'Aporta volumen inmediato y, después, estimula la formación de colágeno propio.',
      'Ayuda a reponer soporte en zonas como pómulos, sienes, mentón y mandíbula.',
      'Es un procedimiento con inyecciones, sin cirugía.',
      'Su efecto suele mantenerse alrededor de 12 a 18 meses, según las fuentes consultadas.',
      'Según la técnica descrita, se busca corregir sin exceso, evitando el sobrecorregido.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora revisará tu rostro y decidirá si este producto es adecuado para ti.',
      'Cuéntale tu historial de salud, tus alergias y los medicamentos o suplementos que tomas.',
      'Pregunta qué producto se usará y por qué se elige para tu caso.',
      'Elige a un profesional con experiencia: la literatura insiste en la importancia de la técnica y del conocimiento de la anatomía facial.',
    ],
    despues: [
      'Es habitual tener hematomas, hinchazón, enrojecimiento, dolor o picazón en la zona tratada.',
      'Avisa a la doctora si notas bultos, dolor que aumenta o cambios en el color de la piel: los nódulos y la oclusión de un vaso sanguíneo son complicaciones descritas, aunque poco frecuentes.',
      'Sigue las indicaciones de cuidado que te dé la doctora en tu cita.',
    ],
    contraindicaciones: [
      'No se recomienda en el entrecejo, alrededor de los ojos ni en los labios, según las fuentes consultadas.',
      'No es un resultado que se pueda deshacer de inmediato: las fuentes consultadas no describen una sustancia que la disuelva, por lo que, si el resultado no te convence, hay que esperar a que el cuerpo la absorba.',
      'La doctora valorará en consulta tus antecedentes: alergias, embarazo o lactancia, enfermedades y medicamentos, para decidir si es seguro para ti.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuánto dura el efecto?',
        respuesta: 'En promedio, entre 12 y 18 meses, y en algunos casos hasta unos 24 meses o más, según las fuentes consultadas. Varía de una persona a otra y según la zona tratada.',
      },
      {
        pregunta: '¿Se puede deshacer?',
        respuesta: 'Las fuentes consultadas no describen una sustancia que disuelva la hidroxiapatita de calcio. El cuerpo la absorbe de forma natural con el tiempo, por eso es importante hablar bien de la zona y del resultado esperado antes de tratarte.',
      },
      {
        pregunta: '¿Qué diferencia hay con un relleno común?',
        respuesta: 'Además de dar volumen al inicio, la hidroxiapatita de calcio estimula la formación de colágeno propio. Esa segunda acción es la que se describe como bioestimulación, aunque los mecanismos exactos todavía se siguen estudiando.',
      },
      {
        pregunta: '¿Qué efectos secundarios puede tener?',
        respuesta: 'Los más frecuentes son hematomas, hinchazón, enrojecimiento, dolor y picazón, que suelen ser leves y pasajeros. Pueden aparecer nódulos y, muy rara vez, oclusión de un vaso sanguíneo, que se atribuye sobre todo a la técnica de aplicación.',
      },
    ],
    fuentes: [CAHA_DECADA, CAHA_REVISION],
  },
  {
    slug: 'acido-polilactico',
    nombre: 'Ácido poliláctico',
    resumen: 'Bioestimulador de colágeno que se aplica en varias sesiones y mejora el volumen y la calidad de la piel de forma gradual.',
    queEs: [
      'El ácido poliláctico (PLLA) es un polímero sintético, biodegradable y biocompatible. No actúa como un relleno que da volumen de inmediato: sus partículas provocan en el cuerpo una reacción inflamatoria controlada que activa a las células de la piel para producir colágeno propio, por eso el resultado aparece de forma gradual.',
      'En Estados Unidos, la FDA aprobó una de sus presentaciones, Sculptra, para corregir líneas finas y arrugas en la zona de las mejillas en personas con sistema inmunitario sano; el estudio que respaldó esa aprobación usó hasta cuatro sesiones y reporta resultados que pueden mantenerse hasta 24 meses. Una revisión sistemática de ensayos aleatorizados encontró mejoras en el grosor de la piel y en la pérdida de volumen facial, pero calificó la calidad de la evidencia como baja, con ensayos pequeños y protocolos distintos entre sí.',
    ],
    beneficios: [
      'Mejora el grosor y la calidad de la piel de forma gradual.',
      'Repone volumen facial de manera progresiva, sin cambios bruscos.',
      'En ensayos incluidos en una revisión, el efecto se mantuvo al menos 25 meses en algunos estudios.',
      'Es un procedimiento con inyecciones, sin cirugía.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora definirá si este tratamiento es adecuado y cuántas sesiones necesitarías.',
      'Cuéntale tu historial de salud, tus alergias (incluida la alergia a anestésicos como la lidocaína) y los medicamentos que tomas.',
      'Pregunta qué producto se usará y qué resultado es realista en tu caso.',
    ],
    despues: [
      'Es común tener hematomas, hinchazón, dolor o sensibilidad en la zona tratada.',
      'Avisa a la doctora si notas bultos o nódulos: son el efecto adverso más característico del ácido poliláctico y, según las revisiones, dependen en buena parte de la técnica de aplicación y de los cuidados posteriores.',
      'Sigue las indicaciones de cuidado que te dé la doctora y acude a los controles que te indique.',
    ],
    contraindicaciones: [
      'Alergia a alguno de los componentes del producto, alergias graves o antecedente de anafilaxia.',
      'Tendencia a formar cicatrices elevadas (queloides o cicatrices hipertróficas).',
      'Alergia a la lidocaína o a anestésicos similares, si el producto se prepara con lidocaína.',
      'La doctora valorará tu caso si estás embarazada, das de lactar o tienes enfermedades o tratamientos que afecten tu respuesta inmunitaria.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuándo se ve el resultado?',
        respuesta: 'De forma gradual, porque depende de que tu cuerpo vaya produciendo colágeno nuevo. Por eso suele hacerse en varias sesiones, y la doctora te indicará cuántas y cada cuánto.',
      },
      {
        pregunta: '¿Cuántas sesiones se necesitan?',
        respuesta: 'En los ensayos revisados, la mayoría de los protocolos usó entre 1 y 4 sesiones, separadas por unas 3 a 4 semanas. En tu caso lo definirá la doctora tras valorarte.',
      },
      {
        pregunta: '¿Cuánto dura?',
        respuesta: 'La FDA indica que los resultados pueden mantenerse hasta 24 meses en el estudio que respaldó la aprobación, y una revisión reporta beneficios de al menos 25 meses en algunos ensayos. No es un resultado permanente, y varía entre personas.',
      },
      {
        pregunta: '¿Qué riesgos tiene?',
        respuesta: 'Los efectos adversos descritos son mayormente leves a moderados: hematomas, hinchazón, sensibilidad y nódulos. En algún estudio se reportaron nódulos más importantes en el lugar de la inyección. Por eso es clave que lo aplique un profesional con experiencia.',
      },
    ],
    fuentes: [
      { sitio: 'FDA', titulo: 'Sculptra - P030050/S039', url: 'https://www.fda.gov/medical-devices/recently-approved-devices/sculptra-p030050s039' },
      PLLA_REVISION,
    ],
  },
  {
    slug: 'hilos-tensores',
    nombre: 'Hilos tensores',
    resumen: 'Hilos finos que se colocan bajo la piel para dar soporte y reposicionar el tejido del rostro sin cirugía; el efecto puede no mantenerse a largo plazo.',
    queEs: [
      'Los hilos tensores son una alternativa mínimamente invasiva al lifting quirúrgico: se colocan en el tejido bajo la piel para dar soporte o reposicionar la cara en casos de flacidez. Existen distintos diseños (con espículas o con anclaje) y materiales, entre ellos hilos absorbibles de polidioxanona (PDO).',
      'La evidencia disponible señala efectos adversos frecuentes pero en su mayoría leves, como hinchazón, hoyuelos en la piel o alteraciones de la sensibilidad. Una revisión con metaanálisis encontró que los hilos no absorbibles se asociaron con más complicaciones que los absorbibles, que las personas mayores de 50 años tuvieron más riesgo de hoyuelos e infección, y que la satisfacción a más largo plazo fue menor que justo después del procedimiento. Por eso la elección del hilo y de la persona es parte importante de la valoración médica.',
    ],
    beneficios: [
      'Dan soporte y reposicionan el tejido en zonas como mejillas, mandíbula, cuello o cejas, sin cirugía.',
      'Es un procedimiento mínimamente invasivo.',
      'En una revisión, la satisfacción inmediata fue muy alta (alrededor de 98%), aunque bajó con el tiempo (alrededor de 88% a más largo plazo).',
      'Los hilos absorbibles se asociaron con menos complicaciones que los no absorbibles.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora evaluará tu piel, tu edad y tus expectativas y elegirá el tipo de hilo.',
      'Habla de tus expectativas: el efecto puede no mantenerse a largo plazo, según la revisión consultada.',
      'Cuéntale tu historial de salud, alergias y medicamentos.',
      'Pregunta qué tipo de hilo se usará y si es absorbible o no.',
    ],
    despues: [
      'Es común tener hinchazón, hematomas, dolor o sensación de tirantez en los primeros días.',
      'En la literatura se describe un control entre 1 y 2 días después y otro entre 2 semanas y 1 mes; la doctora te indicará su pauta.',
      'Algunos autores recomiendan no lavarte la cara durante las primeras 48 horas; sigue lo que te indique la doctora.',
      'Avisa si notas hoyuelos, bultos, hilos que se palpan o se ven, enrojecimiento, dolor o secreción: son complicaciones descritas que conviene revisar a tiempo.',
    ],
    contraindicaciones: [
      'Los hilos no absorbibles se asocian con más complicaciones; los autores recomiendan usarlos con criterio.',
      'Personas mayores de 50 años: en una revisión tuvieron más riesgo de hoyuelos y de infección, por lo que la doctora valorará con especial cuidado si es una opción adecuada.',
      'Si esperas un resultado permanente o similar al de un lifting quirúrgico: el efecto puede no mantenerse a largo plazo.',
      'La doctora valorará tu caso si tienes infección o heridas en la zona, trastornos de la coagulación, tendencia a cicatrizar en exceso o estás embarazada o das de lactar.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuánto dura el efecto?',
        respuesta: 'Las fuentes consultadas no fijan una duración concreta. Sí señalan que la satisfacción es mayor justo después del procedimiento que a más largo plazo, y que el efecto puede no mantenerse a largo plazo.',
      },
      {
        pregunta: '¿Qué complicaciones puede haber?',
        respuesta: 'Las más frecuentes son hinchazón y hoyuelos en la piel; también pueden aparecer alteraciones de la sensibilidad, hilos que se palpan o se ven, infección o que el hilo asome por la piel. Más raras y graves son las lesiones de nervios, vasos sanguíneos o glándula parótida. Por eso es clave que lo realice un profesional con experiencia.',
      },
      {
        pregunta: '¿Qué diferencia hay entre hilos absorbibles y no absorbibles?',
        respuesta: 'En el metaanálisis, los hilos absorbibles tuvieron menos alteraciones de la sensibilidad y menos casos en que el hilo asomara por la piel que los no absorbibles. La doctora te explicará cuál usará en tu caso.',
      },
      {
        pregunta: '¿Reemplazan a un lifting quirúrgico?',
        respuesta: 'Son una alternativa mínimamente invasiva, pero no equivalen a una cirugía. Según la revisión consultada, su efecto puede no mantenerse a largo plazo, y la doctora valorará si tu grado de flacidez es adecuado para este método.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'A Meta-Analysis and Systematic Review of the Incidences of Complications Following Facial Thread-Lifting', url: 'https://pubmed.ncbi.nlm.nih.gov/33821308/' },
      { sitio: 'PubMed Central', titulo: 'Facial Thread Lifting Complications', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11702150/' },
    ],
  },
  {
    slug: 'bioestimuladores-de-colageno',
    nombre: 'Bioestimuladores de colágeno',
    resumen: 'Inyecciones de sustancias que estimulan a la piel a producir su propio colágeno para mejorar firmeza y volumen de forma gradual.',
    queEs: [
      'Los bioestimuladores son sustancias que, inyectadas en la piel, estimulan al propio cuerpo a producir colágeno y otros componentes del tejido. Entre los más conocidos están el ácido poliláctico (como Sculptra), la hidroxiapatita de calcio (como Radiesse) y la policaprolactona. Cada uno actúa de una manera distinta: el ácido poliláctico provoca una reacción inflamatoria controlada que activa la producción de colágeno, y la hidroxiapatita aporta además volumen inmediato mediante un gel.',
      'Como el resultado depende de que tu organismo fabrique tejido nuevo, la mejoría es gradual y puede requerir varias sesiones. La evidencia científica todavía es limitada: una revisión sistemática de ensayos con ácido poliláctico calificó la calidad de la evidencia como baja, y la revisión sobre hidroxiapatita de calcio es narrativa y fue financiada por el fabricante. La doctora te explicará qué producto se adapta a tu caso.',
    ],
    beneficios: [
      'Mejoran poco a poco el grosor, la elasticidad y la calidad de la piel, según los ensayos con ácido poliláctico.',
      'Pueden reponer volumen facial de manera gradual.',
      'Estimulan la producción de colágeno propio, en lugar de solo rellenar.',
      'En ensayos con ácido poliláctico, la mejoría se mantuvo al menos 25 meses en algunos estudios.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora evaluará tu piel y tus objetivos, y elegirá el producto.',
      'Cuéntale tu historial de salud, tus alergias y los medicamentos que tomas.',
      'Pregunta qué bioestimulador se usará y cuántas sesiones se prevén.',
    ],
    despues: [
      'Es normal tener hematomas, hinchazón, enrojecimiento o sensibilidad en la zona tratada.',
      'Avisa a la doctora si notas bultos o nódulos: son una complicación descrita de los bioestimuladores, que según las revisiones depende en gran parte de la técnica y de los cuidados posteriores.',
      'Sigue las indicaciones de la doctora y acude a los controles que te indique.',
    ],
    contraindicaciones: [
      'Alergia a los componentes del producto, alergias graves o antecedente de anafilaxia.',
      'Tendencia a formar cicatrices elevadas (queloides o cicatrices hipertróficas).',
      'La doctora valorará tu caso si estás embarazada, das de lactar o tienes enfermedades que afecten tu respuesta inmunitaria.',
    ],
    preguntas: [
      {
        pregunta: '¿En qué se diferencia de un relleno?',
        respuesta: 'Un relleno tradicional repone volumen con el propio producto. Los bioestimuladores, en cambio, buscan que tu cuerpo produzca colágeno; algunos, como la hidroxiapatita de calcio, combinan ambos efectos: dan volumen al inicio y estimulan colágeno después.',
      },
      {
        pregunta: '¿Cuándo se ven los resultados?',
        respuesta: 'De forma gradual, porque dependen de la producción de colágeno de tu cuerpo. En los ensayos con ácido poliláctico, la mayoría de los protocolos usó entre 1 y 4 sesiones, separadas por 3 a 4 semanas; la doctora definirá tu esquema.',
      },
      {
        pregunta: '¿Qué productos existen?',
        respuesta: 'Los más usados son el ácido poliláctico, la hidroxiapatita de calcio y la policaprolactona. Cada uno tiene su propio mecanismo y su propio perfil de seguridad, por eso la elección la hace la doctora tras valorarte.',
      },
      {
        pregunta: '¿Qué riesgos tienen?',
        respuesta: 'Con el ácido poliláctico, los efectos adversos descritos son mayormente leves a moderados: hematomas, hinchazón, sensibilidad y nódulos. Con la hidroxiapatita de calcio se describen también bultos, atribuidos sobre todo a la técnica de aplicación. Consulta con la doctora si notas cualquier bulto o cambio en la zona.',
      },
    ],
    fuentes: [CAHA_REVISION, PLLA_REVISION],
  },
  {
    slug: 'adipoestructuracion',
    nombre: 'Adipoestructuración',
    resumen: 'Transferencia de grasa propia al rostro para reponer volumen y mejorar la calidad de la piel; es un procedimiento con riesgos que requiere experiencia.',
    queEs: [
      'La adipoestructuración, también llamada lipotransferencia o injerto de grasa facial, consiste en tomar grasa de otra zona de tu propio cuerpo y colocarla en áreas de la cara donde se ha perdido volumen. Al ser grasa propia, es biocompatible y puede aportar tanto volumen como una mejora en la calidad de la piel.',
      'Se usa desde hace mucho tiempo y hoy se realizan más de medio millón de procedimientos de injerto de grasa facial al año en el mundo. Aun así, es un procedimiento más complejo que una inyección de relleno, y no se conoce con certeza su tasa real de complicaciones: una revisión sistemática halló que las cifras publicadas van desde 1,5% hasta más de 80%, por falta de criterios comunes y de ensayos aleatorizados. Entre las complicaciones están irregularidades, asimetrías, hinchazón prolongada y, con menor frecuencia pero con consecuencias muy graves, la inyección dentro de un vaso sanguíneo o la migración de la grasa, que según la revisión pueden requerir manejo neurológico o neuroquirúrgico y llevar a discapacidad permanente o incluso a la muerte. Por eso conviene que lo realice un profesional con amplia experiencia.',
    ],
    beneficios: [
      'Repone volumen en zonas de la cara que lo han perdido por la edad o por una enfermedad.',
      'Usa tu propia grasa, que es biocompatible y de fácil acceso.',
      'Puede mejorar también la calidad de la piel de la zona tratada.',
      'Según una revisión de especialistas, cuando se realiza correctamente puede dar una mejoría sostenida en personas con pérdida importante de volumen facial.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora evaluará la pérdida de volumen de tu rostro y si el procedimiento es adecuado para ti.',
      'Pregunta de qué zona de tu cuerpo se obtendrá la grasa y cómo se hará.',
      'Cuéntale tu historial de salud, alergias y medicamentos, y habla con claridad de tus expectativas.',
      'Pregunta qué retoques posteriores podrían ser necesarios y qué complicaciones debes vigilar.',
    ],
    despues: [
      'Es común tener hinchazón y enrojecimiento prolongados en la zona tratada; en las revisiones son de los efectos más frecuentes.',
      'Avisa de inmediato si tienes dolor intenso, cambios en el color de la piel o síntomas neurológicos, porque la inyección dentro de un vaso sanguíneo, aunque rara, es la complicación más grave descrita.',
      'Pueden aparecer irregularidades, bultos o asimetrías que, en algunos casos, requieren un retoque.',
      'Sigue las indicaciones de cuidado que te dé la doctora, tanto en la zona donde se tomó la grasa como en la cara.',
    ],
    contraindicaciones: [
      'La doctora revisará tus antecedentes de salud, medicamentos y alergias antes de decidir si el procedimiento es seguro para ti.',
      'Si esperas un resultado sin riesgos ni retoques: la tasa real de complicaciones es incierta y las complicaciones moderadas pueden requerir otra intervención.',
      'Las revisiones describen activación de acné y telangiectasias entre los efectos adversos; coméntale a la doctora si tienes acné activo o antecedentes de cicatrización anormal.',
    ],
    preguntas: [
      {
        pregunta: '¿La grasa se mantiene para siempre?',
        respuesta: 'No se puede prometer un resultado permanente. Los especialistas describen una mejoría sostenida cuando el procedimiento se realiza correctamente, pero el resultado depende de la técnica y de cada persona, y la doctora te orientará sobre qué esperar.',
      },
      {
        pregunta: '¿Qué riesgos tiene?',
        respuesta: 'Las complicaciones más frecuentes son hinchazón prolongada, irregularidades y asimetrías, y a veces granos o hipertrofia de la grasa injertada. Las más graves son la inyección intravascular o la migración de la grasa, que pueden requerir manejo neurológico o neuroquirúrgico y llevar a discapacidad permanente o incluso a la muerte. La revisión señala que la frecuencia real de estas complicaciones no se conoce con precisión. Por eso es indispensable un profesional con experiencia.',
      },
      {
        pregunta: '¿Es lo mismo que un relleno?',
        respuesta: 'No. Aunque ambos reponen volumen, el relleno es un producto inyectable y la adipoestructuración usa tu propia grasa, que debe obtenerse de otra zona de tu cuerpo. Por eso es un procedimiento más complejo.',
      },
      {
        pregunta: '¿Se ha estudiado bien?',
        respuesta: 'Se usa desde hace décadas y hay muchas revisiones, pero los propios autores señalan que faltan ensayos aleatorizados y criterios comunes para reportar complicaciones; por eso la tasa real de complicaciones sigue sin conocerse con precisión.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'Facial Fat Grafting (FFG): Worth the Risk? A Systematic Review of Complications and Critical Appraisal', url: 'https://pubmed.ncbi.nlm.nih.gov/36012947/' },
      { sitio: 'PubMed', titulo: 'Fat grafting in facial rejuvenation', url: 'https://pubmed.ncbi.nlm.nih.gov/25827566/' },
    ],
  },
];
