'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { api } from '@/lib/api';
import ArchivoPrivado from '@/app/agenda/ArchivoPrivado';

type Foto = { archivo: string; nota: string | null };
const MAX_FOTOS = 10;
const LADO_MAX = 1600;

// Reduce la foto en el navegador (las del celular pesan varios MB) y la pasa
// a JPEG: el servidor solo acepta JPEG/PNG de hasta 5 MB y el PDF no engorda.
async function reducir(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.82)
  );
}

export default function FotosHistoria<H>({ historiaId, fotos, onCambio }: { historiaId: number; fotos: Foto[]; onCambio: (h: H) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});

  async function elegir(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files || []);
    e.target.value = '';
    if (!archivos.length) return;
    setError('');
    setSubiendo(true);
    try {
      let ultima: H | null = null;
      for (const archivo of archivos.slice(0, MAX_FOTOS - fotos.length)) {
        ultima = await api.subirFotoHistoria(historiaId, await reducir(archivo), '');
      }
      if (ultima) onCambio(ultima);
      if (archivos.length > MAX_FOTOS - fotos.length) setError(`Solo se admiten ${MAX_FOTOS} fotos por evaluación`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setSubiendo(false);
    }
  }

  async function guardarNota(archivo: string) {
    const nota = notas[archivo];
    if (nota === undefined) return;
    try {
      onCambio(await api.cambiarNotaFoto(historiaId, archivo, nota));
      setNotas((n) => {
        const resto = { ...n };
        delete resto[archivo];
        return resto;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la nota');
    }
  }

  async function borrar(archivo: string) {
    if (!window.confirm('¿Borrar esta foto?')) return;
    try {
      onCambio(await api.borrarFotoHistoria(historiaId, archivo));
      if (abierta === archivo) setAbierta(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar la foto');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} type="file" accept="image/*" multiple onChange={elegir} className="hidden" />
        {fotos.length < MAX_FOTOS && (
          <button type="button" disabled={subiendo} onClick={() => input.current?.click()} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-50">
            {subiendo ? 'Subiendo…' : '+ Agregar fotos'}
          </button>
        )}
        <span className="text-xs text-muted-foreground">{fotos.length}/{MAX_FOTOS} · se guardan de forma privada</span>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {fotos.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((f) => (
            <li key={f.archivo} className="rounded border border-border p-2">
              <button type="button" onClick={() => setAbierta(abierta === f.archivo ? null : f.archivo)} className="block w-full" aria-label="Ver foto en grande">
                <ArchivoPrivado ruta={`/staff/historias/${historiaId}/fotos/${encodeURIComponent(f.archivo)}`} alt={f.nota || 'Foto de la paciente'} />
              </button>
              <input
                value={notas[f.archivo] ?? f.nota ?? ''}
                onChange={(e) => setNotas((n) => ({ ...n, [f.archivo]: e.target.value }))}
                onBlur={() => guardarNota(f.archivo)}
                placeholder="Nota (ej. frente, antes)"
                aria-label="Nota de la foto"
                maxLength={120}
                className="mt-2 block w-full rounded border border-border px-2 py-1 text-xs"
              />
              <button type="button" onClick={() => borrar(f.archivo)} className="mt-1 text-xs text-danger hover:underline">Borrar</button>
            </li>
          ))}
        </ul>
      )}
      {abierta && (
        <div className="mt-3 rounded border border-border p-2">
          <ArchivoPrivado ruta={`/staff/historias/${historiaId}/fotos/${encodeURIComponent(abierta)}`} alt="Foto en grande" />
          <button type="button" onClick={() => setAbierta(null)} className="mt-2 text-xs hover:underline">Cerrar</button>
        </div>
      )}
    </div>
  );
}
