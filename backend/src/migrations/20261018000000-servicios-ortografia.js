// backend/src/migrations/20261018000000-servicios-ortografia.js
'use strict';

// Pedido de la doctora (chat del 15/10/2026): ortografía de servicios, nombres nuevos y servicios a borrar.
//
// En producción, la carga inicial perdió todas las letras no ASCII ("cido hialurnico (Fillers)",
// "Medicina Esttica  Tratamientos..."). CORRECCIONES sale de comparar el respaldo del 18/10 con
// backend/sql/datos-iniciales.sql y datos-complementarios.sql, que están bien escritos. Solo se cambia
// un texto si es exactamente la versión dañada (comparación binaria): lo editado a mano en el panel no
// se toca, y en una base sin el daño (local, pruebas) no cambia nada.
// [tabla, columna, texto dañado, texto correcto]
const CORRECCIONES = [
  ['activos_clinica', 'nombre', 'Balanza con tallmetro', 'Balanza con tallímetro'],
  ['activos_clinica', 'nombre', 'Basurero con pedal para residuos biolgicos', 'Basurero con pedal para residuos biológicos'],
  ['activos_clinica', 'nombre', 'Biombo clnico', 'Biombo clínico'],
  ['activos_clinica', 'nombre', 'Bolsa de reanimacin (amb) adulto', 'Bolsa de reanimación (ambú) adulto'],
  ['activos_clinica', 'nombre', 'Camilla esttica reclinable elctrica', 'Camilla estética reclinable eléctrica'],
  ['activos_clinica', 'nombre', 'Camilla para ecografa', 'Camilla para ecografía'],
  ['activos_clinica', 'nombre', 'Centrfuga para PRP', 'Centrífuga para PRP'],
  ['activos_clinica', 'nombre', 'Cinta obsttrica', 'Cinta obstétrica'],
  ['activos_clinica', 'nombre', 'Cmara fotogrfica para registro antes/despus', 'Cámara fotográfica para registro antes/después'],
  ['activos_clinica', 'nombre', 'Compresas de gel fro/calor reutilizables (set)', 'Compresas de gel frío/calor reutilizables (set)'],
  ['activos_clinica', 'nombre', 'Computadora de recepcin', 'Computadora de recepción'],
  ['activos_clinica', 'nombre', 'Dermapen (microneedling elctrico)', 'Dermapen (microneedling eléctrico)'],
  ['activos_clinica', 'nombre', 'Desfibrilador externo automtico (DEA)', 'Desfibrilador externo automático (DEA)'],
  ['activos_clinica', 'nombre', 'Doppler fetal porttil', 'Doppler fetal portátil'],
  ['activos_clinica', 'nombre', 'Ecgrafo', 'Ecógrafo'],
  ['activos_clinica', 'nombre', 'Equipo de plasma lser (plasma pen)', 'Equipo de plasma láser (plasma pen)'],
  ['activos_clinica', 'nombre', 'Equipo de ultrasonido teraputico', 'Equipo de ultrasonido terapéutico'],
  ['activos_clinica', 'nombre', 'Escritorio de recepcin', 'Escritorio de recepción'],
  ['activos_clinica', 'nombre', 'Glucmetro', 'Glucómetro'],
  ['activos_clinica', 'nombre', 'Impresora trmica para ecografa', 'Impresora térmica para ecografía'],
  ['activos_clinica', 'nombre', 'Lmpara de exploracin cuello de ganso', 'Lámpara de exploración cuello de ganso'],
  ['activos_clinica', 'nombre', 'Lmpara de procedimientos LED con lupa', 'Lámpara de procedimientos LED con lupa'],
  ['activos_clinica', 'nombre', 'Maletn / botiqun de emergencias', 'Maletín / botiquín de emergencias'],
  ['activos_clinica', 'nombre', 'Mesa ginecolgica', 'Mesa ginecológica'],
  ['activos_clinica', 'nombre', 'Oxmetro de pulso', 'Oxímetro de pulso'],
  ['activos_clinica', 'nombre', 'Pelota teraputica (fitball)', 'Pelota terapéutica (fitball)'],
  ['activos_clinica', 'nombre', 'Refrigerador para insumos y biolgicos', 'Refrigerador para insumos y biológicos'],
  ['activos_clinica', 'nombre', 'Selladora de bolsas de esterilizacin', 'Selladora de bolsas de esterilización'],
  ['activos_clinica', 'nombre', 'Set de bandas elsticas y mancuernas', 'Set de bandas elásticas y mancuernas'],
  ['activos_clinica', 'nombre', 'Set de cnulas de lipotransferencia (extraccin y microinyeccin)', 'Set de cánulas de lipotransferencia (extracción y microinyección)'],
  ['activos_clinica', 'nombre', 'Set de espculos metlicos (S, M, L)', 'Set de espéculos metálicos (S, M, L)'],
  ['activos_clinica', 'nombre', 'Set de insercin de DIU (histermetro, pinzas y tijera)', 'Set de inserción de DIU (histerómetro, pinzas y tijera)'],
  ['activos_clinica', 'nombre', 'Taburete mdico con ruedas', 'Taburete médico con ruedas'],
  ['activos_clinica', 'nombre', 'Tanque de oxgeno con regulador y mascarilla', 'Tanque de oxígeno con regulador y mascarilla'],
  ['activos_clinica', 'nombre', 'Telfono celular de la clnica (WhatsApp)', 'Teléfono celular de la clínica (WhatsApp)'],
  ['activos_clinica', 'nombre', 'Tensimetro digital', 'Tensiómetro digital'],
  ['activos_clinica', 'nombre', 'Termmetro digital infrarrojo', 'Termómetro digital infrarrojo'],
  ['activos_clinica', 'nombre', 'Transductor endocavitario (ginecolgico)', 'Transductor endocavitario (ginecológico)'],
  ['activos_clinica', 'nombre', 'Transductor lineal (partes blandas y musculoesqueltico)', 'Transductor lineal (partes blandas y musculoesquelético)'],
  ['activos_clinica', 'categoria', 'Diagnstico por imagen', 'Diagnóstico por imagen'],
  ['activos_clinica', 'categoria', 'Enfermera', 'Enfermería'],
  ['activos_clinica', 'categoria', 'Equipos estticos', 'Equipos estéticos'],
  ['activos_clinica', 'categoria', 'Equipos ginecolgicos', 'Equipos ginecológicos'],
  ['activos_clinica', 'categoria', 'Esterilizacin', 'Esterilización'],
  ['activos_clinica', 'categoria', 'Mobiliario clnico', 'Mobiliario clínico'],
  ['activos_clinica', 'ubicacion', 'Box esttico', 'Box estético'],
  ['activos_clinica', 'ubicacion', 'Consultorio de ecografa', 'Consultorio de ecografía'],
  ['activos_clinica', 'ubicacion', 'Consultorio ginecolgico', 'Consultorio ginecológico'],
  ['activos_clinica', 'ubicacion', 'Enfermera', 'Enfermería'],
  ['activos_clinica', 'ubicacion', 'Recepcin', 'Recepción'],
  ['categorias_producto', 'nombre', 'Botiqun de emergencias', 'Botiquín de emergencias'],
  ['categorias_producto', 'nombre', 'Enfermera', 'Enfermería'],
  ['categorias_producto', 'nombre', 'Ginecologa', 'Ginecología'],
  ['categorias_producto', 'nombre', 'Insumos mdicos', 'Insumos médicos'],
  ['categorias_producto', 'nombre', 'Inyectables estticos', 'Inyectables estéticos'],
  ['categorias_producto', 'nombre', 'Peelings y dermocosmtica', 'Peelings y dermocosmética'],
  ['marcas', 'nombre', 'Allergan (Juvderm)', 'Allergan (Juvéderm)'],
  ['marcas', 'nombre', 'Avne', 'Avène'],
  ['productos', 'nombre', 'Agua estril para inyeccin 10 ml', 'Agua estéril para inyección 10 ml'],
  ['productos', 'nombre', 'Anestsico tpico lidocana/tetracana 30 g', 'Anestésico tópico lidocaína/tetracaína 30 g'],
  ['productos', 'nombre', 'Apsito transparente para va IV (caja 50)', 'Apósito transparente para vía IV (caja 50)'],
  ['productos', 'nombre', 'Bolsas de esterilizacin autosellables (caja 200)', 'Bolsas de esterilización autosellables (caja 200)'],
  ['productos', 'nombre', 'Campos estriles descartables (paquete 10)', 'Campos estériles descartables (paquete 10)'],
  ['productos', 'nombre', 'Catter IV 22G', 'Catéter IV 22G'],
  ['productos', 'nombre', 'Cctel de aminocidos (ampolla 5 ml)', 'Cóctel de aminoácidos (ampolla 5 ml)'],
  ['productos', 'nombre', 'Cctel de vitaminas (ampolla 5 ml)', 'Cóctel de vitaminas (ampolla 5 ml)'],
  ['productos', 'nombre', 'cido acetilsaliclico 100 mg (caja 30)', 'Ácido acetilsalicílico 100 mg (caja 30)'],
  ['productos', 'nombre', 'cido actico 5% 500 ml', 'Ácido acético 5% 500 ml'],
  ['productos', 'nombre', 'cido hialurnico Juvderm Volbella 1 ml', 'Ácido hialurónico Juvéderm Volbella 1 ml'],
  ['productos', 'nombre', 'cido hialurnico Juvderm Voluma 1 ml', 'Ácido hialurónico Juvéderm Voluma 1 ml'],
  ['productos', 'nombre', 'cido hialurnico Restylane Vital 1 ml', 'Ácido hialurónico Restylane Vital 1 ml'],
  ['productos', 'nombre', 'cido polilctico Sculptra', 'Ácido poliláctico Sculptra'],
  ['productos', 'nombre', 'Cinta kinesiolgica 5 cm x 5 m (rollo)', 'Cinta kinesiológica 5 cm x 5 m (rollo)'],
  ['productos', 'nombre', 'Clorhexidina 2% solucin 250 ml', 'Clorhexidina 2% solución 250 ml'],
  ['productos', 'nombre', 'Cnulas 22G x 70 mm (caja 20)', 'Cánulas 22G x 70 mm (caja 20)'],
  ['productos', 'nombre', 'Cnulas 25G x 50 mm (caja 20)', 'Cánulas 25G x 50 mm (caja 20)'],
  ['productos', 'nombre', 'Enzimas lipolticas (vial)', 'Enzimas lipolíticas (vial)'],
  ['productos', 'nombre', 'Espculo vaginal descartable talla M', 'Espéculo vaginal descartable talla M'],
  ['productos', 'nombre', 'Fijador citolgico en spray', 'Fijador citológico en spray'],
  ['productos', 'nombre', 'Film osmtico para tratamientos corporales (rollo)', 'Film osmótico para tratamientos corporales (rollo)'],
  ['productos', 'nombre', 'Gasas estriles 10x10 (paquete 100)', 'Gasas estériles 10x10 (paquete 100)'],
  ['productos', 'nombre', 'Gel analgsico para masaje 120 g', 'Gel analgésico para masaje 120 g'],
  ['productos', 'nombre', 'Gel fro de aloe vera 250 ml', 'Gel frío de aloe vera 250 ml'],
  ['productos', 'nombre', 'Hisopos estriles (caja 100)', 'Hisopos estériles (caja 100)'],
  ['productos', 'nombre', 'Implante subdrmico anticonceptivo (etonogestrel)', 'Implante subdérmico anticonceptivo (etonogestrel)'],
  ['productos', 'nombre', 'Kit de curacin (apsitos y vendas)', 'Kit de curación (apósitos y vendas)'],
  ['productos', 'nombre', 'Kit de Papanicolau (espculo, cepillo y esptula)', 'Kit de Papanicolau (espéculo, cepillo y espátula)'],
  ['productos', 'nombre', 'Lancetas para glucmetro (caja 100)', 'Lancetas para glucómetro (caja 100)'],
  ['productos', 'nombre', 'Lidocana 2% con epinefrina 20 ml', 'Lidocaína 2% con epinefrina 20 ml'],
  ['productos', 'nombre', 'Lidocana 2% sin epinefrina 20 ml', 'Lidocaína 2% sin epinefrina 20 ml'],
  ['productos', 'nombre', 'Marcador quirrgico de piel', 'Marcador quirúrgico de piel'],
  ['productos', 'nombre', 'Mascarillas quirrgicas (caja 50)', 'Mascarillas quirúrgicas (caja 50)'],
  ['productos', 'nombre', 'Multivitamnico prenatal con cido flico (frasco 30)', 'Multivitamínico prenatal con ácido fólico (frasco 30)'],
  ['productos', 'nombre', 'Papel para impresora de ecografa (rollo)', 'Papel para impresora de ecografía (rollo)'],
  ['productos', 'nombre', 'Peeling cido gliclico 70% 30 ml', 'Peeling ácido glicólico 70% 30 ml'],
  ['productos', 'nombre', 'Peeling cido saliclico 30% 30 ml', 'Peeling ácido salicílico 30% 30 ml'],
  ['productos', 'nombre', 'Pruebas rpidas de embarazo en orina (caja 25)', 'Pruebas rápidas de embarazo en orina (caja 25)'],
  ['productos', 'nombre', 'Sbanas descartables para camilla (paquete 10)', 'Sábanas descartables para camilla (paquete 10)'],
  ['productos', 'nombre', 'Silicio orgnico (ampolla 5 ml)', 'Silicio orgánico (ampolla 5 ml)'],
  ['productos', 'nombre', 'Solucin de lugol 100 ml', 'Solución de lugol 100 ml'],
  ['productos', 'nombre', 'Solucin de Monsel 30 ml', 'Solución de Monsel 30 ml'],
  ['productos', 'nombre', 'Solucin fisiolgica 0.9% 500 ml', 'Solución fisiológica 0.9% 500 ml'],
  ['productos', 'nombre', 'Solucin fisiolgica 0.9% ampolla 10 ml', 'Solución fisiológica 0.9% ampolla 10 ml'],
  ['productos', 'nombre', 'Srum de cido hialurnico 30 ml', 'Sérum de ácido hialurónico 30 ml'],
  ['productos', 'nombre', 'Torundas de algodn (bolsa 500 g)', 'Torundas de algodón (bolsa 500 g)'],
  ['productos', 'nombre', 'Toxina botulnica tipo A 100 U', 'Toxina botulínica tipo A 100 U'],
  ['productos', 'unidad', 'galn', 'galón'],
  ['profesionales', 'especialidad', 'Medicina esttica  Ecografa  Ginecologa', 'Medicina estética · Ecografía · Ginecología'],
  ['servicios', 'nombre', 'Adipoestructuracin', 'Adipoestructuración'],
  ['servicios', 'nombre', 'Aparatologa', 'Aparatología'],
  ['servicios', 'nombre', 'Bioestimuladores de colgeno', 'Bioestimuladores de colágeno'],
  ['servicios', 'nombre', 'Blefaroplastia sin ciruga', 'Blefaroplastia sin cirugía'],
  ['servicios', 'nombre', 'Cctel de aminocidos', 'Cóctel de aminoácidos'],
  ['servicios', 'nombre', 'Cctel de vitaminas', 'Cóctel de vitaminas'],
  ['servicios', 'nombre', 'cido hialurnico (Fillers)', 'Ácido hialurónico (Fillers)'],
  ['servicios', 'nombre', 'cido hialurnico (hidratacin facial)', 'Ácido hialurónico (hidratación facial)'],
  ['servicios', 'nombre', 'cido polilctico', 'Ácido poliláctico'],
  ['servicios', 'nombre', 'Colposcopa', 'Colposcopía'],
  ['servicios', 'nombre', 'Consulta ginecolgica', 'Consulta ginecológica'],
  ['servicios', 'nombre', 'Control de presin arterial', 'Control de presión arterial'],
  ['servicios', 'nombre', 'DMAE + silicio orgnico', 'DMAE + silicio orgánico'],
  ['servicios', 'nombre', 'Drenaje linftico', 'Drenaje linfático'],
  ['servicios', 'nombre', 'Ecografa abdominal', 'Ecografía abdominal'],
  ['servicios', 'nombre', 'Ecografa de partes blandas', 'Ecografía de partes blandas'],
  ['servicios', 'nombre', 'Ecografa ginecolgica', 'Ecografía ginecológica'],
  ['servicios', 'nombre', 'Ecografa musculoesqueltica', 'Ecografía musculoesquelética'],
  ['servicios', 'nombre', 'Eliminacin de acrocordones', 'Eliminación de acrocordones'],
  ['servicios', 'nombre', 'Eliminacin de lunares', 'Eliminación de lunares'],
  ['servicios', 'nombre', 'Eliminacin de verrugas', 'Eliminación de verrugas'],
  ['servicios', 'nombre', 'Enzimas lipolticas', 'Enzimas lipolíticas'],
  ['servicios', 'nombre', 'Levantamiento de pmulos', 'Levantamiento de pómulos'],
  ['servicios', 'nombre', 'Lifting facial sin ciruga', 'Lifting facial sin cirugía'],
  ['servicios', 'nombre', 'Liplisis qumica', 'Lipólisis química'],
  ['servicios', 'nombre', 'Marcacin mandibular', 'Marcación mandibular'],
  ['servicios', 'nombre', 'Peelings mdicos', 'Peelings médicos'],
  ['servicios', 'nombre', 'Planificacin familiar', 'Planificación familiar'],
  ['servicios', 'nombre', 'Rehabilitacin', 'Rehabilitación'],
  ['servicios', 'nombre', 'Toxina botulnica (Botox)', 'Toxina botulínica (Botox)'],
  ['servicios', 'descripcion', 'Ecografa  Diagnstico de estructuras plvicas y reproductivas femeninas.', 'Ecografía — Diagnóstico de estructuras pélvicas y reproductivas femeninas.'],
  ['servicios', 'descripcion', 'Ecografa  Diagnstico de tendones, msculos, ligamentos y articulaciones.', 'Ecografía — Diagnóstico de tendones, músculos, ligamentos y articulaciones.'],
  ['servicios', 'descripcion', 'Ecografa  Evaluacin de rganos y estructuras abdominales mediante ultrasonido.', 'Ecografía — Evaluación de órganos y estructuras abdominales mediante ultrasonido.'],
  ['servicios', 'descripcion', 'Ecografa  Valoracin de tejidos blandos superficiales y ganglios.', 'Ecografía — Valoración de tejidos blandos superficiales y ganglios.'],
  ['servicios', 'descripcion', 'Enfermera  Administracin de soluciones intravenosas segn prescripcin mdica.', 'Enfermería — Administración de soluciones intravenosas según prescripción médica.'],
  ['servicios', 'descripcion', 'Enfermera  Aplicacin de medicamentos por va intramuscular o endovenosa.', 'Enfermería — Aplicación de medicamentos por vía intramuscular o endovenosa.'],
  ['servicios', 'descripcion', 'Enfermera  Evaluacin antropomtrica bsica.', 'Enfermería — Evaluación antropométrica básica.'],
  ['servicios', 'descripcion', 'Enfermera  Medicin de glucosa en sangre capilar con glucmetro calibrado.', 'Enfermería — Medición de glucosa en sangre capilar con glucómetro calibrado.'],
  ['servicios', 'descripcion', 'Enfermera  Medicin y registro de valores de tensin arterial.', 'Enfermería — Medición y registro de valores de tensión arterial.'],
  ['servicios', 'descripcion', 'Enfermera  Tratamiento y seguimiento de heridas y lesiones cutneas.', 'Enfermería — Tratamiento y seguimiento de heridas y lesiones cutáneas.'],
  ['servicios', 'descripcion', 'Fisioterapia  Protocolos personalizados para recuperacin funcional post-lesin o ciruga.', 'Fisioterapia — Protocolos personalizados para recuperación funcional post-lesión o cirugía.'],
  ['servicios', 'descripcion', 'Fisioterapia  Sesiones orientadas a reducir tensin muscular y promover bienestar general.', 'Fisioterapia — Sesiones orientadas a reducir tensión muscular y promover bienestar general.'],
  ['servicios', 'descripcion', 'Fisioterapia  Tcnicas manuales especializadas para alivio del dolor y recuperacin funcional.', 'Fisioterapia — Técnicas manuales especializadas para alivio del dolor y recuperación funcional.'],
  ['servicios', 'descripcion', 'Fisioterapia  Trabajo profundo sobre contracturas y tensiones musculares acumuladas.', 'Fisioterapia — Trabajo profundo sobre contracturas y tensiones musculares acumuladas.'],
  ['servicios', 'descripcion', 'Fisioterapia  Tratamientos con equipos especializados de fisioterapia segn indicacin mdica.', 'Fisioterapia — Tratamientos con equipos especializados de fisioterapia según indicación médica.'],
  ['servicios', 'descripcion', 'Ginecologa y Obstetricia  Citologa cervical para deteccin temprana de alteraciones celulares.', 'Ginecología y Obstetricia — Citología cervical para detección temprana de alteraciones celulares.'],
  ['servicios', 'descripcion', 'Ginecologa y Obstetricia  Evaluacin ginecolgica completa con historial clnico y examen fsico.', 'Ginecología y Obstetricia — Evaluación ginecológica completa con historial clínico y examen físico.'],
  ['servicios', 'descripcion', 'Ginecologa y Obstetricia  Examen visual del cuello uterino para evaluacin y diagnstico especializado.', 'Ginecología y Obstetricia — Examen visual del cuello uterino para evaluación y diagnóstico especializado.'],
  ['servicios', 'descripcion', 'Ginecologa y Obstetricia  Monitoreo peridico del desarrollo del embarazo y bienestar materno-fetal.', 'Ginecología y Obstetricia — Monitoreo periódico del desarrollo del embarazo y bienestar materno-fetal.'],
  ['servicios', 'descripcion', 'Ginecologa y Obstetricia  Orientacin y prescripcin de mtodos anticonceptivos adecuados.', 'Ginecología y Obstetricia — Orientación y prescripción de métodos anticonceptivos adecuados.'],
  ['servicios', 'descripcion', 'Ginecologa y Obstetricia  Seguimiento especializado del embarazo, parto y puerperio.', 'Ginecología y Obstetricia — Seguimiento especializado del embarazo, parto y puerperio.'],
  ['servicios', 'descripcion', 'Medicina Esttica  Armonizacin Facial  Tratamientos diseados para equilibrar y resaltar los rasgos faciales manteniendo resultados naturales y armnicos.', 'Medicina Estética · Armonización Facial — Tratamientos diseñados para equilibrar y resaltar los rasgos faciales manteniendo resultados naturales y armónicos.'],
  ['servicios', 'descripcion', 'Medicina Esttica  Plasma Lser  Tecnologa orientada al rejuvenecimiento y correccin de imperfecciones cutneas.', 'Medicina Estética · Plasma Láser — Tecnología orientada al rejuvenecimiento y corrección de imperfecciones cutáneas.'],
  ['servicios', 'descripcion', 'Medicina Esttica  Rejuvenecimiento  Lifting  Protocolos regenerativos orientados a combatir flacidez y signos de envejecimiento facial, con bioestimuladores de colgeno.', 'Medicina Estética · Rejuvenecimiento · Lifting — Protocolos regenerativos orientados a combatir flacidez y signos de envejecimiento facial, con bioestimuladores de colágeno.'],
  ['servicios', 'descripcion', 'Medicina Esttica  Tratamientos Corporales  Tratamientos orientados a mejorar contorno corporal, firmeza y reduccin de grasa localizada.', 'Medicina Estética · Tratamientos Corporales — Tratamientos orientados a mejorar contorno corporal, firmeza y reducción de grasa localizada.'],
  ['servicios', 'descripcion', 'Medicina Esttica  Tratamientos Faciales  Tratamientos orientados a mejorar la calidad, hidratacin, luminosidad y regeneracin de la piel mediante medicina esttica avanzada.', 'Medicina Estética · Tratamientos Faciales — Tratamientos orientados a mejorar la calidad, hidratación, luminosidad y regeneración de la piel mediante medicina estética avanzada.'],
];

