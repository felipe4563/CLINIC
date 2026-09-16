const pilares = [
  { n: '01', titulo: 'Salud', italic: false, texto: 'La base de cada procedimiento, garantizando seguridad y respaldo médico.' },
  { n: '02', titulo: 'Belleza', italic: true, texto: 'Una expresión natural y personalizada, lejos de estándares artificiales.' },
  { n: '03', titulo: 'Armonía', italic: false, texto: 'El equilibrio entre cuerpo, mente y percepción personal.' },
];

export default function EsenciaMarca() {
  return (
    <section id="esencia" className="bg-[#EAE2D6] px-6 py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs tracking-widest uppercase text-manhattan">Esencia de Marca</p>
        <h2 className="mt-4 font-serif text-4xl md:text-5xl xl:text-[64px] text-espresso">
          Renovación y evolución <em className="italic text-tan">constante</em>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-tan">
          Novaged nace para ofrecer una nueva etapa en el cuidado estético — donde
          la innovación médica se une a una visión artística del bienestar
          integral.
        </p>
      </div>

      <div className="mx-auto mt-20 grid max-w-5xl gap-x-10 gap-y-16 md:grid-cols-3">
        {pilares.map((p) => (
          <div key={p.titulo} className="text-center md:text-left">
            <p className="font-serif text-6xl md:text-7xl text-espresso/15">{p.n}</p>
            <h3 className={`mt-2 font-serif text-3xl text-espresso ${p.italic ? 'italic' : ''}`}>{p.titulo}</h3>
            <span className="mt-4 mx-auto md:mx-0 block h-px w-10 bg-tan/50" />
            <p className="mt-4 text-sm text-tan">{p.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
