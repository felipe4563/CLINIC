'use client';

import { Fragment, useState } from 'react';
import { IconAlertCircle, IconChevronDown } from '@/components/icons';

type TipoAusencia = 'vacacion' | 'licencia_medica' | 'permiso' | 'falta_justificada' | 'falta_injustificada';
type EstadoAusencia = 'pendiente' | 'aprobado' | 'rechazado';

type Dia = {
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  horas: number;
  sinSalida: boolean;
  dentroRango: boolean | null;
  observacion: string | null;
};

type AusenciaPeriodo = { tipo: TipoAusencia; desde: string; hasta: string; estado: EstadoAusencia; motivo: string | null; dias: number };

type Empleado = {
  usuarioId: number;
  usuario: string;
  diasTrabajados: number;
  horasTrabajadas: number;
  promedioHorasDia: number;
  diasSinSalida: number;
  fueraDeRango: number;
  diasAusencia: number;
  ausenciasPorTipo: Partial<Record<TipoAusencia, number>>;
  ausenciasPendientes: number;
  dias: Dia[];
  ausencias: AusenciaPeriodo[];
};

export type Personal = {
  resumen: { horasTotales: number; diasTrabajados: number; diasAusencia: number; alertas: number };
  porEmpleado: Empleado[];
};

const TIPO_LABEL: Record<TipoAusencia, string> = {
  vacacion: 'Vacación',
  licencia_medica: 'Licencia médica',
  permiso: 'Permiso',
  falta_justificada: 'Falta justificada',
  falta_injustificada: 'Falta injustificada',
};

const ESTADO_LABEL: Record<EstadoAusencia, string> = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };

const ESTADO_COLOR: Record<EstadoAusencia, string> = {
  pendiente: 'text-stat-amber',
  aprobado: 'text-stat-green',
  rechazado: 'text-danger',
};

function fecha(iso: string) {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

function plural(n: number, singular: string, pluralTxt: string) {
  return `${n} ${n === 1 ? singular : pluralTxt}`;
}

function Chip({ tono, children }: { tono: 'amber' | 'rose' | 'green' | 'neutral'; children: React.ReactNode }) {
  const clases = {
    amber: 'bg-stat-amber-soft text-stat-amber',
    rose: 'bg-stat-rose-soft text-stat-rose',
    green: 'bg-stat-green-soft text-stat-green',
    neutral: 'bg-accent-soft text-muted-foreground',
  }[tono];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${clases}`}>{children}</span>;
}

function Resumen({ label, valor, detalle, alerta }: { label: string; valor: string; detalle?: string; alerta?: boolean }) {
  return (
    <div className={`rounded-xl border bg-panel p-4 ${alerta ? 'border-stat-amber/60' : 'border-border'}`}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {alerta && <IconAlertCircle className="h-3.5 w-3.5 text-stat-amber" />}
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${alerta ? 'text-stat-amber' : ''}`}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-muted-foreground">{detalle}</p>}
    </div>
  );
}

function CeldaAusencias({ e }: { e: Empleado }) {
  const tipos = Object.entries(e.ausenciasPorTipo) as [TipoAusencia, number][];
  if (tipos.length === 0 && e.ausenciasPendientes === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tipos.map(([tipo, dias]) => (
        <Chip key={tipo} tono="neutral">
          {TIPO_LABEL[tipo]} · {plural(dias, 'día', 'días')}
        </Chip>
      ))}
      {e.ausenciasPendientes > 0 && <Chip tono="amber">{plural(e.ausenciasPendientes, 'pendiente', 'pendientes')}</Chip>}
    </div>
  );
}

function CeldaAlertas({ e }: { e: Empleado }) {
  if (e.diasSinSalida === 0 && e.fueraDeRango === 0) return <Chip tono="green">Sin alertas</Chip>;
  return (
    <div className="flex flex-wrap gap-1">
      {e.diasSinSalida > 0 && <Chip tono="amber">{plural(e.diasSinSalida, 'sin salida', 'sin salida')}</Chip>}
      {e.fueraDeRango > 0 && <Chip tono="rose">{plural(e.fueraDeRango, 'fuera de rango', 'fuera de rango')}</Chip>}
    </div>
  );
}