const RENOMBRES = [
  {
    antes: 'Control de presión arterial',
    despues: 'Control de signos vitales',
    descripcion:
      'Enfermería — Medición y registro de signos vitales: presión arterial, pulso, frecuencia respiratoria, temperatura y saturación de oxígeno.',
  },
  { antes: 'Drenaje linfático', despues: 'Drenaje linfático manual' },
  { antes: 'DMAE + silicio orgánico', despues: 'DMAE + silicio orgánico con microneedling' },
];

// Si alguno ya tiene citas o paquetes (historial), se desactiva en vez de borrarse.
const A_BORRAR = [
  'Ácido poliláctico',
  'Control de peso y talla',
  'Ecografía de partes blandas',
  'Eliminación de lunares',
  'Lifting facial sin cirugía',
  'Terapia manual',
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements, transaction });

      for (const [tabla, columna, roto, correcto] of CORRECCIONES) {
        await q(`UPDATE \`${tabla}\` SET \`${columna}\` = ? WHERE BINARY \`${columna}\` = ?`, [correcto, roto]);
      }

      for (const { antes, despues, descripcion } of RENOMBRES) {
        if (descripcion) {
          await q('UPDATE servicios SET nombre = ?, descripcion = ? WHERE BINARY nombre = ?', [despues, descripcion, antes]);
        } else {
          await q('UPDATE servicios SET nombre = ? WHERE BINARY nombre = ?', [despues, antes]);
        }
      }

      const [servicios] = await q('SELECT id FROM servicios WHERE nombre IN (?)', [A_BORRAR]);
      for (const { id } of servicios) {
        const [[{ usos }]] = await q(
          `SELECT (SELECT COUNT(*) FROM citas WHERE servicio_id = ?)
                + (SELECT COUNT(*) FROM paquetes_sesiones WHERE servicio_id = ?) AS usos`,
          [id, id]
        );
        if (Number(usos) > 0) await q('UPDATE servicios SET activo = 0 WHERE id = ?', [id]);
        else await q('DELETE FROM servicios WHERE id = ?', [id]);
      }
    });
  },

  // Solo deshace los nombres nuevos: las tildes quedan corregidas y los servicios borrados no vuelven.
  async down(queryInterface) {
    for (const { antes, despues } of RENOMBRES) {
      await queryInterface.sequelize.query('UPDATE servicios SET nombre = ? WHERE BINARY nombre = ?', {
        replacements: [antes, despues],
      });
    }
  },
};
