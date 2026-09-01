export default function Nosotros() {
  return (
    <section id="nosotros" className="bg-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
        <div className="mx-auto aspect-square w-full max-w-md overflow-hidden rounded-full bg-espresso/10">
          {/* PLACEHOLDER: replace with real photo of Dra. Maria Noemi Ponce Caisiri */}
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-muted">Dirección Médica</p>
          <p className="mt-4 font-serif italic text-tan">Clinic NovagED</p>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl text-espresso">
            Dra. Maria Noemi Ponce Caisiri
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              Médico cirujano-ultrasonografista. Médico estético especialista en
              rejuvenecimiento y armonización facial y corporal, con técnicas
              avanzadas en armonización facial, antiedad, lifting,
              bioestimuladores de colágeno, fillers (ácido hialurónico), hilos,
              neuromodulación (toxina botulínica o Botox), enzimas
              recombinantes, enzimas lipolíticas y aparatología, con
              seguimiento médico especializado.
            </p>
            <p>
              En ClinicNovagED tu salud es nuestra prioridad. Brindamos
              tratamientos seguros y de alta calidad, asegurando resultados
              naturales y armónicos, con características únicas que realzan tu
              belleza natural mediante protocolos personalizados acordes a
              cada paciente, superando tus expectativas.
            </p>
            <p>
              ClinicNovagED tiene un enfoque integral donde cada paciente es
              único, integrando servicios de ginecología, ecografía y
              fisioterapia, con compromiso y profesionalismo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
