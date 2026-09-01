const pilares = [
  { titulo: "Salud", texto: "La base de cada procedimiento, garantizando seguridad y respaldo médico." },
  { titulo: "Belleza", texto: "Una expresión natural y personalizada, lejos de estándares artificiales." },
  { titulo: "Armonía", texto: "El equilibrio entre cuerpo, mente y percepción personal." },
];

export default function EsenciaMarca() {
  return (
    <section id="esencia" className="bg-cream px-6 py-28 text-center">
      <p className="text-xs tracking-widest uppercase text-muted">Esencia de Marca</p>
      <h2 className="mt-4 font-serif text-4xl md:text-5xl text-espresso">
        Renovación y evolución
        <br />
        <em className="italic text-tan">constante</em>
      </h2>
      <p className="mx-auto mt-6 max-w-xl text-muted">
        Novaged nace para ofrecer una nueva etapa en el cuidado estético — donde
        la innovación médica se une a una visión artística del bienestar
        integral.
      </p>

      <div className="mx-auto mt-16 grid max-w-4xl divide-y divide-tan/20 border-t border-tan/20 md:grid-cols-3 md:divide-x md:divide-y-0">
        {pilares.map((p) => (
          <div key={p.titulo} className="px-6 py-8">
            <h3 className="font-serif italic text-2xl text-espresso">{p.titulo}</h3>
            <p className="mt-3 text-sm text-muted">{p.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
