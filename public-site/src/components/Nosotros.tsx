import Image from 'next/image';

export default function Nosotros() {
  return (
    <section id="nosotros" className="bg-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
        <div className="relative mx-auto aspect-[400/530] w-full max-w-md overflow-hidden rounded-full bg-espresso/10">
          <Image
            src="/novaged-assets/DraNovaged-CZHbEtUk.jpeg"
            alt="Dra. Maria Noemi Ponce Caisiri"
            fill
            className="object-cover object-top"
          />
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-tan">Dirección Médica</p>
          <Image
            src="/novaged-assets/horizontal_dark-YqD6kOfW.png"
            alt="Clinic NovagED"
            width={188}
            height={80}
            className="mt-4 h-20 w-auto"
          />
          <span className="mt-6 block h-px w-10 bg-tan/50" />
          <h2 className="mt-6 font-serif text-3xl md:text-4xl xl:text-[46px] text-espresso">
            Dra. Maria Noemi Ponce Caisiri
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-espresso">
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
          <ul className="mt-6 flex flex-col gap-2.5">
            {[
              'Miembro del Colegio Médico de Cochabamba.',
              'Médica matriculada en SEDES Cochabamba.',
              'Miembro de ASOBOME Cochabamba.',
              'Médico con doble titulación, miembro del Colegio Médico de Lima, Perú.',
            ].map((linea) => (
              <li key={linea} className="flex items-center gap-3.5">
                <span className="h-px w-6 shrink-0 bg-espresso" />
                <span className="text-[0.7rem] tracking-widest uppercase text-tan">{linea}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
