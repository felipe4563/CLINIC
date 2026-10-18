const NOMBRES = [
  'Toxina botulínica', 'Microneedling', 'Exosomas', 'Bioestimuladores de colágeno', 'Perfilado de labios',
  'Hilos tensores', 'Control prenatal', 'Ecografía', 'Drenaje linfático', 'Peelings médicos',
];

// Franja decorativa con tratamientos que pasan solos (se detiene con "reducir movimiento").
export default function Cinta() {
  const vuelta = NOMBRES.flatMap((n) => [n, '·']);
  return (
    <div aria-hidden="true" className="overflow-hidden bg-espresso py-6 text-neutral-cream">
      <div className="cinta gap-14 whitespace-nowrap font-serif text-3xl font-light md:text-4xl">
        {[...vuelta, ...vuelta].map((texto, i) => (
          <span key={i} className={texto === '·' ? 'text-manhattan' : ''}>{texto}</span>
        ))}
      </div>
    </div>
  );
}
