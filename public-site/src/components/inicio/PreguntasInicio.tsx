'use client';
import { useId, useState } from 'react';
import { datosContacto, useConfiguracion } from '@/lib/useDatosClinica';
import Reveal from '../Reveal';

const RESPALDO_INASISTENCIA =
  'Si no asistes, pierdes el monto depositado. Si fue por un motivo justificado (enfermedad o emergencia), envía la prueba por WhatsApp dentro de las 48 horas siguientes a tu cita: si la clínica la acepta, reprogramas sin volver a pagar dentro de los 30 días siguientes, una sola vez por pago.';

export default function PreguntasInicio() {
  const base = useId();
  const config = useConfiguracion();
  const { telefono } = datosContacto(config);
  const [abierta, setAbierta] = useState<number | null>(0);

  // La política de inasistencia se lee de la Configuración de la clínica; el primer
  // párrafo (el que explica el pago anticipado) ya está en "¿Cómo se paga?".
  const politica = config?.politica_inasistencia?.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const inasistencia = politica && politica.length > 1 ? politica.slice(1) : [RESPALDO_INASISTENCIA];

  const preguntas: { pregunta: string; respuesta: string[] }[] = [
    {
      pregunta: '¿Cómo reservo mi cita?',
      respuesta: [`Desde esta página eliges la especialidad, el tratamiento, el día y la hora libres. También puedes reservar por WhatsApp al ${telefono}.`],
    },
    {
      pregunta: '¿Cómo se paga?',
      respuesta: [
        'Al reservar pagas con QR el 50 % como adelanto o el total. Ese pago asegura tu horario: queda reservado solo para ti. El saldo lo pagas en la clínica.',
      ],
    },
    { pregunta: '¿Y si no puedo asistir?', respuesta: inasistencia },
    {
      pregunta: '¿Necesito una consulta antes del tratamiento?',
      respuesta: [
        'Sí, la recomendamos. En la consulta de evaluación la doctora revisa tu historia, tus alergias y tus medicamentos, y te dice qué tratamiento es adecuado para ti y cuál no.',
      ],
    },
    {
      pregunta: '¿Cuánto dura el efecto?',
      respuesta: [
        'Depende del tratamiento. La toxina botulínica y los rellenos de ácido hialurónico son temporales: el cuerpo los absorbe poco a poco. El microneedling y los bioestimuladores dan resultados graduales, porque el colágeno nuevo tarda semanas en formarse. En la página de cada tratamiento lo explicamos en detalle.',
      ],
    },
  ];

  return (
    <section id="preguntas" className="px-4 py-24 sm:px-8 md:py-32">
      <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-32">
          <p className="text-xs uppercase tracking-[0.22em] text-tan">Antes de reservar</p>
          <h2 className="mt-5 font-serif text-[clamp(44px,5.4vw,80px)] font-light leading-[0.92] text-espresso">
            Preguntas <em className="italic">frecuentes</em>
          </h2>
          <p className="mt-6">
            ¿No encuentras tu respuesta? Escríbenos por WhatsApp al <span className="font-medium text-espresso">{telefono}</span>.
          </p>
        </Reveal>
        <div className="border-t border-manhattan">
          {preguntas.map((p, i) => {
            const sel = abierta === i;
            return (
              <div key={p.pregunta} className="border-b border-manhattan">
                <h3>
                  <button
                    type="button"
                    onClick={() => setAbierta(sel ? null : i)}
                    aria-expanded={sel}
                    aria-controls={`${base}-r${i}`}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left font-serif text-[clamp(22px,2.2vw,30px)] font-light leading-snug text-espresso"
                  >
                    {p.pregunta}
                    <span aria-hidden="true" className={`shrink-0 text-4xl font-light leading-none text-tan transition-transform duration-300 ${sel ? 'rotate-45' : ''}`}>+</span>
                  </button>
                </h3>
                <div id={`${base}-r${i}`} hidden={!sel} className="max-w-2xl space-y-3 pb-7 leading-relaxed">
                  {p.respuesta.map((r) => (
                    <p key={r}>{r}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
