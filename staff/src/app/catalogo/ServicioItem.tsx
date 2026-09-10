'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export type Servicio = {
  id: number;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  precio: string;
  activo: boolean;
  Productos?: { id: number; nombre: string }[];
};

type ProfesionalMinimo = { id: number; nombre: string; Servicios?: { id: number }[] };
type ProductoMinimo = { id: number; nombre: string };

export default function ServicioItem({
  servicio,
  todosLosProfesionales,
  todosLosProductos,
  onChange,
}: {
  servicio: Servicio;
  todosLosProfesionales: ProfesionalMinimo[];
  todosLosProductos: ProductoMinimo[];
  onChange: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [nombre, setNombre] = useState(servicio.nombre);
  const [descripcion, setDescripcion] = useState(servicio.descripcion || '');
  const [duracion, setDuracion] = useState(String(servicio.duracion_min));
  const [precio, setPrecio] = useState(servicio.precio);
  const [guardando, setGuardando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [error, setError] = useState('');

  const atendidoPor = todosLosProfesionales.filter((p) => (p.Servicios || []).some((s) => s.id === servicio.id));
  const productosUsadosIds = new Set((servicio.Productos || []).map((p) => p.id));

  async function asignarA(profesionalId: number) {
    setVinculando(true);
    try {
      await api.vincularServicio(profesionalId, servicio.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar');
    } finally {
      setVinculando(false);
    }
  }

  async function toggleProducto(productoId: number, usado: boolean) {
    if (usado) {
      await api.desvincularProducto(servicio.id, productoId);
    } else {
      await api.vincularProducto(servicio.id, productoId);
    }
    onChange();
  }

  function empezarEdicion() {
    setNombre(servicio.nombre);
    setDescripcion(servicio.descripcion || '');
    setDuracion(String(servicio.duracion_min));
    setPrecio(servicio.precio);
    setError('');
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    try {
      await api.actualizarServicio(servicio.id, {
        nombre,
        descripcion: descripcion || null,
        duracion_min: Number(duracion),
        precio: Number(precio),
      });
      setEditando(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo() {
    await api.actualizarServicio(servicio.id, { activo: !servicio.activo });
    onChange();
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-accent bg-panel p-3 text-sm">
        <div className="flex flex-col gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="rounded border border-border px-2 py-1.5" />
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            className="rounded border border-border px-2 py-1.5"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              placeholder="Min"
              className="w-24 rounded border border-border px-2 py-1.5"
            />
            <input
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Precio"
              className="flex-1 rounded border border-border px-2 py-1.5"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={() => setEditando(false)} className="rounded border border-border px-3 py-1.5 text-xs">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-panel text-sm">
      <div className="flex h-full flex-col justify-between gap-3 p-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate font-medium">{servicio.nombre}</p>
            <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">Bs {servicio.precio}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{servicio.duracion_min} min</p>
          {servicio.descripcion && <p className="mt-1.5 text-xs text-foreground/70">{servicio.descripcion}</p>}
          {!servicio.activo && <span className="mt-2 inline-block rounded-full bg-border px-2 py-0.5 text-[11px] text-muted-foreground">Inactivo</span>}

          <div className="mt-2">
            {atendidoPor.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {atendidoPor.map((p) => (
                  <span key={p.id} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground/70">
                    {p.nombre}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-danger">Sin profesional asignado</p>
            )}
          </div>

          {atendidoPor.length === 0 && todosLosProfesionales.length === 1 && (
            <button
              onClick={() => asignarA(todosLosProfesionales[0].id)}
              disabled={vinculando}
              className="mt-1.5 text-[11px] font-medium text-accent hover:underline disabled:opacity-50"
            >
              {vinculando ? 'Asignando…' : `Asignar a ${todosLosProfesionales[0].nombre}`}
            </button>
          )}
          {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={empezarEdicion} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            Editar
          </button>
          <button onClick={toggleActivo} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            {servicio.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button onClick={() => setExpandido((v) => !v)} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            {expandido ? 'Ocultar' : 'Productos'}
          </button>
        </div>
      </div>

      {expandido && (
        <div className="border-t border-border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Productos que usa este tratamiento</p>
          <div className="flex flex-wrap gap-2">
            {todosLosProductos.map((p) => {
              const usado = productosUsadosIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProducto(p.id, usado)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    usado ? 'border-accent bg-accent-soft text-accent' : 'border-border text-muted-foreground hover:border-accent'
                  }`}
                >
                  {p.nombre}
                </button>
              );
            })}
            {todosLosProductos.length === 0 && <p className="text-xs text-muted-foreground">No hay productos en el inventario.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
