'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export type Activo = {
  id: number;
  nombre: string;
  categoria: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  ubicacion: string | null;
  fecha_adquisicion: string | null;
  valor_adquisicion: string | null;
  estado: 'operativo' | 'mantenimiento' | 'dado_de_baja';
  fecha_baja: string | null;
  motivo_baja: string | null;
};

const ESTADO_LABEL: Record<Activo['estado'], string> = {
  operativo: 'Operativo',
  mantenimiento: 'En mantenimiento',
  dado_de_baja: 'Dado de baja',
};

const ESTADO_COLOR: Record<Activo['estado'], string> = {
  operativo: 'bg-stat-green-soft text-stat-green',
  mantenimiento: 'bg-stat-amber-soft text-stat-amber',
  dado_de_baja: 'bg-border text-muted-foreground',
};

export default function ActivoItem({ activo, onChange }: { activo: Activo; onChange: () => void }) {
  const [editando, setEditando] = useState(false);
  const [dandoBaja, setDandoBaja] = useState(false);
  const [nombre, setNombre] = useState(activo.nombre);
  const [categoria, setCategoria] = useState(activo.categoria || '');
  const [marca, setMarca] = useState(activo.marca || '');
  const [modelo, setModelo] = useState(activo.modelo || '');
  const [ubicacion, setUbicacion] = useState(activo.ubicacion || '');
  const [estado, setEstado] = useState<'operativo' | 'mantenimiento'>(activo.estado === 'mantenimiento' ? 'mantenimiento' : 'operativo');
  const [motivoBaja, setMotivoBaja] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  function empezarEdicion() {
    setNombre(activo.nombre);
    setCategoria(activo.categoria || '');
    setMarca(activo.marca || '');
    setModelo(activo.modelo || '');
    setUbicacion(activo.ubicacion || '');
    setEstado(activo.estado === 'mantenimiento' ? 'mantenimiento' : 'operativo');
    setError('');
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    try {
      await api.actualizarActivo(activo.id, {
        nombre,
        categoria: categoria || null,
        marca: marca || null,
        modelo: modelo || null,
        ubicacion: ubicacion || null,
        estado,
      });
      setEditando(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBaja() {
    if (!motivoBaja.trim()) return;
    setGuardando(true);
    setError('');
    try {
      await api.darDeBajaActivo(activo.id, motivoBaja.trim());
      setDandoBaja(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo dar de baja');
    } finally {
      setGuardando(false);
    }
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-accent bg-panel p-3 text-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="rounded border border-border px-2 py-1.5" />
          <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoría" className="rounded border border-border px-2 py-1.5" />
          <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Marca" className="rounded border border-border px-2 py-1.5" />
          <input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Modelo" className="rounded border border-border px-2 py-1.5" />
          <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ubicación" className="rounded border border-border px-2 py-1.5" />
          <select value={estado} onChange={(e) => setEstado(e.target.value as 'operativo' | 'mantenimiento')} className="rounded border border-border px-2 py-1.5">
            <option value="operativo">Operativo</option>
            <option value="mantenimiento">En mantenimiento</option>
          </select>
        </div>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <div className="mt-2 flex gap-2">
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
    );
  }

  if (dandoBaja) {
    return (
      <div className="rounded-lg border border-danger/40 bg-panel p-3 text-sm">
        <p className="mb-2 font-medium">Dar de baja: {activo.nombre}</p>
        <textarea
          value={motivoBaja}
          onChange={(e) => setMotivoBaja(e.target.value)}
          placeholder="Motivo de la baja (ej. dañado, obsoleto, robado)…"
          rows={2}
          className="w-full rounded border border-border px-2 py-1.5"
        />
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            onClick={confirmarBaja}
            disabled={guardando || !motivoBaja.trim()}
            className="rounded bg-danger px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Confirmar baja'}
          </button>
          <button onClick={() => setDandoBaja(false)} className="rounded border border-border px-3 py-1.5 text-xs">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between gap-3 rounded-lg border border-border bg-panel p-3 text-sm">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="truncate font-medium">{activo.nombre}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLOR[activo.estado]}`}>
            {ESTADO_LABEL[activo.estado]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[activo.categoria, activo.marca, activo.modelo].filter(Boolean).join(' · ') || 'Sin detalles'}
        </p>
        {activo.ubicacion && <p className="mt-1 text-xs text-foreground/70">Ubicación: {activo.ubicacion}</p>}
        {activo.estado === 'dado_de_baja' && activo.motivo_baja && (
          <p className="mt-1.5 text-xs text-danger">Motivo: {activo.motivo_baja}</p>
        )}
      </div>
      {activo.estado !== 'dado_de_baja' && (
        <div className="flex shrink-0 gap-2">
          <button onClick={empezarEdicion} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            Editar
          </button>
          <button onClick={() => setDandoBaja(true)} className="rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10">
            Dar de baja
          </button>
        </div>
      )}
    </div>
  );
}
