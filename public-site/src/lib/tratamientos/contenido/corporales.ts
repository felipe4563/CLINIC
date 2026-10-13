import type { Tratamiento } from '../tipos';

const FDA_KYBELLA = {
  sitio: 'FDA',
  titulo: 'FDA approves additional information in labeling for Kybella (deoxycholic acid) injection warning of adverse reactions associated with unapproved use',
  url: 'https://www.fda.gov/drugs/drug-safety-communications/fda-approves-additional-information-labeling-kybella-deoxycholic-acid-injection-warning-adverse',
};
const FDA_NO_APROBADAS = {
  sitio: 'FDA',
  titulo: 'Using Fat-Dissolving Injections That Are Not FDA Approved Can Be Harmful',
  url: 'https://www.fda.gov/drugs/buying-using-medicine-safely/using-fat-dissolving-injections-are-not-fda-approved-can-be-harmful',
};
const CELULITIS_ENSAYOS = {
  sitio: 'PubMed Central',
  titulo: 'Collagenase Clostridium Histolyticum-aaes for Treatment of Cellulite: A Pooled Analysis of Two Phase-3 Trials',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9132528/',
};
const CELULITIS_DURACION = {
  sitio: 'PubMed Central',
  titulo: 'Efficacy, Safety, and Durability of Response of Collagenase Clostridium Histolyticum-aaes for Treating Cellulite',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7787338/',
};
const CLEVELAND_MASAJE = {
  sitio: 'Cleveland Clinic',
  titulo: 'Massage Therapy',
  url: 'https://my.clevelandclinic.org/departments/wellness/integrative/treatments-services/massage-therapy',
};

