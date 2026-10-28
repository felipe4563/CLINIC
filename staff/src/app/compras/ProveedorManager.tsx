'use client';

import { useState } from 'react';

export type Proveedor = { id: number; nombre: string; contacto: string | null; telefono: string | null; notas: string | null };

const VACIO = { nombre: '', contacto: '', telefono: '' };

export default function ProveedorManager({
  proveedores,
  onCrear,
  onEliminar,
}: {
  proveedores: Proveedor[];
  onCrear: (datos: { nombre: string; contacto: string | null; telefono: string | null }) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}) {
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await onCrear({ nombre: form.nombre, contacto: form.contacto || null, telefono: form.telefono || null });
      setForm(VACIO);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: number) {
    setError('');
    try {
      await onEliminar(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
      <form onSubmit={crear} className="flex flex-col gap-2 self-start rounded-lg border border-border bg-panel p-4 text-sm">
        <h2 className="font-medium">Nuevo proveedor</h2>
        <input
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre del proveedor"
          required
          className="rounded border border-border px-3 py-2 text-sm"
        />
        <input
          value={form.contacto}
          onChange={(e) => setForm({ ...form, contacto: e.target.value })}
          placeholder="Contacto (opcional)"
          className="rounded border border-border px-3 py-2 text-sm"
        />
        <input
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          placeholder="Teléfono (opcional)"
          className="rounded border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={guardando}
          className="mt-1 rounded bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Agregar proveedor'}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>

      <div className="self-start rounded-lg border border-border bg-panel text-sm">
        {proveedores.length === 0 ? (
          <p className="p-4 text-muted-foreground">Todavía no hay proveedores. Agrega el primero con el formulario.</p>
        ) : (
          <ul className="divide-y divide-border">
            {proveedores.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.contacto, p.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                  </p>
                </div>
                <button onClick={() => eliminar(p.id)} className="shrink-0 text-xs text-danger hover:underline" aria-label={`Eliminar ${p.nombre}`}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
