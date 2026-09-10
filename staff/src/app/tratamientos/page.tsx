'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type NotaClinica = {
  id: number;
  fecha: string;
  hora: string | null;
  titulo: string;
  notas: string;
  Paciente: { id: number; nombre_completo: string };
  Profesional: { nombre: string } | null;
};

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

export default function TratamientosPage() {
  const [q, setQ] = useState('');
  const [notas, setNotas] = useState<NotaClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async (texto: string) => {
    setLoading(true);
    setError(null);
    try {
      setNotas(await api.getTratamientos(texto));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial clínico');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscar('');
  }, [buscar]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Tratamientos</h1>
      <p className="mb-4 text-sm text-muted-foreground">Historial clínico: notas y evolución por paciente.</p>

      <input
        type="search"
        placeholder="Buscar por nombre de paciente…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && buscar(q)}
        className="mb-4 w-full max-w-md rounded border border-border px-3 py-2 text-sm"
      />

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      <div className="flex flex-col gap-2">
        {notas.map((n) => (
          <div key={n.id} className="rounded-lg border border-border bg-panel p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/pacientes/${n.Paciente.id}`} className="font-medium hover:text-accent hover:underline">
                {n.Paciente.nombre_completo}
              </Link>
              <span className="text-xs text-muted-foreground">
                {fmtFecha(n.fecha)}
                {n.hora ? ` ${n.hora.slice(0, 5)}` : ''}
                {n.Profesional ? ` · ${n.Profesional.nombre}` : ''}
              </span>
            </div>
            <p className="mt-1.5 font-medium">{n.titulo}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-foreground/80">{n.notas}</p>
          </div>
        ))}
        {!loading && notas.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">Sin notas clínicas todavía. Se agregan desde la ficha de cada paciente.</p>
        )}
      </div>
    </div>
  );
}
