'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api } from '@/lib/api';
import { IconUserCheck } from '@/components/icons';

type Usuario = { id: number; nombre: string };

type Registro = {
  id: number;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  observacion: string | null;
  Usuario: Usuario;
};

type Ausencia = {
  id: number;
  tipo: 'vacacion' | 'licencia_medica' | 'permiso' | 'falta_justificada' | 'falta_injustificada';
  fecha_desde: string;
  fecha_hasta: string;
  motivo: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  Usuario: Usuario;
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

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hora(hhmmss: string) {
  return hhmmss.slice(0, 5);
}

const VACIO_REGISTRO = { usuarioId: '', tipo: 'falta_injustificada' as Ausencia['tipo'], fechaDesde: '', fechaHasta: '', motivo: '' };

export default function PersonalPage() {
  const [tab, setTab] = useState<'asistencia' | 'ausencias'>('asistencia');
  const [fecha, setFecha] = useState(hoyISO());
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState(VACIO_REGISTRO);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [regs, aus] = await Promise.all([api.getAsistencia({ fecha }), api.getAusencias()]);
      setRegistros(regs);
      setAusencias(aus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Acceso restringido');
    }
    try {
      setUsuarios(await api.getUsuarios());
    } catch {
      setUsuarios([]);
    }
  }, [fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstado(id: number, estado: Ausencia['estado']) {
    try {
      await api.actualizarEstadoAusencia(id, estado);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar');
    }
  }

  async function registrar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api.registrarAusencia(form);
      setForm(VACIO_REGISTRO);
      setFormAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setGuardando(false);
    }
  }

  const pendientes = ausencias.filter((a) => a.estado === 'pendiente');

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <IconUserCheck className="h-5 w-5 text-muted-foreground" />
        Control de Personal
      </h1>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="mb-4 flex gap-1 border-b border-border">
        <button
          onClick={() => setTab('asistencia')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'asistencia' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
        >
          Asistencia
        </button>
        <button
          onClick={() => setTab('ausencias')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'ausencias' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
        >
          Permisos y faltas
          {pendientes.length > 0 && (
            <span className="ml-2 rounded-full bg-stat-amber-soft px-2 py-0.5 text-[11px] text-stat-amber">{pendientes.length}</span>
          )}
        </button>
      </div>

      {tab === 'asistencia' && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-border px-2.5 py-1.5 text-sm"
            />
            <button onClick={() => setFecha(hoyISO())} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft">
              Hoy
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {registros.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-panel p-3 text-sm">
                <p className="font-medium">{r.Usuario.nombre}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Entrada: {r.hora_entrada ? hora(r.hora_entrada) : '—'}</span>
                  <span>Salida: {r.hora_salida ? hora(r.hora_salida) : '—'}</span>
                </div>
              </div>
            ))}
            {registros.length === 0 && <p className="text-sm text-muted-foreground">Sin marcaciones este día.</p>}
          </div>
        </div>
      )}

      {tab === 'ausencias' && (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setFormAbierto((v) => !v)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
            >
              {formAbierto ? 'Cancelar' : '+ Registrar ausencia'}
            </button>
          </div>

          {formAbierto && (
            <form
              onSubmit={registrar}
              className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-border bg-panel p-3 text-sm sm:grid-cols-2 lg:grid-cols-5"
            >
              <select
                required
                value={form.usuarioId}
                onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
                className="rounded border border-border px-2.5 py-1.5"
              >
                <option value="">Empleado…</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as Ausencia['tipo'] })}
                className="rounded border border-border px-2.5 py-1.5"
              >
                <option value="falta_injustificada">Falta injustificada</option>
                <option value="falta_justificada">Falta justificada</option>
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
                className="rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2 lg:col-span-5"
              >
                {guardando ? 'Guardando…' : 'Registrar'}
              </button>
            </form>
          )}

          <div className="flex flex-col gap-2">
            {ausencias.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-panel p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    {a.Usuario.nombre} · {TIPO_LABEL[a.tipo]}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.fecha_desde}
                    {a.fecha_hasta !== a.fecha_desde ? ` – ${a.fecha_hasta}` : ''}
                    {a.motivo ? ` · ${a.motivo}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {a.estado === 'pendiente' ? (
                    <>
                      <button onClick={() => cambiarEstado(a.id, 'aprobado')} className="text-xs font-medium text-stat-green hover:underline">
                        Aprobar
                      </button>
                      <button onClick={() => cambiarEstado(a.id, 'rechazado')} className="text-xs font-medium text-danger hover:underline">
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs font-medium ${ESTADO_COLOR[a.estado]}`}>
                      {a.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {ausencias.length === 0 && <p className="text-sm text-muted-foreground">No hay ausencias registradas.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
