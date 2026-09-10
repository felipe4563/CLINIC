'use client';

import { useState } from 'react';
import Link from 'next/link';

export type Cita = {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente_pago' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio';
  Paciente: {
    id: number;
    nombre_completo: string;
    telefono: string;
    carnet_identidad: string;
    carnet_complemento?: string | null;
  };
  Profesional: { id: number; nombre: string };
  Servicio: { id: number; nombre: string; precio?: string };
};

const ESTADO_LABEL: Record<Cita['estado'], string> = {
  pendiente_pago: 'Pendiente de pago',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
};

const ESTADO_DOT: Record<Cita['estado'], string> = {
  confirmada: 'var(--stat-green)',
  pendiente_pago: 'var(--stat-amber)',
  cancelada: 'var(--muted-foreground)',
  completada: 'var(--stat-blue)',
  no_asistio: 'var(--stat-rose)',
};

function hora(hhmmss: string) {
  return hhmmss.slice(0, 5);
}

export default function DayAgendaCards({
  citas,
  mostrarProfesional,
  onEstadoChange,
}: {
  citas: Cita[];
  mostrarProfesional: boolean;
  onEstadoChange: (cita: Cita, estado: Cita['estado']) => void;
}) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null);

  const ordenadas = [...citas].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  if (ordenadas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm font-medium">No hay citas este día</p>
        <p className="mt-1 text-sm text-muted-foreground">Usa &ldquo;+ Nueva cita&rdquo; para agendar una.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {ordenadas.map((cita) => {
        const abierta = expandidoId === cita.id;
        return (
          <div
            key={cita.id}
            className="overflow-hidden rounded-xl border border-border bg-panel transition-colors"
            style={{ borderLeftWidth: 4, borderLeftColor: ESTADO_DOT[cita.estado] }}
          >
            <button
              onClick={() => setExpandidoId(abierta ? null : cita.id)}
              aria-expanded={abierta}
              aria-controls={`cita-detalle-${cita.id}`}
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {hora(cita.hora_inicio)} – {hora(cita.hora_fin)}
                </p>
                <p className="mt-0.5 truncate text-sm">{cita.Paciente.nombre_completo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {cita.Servicio.nombre}
                  {mostrarProfesional ? ` · ${cita.Profesional.nombre}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: `${ESTADO_DOT[cita.estado]}22`, color: ESTADO_DOT[cita.estado] }}
                >
                  {ESTADO_LABEL[cita.estado]}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-muted-foreground transition-transform ${abierta ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            <div
              id={`cita-detalle-${cita.id}`}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${abierta ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-2 border-t border-border px-4 py-3 text-sm">
                  <a href={`tel:${cita.Paciente.telefono}`} className="text-accent hover:underline">
                    {cita.Paciente.telefono}
                  </a>
                  <p className="text-muted-foreground">
                    Carnet {cita.Paciente.carnet_identidad}
                    {cita.Paciente.carnet_complemento ? `-${cita.Paciente.carnet_complemento}` : ''}
                  </p>
                  {cita.Servicio.precio && <p className="text-muted-foreground">Bs {cita.Servicio.precio}</p>}
                  {mostrarProfesional && <p className="text-muted-foreground">Con {cita.Profesional.nombre}</p>}

                  <select
                    value={cita.estado}
                    onChange={(e) => onEstadoChange(cita, e.target.value as Cita['estado'])}
                    className="mt-1 rounded-lg border border-border px-2 py-1.5 text-sm"
                  >
                    <option value="pendiente_pago">Pendiente de pago</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="no_asistio">No asistió</option>
                    <option value="cancelada">Cancelada</option>
                  </select>

                  <Link href={`/pacientes/${cita.Paciente.id}`} className="mt-1 text-sm text-accent hover:underline">
                    Ver ficha completa →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
