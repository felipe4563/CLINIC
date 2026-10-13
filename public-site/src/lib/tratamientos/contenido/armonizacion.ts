import type { Tratamiento } from '../tipos';

const FDA_CONSUMO = {
  sitio: 'FDA',
  titulo: "Dermal Filler Do's and Don'ts for Wrinkles, Lips and More",
  url: 'https://www.fda.gov/consumers/consumer-updates/dermal-filler-dos-and-donts-wrinkles-lips-and-more',
};
const FDA_RELLENOS = {
  sitio: 'FDA',
  titulo: 'Dermal Fillers (Soft Tissue Fillers)',
  url: 'https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers',
};

export const armonizacion: Tratamiento[] = [
  {
    slug: 'acido-hialuronico-fillers',
    nombre: 'Ácido hialurónico (Fillers)',
    resumen: 'Gel de ácido hialurónico inyectado bajo la piel para suavizar surcos y devolver o dar volumen en zonas del rostro; es temporal.',
    queEs: [
      'Los rellenos dérmicos son geles que se inyectan bajo la piel para suavizar líneas, dar volumen o ambas cosas. El ácido hialurónico es un azúcar que el cuerpo ya produce de forma natural, y es uno de los materiales más usados en estos productos. Con el tiempo el organismo lo va absorbiendo, por eso el efecto es temporal y puede ser necesario repetir el tratamiento.',
      'Las agencias reguladoras, como la FDA, tratan los rellenos como dispositivos médicos y los aprueban para adultos a partir de 22 años en zonas concretas, como surcos y arrugas moderadas a severas, labios, mejillas, mentón y línea de la mandíbula. La duración depende del producto y de la zona. En clínica, la doctora valora tu rostro y define qué zona y qué producto son adecuados para ti.',
    ],
    beneficios: [
      'Suaviza surcos y pliegues del rostro.',
      'Devuelve o añade volumen en zonas como mejillas, labios, mentón o mandíbula.',
      'Es un procedimiento ambulatorio: te vas a casa el mismo día.',
      'Es temporal, de modo que puedes decidir más adelante si lo repites.',
      'El ácido hialurónico es un material que el cuerpo absorbe de forma gradual y que, según las revisiones, es reversible.',
    ],
    antes: [
      'Consulta con un profesional con formación en dermatología o cirugía plástica que te explique riesgos, beneficios y la zona donde se inyectará.',
      'Cuéntale tu historial de salud, tus alergias y los medicamentos que tomas.',
      'Pregunta qué producto se usará y pide ver el envase sellado y etiquetado.',
      'No compres rellenos por tu cuenta ni te los inyectes: los productos vendidos directamente al público pueden ser falsos o estar contaminados.',
    ],
    despues: [
      'Es frecuente tener hematomas, enrojecimiento, hinchazón, dolor o picazón en la zona; suelen resolverse en días o semanas.',
      'Algunos efectos pueden aparecer semanas, meses o incluso años después: avisa si notas bultos, enrojecimiento o hinchazón nuevos.',
      'Consulta de inmediato si tienes dolor inusual, cambios en la visión o la piel se ve blanca, gris o azulada cerca de donde se inyectó.',
      'Sigue las indicaciones de cuidado que te dé la doctora en tu cita.',
    ],
    contraindicaciones: [
      'Ser menor de 22 años: la FDA no ha establecido la seguridad en ese grupo.',
      'Embarazo o lactancia: no se ha establecido la seguridad.',
      'Tendencia a cicatrizar en exceso (queloides o cicatrices hipertróficas).',
      'Trastornos de la coagulación o ciertas alergias.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuánto dura el efecto?',
        respuesta: 'Depende del producto y de la zona. Como el cuerpo va absorbiendo el material, el efecto es temporal y puede requerir repetirse. La doctora te orientará según la zona que se trate.',
      },
      {
        pregunta: '¿Cuáles son los riesgos?',
        respuesta: 'Lo más común son hematomas, hinchazón, enrojecimiento y molestia. Con menos frecuencia pueden aparecer bultos, infección o reacciones alérgicas. El riesgo más grave es que el producto entre accidentalmente en un vaso sanguíneo, lo que puede causar daño del tejido, problemas de visión o un derrame cerebral; por eso es importante que lo haga un profesional con experiencia.',
      },
      {
        pregunta: '¿Se puede combinar con toxina botulínica?',
        respuesta: 'Se hace con frecuencia, pero la FDA señala que su uso conjunto no se ha evaluado en estudios clínicos controlados. La doctora valorará en tu consulta si te conviene.',
      },
      {
        pregunta: '¿Se puede corregir si no me gusta el resultado?',
        respuesta: 'Según una revisión sobre rellenos de mentón y mandíbula, el ácido hialurónico es reversible: se puede tratar con hialuronidasa, una enzima que lo descompone. Aun así, retirar o reducir un relleno puede requerir procedimientos adicionales, así que lo mejor es hablarlo con la doctora antes.',
      },
    ],
    fuentes: [
      FDA_CONSUMO,
      FDA_RELLENOS,
      { sitio: 'PubMed Central', titulo: 'Using injectable fillers for chin and jawline rejuvenation', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10296042/' },
    ],
  },
  {
    slug: 'toxina-botulinica',
    nombre: 'Toxina botulínica (Botox)',
    resumen: 'Inyecciones de toxina botulínica que relajan temporalmente ciertos músculos del rostro para suavizar arrugas de expresión.',
    queEs: [
      'La toxina botulínica es una proteína purificada que, inyectada en cantidades muy pequeñas, bloquea la señal que los nervios envían a un músculo. El músculo tratado se relaja de forma temporal y las líneas de expresión se suavizan. Botox es la marca más conocida; existen otras. En estética se usa en zonas como la frente, el entrecejo y las patas de gallo.',
      'El efecto no es permanente: con el tiempo el movimiento del músculo vuelve y puede ser necesario repetir. Debe aplicarlo un profesional de la salud capacitado: las inyecciones en lugares no médicos pueden ser peligrosas.',
    ],
    beneficios: [
      'Suaviza arrugas de expresión como las de la frente, el entrecejo y las patas de gallo.',
      'Es un procedimiento breve, con pocas molestias y casi sin tiempo de recuperación.',
      'Un buen tratamiento busca relajar solo lo necesario para que conserves tus expresiones naturales.',
      'No afecta la sensibilidad de la zona tratada.',
      'Con la experiencia clínica acumulada de más de 20 años, es un tratamiento con una larga trayectoria de uso.',
    ],
    antes: [
      'Dile a la doctora qué medicamentos y suplementos tomas.',
      'Los anticoagulantes y los antiinflamatorios pueden aumentar los hematomas en el punto de inyección; no los suspendas por tu cuenta, coméntalo en la consulta.',
      'Evita el alcohol 24 horas antes, porque puede aumentar el enrojecimiento y los hematomas.',
      'Cuéntale si estás embarazada, planeas estarlo o das de lactar.',
    ],
    despues: [
      'Puedes retomar tu rutina enseguida.',
      'No frotes, masajees ni presiones la zona tratada durante unas 12 horas, o lo que te indique la doctora.',
      'Evita el ejercicio intenso durante las 24 horas siguientes, o el tiempo que te indique la doctora.',
      'El efecto se nota a partir de los primeros días y se completa en unas dos semanas.',
      'Consulta de inmediato si tienes problemas de visión, dificultad para respirar o para tragar, o entumecimiento o parálisis en zonas no tratadas.',
    ],
    contraindicaciones: [
      'Embarazo y lactancia.',
      'Enfermedades neuromusculares.',
      'Párpados caídos (ptosis) o músculos faciales débiles.',
    ],
    preguntas: [
      {
        pregunta: '¿Duele?',
        respuesta: 'Se usa una aguja muy fina y la molestia suele ser leve y breve; a veces se aplica antes una crema anestésica. Después puede quedar algo de dolor, enrojecimiento o hinchazón en los puntos de inyección.',
      },
      {
        pregunta: '¿Cuánto dura el efecto?',
        respuesta: 'Para las arrugas, entre unos 3 y 6 meses según las fuentes consultadas, a veces más. Después el movimiento del músculo regresa gradualmente y se puede repetir el tratamiento si lo deseas.',
      },
      {
        pregunta: '¿Qué efectos secundarios puede tener?',
        respuesta: 'Los más comunes son hinchazón, enrojecimiento, molestia y hematomas, que suelen mejorar en uno o dos días (el hematoma puede durar cerca de una semana). Con menos frecuencia, dolor de cabeza. Rara vez, debilidad en un músculo vecino que provoca una ceja o un párpado caído de forma temporal.',
      },
      {
        pregunta: '¿Hay que repetirlo?',
        respuesta: 'El efecto es temporal: cuando pasa, el músculo recupera su movimiento y las líneas pueden volver. Si quieres mantener el resultado, el tratamiento se puede repetir cuando reaparezcan; la doctora te orientará sobre los tiempos.',
      },
    ],
    fuentes: [
      { sitio: 'American Academy of Dermatology', titulo: 'Botulinum toxin therapy: FAQs', url: 'https://www.aad.org/public/cosmetic/wrinkles/botulinum-toxin-faqs' },
      { sitio: 'Cleveland Clinic', titulo: 'Botox (Botulinum Toxin): What It Is, Results & Side Effects', url: 'https://my.clevelandclinic.org/health/treatments/8312-botulinum-toxin-injections' },
    ],
  },
  {
    slug: 'perfilado-de-nariz',
    nombre: 'Perfilado de nariz',
    resumen: 'Rinomodelación sin cirugía: se inyecta ácido hialurónico en puntos de la nariz para corregir pequeñas irregularidades; requiere valoración cuidadosa.',
    queEs: [
      'El perfilado de nariz, también llamado rinomodelación o rinoplastia sin cirugía, no es una operación. Se inyecta un relleno, habitualmente ácido hialurónico, en zonas puntuales de la nariz para redefinir su aspecto. Se usa para corregir defectos menores, como una pequeña joroba, una punta poco proyectada, hundimientos o irregularidades después de un golpe.',
      'No sustituye a la cirugía en casos importantes: las desviaciones o jorobas marcadas suelen requerir operación, y no está pensado para mejorar la respiración. Además, la nariz es una zona delicada: la FDA recomienda no inyectar rellenos en la nariz porque es un uso no aprobado, y las revisiones científicas lo consideran relativamente seguro pero con un riesgo bajo de complicaciones graves, sobre todo vasculares. La mayoría de los estudios son pequeños, de seguimiento corto y ninguno de los incluidos en una revisión sistemática fue un ensayo aleatorizado. Por eso conviene una valoración médica cuidadosa y expectativas realistas.',
    ],
    beneficios: [
      'Permite mejorar de forma sutil el perfil de la nariz sin pasar por quirófano.',
      'Es un procedimiento breve y sin hospitalización.',
      'En las revisiones, la mayoría de las personas tratadas reporta satisfacción con el resultado.',
      'Al usar ácido hialurónico, el efecto es reversible, porque existe una enzima que lo disuelve.',
      'Puede ser una opción para cambios pequeños en la forma de la nariz.',
    ],
    antes: [
      'Ten una consulta de valoración: la doctora evaluará si tu caso es adecuado o si necesitas una opinión quirúrgica.',
      'Habla de tus expectativas: se trata de retoques, no de cambios grandes.',
      'Cuéntale si te han operado la nariz antes y si has tenido otros rellenos; esto influye en el riesgo.',
      'Informa tus medicamentos y alergias; la doctora te dirá si debes ajustar alguno.',
    ],
    despues: [
      'Es común tener hematomas, hinchazón, enrojecimiento o dolor leve en los primeros días.',
      'Sigue las indicaciones de cuidado que te dé la doctora.',
      'Consulta de inmediato si tienes dolor intenso o inusual, cambios en la visión, o la piel de la nariz se ve blanca, grisácea, azulada o con ampollas: puede ser una complicación vascular urgente.',
      'Si más adelante te interesa una cirugía, avísale al cirujano que tuviste relleno en la nariz.',
    ],
    contraindicaciones: [
      'Deformidades marcadas (joroba grande, desviación importante, rotación de la punta) que suelen requerir cirugía.',
      'Embarazo y lactancia: no se ha establecido la seguridad de los rellenos.',
      'Ser menor de 22 años.',
      'Tendencia a cicatrizar en exceso (queloides).',
      'Trastornos de la coagulación o ciertas alergias.',
    ],
    preguntas: [
      {
        pregunta: '¿Es lo mismo que una operación de nariz?',
        respuesta: 'No. Es un complemento para cambios pequeños, no un reemplazo de la cirugía, y no corrige problemas de respiración ni deformidades importantes.',
      },
      {
        pregunta: '¿Cuánto dura?',
        respuesta: 'Con ácido hialurónico, los estudios reportan resultados de unos 8 a 12 meses, aunque varía según la persona. Después puede repetirse o dejar que el cuerpo lo absorba.',
      },
      {
        pregunta: '¿Cuáles son los riesgos?',
        respuesta: 'Lo más común son hematomas, hinchazón, enrojecimiento, dolor, asimetrías e irregularidades. Más rara, pero grave, es la oclusión de un vaso sanguíneo, que puede causar daño en la piel o incluso pérdida de la visión. Además, la FDA señala que el uso de rellenos en la nariz no está aprobado, por lo que la doctora valorará contigo si es una opción adecuada.',
      },
      {
        pregunta: '¿Puedo deshacerlo si no me gusta?',
        respuesta: 'Con ácido hialurónico, sí es posible disolver el relleno con una enzima.',
      },
    ],
    fuentes: [
      { sitio: 'Cureus (PubMed Central)', titulo: 'Non-surgical Rhinoplasty (NSR): A Systematic Review of Its Techniques, Outcomes, and Patient Satisfaction', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10792339/' },
      { sitio: 'PubMed', titulo: 'Complications of Nonsurgical Rhinoplasty with Hyaluronic Acid Injections: A Narrative Review', url: 'https://pubmed.ncbi.nlm.nih.gov/39747417/' },
      FDA_RELLENOS,
    ],
  },
  {
    slug: 'relleno-de-labios',
    nombre: 'Relleno / perfilado de labios',
    resumen: 'Inyecciones de ácido hialurónico que dan volumen y definen el contorno de los labios; el efecto es temporal.',
    queEs: [
      'El relleno de labios consiste en inyectar un gel, generalmente de ácido hialurónico, para aumentar su volumen, suavizar las líneas alrededor de la boca y corregir asimetrías. No detiene el envejecimiento, y el efecto es temporal porque el cuerpo lo va absorbiendo.',
      'En la consulta se revisan tu historial, alergias y medicamentos, y se conversa el resultado que buscas. La FDA aprueba los rellenos en labios para adultos de 22 años en adelante. Conviene que lo realice un profesional con formación, no un salón o spa.',
    ],
    beneficios: [
      'Aumenta el volumen y mejora la definición de los labios.',
      'Puede corregir asimetrías y suavizar líneas finas alrededor de la boca.',
      'Se aplica con anestesia tópica y toma desde unos 30 minutos.',
      'Suele haber una cita de control unas dos semanas después.',
      'Como el efecto es temporal, puedes cambiar de opinión más adelante.',
    ],
    antes: [
      'Cuéntale a la doctora tu historial, alergias, medicamentos y suplementos.',
      'Si tienes herpes labial (fuegos) o una infección en la boca, avísale: se suele esperar a que se resuelva.',
      'Puedes llevar una foto de referencia, aunque es posible que la doctora te proponga otro resultado según tu rostro.',
      'Ve con expectativas realistas: la idea es realzar tus labios de forma armónica.',
    ],
    despues: [
      'Es normal que los labios queden hinchados, sensibles y con algún hematoma; la hinchazón suele bajar en 24 a 48 horas, aunque puede durar hasta una semana.',
      'Puedes aplicar hielo por periodos cortos, sin presionar.',
      'Evita labiales, bálsamos y otros productos en los labios, y evita tocarlos, besar, tomar con sorbete y hacer ejercicio por al menos 24 horas.',
      'Evita el alcohol y las comidas que ensucien durante las primeras 24 horas.',
      'Acude a la cita de control (alrededor de dos semanas) y consulta antes si hay dolor intenso, cambios de color en la piel o fiebre.',
    ],
    contraindicaciones: [
      'Ser menor de 22 años.',
      'Embarazo: no se ha estudiado su seguridad.',
      'Infección activa en la boca o herpes labial en ese momento.',
      'Tendencia a cicatrizar en exceso (queloides) o trastornos de la coagulación.',
    ],
    preguntas: [
      {
        pregunta: '¿Duele?',
        respuesta: 'Se aplica una crema anestésica antes de inyectar, por lo que lo habitual es una molestia leve en los puntos de inyección, que suele pasar en 12 a 24 horas.',
      },
      {
        pregunta: '¿Cuánto dura?',
        respuesta: 'Según Cleveland Clinic, los resultados suelen mantenerse de 12 a 18 meses, y varían con el metabolismo de cada persona: en algunas personas se absorbe más rápido. Para mantener el efecto hay que repetir el tratamiento.',
      },
      {
        pregunta: '¿Qué riesgos tiene?',
        respuesta: 'Sangrado o dolor en los puntos, hematomas, hinchazón, asimetría, brotes de herpes labial, infección y desplazamiento del producto. Rara vez, si el relleno entra en un vaso sanguíneo, puede haber daño del tejido, por eso es clave que lo realice un profesional.',
      },
      {
        pregunta: '¿Puedo usar un "lápiz" o pen de ácido hialurónico en casa?',
        respuesta: 'No. Los dispositivos sin aguja vendidos al público no están aprobados y pueden causar daño serio o contaminación, según la FDA.',
      },
    ],
    fuentes: [
      { sitio: 'Cleveland Clinic', titulo: 'Lip Fillers: What to Expect, Types, Benefits & Side Effects', url: 'https://my.clevelandclinic.org/health/treatments/22133-lip-fillers' },
      FDA_CONSUMO,
    ],
  },
  {
    slug: 'mentoplastia',
    nombre: 'Mentoplastia',
    resumen: 'Mentoplastia no quirúrgica: relleno en el mentón para mejorar su proyección y equilibrar el perfil, sin pasar por quirófano.',
    queEs: [
      'En esta clínica, la mentoplastia es un procedimiento no quirúrgico: se inyecta un relleno, como ácido hialurónico o hidroxiapatita de calcio, en el mentón para darle más proyección, definirlo y equilibrar el perfil del rostro. No es una cirugía de mentón ni coloca implantes.',
      'El ácido hialurónico es el material más usado y estudiado en esta zona, y es reversible: existe una enzima que lo disuelve. La hidroxiapatita de calcio es semipermanente y no es reversible: no hay una enzima que la disuelva, por lo que si hay una complicación o no te gusta el resultado no se puede deshacer con una inyección y habría que esperar a que el cuerpo la absorba. Las revisiones señalan que los rellenos funcionan menos cuando el mentón está muy retraído, y que en esos casos la cirugía (genioplastia) logra resultados más estables. La doctora te dirá qué opción se ajusta a tu caso.',
    ],
    beneficios: [
      'Mejora la proyección y la definición del mentón sin cirugía.',
      'Ayuda a equilibrar el perfil del rostro.',
      'Es un procedimiento ambulatorio con poco tiempo de recuperación.',
      'Con ácido hialurónico, el resultado es reversible; la hidroxiapatita de calcio no lo es.',
      'Se puede combinar con relleno en la línea de la mandíbula para un contorno más armónico.',
    ],
    antes: [
      'Ten una consulta de valoración con la doctora, que revisará tu perfil y tus expectativas.',
      'Informa tu historial de salud, alergias y los medicamentos que tomas.',
      'Pregunta qué producto se usará y qué resultado es realista en tu caso.',
    ],
    despues: [
      'Es común tener hinchazón, enrojecimiento, hematomas o dolor leve en la zona durante los primeros días.',
      'Sigue las indicaciones de la doctora sobre cómo cuidar la zona.',
      'Consulta de inmediato si tienes dolor inusual, cambios en la visión, o la piel se ve blanca, gris o azulada cerca de la zona inyectada.',
      'Avisa si aparecen bultos o hinchazón meses después, porque algunas reacciones pueden ser tardías.',
    ],
    contraindicaciones: [
      'Ser menor de 22 años.',
      'Embarazo y lactancia: no se ha establecido la seguridad.',
      'Tendencia a cicatrizar en exceso (queloides).',
      'Trastornos de la coagulación o ciertas alergias.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuánto dura el resultado?',
        respuesta: 'Con ácido hialurónico, una revisión menciona entre unos 3 y 12 meses; con hidroxiapatita de calcio, al menos un año en la mayoría de las personas. Varía de una persona a otra.',
      },
      {
        pregunta: '¿Reemplaza a la cirugía de mentón?',
        respuesta: 'No siempre. Los rellenos funcionan bien para retoques, pero son menos eficaces si el mentón está muy retraído; en esos casos la cirugía suele dar resultados más estables.',
      },
      {
        pregunta: '¿Qué complicaciones puede haber?',
        respuesta: 'Lo más común es enrojecimiento, hinchazón, hematomas y dolor leve y pasajero. Menos frecuentes son la infección, las reacciones alérgicas y los bultos tardíos. Muy rara, pero grave, es la oclusión de un vaso sanguíneo, que puede causar daño en la piel o pérdida de visión.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed Central', titulo: 'Using injectable fillers for chin and jawline rejuvenation', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10296042/' },
      FDA_CONSUMO,
    ],
  },
  {
    slug: 'marcacion-mandibular',
    nombre: 'Marcación mandibular',
    resumen: 'Relleno no quirúrgico a lo largo de la mandíbula para definir el ángulo y enderezar la línea de la mandíbula.',
    queEs: [
      'La marcación mandibular es un procedimiento no quirúrgico en el que se inyecta un relleno en puntos de la mandíbula para definir el ángulo y hacer que la línea del contorno se vea más recta. Se emplea ácido hialurónico de alta densidad, hidroxiapatita de calcio o una mezcla de ambos, según el resultado que se busque. A diferencia del ácido hialurónico, que es reversible, la hidroxiapatita de calcio no se puede disolver con una enzima: si el resultado no te convence o hay una complicación, no es posible revertirla de inmediato.',
      'La FDA aprueba el uso de rellenos en la línea de la mandíbula en adultos desde los 22 años. La evidencia aún es limitada: los trabajos disponibles son sobre todo descripciones de técnica y series pequeñas, y no hay ensayos de alta calidad para todos los materiales. Es una zona con puntos anatómicos de riesgo, por eso conviene un profesional con formación y conocimiento de la anatomía facial.',
    ],
    beneficios: [
      'Define el ángulo de la mandíbula y endereza el contorno.',
      'Puede rellenar los huecos que se forman junto a los carrillos caídos (jowls).',
      'No requiere cirugía y tiene poco tiempo de recuperación.',
      'Con volúmenes pequeños por punto se logra un resultado más natural.',
      'Puede combinarse con relleno de mentón para un contorno más armónico.',
    ],
    antes: [
      'Consulta con la doctora: valorará tu rostro y cuál es el mejor material para tu objetivo.',
      'Cuéntale tu historial de salud, alergias y medicamentos.',
      'Pregunta qué producto se usará y por qué.',
    ],
    despues: [
      'Es común tener hinchazón, enrojecimiento, hematomas o sensibilidad en la zona.',
      'Sigue las indicaciones de la doctora para el cuidado de la zona.',
      'Consulta de inmediato si tienes dolor inusual, cambios en la visión, o la piel se ve blanca, gris o azulada.',
      'Si notas bultos o hinchazón semanas o meses después, avísale: pueden ser reacciones tardías.',
    ],
    contraindicaciones: [
      'Ser menor de 22 años.',
      'Embarazo y lactancia: no se ha establecido la seguridad.',
      'Tendencia a cicatrizar en exceso (queloides).',
      'Trastornos de la coagulación o ciertas alergias.',
    ],
    preguntas: [
      {
        pregunta: '¿Qué material se usa?',
        respuesta: 'Según el objetivo se puede usar ácido hialurónico de alta densidad, hidroxiapatita de calcio o una mezcla de ambos. El ácido hialurónico es reversible; la hidroxiapatita no, y eso pesa al elegir el material. La doctora te explicará cuál conviene en tu caso.',
      },
      {
        pregunta: '¿Cuánto dura?',
        respuesta: 'Depende del material. Una revisión menciona de 3 a 12 meses para el ácido hialurónico y, para la hidroxiapatita, al menos un año en la mayoría de los pacientes.',
      },
      {
        pregunta: '¿Qué riesgos tiene?',
        respuesta: 'Los más comunes son enrojecimiento, hinchazón, hematomas y dolor leve. Menos frecuentes: infección, reacciones alérgicas y bultos tardíos. Muy rara, pero grave, es la oclusión de un vaso sanguíneo.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'Nonsurgical Chin and Jawline Augmentation Using Calcium Hydroxylapatite and Hyaluronic Acid Fillers', url: 'https://pubmed.ncbi.nlm.nih.gov/30943558/' },
      { sitio: 'PubMed Central', titulo: 'Using injectable fillers for chin and jawline rejuvenation', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10296042/' },
    ],
  },
  {
    slug: 'levantamiento-de-pomulos',
    nombre: 'Levantamiento de pómulos',
    resumen: 'Relleno no quirúrgico en los pómulos que repone volumen en el tercio medio de la cara y da un aspecto más definido y descansado.',
    queEs: [
      'El levantamiento de pómulos es un procedimiento no quirúrgico: se inyecta un relleno, habitualmente ácido hialurónico, en la zona de las mejillas para reponer el volumen que se pierde con el tiempo o para definirlas. El efecto de "levantamiento" viene del volumen que se repone, no de una cirugía.',
      'La FDA aprueba el uso de rellenos en las mejillas para adultos desde los 22 años. En las revisiones, no se encontraron diferencias claras entre distintos rellenos de ácido hialurónico en eficacia, y los autores piden estudios más largos para conocer la durabilidad y la seguridad a largo plazo. La doctora valorará tu rostro y definirá qué producto y cuánta cantidad es adecuada.',
    ],
    beneficios: [
      'Repone el volumen del tercio medio de la cara.',
      'Define los pómulos y da un aspecto más descansado.',
      'No requiere cirugía y se hace en consulta.',
      'Tiene poco tiempo de recuperación.',
      'La doctora define contigo la cantidad según tu anatomía.',
    ],
    antes: [
      'Ten una consulta de valoración para revisar tu rostro, tus expectativas y los productos posibles.',
      'Cuéntale tu historial, tus alergias y los medicamentos que tomas.',
      'Pregunta qué producto se usará y pide ver el envase sellado.',
    ],
    despues: [
      'Es común tener hinchazón, enrojecimiento, hematomas o sensibilidad en las mejillas durante los primeros días.',
      'Sigue las indicaciones de cuidado que te dé la doctora.',
      'Consulta de inmediato si tienes dolor inusual, cambios en la visión, o la piel se ve blanca, gris o azulada.',
      'Si notas bultos o hinchazón semanas o meses después, avísale.',
    ],
    contraindicaciones: [
      'Ser menor de 22 años.',
      'Embarazo y lactancia: no se ha establecido la seguridad.',
      'Tendencia a cicatrizar en exceso (queloides).',
      'Trastornos de la coagulación o ciertas alergias.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuánto dura?',
        respuesta: 'Varía con el tipo de relleno y la cantidad aplicada, y los autores de la revisión señalan que faltan estudios con seguimiento más largo para conocer la durabilidad.',
      },
      {
        pregunta: '¿Todos los rellenos de ácido hialurónico dan el mismo resultado?',
        respuesta: 'En la revisión no se hallaron diferencias significativas de eficacia entre los rellenos comparados, aunque sí algunas de seguridad. Por eso la elección del producto la hace la doctora tras valorarte.',
      },
      {
        pregunta: '¿Qué riesgos tiene?',
        respuesta: 'Los más comunes son enrojecimiento, hinchazón, hematomas y molestia. Menos frecuentes: infección, reacciones alérgicas y bultos. Muy rara, pero grave, es la oclusión de un vaso sanguíneo, que puede causar daño en la piel o pérdida de visión.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'Efficacy and safety of different hyaluronic acid fillers on cheek volume augmentation: systematic review and network meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/39708174/' },
      FDA_CONSUMO,
    ],
  },
];
