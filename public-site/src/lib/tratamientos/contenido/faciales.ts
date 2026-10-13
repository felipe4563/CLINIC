import type { Tratamiento } from '../tipos';

export const faciales: Tratamiento[] = [
  {
    slug: 'microneedling',
    nombre: 'Microneedling',
    resumen: 'Microperforaciones controladas que invitan a la piel a producir más colágeno, para mejorar textura, poros y algunas cicatrices.',
    queEs: [
      'El microneedling es un procedimiento médico que usa agujas muy finas para hacer microperforaciones en la piel. Ese pequeño estímulo lleva al cuerpo a producir colágeno, y por eso también se le conoce como terapia de inducción de colágeno.',
      'Los dermatólogos lo emplean para cicatrices de acné, manchas, poros dilatados, estrías, arrugas finas y textura despareja. A veces se combina con otros productos, como el plasma rico en plaquetas. Debe hacerlo un profesional capacitado: los dispositivos de uso en casa o los lugares no médicos aumentan el riesgo de infección y de marcas.',
    ],
    beneficios: [
      'Puede mejorar la textura y la uniformidad del tono de la piel.',
      'Se usa para suavizar cicatrices de acné y otras cicatrices.',
      'Ayuda a que los poros dilatados se vean menos marcados.',
      'Tiene poco tiempo de recuperación: la mayoría de las personas retoma su rutina enseguida.',
      'Los resultados aparecen de forma gradual, porque el colágeno nuevo tarda semanas en formarse.',
    ],
    antes: [
      'Consulta antes con la doctora: revisará tu piel, tu historial de salud y lo que esperas lograr.',
      'Durante las semanas previas se suele indicar una rutina de cuidado de la piel; puede incluir pausar retinoides unos días.',
      'Protege tu piel del sol antes del procedimiento y evita llegar con bronceado o quemadura reciente.',
      'Si tomaste isotretinoína, avisa: se suele esperar al menos un mes después de la última pastilla.',
    ],
    despues: [
      'Es normal ver enrojecimiento (o un tono más oscuro en pieles morenas), sensación de piel quemada e hinchazón leve; suele pasar en unos días hasta una semana.',
      'Espera 24 horas antes de maquillarte.',
      'Usa la crema que te indique la doctora y sigue sus cuidados al pie de la letra para prevenir infecciones.',
      'Protege la piel del sol; así también ayudas a que los resultados duren más.',
      'Pregunta por las sesiones: el número depende del motivo de consulta y de la zona tratada.',
    ],
    contraindicaciones: [
      'Cicatrización lenta o deficiente.',
      'Antecedente de queloides.',
      'Sistema inmunitario debilitado por una enfermedad o por medicamentos.',
      'Tratamiento por cáncer de piel en la zona, o radioterapia.',
      'Infección de la piel, acné activo con dolor o pus, o quemadura solar reciente: se espera a que se resuelva.',
      'Uso reciente de isotretinoína.',
    ],
    preguntas: [
      {
        pregunta: '¿Duele?',
        respuesta: 'Suele causar molestia leve y pasajera, además de enrojecimiento e hinchazón que se calman en pocos días. Si te preocupa, coméntalo con la doctora antes del procedimiento.',
      },
      {
        pregunta: '¿Cuántas sesiones necesito?',
        respuesta: 'Depende de lo que se quiera tratar y de la zona. Para cicatrices de acné, por ejemplo, la AAD menciona series de varias sesiones espaciadas por algunas semanas. La doctora definirá el plan después de valorarte.',
      },
      {
        pregunta: '¿Los resultados son definitivos?',
        respuesta: 'No. Mejoran poco a poco en semanas a meses y se van perdiendo cuando el colágeno disminuye con el tiempo. Cuidarte del sol y no fumar ayuda, y a veces se sugiere una sesión de mantenimiento.',
      },
      {
        pregunta: '¿Puedo hacerlo en casa con un rodillo?',
        respuesta: 'No es lo recomendable. Los dispositivos caseros pueden irritar, infectar o dejar cicatrices, y pueden transmitir virus si se comparten. Es mejor un procedimiento médico con material estéril.',
      },
    ],
    fuentes: [
      { sitio: 'American Academy of Dermatology', titulo: 'Microneedling can fade scars, uneven skin tone, and more', url: 'https://www.aad.org/public/cosmetic/scars-stretch-marks/microneedling-fade-scars' },
    ],
  },
  {
    slug: 'prp-facial',
    nombre: 'PRP facial',
    resumen: 'Plasma rico en plaquetas de tu propia sangre aplicado en la piel del rostro para estimular su regeneración; la evidencia aún es mixta.',
    queEs: [
      'El PRP (plasma rico en plaquetas) se prepara con tu propia sangre: se extrae una muestra, se centrifuga para concentrar las plaquetas y ese concentrado se aplica en la piel, ya sea con inyecciones finas o junto con microneedling. Las plaquetas contienen factores de crecimiento que participan en la reparación de los tejidos.',
      'La investigación en rejuvenecimiento facial es todavía temprana y sus resultados son mixtos. Una revisión sistemática de 20 estudios encontró que el espesor y la elasticidad de la piel eran los aspectos con mejor respaldo, y la hidratación el de menor respaldo. Además, la preparación del PRP no está estandarizada. Por eso se presenta como un tratamiento complementario, no como una solución única.',
    ],
    beneficios: [
      'Usa material de tu propio cuerpo.',
      'Puede mejorar el espesor y la elasticidad de la piel, que son los resultados con más respaldo en las revisiones.',
      'En los estudios, las personas tratadas suelen reportar satisfacción con el cambio en su piel.',
      'En las revisiones no se reportaron eventos adversos graves.',
      'Puede combinarse con otros procedimientos faciales, como el microneedling.',
    ],
    antes: [
      'La doctora revisará tu historial de salud y los medicamentos que tomas.',
      'Si usas anticoagulantes o antiinflamatorios, díselo: puede pedirte suspenderlos antes; no lo hagas por tu cuenta.',
      'Llega con la piel limpia y sin infecciones activas en la zona.',
    ],
    despues: [
      'Es habitual tener hinchazón y molestia durante uno o dos días.',
      'Los cambios en la piel aparecen de forma gradual, a lo largo de semanas.',
      'Sigue las indicaciones de la doctora sobre limpieza, hidratación y protección solar.',
      'Si notas dolor creciente, calor, secreción o fiebre, consulta de inmediato.',
    ],
    contraindicaciones: [
      'Ciertos trastornos de la sangre o de las plaquetas.',
      'Uso de anticoagulantes o antiinflamatorios: el médico decide si se ajustan.',
      'Infección de la piel o lesiones activas en la zona a tratar.',
      'Embarazo y lactancia: por falta de estudios, el médico lo valora caso por caso.',
    ],
    preguntas: [
      {
        pregunta: '¿Por qué se usa mi propia sangre?',
        respuesta: 'Porque el concentrado de plaquetas se obtiene de ti, con una extracción de sangre y un proceso de centrifugado. Por eso es un tratamiento individualizado y no se produce en serie.',
      },
      {
        pregunta: '¿Cuándo veré resultados?',
        respuesta: 'Los cambios suelen notarse después de algunas semanas y siguen evolucionando. Algunas personas necesitan más de una sesión; la doctora te orientará según tu caso.',
      },
      {
        pregunta: '¿Está comprobado que funciona?',
        respuesta: 'Hay estudios que sugieren mejoras, sobre todo en grosor y elasticidad de la piel, pero la evidencia es mixta y muchos estudios son pequeños. Es un tratamiento prometedor, no una garantía de resultado.',
      },
    ],
    fuentes: [
      { sitio: 'Cleveland Clinic', titulo: 'Platelet-Rich Plasma (PRP Injection): What It Is & Uses', url: 'https://my.clevelandclinic.org/health/treatments/platelet-rich-plasma-prp-injection' },
      { sitio: 'PubMed', titulo: 'Systematic Review of Platelet-Rich Plasma and Platelet-Rich Fibrin in Facial Rejuvenation', url: 'https://pubmed.ncbi.nlm.nih.gov/40167104/' },
    ],
  },
  {
    slug: 'pdrn-pn',
    nombre: 'PDRN / PN',
    resumen: 'Polinucleótidos aplicados en la piel para mejorar su calidad; es un tratamiento reciente con evidencia todavía limitada.',
    queEs: [
      'PDRN (polidesoxirribonucleótidos) y PN (polinucleótidos) son fragmentos de ADN purificado que se inyectan en la piel con la idea de favorecer su reparación y mejorar su calidad: textura, elasticidad e hidratación. Se emplean en la llamada bioestimulación o biorrevitalización.',
      'Es un tratamiento reciente. Las revisiones disponibles reúnen pocos estudios, pequeños, de calidad baja a moderada y con técnicas muy distintas entre sí, y concluyen que aún no hay consenso sobre cómo usarlo de forma óptima. Los resultados son prometedores, pero se necesitan estudios más grandes y rigurosos para confirmarlos.',
    ],
    beneficios: [
      'En los estudios se han descrito mejoras en arrugas finas, textura y elasticidad de la piel.',
      'Se ha usado también para apoyar la cicatrización; es donde los ensayos muestran el efecto más consistente.',
      'Los efectos secundarios descritos son en general leves y pasajeros.',
      'Muchas personas tratadas reportan satisfacción de moderada a alta.',
    ],
    antes: [
      'Cuenta a la doctora tus alergias, enfermedades y medicamentos; tomará la decisión de si es adecuado para ti.',
      'Llega con la piel limpia y sin infecciones o lesiones en la zona.',
      'Pregunta qué producto se usará y qué se sabe de él, ya que las preparaciones varían.',
    ],
    despues: [
      'Pueden aparecer enrojecimiento o pequeñas molestias en los puntos de aplicación que se calman solos.',
      'Sigue las indicaciones de la doctora sobre limpieza, maquillaje y protección solar.',
      'Avisa si notas dolor intenso, hinchazón que aumenta o signos de infección.',
      'Los cambios son graduales; la doctora puede proponerte una o más sesiones según tu caso.',
    ],
    contraindicaciones: [
      'Alergia conocida a alguno de los componentes del producto.',
      'Infección activa o lesiones en la piel de la zona a tratar.',
      'Embarazo y lactancia: no hay estudios suficientes, por lo que el médico lo valora con cautela.',
      'Cualquier condición médica que la doctora considere un riesgo.',
    ],
    preguntas: [
      {
        pregunta: '¿PDRN y PN son lo mismo?',
        respuesta: 'Son parecidos, pues ambos derivan de ADN, pero no idénticos: se diferencian sobre todo por el tamaño de sus cadenas. En la práctica los nombres se usan a veces como sinónimos, por eso conviene preguntar qué producto se usará.',
      },
      {
        pregunta: '¿Tiene respaldo científico?',
        respuesta: 'Hay estudios con resultados favorables y buena tolerancia, pero son pocos, pequeños y distintos entre sí. Es un tratamiento reciente, y las propias revisiones piden más investigación.',
      },
      {
        pregunta: '¿Es seguro?',
        respuesta: 'En los ensayos revisados no se reportaron eventos adversos graves y los efectos secundarios fueron leves. Aun así, el tiempo de seguimiento es corto, por lo que la valoración médica previa es importante.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'The Effectiveness of Polynucleotides in Esthetic Medicine: A Systematic Review', url: 'https://pubmed.ncbi.nlm.nih.gov/39645667/' },
      { sitio: 'PubMed', titulo: 'Polynucleotides and Polydeoxyribonucleotides for Skin Rejuvenation, Postoperative Scar Prevention, and Wound Healing: A Systematic Review of Randomized Clinical Trials', url: 'https://pubmed.ncbi.nlm.nih.gov/42572627/' },
    ],
  },
  {
    slug: 'exosomas',
    nombre: 'Exosomas',
    resumen: 'Vesículas microscópicas que se estudian para rejuvenecer la piel. Es un campo muy reciente: la evidencia clínica es escasa y no están aprobadas por la FDA.',
    queEs: [
      'Los exosomas son vesículas diminutas que las células liberan para comunicarse entre sí. En medicina estética se estudia aplicarlos sobre la piel, a veces junto con microneedling, para el rejuvenecimiento, las manchas, las cicatrices y el cabello.',
      'Es un tratamiento muy reciente y su evidencia es principalmente preliminar. Las revisiones señalan resultados iniciales alentadores, pero también falta de estandarización en cómo se producen y aplican, pocos estudios clínicos y preocupaciones de seguridad, como infecciones o reacciones inflamatorias. La FDA de Estados Unidos advierte que actualmente no hay productos de exosomas aprobados. Por eso es especialmente importante la valoración médica y preguntar por el origen del producto.',
    ],
    beneficios: [
      'En estudios iniciales se han descrito mejoras en la apariencia de la piel, como textura y elasticidad.',
      'Se investigan también para manchas, cicatrices y recuperación de la piel después de otros procedimientos.',
      'Es un campo de investigación activo que podría ofrecer opciones en el futuro.',
    ],
    antes: [
      'Pregunta a la doctora qué producto se usa, de dónde proviene y qué respaldo tiene; la calidad varía mucho entre preparaciones.',
      'Comenta tus alergias, enfermedades y medicamentos para que valore si es adecuado para ti.',
      'Llega con la piel limpia y sin infecciones o lesiones en la zona.',
    ],
    despues: [
      'Sigue al pie de la letra las indicaciones de limpieza, hidratación y protección solar.',
      'Vigila la zona: si aparece dolor creciente, calor, secreción, fiebre o mucho enrojecimiento, consulta de inmediato.',
      'Si tuviste una reacción inesperada, avísale a la doctora para que se registre y se atienda.',
    ],
    contraindicaciones: [
      'Infección activa o lesiones en la piel de la zona a tratar.',
      'Alergia a componentes del producto.',
      'Antecedente de cáncer o lesiones de la piel sospechosas: la doctora debe valorarlo antes, porque falta información sobre seguridad.',
      'Embarazo y lactancia: no hay estudios suficientes.',
    ],
    preguntas: [
      {
        pregunta: '¿Están aprobados los exosomas?',
        respuesta: 'La FDA de Estados Unidos indica que actualmente no existe ningún producto de exosomas aprobado. Por eso conviene hablar con la doctora sobre el producto concreto, su origen y su respaldo antes de decidir.',
      },
      {
        pregunta: '¿Tienen evidencia científica?',
        respuesta: 'Los estudios en laboratorio y las series de casos son alentadores, pero faltan ensayos clínicos amplios y no hay una forma estándar de producirlos. Tómalo como un tratamiento en investigación.',
      },
      {
        pregunta: '¿Qué riesgos tienen?',
        respuesta: 'Las revisiones mencionan riesgo de infección, de reacción inflamatoria y dudas teóricas sobre efectos a largo plazo. Por eso es esencial que lo aplique personal médico y con productos de origen confiable.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'Exosomes for Aesthetic Dermatology: A Comprehensive Literature Review and Update', url: 'https://pubmed.ncbi.nlm.nih.gov/39764639/' },
      { sitio: 'PubMed', titulo: 'Exosomes: A Comprehensive Review for the Practicing Dermatologist', url: 'https://pubmed.ncbi.nlm.nih.gov/40256340/' },
      { sitio: 'FDA', titulo: 'Consumer Alert on Regenerative Medicine Products Including Stem Cells and Exosomes', url: 'https://www.fda.gov/vaccines-blood-biologics/consumers-biologics/consumer-alert-regenerative-medicine-products-including-stem-cells-and-exosomes' },
    ],
  },
  {
    slug: 'peelings-medicos',
    nombre: 'Peelings médicos',
    resumen: 'Aplicación de soluciones químicas que renuevan las capas de la piel para mejorar manchas, textura y arrugas finas, según la profundidad elegida.',
    queEs: [
      'Un peeling químico consiste en aplicar una solución que provoca una lesión controlada en la piel. Las capas tratadas se desprenden y dejan ver una piel más lisa y de tono más parejo. Se usa sobre todo en el rostro, el cuello y las manos.',
      'Hay peelings superficiales, medios y profundos. Los superficiales tienen poca recuperación y suelen hacerse en serie; los medios y profundos llegan más hondo, dan cambios más marcados y requieren más tiempo de recuperación. La indicación depende de tu piel y de lo que quieras tratar, y siempre previa valoración médica.',
    ],
    beneficios: [
      'Puede mejorar arrugas finas, manchas solares y de melasma, y cicatrices leves de acné.',
      'Deja la piel más lisa y de tono más uniforme.',
      'Los superficiales tienen poca recuperación y permiten retomar la rutina pronto.',
      'Se puede elegir la profundidad según el objetivo y la sensibilidad de la piel.',
    ],
    antes: [
      'Evita el bronceado y el sol directo durante las dos semanas previas.',
      'La doctora puede pedirte pausar retinoides una o dos semanas antes, o usar productos despigmentantes: no cambies tu rutina por tu cuenta.',
      'La piel no debe tener heridas, lesiones ni infecciones en la zona.',
      'Si has tenido herpes labial, avisa; puede recetarse un antiviral preventivo.',
    ],
    despues: [
      'Espera enrojecimiento y descamación; en los superficiales dura entre tres y siete días, y más tiempo en los medios y profundos.',
      'No rasques, no arranques las pieles ni uses camas solares.',
      'Mantén la piel hidratada con las cremas que te indique la doctora.',
      'Evita el sol durante la curación y usa protector solar a diario cuando la piel haya sanado.',
      'Consulta si la piel arde, pica o se hincha de forma importante.',
    ],
    contraindicaciones: [
      'Heridas abiertas, infecciones o lesiones activas en la zona.',
      'Antecedente de cicatrización anormal o cicatrices con mucha pigmentación.',
      'Medicamentos o condiciones que vuelven la piel más sensible.',
      'Imposibilidad de evitar el sol durante la curación.',
      'Piel morena u oscura: mayor riesgo de manchas posteriores, por lo que requiere un profesional con experiencia.',
      'Embarazo o uso de anticonceptivos hormonales: puede aumentar el riesgo de manchas; coméntalo con el médico.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuántos peelings necesito?',
        respuesta: 'Los superficiales suelen hacerse en una serie de varias sesiones, espaciadas por algunas semanas. Los medios se repiten con más tiempo entre sesiones. La doctora definirá el plan.',
      },
      {
        pregunta: '¿Puedo maquillarme después?',
        respuesta: 'Tras un peeling superficial suele permitirse el mismo día o al siguiente. Después de uno medio se espera varios días, hasta que la doctora lo autorice.',
      },
      {
        pregunta: '¿Qué riesgos tiene?',
        respuesta: 'Pueden aparecer cambios de color en la piel, enrojecimiento prolongado y, rara vez, cicatrices o infección; también puede reactivarse el herpes labial. Seguir las indicaciones y protegerte del sol reduce mucho estos riesgos.',
      },
      {
        pregunta: '¿Los kits de peeling caseros son iguales?',
        respuesta: 'No. La AAD advierte que algunos kits caseros han causado lesiones graves. Es preferible hacerse el peeling con un profesional.',
      },
    ],
    fuentes: [
      { sitio: 'Cleveland Clinic', titulo: 'Chemical Peels: Types of Peels, Conditions Treated, What to Expect', url: 'https://my.clevelandclinic.org/health/treatments/11010-chemical-peels' },
      { sitio: 'American Academy of Dermatology', titulo: 'Chemical peels: FAQs', url: 'https://www.aad.org/public/cosmetic/younger-looking/chemical-peels-faqs' },
    ],
  },
  {
    slug: 'acido-hialuronico-hidratacion',
    nombre: 'Ácido hialurónico (hidratación facial)',
    resumen: 'Microinyecciones de ácido hialurónico no volumizante para mejorar la hidratación y la luminosidad de la piel del rostro.',
    queEs: [
      'El ácido hialurónico es una sustancia que la piel produce de forma natural y que retiene agua. Con el paso de los años su cantidad disminuye. En la hidratación facial se aplican microinyecciones de un producto de ácido hialurónico en la dermis, no para dar volumen sino para mejorar la calidad de la piel. A veces se les llama skin boosters.',
      'Las revisiones concluyen que mejora la hidratación y la luminosidad de la piel, y que es bien tolerado, pero la evidencia aún es limitada: los estudios son pequeños y el seguimiento corto. En elasticidad los resultados son menos consistentes. Es distinto del relleno de ácido hialurónico, que sí aporta volumen.',
    ],
    beneficios: [
      'Puede mejorar la hidratación de la piel.',
      'Aporta mayor luminosidad y una textura más suave.',
      'Puede ayudar a la sensación de firmeza en algunas personas.',
      'En los estudios, el nivel de satisfacción fue alto y el tratamiento se consideró seguro.',
    ],
    antes: [
      'Consulta con la doctora para valorar tu piel y definir si es lo que necesitas.',
      'Informa tus alergias y los medicamentos que usas, sobre todo anticoagulantes.',
      'Llega con la piel limpia, sin infecciones ni herpes activo en la zona.',
    ],
    despues: [
      'Es normal tener pequeñas marcas de las punciones, enrojecimiento o hinchazón leve por un tiempo corto.',
      'Sigue las indicaciones de la doctora sobre maquillaje, limpieza y protección solar.',
      'Avisa si notas dolor intenso, bultos que no ceden o signos de infección.',
      'Los resultados no son permanentes: el producto se va absorbiendo; la doctora te dirá cada cuánto repetir.',
    ],
    contraindicaciones: [
      'Alergia conocida al ácido hialurónico o a algún componente del producto.',
      'Infección activa o herpes en la zona a tratar.',
      'Trastornos de la coagulación o uso de anticoagulantes: el médico debe valorarlo.',
      'Embarazo y lactancia: por falta de estudios, se suele posponer.',
    ],
    preguntas: [
      {
        pregunta: '¿Es lo mismo que un relleno?',
        respuesta: 'No. El relleno busca dar volumen o remodelar; la hidratación facial se aplica en capas superficiales para mejorar la calidad de la piel. Son productos y objetivos diferentes.',
      },
      {
        pregunta: '¿Cuánto duran los efectos?',
        respuesta: 'No son permanentes. La duración depende del producto y de cada piel, y los efectos disminuyen con el tiempo. La doctora te indicará cada cuánto repetirlo según tu caso.',
      },
      {
        pregunta: '¿Hay respaldo científico?',
        respuesta: 'Sí, hay revisiones con resultados favorables en hidratación y luminosidad, pero con estudios pequeños. Se piden más ensayos grandes para confirmar sus beneficios.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'The Effectiveness of Injectable Hyaluronic Acid in the Improvement of the Facial Skin Quality: A Systematic Review', url: 'https://pubmed.ncbi.nlm.nih.gov/37038447/' },
      { sitio: 'PubMed', titulo: 'The Effect of Local Hyaluronic Acid Injection on Skin Aging: A Systematic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/39807700/' },
    ],
  },
  {
    slug: 'coctel-de-vitaminas',
    nombre: 'Cóctel de vitaminas',
    resumen: 'Mezcla de vitaminas y antioxidantes aplicada en la piel con microinyecciones (mesoterapia); su respaldo científico es limitado.',
    queEs: [
      'El cóctel de vitaminas es una forma de mesoterapia facial: se inyectan en la dermis, en pequeñas cantidades, mezclas de vitaminas, minerales y otras sustancias con la idea de nutrir la piel y ayudar a las células que producen colágeno. Las fórmulas varían según el producto.',
      'Es importante que sepas que la evidencia es limitada. Una revisión de 2021 concluyó que la mesoterapia para rejuvenecimiento de la piel es un procedimiento controvertido, que la prueba de su eficacia aún falta y que, por ahora, no puede recomendarse como tratamiento de rutina. Se ofrece como complemento para mejorar el aspecto de la piel, no como solución definitiva.',
    ],
    beneficios: [
      'Busca aportar vitaminas y antioxidantes directamente a la piel.',
      'Puede dar sensación de piel más fresca e hidratada, según la fórmula.',
      'Es un procedimiento breve y de recuperación rápida.',
    ],
    antes: [
      'Consulta con la doctora y cuéntale tus alergias, enfermedades y medicamentos.',
      'Pregunta qué contiene el producto y por qué te lo recomiendan.',
      'Llega con la piel limpia y sin infecciones en la zona.',
    ],
    despues: [
      'Puede haber enrojecimiento, pequeñas marcas o molestia leve en los puntos de aplicación.',
      'Sigue las indicaciones de la doctora sobre limpieza, maquillaje y protección solar.',
      'Avisa si notas dolor creciente, hinchazón o ronchas que se extienden.',
    ],
    contraindicaciones: [
      'Alergia a alguno de los componentes del cóctel.',
      'Infección o lesiones activas en la piel de la zona.',
      'Trastornos de la coagulación o uso de anticoagulantes: el médico debe valorarlo.',
      'Embarazo y lactancia: por falta de estudios, el médico lo valora con cautela.',
    ],
    preguntas: [
      {
        pregunta: '¿Qué lleva el cóctel?',
        respuesta: 'La composición cambia según el producto y la necesidad de tu piel. Pídele a la doctora que te explique qué contiene el que te propone.',
      },
      {
        pregunta: '¿Tiene respaldo científico?',
        respuesta: 'Es limitado. Las revisiones concluyen que falta prueba sólida de que funcione para rejuvenecer la piel. Por eso conviene ver este tratamiento como un complemento, con expectativas realistas.',
      },
      {
        pregunta: '¿Cuántas sesiones se necesitan?',
        respuesta: 'No hay un número estándar establecido. La doctora lo propondrá según tu piel y tu objetivo, y evaluará si te está beneficiando.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'An Update on Facial Skin Rejuvenation Effectiveness of Mesotherapy EBM V', url: 'https://pubmed.ncbi.nlm.nih.gov/34516073/' },
      { sitio: 'PubMed', titulo: 'Polycomponent mesotherapy formulations for the treatment of skin aging and improvement of skin quality', url: 'https://pubmed.ncbi.nlm.nih.gov/25897252/' },
    ],
  },
  {
    slug: 'dmae-silicio-organico',
    nombre: 'DMAE + silicio orgánico',
    resumen: 'Combinación de DMAE y silicio orgánico buscada para dar firmeza a la piel. Cada componente tiene datos limitados y la combinación casi no se ha estudiado.',
    queEs: [
      'El DMAE (dimetilaminoetanol) es una sustancia relacionada con la colina que se ha estudiado para dar firmeza a la piel. El silicio orgánico es una fuente de silicio que se asocia a la salud de la piel. En estética se usan juntos con la idea de mejorar la firmeza y el aspecto del rostro.',
      'La evidencia es limitada. En DMAE, el estudio más sólido es de un gel aplicado sobre la piel durante 16 semanas, con mejoras en líneas de la frente y arrugas alrededor de los ojos. Del silicio orgánico, lo publicado muestra que puede llegar a las capas de la piel en pruebas de laboratorio, pero no demuestra que firme la piel. Las fuentes consultadas no incluyen estudios clínicos amplios que evalúen la combinación inyectada. Por eso es importante la valoración médica y mantener expectativas realistas.',
    ],
    beneficios: [
      'El DMAE aplicado sobre la piel se ha asociado, en un estudio controlado, con mejoras en arrugas finas de la frente y alrededor de los ojos.',
      'Se ha asociado a una mayor sensación de firmeza de la piel.',
      'En ese estudio el DMAE fue bien tolerado y no hubo más irritación que con el placebo.',
    ],
    antes: [
      'Consulta con la doctora, que valorará tu piel y si este tratamiento tiene sentido para ti.',
      'Informa tus alergias, enfermedades y medicamentos.',
      'Pregunta cómo se usará (inyectado o en crema) y qué respaldo tiene en tu caso.',
    ],
    despues: [
      'Puede haber enrojecimiento o molestia leve en la zona tratada.',
      'Sigue las indicaciones de la doctora sobre limpieza, maquillaje y protección solar.',
      'Consulta si notas dolor creciente, hinchazón, ronchas o signos de infección.',
    ],
    contraindicaciones: [
      'Alergia a alguno de los componentes.',
      'Infección o lesiones activas en la piel de la zona.',
      'Embarazo y lactancia: por falta de estudios, el médico lo valora con cautela.',
      'Cualquier condición médica que la doctora considere un riesgo.',
    ],
    preguntas: [
      {
        pregunta: '¿Para qué sirve el DMAE?',
        respuesta: 'Se ha estudiado en la piel para mejorar la firmeza y algunas arrugas finas. Los resultados que existen provienen sobre todo de geles aplicados sobre la piel y no equivalen sin más a una aplicación inyectada.',
      },
      {
        pregunta: '¿Y el silicio orgánico?',
        respuesta: 'Es una fuente de silicio con la que se busca apoyar a la piel. Las pruebas publicadas muestran que puede penetrar en laboratorio, pero no han demostrado por sí solas un efecto en la firmeza de la piel.',
      },
      {
        pregunta: '¿Tiene respaldo científico?',
        respuesta: 'Es limitado. Hay un estudio controlado de DMAE tópico y datos de laboratorio del silicio, pero casi nada sobre la combinación en este tratamiento. La doctora puede explicarte qué esperar.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'The role of dimethylaminoethanol in cosmetic dermatology', url: 'https://pubmed.ncbi.nlm.nih.gov/15675889/' },
      { sitio: 'PubMed', titulo: 'Topical monomethylsilanetriol can deliver silicon to the viable skin', url: 'https://pubmed.ncbi.nlm.nih.gov/31230363/' },
    ],
  },
  {
    slug: 'coctel-de-aminoacidos',
    nombre: 'Cóctel de aminoácidos',
    resumen: 'Mezcla de aminoácidos aplicada con microinyecciones en la piel para apoyar la producción de colágeno; la evidencia aún es limitada.',
    queEs: [
      'Los aminoácidos son los bloques con los que el cuerpo construye proteínas como el colágeno. En este tratamiento, un cóctel de aminoácidos, a menudo junto con ácido hialurónico, se aplica con microinyecciones en la piel (mesoterapia) para dar a las células de la dermis lo necesario para trabajar mejor.',
      'La evidencia todavía es limitada. En un estudio con 20 mujeres, ácido hialurónico con aminoácidos aumentó la actividad de los fibroblastos y el grosor de la epidermis en las biopsias, pero la ecografía no mostró diferencias en el grosor de la piel. Una revisión general de la mesoterapia facial concluye que aún falta prueba sólida de su eficacia. Es un complemento, no una solución definitiva.',
    ],
    beneficios: [
      'Busca aportar a la piel los componentes que usa para producir colágeno.',
      'En un estudio con biopsias se observó mayor actividad de las células productoras de colágeno.',
      'Es un procedimiento breve y de recuperación rápida.',
    ],
    antes: [
      'Consulta con la doctora y cuéntale tus alergias, enfermedades y medicamentos.',
      'Pregunta qué contiene el producto y qué se espera lograr en tu piel.',
      'Llega con la piel limpia y sin infecciones en la zona.',
    ],
    despues: [
      'Puede haber enrojecimiento, pequeñas marcas o molestia leve en los puntos de aplicación.',
      'Sigue las indicaciones de la doctora sobre limpieza, maquillaje y protección solar.',
      'Consulta si notas dolor creciente, hinchazón o signos de infección.',
    ],
    contraindicaciones: [
      'Alergia a alguno de los componentes del cóctel.',
      'Infección o lesiones activas en la piel de la zona.',
      'Trastornos de la coagulación o uso de anticoagulantes: el médico debe valorarlo.',
      'Embarazo y lactancia: por falta de estudios, el médico lo valora con cautela.',
    ],
    preguntas: [
      {
        pregunta: '¿Para qué sirve?',
        respuesta: 'Se usa para apoyar la calidad de la piel del rostro, con la idea de favorecer el colágeno. Su efecto visible varía y no está confirmado por estudios grandes.',
      },
      {
        pregunta: '¿Tiene respaldo científico?',
        respuesta: 'Es limitado: hay estudios pequeños con resultados prometedores a nivel de tejido, pero no hay pruebas sólidas de beneficio visible. Conviene tener expectativas realistas.',
      },
      {
        pregunta: '¿Cuántas sesiones necesito?',
        respuesta: 'No hay un número estándar. La doctora lo propondrá según tu piel y valorará si estás respondiendo al tratamiento.',
      },
    ],
    fuentes: [
      { sitio: 'PubMed', titulo: 'The efficacy of hyaluronic acid fragments with amino acid in combating facial skin aging: an ultrasound and histological study', url: 'https://pubmed.ncbi.nlm.nih.gov/38913131/' },
      { sitio: 'PubMed', titulo: 'An Update on Facial Skin Rejuvenation Effectiveness of Mesotherapy EBM V', url: 'https://pubmed.ncbi.nlm.nih.gov/34516073/' },
    ],
  },
];
