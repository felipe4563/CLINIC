'use client';

import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Web NFC (solo Chrome en Android, con HTTPS o localhost).
type LecturaNFC = { serialNumber: string };
type NDEFReaderLike = {
  scan: (opciones?: { signal?: AbortSignal }) => Promise<void>;
  onreading: ((e: LecturaNFC) => void) | null;
  onreadingerror: (() => void) | null;
};

function nfcDisponible() {
  return 'NDEFReader' in window;
}
const sinSuscripcion = () => () => {};

// Lee una tarjeta con el lector USB (escribe el número y Enter en el campo
// enfocado) o con el NFC del celular.
export default function LectorTarjeta({ onLeido, ocupado = false }: { onLeido: (uid: string) => void; ocupado?: boolean }) {
  const [valor, setValor] = useState('');
  const nfc = useSyncExternalStore(sinSuscripcion, nfcDisponible, () => false);
  const [escuchandoNfc, setEscuchandoNfc] = useState(false);
  const [errorNfc, setErrorNfc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onLeidoRef = useRef(onLeido);
  useEffect(() => {
    onLeidoRef.current = onLeido;
  }, [onLeido]);

  useEffect(() => {
    inputRef.current?.focus();
    return () => abortRef.current?.abort();
  }, []);

  function enviar(e: FormEvent) {
    e.preventDefault();
    const uid = valor.trim();
    if (!uid) return;
    setValor('');
    onLeido(uid);
  }

  async function leerConNfc() {
    setErrorNfc(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const Lector = (window as unknown as { NDEFReader: new () => NDEFReaderLike }).NDEFReader;
      const lector = new Lector();
      lector.onreading = (e) => {
        controller.abort();
        setEscuchandoNfc(false);
        if (e.serialNumber) onLeidoRef.current(e.serialNumber);
        else setErrorNfc('No se pudo leer el número de la tarjeta.');
      };
      lector.onreadingerror = () => setErrorNfc('No se pudo leer la tarjeta. Vuelve a acercarla.');
      await lector.scan({ signal: controller.signal });
      setEscuchandoNfc(true);
    } catch (err) {
      setEscuchandoNfc(false);
      setErrorNfc(err instanceof Error && err.name === 'NotAllowedError' ? 'Permite el uso de NFC en el navegador.' : 'No se pudo activar el NFC. Revisa que esté encendido.');
    }
  }

  function cancelarNfc() {
    abortRef.current?.abort();
    setEscuchandoNfc(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={enviar} className="flex gap-2">
        <input
          ref={inputRef}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Pasa la tarjeta por el lector…"
          aria-label="Número de tarjeta"
          autoComplete="off"
          disabled={ocupado}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button type="submit" disabled={ocupado || !valor.trim()} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent-soft disabled:opacity-50">
          Buscar
        </button>
      </form>
      {nfc &&
        (escuchandoNfc ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-accent bg-accent-soft px-3 py-2 text-sm">
            <span className="animate-pulse">Acerca la tarjeta a la parte de atrás del celular…</span>
            <button type="button" onClick={cancelarNfc} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
          </div>
        ) : (
          <button type="button" onClick={leerConNfc} disabled={ocupado} className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
            Leer con el celular (NFC)
          </button>
        ))}
      {errorNfc && <p className="text-xs text-danger">{errorNfc}</p>}
    </div>
  );
}
