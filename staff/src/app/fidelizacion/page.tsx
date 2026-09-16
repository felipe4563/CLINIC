'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { IconHeart, IconSparkle, IconX } from '@/components/icons';

type Paciente = {
  id: number;
  nombre_completo: string;
  telefono: string;
  codigo_paciente: string;
  puntos_actuales: number;
};

type Movimiento = {
  id: number;
  tipo: 'ganado' | 'canje' | 'ajuste';
  puntos: number;
  motivo: string;
  createdAt: string;
  Recompensa?: { id: number; nombre: string } | null;
  Usuario?: { id: number; nombre: string } | null;
};

type Recompensa = {
  id: number;
  nombre: string;
  descripcion: string | null;
  costo_puntos: number;
  activo: boolean;
};

const ETIQUETA_TIPO: Record<Movimiento['tipo'], string> = {
  ganado: 'Ganado',
  canje: 'Canje',
  ajuste: 'Ajuste',
};

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FidelizacionPage() {
  const [tab, setTab] = useState<'pacientes' | 'recompensas'>('pacientes');

  return (
    <div>
      <h1 className="mb-1 flex items-center gap-2 text-lg font-semibold">
        <IconHeart className="h-5 w-5 text-muted-foreground" />
        Fidelización
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Puntos por consumo, canje de recompensas e historial por paciente.
      </p>

      <div className="mb-4 flex gap-1 border-b border-border">
        <button
          onClick={() => setTab('pacientes')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'pacientes' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
        >
          Pacientes
        </button>
        <button
          onClick={() => setTab('recompensas')}
          className={`px-3 py-2 text-sm font-medium ${tab === 'recompensas' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
        >
          Recompensas
        </button>
      </div>

      {tab === 'pacientes' ? <TabPacientes /> : <TabRecompensas />}
    </div>
  );
}

function TabPacientes() {
  const [q, setQ] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);

  const buscar = useCallback(async (texto: string) => {
    setLoading(true);
    setError(null);
    try {
      setPacientes(await api.getPacientes(texto));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscar('');
  }, [buscar]);

  if (seleccionado) {
    return (
      <DetallePaciente
        pacienteId={seleccionado}
        onVolver={() => {
          setSeleccionado(null);
          buscar(q);
        }}
      />
    );
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Buscar por nombre, teléfono, carnet o código…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && buscar(q)}
        className="mb-4 w-full max-w-md rounded border border-border px-3 py-2 text-sm"
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-foreground/70">Cargando…</p>}

      <div className="flex flex-col gap-2">
        {pacientes.map((p) => (
          <button
            key={p.id}
            onClick={() => setSeleccionado(p.id)}
            className="flex items-center justify-between rounded border border-border bg-panel p-3 text-left text-sm hover:border-accent"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{p.nombre_completo}</p>
              <p className="truncate text-foreground/70">
                {p.telefono} · {p.codigo_paciente}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {p.puntos_actuales} pts
            </span>
          </button>
        ))}
        {!loading && pacientes.length === 0 && <p className="text-sm text-foreground/70">Sin resultados.</p>}
      </div>
    </div>
  );
}

function DetallePaciente({ pacienteId, onVolver }: { pacienteId: number; onVolver: () => void }) {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ajusteAbierto, setAjusteAbierto] = useState(false);
  const [canjeAbierto, setCanjeAbierto] = useState(false);
  const [puntosAjuste, setPuntosAjuste] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [recompensaElegida, setRecompensaElegida] = useState<number | ''>('');
  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFidelizacionPaciente(pacienteId);
      setPaciente(data.paciente);
      setMovimientos(data.movimientos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el paciente');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function abrirCanje() {
    setErrorAccion(null);
    setCanjeAbierto(true);
    setAjusteAbierto(false);
    try {
      const todas: Recompensa[] = await api.getRecompensas();
      setRecompensas(todas.filter((r) => r.activo));
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudieron cargar las recompensas');
    }
  }

  async function enviarAjuste(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrorAccion(null);
    try {
      await api.ajustarPuntos(pacienteId, { puntos: Number(puntosAjuste), motivo: motivoAjuste });
      setAjusteAbierto(false);
      setPuntosAjuste('');
      setMotivoAjuste('');
      await cargar();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo registrar el ajuste');
    } finally {
      setEnviando(false);
    }
  }

  async function enviarCanje(e: FormEvent) {
    e.preventDefault();
    if (!recompensaElegida) return;
    setEnviando(true);
    setErrorAccion(null);
    try {
      await api.canjearRecompensa(pacienteId, recompensaElegida);
      setCanjeAbierto(false);
      setRecompensaElegida('');
      await cargar();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo canjear la recompensa');
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return <p className="text-sm text-foreground/70">Cargando…</p>;
  if (error || !paciente) return <p className="text-sm text-danger">{error || 'Paciente no encontrado'}</p>;

  return (
    <div>
      <button onClick={onVolver} className="mb-4 text-sm text-muted-foreground hover:text-foreground">
        ← Volver a la búsqueda
      </button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-panel p-5">
        <div>
          <p className="font-medium">{paciente.nombre_completo}</p>
          <p className="text-sm text-foreground/70">
            {paciente.telefono} · {paciente.codigo_paciente}
          </p>
        </div>
        <span className="rounded-full bg-accent-soft px-4 py-2 text-lg font-semibold text-accent">
          {paciente.puntos_actuales} pts
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setAjusteAbierto((v) => !v);
            setCanjeAbierto(false);
            setErrorAccion(null);
          }}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft"
        >
          {ajusteAbierto ? 'Cancelar' : 'Ajustar puntos'}
        </button>
        <button onClick={abrirCanje} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft">
          {canjeAbierto ? 'Cancelar' : 'Canjear recompensa'}
        </button>
      </div>

      {errorAccion && <p className="mb-3 text-sm text-danger">{errorAccion}</p>}

      {ajusteAbierto && (
        <form onSubmit={enviarAjuste} className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-border bg-panel p-4 text-sm sm:grid-cols-3">
          <label className="block">
            Puntos (+/-)
            <input
              type="number"
              required
              value={puntosAjuste}
              onChange={(e) => setPuntosAjuste(e.target.value)}
              placeholder="ej. 50 o -20"
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block sm:col-span-2">
            Motivo
            <input
              required
              value={motivoAjuste}
              onChange={(e) => setMotivoAjuste(e.target.value)}
              placeholder="ej. Promoción de aniversario"
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={enviando}
              className="rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
            >
              {enviando ? 'Guardando…' : 'Registrar ajuste'}
            </button>
          </div>
        </form>
      )}

      {canjeAbierto && (
        <form onSubmit={enviarCanje} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-panel p-4 text-sm">
          <label className="block">
            Recompensa
            <select
              required
              value={recompensaElegida}
              onChange={(e) => setRecompensaElegida(Number(e.target.value))}
              className="mt-1 rounded border border-border px-2.5 py-1.5"
            >
              <option value="" disabled>
                Selecciona una recompensa
              </option>
              {recompensas.map((r) => (
                <option key={r.id} value={r.id} disabled={r.costo_puntos > paciente.puntos_actuales}>
                  {r.nombre} — {r.costo_puntos} pts
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={enviando || !recompensaElegida}
            className="rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
          >
            {enviando ? 'Canjeando…' : 'Confirmar canje'}
          </button>
          {recompensas.length === 0 && <p className="text-foreground/70">No hay recompensas activas.</p>}
        </form>
      )}

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Historial</p>
      <div className="flex flex-col gap-2">
        {movimientos.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded border border-border bg-panel p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate">{m.motivo}</p>
              <p className="truncate text-xs text-foreground/70">
                {ETIQUETA_TIPO[m.tipo]} · {formatoFecha(m.createdAt)}
                {m.Usuario ? ` · ${m.Usuario.nombre}` : ''}
              </p>
            </div>
            <span className={`shrink-0 font-semibold ${m.puntos >= 0 ? 'text-stat-green' : 'text-danger'}`}>
              {m.puntos >= 0 ? '+' : ''}
              {m.puntos}
            </span>
          </div>
        ))}
        {movimientos.length === 0 && <p className="text-sm text-foreground/70">Sin movimientos todavía.</p>}
      </div>
    </div>
  );
}

const RECOMPENSA_VACIA = { nombre: '', descripcion: '', costo_puntos: '' };

function TabRecompensas() {
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [form, setForm] = useState(RECOMPENSA_VACIA);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRecompensas(await api.getRecompensas());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar recompensas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function abrirNueva() {
    setEditando(null);
    setForm(RECOMPENSA_VACIA);
    setErrorForm(null);
    setFormAbierto(true);
  }

  function abrirEditar(r: Recompensa) {
    setEditando(r.id);
    setForm({ nombre: r.nombre, descripcion: r.descripcion || '', costo_puntos: String(r.costo_puntos) });
    setErrorForm(null);
    setFormAbierto(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErrorForm(null);
    try {
      const datos = { nombre: form.nombre, descripcion: form.descripcion || null, costo_puntos: Number(form.costo_puntos) };
      if (editando) {
        await api.actualizarRecompensa(editando, datos);
      } else {
        await api.crearRecompensa(datos);
      }
      setFormAbierto(false);
      await cargar();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar la recompensa');
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivo(r: Recompensa) {
    try {
      await api.actualizarRecompensa(r.id, { activo: !r.activo });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la recompensa');
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Catálogo de recompensas canjeables por puntos.</p>
        <button
          onClick={() => (formAbierto ? setFormAbierto(false) : abrirNueva())}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft"
        >
          {formAbierto ? <IconX className="h-4 w-4" /> : <IconSparkle className="h-4 w-4" />}
          {formAbierto ? 'Cancelar' : 'Nueva recompensa'}
        </button>
      </div>

      {formAbierto && (
        <form onSubmit={guardar} className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-border bg-panel p-4 text-sm sm:grid-cols-2">
          <label className="block">
            Nombre
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block">
            Costo en puntos
            <input
              type="number"
              min="1"
              required
              value={form.costo_puntos}
              onChange={(e) => setForm({ ...form, costo_puntos: e.target.value })}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block sm:col-span-2">
            Descripción (opcional)
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>

          {errorForm && <p className="text-danger sm:col-span-2">{errorForm}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={guardando}
              className="rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear recompensa'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-foreground/70">Cargando…</p>}

      <div className="flex flex-col gap-2">
        {recompensas.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded border border-border bg-panel p-3 text-sm">
            <div className="min-w-0">
              <p className={`truncate font-medium ${!r.activo ? 'text-foreground/50 line-through' : ''}`}>{r.nombre}</p>
              {r.descripcion && <p className="truncate text-foreground/70">{r.descripcion}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">{r.costo_puntos} pts</span>
              <button onClick={() => abrirEditar(r)} className="text-xs text-muted-foreground hover:text-foreground">
                Editar
              </button>
              <button onClick={() => alternarActivo(r)} className="text-xs text-muted-foreground hover:text-foreground">
                {r.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
        {!loading && recompensas.length === 0 && <p className="text-sm text-foreground/70">Todavía no hay recompensas creadas.</p>}
      </div>
    </div>
  );
}
