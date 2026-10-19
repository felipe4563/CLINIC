export const CREDENCIALES = [
  { sigla: 'CM', titulo: 'Colegio Médico', detalle: 'de Cochabamba' },
  { sigla: 'SD', titulo: 'Matriculada en', detalle: 'SEDES Cochabamba' },
  { sigla: 'AB', titulo: 'Miembro de ASOBOME', detalle: 'Cochabamba' },
  { sigla: 'LM', titulo: 'Doble titulación', detalle: 'Colegio Médico de Lima, Perú' },
];

export default function Credenciales() {
  return (
    <section aria-label="Credenciales de la doctora" className="px-4 py-10 sm:px-8 xl:px-12">
      <ul className="mx-auto grid max-w-sitio grid-cols-1 gap-6 border-y border-manhattan/60 py-7 sm:grid-cols-2 lg:grid-cols-4">
        {CREDENCIALES.map((c) => (
          <li key={c.sigla} className="flex items-center gap-4">
            <span aria-hidden="true" className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-manhattan font-serif text-xl text-espresso">
              {c.sigla}
            </span>
            <span className="text-sm leading-snug">
              {c.titulo}
              <br />
              {c.detalle}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
