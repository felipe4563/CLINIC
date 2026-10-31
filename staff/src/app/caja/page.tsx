'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api } from '@/lib/api';
import { IconCashRegister, IconChevronDown } from '@/components/icons';

type Origen = 'venta' | 'compra' | 'cita' | 'paquete' | 'mantenimiento' | 'manual';

type Movimiento = {
  id: number;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: string;
  fecha: string;
  createdAt: string;
  origen: Origen;
  Usuario: { nombre: string } | null;
};

type Detalle = {
  origen: Origen;
  registrado: string;
  usuario: string | null;
  venta?: {
    cliente: string;
    metodo_pago: 'efectivo' | 'qr';
    subtotal: string | null;
    descuento_porcentaje: string;
    total: string;
    items: { nombre: string; cantidad: number; precio_unitario: string; subtotal: string }[];
  } | null;
  compra?: {
    proveedor: string | null;
    nota: string | null;
    items: { nombre: string; cantidad: number; costo_unitario: string; subtotal: string; lote: string | null; fecha_vencimiento: string | null }[];
  } | null;
  cita?: {
    paciente: string | null;
    servicio: string | null;
    profesional: string | null;
    fecha: string | null;
    hora: string | null;
    monto_total: string;
    descuento: string;
    metodo_pago_saldo: 'efectivo' | 'qr' | null;
  } | null;
  paquete?: { paciente: string | null; servicio: string | null; sesiones_totales: number; sesiones_usadas: number; precio_total: string } | null;
  mantenimiento?: {
    equipo: string | null;
    lugar: string | null;
    cantidad: number;
    destino: string | null;
    motivo: string | null;
    trabajo_realizado: string | null;
    fecha_salida: string;
    fecha_regreso: string | null;
  } | null;
};

type Modo = 'dia' | 'rango';
type FiltroTipo = '' | 'ingreso' | 'egreso';

const ORIGEN: Record<Origen, string> = {
  venta: 'Venta',
  compra: 'Compra',
  cita: 'Cita',
  paquete: 'Paquete',
  mantenimiento: 'Mantenimiento',
  manual: 'Manual',
};

function iso(dt: Date) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function hoyISO() {
  return iso(new Date());
}

function sumarDias(fecha: string, dias: number) {
  const [a, m, d] = fecha.split('-').map(Number);
  return iso(new Date(a, m - 1, d + dias));
}

function fmtFechaLarga(fecha: string) {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

function fmtHora(fechaHora: string) {
  return new Date(fechaHora).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const bs = (monto: string | number | null | undefined) => `Bs ${Number(monto || 0).toFixed(2)}`;

// Atajos de rango: semana (lunes a hoy) y mes en curso.
function rangoSemana() {
  const hoy = new Date();
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7));
  return { desde: iso(lunes), hasta: iso(hoy) };
}
function rangoMes() {
  const hoy = new Date();
  return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: iso(hoy) };
}

