'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { api, API_URL } from '@/lib/api';
import PerfilWebModal from './PerfilWebModal';
import DetallesProfesionalModal from './DetallesProfesionalModal';
import type { Servicio } from './ServicioItem';

export type Profesional = {
  id: number;
  nombre: string;
  slug?: string | null;
  especialidad: string | null;
  registro_profesional?: string | null;
  cargo?: string | null;
  biografia?: string | null;
  formacion?: { titulo: string; detalle: string }[];
  mostrar_en_web?: boolean;
  orden_web?: number;
  foto_url: string | null;
  activo: boolean;
  Servicios?: Servicio[];
};

// Las fotos subidas viven en la API; las que se cargaron antes como enlace se usan tal cual.
export function fotoSrc(fotoUrl: string | null | undefined) {
  if (!fotoUrl) return null;
  return fotoUrl.startsWith('/uploads/') ? `${API_URL}${fotoUrl}` : fotoUrl;
}

export default function ProfesionalItem({
  profesional,
  todosLosServicios,
  onChange,
}: {
  profesional: Profesional;
  todosLosServicios: Servicio[];
  onChange: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [detallesAbierto, setDetallesAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [nombre, setNombre] = useState(profesional.nombre);
  const [especialidad, setEspecialidad] = useState(profesional.especialidad || '');
  const [registro, setRegistro] = useState(profesional.registro_profesional || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  function empezarEdicion() {
    setNombre(profesional.nombre);
    setEspecialidad(profesional.especialidad || '');
    setRegistro(profesional.registro_profesional || '');
    setError('');
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    try {
      await api.actualizarProfesional(profesional.id, {
        nombre,
        especialidad: especialidad || null,
        registro_profesional: registro || null,
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
    await api.actualizarProfesional(profesional.id, { activo: !profesional.activo });
    onChange();
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-accent bg-panel p-3 text-sm">
        <div className="flex flex-col gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="rounded border border-border px-2 py-1.5" />
          <input
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            placeholder="Especialidad"
            className="rounded border border-border px-2 py-1.5"
          />
          <input
            placeholder="Registro profesional (sale en el consentimiento)"
            value={registro}
            onChange={(e) => setRegistro(e.target.value)}
            className="rounded border border-border px-2 py-1.5"
          />
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

  const iniciales = profesional.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-panel text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-3 p-4">
        <button onClick={() => setDetallesAbierto(true)} className="flex min-w-0 items-center gap-3 text-left">
          {profesional.foto_url ? (
            <img src={fotoSrc(profesional.foto_url)!} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover object-top" />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base font-semibold text-accent">
              {iniciales || '?'}
            </span>
          )}
          <span className="min-w-0">
            <p className="break-words font-medium">
              {profesional.nombre} {profesional.especialidad ? `· ${profesional.especialidad}` : ''}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {(profesional.Servicios || []).length} servicio(s) asignado(s)
              {!profesional.activo ? ' · Inactivo' : ''}
              {profesional.mostrar_en_web ? ' · En la web' : ''}
            </p>
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          <button onClick={empezarEdicion} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            Editar
          </button>
          <button onClick={toggleActivo} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            {profesional.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button onClick={() => setPerfilAbierto(true)} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            Perfil web
          </button>
          <button onClick={() => setDetallesAbierto(true)} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent-soft">
            Servicios y horario
          </button>
        </div>
      </div>

      {/* En el body: la tarjeta se mueve al pasar el mouse y su transform encerraría a los modales fijos. */}
      {perfilAbierto &&
        createPortal(<PerfilWebModal profesional={profesional} onClose={() => setPerfilAbierto(false)} onCambio={onChange} />, document.body)}
      {detallesAbierto &&
        createPortal(
          <DetallesProfesionalModal
            profesional={profesional}
            todosLosServicios={todosLosServicios}
            onClose={() => setDetallesAbierto(false)}
            onCambio={onChange}
          />,
          document.body,
        )}
    </div>
  );
}
