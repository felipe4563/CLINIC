'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { IconUserPlus, IconX } from '@/components/icons';

type Paciente = {
  id: number;
  codigo_paciente: string;
  nombre_completo: string;
  telefono: string;
  carnet_identidad: string;
};

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

const VACIO = {
  nombre_completo: '',
  telefono: '',
  carnet_identidad: '',
  carnet_complemento: '',
  carnet_expedido: 'CB',
  fecha_nacimiento: '',
};

export default function PacientesPage() {
  const [q, setQ] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const buscar = useCallback(async (texto: string, paginaBuscar: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPacientes(texto, paginaBuscar);
      setPacientes(res.pacientes);
      setPagina(res.pagina);
      setTotalPaginas(res.totalPaginas);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => buscar(q, 1), 300);
    return () => clearTimeout(id);
  }, [q, buscar]);

  function abrirForm() {
    setNuevo(VACIO);
    setErrorForm(null);
    setFormAbierto(true);
  }

  async function crearPaciente(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErrorForm(null);
    try {
      await api.crearPaciente({
        ...nuevo,
        carnet_complemento: nuevo.carnet_complemento || null,
        fecha_nacimiento: nuevo.fecha_nacimiento || null,
      });
      setFormAbierto(false);
      buscar(q, 1);
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo crear el paciente');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Pacientes</h1>
        <button
          onClick={() => (formAbierto ? setFormAbierto(false) : abrirForm())}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent-soft"
        >
          {formAbierto ? <IconX className="h-4 w-4" /> : <IconUserPlus className="h-4 w-4" />}
          {formAbierto ? 'Cancelar' : 'Nuevo paciente'}
        </button>
      </div>

      {formAbierto && (
        <form
          onSubmit={crearPaciente}
          className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-border bg-panel p-4 text-sm sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="block sm:col-span-2 lg:col-span-1">
            Nombre completo
            <input
              required
              value={nuevo.nombre_completo}
              onChange={(e) => setNuevo({ ...nuevo, nombre_completo: e.target.value })}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block">
            Teléfono
            <input
              required
              value={nuevo.telefono}
              onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block">
            Fecha de nacimiento
            <input
              type="date"
              value={nuevo.fecha_nacimiento}
              onChange={(e) => setNuevo({ ...nuevo, fecha_nacimiento: e.target.value })}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block">
            Carnet
            <input
              required
              value={nuevo.carnet_identidad}
              onChange={(e) => setNuevo({ ...nuevo, carnet_identidad: e.target.value })}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block">
            Complemento
            <input
              value={nuevo.carnet_complemento}
              onChange={(e) => setNuevo({ ...nuevo, carnet_complemento: e.target.value })}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>
          <label className="block">
            Expedido
            <input
              required
              value={nuevo.carnet_expedido}
              onChange={(e) => setNuevo({ ...nuevo, carnet_expedido: e.target.value })}
              className="mt-1 w-full rounded border border-border px-2.5 py-1.5"
            />
          </label>

          {errorForm && <p className="text-danger sm:col-span-2 lg:col-span-3">{errorForm}</p>}

          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded bg-accent px-4 py-1.5 font-medium text-accent-foreground disabled:opacity-60"
            >
              {guardando ? 'Creando…' : 'Crear paciente'}
            </button>
          </div>
        </form>
      )}

      <input
        type="search"
        placeholder="Buscar por nombre, teléfono, carnet o código…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-full max-w-md rounded border border-border px-3 py-2 text-sm"
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-foreground/70">Cargando…</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pacientes.map((p) => (
          <Link
            key={p.id}
            href={`/pacientes/${p.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-panel p-3 text-sm transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              {iniciales(p.nombre_completo)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{p.nombre_completo}</p>
              <p className="truncate text-xs text-foreground/70">{p.telefono}</p>
              <p className="truncate text-xs text-foreground/50">
                {p.carnet_identidad} · {p.codigo_paciente}
              </p>
            </div>
          </Link>
        ))}
        {!loading && pacientes.length === 0 && (
          <p className="col-span-full text-sm text-foreground/70">Sin resultados.</p>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {total} paciente{total === 1 ? '' : 's'} · página {pagina} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => buscar(q, pagina - 1)}
              disabled={pagina <= 1}
              className="rounded border border-border px-3 py-1.5 font-medium hover:bg-accent-soft disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => buscar(q, pagina + 1)}
              disabled={pagina >= totalPaginas}
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
