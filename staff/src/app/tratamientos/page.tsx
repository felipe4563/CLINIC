'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

// Tratamientos: al entrar se ven los pacientes con lo último que se hicieron (sin
// tener que buscar); las notas de sesión siguen en su propia pestaña.

type NotaClinica = {
  id: number;
  fecha: string;
  hora: string | null;
  titulo: string;
  notas: string;
  Paciente: { id: number; nombre_completo: string };
  Profesional: { nombre: string } | null;
};

type ResumenCita = { fecha: string; hora: string | null; servicio: string | null; profesional: string | null; estado: string };

type PacienteResumen = {
  id: number;
  nombre_completo: string;
  codigo_paciente: string;
  telefono: string;
  ultimo_tratamiento: ResumenCita | null;
  proxima_cita: ResumenCita | null;
  notas: number;
  ultima_nota: string | null;
  tiene_historia: boolean;
};

type Pestana = 'pacientes' | 'notas';
type Paginado = { total: number; pagina: number; totalPaginas: number };

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

function cuando(c: ResumenCita) {
  return `${fmtFecha(c.fecha)}${c.hora ? ` ${c.hora.slice(0, 5)}` : ''}`;
}

export default function TratamientosPage() {
  return (
    <Suspense>
      <Tratamientos />
    </Suspense>
  );
}

function Tratamientos() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: Pestana = searchParams.get('tab') === 'notas' ? 'notas' : 'pacientes';

  const [q, setQ] = useState('');
  const [pacientes, setPacientes] = useState<PacienteResumen[]>([]);
  const [notas, setNotas] = useState<NotaClinica[]>([]);
  const [paginado, setPaginado] = useState<Paginado>({ total: 0, pagina: 1, totalPaginas: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function cambiarTab(nueva: Pestana) {
    const params = new URLSearchParams(searchParams.toString());
    if (nueva === 'pacientes') params.delete('tab');
    else params.set('tab', nueva);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const buscar = useCallback(
    (texto: string, paginaDestino = 1) =>
      (tab === 'pacientes' ? api.getTratamientosPorPaciente(texto, paginaDestino) : api.getTratamientos(texto, paginaDestino))
        .then((res: Paginado & { pacientes?: PacienteResumen[]; notas?: NotaClinica[] }) => {
          if (tab === 'pacientes') setPacientes(res.pacientes || []);
          else setNotas(res.notas || []);
          setPaginado({ total: res.total, pagina: res.pagina, totalPaginas: res.totalPaginas });
          setError(null);
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error al cargar los tratamientos'))
        .finally(() => setLoading(false)),
    [tab],
  );

  useEffect(() => {
    const id = setTimeout(() => void buscar(q), 300);
    return () => clearTimeout(id);
  }, [q, buscar]);

  const lista = tab === 'pacientes' ? pacientes : notas;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Tratamientos</h1>
      <p className="mb-4 text-sm text-muted-foreground">Lo que se hizo cada paciente, su próxima cita y su historial clínico.</p>

      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {(
          [
            ['pacientes', 'Pacientes'],
            ['notas', 'Últimas notas'],
          ] as const
        ).map(([clave, texto]) => (
          <button
            key={clave}
            role="tab"
            aria-selected={tab === clave}
            onClick={() => cambiarTab(clave)}
            className={`px-3 py-2 text-sm font-medium ${tab === clave ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
          >
            {texto}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder={tab === 'pacientes' ? 'Buscar paciente por nombre, código o teléfono…' : 'Buscar notas por nombre de paciente…'}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-full max-w-md rounded border border-border px-3 py-2 text-sm"
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {tab === 'pacientes' ? (
        <div className="grid items-start gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {pacientes.map((p) => (
            <TarjetaPaciente key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notas.map((n) => (
            <div key={n.id} className="rounded-lg border border-border bg-panel p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{n.Paciente.nombre_completo}</span>
                <span className="text-xs text-muted-foreground">
                  {fmtFecha(n.fecha)}
                  {n.hora ? ` ${n.hora.slice(0, 5)}` : ''}
                  {n.Profesional ? ` · ${n.Profesional.nombre}` : ''}
                </span>
              </div>
              <p className="mt-1.5 font-medium">{n.titulo}</p>
              <p className="mt-0.5 whitespace-pre-wrap text-foreground/80">{n.notas}</p>
              <Link
                href={`/pacientes/${n.Paciente.id}#historial-clinico`}
                className="mt-2 inline-flex w-fit items-center gap-1 rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent-soft hover:text-accent"
              >
                Ver ficha del paciente →
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && lista.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          {q
            ? 'Sin resultados.'
            : tab === 'pacientes'
              ? 'Todavía no hay pacientes registrados.'
              : 'Sin notas clínicas todavía. Se agregan desde la ficha de cada paciente.'}
        </p>
      )}

      {!loading && paginado.totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {paginado.total} {tab === 'pacientes' ? `paciente${paginado.total === 1 ? '' : 's'}` : `nota${paginado.total === 1 ? '' : 's'}`} · página {paginado.pagina} de{' '}
            {paginado.totalPaginas}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => buscar(q, paginado.pagina - 1)}
              disabled={paginado.pagina <= 1}
              className="rounded border border-border px-3 py-1.5 font-medium hover:bg-accent-soft disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => buscar(q, paginado.pagina + 1)}
              disabled={paginado.pagina >= paginado.totalPaginas}
              className="rounded border border-border px-3 py-1.5 font-medium hover:bg-accent-soft disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TarjetaPaciente({ p }: { p: PacienteResumen }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-panel p-4 text-sm shadow-sm">
      <div>
        <p className="font-medium">{p.nombre_completo}</p>
        <p className="text-xs text-muted-foreground">
          {p.codigo_paciente} · {p.telefono}
        </p>
      </div>

      <div className="flex flex-col gap-1 text-xs">
        <p>
          <span className="text-muted-foreground">Último tratamiento: </span>
          {p.ultimo_tratamiento ? (
            <>
              <span className="font-medium">{p.ultimo_tratamiento.servicio || 'Tratamiento'}</span> · {fmtFecha(p.ultimo_tratamiento.fecha)}
              {p.ultimo_tratamiento.profesional ? ` · ${p.ultimo_tratamiento.profesional}` : ''}
            </>
          ) : (
            <span className="text-muted-foreground">todavía ninguno</span>
          )}
        </p>
        {p.proxima_cita && (
          <p>
            <span className="text-muted-foreground">Próxima cita: </span>
            <span className="font-medium">{p.proxima_cita.servicio || 'Cita'}</span> · {cuando(p.proxima_cita)}
            {p.proxima_cita.estado === 'pendiente_pago' ? <span className="text-stat-amber"> · pendiente de pago</span> : ''}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 ${p.tiene_historia ? 'bg-stat-green/10 text-stat-green' : 'bg-accent-soft text-muted-foreground'}`}>
          {p.tiene_historia ? '✓ Historia clínica' : 'Sin historia clínica'}
        </span>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-muted-foreground">
          {p.notas} nota{p.notas === 1 ? '' : 's'}
          {p.ultima_nota ? ` · última ${fmtFecha(p.ultima_nota)}` : ''}
        </span>
      </div>

      <Link
        href={`/pacientes/${p.id}#historial-clinico`}
        className="mt-1 inline-flex w-fit items-center gap-1 rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent-soft hover:text-accent"
      >
        Abrir ficha →
      </Link>
    </div>
  );
}