function Detalle({ e }: { e: Empleado }) {
  if (e.dias.length === 0 && e.ausencias.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin registros en este periodo.</p>;
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Marcaciones</p>
        {e.dias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin marcaciones.</p>
        ) : (
          <ul className="divide-y divide-border/50 rounded-lg border border-border/60">
            {e.dias.map((d) => (
              <li key={d.fecha} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm">
                <span className="w-24 font-medium">{fecha(d.fecha)}</span>
                <span className="w-32 tabular-nums text-muted-foreground">
                  {d.horaEntrada ?? '—'} → {d.horaSalida ?? '—'}
                </span>
                <span className="w-14 tabular-nums">{d.horaSalida ? `${d.horas} h` : ''}</span>
                <span className="flex flex-wrap gap-1">
                  {d.sinSalida && <Chip tono="amber">Sin salida</Chip>}
                  {d.dentroRango === false && <Chip tono="rose">Fuera de la clínica</Chip>}
                  {!d.horaSalida && !d.sinSalida && <Chip tono="neutral">En curso</Chip>}
                </span>
                {d.observacion && <span className="basis-full text-xs text-muted-foreground">{d.observacion}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ausencias</p>
        {e.ausencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin ausencias.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {e.ausencias.map((a, i) => (
              <li key={i} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{TIPO_LABEL[a.tipo]}</span>
                  <span className={`text-xs font-medium ${ESTADO_COLOR[a.estado]}`}>{ESTADO_LABEL[a.estado]}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.desde === a.hasta ? fecha(a.desde) : `${fecha(a.desde)} – ${fecha(a.hasta)}`} · {plural(a.dias, 'día', 'días')} en el periodo
                </p>
                {a.motivo && <p className="mt-1 text-xs">“{a.motivo}”</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ReportePersonal({ datos }: { datos: Personal }) {
  const [abiertos, setAbiertos] = useState<Set<number>>(new Set());
  const { resumen, porEmpleado } = datos;

  function alternar(id: number) {
    setAbiertos((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Resumen label="Horas trabajadas" valor={`${resumen.horasTotales} h`} />
        <Resumen label="Días trabajados" valor={String(resumen.diasTrabajados)} detalle="Suma de todo el personal" />
        <Resumen label="Ausencias aprobadas" valor={plural(resumen.diasAusencia, 'día', 'días')} />
        <Resumen
          label="Alertas"
          valor={String(resumen.alertas)}
          detalle={resumen.alertas ? 'Sin salida o fuera de la clínica' : 'Todo en orden'}
          alerta={resumen.alertas > 0}
        />
      </div>

      {porEmpleado.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin registros en este periodo.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Empleado</th>
                <th className="px-3 py-2 text-right font-medium">Días</th>
                <th className="px-3 py-2 text-right font-medium">Horas</th>
                <th className="px-3 py-2 text-right font-medium">Prom./día</th>
                <th className="px-3 py-2 font-medium">Ausencias</th>
                <th className="px-3 py-2 font-medium">Alertas</th>
              </tr>
            </thead>
            <tbody>
              {porEmpleado.map((e) => {
                const abierto = abiertos.has(e.usuarioId);
                return (
                  <Fragment key={e.usuarioId}>
                    <tr
                      onClick={() => alternar(e.usuarioId)}
                      className={`cursor-pointer border-b border-border/50 hover:bg-accent-soft/40 ${abierto ? 'bg-accent-soft/40' : ''}`}
                    >
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          aria-expanded={abierto}
                          aria-label={`${abierto ? 'Ocultar' : 'Ver'} detalle de ${e.usuario}`}
                          className="flex items-center gap-2 font-medium"
                        >
                          <IconChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${abierto ? '' : '-rotate-90'}`} />
                          {e.usuario}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{e.diasTrabajados}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{e.horasTrabajadas}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{e.promedioHorasDia || '—'}</td>
                      <td className="px-3 py-2.5">
                        <CeldaAusencias e={e} />
                      </td>
                      <td className="px-3 py-2.5">
                        <CeldaAlertas e={e} />
                      </td>
                    </tr>
                    {abierto && (
                      <tr className="border-b border-border/50 last:border-0">
                        <td colSpan={6} className="bg-background/40 px-4 py-4">
                          <Detalle e={e} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
