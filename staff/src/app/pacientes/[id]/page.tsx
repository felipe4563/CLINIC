'use client';

import { useEffect, useState, useCallback, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { IconArrowLeft } from '@/components/icons';
import TratamientoItem, { type NotaClinica } from './TratamientoItem';

type Cita = {
  id: number;
  fecha: string;
  hora_inicio: string;
  estado: string;
  Profesional: { nombre: string };
  Servicio: { nombre: string };
};

type Paciente = {
  id: number;
  codigo_paciente: string;
  nombre_completo: string;
  telefono: string;
  carnet_identidad: string;
  carnet_complemento: string | null;
  carnet_expedido: string;
  fecha_nacimiento: string | null;
  Cita: Cita[];
};

type PaqueteSesiones = {
  id: number;
  sesiones_totales: number;
  sesiones_usadas: number;
  precio_total: string;
  fecha_compra: string;
  estado: 'pendiente' | 'pagado';
  Servicio: { id: number; nombre: string };
};

type ServicioOpcion = { id: number; nombre: string };

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

export default function FichaPacientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuth();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [verTodasCitas, setVerTodasCitas] = useState(false);
  const CITAS_VISIBLES = 8;

  const [notas, setNotas] = useState<NotaClinica[]>([]);
  const [profesionales, setProfesionales] = useState<{ id: number; nombre: string }[]>([]);
  const [formNotaAbierto, setFormNotaAbierto] = useState(false);
  const [tituloNota, setTituloNota] = useState('');
  const [notasNota, setNotasNota] = useState('');
  const [fechaNota, setFechaNota] = useState(() => new Date().toISOString().slice(0, 10));
  const [horaNota, setHoraNota] = useState('');
  const [profesionalNota, setProfesionalNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [errorNota, setErrorNota] = useState<string | null>(null);

  const [paquetes, setPaquetes] = useState<PaqueteSesiones[]>([]);
  const [servicios, setServicios] = useState<ServicioOpcion[]>([]);
  const [formPaqueteAbierto, setFormPaqueteAbierto] = useState(false);
  const [servicioPaquete, setServicioPaquete] = useState('');
  const [sesionesPaquete, setSesionesPaquete] = useState('5');
  const [precioPaquete, setPrecioPaquete] = useState('');
  const [metodoPagoPaquete, setMetodoPagoPaquete] = useState<'efectivo' | 'qr'>('efectivo');
  const [guardandoPaquete, setGuardandoPaquete] = useState(false);
  const [errorPaquete, setErrorPaquete] = useState<string | null>(null);
  const [qrPaquete, setQrPaquete] = useState<{ id: number; qr: string } | null>(null);
  const [qrPaqueteConfirmado, setQrPaqueteConfirmado] = useState(false);
  const pollPaqueteRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargar = useCallback(async () => {
    try {
      setPaciente(await api.getPaciente(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el paciente');
    }
  }, [params.id]);

  const cargarNotas = useCallback(async () => {
    try {
      setNotas(await api.getTratamientosPaciente(params.id));
    } catch {
      // el historial clinico es secundario; si falla no bloquea la ficha
    }
  }, [params.id]);

  const cargarPaquetes = useCallback(async () => {
    try {
      setPaquetes(await api.getPaquetesPaciente(params.id));
    } catch {
      // los paquetes son secundarios; si falla no bloquea la ficha
    }
  }, [params.id]);

  useEffect(() => {
    cargar();
    cargarNotas();
    cargarPaquetes();
    api.getProfesionalesPublico().then(setProfesionales).catch(() => setProfesionales([]));
    api.getServiciosPublico().then(setServicios).catch(() => setServicios([]));
  }, [cargar, cargarNotas, cargarPaquetes]);

  useEffect(() => {
    return () => {
      if (pollPaqueteRef.current) clearInterval(pollPaqueteRef.current);
    };
  }, []);

  function limpiarFormPaquete() {
    setServicioPaquete('');
    setSesionesPaquete('5');
    setPrecioPaquete('');
    setMetodoPagoPaquete('efectivo');
    setQrPaquete(null);
    setQrPaqueteConfirmado(false);
    if (pollPaqueteRef.current) clearInterval(pollPaqueteRef.current);
  }

  async function venderPaquete(e: FormEvent) {
    e.preventDefault();
    if (!servicioPaquete || !sesionesPaquete || !precioPaquete) return;
    setGuardandoPaquete(true);
    setErrorPaquete(null);
    try {
      const res = await api.crearPaquete(params.id, {
        servicioId: Number(servicioPaquete),
        sesionesTotales: Number(sesionesPaquete),
        precioTotal: Number(precioPaquete),
        metodoPago: metodoPagoPaquete,
      });

      if (metodoPagoPaquete === 'efectivo') {
        limpiarFormPaquete();
        setFormPaqueteAbierto(false);
        cargarPaquetes();
      } else {
        setQrPaquete({ id: res.paquete.id, qr: res.qrImageBase64 });
        pollPaqueteRef.current = setInterval(async () => {
          try {
            const estado = await api.estadoPaqueteQR(res.paquete.id);
            if (estado.pagado) {
              if (pollPaqueteRef.current) clearInterval(pollPaqueteRef.current);
              setQrPaqueteConfirmado(true);
              cargarPaquetes();
            }
          } catch {
            // reintenta solo
          }
        }, 4000);
      }
    } catch (err) {
      setErrorPaquete(err instanceof Error ? err.message : 'No se pudo registrar el paquete');
    } finally {
      setGuardandoPaquete(false);
    }
  }

  async function crearNota(e: FormEvent) {
    e.preventDefault();
    setGuardandoNota(true);
    setErrorNota(null);
    try {
      await api.crearTratamiento(params.id, {
        titulo: tituloNota,
        notas: notasNota,
        fecha: fechaNota,
        hora: horaNota || null,
        profesionalId: profesionalNota || null,
      });
      setTituloNota('');
      setNotasNota('');
      setFechaNota(new Date().toISOString().slice(0, 10));
      setHoraNota('');
      setProfesionalNota('');
      setFormNotaAbierto(false);
      cargarNotas();
    } catch (err) {
      setErrorNota(err instanceof Error ? err.message : 'No se pudo guardar la nota');
    } finally {
      setGuardandoNota(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!paciente) return;
    setGuardando(true);
    setOk(false);
    setError(null);
    try {
      await api.actualizarPaciente(paciente.id, {
        nombre_completo: paciente.nombre_completo,
        carnet_identidad: paciente.carnet_identidad,
        carnet_complemento: paciente.carnet_complemento,
        carnet_expedido: paciente.carnet_expedido,
        fecha_nacimiento: paciente.fecha_nacimiento,
      });
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!paciente) return;
    if (paciente.Cita.length > 0) return;
    if (!window.confirm(`¿Eliminar a ${paciente.nombre_completo}? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    setError(null);
    try {
      await api.eliminarPaciente(paciente.id);
      router.push('/pacientes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
      setEliminando(false);
    }
  }

  if (error && !paciente) return <p className="text-sm text-danger">{error}</p>;
  if (!paciente) return <p className="text-sm text-foreground/70">Cargando…</p>;

  return (
    <div>
      <Link
        href="/pacientes"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground"
      >
        <IconArrowLeft className="h-4 w-4" />
        Volver a pacientes
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{paciente.nombre_completo}</h1>
          <p className="text-sm text-foreground/70">{paciente.codigo_paciente}</p>
        </div>
        {usuario?.permisos?.includes('pacientes') && (
          <button
            onClick={eliminar}
            disabled={eliminando || paciente.Cita.length > 0}
            title={paciente.Cita.length > 0 ? 'No se puede eliminar: tiene citas registradas' : undefined}
            className="rounded-lg border border-danger/40 px-3 py-1.5 text-sm text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {eliminando ? 'Eliminando…' : 'Eliminar paciente'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        <form onSubmit={guardar} className="grid gap-3 rounded border border-border bg-panel p-4 text-sm lg:sticky lg:top-4">
          <label>
            Nombre completo
            <input
              value={paciente.nombre_completo}
              onChange={(e) => setPaciente({ ...paciente, nombre_completo: e.target.value })}
              className="mt-1 w-full rounded border border-border px-3 py-1.5"
            />
          </label>
          <label>
            Teléfono
            <input
              value={paciente.telefono}
              disabled
              title="El teléfono no se puede editar"
              className="mt-1 w-full cursor-not-allowed rounded border border-dashed border-border bg-background px-3 py-1.5 text-foreground/50"
            />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label>
              Carnet
              <input
                value={paciente.carnet_identidad}
                onChange={(e) => setPaciente({ ...paciente, carnet_identidad: e.target.value })}
                className="mt-1 w-full rounded border border-border px-3 py-1.5"
              />
            </label>
            <label>
              Complemento
              <input
                value={paciente.carnet_complemento ?? ''}
                onChange={(e) => setPaciente({ ...paciente, carnet_complemento: e.target.value })}
                className="mt-1 w-full rounded border border-border px-3 py-1.5"
              />
            </label>
            <label>
              Expedido
              <input
                value={paciente.carnet_expedido}
                onChange={(e) => setPaciente({ ...paciente, carnet_expedido: e.target.value })}
                className="mt-1 w-full rounded border border-border px-3 py-1.5"
              />
            </label>
          </div>
          <label>
            Fecha de nacimiento
            <input
              type="date"
              value={paciente.fecha_nacimiento ?? ''}
              onChange={(e) => setPaciente({ ...paciente, fecha_nacimiento: e.target.value })}
              className="mt-1 w-full rounded border border-border px-3 py-1.5"
            />
          </label>

          {error && <p className="text-danger">{error}</p>}
          {ok && <p className="text-green-700">Guardado.</p>}

          <button
            type="submit"
            disabled={guardando}
            className="mt-1 w-fit rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>

        <div>
          <h2 className="mb-2 text-sm font-semibold">
            Historial de citas{paciente.Cita.length > 0 ? ` (${paciente.Cita.length})` : ''}
          </h2>
          <div className="mb-8 flex flex-col gap-2">
            {(verTodasCitas ? paciente.Cita : paciente.Cita.slice(0, CITAS_VISIBLES)).map((cita) => (
              <div key={cita.id} className="rounded border border-border bg-panel p-3 text-sm">
                {cita.fecha} {cita.hora_inicio.slice(0, 5)} · {cita.Servicio.nombre} con {cita.Profesional.nombre} · {cita.estado}
              </div>
            ))}
            {paciente.Cita.length === 0 && <p className="text-sm text-foreground/70">Sin citas registradas.</p>}
            {!verTodasCitas && paciente.Cita.length > CITAS_VISIBLES && (
              <button
                onClick={() => setVerTodasCitas(true)}
                className="w-fit rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
              >
                Ver todas ({paciente.Cita.length})
              </button>
            )}
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              Paquetes de sesiones{paquetes.length > 0 ? ` (${paquetes.length})` : ''}
            </h2>
            <button
              onClick={() => {
                if (formPaqueteAbierto) limpiarFormPaquete();
                setFormPaqueteAbierto((v) => !v);
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
            >
              {formPaqueteAbierto ? 'Cancelar' : '+ Vender paquete'}
            </button>
          </div>

          {formPaqueteAbierto && (
            <div className="mb-4 rounded-lg border border-accent bg-panel p-3 text-sm">
              {qrPaquete ? (
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  {qrPaqueteConfirmado ? (
                    <>
                      <p className="font-medium text-green-700">¡Pago confirmado!</p>
                      <button
                        onClick={() => {
                          limpiarFormPaquete();
                          setFormPaqueteAbierto(false);
                        }}
                        className="mt-1 w-fit rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground"
                      >
                        Listo
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-foreground/70">Escanea el QR para completar el pago</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`data:image/png;base64,${qrPaquete.qr}`} alt="QR de pago" className="h-48 w-48" />
                      <p className="text-xs text-muted-foreground">Esperando confirmación…</p>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={venderPaquete} className="flex flex-col gap-2">
                  <select
                    required
                    value={servicioPaquete}
                    onChange={(e) => setServicioPaquete(e.target.value)}
                    className="rounded border border-border px-2.5 py-1.5"
                  >
                    <option value="">Elegir servicio…</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <label className="block text-xs text-muted-foreground">
                      Sesiones
                      <input
                        required
                        type="number"
                        min={1}
                        value={sesionesPaquete}
                        onChange={(e) => setSesionesPaquete(e.target.value)}
                        className="mt-1 w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground"
                      />
                    </label>
                    <label className="block text-xs text-muted-foreground">
                      Precio total (Bs)
                      <input
                        required
                        type="number"
                        min={0}
                        step="0.01"
                        value={precioPaquete}
                        onChange={(e) => setPrecioPaquete(e.target.value)}
                        className="mt-1 w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground"
                      />
                    </label>
                    <label className="block text-xs text-muted-foreground">
                      Pago
                      <select
                        value={metodoPagoPaquete}
                        onChange={(e) => setMetodoPagoPaquete(e.target.value as 'efectivo' | 'qr')}
                        className="mt-1 w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="qr">QR</option>
                      </select>
                    </label>
                  </div>
                  {errorPaquete && <p className="text-danger">{errorPaquete}</p>}
                  <button
                    type="submit"
                    disabled={guardandoPaquete}
                    className="w-fit rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
                  >
                    {guardandoPaquete ? 'Procesando…' : 'Vender paquete'}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mb-8 flex flex-col gap-2">
            {paquetes.map((p) => {
              const restantes = p.sesiones_totales - p.sesiones_usadas;
              const agotado = restantes <= 0;
              return (
                <div key={p.id} className="rounded border border-border bg-panel p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{p.Servicio.nombre}</span>
                    <span className="text-xs text-muted-foreground">{fmtFecha(p.fecha_compra)} · Bs {p.precio_total}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    {p.estado === 'pendiente' ? (
                      <span className="text-amber-600">Pago pendiente</span>
                    ) : (
                      <span className={agotado ? 'text-foreground/50' : 'text-foreground/70'}>
                        {p.sesiones_usadas}/{p.sesiones_totales} sesiones usadas
                        {agotado ? ' · agotado' : ` · quedan ${restantes}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {paquetes.length === 0 && <p className="text-sm text-foreground/70">Sin paquetes de sesiones vendidos.</p>}
          </div>

          <div id="historial-clinico" className="mb-3 flex flex-wrap items-center justify-between gap-2 scroll-mt-20">
            <h2 className="text-sm font-semibold">Historial clínico</h2>
            <button
              onClick={() => setFormNotaAbierto((v) => !v)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
            >
              {formNotaAbierto ? 'Cancelar' : '+ Nueva nota'}
            </button>
          </div>

          {formNotaAbierto && (
            <form onSubmit={crearNota} className="mb-4 flex flex-col gap-2 rounded-lg border border-accent bg-panel p-3 text-sm">
              <input
                required
                placeholder="Título (ej. Control post-tratamiento)"
                value={tituloNota}
                onChange={(e) => setTituloNota(e.target.value)}
                className="w-full rounded border border-border px-2.5 py-1.5"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  type="date"
                  required
                  value={fechaNota}
                  onChange={(e) => setFechaNota(e.target.value)}
                  className="rounded border border-border px-2.5 py-1.5"
                />
                <input
                  type="time"
                  value={horaNota}
                  onChange={(e) => setHoraNota(e.target.value)}
                  placeholder="Hora (opcional)"
                  className="rounded border border-border px-2.5 py-1.5"
                />
                <select
                  value={profesionalNota}
                  onChange={(e) => setProfesionalNota(e.target.value)}
                  className="rounded border border-border px-2.5 py-1.5"
                >
                  <option value="">Sin profesional</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {horaNota && !profesionalNota && (
                <p className="text-xs text-muted-foreground">Elige un profesional para validar que la hora no choque con una cita.</p>
              )}
              <textarea
                required
                placeholder="Notas clínicas, observaciones, evolución…"
                value={notasNota}
                onChange={(e) => setNotasNota(e.target.value)}
                rows={3}
                className="w-full rounded border border-border px-2.5 py-1.5"
              />
              {errorNota && <p className="text-danger">{errorNota}</p>}
              <button
                type="submit"
                disabled={guardandoNota}
                className="w-fit rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
              >
                {guardandoNota ? 'Guardando…' : 'Guardar nota'}
              </button>
            </form>
          )}

          <div className="flex flex-col gap-2">
            {notas.map((n) => (
              <TratamientoItem key={n.id} nota={n} onChange={cargarNotas} />
            ))}
            {notas.length === 0 && <p className="text-sm text-foreground/70">Sin notas clínicas todavía.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
