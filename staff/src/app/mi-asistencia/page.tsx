'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api } from '@/lib/api';
import { IconClock } from '@/components/icons';

type Registro = { id: number; fecha: string; hora_entrada: string | null; hora_salida: string | null } | null;

type Ausencia = {
  id: number;
  tipo: 'vacacion' | 'licencia_medica' | 'permiso' | 'falta_justificada' | 'falta_injustificada';
  fecha_desde: string;
  fecha_hasta: string;
  motivo: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
};

const TIPO_LABEL: Record<Ausencia['tipo'], string> = {
  vacacion: 'Vacación',
  licencia_medica: 'Licencia médica',
  permiso: 'Permiso',
  falta_justificada: 'Falta justificada',
  falta_injustificada: 'Falta injustificada',
};

const ESTADO_COLOR: Record<Ausencia['estado'], string> = {
  pendiente: 'text-stat-amber',
  aprobado: 'text-stat-green',
  rechazado: 'text-danger',
};

const ESTADO_LABEL: Record<Ausencia['estado'], string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

function hora(hhmmss: string) {
  return hhmmss.slice(0, 5);
}

const VACIO = { tipo: 'permiso' as Ausencia['tipo'], fechaDesde: '', fechaHasta: '', motivo: '' };

export default function MiAsistenciaPage() {
  const [registro, setRegistro] = useState<Registro>(null);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [marcando, setMarcando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [hoy, mias] = await Promise.all([api.getAsistenciaHoy(), api.getMisAusencias()]);
      setRegistro(hoy);
      setAusencias(mias);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function marcar() {
    setMarcando(true);
    setError(null);
    try {
      const res = await api.marcarAsistencia();
      setRegistro(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo marcar');
    } finally {
      setMarcando(false);
    }
  }

  async function solicitar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api.solicitarAusencia(form);
      setForm(VACIO);
      setFormAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setGuardando(false);
    }
  }

  async function cancelar(id: number) {
    if (!window.confirm('¿Cancelar esta solicitud?')) return;
    try {
      await api.eliminarAusencia(id);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar');
    }
  }

  const yaCompleto = registro?.hora_entrada && registro?.hora_salida;

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <IconClock className="h-5 w-5 text-muted-foreground" />
        Mi asistencia
      </h1>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="mb-8 rounded-xl border border-border bg-panel p-5">
        <p className="text-xs text-muted-foreground">Hoy</p>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Entrada</p>
            <p className="text-lg font-semibold">{registro?.hora_entrada ? hora(registro.hora_entrada) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Salida</p>
            <p className="text-lg font-semibold">{registro?.hora_salida ? hora(registro.hora_salida) : '—'}</p>
          </div>
          <button
            onClick={marcar}
            disabled={marcando || Boolean(yaCompleto)}
            className="ml-auto rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {marcando ? 'Marcando…' : !registro ? 'Marcar entrada' : !registro.hora_salida ? 'Marcar salida' : 'Jornada completa'}
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Mis permisos y ausencias</h2>
        <button
          onClick={() => setFormAbierto((v) => !v)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
        >
          {formAbierto ? 'Cancelar' : '+ Solicitar'}
        </button>
      </div>

      {formAbierto && (
        <form onSubmit={solicitar} className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-border bg-panel p-3 text-sm sm:grid-cols-4">
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as Ausencia['tipo'] })}
            className="rounded border border-border px-2.5 py-1.5"
          >
            <option value="permiso">Permiso</option>
            <option value="vacacion">Vacación</option>
            <option value="licencia_medica">Licencia médica</option>
          </select>
          <input
            type="date"
            required
            value={form.fechaDesde}
            onChange={(e) => setForm({ ...form, fechaDesde: e.target.value })}
            className="rounded border border-border px-2.5 py-1.5"
          />
          <input
            type="date"
            required
            value={form.fechaHasta}
            onChange={(e) => setForm({ ...form, fechaHasta: e.target.value })}
            className="rounded border border-border px-2.5 py-1.5"
          />
          <input
            placeholder="Motivo (opcional)"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            className="rounded border border-border px-2.5 py-1.5"
          />
          <button
            type="submit"
            disabled={guardando}
            className="rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-4"
          >
            {guardando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {ausencias.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-panel p-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium">{TIPO_LABEL[a.tipo]}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {a.fecha_desde}
                {a.fecha_hasta !== a.fecha_desde ? ` – ${a.fecha_hasta}` : ''}
                {a.motivo ? ` · ${a.motivo}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`text-xs font-medium ${ESTADO_COLOR[a.estado]}`}>{ESTADO_LABEL[a.estado]}</span>
              {a.estado === 'pendiente' && (
                <button onClick={() => cancelar(a.id)} className="text-xs text-danger hover:underline">
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
        {ausencias.length === 0 && <p className="text-sm text-muted-foreground">No tienes solicitudes registradas.</p>}
      </div>
    </div>
  );
}