export const corporales: Tratamiento[] = [
  {
    slug: 'lipolisis-quimica',
    nombre: 'Lipólisis química',
    resumen: 'Inyecciones con desoxicolato para reducir pequeñas acumulaciones de grasa; solo está aprobado por la FDA para la grasa bajo el mentón.',
    queEs: [
      'La lipólisis química es un procedimiento sin cirugía en el que se inyectan, bajo la piel, sustancias que descomponen las células de grasa de la zona tratada. El producto más estudiado es el ácido desoxicólico (desoxicolato).',
      'La FDA, la agencia de medicamentos de Estados Unidos, aprobó un medicamento con desoxicolato (Kybella) únicamente para mejorar la apariencia de la grasa moderada a severa bajo el mentón ("papada") en personas adultas, y solo para esa zona. Según la FDA, debe aplicarlo un profesional de la salud, en un máximo de seis tratamientos separados por al menos un mes. Otras zonas del cuerpo y otras mezclas, como las que llevan fosfatidilcolina, no cuentan con esa aprobación.',
    ],
    beneficios: [
      'Es un procedimiento con inyecciones, sin cirugía.',
      'El desoxicolato está aprobado por la FDA para mejorar la apariencia de la grasa bajo el mentón en adultos.',
      'Busca reducir una acumulación de grasa localizada en una zona concreta, sin pasar por quirófano.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora revisará la zona y decidirá si este tratamiento es adecuado para ti.',
      'Pregunta qué producto se usará, de dónde viene y si está aprobado para la zona que quieres tratar.',
      'Cuéntale tu historial de salud, tus alergias y los medicamentos que tomas.',
      'Si estás pensando en inyecciones para reducir grasa, avísale también a tu médico habitual.',
    ],
    despues: [
      'Es posible tener hematomas u otras molestias en la zona; los hematomas figuran entre los efectos descritos por la FDA.',
      'Consulta pronto si notas una sonrisa asimétrica, debilidad de los músculos de la cara, dificultad para tragar, nódulos o bultos que no se van, o cambios en la piel de la zona.',
      'Los nódulos pueden persistir y a veces requieren atención médica, según la FDA.',
      'Los efectos secundarios se pueden notificar al sistema MedWatch de la FDA o consultar con tu médico.',
    ],
    contraindicaciones: [
      'No está aprobado fuera de la zona bajo el mentón, y la FDA recomienda no usarlo en otras partes. Se han notificado daños en nervios y músculos, y problemas de visión tras inyecciones alrededor de los ojos.',
      'Las inyecciones para disolver grasa que no están aprobadas (por ejemplo, con fosfatidilcolina, solas o combinadas con desoxicolato) pueden causar cicatrices permanentes, infecciones graves, deformidades de la piel, quistes y nódulos dolorosos.',
      'La FDA aconseja no comprar estos productos por internet ni inyectarlos por tu cuenta.',
      'La doctora valorará en consulta tus antecedentes, alergias, embarazo o lactancia y medicamentos para decidir si el tratamiento es seguro para ti.',
    ],
    preguntas: [
      {
        pregunta: '¿Qué zonas se pueden tratar?',
        respuesta: 'La FDA solo ha aprobado el desoxicolato para la grasa bajo el mentón. Para otras zonas, la FDA recomienda no usarlo porque se han notificado efectos graves; habla con la doctora sobre cuál es la opción adecuada en tu caso.',
      },
      {
        pregunta: '¿Cuántas sesiones se necesitan?',
        respuesta: 'Según la FDA, el tratamiento aprobado puede incluir hasta seis sesiones separadas por al menos un mes. La cantidad concreta para ti la define la doctora tras valorarte.',
      },
      {
        pregunta: '¿Qué riesgos tiene?',
        respuesta: 'La FDA describe lesión de nervios cerca del labio inferior, de la lengua y de la mandíbula, dificultad para tragar, hematomas, daño en la piel o en los vasos sanguíneos, e infección. También pueden aparecer nódulos que no siempre se resuelven solos.',
      },
      {
        pregunta: '¿Es lo mismo que otras inyecciones para "disolver grasa"?',
        respuesta: 'No. Según la FDA, hay productos vendidos con nombres como Lipodissolve o Aqualyx, a base de fosfatidilcolina o desoxicolato, que no han sido evaluados por esa agencia en cuanto a seguridad y eficacia. Pregunta siempre qué producto se usará.',
      },
    ],
    fuentes: [FDA_KYBELLA, FDA_NO_APROBADAS],
  },
  {
    slug: 'enzimas-recombinantes',
    nombre: 'Enzimas recombinantes',
    resumen: 'Inyecciones con enzimas como la colagenasa, estudiada para la celulitis en glúteos con ensayos financiados por el fabricante.',
    queEs: [
      '"Enzimas recombinantes" es un término que se usa en estética para varios productos inyectables distintos, así que conviene preguntar cuál se usará en tu caso. Las fuentes consultadas no estudian una categoría general de "enzimas" con evidencia propia: analizan un producto concreto, la colagenasa de Clostridium histolyticum, una combinación de enzimas inyectable que se investigó para la celulitis de los glúteos en mujeres adultas. Lo que muestran esos estudios no puede extrapolarse a otras enzimas. La doctora te dirá exactamente qué producto se usa en tu caso y cuál es su situación de aprobación y disponibilidad; no des por hecho que es el mismo que se estudió.',
      'Esa enzima no se estudió como tratamiento para reducir medidas ni para eliminar grasa. La evidencia procede de ensayos financiados por el fabricante, y sus autores reconocen que algunas mediciones son estrictas y que los resultados pueden no reflejar a todas las personas que consultan por celulitis.',
    ],
    beneficios: [
      'En ensayos con mujeres con celulitis moderada a severa en los glúteos, una parte de las tratadas mejoró de forma visible frente al grupo que recibió placebo.',
      'En un seguimiento posterior, las mejorías se mantuvieron en buena parte de las participantes durante meses.',
      'Es un tratamiento con inyecciones, sin cirugía.',
      'Los efectos secundarios descritos fueron sobre todo locales (hematomas y dolor) y, en general, de intensidad leve a moderada.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora revisará la zona y decidirá si este tratamiento es adecuado para ti.',
      'Pregunta qué enzima se usará exactamente y qué estudios respaldan su uso en la zona que quieres tratar.',
      'Cuéntale tus alergias, tu historial de sangrado y los medicamentos que tomas, sobre todo si usas anticoagulantes o antiagregantes.',
      'En los ensayos se pidió no haber recibido en la zona otros tratamientos recientes (inyecciones, láser, radiofrecuencia, masajes o cremas); coméntale a la doctora cualquiera que te hayas hecho.',
    ],
    despues: [
      'Los hematomas y el dolor en los puntos de inyección fueron los efectos más frecuentes en los estudios; con las sesiones sucesivas se hicieron menos frecuentes y duraron menos.',
      'En los estudios, los hematomas aparecieron en la gran mayoría de las mujeres tratadas, así que conviene esperarlos.',
      'Consulta con la doctora si notas una erupción u otra reacción que te preocupe.',
    ],
    contraindicaciones: [
      'En los ensayos se excluyó a quienes tenían alergia conocida a la colagenasa.',
      'También se excluyó a personas embarazadas, con antecedentes recientes de ictus o de sangrado, o que usaban anticoagulantes o antiagregantes (se permitió aspirina en dosis bajas).',
      'La doctora valorará en consulta tus antecedentes y medicamentos para decidir si es seguro para ti.',
      'Las fuentes consultadas no estudian este tratamiento para reducir grasa ni centímetros de contorno.',
    ],
    preguntas: [
      {
        pregunta: '¿Sirve para bajar medidas o eliminar grasa?',
        respuesta: 'Las fuentes consultadas no lo estudian con ese fin: evalúan la apariencia de la celulitis en los glúteos. No hay en ellas evidencia de que las enzimas reduzcan medidas.',
      },
      {
        pregunta: '¿Cuánto dura el efecto?',
        respuesta: 'En un seguimiento de ensayos clínicos, la mejoría se mantuvo en la mayoría de las mujeres evaluables durante un año, y en un grupo pequeño hasta dos años. Esos datos provienen de pocas participantes y de estudios con participación del fabricante, así que son orientativos.',
      },
      {
        pregunta: '¿Hay muchos hematomas?',
        respuesta: 'Sí, son el efecto más frecuente: en el seguimiento de un ensayo, la mayoría de las tratadas los tuvo, junto con dolor en la zona de inyección. Fueron en general de leves a moderados.',
      },
      {
        pregunta: '¿Funciona igual en todas las personas?',
        respuesta: 'No necesariamente. El análisis de dos ensayos observó que la respuesta parecía disminuir con la edad y con un mayor índice de masa corporal, y que esos estudios no incluyeron celulitis leve.',
      },
    ],
    fuentes: [CELULITIS_ENSAYOS, CELULITIS_DURACION],
  },
  {
    slug: 'enzimas-lipoliticas',
    nombre: 'Enzimas lipolíticas',
    resumen: 'Inyecciones que buscan descomponer grasa localizada. Los productos para disolver grasa que no están aprobados por la FDA pueden causar daños serios.',
    queEs: [
      '"Enzimas lipolíticas" es un nombre comercial que se da a inyecciones pensadas para romper las células de grasa en una zona concreta. Las fuentes consultadas no incluyen una ficha sobre enzimas lipolíticas como tal; sí describen la lipólisis por inyección ("injection lipolysis"), un procedimiento sin cirugía que usa una serie de inyecciones bajo la piel para descomponer grasa, y cuyos ingredientes más comunes son la fosfatidilcolina y el desoxicolato de sodio.',
      'La FDA indica que los productos de este tipo vendidos con nombres como Lipodissolve, Aqualyx o Kabelline no han sido evaluados en cuanto a su seguridad y eficacia, y que el único inyectable aprobado para disolver grasa es el desoxicolato (Kybella), únicamente para la grasa bajo el mentón. Por eso es importante preguntar qué contiene exactamente lo que te van a inyectar. En las fuentes consultadas no hay datos que muestren cuánto se reduce la grasa con productos no aprobados, así que no se puede prometer un resultado.',
    ],
    beneficios: [
      'Lo que se busca con estas inyecciones es reducir pequeñas acumulaciones de grasa en una zona concreta, sin cirugía.',
      'Las fuentes consultadas la describen como un procedimiento sin cirugía, con una serie de inyecciones bajo la piel.',
      'Para la grasa bajo el mentón existe un medicamento aprobado por la FDA, con riesgos y límites descritos oficialmente.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora revisará la zona y decidirá si es adecuado para ti.',
      'Pregunta qué sustancia se usará, de qué fabricante es y si está aprobada por una autoridad sanitaria para esa zona.',
      'Cuéntale tu historial de salud, tus alergias y los medicamentos que tomas.',
      'Si te han inyectado o estás considerando inyecciones para disolver grasa, avísale también a tu médico habitual, como aconseja la FDA.',
    ],
    despues: [
      'Consulta pronto si aparecen nódulos o bultos dolorosos, enrojecimiento, fiebre o signos de infección: la FDA describe infecciones en nódulos una semana después del tratamiento.',
      'Si notas debilidad en los músculos de la cara, una sonrisa asimétrica, dificultad para tragar o cambios en la visión, busca atención médica.',
      'Los efectos secundarios se pueden notificar al sistema MedWatch de la FDA.',
    ],
    contraindicaciones: [
      'La FDA advierte que las inyecciones para disolver grasa no aprobadas pueden causar cicatrices permanentes, infecciones graves, deformidades de la piel, quistes y nódulos profundos y dolorosos.',
      'El desoxicolato aprobado no debe usarse fuera de la zona bajo el mentón: la FDA ha recibido informes de efectos graves, como daño en nervios y músculos, visión borrosa o reducida tras inyecciones cerca de los ojos, y dificultad para caminar.',
      'La FDA aconseja no comprar estos productos por internet ni autoinyectarlos.',
      'La doctora valorará en consulta tus antecedentes, alergias, embarazo o lactancia y medicamentos para decidir si es seguro para ti.',
    ],
    preguntas: [
      {
        pregunta: '¿Estas inyecciones están aprobadas?',
        respuesta: 'Según la FDA, el único inyectable aprobado para disolver grasa es el desoxicolato (Kybella), solo para la grasa bajo el mentón. Los otros productos, como los de fosfatidilcolina, no han sido evaluados por esa agencia. Pregunta qué producto se usará y qué respaldo tiene.',
      },
      {
        pregunta: '¿Cuáles son los riesgos?',
        respuesta: 'Según la FDA, con productos no aprobados se han notificado cicatrices permanentes, infecciones graves, deformidades de la piel, quistes y nódulos dolorosos. Una técnica incorrecta, como errores en el número o la ubicación de las inyecciones, aumenta ese riesgo.',
      },
      {
        pregunta: '¿Cuánta grasa se reduce?',
        respuesta: 'Las fuentes consultadas no ofrecen cifras para estos productos. No hay datos que permitan prometer un resultado, y el efecto puede variar de una persona a otra.',
      },
    ],
    fuentes: [FDA_NO_APROBADAS, FDA_KYBELLA],
  },
  {
    slug: 'ondas-rusas',
    nombre: 'Ondas rusas',
    resumen: 'Electroestimulación que contrae el músculo con electrodos sobre la piel. No hay evidencia en las fuentes de que reduzca grasa.',
    queEs: [
      'Las ondas rusas, o corriente rusa, son una forma de electroestimulación neuromuscular (NMES): se colocan electrodos sobre la piel y se envían impulsos eléctricos que hacen contraer el músculo. La corriente rusa es una corriente alterna de 2.000 hercios (2 kHz).',
      'La investigación disponible viene sobre todo de la rehabilitación y del entrenamiento deportivo. En ensayos con deportistas, la corriente rusa aumentó el grosor del músculo y la fuerza provocada por el estímulo, aunque una corriente de baja frecuencia dio resultados similares y fue más cómoda. En un estudio en mujeres sanas generó menos fuerza que otras corrientes. Una revisión señala que la electroestimulación sola logra menos que el ejercicio voluntario y que los parámetros varían mucho entre estudios. Las fuentes consultadas no evalúan su efecto sobre la grasa corporal ni sobre las medidas.',
    ],
    beneficios: [
      'Activa los músculos sin necesidad de moverlos de forma voluntaria, lo que se aprovecha en rehabilitación.',
      'En un ensayo con deportistas, seis semanas de estimulación aumentaron el grosor del músculo tratado.',
      'Puede usarse como complemento del ejercicio en personas sanas, según una revisión sobre electroestimulación.',
      'Es un procedimiento sin cirugía.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora decidirá si este tratamiento es adecuado para ti y qué zonas se estimularán.',
      'Cuéntale tu historial de salud, los medicamentos que tomas, si tienes problemas renales y cualquier dispositivo médico que lleves.',
      'Pregunta qué resultado es razonable esperar, ya que las fuentes consultadas no estudian la reducción de grasa ni de medidas.',
    ],
    despues: [
      'Es habitual sentir dolor muscular durante uno a cuatro días después, y molestia durante la estimulación, sobre todo con intensidades altas.',
      'Avisa a la doctora si notas dolor intenso o debilidad inusual, ya que el exceso de estimulación puede dañar las fibras musculares.',
      'Pregunta a la doctora cada cuánto conviene repetir las sesiones, porque los estudios usan protocolos muy distintos.',
    ],
    contraindicaciones: [
      'Las fuentes consultadas no ofrecen una lista formal de contraindicaciones; la doctora valorará en consulta tus antecedentes antes de decidir si es seguro para ti.',
      'El exceso de estimulación puede dañar el músculo y, en casos graves, causar rabdomiólisis con riesgo para los riñones, sobre todo si la función renal ya está reducida.',
      'Ese riesgo se describe sobre todo en los trajes de electroestimulación de cuerpo completo, de ahí la importancia de que la sesión la dirija un profesional.',
    ],
    preguntas: [
      {
        pregunta: '¿Las ondas rusas queman grasa o reducen medidas?',
        respuesta: 'Las fuentes consultadas no estudian ese efecto. Lo que muestran los estudios es que la estimulación puede activar el músculo y aumentar su grosor en algunas personas.',
      },
      {
        pregunta: '¿Duele?',
        respuesta: 'Puede causar molestia o dolor durante la estimulación, sobre todo a intensidades altas, y dolor muscular de uno a cuatro días después. Un ensayo encontró que una corriente de baja frecuencia resultó más cómoda que la corriente rusa.',
      },
      {
        pregunta: '¿Reemplaza al ejercicio?',
        respuesta: 'No. Según una revisión, la electroestimulación sola produce menos fuerza que la contracción voluntaria, y se plantea como complemento del ejercicio.',
      },
      {
        pregunta: '¿La corriente rusa es mejor que otras corrientes?',
        respuesta: 'No necesariamente. En un ensayo con deportistas, la corriente rusa y una de baja frecuencia produjeron adaptaciones parecidas; en otro estudio con mujeres sanas, la corriente rusa generó menos fuerza que otras corrientes.',
      },
    ],
    fuentes: [
      {
        sitio: 'PubMed',
        titulo: 'Russian and Low-Frequency Currents Induced Similar Neuromuscular Adaptations in Soccer Players: A Randomized Controlled Trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31141429/',
      },
      {
        sitio: 'PubMed',
        titulo: 'Comparison between the effects of 4 different electrical stimulation current waveforms on isometric knee extension torque and perceived discomfort in healthy women',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24809656/',
      },
      {
        sitio: 'PubMed Central',
        titulo: 'Unlocking the potential of neuromuscular electrical stimulation: achieving physical activity benefits for all abilities',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11660796/',
      },
    ],
  },
  {
    slug: 'radiofrecuencia',
    nombre: 'Radiofrecuencia',
    resumen: 'Calor controlado sobre la piel para estimular colágeno y mejorar la firmeza. Los cambios son graduales y temporales, y rinden más con flacidez leve.',
    queEs: [
      'La radiofrecuencia es un tratamiento sin cirugía que usa un dispositivo con electrodo para calentar el tejido bajo la piel. Ese calor estimula al cuerpo a producir colágeno y elastina, con la idea de dar más firmeza a la piel. Cleveland Clinic indica que puede usarse en el cuerpo (contorno corporal), la cara, el cuello, los brazos y las manos.',
      'Las fuentes consultadas la describen como un tratamiento para tensar la piel; no cuantifican reducción de grasa. Funciona mejor en quienes tienen flacidez leve y es menos eficaz cuando la piel está muy caída. Las mejorías son graduales y temporales: no igualan una cirugía como el lifting, y las páginas consultadas no presentan datos numéricos de resultados.',
    ],
    beneficios: [
      'Es un procedimiento sin cirugía, que suele tomar alrededor de una hora o menos por sesión.',
      'Puede mejorar la firmeza de la piel de forma gradual, a medida que el cuerpo produce colágeno nuevo.',
      'La recuperación suele ser sencilla: según Cleveland Clinic, la mayoría de las personas retoma sus actividades en un día.',
      'Se usa en distintas zonas, como cara, cuello, brazos y cuerpo.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora examinará tu piel y hablará contigo de lo que esperas conseguir.',
      'Cuéntale si tienes alguna enfermedad de la piel, si te haces otros tratamientos para la piel o si estás embarazada o crees estarlo.',
      'Pregunta qué equipo se usará y si está aprobado; Cleveland Clinic recomienda profesionales con experiencia y dispositivos aprobados por la FDA.',
      'Pregunta cuántas sesiones se prevén; las fuentes consultadas dan cifras distintas, desde una sesión hasta varias.',
    ],
    despues: [
      'Es habitual ver enrojecimiento e hinchazón leves, que deberían desaparecer en unas 24 horas.',
      'Durante la sesión, avisa de inmediato si sientes quemazón: lo normal es calor, hormigueo o una molestia leve.',
      'Consulta si el enrojecimiento o la hinchazón duran varios días, o si aparecen sarpullido u otros cambios en la piel.',
      'Los cambios llegan poco a poco, durante varios meses, y no son permanentes.',
    ],
    contraindicaciones: [
      'No se recomienda durante el embarazo ni con infecciones en la piel, según la Academia Americana de Dermatología; también depende de algunos medicamentos.',
      'Cuéntale a la doctora si tienes una enfermedad de la piel activa, si recibes otros tratamientos cutáneos o si estás embarazada.',
      'Rara vez, el exceso de calor puede causar quemaduras, por eso importa la experiencia de quien lo aplica y el equipo utilizado.',
      'Es menos eficaz con flacidez severa; en esos casos, la doctora puede hablarte de otras opciones.',
    ],
    preguntas: [
      {
        pregunta: '¿Duele?',
        respuesta: 'Lo habitual es sentir calor, hormigueo o una molestia leve. Si sientes quemazón, debes avisar de inmediato.',
      },
      {
        pregunta: '¿Cuánto tardan en verse los resultados?',
        respuesta: 'Poco a poco. Cleveland Clinic menciona cambios entre dos y seis meses, y la Academia Americana de Dermatología indica que los mejores resultados se ven alrededor de los seis meses, cuando el cuerpo ha producido colágeno.',
      },
      {
        pregunta: '¿Los resultados son permanentes?',
        respuesta: 'No. Las dos fuentes hablan de efectos que duran unos años como máximo y que dependen del cuidado de la piel, incluida la protección solar.',
      },
      {
        pregunta: '¿Sirve para reducir grasa?',
        respuesta: 'Las fuentes consultadas describen la radiofrecuencia como tratamiento para la firmeza de la piel y no ofrecen datos sobre reducción de grasa.',
      },
    ],
    fuentes: [
      {
        sitio: 'Cleveland Clinic',
        titulo: 'Radio Frequency (RF) Skin Tightening: Benefits & Dangers',
        url: 'https://my.clevelandclinic.org/health/treatments/24683-radio-frequency-rf-skin-tightening',
      },
      {
        sitio: 'American Academy of Dermatology',
        titulo: 'Many ways to firm sagging skin',
        url: 'https://www.aad.org/public/cosmetic/younger-looking/firm-sagging-skin',
      },
    ],
  },
  {
    slug: 'drenaje-linfatico',
    nombre: 'Drenaje linfático',
    resumen: 'Masaje suave que ayuda a mover líquido hacia los ganglios. Su uso mejor respaldado es el linfedema; los efectos estéticos están menos probados.',
    queEs: [
      'El drenaje linfático es un masaje muy suave, con presiones ligeras y movimientos dirigidos, que busca desplazar el líquido acumulado en un tejido hinchado hacia los ganglios linfáticos. Según Cleveland Clinic, se usa sobre todo para reducir el linfedema, por ejemplo después de una cirugía de mama en la que se extirpan ganglios.',
      'Se ofrece también con fines estéticos, por ejemplo para la hinchazón de la cara o para la hinchazón en general. Esa misma fuente indica que estos beneficios se plantean como posibles, que no cita estudios que los respalden y que el masaje puede no ayudar, o tener resultados mínimos, en personas que no tienen linfedema. No menciona que sirva para bajar de peso.',
    ],
    beneficios: [
      'Puede ayudar a reducir la hinchazón causada por linfedema, que es su uso principal.',
      'Es un masaje suave, con presión ligera.',
      'Cleveland Clinic señala que podría aumentar la circulación y reducir la hinchazón de la cara, aunque lo plantea como posibilidad y sin estudios citados.',
      'Es una técnica no invasiva, sin cirugía.',
    ],
    antes: [
      'Si tienes hinchazón en brazos o piernas, consulta primero a un médico para conocer la causa; el masaje no la sustituye.',
      'Cuéntale al terapeuta tus problemas de salud antes de empezar; Cleveland Clinic lo recomienda para cualquier masaje.',
      'Si tienes linfedema, cáncer o has usado radioterapia, consulta a la doctora antes de recibir drenaje.',
      'Normalmente la sesión comienza masajeando zonas de ganglios, como axilas y cuello, y, con tu consentimiento, la ingle.',
    ],
    despues: [
      'Pocas personas tienen reacciones, pero pueden aparecer cansancio, dolor de cabeza o náuseas; si te ocurre, avisa a la doctora.',
      'Si usas prendas de compresión por prescripción médica, sigue usándolas.',
      'No lo uses como único tratamiento del linfedema.',
      'Los resultados pueden no notarse enseguida; si tras varias sesiones no hay cambios, habla de otras opciones con la doctora.',
      'Consulta si la hinchazón aumenta en el abdomen, las articulaciones, los brazos o las piernas.',
    ],
    contraindicaciones: [
      'Coágulos de sangre, trombosis venosa profunda o antecedentes de ictus.',
      'Celulitis (infección de la piel), fiebre o infección.',
      'Enfermedad del corazón.',
      'Insuficiencia renal.',
      'No debe hacerse directamente sobre tejido con cáncer ni sobre piel dañada por radioterapia.',
      'Si tomas anticoagulantes, tienes implantes o dispositivos médicos, o estás embarazada, consulta antes con la doctora, como recomienda Cleveland Clinic para el masaje en general.',
    ],
    preguntas: [
      {
        pregunta: '¿Sirve para bajar de peso o eliminar toxinas?',
        respuesta: 'La fuente consultada no menciona la pérdida de peso y presenta la idea de la "desintoxicación" como una posibilidad, no como un efecto comprobado.',
      },
      {
        pregunta: '¿Cuándo se notan los resultados?',
        respuesta: 'Cleveland Clinic no da un plazo fijo y advierte que los resultados pueden no verse enseguida. Si tras varias sesiones no notas ninguna mejoría, conviene consultar otras opciones con la doctora.',
      },
      {
        pregunta: '¿Duele?',
        respuesta: 'La técnica usa presión ligera. Si sientes molestia, avísale al terapeuta.',
      },
      {
        pregunta: '¿Sirve para la hinchazón de la cara?',
        respuesta: 'Cleveland Clinic indica que el drenaje facial podría aumentar la circulación y reducir la hinchazón, pero no cita estudios, así que es un efecto posible y no demostrado.',
      },
    ],
    fuentes: [
      {
        sitio: 'Cleveland Clinic',
        titulo: 'Lymphatic Drainage Massage: What It Is & Benefits',
        url: 'https://my.clevelandclinic.org/health/treatments/21768-lymphatic-drainage-massage',
      },
      CLEVELAND_MASAJE,
    ],
  },
  {
    slug: 'masajes-reductores',
    nombre: 'Masajes reductores',
    resumen: 'Masajes con presión firme para modelar el cuerpo. La evidencia de que reduzcan medidas es limitada y baja.',
    queEs: [
      'Los masajes reductores son sesiones de masaje, normalmente con presión más firme, que se ofrecen para modelar el cuerpo y reducir medidas. No es un término médico, y las fuentes consultadas no estudian ese tipo de masaje con ese nombre.',
      'La mejor evidencia disponible es un metaanálisis de 13 ensayos (todos de China) en personas con obesidad: añadir masaje a los cambios de estilo de vida se asoció con una reducción de la cintura, el peso y el índice de masa corporal frente a los cambios de estilo de vida solos, pero sin reducción significativa de la cadera. Los autores califican la calidad de la evidencia como baja a moderada, con alto riesgo de sesgo y técnicas muy distintas entre estudios. Es decir, no demuestra que el masaje, por sí solo, elimine grasa de una zona concreta.',
    ],
    beneficios: [
      'En el metaanálisis, el masaje junto con cambios de estilo de vida se asoció con menor perímetro de cintura que los cambios de estilo de vida solos.',
      'Cleveland Clinic menciona que el masaje puede reducir la tensión muscular y el estrés, y favorecer la relajación.',
      'Puede mejorar la sensación de movilidad y aliviar molestias musculares, según esa misma fuente, que no cita estudios concretos.',
      'Es un procedimiento no invasivo, sin cirugía.',
    ],
    antes: [
      'Cuéntale al terapeuta tus problemas de salud y los medicamentos que tomas antes de empezar.',
      'Si tomas anticoagulantes, tienes coágulos en las piernas, osteoporosis, un tumor, un dispositivo médico implantado o estás embarazada, consulta a la doctora antes.',
      'Evita el masaje si has tenido una lesión aguda o una cirugía en las últimas 48 horas, o consulta antes.',
      'Pide que te expliquen la técnica; las técnicas varían mucho y la presión puede ir de ligera a intensa.',
    ],
    despues: [
      'Es posible tener molestia o sensibilidad en las zonas trabajadas con más presión.',
      'Pueden aparecer hematomas, sobre todo si tomas anticoagulantes.',
      'Si algo te molesta durante la sesión, avisa para que ajusten la presión.',
      'Combinar el masaje con hábitos de vida saludables es lo que evaluaron los estudios; por sí solo, su efecto sobre las medidas no está demostrado.',
    ],
    contraindicaciones: [
      'Personas que toman anticoagulantes, por el riesgo de hematomas.',
      'Coágulos de sangre en las piernas.',
      'Tumores.',
      'Embarazo, en especial si es de alto riesgo: Cleveland Clinic recomienda consultar siempre antes con el ginecólogo.',
      'Osteoporosis o un trastorno de la columna.',
      'Un dispositivo médico implantado o colocado.',
      'Una lesión aguda o una cirugía en las últimas 48 horas.',
    ],
    preguntas: [
      {
        pregunta: '¿Los masajes reductores eliminan grasa de una zona?',
        respuesta: 'Las fuentes consultadas no lo demuestran. El metaanálisis evaluó el masaje junto con cambios de estilo de vida en personas con obesidad, no el efecto sobre la grasa localizada.',
      },
      {
        pregunta: '¿Reducen la cintura?',
        respuesta: 'En el metaanálisis, el masaje añadido a los cambios de estilo de vida se asoció con una reducción de la cintura, pero los autores señalan evidencia de calidad baja, alto riesgo de sesgo y estudios muy heterogéneos.',
      },
      {
        pregunta: '¿Cuánto dura una sesión?',
        respuesta: 'Cleveland Clinic indica que sus sesiones de masaje duran alrededor de 50 minutos; la duración depende de la técnica y de la zona.',
      },
      {
        pregunta: '¿Puede dejar moretones?',
        respuesta: 'Sí. Cleveland Clinic menciona los hematomas como un riesgo del masaje, sobre todo en personas que toman anticoagulantes, y la sensibilidad cuando la presión es más profunda.',
      },
    ],
    fuentes: [
      {
        sitio: 'PubMed Central',
        titulo: 'Comparative effectiveness of massage combined with lifestyle intervention and lifestyle intervention alone for simple obesity: A systematic review and meta-analysis',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11730106/',
      },
      CLEVELAND_MASAJE,
    ],
  },
];
