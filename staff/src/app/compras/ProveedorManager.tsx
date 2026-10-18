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
  const [abierto, setAbierto] = useState(false);
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
    <div className="rounded-lg border border-border bg-panel p-3 text-sm">
      <button onClick={() => setAbierto((v) => !v)} className="flex w-full items-center justify-between text-left font-medium">
        Proveedores
        <span className="text-xs text-muted-foreground">{abierto ? 'Ocultar' : `Gestionar (${proveedores.length})`}</span>
      </button>

      {abierto && (
        <div className="mt-3">
          <form onSubmit={crear} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del proveedor"
              required
              className="rounded border border-border px-2 py-1.5 text-xs"
            />
            <input
              value={form.contacto}
              onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              placeholder="Contacto (opcional)"
              className="rounded border border-border px-2 py-1.5 text-xs"
            />
            <input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="Teléfono (opcional)"
              className="rounded border border-border px-2 py-1.5 text-xs"
            />
            <button
              type="submit"
              disabled={guardando}
              className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50 sm:col-span-3"
            >
              Agregar proveedor
            </button>
          </form>
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {proveedores.map((p) => (
              <span key={p.id} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs">
                {p.nombre}
                {p.telefono ? ` · ${p.telefono}` : ''}
                <button onClick={() => eliminar(p.id)} className="text-muted-foreground hover:text-danger" aria-label={`Eliminar ${p.nombre}`}>
                  ×
                </button>
              </span>
            ))}
            {proveedores.length === 0 && <p className="text-xs text-muted-foreground">Ninguno todavía.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
