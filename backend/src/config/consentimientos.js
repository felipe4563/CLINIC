// Consentimientos que se imprimen en la sección 6 de la historia clínica.
// Para agregar los de cada procedimiento (los pasa la clínica) basta sumar
// entradas aquí. Cada apartado lleva `campos` ([etiqueta, valor]), `parrafos`
// y/o `casillas` (se marcan a mano); `firmas` cierra con fecha y hora a mano.
// Marcadores: {clinica} {direccion_clinica} {contacto_clinica} {especialista}
// {registro} {especialidad} {paciente} {ci} {fecha_nacimiento} {telefono}
// {motivo} {procedimiento} (vacíos -> línea para completar a mano).
const CONSENTIMIENTOS = [
  {
    // Formato revisado por la doctora (doc/Consentimiento_Informado_General_Medicina_Estetica_Revisado.docx).
    clave: 'general',
    titulo: 'Consentimiento informado general – Medicina estética',
    apartados: [
      {
        titulo: 'Identificación del establecimiento',
        campos: [['Clínica/Consultorio', '{clinica}'], ['Dirección', '{direccion_clinica}'], ['Teléfono y correo electrónico', '{contacto_clinica}']],
      },
      {
        titulo: 'Identificación del médico',
        campos: [['Nombre completo', '{especialista}'], ['Registro profesional', '{registro}'], ['Especialidad', '{especialidad}'], ['Firma y sello', '']],
      },
      {
        titulo: 'Identificación del paciente',
        campos: [['Nombre completo', '{paciente}'], ['Documento de identidad', '{ci}'], ['Fecha de nacimiento', '{fecha_nacimiento}'], ['Teléfono', '{telefono}']],
      },
      {
        titulo: 'Diagnóstico o motivo del procedimiento',
        parrafos: ['Solicito valoración médica y tratamiento de medicina estética para la siguiente condición: {motivo}.'],
      },
      {
        titulo: 'Nombre específico del procedimiento',
        parrafos: ['Procedimiento indicado: {procedimiento}.'],
      },
      {
        titulo: 'Descripción del procedimiento',
        parrafos: [
          'El médico tratante me explicó de manera clara la naturaleza del procedimiento propuesto, su finalidad, técnica de realización, ' +
          'productos o dispositivos que podrán utilizarse, beneficios esperados, limitaciones, riesgos, posibles complicaciones y medidas de ' +
          'seguridad aplicables. Toda la información relevante quedará registrada en mi historia clínica.',
        ],
      },
      {
        titulo: 'Beneficios esperados',
        parrafos: [
          'Comprendo que los beneficios esperados son de carácter estético y/o funcional, pudiendo ser parciales o temporales. Los resultados ' +
          'dependen de factores individuales, del cumplimiento de las indicaciones médicas y de la respuesta biológica de cada paciente. No ' +
          'existe garantía de resultados específicos.',
        ],
      },
      {
        titulo: 'Riesgos y complicaciones',
        parrafos: [
          'Entiendo que todo procedimiento médico, incluso realizado conforme a la buena práctica médica, puede presentar riesgos y ' +
          'complicaciones, entre ellos dolor, edema, hematomas, infección, reacciones alérgicas, inflamación, alteraciones de la ' +
          'cicatrización, resultados insuficientes o necesidad de tratamientos complementarios, según el procedimiento realizado.',
        ],
      },
      {
        titulo: 'Alternativas terapéuticas',
        parrafos: [
          'He sido informado(a) acerca de las diferentes alternativas terapéuticas disponibles, incluyendo la posibilidad de no realizar el ' +
          'procedimiento, comprendiendo las ventajas, limitaciones y posibles consecuencias de cada opción.',
        ],
      },
      {
        titulo: 'Consecuencias de no realizar el procedimiento',
        parrafos: [
          'Comprendo que, si decido no realizar el tratamiento, la condición que motiva la consulta podrá permanecer sin cambios o ' +
          'evolucionar de manera natural.',
        ],
      },
      {
        titulo: 'Contraindicaciones relevantes',
        parrafos: [
          'Declaro haber informado al médico todos mis antecedentes personales y familiares relevantes, incluyendo embarazo, lactancia, ' +
          'alergias, enfermedades autoinmunes, trastornos de coagulación, enfermedades crónicas, uso de medicamentos y cualquier otra ' +
          'condición médica que pueda influir en el procedimiento.',
        ],
      },
      {
        titulo: 'Cuidados posteriores',
        parrafos: [
          'Me comprometo a cumplir estrictamente todas las indicaciones médicas antes y después del procedimiento, asistir a los controles ' +
          'programados y comunicar oportunamente cualquier signo o síntoma de alarma.',
        ],
      },
      {
        titulo: 'Declaración del paciente',
        parrafos: [
          'Declaro que he recibido información suficiente, clara, comprensible y veraz sobre el procedimiento propuesto. He tenido la ' +
          'oportunidad de formular todas las preguntas que consideré necesarias, las cuales fueron respondidas satisfactoriamente.',
          'Comprendo que la medicina estética no garantiza resultados específicos y otorgo mi consentimiento de manera libre, voluntaria e informada.',
        ],
      },
      {
        titulo: 'Autorización para fotografías clínicas',
        parrafos: ['Autorizo la toma de fotografías clínicas exclusivamente para fines de historia clínica, control evolutivo y seguimiento médico.'],
        casillas: ['Sí', 'No'],
      },
      {
        titulo: 'Revocación del consentimiento',
        parrafos: [
          'Entiendo que puedo revocar este consentimiento en cualquier momento antes de la realización del procedimiento, sin afectar mi ' +
          'derecho a recibir atención médica y orientación profesional.',
        ],
      },
    ],
    // Debajo de cada línea de firma: datos que se rellenan (vacíos se omiten).
    firmas: [
      { titulo: 'Firma del paciente', lineas: ['{paciente}', 'C.I.: {ci}'] },
      { titulo: 'Firma y sello del médico', lineas: ['{especialista}'] },
      { titulo: 'Testigo (si corresponde)', lineas: ['Nombre:', 'C.I.:'] },
    ],
  },
];

module.exports = { CONSENTIMIENTOS };
