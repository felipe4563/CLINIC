'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ArchivoPrivado({ ruta, alt }: { ruta: string; alt: string }) {
  const [archivo, setArchivo] = useState<{ url: string; tipo: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let url: string | null = null;
    let vigente = true;
    api
      .obtenerArchivoPrivado(ruta)
      .then((a: { url: string; tipo: string }) => {
        url = a.url;
        if (vigente) setArchivo(a);
        else URL.revokeObjectURL(a.url);
      })
      .catch((e: unknown) => vigente && setError(e instanceof Error ? e.message : 'No se pudo abrir el archivo'));
    return () => {
      vigente = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [ruta]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!archivo) return <p className="text-sm text-muted-foreground">Cargando archivo…</p>;
  if (archivo.tipo === 'application/pdf') {
    return (
      <div className="flex flex-col gap-2">
        <iframe src={archivo.url} title={alt} className="h-[60dvh] w-full rounded-lg border border-border" />
        <a href={archivo.url} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">Abrir PDF en otra pestaña</a>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={archivo.url} alt={alt} className="max-h-[60dvh] w-full rounded-lg border border-border object-contain" />;
}
