'use client';

// Especialidad y grupo de un servicio (los mismos de la carta de la web).
// Solo Medicina Estética tiene grupos; "Sin grupo" queda para lo general (la Consulta).

export type Especialidad = { nombre: string; grupos: string[] };

export const SIN_ESPECIALIDAD = 'Sin especialidad';

export function etiquetaCategoria(especialidad: string | null | undefined, grupo: string | null | undefined) {
  if (!especialidad) return null;
  return grupo ? `${especialidad} · ${grupo}` : especialidad;
}

export default function CategoriaServicio({
  especialidades,
  especialidad,
  grupo,
  onCambio,
  className = '',
}: {
  especialidades: Especialidad[];
  especialidad: string;
  grupo: string;
  onCambio: (especialidad: string, grupo: string) => void;
  className?: string;
}) {
  const grupos = especialidades.find((e) => e.nombre === especialidad)?.grupos ?? [];
  const campo = 'mt-1 block w-full rounded border border-border bg-panel px-2 py-1.5 text-sm text-foreground';

  return (
    <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${className}`}>
      <label className="text-xs text-muted-foreground">
        Especialidad *
        <select required value={especialidad} onChange={(e) => onCambio(e.target.value, '')} className={campo}>
          <option value="" disabled>
            Elegir…
          </option>
          {especialidades.map((e) => (
            <option key={e.nombre} value={e.nombre}>
              {e.nombre}
            </option>
          ))}
        </select>
      </label>
      {grupos.length > 0 && (
        <label className="text-xs text-muted-foreground">
          Grupo
          <select value={grupo} onChange={(e) => onCambio(especialidad, e.target.value)} className={campo}>
            <option value="">Sin grupo</option>
            {grupos.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
