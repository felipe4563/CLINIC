const pilares = [
  { titulo: "Salud", italic: false, texto: "La base de cada procedimiento, garantizando seguridad y respaldo médico." },
  { titulo: "Belleza", italic: true, texto: "Una expresión natural y personalizada, lejos de estándares artificiales." },
  { titulo: "Armonía", italic: false, texto: "El equilibrio entre cuerpo, mente y percepción personal." },
];

export default function EsenciaMarca() {
  return (
    <section id="esencia" className="bg-[#EAE2D6] px-6 py-28 text-center">
      <p className="text-xs tracking-widest uppercase text-manhattan">Esencia de Marca</p>
      <h2 className="mt-4 font-serif text-4xl md:text-5xl xl:text-[64px] text-espresso">
        Renovación y evolución <em className="italic text-tan">constante</em>
      </h2>
      <p className="mx-auto mt-6 max-w-xl text-tan">
        Novaged nace para ofrecer una nueva etapa en el cuidado estético — donde
        la innovación médica se une a una visión artística del bienestar
        integral.
      </p>

      <div className="mx-auto mt-16 grid max-w-4xl divide-y divide-manhattan/40 border-t border-b border-manhattan/40 md:grid-cols-3 md:divide-x md:divide-y-0">
        {pilares.map((p) => (
          <div key={p.titulo} className="px-6 py-8">
            <h3 className={`font-serif text-2xl text-espresso ${p.italic ? 'italic' : ''}`}>{p.titulo}</h3>
            <p className="mt-3 text-sm text-tan">{p.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