export default function CajaPage() {
  const [modo, setModo] = useState<Modo>('dia');
  const [fecha, setFecha] = useState(hoyISO());
  const [rango, setRango] = useState(rangoSemana);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('');

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalEgresos, setTotalEgresos] = useState(0);
  const [saldoNeto, setSaldoNeto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [abiertos, setAbiertos] = useState<Set<number>>(new Set());
  const [detalles, setDetalles] = useState<Record<number, Detalle | 'error'>>({});

  const [formAbierto, setFormAbierto] = useState(false);
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('egreso');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);

  const filtros = modo === 'dia' ? { fecha, tipo: filtroTipo } : { desde: rango.desde, hasta: rango.hasta, tipo: filtroTipo };
  const claveFiltros = JSON.stringify(filtros);

  const cargar = useCallback(
    () =>
      api
        .getCajaFiltrada(JSON.parse(claveFiltros))
        .then((res: { movimientos: Movimiento[]; totalIngresos: number; totalEgresos: number; saldoNeto: number }) => {
          setMovimientos(res.movimientos);
          setTotalIngresos(res.totalIngresos);
          setTotalEgresos(res.totalEgresos);
          setSaldoNeto(res.saldoNeto);
          setError(null);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar la caja'))
        .finally(() => setLoading(false)),
    [claveFiltros],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function verDetalle(id: number) {
    const yaAbierto = abiertos.has(id);
    setAbiertos((actual) => {
      const nuevo = new Set(actual);
      if (yaAbierto) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
    if (yaAbierto || detalles[id]) return;
    try {
      const d: Detalle = await api.getDetalleMovimientoCaja(id);
      setDetalles((actual) => ({ ...actual, [id]: d }));
    } catch {
      setDetalles((actual) => ({ ...actual, [id]: 'error' }));
    }
  }

  async function crear(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api.crearMovimientoCaja({ tipo, concepto, monto: Number(monto), fecha: modo === 'dia' ? fecha : hoyISO() });
      setConcepto('');
      setMonto('');
      setFormAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: number) {
    if (!window.confirm('¿Eliminar este movimiento de caja?')) return;
    try {
      await api.eliminarMovimientoCaja(id);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  // En un rango, los movimientos van agrupados por día (el más reciente arriba).
  const porDia: [string, Movimiento[]][] = [];
  for (const m of movimientos) {
    const ultimo = porDia[porDia.length - 1];
    if (ultimo && ultimo[0] === m.fecha) ultimo[1].push(m);
    else porDia.push([m.fecha, [m]]);
  }

  const boton = 'rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft';
  const segmento = (activo: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activo ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconCashRegister className="h-5 w-5 text-muted-foreground" />
          Caja
        </h1>
        <div className="flex rounded-lg border border-border bg-panel p-0.5" role="group" aria-label="Periodo">
          <button type="button" onClick={() => setModo('dia')} aria-pressed={modo === 'dia'} className={segmento(modo === 'dia')}>
            Por día
          </button>
          <button type="button" onClick={() => setModo('rango')} aria-pressed={modo === 'rango'} className={segmento(modo === 'rango')}>
            Por fechas
          </button>
        </div>
      </div>

      {/* Periodo */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {modo === 'dia' ? (
          <>
            <button onClick={() => setFecha(sumarDias(fecha, -1))} className={boton} aria-label="Día anterior">
              ←
            </button>
            <input type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} aria-label="Día" className="rounded-lg border border-border bg-panel px-2.5 py-1.5 text-sm" />
            <button onClick={() => setFecha(sumarDias(fecha, 1))} className={boton} aria-label="Día siguiente">
              →
            </button>
            <button onClick={() => setFecha(hoyISO())} className={boton}>
              Hoy
            </button>
            <span className="ml-1 text-sm capitalize text-muted-foreground">{fmtFechaLarga(fecha)}</span>
          </>
        ) : (
          <>
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Desde
              <input type="date" value={rango.desde} max={rango.hasta} onChange={(e) => e.target.value && setRango({ ...rango, desde: e.target.value })} className="rounded-lg border border-border bg-panel px-2.5 py-1.5 text-sm text-foreground" />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Hasta
              <input type="date" value={rango.hasta} min={rango.desde} onChange={(e) => e.target.value && setRango({ ...rango, hasta: e.target.value })} className="rounded-lg border border-border bg-panel px-2.5 py-1.5 text-sm text-foreground" />
            </label>
            <button onClick={() => setRango(rangoSemana())} className={boton}>
              Esta semana
            </button>
            <button onClick={() => setRango(rangoMes())} className={boton}>
              Este mes
            </button>
          </>
        )}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <p className="mt-1 text-xl font-semibold text-stat-green">{bs(totalIngresos)}</p>
        </div>
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="text-xs text-muted-foreground">Egresos</p>
          <p className="mt-1 text-xl font-semibold text-stat-rose">{bs(totalEgresos)}</p>
        </div>
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="text-xs text-muted-foreground">Saldo neto</p>
          <p className="mt-1 text-xl font-semibold">{bs(saldoNeto)}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold">Movimientos</h2>
          <div className="flex rounded-lg border border-border bg-panel p-0.5" role="group" aria-label="Filtrar por tipo">
            {(
              [
                ['', 'Todos'],
                ['ingreso', 'Ingresos'],
                ['egreso', 'Egresos'],
              ] as const
            ).map(([valor, texto]) => (
              <button key={valor} type="button" onClick={() => setFiltroTipo(valor)} aria-pressed={filtroTipo === valor} className={segmento(filtroTipo === valor)}>
                {texto}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setFormAbierto((v) => !v)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
          {formAbierto ? 'Cancelar' : '+ Nuevo movimiento'}
        </button>
      </div>

      {formAbierto && (
        <form onSubmit={crear} className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-border bg-panel p-3 text-sm sm:grid-cols-4">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as 'ingreso' | 'egreso')} className="rounded border border-border px-2.5 py-1.5">
            <option value="egreso">Egreso</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <input
            required
            placeholder="Concepto (ej. Compra de insumos)"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="rounded border border-border px-2.5 py-1.5 sm:col-span-2"
          />
          <input
            type="number"
            step="0.01"
            required
            placeholder="Monto (Bs)"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="rounded border border-border px-2.5 py-1.5"
          />
          <p className="text-xs text-muted-foreground sm:col-span-4">Se registra con fecha {fmtFecha(modo === 'dia' ? fecha : hoyISO())}.</p>
          <button type="submit" disabled={guardando} className="rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-4">
            {guardando ? 'Guardando…' : 'Registrar movimiento'}
          </button>
        </form>
      )}

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      <div className="flex flex-col gap-4">
        {porDia.map(([dia, lista]) => (
          <div key={dia} className="flex flex-col gap-2">
            {modo === 'rango' && <p className="text-xs font-semibold capitalize text-muted-foreground">{fmtFechaLarga(dia)}</p>}
            {lista.map((m) => {
              const expandido = abiertos.has(m.id);
              const detalle = detalles[m.id];
              return (
                <div key={m.id} className="rounded-lg border border-border bg-panel text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <button type="button" onClick={() => verDetalle(m.id)} aria-expanded={expandido} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <IconChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expandido ? 'rotate-180' : ''}`} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{m.concepto}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {fmtHora(m.createdAt)} · {ORIGEN[m.origen]}
                          {m.Usuario ? ` · ${m.Usuario.nombre}` : ''}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`font-medium ${m.tipo === 'ingreso' ? 'text-stat-green' : 'text-stat-rose'}`}>
                        {m.tipo === 'ingreso' ? '+' : '−'} {bs(m.monto)}
                      </span>
                      {m.origen === 'manual' && (
                        <button onClick={() => eliminar(m.id)} className="text-xs text-danger hover:underline">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                  {expandido && (
                    <div className="border-t border-border px-3 pb-3 pt-2.5">
                      {!detalle && <p className="text-xs text-muted-foreground">Cargando detalle…</p>}
                      {detalle === 'error' && <p className="text-xs text-danger">No se pudo cargar el detalle.</p>}
                      {detalle && detalle !== 'error' && <DetalleMovimiento d={detalle} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {!loading && movimientos.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">
            {filtroTipo ? `Sin ${filtroTipo === 'ingreso' ? 'ingresos' : 'egresos'}` : 'Sin movimientos'} {modo === 'dia' ? 'este día' : 'en estas fechas'}.
          </p>
        )}
      </div>
    </div>
  );
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function Items({ filas }: { filas: { nombre: string; detalle: string; importe: string }[] }) {
  return (
    <div className="flex flex-col gap-1">
      {filas.map((f, i) => (
        <div key={i} className="flex items-center justify-between gap-2 text-xs">
          <span className="min-w-0 flex-1 truncate">{f.nombre}</span>
          <span className="shrink-0 text-muted-foreground">{f.detalle}</span>
          <span className="w-20 shrink-0 text-right font-medium">{f.importe}</span>
        </div>
      ))}
    </div>
  );
}

function DetalleMovimiento({ d }: { d: Detalle }) {
  return (
    <div className="flex flex-col gap-2">
      {d.venta && (
        <>
          <Items filas={d.venta.items.map((i) => ({ nombre: i.nombre, detalle: `${i.cantidad} × ${bs(i.precio_unitario)}`, importe: bs(i.subtotal) }))} />
          <div className="flex flex-col gap-1 border-t border-border pt-2">
            <Fila etiqueta="Cliente">{d.venta.cliente}</Fila>
            {Number(d.venta.descuento_porcentaje) > 0 && (
              <Fila etiqueta={`Descuento ${Number(d.venta.descuento_porcentaje)} %`}>− {bs(Number(d.venta.subtotal) - Number(d.venta.total))}</Fila>
            )}
            <Fila etiqueta="Pago">{d.venta.metodo_pago === 'qr' ? 'QR' : 'Efectivo'}</Fila>
          </div>
        </>
      )}
      {d.compra && (
        <>
          <Items
            filas={d.compra.items.map((i) => ({
              nombre: `${i.nombre}${i.lote ? ` · lote ${i.lote}` : ''}${i.fecha_vencimiento ? ` · vence ${fmtFecha(i.fecha_vencimiento)}` : ''}`,
              detalle: `${i.cantidad} × ${bs(i.costo_unitario)}`,
              importe: bs(i.subtotal),
            }))}
          />
          <div className="flex flex-col gap-1 border-t border-border pt-2">
            <Fila etiqueta="Proveedor">{d.compra.proveedor || '—'}</Fila>
            {d.compra.nota && <Fila etiqueta="Nota">{d.compra.nota}</Fila>}
          </div>
        </>
      )}
      {d.cita && (
        <div className="flex flex-col gap-1">
          <Fila etiqueta="Paciente">{d.cita.paciente || '—'}</Fila>
          <Fila etiqueta="Tratamiento">{d.cita.servicio || '—'}</Fila>
          {d.cita.profesional && <Fila etiqueta="Profesional">{d.cita.profesional}</Fila>}
          {d.cita.fecha && <Fila etiqueta="Cita">{`${fmtFecha(d.cita.fecha)}${d.cita.hora ? ` ${d.cita.hora.slice(0, 5)}` : ''}`}</Fila>}
          <Fila etiqueta="Precio del tratamiento">{bs(d.cita.monto_total)}</Fila>
          {Number(d.cita.descuento) > 0 && <Fila etiqueta="Descuento">{bs(d.cita.descuento)}</Fila>}
          {d.cita.metodo_pago_saldo && <Fila etiqueta="Pago">{d.cita.metodo_pago_saldo === 'qr' ? 'QR' : 'Efectivo'}</Fila>}
        </div>
      )}
      {d.paquete && (
        <div className="flex flex-col gap-1">
          <Fila etiqueta="Paciente">{d.paquete.paciente || '—'}</Fila>
          <Fila etiqueta="Tratamiento">{d.paquete.servicio || '—'}</Fila>
          <Fila etiqueta="Sesiones">{`${d.paquete.sesiones_usadas} de ${d.paquete.sesiones_totales} usadas`}</Fila>
          <Fila etiqueta="Precio del paquete">{bs(d.paquete.precio_total)}</Fila>
        </div>
      )}
      {d.mantenimiento && (
        <div className="flex flex-col gap-1">
          <Fila etiqueta="Equipo">{`${d.mantenimiento.equipo || '—'}${d.mantenimiento.cantidad > 1 ? ` × ${d.mantenimiento.cantidad}` : ''}`}</Fila>
          <Fila etiqueta="Lugar">{d.mantenimiento.lugar || '—'}</Fila>
          {d.mantenimiento.destino && <Fila etiqueta="Lo arregló">{d.mantenimiento.destino}</Fila>}
          <Fila etiqueta="Salió / volvió">{`${fmtFecha(d.mantenimiento.fecha_salida)} → ${d.mantenimiento.fecha_regreso ? fmtFecha(d.mantenimiento.fecha_regreso) : '—'}`}</Fila>
          {d.mantenimiento.motivo && <Fila etiqueta="Motivo">{d.mantenimiento.motivo}</Fila>}
          {d.mantenimiento.trabajo_realizado && <Fila etiqueta="Qué se hizo">{d.mantenimiento.trabajo_realizado}</Fila>}
        </div>
      )}
      {d.origen === 'manual' && <p className="text-xs text-muted-foreground">Movimiento registrado a mano en Caja.</p>}
      <p className="text-[11px] text-muted-foreground">
        Registrado el {new Date(d.registrado).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short', hour12: false })}
        {d.usuario ? ` por ${d.usuario}` : ''}
      </p>
    </div>
  );
}
