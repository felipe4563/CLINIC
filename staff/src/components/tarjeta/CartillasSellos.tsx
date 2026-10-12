export type Cartilla = { servicioId: number; servicio: string; sellos: number; requeridos: number; premiosGanados: number };
export type PremioDisponible = { id: number; servicioId: number; servicio: string };

export function CartillasSellos({ cartillas, premios }: { cartillas: Cartilla[]; premios: PremioDisponible[] }) {
  if (cartillas.length === 0 && premios.length === 0) {
    return <p className="text-sm text-muted-foreground">Ningún servicio tiene tarjeta de sellos. Se configura en Catálogo → Servicios.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {premios.length > 0 && (
        <div className="rounded-lg border border-stat-green/40 bg-stat-green/10 p-3">
          <p className="text-sm font-semibold">🎁 Sesiones gratis listas para usar</p>
          <ul className="mt-1 text-sm">
            {premios.map((p) => (
              <li key={p.id}>1 × {p.servicio}</li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">Se aplican solas al completar su próxima cita de ese servicio.</p>
        </div>
      )}
      {cartillas.map((c) => {
        const faltan = c.requeridos - c.sellos;
        return (
          <div key={c.servicioId}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium">{c.servicio}</p>
              <p className="shrink-0 text-xs text-muted-foreground">{c.sellos}/{c.requeridos}</p>
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label={`${c.sellos} de ${c.requeridos} sellos`}>
              {Array.from({ length: c.requeridos }, (_, i) => (
                <span
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                    i < c.sellos ? 'border-accent bg-accent text-accent-foreground' : 'border-dashed border-border text-muted-foreground'
                  }`}
                >
                  {i < c.sellos ? '✓' : i + 1}
                </span>
              ))}
              <span className="flex h-7 items-center rounded-full border border-dashed border-stat-green/60 px-2 text-xs text-stat-green">🎁 gratis</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {faltan === 1 ? '¡Le falta 1 sesión para su sesión gratis!' : `Le faltan ${faltan} sesiones para su sesión gratis.`}
              {c.premiosGanados > 0 && ` · Ya ganó ${c.premiosGanados}.`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
