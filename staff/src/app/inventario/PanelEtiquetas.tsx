'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { IconTrash, IconX } from '@/components/icons';
import { normalizar } from './filtros';

export type Etiqueta = { id: number; nombre: string };

type Tipo = 'marcas' | 'categorias';

const TEXTOS: Record<Tipo, { titulo: string; nueva: string; singular: string }> = {
  marcas: { titulo: 'Marcas', nueva: 'Nueva marca…', singular: 'marca' },
  categorias: { titulo: 'Categorías', nueva: 'Nueva categoría…', singular: 'categoría' },
};

export default function PanelEtiquetas({
  abierto,
  onCerrar,
  marcas,
  categorias,
  usoMarca,
  usoCategoria,
  onCrear,
  onEliminar,
  onVerProductos,
}: {
  abierto: boolean;
  onCerrar: () => void;
  marcas: Etiqueta[];
  categorias: Etiqueta[];
  usoMarca: Map<number, number>;
  usoCategoria: Map<number, number>;
  onCrear: (tipo: Tipo, nombre: string) => Promise<void>;
  onEliminar: (tipo: Tipo, id: number) => Promise<void>;
  onVerProductos: (tipo: Tipo, id: number) => void;
}) {
  const [tipo, setTipo] = useState<Tipo>('marcas');
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Escape cierra el panel; al abrir, el foco va al campo para agregar.
  useEffect(() => {
    if (!abierto) return;
    inputRef.current?.focus();
    function teclado(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', teclado);
    return () => document.removeEventListener('keydown', teclado);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const lista = tipo === 'marcas' ? marcas : categorias;
  const uso = tipo === 'marcas' ? usoMarca : usoCategoria;
  const textos = TEXTOS[tipo];

  function cambiarTipo(t: Tipo) {
    setTipo(t);
    setNombre('');
    setError('');
    setConfirmando(null);
  }

  async function crear(e: FormEvent) {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return;
    if (lista.some((x) => normalizar(x.nombre) === normalizar(limpio))) {
      setError(`Ya existe una ${textos.singular} con ese nombre.`);
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await onCrear(tipo, limpio);
      setNombre('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: number) {
    setError('');
    try {
      await onEliminar(tipo, id);
      setConfirmando(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Cerrar panel" onClick={onCerrar} className="absolute inset-0 bg-black/40" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Marcas y categorías"
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-panel shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Marcas y categorías</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent-soft">
            <IconX className="h-4 w-4" />
          </button>
        </header>

        <div className="flex gap-1.5 px-4 pt-3" role="tablist">
          {(Object.keys(TEXTOS) as Tipo[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tipo === t}
              onClick={() => cambiarTipo(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                tipo === t ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent-soft hover:text-foreground'
              }`}
            >
              {TEXTOS[t].titulo} {(t === 'marcas' ? marcas : categorias).length}
            </button>
          ))}
        </div>

        <form onSubmit={crear} className="flex gap-2 px-4 pt-3">
          <input
            ref={inputRef}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={textos.nueva}
            aria-label={textos.nueva}
            required
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={guardando}
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
          >
            {guardando ? 'Agregando…' : 'Agregar'}
          </button>
        </form>
        {error && <p className="px-4 pt-2 text-xs text-danger">{error}</p>}

        <ul className="mt-3 flex-1 divide-y divide-border/60 overflow-y-auto border-t border-border">
          {lista.map((e) => {
            const n = uso.get(e.id) ?? 0;
            return (
              <li key={e.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">{e.nombre}</span>
                {confirmando === e.id ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-xs">
                    ¿Eliminar?
                    <button type="button" onClick={() => eliminar(e.id)} className="rounded border border-danger px-2 py-0.5 font-medium text-danger hover:bg-danger hover:text-white">
                      Sí
                    </button>
                    <button type="button" onClick={() => setConfirmando(null)} className="rounded border border-border px-2 py-0.5 hover:bg-accent-soft">
                      No
                    </button>
                  </span>
                ) : (
                  <>
                    {n > 0 ? (
                      <button
                        type="button"
                        onClick={() => onVerProductos(tipo, e.id)}
                        className="shrink-0 text-xs text-accent hover:underline"
                        title="Ver estos productos"
                      >
                        {n} {n === 1 ? 'producto' : 'productos'}
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">Sin uso</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmando(e.id)}
                      disabled={n > 0}
                      title={n > 0 ? `No se puede eliminar: la usan ${n} producto(s)` : `Eliminar ${e.nombre}`}
                      aria-label={`Eliminar ${e.nombre}`}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
          {lista.length === 0 && <li className="px-4 py-6 text-center text-xs text-muted-foreground">Ninguna todavía.</li>}
        </ul>

        <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          Solo se puede eliminar una {textos.singular} que ningún producto usa.
        </p>
      </aside>
    </div>
  );
}
