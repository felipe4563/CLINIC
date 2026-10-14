// Consentimientos que se imprimen en la sección 6 de la historia clínica.
// Para agregar los de cada procedimiento (los pasa la clínica) basta sumar
// entradas aquí. Marcadores: {paciente} {ci} {especialista} {procedimiento} {clinica}
// (vacíos -> línea para completar a mano).
const CONSENTIMIENTOS = [
  {
    clave: 'general',
    titulo: 'Consentimiento general',
    texto:
      'Yo {paciente} portador(a) de la C.I {ci} certifico que la información consignada en el presente documento es ' +
      'verdadera. Asimismo, autorizo al especialista {especialista} a realizar el siguiente procedimiento ' +
      '{procedimiento}. Conozco todos sus efectos y complicaciones, acepto las recomendaciones sugeridas y eximo de ' +
      'toda responsabilidad a {clinica} por cualquier alteración que se pueda presentar debido al tratamiento a realizar.',
  },
];

module.exports = { CONSENTIMIENTOS };
