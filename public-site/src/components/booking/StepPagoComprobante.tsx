'use client';
import { useEffect, useState, type ChangeEvent } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { estadoHttp, mensajeError } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MENSAJE_FORMATO = 'Sube una imagen (JPG, PNG o WebP) o un PDF de hasta 5 MB';

export default function StepPagoComprobante() {
  const { config, servicio, profesionalId, servicioId, fecha, horaInicio, porcentaje, setHoraInicio, setCitaId, setPago, setStep } = useBooking();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [horarioOcupado, setHorarioOcupado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const precio = servicio?.precio ? Number(servicio.precio) : 0;
  const monto = Math.round(precio * (porcentaje / 100) * 100) / 100;
  const qrSrc = config?.qr_fijo_url ? `${API_URL}${config.qr_fijo_url}` : null;

  useEffect(() => {
    if (!archivo || !archivo.type.startsWith('image/')) return;
    const url = URL.createObjectURL(archivo);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVistaPrevia(url);
    return () => {
      URL.revokeObjectURL(url);
      setVistaPrevia(null);
    };
  }, [archivo]);

  function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    setError('');
    const elegido = e.target.files?.[0] ?? null;
    if (elegido && (!TIPOS.includes(elegido.type) || elegido.size > MAX_BYTES)) {
      setArchivo(null);
      setError(MENSAJE_FORMATO);
      e.target.value = '';
      return;
    }
    setArchivo(elegido);
  }

  async function enviar() {
    if (!archivo || enviando) return;
    setEnviando(true);
    setError('');
    try {
      const { cita, pago } = await api.crearCitaConComprobante(
        { profesionalId, servicioId, fecha, horaInicio, porcentajePago: porcentaje },
        archivo,
      );
      setCitaId(cita.id);
      setPago(pago);
      setStep('confirmada');
    } catch (e: unknown) {
      setHorarioOcupado(estadoHttp(e) === 409);
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  function elegirOtroHorario() {
    setHoraInicio(null);
    setStep('horario');
  }

  return (
    <div>
      <h2 className="font-serif text-[clamp(30px,3.4vw,42px)] font-light leading-tight text-espresso">Paga Bs {monto} con QR</h2>
      <p className="mt-1 text-[15px] text-tan">Escanea el QR desde la app de tu banco y sube el comprobante. Así queda asegurado tu horario.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col items-center rounded-3xl bg-white p-6 text-center">
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrSrc} alt="QR de pago de la clínica" className="w-64 max-w-full rounded-2xl border border-manhattan/50" />
          ) : (
            <p className="text-sm text-red-700">La clínica todavía no cargó su QR. Escríbenos por WhatsApp para reservar.</p>
          )}
          {config?.qr_fijo_datos && <p className="mt-3 text-sm text-tan">{config.qr_fijo_datos}</p>}
          <p className="mt-4 font-serif text-3xl text-espresso">Bs {monto}</p>
        </div>

        <div className="flex flex-col rounded-3xl bg-white p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-tan">Comprobante de pago</p>
          <label className="mt-3 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-manhattan bg-cream/50 p-6 text-center hover:border-espresso">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tan" aria-hidden="true">
              <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
            </svg>
            <span className="mt-3 text-[15px] text-espresso">{archivo ? archivo.name : 'Toca para subir la foto o el PDF'}</span>
            <span className="mt-1 text-xs text-tan">JPG, PNG, WebP o PDF · hasta 5 MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={elegirArchivo} className="sr-only" />
          </label>
          {vistaPrevia && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vistaPrevia} alt="Vista previa del comprobante" className="mx-auto mt-4 max-h-40 max-w-full rounded-xl border border-manhattan/50" />
          )}

          {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          {horarioOcupado ? (
            <button onClick={elegirOtroHorario} className="mt-5 min-h-12 w-full rounded-full bg-espresso px-6 text-[15px] text-cream">
              Elegir otro horario
            </button>
          ) : (
            <button
              onClick={enviar}
              disabled={!archivo || !qrSrc || enviando}
              className="mt-5 min-h-12 w-full rounded-full bg-espresso px-6 text-[15px] text-cream hover:bg-espresso-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? 'Enviando…' : 'Enviar reserva'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
