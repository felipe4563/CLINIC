'use client';

export type Opcion = { clave: string; etiqueta: string };
export type Campo = {
  clave: string;
  etiqueta: string;
  tipo: 'check' | 'texto' | 'parrafo' | 'opcion' | 'numero' | 'fecha';
  opciones?: Opcion[];
  detalles?: Opcion[];
};
export type Grupo = { titulo: string; subtitulo?: string; imagen?: string; campos: Campo[] };
export type Valores = Record<string, string | boolean | number>;

// Un grupo de la definición: casillas (con sus detalles cuando están marcadas),
// opciones como botones, y textos.
export default function CampoHistoria({ grupo, valores, onCambio, urlGuias }: { grupo: Grupo; valores: Valores; onCambio: (clave: string, valor: string | boolean | number) => void; urlGuias: string }) {
  const checks = grupo.campos.filter((c) => c.tipo === 'check');
  const otros = grupo.campos.filter((c) => c.tipo !== 'check');

  return (
    <fieldset className="mb-4">
      <legend className="mb-2 text-sm font-semibold">
        {grupo.titulo}
        {grupo.subtitulo && <span className="ml-1 font-normal text-muted-foreground">{grupo.subtitulo}</span>}
      </legend>
      {grupo.imagen && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${urlGuias}/${grupo.imagen}`} alt={`Guía: ${grupo.titulo}`} className="mb-3 w-full rounded border border-border bg-white object-contain" />
      )}

      {checks.length > 0 && (
        <div className="mb-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((c) => {
            const marcado = valores[c.clave] === true;
            return (
              <div key={c.clave}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={marcado} onChange={(e) => onCambio(c.clave, e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                  {c.etiqueta}
                </label>
                {marcado && (c.detalles || []).map((d) => (
                  <input
                    key={d.clave}
                    value={String(valores[`${c.clave}_${d.clave}`] ?? '')}
                    onChange={(e) => onCambio(`${c.clave}_${d.clave}`, e.target.value)}
                    placeholder={d.etiqueta}
                    aria-label={`${c.etiqueta}: ${d.etiqueta}`}
                    maxLength={500}
                    className="ml-6 mt-1 block w-[calc(100%-1.5rem)] rounded border border-border px-2 py-1 text-xs"
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {otros.map((c) => {
        if (c.tipo === 'opcion') {
          const actual = valores[c.clave];
          return (
            <div key={c.clave} className="mb-2">
              <p className="mb-1 text-xs text-muted-foreground">{c.etiqueta}</p>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={c.etiqueta}>
                {(c.opciones || []).map((op) => (
                  <button
                    key={op.clave}
                    type="button"
                    role="radio"
                    aria-checked={actual === op.clave}
                    onClick={() => onCambio(c.clave, actual === op.clave ? '' : op.clave)}
                    className={`rounded-full border px-3 py-1 text-xs ${actual === op.clave ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:bg-accent-soft'}`}
                  >
                    {op.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        if (c.tipo === 'numero' || c.tipo === 'fecha') {
          const esNumero = c.tipo === 'numero';
          return (
            <label key={c.clave} className={`mb-2 text-xs text-muted-foreground ${esNumero ? 'mr-3 inline-block w-28 align-top' : 'block sm:w-64'}`}>
              {c.etiqueta}
              <input
                type={esNumero ? 'number' : 'date'}
                inputMode={esNumero ? 'numeric' : undefined}
                min={esNumero ? 0 : undefined}
                max={esNumero ? 99 : undefined}
                step={esNumero ? 1 : undefined}
                value={valores[c.clave] === undefined || valores[c.clave] === null ? '' : String(valores[c.clave])}
                onChange={(e) => {
                  const texto = e.target.value;
                  if (!esNumero || texto === '') return onCambio(c.clave, texto);
                  const n = Number(texto);
                  // Solo enteros de 0 a 99: otro valor se ignora y queda el anterior.
                  if (Number.isInteger(n) && n >= 0 && n <= 99) onCambio(c.clave, n);
                }}
                className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground"
              />
            </label>
          );
        }
        const largo = c.tipo === 'parrafo';
        return (
          <label key={c.clave} className="mb-2 block text-xs text-muted-foreground">
            {c.etiqueta}
            {largo ? (
              <textarea
                value={String(valores[c.clave] ?? '')}
                onChange={(e) => onCambio(c.clave, e.target.value)}
                rows={2}
                maxLength={4000}
                className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground"
              />
            ) : (
              <input
                value={String(valores[c.clave] ?? '')}
                onChange={(e) => onCambio(c.clave, e.target.value)}
                maxLength={500}
                className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground"
              />
            )}
          </label>
        );
      })}
    </fieldset>
  );
}
